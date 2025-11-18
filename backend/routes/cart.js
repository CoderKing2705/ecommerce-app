import express from 'express';
import { getCart, addToCart, removeFromCart, updateCartItem } from '../controllers/cartController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getCart);
router.post('/', auth, addToCart);
router.put('/:id', auth, updateCartItem);
router.delete('/:id', auth, removeFromCart);

export default router;