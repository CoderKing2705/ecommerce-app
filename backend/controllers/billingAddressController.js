import { pool } from '../config/database.js';

// Get user's billing addresses
export const getBillingAddresses = async (req, res) => {
    try {
        const addresses = await pool.query(
            'SELECT * FROM billing_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [req.user.id]
        );

        res.json(addresses.rows);
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

// Create billing address
export const createBillingAddress = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userId = req.user.id;
        const {
            firstName, lastName, email, phone,
            addressLine1, addressLine2, city, state, zipCode, country,
            isDefault = false
        } = req.body;

        // If setting as default, unset other defaults
        if (isDefault) {
            await client.query(
                'UPDATE billing_addresses SET is_default = false WHERE user_id = $1',
                [userId]
            );
        }

        const address = await client.query(
            `INSERT INTO billing_addresses 
             (user_id, first_name, last_name, email, phone, address_line1, address_line2, city, state, zip_code, country, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [userId, firstName, lastName, email, phone, addressLine1, addressLine2 || '',
                city, state, zipCode, country || 'USA', isDefault]
        );

        await client.query('COMMIT');
        res.status(201).json(address.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

// Update billing address
export const updateBillingAddress = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const userId = req.user.id;
        const {
            firstName, lastName, email, phone,
            addressLine1, addressLine2, city, state, zipCode, country,
            isDefault = false
        } = req.body;

        // Check if address belongs to user
        const existingAddress = await client.query(
            'SELECT * FROM billing_addresses WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingAddress.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Address not found' });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await client.query(
                'UPDATE billing_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
                [userId, id]
            );
        }

        const address = await client.query(
            `UPDATE billing_addresses 
             SET first_name = $1, last_name = $2, email = $3, phone = $4,
                 address_line1 = $5, address_line2 = $6, city = $7, state = $8,
                 zip_code = $9, country = $10, is_default = $11, updated_at = CURRENT_TIMESTAMP
             WHERE id = $12 AND user_id = $13
             RETURNING *`,
            [firstName, lastName, email, phone, addressLine1, addressLine2 || '',
                city, state, zipCode, country || 'USA', isDefault, id, userId]
        );

        await client.query('COMMIT');
        res.json(address.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// Delete billing address
export const deleteBillingAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if address is being used in any orders
        const orderCheck = await pool.query(
            'SELECT id FROM orders WHERE billing_address_id = $1 AND user_id = $2 LIMIT 1',
            [id, userId]
        );

        if (orderCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete address. It is being used in existing orders.'
            });
        }

        const result = await pool.query(
            'DELETE FROM billing_addresses WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get default billing address
export const getDefaultBillingAddress = async (req, res) => {
    try {
        const userId = req.user.id;

        const address = await pool.query(
            'SELECT * FROM billing_addresses WHERE user_id = $1 AND is_default = true LIMIT 1',
            [userId]
        );

        res.json(address.rows[0] || null);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Set address as default
export const setDefaultBillingAddress = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const userId = req.user.id;

        // Check if address belongs to user
        const existingAddress = await client.query(
            'SELECT * FROM billing_addresses WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingAddress.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Address not found' });
        }

        // Unset all other defaults
        await client.query(
            'UPDATE billing_addresses SET is_default = false WHERE user_id = $1',
            [userId]
        );

        // Set this as default
        const address = await client.query(
            'UPDATE billing_addresses SET is_default = true WHERE id = $1 RETURNING *',
            [id]
        );

        await client.query('COMMIT');
        res.json(address.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};