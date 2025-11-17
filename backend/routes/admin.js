import express from 'express';
import { pool } from '../config/database.js';
import { adminAuth, auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// All routes require admin authentication
router.use(auth);
router.use(admin);

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        console.log('Fetching admin stats...');

        // Initialize all stats with default values
        const stats = {
            totalUsers: 0,
            activeUsers: 0,
            todayUsers: 0,
            weekUsers: 0,
            totalProducts: 0,
            totalOrders: 0,
            todayOrders: 0,
            totalRevenue: 0,
            productsByCategory: [],
            ordersByStatus: [],
            monthlyRevenue: [],
            userSignups: [],
            recentUsers: []
        };

        try {
            // Get user stats
            const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
            stats.totalUsers = parseInt(totalUsersResult.rows[0].count) || 0;

            const activeUsersResult = await pool.query(
                'SELECT COUNT(*) FROM users WHERE last_activity > NOW() - INTERVAL \'15 minutes\''
            );
            stats.activeUsers = parseInt(activeUsersResult.rows[0].count) || 0;

            const todayUsersResult = await pool.query(
                'SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE'
            );
            stats.todayUsers = parseInt(todayUsersResult.rows[0].count) || 0;

            const weekUsersResult = await pool.query(
                'SELECT COUNT(*) FROM users WHERE created_at >= DATE_TRUNC(\'week\', CURRENT_DATE)'
            );
            stats.weekUsers = parseInt(weekUsersResult.rows[0].count) || 0;

            // Get product stats
            const totalProductsResult = await pool.query('SELECT COUNT(*) FROM products');
            stats.totalProducts = parseInt(totalProductsResult.rows[0].count) || 0;

            const productsByCategoryResult = await pool.query(`
                SELECT category, COUNT(*) as count 
                FROM products 
                GROUP BY category 
                ORDER BY count DESC
            `);
            stats.productsByCategory = productsByCategoryResult.rows || [];

            // Get order stats - wrapped in try-catch for table existence
            try {
                const totalOrdersResult = await pool.query('SELECT COUNT(*) FROM orders');
                stats.totalOrders = parseInt(totalOrdersResult.rows[0].count) || 0;

                const todayOrdersResult = await pool.query(
                    'SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE'
                );
                stats.todayOrders = parseInt(todayOrdersResult.rows[0].count) || 0;

                const totalRevenueResult = await pool.query(`
                    SELECT COALESCE(SUM(total_amount), 0) as revenue 
                    FROM orders 
                    WHERE payment_status = 'paid'
                `);
                stats.totalRevenue = parseFloat(totalRevenueResult.rows[0].revenue) || 0;

                const ordersByStatusResult = await pool.query(`
                    SELECT status, COUNT(*) as count 
                    FROM orders 
                    GROUP BY status 
                    ORDER BY count DESC
                `);
                stats.ordersByStatus = ordersByStatusResult.rows || [];

                const monthlyRevenueResult = await pool.query(`
                    SELECT 
                        DATE_TRUNC('month', created_at) as month,
                        SUM(total_amount) as revenue
                    FROM orders 
                    WHERE payment_status = 'paid'
                    GROUP BY DATE_TRUNC('month', created_at)
                    ORDER BY month DESC
                    LIMIT 6
                `);
                stats.monthlyRevenue = monthlyRevenueResult.rows || [];

            } catch (orderError) {
                console.log('Orders table not available, using default order stats');
                // Continue with default order values (0)
            }

            // Get user signups for last 30 days
            const userSignupsResult = await pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM users 
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date
            `);
            stats.userSignups = userSignupsResult.rows || [];

            // Get recent users with status
            const recentUsersResult = await pool.query(`
                SELECT id, name, email, role, created_at, last_activity, last_login
                FROM users 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            stats.recentUsers = (recentUsersResult.rows || []).map(user => {
                const lastActivity = user.last_activity || user.last_login || user.created_at;
                const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                const isActive = lastActivity && new Date(lastActivity) > fifteenMinutesAgo;

                return {
                    ...user,
                    status: isActive ? 'Active' : 'Inactive'
                };
            });

        } catch (queryError) {
            console.error('Error in individual queries:', queryError);
            // Continue with default values
        }

        console.log('Sending stats response:', stats);
        // Send single response
        res.json(stats);

    } catch (error) {
        console.error('Error in admin stats route:', error);

        // Only send error response if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to fetch stats',
                details: error.message
            });
        }
    }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT id, name, email, role, created_at, updated_at, last_activity, last_login FROM users';
        let countQuery = 'SELECT COUNT(*) FROM users';
        let queryParams = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR email ILIKE $1';
            countQuery += ' WHERE name ILIKE $1 OR email ILIKE $1';
            queryParams.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
        queryParams.push(limit, offset);

        const usersResult = await pool.query(query, queryParams);
        const countResult = await pool.query(countQuery, search ? [queryParams[0]] : []);

        const users = usersResult.rows;
        const totalUsers = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalUsers / limit);

        // Map users to include status based on activity
        const usersWithStatus = users.map(user => {
            // Consider user active if they had activity in the last 15 minutes
            const lastActivity = user.last_activity || user.last_login || user.updated_at;
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            const isActive = lastActivity && new Date(lastActivity) > fifteenMinutesAgo;

            return {
                ...user,
                last_activity: lastActivity,
                status: isActive ? 'Active' : 'Inactive'
            };
        });

        res.json({
            users: usersWithStatus,
            currentPage: page,
            totalPages,
            totalUsers
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Failed to fetch users',
            details: error.message
        });
    }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['ADMIN', 'USER'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user activities (placeholder - you can expand this)
router.get('/user-activities', async (req, res) => {
    try {
        // This would typically join with carts, orders, etc.
        // For now, we'll return basic user activity
        const activities = await pool.query(`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        COUNT(c.id) as cart_items,
        COUNT(w.id) as wishlist_items,
        u.last_login,
        u.created_at
      FROM users u
      LEFT JOIN cart c ON u.id = c.user_id
      LEFT JOIN wishlist w ON u.id = w.user_id
      GROUP BY u.id, u.name, u.email, u.last_login, u.created_at
      ORDER BY u.created_at DESC
    `);

        res.json(activities.rows);
    } catch (error) {
        console.error('Get user activities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all orders with pagination and filtering
// Get all orders with pagination and filtering - FIXED VERSION
router.get('/orders', adminAuth, async (req, res) => {
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
                COUNT(oi.id) as items_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
        `;

        let countQuery = 'SELECT COUNT(DISTINCT o.id) FROM orders o';
        let queryParams = [];
        let countParams = [];
        let conditions = [];

        // Build conditions for main query and count query
        if (status) {
            conditions.push('o.status = $' + (conditions.length + 1));
            queryParams.push(status);
            countParams.push(status);
        }

        if (search) {
            conditions.push('(o.order_number ILIKE $' + (conditions.length + 1) +
                ' OR u.name ILIKE $' + (conditions.length + 1) +
                ' OR u.email ILIKE $' + (conditions.length + 1) + ')');
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        // Add GROUP BY, ORDER BY, LIMIT, OFFSET to main query
        query += ' GROUP BY o.id, u.name, u.email ORDER BY o.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
        queryParams.push(limit, offset);

        console.log('Query:', query);
        console.log('Query Params:', queryParams);
        console.log('Count Query:', countQuery);
        console.log('Count Params:', countParams);

        const ordersResult = await pool.query(query, queryParams);
        const countResult = await pool.query(countQuery, countParams);

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
        res.status(500).json({
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
});

// Update order status
router.put('/orders/:id/status', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            message: 'Order status updated successfully',
            order: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Get complete order details
// Get complete order details - FIXED VERSION
router.get('/orders/:id/details', adminAuth, async (req, res) => {
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

        // Get order notes - FIXED: changed alias from 'on' to 'ord_notes'
        const notesResult = await pool.query(`
            SELECT 
                ord_notes.*,
                u.name as created_by_name
            FROM order_notes ord_notes
            LEFT JOIN users u ON ord_notes.created_by = u.id
            WHERE ord_notes.order_id = $1
            ORDER BY ord_notes.created_at DESC
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
        res.status(500).json({
            error: 'Failed to fetch order details',
            details: error.message
        });
    }
});

// Add status history entry
router.post('/orders/:id/status-history', adminAuth, async (req, res) => {
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
router.post('/orders/:id/notes', adminAuth, async (req, res) => {
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

export default router;