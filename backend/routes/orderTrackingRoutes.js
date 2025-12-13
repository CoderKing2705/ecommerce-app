import express from 'express';
import {
    getOrderTracking,
    addTrackingEvent,
    updateTrackingInfo,
    getEstimatedDelivery,
    handleCarrierWebhook,
    addDeliveryAttempt
} from '../controllers/orderTrackingController.js';
import { adminAuth, auth } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.get('/:orderId', auth, getOrderTracking);
router.get('/:orderId/estimated-delivery', auth, getEstimatedDelivery);

// Admin routes
router.post('/:orderId/tracking-event', adminAuth, addTrackingEvent);
router.put('/:orderId/tracking-info', adminAuth, updateTrackingInfo);
router.post('/:orderId/delivery-attempts', adminAuth, addDeliveryAttempt);

// Webhook (no auth needed for carriers)
router.post('/webhook/carrier', handleCarrierWebhook);

export default router;