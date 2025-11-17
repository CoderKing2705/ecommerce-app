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
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                o.*,
                u.name as customer_name,
                u.email as customer_email,
                COUNT(oi.id) as items_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
        `;

        let countQuery = 'SELECT COUNT(*) FROM orders o';
        let queryParams = [];
        let conditions = [];

        if (status) {
            conditions.push('o.status = $1');
            queryParams.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY o.id, u.name, u.email ORDER BY o.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
        queryParams.push(limit, offset);

        const ordersResult = await pool.query(query, queryParams);
        const countResult = await pool.query(countQuery, status ? [status] : []);

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

router.get('/:id/details', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get order with customer info
        const orderResult = await pool.query(`
            SELECT 
                o.*,
                u.name as customer_name,
                u.email as customer_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Get order items
        const itemsResult = await pool.query(`
            SELECT 
                oi.*,
                p.image_url,
                p.stock_quantity
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `, [id]);

        // Get status history
        const statusHistoryResult = await pool.query(`
            SELECT 
                osh.*,
                u.name as updated_by_name
            FROM order_status_history osh
            LEFT JOIN users u ON osh.created_by = u.id
            WHERE osh.order_id = $1
            ORDER BY osh.created_at DESC
        `, [id]);

        // Get order notes
        const notesResult = await pool.query(`
            SELECT 
                on.*,
                u.name as created_by_name
            FROM order_notes on
            LEFT JOIN users u ON on.created_by = u.id
            WHERE on.order_id = $1
            ORDER BY on.created_at DESC
        `, [id]);

        // Get shipping info
        const shippingResult = await pool.query(`
            SELECT * FROM order_shipping 
            WHERE order_id = $1
        `, [id]);

        res.json({
            order: {
                ...order,
                items: itemsResult.rows,
                status_history: statusHistoryResult.rows,
                notes: notesResult.rows,
                shipping: shippingResult.rows[0] || null
            }
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

// Add status history entry
router.post('/:id/status-history', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        // Verify order exists
        const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Add status history
        const result = await pool.query(`
            INSERT INTO order_status_history (order_id, status, note, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id, status, note, req.user.id]);

        // Update main order status
        await pool.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
            [status, id]
        );

        res.status(201).json({
            message: 'Status updated successfully',
            status_history: result.rows[0]
        });

    } catch (error) {
        console.error('Error adding status history:', error);
        res.status(500).json({ error: 'Failed to update order status' });
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

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get orders with basic info
        const ordersResult = await pool.query(`
            SELECT 
                o.id,
                o.order_number,
                o.total_amount,
                o.status,
                o.payment_status,
                o.payment_method,
                o.created_at,
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

// Get single order for user (with full details)
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

        // Get order details
        const orderResult = await pool.query(`
            SELECT 
                o.*,
                os.tracking_number,
                os.carrier,
                os.shipping_date,
                os.estimated_delivery
            FROM orders o
            LEFT JOIN order_shipping os ON o.id = os.order_id
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
                created_at
            FROM order_status_history 
            WHERE order_id = $1 
            ORDER BY created_at DESC
        `, [id]);

        res.json({
            order: {
                ...order,
                items: itemsResult.rows,
                status_history: statusHistoryResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching user order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});
// Add other order routes as needed...

export default router;