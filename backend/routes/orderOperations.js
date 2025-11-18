import express from 'express';
import { auth, adminAuth } from '../middleware/auth.js';
import {
    cancelOrder,
    processRefund,
    bulkUpdateOrders,
    updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

// User routes
router.put('/:id/cancel', auth, cancelOrder);

// Admin routes
router.put('/:id/status', adminAuth, updateOrderStatus);
router.put('/:id/refund', adminAuth, processRefund);
router.post('/bulk', adminAuth, bulkUpdateOrders);

export default router;