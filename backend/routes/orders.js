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

// Add other order routes as needed...

export default router;