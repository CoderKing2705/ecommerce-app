import express from 'express';
import {
    createCheckoutSession,
    getOrderDetails,
    getShippingAddresses,
    createShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    getCheckoutSummary
} from '../controllers/checkoutController-simple.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', auth, getCheckoutSummary);
router.post('/create-session', auth, createCheckoutSession);
router.get('/order/:orderId', auth, getOrderDetails);

// Shipping addresses
router.get('/shipping-addresses', auth, getShippingAddresses);
router.post('/shipping-addresses', auth, createShippingAddress);
router.put('/shipping-addresses/:id', auth, updateShippingAddress);
router.delete('/shipping-addresses/:id', auth, deleteShippingAddress);

export default router;