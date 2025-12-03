// backend/controllers/checkoutController-simple.js
import { pool } from '../config/database.js';

// Create checkout session for COD
export const createCheckoutSession = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userId = req.user.id;
        const { shippingAddressId, billingAddressId, saveAsDefault = true } = req.body;

        // Get user's cart items
        const cartItems = await client.query(
            `SELECT c.*, p.name, p.price, p.stock_quantity 
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1`,
            [userId]
        );

        if (cartItems.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Check stock availability
        for (const item of cartItems.rows) {
            if (item.stock_quantity < item.quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: `Insufficient stock for ${item.name}. Available: ${item.stock_quantity}`
                });
            }
        }

        let billingAddressIdToUse;
        let shippingAddressIdToUse;

        if (billingAddressId) {
            // Use existing billing address
            const billingResult = await client.query(
                'SELECT id FROM billing_addresses WHERE id = $1 AND user_id = $2',
                [billingAddressId, userId]
            );

            if (billingResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Invalid billing address' });
            }

            billingAddressIdToUse = billingAddressId;
        } else if (req.body.billingAddress) {
            // Create new billing address
            const { firstName, lastName, email, phone, addressLine1, addressLine2, city, state, zipCode, country } = req.body.billingAddress;

            if (saveAsDefault) {
                await client.query(
                    'UPDATE billing_addresses SET is_default = false WHERE user_id = $1',
                    [userId]
                );
            }

            const newBillingAddress = await client.query(
                `INSERT INTO billing_addresses 
                 (user_id, first_name, last_name, email, phone, address_line1, address_line2, city, state, zip_code, country, is_default)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING id`,
                [userId, firstName, lastName, email, phone, addressLine1, addressLine2 || '',
                    city, state, zipCode, country || 'USA', saveAsDefault]
            );

            billingAddressIdToUse = newBillingAddress.rows[0].id;
        } else {
            // If no billing address provided, use shipping address
            billingAddressIdToUse = shippingAddressIdToUse;
        }

        if (shippingAddressId) {
            // Use existing address - verify it belongs to user
            const addressResult = await client.query(
                'SELECT id FROM shipping_addresses WHERE id = $1 AND user_id = $2',
                [shippingAddressId, userId]
            );

            if (addressResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Invalid shipping address' });
            }

            shippingAddressIdToUse = shippingAddressId;
        } else if (req.body.shippingAddress) {
            // Create new address from request body
            const { firstName, lastName, email, phone, addressLine1, addressLine2, city, state, zipCode, country } = req.body.shippingAddress;

            // If setting as default, unset other defaults first
            if (saveAsDefault) {
                await client.query(
                    'UPDATE shipping_addresses SET is_default = false WHERE user_id = $1',
                    [userId]
                );
            }

            const newAddress = await client.query(
                `INSERT INTO shipping_addresses 
                 (user_id, first_name, last_name, email, phone, address_line1, address_line2, city, state, zip_code, country, is_default)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING id`,
                [userId, firstName, lastName, email, phone, addressLine1, addressLine2 || '',
                    city, state, zipCode, country || 'USA', saveAsDefault]
            );

            shippingAddressIdToUse = newAddress.rows[0].id;
        } else {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Shipping address is required' });
        }

        if (!shippingAddressIdToUse) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Failed to get shipping address' });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = cartItems.rows.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return {
                product_id: item.product_id,
                product_name: item.name,
                product_price: item.price,           // This is for product_price column
                quantity: item.quantity,
                total_price: itemTotal,              // This is for total_price column
            };
        });

        const shippingFee = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08; // 8% tax
        const totalAmount = subtotal + shippingFee + tax;

        // Generate order number
        const generateOrderNumber = () => {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `ORD-${year}${month}${day}-${random}`;
        };

        const orderNumber = generateOrderNumber();

        // Create order in database with foreign key
        const order = await client.query(
            `INSERT INTO orders 
     (order_number, user_id, total_amount, shipping_fee, tax_amount, status, payment_method, shipping_address_id, billing_address_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
            [orderNumber, userId, totalAmount, shippingFee, tax, 'confirmed', 'cod',
                shippingAddressIdToUse, billingAddressIdToUse]
        );


        const orderId = order.rows[0].id;

        // Insert order items
        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items 
         (order_id, product_id, product_name, product_price, quantity, total_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [orderId, item.product_id, item.product_name, item.product_price,
                    item.quantity, item.total_price]
            );

            // Update product stock
            await client.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }
        // Clear cart
        await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

        await client.query('COMMIT');

        return res.json({
            success: true,
            orderId: orderId,
            orderNumber: orderNumber,
            message: 'Order placed successfully. Cash on Delivery selected.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({
            message: 'Checkout failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

// Get checkout summary
export const getCheckoutSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get cart items
        const cartItems = await pool.query(
            `SELECT c.*, p.name, p.price, p.stock_quantity 
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1`,
            [userId]
        );

        if (cartItems.rows.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate totals
        let subtotal = 0;
        const items = cartItems.rows.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return {
                id: item.id,
                product_id: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                stock_quantity: item.stock_quantity,
                item_total: itemTotal
            };
        });

        const shippingFee = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const total = subtotal + shippingFee + tax;

        // Get default shipping address
        const defaultAddress = await pool.query(
            'SELECT * FROM shipping_addresses WHERE user_id = $1 AND is_default = true LIMIT 1',
            [userId]
        );

        res.json({
            items,
            summary: {
                subtotal,
                shippingFee,
                tax,
                total,
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
            },
            shippingAddress: defaultAddress.rows[0] || null
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's shipping addresses
export const getShippingAddresses = async (req, res) => {

    try {
        const addresses = await pool.query(
            'SELECT * FROM shipping_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
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

// Create shipping address
export const createShippingAddress = async (req, res) => {
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
                'UPDATE shipping_addresses SET is_default = false WHERE user_id = $1',
                [userId]
            );
        }

        const address = await client.query(
            `INSERT INTO shipping_addresses 
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

// Update shipping address
export const updateShippingAddress = async (req, res) => {
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
            'SELECT * FROM shipping_addresses WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingAddress.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Address not found' });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await client.query(
                'UPDATE shipping_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
                [userId, id]
            );
        }

        const address = await client.query(
            `UPDATE shipping_addresses 
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

// Delete shipping address
export const deleteShippingAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM shipping_addresses WHERE id = $1 AND user_id = $2 RETURNING *',
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

// Get order details
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await pool.query(
            `SELECT 
                o.*,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'product_name', oi.product_name,
                        'unit_price', oi.unit_price,  // Add if you have this column
                        'total_price', oi.total_price, // Use total_price instead of price
                        'quantity', oi.quantity,
                    )
                ) as items,
                sa.first_name, 
                sa.last_name, 
                sa.email, 
                sa.phone,
                sa.address_line1, 
                sa.address_line2, 
                sa.city, 
                sa.state, 
                sa.zip_code, 
                sa.country,
                ba.first_name, 
                ba.last_name, 
                ba.email, 
                ba.phone,
                ba.address_line1, 
                ba.address_line2, 
                ba.city, 
                ba.state, 
                ba.zip_code, 
                ba.country,

             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
             LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
             WHERE o.id = $1 AND o.user_id = $2
             GROUP BY o.id, sa.id`,
            [orderId, userId]
        );

        if (order.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order.rows[0]);

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};