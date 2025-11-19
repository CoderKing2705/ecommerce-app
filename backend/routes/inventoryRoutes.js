import express from 'express';
import { pool } from '../config/database.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get inventory list with pagination and filters - FIXED: Removed supplier_id reference
router.get('/', adminAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            lowStock = false
        } = req.query;

        const offset = (page - 1) * limit;
        let queryParams = [];
        let whereConditions = [];

        let baseQuery = `
            SELECT 
                i.*,
                p.name as product_name,
                p.image_url,
                p.price,
                p.category,
                p.brand,
                CASE 
                    WHEN i.current_stock = 0 THEN 'out_of_stock'
                    WHEN i.current_stock <= i.minimum_stock_level THEN 'low_stock'
                    ELSE 'in_stock'
                END as computed_status
            FROM inventory i
            JOIN products p ON i.product_id = p.id
        `;

        if (search) {
            whereConditions.push(`(p.name ILIKE $${queryParams.length + 1} OR p.category ILIKE $${queryParams.length + 1} OR p.brand ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }

        if (status) {
            whereConditions.push(`i.stock_status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        if (lowStock === 'true') {
            whereConditions.push(`i.current_stock <= i.minimum_stock_level`);
        }

        if (whereConditions.length > 0) {
            baseQuery += ' WHERE ' + whereConditions.join(' AND ');
        }

        // Count query
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as filtered`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // Main query with pagination
        baseQuery += ` ORDER BY i.current_stock ASC, p.name ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const result = await pool.query(baseQuery, queryParams);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory',
            details: error.message
        });
    }
});

// Get inventory item by ID - FIXED: Removed supplier reference
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                i.*,
                p.name as product_name,
                p.image_url,
                p.price,
                p.category,
                p.brand,
                p.description
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Inventory item not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory item',
            details: error.message
        });
    }
});

// Update inventory stock - FIXED: Using correct column names
router.put('/:id/stock', adminAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { adjustment, reason, movement_type = 'adjustment' } = req.body;

        // Get current inventory
        const inventoryResult = await client.query(
            'SELECT * FROM inventory WHERE id = $1',
            [id]
        );

        if (inventoryResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Inventory item not found' });
        }

        const inventory = inventoryResult.rows[0];
        const previousStock = inventory.current_stock;
        const newStock = previousStock + parseInt(adjustment);

        if (newStock < 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Stock cannot go below zero' });
        }

        // Update inventory
        await client.query(
            `UPDATE inventory 
             SET current_stock = $1, 
                 stock_status = CASE 
                     WHEN $1 = 0 THEN 'out_of_stock'
                     WHEN $1 <= minimum_stock_level THEN 'low_stock'
                     ELSE 'in_stock'
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [newStock, id]
        );

        // Record stock movement
        await client.query(
            `INSERT INTO stock_movements 
             (product_id, movement_type, quantity, previous_stock, new_stock, reason, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                inventory.product_id,
                movement_type,
                adjustment,
                previousStock,
                newStock,
                reason,
                req.user.id
            ]
        );

        // Update product stock_quantity as well
        await client.query(
            'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newStock, inventory.product_id]
        );

        // Check for stock alerts
        if (newStock <= inventory.minimum_stock_level) {
            await client.query(
                `INSERT INTO stock_alerts (product_id, alert_type, current_stock, threshold)
                 VALUES ($1, 'low_stock', $2, $3)
                 ON CONFLICT (product_id, alert_type) WHERE NOT is_resolved 
                 DO UPDATE SET current_stock = $2, created_at = CURRENT_TIMESTAMP`,
                [inventory.product_id, newStock, inventory.minimum_stock_level]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Stock updated successfully`,
            data: {
                previousStock,
                newStock,
                adjustment
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating stock:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update stock',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Update inventory settings
router.put('/:id/settings', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { minimum_stock_level, maximum_stock_level, reorder_quantity, location } = req.body;

        const result = await pool.query(
            `UPDATE inventory 
             SET minimum_stock_level = $1, 
                 maximum_stock_level = $2,
                 reorder_quantity = $3,
                 location = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [minimum_stock_level, maximum_stock_level, reorder_quantity, location, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Inventory item not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating inventory settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update inventory settings',
            details: error.message
        });
    }
});

