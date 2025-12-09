import express from 'express';
import { pool } from '../config/database.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all orders (Admin)
router.get('/', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || '';
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                o.*,
                u.name as customer_name,
                u.email as customer_email,
                COUNT(oi.id) as items_count,
                sa.first_name as shipping_first_name,
                sa.last_name as shipping_last_name,
                sa.phone as shipping_phone,
                o.tracking_number,
                o.carrier,
                o.estimated_delivery
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
        `;

        let countQuery = 'SELECT COUNT(*) FROM orders o LEFT JOIN users u ON o.user_id = u.id';
        let queryParams = [];
        let conditions = [];
        let paramCount = 1;

        if (status) {
            conditions.push(`o.status = $${paramCount}`);
            queryParams.push(status);
            paramCount++;
        }

        if (search) {
            conditions.push(`(
                o.order_number ILIKE $${paramCount} OR 
                u.name ILIKE $${paramCount} OR 
                u.email ILIKE $${paramCount} OR
                o.tracking_number ILIKE $${paramCount}
            )`);
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` GROUP BY o.id, u.id, sa.id ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);

        const ordersResult = await pool.query(query, queryParams);
        const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

        const totalOrders = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalOrders / limit);

        res.json({
            orders: ordersResult.rows,
            currentPage: page,
            totalPages,
            totalOrders
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get order details with tracking info
router.get('/:id/details', adminAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { id } = req.params;

        // Get order with customer info
        const orderResult = await client.query(`
            SELECT 
                o.*,
                u.name as customer_name,
                u.email as customer_email,
                sa.first_name as shipping_first_name,
                sa.last_name as shipping_last_name,
                sa.email as shipping_email,
                sa.phone as shipping_phone,
                sa.address_line1 as shipping_address_line1,
                sa.address_line2 as shipping_address_line2,
                sa.city as shipping_city,
                sa.state as shipping_state,
                sa.zip_code as shipping_zip_code,
                sa.country as shipping_country,
                ba.first_name as billing_first_name,
                ba.last_name as billing_last_name,
                ba.email as billing_email,
                ba.phone as billing_phone,
                ba.address_line1 as billing_address_line1,
                ba.address_line2 as billing_address_line2,
                ba.city as billing_city,
                ba.state as billing_state,
                ba.zip_code as billing_zip_code,
                ba.country as billing_country
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
            LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
            WHERE o.id = $1
        `, [id]);

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Get order items
        const itemsResult = await client.query(`
            SELECT 
                oi.*,
                p.image_url,
                p.stock_quantity,
                p.sku
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `, [id]);

        // Get status history
        const statusHistoryResult = await client.query(`
            SELECT 
                osh.*,
                u.name as updated_by_name
            FROM order_status_history osh
            LEFT JOIN users u ON osh.created_by = u.id
            WHERE osh.order_id = $1
            ORDER BY osh.created_at DESC
        `, [id]);

        // Get tracking history
        const trackingHistoryResult = await client.query(`
            SELECT 
                id,
                status,
                location,
                description,
                event_time,
                TO_CHAR(event_time, 'MM/DD/YYYY HH12:MI AM') as formatted_time
            FROM order_tracking_history 
            WHERE order_id = $1 
            ORDER BY event_time ASC
        `, [id]);

        // Get delivery attempts
        const deliveryAttemptsResult = await client.query(`
            SELECT 
                id,
                attempt_number,
                attempted_at,
                status,
                notes,
                delivery_person_contact,
                TO_CHAR(attempted_at, 'MM/DD/YYYY HH12:MI AM') as formatted_time
            FROM delivery_attempts 
            WHERE order_id = $1 
            ORDER BY attempted_at DESC
        `, [id]);

        // Get order notes
        const notesResult = await client.query(`
            SELECT 
                on.*,
                u.name as created_by_name
            FROM order_notes on
            LEFT JOIN users u ON on.created_by = u.id
            WHERE on.order_id = $1
            ORDER BY on.created_at DESC
        `, [id]);

        await client.query('COMMIT');

        // Calculate delivery timeline
        const timeline = calculateDeliveryTimeline(order, trackingHistoryResult.rows);

        // Generate tracking URL if available
        let trackingUrl = null;
        if (order.tracking_number && order.carrier) {
            const carrierTemplates = {
                'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
                'UPS': 'https://www.ups.com/track?tracknum={tracking_number}',
                'FedEx': 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
                'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}'
            };

            if (carrierTemplates[order.carrier]) {
                trackingUrl = carrierTemplates[order.carrier].replace('{tracking_number}', order.tracking_number);
            }
        }

        res.json({
            order: {
                ...order,
                tracking_url: trackingUrl,
                items: itemsResult.rows,
                status_history: statusHistoryResult.rows,
                tracking_history: trackingHistoryResult.rows,
                delivery_attempts: deliveryAttemptsResult.rows,
                notes: notesResult.rows,
                timeline: timeline
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    } finally {
        client.release();
    }
});

// Update order tracking info (Admin)
router.put('/:id/tracking', adminAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const {
            tracking_number,
            carrier,
            estimated_delivery,
            delivery_notes,
            status
        } = req.body;

        // Check if order exists
        const orderCheck = await client.query(
            'SELECT id FROM orders WHERE id = $1',
            [id]
        );

        if (orderCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order tracking info
        const updateQuery = `
            UPDATE orders 
            SET tracking_number = COALESCE($1, tracking_number),
                carrier = COALESCE($2, carrier),
                estimated_delivery = COALESCE($3, estimated_delivery),
                delivery_notes = COALESCE($4, delivery_notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;

        const result = await client.query(updateQuery, [
            tracking_number || null,
            carrier || null,
            estimated_delivery || null,
            delivery_notes || null,
            id
        ]);

        // Add tracking event if tracking number was added
        if (tracking_number) {
            await client.query(
                `INSERT INTO order_tracking_history 
                 (order_id, status, description)
                 VALUES ($1, 'shipped', 'Tracking number assigned: ${tracking_number} (Carrier: ${carrier || 'Unknown'})')`,
                [id]
            );
        }

        // Update status if provided
        if (status) {
            await client.query(
                'UPDATE orders SET status = $1 WHERE id = $2',
                [status, id]
            );

            await client.query(
                `INSERT INTO order_status_history 
                 (order_id, status, note, created_by)
                 VALUES ($1, $2, $3, $4)`,
                [id, status, 'Status updated via tracking update', req.user.id]
            );

            // Add to tracking history for major status changes
            if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
                const statusMessages = {
                    'shipped': 'Order has been shipped',
                    'out_for_delivery': 'Order is out for delivery',
                    'delivered': 'Order has been delivered'
                };

                await client.query(
                    `INSERT INTO order_tracking_history 
                     (order_id, status, description)
                     VALUES ($1, $2, $3)`,
                    [id, status, statusMessages[status] || `Status changed to ${status}`]
                );

                // Set actual delivery date if status is delivered
                if (status === 'delivered') {
                    await client.query(
                        'UPDATE orders SET actual_delivery = CURRENT_TIMESTAMP WHERE id = $1',
                        [id]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.json({
            message: 'Tracking information updated successfully',
            order: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating tracking info:', error);
        res.status(500).json({ error: 'Failed to update tracking information' });
    } finally {
        client.release();
    }
});

// Add tracking event (Admin)
router.post('/:id/tracking-events', adminAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { status, location, description } = req.body;

        // Check if order exists
        const orderCheck = await client.query(
            'SELECT id FROM orders WHERE id = $1',
            [id]
        );

        if (orderCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        // Add tracking event
        const result = await client.query(
            `INSERT INTO order_tracking_history 
             (order_id, status, location, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, status, location || null, description || null]
        );

        // Update order status if it's a major status
        if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
            await client.query(
                'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [status, id]
            );

            await client.query(
                `INSERT INTO order_status_history 
                 (order_id, status, note, created_by)
                 VALUES ($1, $2, $3, $4)`,
                [id, status, 'Status updated via tracking event', req.user.id]
            );

            // Set actual delivery date if delivered
            if (status === 'delivered') {
                await client.query(
                    'UPDATE orders SET actual_delivery = CURRENT_TIMESTAMP WHERE id = $1',
                    [id]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Tracking event added successfully',
            tracking_event: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding tracking event:', error);
        res.status(500).json({ error: 'Failed to add tracking event' });
    } finally {
        client.release();
    }
});

// Add delivery attempt (Admin)
router.post('/:id/delivery-attempts', adminAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const {
            attempt_number,
            status,
            notes,
            delivery_person_contact
        } = req.body;

        // Check if order exists
        const orderCheck = await client.query(
            'SELECT id FROM orders WHERE id = $1',
            [id]
        );

        if (orderCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        // Add delivery attempt
        const result = await client.query(
            `INSERT INTO delivery_attempts 
             (order_id, attempt_number, status, notes, delivery_person_contact)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [id, attempt_number, status, notes || null, delivery_person_contact || null]
        );

        // Update order status if needed
        if (status === 'failed') {
            await client.query(
                'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['delivery_failed', id]
            );

            await client.query(
                `INSERT INTO order_status_history 
                 (order_id, status, note, created_by)
                 VALUES ($1, $2, $3, $4)`,
                [id, 'delivery_failed', `Delivery attempt ${attempt_number} failed: ${notes}`, req.user.id]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Delivery attempt recorded successfully',
            delivery_attempt: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding delivery attempt:', error);
        res.status(500).json({ error: 'Failed to add delivery attempt' });
    } finally {
        client.release();
    }
});

// Get order tracking info for user
router.get('/:id/tracking', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify order belongs to user (or admin)
        let orderCheckQuery = 'SELECT id FROM orders WHERE id = $1';
        let queryParams = [id];

        if (req.user.role !== 'ADMIN') {
            orderCheckQuery += ' AND user_id = $2';
            queryParams.push(userId);
        }

        const orderCheck = await pool.query(orderCheckQuery, queryParams);

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order tracking info
        const orderResult = await pool.query(`
            SELECT 
                o.*,
                u.name as customer_name,
                u.email as customer_email,
                sa.first_name as shipping_first_name,
                sa.last_name as shipping_last_name,
                sa.email as shipping_email,
                sa.phone as shipping_phone,
                sa.address_line1 as shipping_address_line1,
                sa.address_line2 as shipping_address_line2,
                sa.city as shipping_city,
                sa.state as shipping_state,
                sa.zip_code as shipping_zip_code,
                sa.country as shipping_country
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
            WHERE o.id = $1
        `, [id]);

        const order = orderResult.rows[0];

        // Get tracking history
        const trackingHistory = await pool.query(`
            SELECT 
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
            ORDER BY event_time ASC
        `, [id]);

        // Get delivery attempts
        const deliveryAttempts = await pool.query(`
            SELECT 
                id,
                attempt_number,
                attempted_at,
                status,
                notes,
                delivery_person_contact,
                TO_CHAR(attempted_at, 'MM/DD/YYYY HH12:MI AM') as formatted_time
            FROM delivery_attempts 
            WHERE order_id = $1 
            ORDER BY attempted_at DESC
        `, [id]);

        // Get order items for summary
        const itemsResult = await pool.query(`
            SELECT 
                oi.*,
                p.image_url
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `, [id]);

        // Calculate timeline
        const timeline = calculateDeliveryTimeline(order, trackingHistory.rows);

        // Generate tracking URL
        let trackingUrl = null;
        if (order.tracking_number && order.carrier) {
            const carrierTemplates = {
                'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
                'UPS': 'https://www.ups.com/track?tracknum={tracking_number}',
                'FedEx': 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
                'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}'
            };

            if (carrierTemplates[order.carrier]) {
                trackingUrl = carrierTemplates[order.carrier].replace('{tracking_number}', order.tracking_number);
            }
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
                carrier: order.carrier,
                tracking_url: trackingUrl,
                delivery_notes: order.delivery_notes
            },
            shipping_address: {
                name: `${order.shipping_first_name} ${order.shipping_last_name}`,
                address: order.shipping_address_line1,
                address2: order.shipping_address_line2,
                city: order.shipping_city,
                state: order.shipping_state,
                zip: order.shipping_zip_code,
                country: order.shipping_country,
                phone: order.shipping_phone,
                email: order.shipping_email
            },
            tracking_history: trackingHistory.rows,
            delivery_attempts: deliveryAttempts.rows,
            timeline: timeline,
            items: itemsResult.rows
        });

    } catch (error) {
        console.error('Error fetching order tracking:', error);
        res.status(500).json({
            error: 'Failed to fetch tracking information',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get estimated delivery date
router.get('/:id/estimated-delivery', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if order belongs to user (or admin)
        let orderCheckQuery = 'SELECT id, estimated_delivery, created_at FROM orders WHERE id = $1';
        let queryParams = [id];

        if (req.user.role !== 'ADMIN') {
            orderCheckQuery += ' AND user_id = $2';
            queryParams.push(userId);
        }

        const orderCheck = await pool.query(orderCheckQuery, queryParams);

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
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

        const isDelayed = new Date() > new Date(deliveryWindow.to);
        const daysRemaining = Math.ceil((new Date(estimatedDelivery) - new Date()) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            estimated_delivery: estimatedDelivery,
            delivery_window: deliveryWindow,
            is_delayed: isDelayed,
            days_remaining: daysRemaining > 0 ? daysRemaining : 0
        });

    } catch (error) {
        console.error('Error fetching estimated delivery:', error);
        res.status(500).json({ error: 'Failed to fetch estimated delivery' });
    }
});

// Add status history entry (Keep existing but enhanced)
router.post('/:id/status-history', adminAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { status, note } = req.body;

        // Verify order exists
        const orderCheck = await client.query('SELECT id FROM orders WHERE id = $1', [id]);
        if (orderCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        // Add status history
        const statusHistoryResult = await client.query(`
            INSERT INTO order_status_history (order_id, status, note, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id, status, note, req.user.id]);

        // Update main order status
        await client.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
            [status, id]
        );

        // Also add to tracking history for major status changes
        if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
            const statusMessages = {
                'shipped': 'Order has been shipped',
                'out_for_delivery': 'Order is out for delivery',
                'delivered': 'Order has been delivered'
            };

            await client.query(
                `INSERT INTO order_tracking_history 
                 (order_id, status, description)
                 VALUES ($1, $2, $3)`,
                [id, status, statusMessages[status] || note || `Status changed to ${status}`]
            );

            // Set actual delivery date if delivered
            if (status === 'delivered') {
                await client.query(
                    'UPDATE orders SET actual_delivery = CURRENT_TIMESTAMP WHERE id = $1',
                    [id]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Status updated successfully',
            status_history: statusHistoryResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding status history:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    } finally {
        client.release();
    }
});

// Add order note
router.post('/:id/notes', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { note, is_internal = true } = req.body;

        const result = await pool.query(`
            INSERT INTO order_notes (order_id, note, is_internal, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id, note, is_internal, req.user.id]);

        res.status(201).json({
            message: 'Note added successfully',
            note: result.rows[0]
        });

    } catch (error) {
        console.error('Error adding order note:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

// Get user's orders (Keep existing but add tracking info)
router.get('/my-orders', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get orders with tracking info
        const ordersResult = await pool.query(`
            SELECT 
                o.id,
                o.order_number,
                o.total_amount,
                o.status,
                o.payment_status,
                o.payment_method,
                o.created_at,
                o.tracking_number,
                o.carrier,
                o.estimated_delivery,
                o.actual_delivery,
                COUNT(oi.id) as items_count,
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT(
                        'id', oi.id,
                        'product_name', oi.product_name,
                        'product_price', oi.product_price,
                        'quantity', oi.quantity,
                        'total_price', oi.total_price,
                        'image_url', p.image_url
                    )
                ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT $2 OFFSET $3
        `, [req.user.id, limit, offset]);

        // Get total count for pagination
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM orders WHERE user_id = $1',
            [req.user.id]
        );

        const totalOrders = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalOrders / limit);

        res.json({
            orders: ordersResult.rows,
            currentPage: page,
            totalPages,
            totalOrders
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order for user with tracking info
router.get('/my-orders/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify the order belongs to the user
        const orderCheck = await pool.query(
            'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order details with tracking
        const orderResult = await pool.query(`
            SELECT 
                o.*,
                sa.first_name as shipping_first_name,
                sa.last_name as shipping_last_name,
                sa.email as shipping_email,
                sa.phone as shipping_phone,
                sa.address_line1 as shipping_address_line1,
                sa.address_line2 as shipping_address_line2,
                sa.city as shipping_city,
                sa.state as shipping_state,
                sa.zip_code as shipping_zip_code,
                sa.country as shipping_country
            FROM orders o
            LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
            WHERE o.id = $1
        `, [id]);

        const order = orderResult.rows[0];

        // Get order items
        const itemsResult = await pool.query(`
            SELECT 
                oi.*,
                p.image_url,
                p.description
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `, [id]);

        // Get status history
        const statusHistoryResult = await pool.query(`
            SELECT 
                status,
                note,
                created_at,
                TO_CHAR(created_at, 'MM/DD/YYYY HH12:MI AM') as formatted_time
            FROM order_status_history 
            WHERE order_id = $1 
            ORDER BY created_at DESC
        `, [id]);

        // Get tracking history
        const trackingHistoryResult = await pool.query(`
            SELECT 
                status,
                location,
                description,
                event_time,
                TO_CHAR(event_time, 'MM/DD/YYYY HH12:MI AM') as formatted_time
            FROM order_tracking_history 
            WHERE order_id = $1 
            ORDER BY event_time DESC
        `, [id]);

        // Generate tracking URL if available
        let trackingUrl = null;
        if (order.tracking_number && order.carrier) {
            const carrierTemplates = {
                'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
                'UPS': 'https://www.ups.com/track?tracknum={tracking_number}',
                'FedEx': 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
                'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}'
            };

            if (carrierTemplates[order.carrier]) {
                trackingUrl = carrierTemplates[order.carrier].replace('{tracking_number}', order.tracking_number);
            }
        }

        res.json({
            order: {
                ...order,
                tracking_url: trackingUrl,
                items: itemsResult.rows,
                status_history: statusHistoryResult.rows,
                tracking_history: trackingHistoryResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching user order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

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

    // Order confirmed
    const confirmedEvent = trackingHistory.find(h => h.status === 'confirmed');
    timeline.push({
        id: 2,
        title: 'Order Confirmed',
        description: 'Payment confirmed and order processing',
        date: confirmedEvent ? confirmedEvent.event_time :
            new Date(orderDate.getTime() + 30 * 60000), // 30 minutes later
        completed: !!confirmedEvent || today > new Date(orderDate.getTime() + 30 * 60000),
        active: !confirmedEvent && today > orderDate,
        icon: '✅'
    });

    // Processing
    const processingEvent = trackingHistory.find(h => h.status === 'processing');
    timeline.push({
        id: 3,
        title: 'Processing',
        description: 'Preparing your items for shipment',
        date: processingEvent ? processingEvent.event_time :
            new Date(orderDate.getTime() + 24 * 60 * 60000), // 24 hours later
        completed: !!processingEvent || today > new Date(orderDate.getTime() + 24 * 60 * 60000),
        active: !processingEvent && (!!confirmedEvent || today > new Date(orderDate.getTime() + 30 * 60000)),
        icon: '⚙️'
    });

    // Shipped
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

export default router;