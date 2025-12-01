import { pool } from '../config/database.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
export const createCheckoutSession = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userId = req.user.id;
        const { shippingAddressId, paymentMethod, saveAsDefault = true } = req.body;

        // Get user's cart items
        const cartItems = await client.query(
            `SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity 
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

        // Get or create shipping address
        let shippingAddress;
        if (shippingAddressId) {
            shippingAddress = await client.query(
                'SELECT * FROM shipping_addresses WHERE id = $1 AND user_id = $2',
                [shippingAddressId, userId]
            );
        } else {
            // Create new shipping address from request body
            const { firstName, lastName, email, phone, addressLine1, addressLine2, city, state, zipCode, country } = req.body.shippingAddress;

            shippingAddress = await client.query(
                `INSERT INTO shipping_addresses 
                 (user_id, first_name, last_name, email, phone, address_line1, address_line2, city, state, zip_code, country, is_default)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING *`,
                [userId, firstName, lastName, email, phone, addressLine1, addressLine2 || '', city, state, zipCode, country || 'USA', saveAsDefault]
            );
        }

        if (!shippingAddress || shippingAddress.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid shipping address' });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = cartItems.rows.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return {
                product_id: item.product_id,
                product_name: item.name,
                price: item.price,
                quantity: item.quantity,
                image_url: item.image_url,
                size: item.size || null,
                color: item.color || null
            };
        });

        const shippingFee = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08; // 8% tax
        const totalAmount = subtotal + shippingFee + tax;

        // Create order in database
        const order = await client.query(
            `INSERT INTO orders 
             (user_id, total_amount, shipping_fee, tax_amount, status, payment_method, shipping_address_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [userId, totalAmount, shippingFee, tax, 'pending', paymentMethod, shippingAddress.rows[0].id]
        );

        const orderId = order.rows[0].id;

        // Insert order items
        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items 
                 (order_id, product_id, product_name, price, quantity, image_url, size, color)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [orderId, item.product_id, item.product_name, item.price, item.quantity, item.image_url, item.size, item.color]
            );

            // Update product stock
            await client.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        // Create Stripe checkout session
        if (paymentMethod === 'card') {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: orderItems.map(item => ({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: item.product_name,
                            images: [item.image_url],
                        },
                        unit_amount: Math.round(item.price * 100), // Convert to cents
                    },
                    quantity: item.quantity,
                })),
                metadata: {
                    orderId: orderId.toString(),
                    userId: userId.toString()
                },
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
                customer_email: req.user.email,
                shipping_address_collection: {
                    allowed_countries: ['US', 'CA', 'GB', 'AU'],
                },
            });

            // Update order with Stripe session ID
            await client.query(
                'UPDATE orders SET stripe_session_id = $1 WHERE id = $2',
                [session.id, orderId]
            );

            await client.query('COMMIT');
            client.release();

            return res.json({
                success: true,
                sessionId: session.id,
                url: session.url,
                orderId: orderId
            });
        } else if (paymentMethod === 'cod') {
            // For Cash on Delivery, just mark as confirmed
            await client.query(
                'UPDATE orders SET status = $1 WHERE id = $2',
                ['confirmed', orderId]
            );

            // Clear cart
            await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

            await client.query('COMMIT');
            client.release();

            return res.json({
                success: true,
                orderId: orderId,
                message: 'Order placed successfully. Cash on Delivery selected.'
            });
        }

        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid payment method' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Checkout error:', error);
        res.status(500).json({
            message: 'Checkout failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

// Verify payment and complete order
export const verifyPayment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { sessionId } = req.body;
        const userId = req.user.id;

        // Verify with Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            await client.query('BEGIN');

            // Update order status
            const order = await client.query(
                `UPDATE orders 
                 SET status = $1, payment_status = $2, stripe_payment_id = $3
                 WHERE stripe_session_id = $4 AND user_id = $5
                 RETURNING *`,
                ['confirmed', 'paid', session.payment_intent, sessionId, userId]
            );

            if (order.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Order not found' });
            }

            // Clear cart
            await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

            await client.query('COMMIT');
            client.release();

            return res.json({
                success: true,
                order: order.rows[0],
                message: 'Payment verified successfully'
            });
        }

        res.status(400).json({ message: 'Payment not completed' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    } finally {
        client.release();
    }
};

// Get order details
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await pool.query(
            `SELECT o.*, 
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', oi.product_name,
                            'price', oi.price,
                            'quantity', oi.quantity,
                            'image_url', oi.image_url,
                            'size', oi.size,
                            'color', oi.color
                        )
                    ) as items,
                    sa.first_name, sa.last_name, sa.email, sa.phone,
                    sa.address_line1, sa.address_line2, sa.city, sa.state, sa.zip_code, sa.country
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
             WHERE o.id = $1 AND o.user_id = $2
             GROUP BY o.id, sa.id`,
            [orderId, userId]
        );

        if (order.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order.rows[0]);

    } catch (error) {
        console.error('Get order details error:', error);
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
        console.error('Get shipping addresses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create shipping address
export const createShippingAddress = async (req, res) => {
    try {
        const {
            firstName, lastName, email, phone,
            addressLine1, addressLine2, city, state, zipCode, country,
            isDefault = false
        } = req.body;

        // If setting as default, unset other defaults
        if (isDefault) {
            await pool.query(
                'UPDATE shipping_addresses SET is_default = false WHERE user_id = $1',
                [req.user.id]
            );
        }

        const address = await pool.query(
            `INSERT INTO shipping_addresses 
             (user_id, first_name, last_name, email, phone, address_line1, address_line2, city, state, zip_code, country, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [req.user.id, firstName, lastName, email, phone, addressLine1, addressLine2 || '',
                city, state, zipCode, country || 'USA', isDefault]
        );

        res.status(201).json(address.rows[0]);
    } catch (error) {
        console.error('Create shipping address error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update shipping address
export const updateShippingAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName, lastName, email, phone,
            addressLine1, addressLine2, city, state, zipCode, country,
            isDefault = false
        } = req.body;

        // Check if address belongs to user
        const existingAddress = await pool.query(
            'SELECT * FROM shipping_addresses WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingAddress.rows.length === 0) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await pool.query(
                'UPDATE shipping_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
                [req.user.id, id]
            );
        }

        const address = await pool.query(
            `UPDATE shipping_addresses 
             SET first_name = $1, last_name = $2, email = $3, phone = $4,
                 address_line1 = $5, address_line2 = $6, city = $7, state = $8,
                 zip_code = $9, country = $10, is_default = $11, updated_at = CURRENT_TIMESTAMP
             WHERE id = $12 AND user_id = $13
             RETURNING *`,
            [firstName, lastName, email, phone, addressLine1, addressLine2 || '',
                city, state, zipCode, country || 'USA', isDefault, id, req.user.id]
        );

        res.json(address.rows[0]);
    } catch (error) {
        console.error('Update shipping address error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete shipping address
export const deleteShippingAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM shipping_addresses WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Delete shipping address error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get checkout summary (for preview)
export const getCheckoutSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get cart items
        const cartItems = await pool.query(
            `SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity 
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
                image_url: item.image_url,
                size: item.size,
                color: item.color,
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
        console.error('Get checkout summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Stripe webhook handler
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutSessionCompleted(session);
            break;
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handlePaymentIntentSucceeded(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            await handlePaymentFailed(failedPayment);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

// Helper functions for webhooks
const handleCheckoutSessionCompleted = async (session) => {
    try {
        await pool.query(
            `UPDATE orders 
             SET status = 'confirmed', 
                 payment_status = 'paid',
                 stripe_payment_id = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE stripe_session_id = $2`,
            [session.payment_intent, session.id]
        );

        // Clear user's cart
        const userId = session.metadata.userId;
        await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    } catch (error) {
        console.error('Handle checkout session completed error:', error);
    }
};

const handlePaymentIntentSucceeded = async (paymentIntent) => {
    try {
        await pool.query(
            `UPDATE orders 
             SET payment_status = 'paid',
                 updated_at = CURRENT_TIMESTAMP
             WHERE stripe_payment_id = $1`,
            [paymentIntent.id]
        );
    } catch (error) {
        console.error('Handle payment intent succeeded error:', error);
    }
};

const handlePaymentFailed = async (paymentIntent) => {
    try {
        await pool.query(
            `UPDATE orders 
             SET status = 'failed', 
                 payment_status = 'failed',
                 updated_at = CURRENT_TIMESTAMP
             WHERE stripe_payment_id = $1`,
            [paymentIntent.id]
        );
    } catch (error) {
        console.error('Handle payment failed error:', error);
    }
};