// Get stock movements for a product
router.get('/:id/movements', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // First get the product_id from inventory
        const inventoryResult = await pool.query(
            'SELECT product_id FROM inventory WHERE id = $1',
            [id]
        );

        if (inventoryResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Inventory item not found' });
        }

        const productId = inventoryResult.rows[0].product_id;

        const movementsResult = await pool.query(
            `SELECT sm.*, u.name as created_by_name, p.name as product_name
             FROM stock_movements sm
             JOIN products p ON sm.product_id = p.id
             LEFT JOIN users u ON sm.created_by = u.id
             WHERE sm.product_id = $1
             ORDER BY sm.created_at DESC
             LIMIT $2 OFFSET $3`,
            [productId, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM stock_movements WHERE product_id = $1',
            [productId]
        );

        res.json({
            success: true,
            data: movementsResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult.rows[0].count / limit),
                totalItems: parseInt(countResult.rows[0].count)
            }
        });

    } catch (error) {
        console.error('Error fetching stock movements:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock movements',
            details: error.message
        });
    }
});

// Get low stock alerts - FIXED: Removed supplier reference
router.get('/alerts/low-stock', adminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                p.name as product_name,
                p.image_url,
                p.price,
                p.brand,
                (i.minimum_stock_level - i.current_stock) as stock_needed
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.current_stock <= i.minimum_stock_level
            ORDER BY i.current_stock ASC
        `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching low stock alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch low stock alerts',
            details: error.message
        });
    }
});

// Get inventory statistics - FIXED: Simplified without suppliers
router.get('/stats/overview', adminAuth, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                SUM(current_stock) as total_stock_value,
                COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count,
                COUNT(CASE WHEN current_stock <= minimum_stock_level AND current_stock > 0 THEN 1 END) as low_stock_count,
                COUNT(CASE WHEN current_stock > minimum_stock_level THEN 1 END) as in_stock_count,
                AVG(current_stock) as avg_stock_level
            FROM inventory
        `);

        const recentMovements = await pool.query(`
            SELECT movement_type, COUNT(*) as count
            FROM stock_movements 
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY movement_type
        `);

        res.json({
            success: true,
            data: {
                overview: stats.rows[0],
                recentActivity: recentMovements.rows
            }
        });
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory statistics',
            details: error.message
        });
    }
});

// Simple dashboard metrics
router.get('/dashboard-metrics', adminAuth, async (req, res) => {
    try {
        const today = await pool.query(`
            SELECT 
                COUNT(*) as today_orders,
                COALESCE(SUM(total_amount), 0) as today_revenue
            FROM orders 
            WHERE DATE(created_at) = CURRENT_DATE
        `);

        const week = await pool.query(`
            SELECT 
                COUNT(*) as week_orders,
                COALESCE(SUM(total_amount), 0) as week_revenue
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        `);

        const month = await pool.query(`
            SELECT 
                COUNT(*) as month_orders,
                COALESCE(SUM(total_amount), 0) as month_revenue
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        const pendingOrders = await pool.query(`
            SELECT COUNT(*) as pending_count
            FROM orders 
            WHERE status = 'pending'
        `);

        res.json({
            success: true,
            data: {
                today: today.rows[0],
                week: week.rows[0],
                month: month.rows[0],
                pending: pendingOrders.rows[0]
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard metrics'
        });
    }
});

router.get('/analytics/chart-data', adminAuth, async (req, res) => {
    try {
        // Status distribution
        const statusDistribution = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN current_stock <= minimum_stock_level AND current_stock > 0 THEN 1 END) as low_stock,
                COUNT(CASE WHEN current_stock > minimum_stock_level THEN 1 END) as in_stock
            FROM inventory
        `);

        // Top products by stock
        const topProducts = await pool.query(`
            SELECT 
                p.name as product_name,
                i.current_stock,
                i.minimum_stock_level
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            ORDER BY i.current_stock DESC
            LIMIT 10
        `);

        // Recent stock movements
        const recentMovements = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_movements,
                COUNT(CASE WHEN movement_type IN ('purchase', 'return') THEN 1 END) as incoming,
                COUNT(CASE WHEN movement_type IN ('sale', 'damage') THEN 1 END) as outgoing,
                COUNT(CASE WHEN movement_type = 'adjustment' THEN 1 END) as adjustments
            FROM stock_movements 
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: {
                statusDistribution: statusDistribution.rows[0],
                topProducts: topProducts.rows,
                recentMovements: recentMovements.rows
            }
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chart data'
        });
    }
});

export default router;