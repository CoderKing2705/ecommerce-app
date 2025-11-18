import express from 'express';
import { pool } from '../config/database.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get daily order counts
router.get('/orders/daily', adminAuth, async (req, res) => {
    try {
        const { days = 30 } = req.query; // Default to last 30 days

        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                SUM(total_amount) as total_revenue,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: result.rows,
            period: `${days} days`
        });
    } catch (error) {
        console.error('Error fetching daily orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order analytics'
        });
    }
});

// Get order status distribution
router.get('/orders/status-distribution', adminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders)), 2) as percentage
            FROM orders 
            GROUP BY status
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching status distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch status distribution'
        });
    }
});

// Get revenue statistics
router.get('/orders/revenue', adminAuth, async (req, res) => {
    try {
        const { period = 'month' } = req.query; // month, week, year

        let interval;
        switch (period) {
            case 'week':
                interval = '7 days';
                break;
            case 'year':
                interval = '1 year';
                break;
            default:
                interval = '30 days';
        }

        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                SUM(total_amount) as daily_revenue,
                COUNT(*) as order_count
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
                AND status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Calculate totals
        const totals = await pool.query(`
            SELECT 
                SUM(total_amount) as total_revenue,
                COUNT(*) as total_orders,
                AVG(total_amount) as average_order_value
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
                AND status != 'cancelled'
        `);

        res.json({
            success: true,
            data: result.rows,
            totals: totals.rows[0],
            period
        });
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue statistics'
        });
    }
});

export default router;