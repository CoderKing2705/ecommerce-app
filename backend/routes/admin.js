import express from 'express';
import { pool } from '../config/database.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// All routes require admin authentication
router.use(auth);
router.use(admin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Get total users count
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');

        // Get total products count
        const productsCount = await pool.query('SELECT COUNT(*) FROM products');

        // Get total orders count (you can add orders table later)
        // const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');

        // Get today's new users
        const todayUsers = await pool.query(
            `SELECT COUNT(*) FROM users 
       WHERE DATE(created_at) = CURRENT_DATE`
        );

        // Get this week's new users
        const weekUsers = await pool.query(
            `SELECT COUNT(*) FROM users 
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
        );

        // Get user signups per day for the last 30 days
        const userSignups = await pool.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users 
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at) 
       ORDER BY date`
        );

        // Get products by category
        const productsByCategory = await pool.query(
            `SELECT category, COUNT(*) as count 
       FROM products 
       GROUP BY category 
       ORDER BY count DESC`
        );

        // Get recent users (last 10)
        const recentUsers = await pool.query(
            `SELECT id, name, email, role, created_at, last_login 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 10`
        );

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            totalProducts: parseInt(productsCount.rows[0].count),
            totalOrders: 0, // Placeholder for orders
            todayUsers: parseInt(todayUsers.rows[0].count),
            weekUsers: parseInt(weekUsers.rows[0].count),
            userSignups: userSignups.rows,
            productsByCategory: productsByCategory.rows,
            recentUsers: recentUsers.rows
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users with pagination
router.get('/users', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT id, name, email, role, created_at, updated_at FROM users';
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

        // Map users to include last_activity (use updated_at as fallback)
        const usersWithActivity = users.map(user => ({
            ...user,
            last_activity: user.last_login || user.updated_at || user.created_at
        }));

        res.json({
            users: usersWithActivity,
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

export default router;