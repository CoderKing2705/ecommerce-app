import express from 'express';
import {
    getBillingAddresses,
    createBillingAddress,
    updateBillingAddress,
    deleteBillingAddress,
    getDefaultBillingAddress,
    setDefaultBillingAddress
} from '../controllers/billingAddressController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getBillingAddresses);
router.get('/default', auth, getDefaultBillingAddress);
router.post('/', auth, createBillingAddress);
router.put('/:id', auth, updateBillingAddress);
router.put('/:id/default', auth, setDefaultBillingAddress);
router.delete('/:id', auth, deleteBillingAddress);

export default router;