import { pool } from '../config/database.js';

// Get all orders (Admin)
export const getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, u.name as customer_name, u.email as customer_email,
                   COUNT(*) OVER() as total_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) FROM orders o';
        const queryParams = [];
        const whereConditions = [];

        if (status && status !== 'all') {
            whereConditions.push(`o.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        if (whereConditions.length > 0) {
            const whereClause = ' WHERE ' + whereConditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY o.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const orders = await pool.query(query, queryParams);
        const totalResult = await pool.query(countQuery, queryParams.slice(0, -2));

        res.json({
            orders: orders.rows,
            total: parseInt(totalResult.rows[0].count),
            page: parseInt(page),
            totalPages: Math.ceil(totalResult.rows[0].count / limit)
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
    try {
        const orders = await pool.query(
            `SELECT o.*, 
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', p.name,
                            'product_image', p.image_url,
                            'quantity', oi.quantity,
                            'price', oi.price,
                            'size', oi.size,
                            'color', oi.color
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json(orders.rows);
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const order = await pool.query(
            `SELECT o.*, 
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', p.name,
                            'product_image', p.image_url,
                            'quantity', oi.quantity,
                            'price', oi.price,
                            'size', oi.size,
                            'color', oi.color
                        )
                    ) as items,
                    u.name as customer_name,
                    u.email as customer_email
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = $1
             GROUP BY o.id, u.name, u.email`,
            [req.params.id]
        );

        if (order.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns the order or is admin
        if (order.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(order.rows[0]);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update order status (Admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );

        if (order.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If cancelling order, restore stock
        if (status === 'cancelled' && order.rows[0].status !== 'cancelled') {
            await restoreOrderStock(id);
        }

        const updatedOrder = await pool.query(
            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        res.json(updatedOrder.rows[0]);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel order (User or Admin)
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );

        if (order.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns the order or is admin
        if (order.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if order can be cancelled
        const cancellableStatuses = ['pending', 'confirmed', 'processing'];
        if (!cancellableStatuses.includes(order.rows[0].status)) {
            return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
        }

        // Restore stock
        await restoreOrderStock(id);

        const cancelledOrder = await pool.query(
            `UPDATE orders 
             SET status = 'cancelled', 
                 cancellation_reason = $1, 
                 cancelled_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [reason, id]
        );

        res.json(cancelledOrder.rows[0]);
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Process refund (Admin)
export const processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { refund_amount, reason } = req.body;

        const order = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );

        if (order.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Validate refund amount
        if (refund_amount > order.rows[0].total_amount) {
            return res.status(400).json({ message: 'Refund amount cannot exceed order total' });
        }

        const refundedOrder = await pool.query(
            `UPDATE orders 
             SET refund_status = 'processed',
                 refund_amount = $1,
                 refund_reason = $2,
                 refunded_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 RETURNING *`,
            [refund_amount, reason, id]
        );

        res.json(refundedOrder.rows[0]);
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Bulk order operations (Admin)
export const bulkUpdateOrders = async (req, res) => {
    try {
        const { orderIds, action, data } = req.body;

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ message: 'No orders selected' });
        }

        let results = [];

        switch (action) {
            case 'update_status':
                for (const orderId of orderIds) {
                    try {
                        const result = await pool.query(
                            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                            [data.status, orderId]
                        );
                        results.push({ orderId, success: true, data: result.rows[0] });
                    } catch (error) {
                        results.push({ orderId, success: false, error: error.message });
                    }
                }
                break;

            case 'cancel_orders':
                for (const orderId of orderIds) {
                    try {
                        const order = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);

                        if (order.rows.length > 0) {
                            const cancellableStatuses = ['pending', 'confirmed', 'processing'];
                            if (cancellableStatuses.includes(order.rows[0].status)) {
                                await restoreOrderStock(orderId);
                                const result = await pool.query(
                                    `UPDATE orders 
                                     SET status = 'cancelled', 
                                         cancellation_reason = $1,
                                         cancelled_at = CURRENT_TIMESTAMP,
                                         updated_at = CURRENT_TIMESTAMP 
                                     WHERE id = $2 RETURNING *`,
                                    [data.reason || 'Bulk cancellation', orderId]
                                );
                                results.push({ orderId, success: true, data: result.rows[0] });
                            } else {
                                results.push({ orderId, success: false, error: 'Order cannot be cancelled' });
                            }
                        }
                    } catch (error) {
                        results.push({ orderId, success: false, error: error.message });
                    }
                }
                break;

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        res.json({
            message: `Bulk operation completed`,
            results
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to restore stock when order is cancelled
const restoreOrderStock = async (orderId) => {
    try {
        const orderItems = await pool.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
            [orderId]
        );

        for (const item of orderItems.rows) {
            await pool.query(
                'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }
    } catch (error) {
        console.error('Restore stock error:', error);
        throw error;
    }
};