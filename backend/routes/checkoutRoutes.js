import express from 'express';
import {
    createCheckoutSession,
    verifyPayment,
    getOrderDetails,
    getShippingAddresses,
    createShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    getCheckoutSummary,
    stripeWebhook
} from '../controllers/checkoutController.js';

const router = express.Router();

// Stripe webhook (must be before body parser middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.get('/summary', getCheckoutSummary);
router.post('/create-session', createCheckoutSession);
router.post('/verify-payment', verifyPayment);
router.get('/order/:orderId', getOrderDetails);

// Shipping addresses
router.get('/shipping-addresses', getShippingAddresses);
router.post('/shipping-addresses', createShippingAddress);
router.put('/shipping-addresses/:id', updateShippingAddress);
router.delete('/shipping-addresses/:id', deleteShippingAddress);

export default router;