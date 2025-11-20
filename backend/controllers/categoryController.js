import { pool } from '../config/database.js';

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                category as name,
                COUNT(*) as product_count,
                MIN(created_at) as created_at
            FROM products 
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY product_count DESC, name ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category already exists
        const existingCategory = await pool.query(
            'SELECT category FROM products WHERE LOWER(category) = LOWER($1) LIMIT 1',
            [name.trim()]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }

        // Since categories are stored in products table, we don't need to insert anything
        // Just return success - the category will be created when a product uses it
        res.json({
            success: true,
            data: { name: name.trim() }
        });

    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { oldName } = req.params;
        const { newName } = req.body;

        if (!newName || newName.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'New category name is required'
            });
        }

        // Update all products with the old category name
        const result = await pool.query(
            'UPDATE products SET category = $1 WHERE category = $2 RETURNING *',
            [newName.trim(), oldName]
        );

        res.json({
            success: true,
            data: {
                oldName,
                newName: newName.trim(),
                updatedProducts: result.rows.length
            }
        });

    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { name } = req.params;

        // Set category to null for all products with this category
        const result = await pool.query(
            'UPDATE products SET category = NULL WHERE category = $1 RETURNING *',
            [name]
        );

        res.json({
            success: true,
            data: {
                deletedCategory: name,
                affectedProducts: result.rows.length
            }
        });

    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const getCategoryStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                category,
                COUNT(*) as product_count,
                ROUND(AVG(price), 2) as average_price,
                MIN(price) as min_price,
                MAX(price) as max_price,
                SUM(stock_quantity) as total_stock
            FROM products 
            WHERE category IS NOT NULL 
            GROUP BY category
            ORDER BY product_count DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get category stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};