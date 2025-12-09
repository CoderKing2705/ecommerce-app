import { pool } from '../config/database.js';

// Get tracking details for an order
export const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Check if order belongs to user
        const orderCheck = await pool.query(
            'SELECT id, user_id FROM orders WHERE id = $1 AND user_id = $2',
            [orderId, userId]
        );

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get order details with tracking info
        const orderQuery = await pool.query(`
            SELECT 
                o.*,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'product_name', oi.product_name,
                        'quantity', oi.quantity,
                        'price', oi.total_price
                    )
                ) as items,
                sa.first_name as shipping_first_name,
                sa.last_name as shipping_last_name,
                sa.address_line1 as shipping_address_line1,
                sa.address_line2 as shipping_address_line2,
                sa.city as shipping_city,
                sa.state as shipping_state,
                sa.zip_code as shipping_zip_code,
                sc.name as carrier_name,
                sc.tracking_url_template
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
            LEFT JOIN shipping_carriers sc ON o.carrier = sc.name
            WHERE o.id = $1
            GROUP BY o.id, sa.id, sc.id
        `, [orderId]);

        const order = orderQuery.rows[0];

        // Get tracking history
        const trackingHistory = await pool.query(
            `SELECT 
                id,
                status,
                location,
                description,
                event_time,
                TO_CHAR(event_time, 'MM/DD/YYYY HH12:MI AM') as formatted_time,
                CASE 
                    WHEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - event_time) = 0 
                    THEN 'Today'
                    WHEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - event_time) = 1 
                    THEN 'Yesterday'
                    ELSE TO_CHAR(event_time, 'MM/DD/YYYY')
                END as display_date
             FROM order_tracking_history 
             WHERE order_id = $1 
             ORDER BY event_time ASC`,
            [orderId]
        );

        // Get delivery attempts
        const deliveryAttempts = await pool.query(
            `SELECT 
                id,
                attempt_number,
                attempted_at,
                status,
                notes,
                delivery_person_contact,
                TO_CHAR(attempted_at, 'MM/DD/YYYY HH12:MI AM') as formatted_time
             FROM delivery_attempts 
             WHERE order_id = $1 
             ORDER BY attempted_at DESC`,
            [orderId]
        );

        // Calculate delivery timeline
        const timeline = calculateDeliveryTimeline(order, trackingHistory.rows);

        // Generate tracking URL if available
        let trackingUrl = null;
        if (order.tracking_number && order.tracking_url_template) {
            trackingUrl = order.tracking_url_template.replace('{tracking_number}', order.tracking_number);
        }

        res.json({
            success: true,
            order: {
                id: order.id,
                order_number: order.order_number,
                status: order.status,
                total_amount: order.total_amount,
                created_at: order.created_at,
                estimated_delivery: order.estimated_delivery,
                actual_delivery: order.actual_delivery,
                tracking_number: order.tracking_number,
                carrier: order.carrier_name || order.carrier,
                tracking_url: trackingUrl,
                delivery_notes: order.delivery_notes
            },
            shipping_address: {
                name: `${order.shipping_first_name} ${order.shipping_last_name}`,
                address: order.shipping_address_line1,
                address2: order.shipping_address_line2,
                city: order.shipping_city,
                state: order.shipping_state,
                zip: order.shipping_zip_code
            },
            tracking_history: trackingHistory.rows,
            delivery_attempts: deliveryAttempts.rows,
            timeline: timeline,
            items: order.items || []
        });

    } catch (error) {
        console.error('Error fetching order tracking:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add tracking event (for admin)
export const addTrackingEvent = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { orderId } = req.params;
        const { status, location, description } = req.body;

        // Verify admin
        if (req.user.role !== 'ADMIN') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if order exists
        const orderCheck = await client.query(
            'SELECT id, status FROM orders WHERE id = $1',
            [orderId]
        );

        if (orderCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Order not found' });
        }

        // Add tracking event
        const trackingEvent = await client.query(
            `INSERT INTO order_tracking_history 
             (order_id, status, location, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [orderId, status, location || null, description || null]
        );

        // Update order status if provided
        if (status) {
            await client.query(
                'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [status, orderId]
            );

            // If delivered, set actual delivery date
            if (status === 'delivered') {
                await client.query(
                    'UPDATE orders SET actual_delivery = CURRENT_TIMESTAMP WHERE id = $1',
                    [orderId]
                );
            }
        }

        await client.query('COMMIT');

        // Emit real-time update (if using WebSockets)
        // socket.emit('order-updated', { orderId, status });

        res.json({
            success: true,
            tracking_event: trackingEvent.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// Update tracking info (admin)
export const updateTrackingInfo = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { orderId } = req.params;
        const { tracking_number, carrier, estimated_delivery, delivery_notes } = req.body;

        // Verify admin
        if (req.user.role !== 'ADMIN') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update order tracking info
        const order = await client.query(
            `UPDATE orders 
             SET tracking_number = COALESCE($1, tracking_number),
                 carrier = COALESCE($2, carrier),
                 estimated_delivery = COALESCE($3, estimated_delivery),
                 delivery_notes = COALESCE($4, delivery_notes),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [tracking_number || null, carrier || null,
            estimated_delivery || null, delivery_notes || null, orderId]
        );

        // Add tracking event for tracking number update
        if (tracking_number) {
            await client.query(
                `INSERT INTO order_tracking_history 
                 (order_id, status, description)
                 VALUES ($1, 'shipped', 'Tracking number assigned: ${tracking_number}')
                 RETURNING *`,
                [orderId]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            order: order.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// Get estimated delivery date
export const getEstimatedDelivery = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Check if order belongs to user
        const orderCheck = await pool.query(
            'SELECT id, estimated_delivery, created_at FROM orders WHERE id = $1 AND user_id = $2',
            [orderId, userId]
        );

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderCheck.rows[0];

        // Calculate estimated delivery if not set
        let estimatedDelivery = order.estimated_delivery;
        if (!estimatedDelivery) {
            const createdDate = new Date(order.created_at);
            estimatedDelivery = new Date(createdDate.setDate(createdDate.getDate() + 7)); // Default 7 days
        }

        // Calculate delivery window
        const deliveryWindow = {
            from: new Date(estimatedDelivery),
            to: new Date(new Date(estimatedDelivery).setDate(new Date(estimatedDelivery).getDate() + 2))
        };

        res.json({
            success: true,
            estimated_delivery: estimatedDelivery,
            delivery_window: deliveryWindow,
            is_delayed: new Date() > new Date(deliveryWindow.to),
            days_remaining: Math.ceil((new Date(estimatedDelivery) - new Date()) / (1000 * 60 * 60 * 24))
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to calculate delivery timeline
function calculateDeliveryTimeline(order, trackingHistory) {
    const timeline = [];
    const today = new Date();
    const orderDate = new Date(order.created_at);

    // Order placed
    timeline.push({
        id: 1,
        title: 'Order Placed',
        description: 'Your order has been received',
        date: order.created_at,
        completed: true,
        active: false,
        icon: '📦'
    });

    // Order confirmed (immediate if COD)
    timeline.push({
        id: 2,
        title: 'Order Confirmed',
        description: 'Payment confirmed and order processing',
        date: new Date(orderDate.getTime() + 30 * 60000), // 30 minutes later
        completed: true,
        active: false,
        icon: '✅'
    });

    // Check for processing status
    const processingEvent = trackingHistory.find(h => h.status === 'processing');
    timeline.push({
        id: 3,
        title: 'Processing',
        description: 'Preparing your items for shipment',
        date: processingEvent ? processingEvent.event_time :
            new Date(orderDate.getTime() + 24 * 60 * 60000), // 24 hours later
        completed: !!processingEvent || today > new Date(orderDate.getTime() + 24 * 60 * 60000),
        active: !processingEvent && today > orderDate,
        icon: '⚙️'
    });

    // Check for shipped status
    const shippedEvent = trackingHistory.find(h => h.status === 'shipped');
    timeline.push({
        id: 4,
        title: 'Shipped',
        description: order.tracking_number ?
            `Shipped via ${order.carrier} (${order.tracking_number})` :
            'Package is on its way',
        date: shippedEvent ? shippedEvent.event_time :
            order.tracking_number ? new Date(orderDate.getTime() + 48 * 60 * 60000) : null,
        completed: !!shippedEvent || !!order.tracking_number,
        active: !shippedEvent && !!processingEvent,
        icon: '🚚'
    });

    // Out for delivery
    const outForDeliveryEvent = trackingHistory.find(h => h.status === 'out_for_delivery');
    timeline.push({
        id: 5,
        title: 'Out for Delivery',
        description: 'Package is with delivery carrier',
        date: outForDeliveryEvent ? outForDeliveryEvent.event_time : null,
        completed: !!outForDeliveryEvent,
        active: !!shippedEvent && !outForDeliveryEvent,
        icon: '📦'
    });

    // Delivered
    const deliveredEvent = trackingHistory.find(h => h.status === 'delivered');
    timeline.push({
        id: 6,
        title: 'Delivered',
        description: order.actual_delivery ?
            `Delivered on ${new Date(order.actual_delivery).toLocaleDateString()}` :
            'Awaiting delivery',
        date: order.actual_delivery || order.estimated_delivery,
        completed: !!deliveredEvent || !!order.actual_delivery,
        active: !!outForDeliveryEvent && !deliveredEvent,
        icon: '🏠'
    });

    return timeline;
}

// Webhook for carrier tracking updates (for future integration)
export const handleCarrierWebhook = async (req, res) => {
    try {
        const { tracking_number, status, location, timestamp, carrier } = req.body;

        // Find order by tracking number
        const orderQuery = await pool.query(
            'SELECT id FROM orders WHERE tracking_number = $1',
            [tracking_number]
        );

        if (orderQuery.rows.length > 0) {
            const orderId = orderQuery.rows[0].id;

            // Add tracking event
            await pool.query(
                `INSERT INTO order_tracking_history 
                 (order_id, status, location, description)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, status, location, `Carrier update: ${status}`]
            );

            // Update order status if needed
            if (status === 'delivered') {
                await pool.query(
                    'UPDATE orders SET status = $1, actual_delivery = $2 WHERE id = $3',
                    ['delivered', timestamp, orderId]
                );
            }

            res.json({ success: true, message: 'Tracking updated' });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};