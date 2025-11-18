import { pool } from '../config/database.js';

export const getCart = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity 
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        // Validate quantity
        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        // Check if product exists
        const product = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if item already in cart
        const existingItem = await pool.query(
            'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
            [req.user.id, product_id]
        );

        if (existingItem.rows.length > 0) {
            const currentQuantity = existingItem.rows[0].quantity;
            const newQuantity = currentQuantity + quantity;

            // Check if new quantity exceeds limit
            if (newQuantity > 5) {
                return res.status(400).json({
                    message: 'Maximum quantity limit reached (5 items per product)'
                });
            }

            // Update quantity
            const updatedItem = await pool.query(
                'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
                [quantity, req.user.id, product_id]
            );
            res.json(updatedItem.rows[0]);
        } else {
            // Check if initial quantity exceeds limit
            if (quantity > 5) {
                return res.status(400).json({
                    message: 'Maximum quantity limit is 5 items per product'
                });
            }

            // Add new item
            const newItem = await pool.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
                [req.user.id, product_id, quantity]
            );
            res.status(201).json(newItem.rows[0]);
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Add this function to your cartController.js
export const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params; // This is the cart item ID
        const { quantity } = req.body;

        // Validate quantity
        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        // Check if quantity exceeds limit
        if (quantity > 5) {
            return res.status(400).json({
                message: 'Maximum quantity limit is 5 items per product'
            });
        }

        // First, check if the cart item exists and belongs to the current user
        const existingItem = await pool.query(
            'SELECT * FROM cart WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingItem.rows.length === 0) {
            return res.status(404).json({ message: 'Cart item not found or not authorized' });
        }

        // Update the quantity
        const updatedItem = await pool.query(
            'UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [quantity, id, req.user.id]
        );

        res.json(updatedItem.rows[0]);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};