import { pool } from '../config/database.js';

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.name = p.category  -- Temporary: until you migrate to category_id
            GROUP BY c.id, c.name
            ORDER BY c.name ASC
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
        const { name, description = '' } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Insert into categories table
        const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name.trim(), description.trim()]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }

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
        const { newName, description } = req.body;

        if (!newName || newName.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'New category name is required'
            });
        }

        // Update category in categories table
        const result = await pool.query(
            'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE name = $3 RETURNING *',
            [newName.trim(), description, oldName]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Also update products that use this category (temporary solution)
        await pool.query(
            'UPDATE products SET category = $1 WHERE category = $2',
            [newName.trim(), oldName]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists'
            });
        }

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

        // First, set products using this category to NULL or a default category
        await pool.query(
            'UPDATE products SET category = NULL WHERE category = $1',
            [name]
        );

        // Then delete the category
        const result = await pool.query(
            'DELETE FROM categories WHERE name = $1 RETURNING *',
            [name]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: {
                deletedCategory: result.rows[0],
                message: 'Category deleted successfully'
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