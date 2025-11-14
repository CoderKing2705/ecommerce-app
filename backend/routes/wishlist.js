import express from 'express';
import { pool } from '../config/database.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's wishlist
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT w.*, p.name, p.price, p.image_url, p.description, p.category, p.brand, p.size, p.color, p.stock_quantity
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add to wishlist
router.post('/', auth, async (req, res) => {
    try {
        const { product_id } = req.body;

        // Check if product exists
        const product = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if already in wishlist
        const existingItem = await pool.query(
            'SELECT * FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [req.user.id, product_id]
        );

        if (existingItem.rows.length > 0) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // Add to wishlist
        const newItem = await pool.query(
            'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *',
            [req.user.id, product_id]
        );

        // Get the complete wishlist item with product details
        const wishlistItem = await pool.query(
            `SELECT w.*, p.name, p.price, p.image_url, p.description, p.category, p.brand, p.size, p.color, p.stock_quantity
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.id = $1`,
            [newItem.rows[0].id]
        );

        res.status(201).json(wishlistItem.rows[0]);
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove from wishlist
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM wishlist WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Wishlist item not found' });
        }

        res.json({ message: 'Item removed from wishlist' });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check if product is in wishlist
router.get('/check/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await pool.query(
            'SELECT * FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [req.user.id, productId]
        );

        res.json({ inWishlist: result.rows.length > 0, item: result.rows[0] });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;