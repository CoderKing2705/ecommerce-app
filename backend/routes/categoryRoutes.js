import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats
} from '../controllers/categoryController.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/stats', getCategoryStats);

// Admin routes
router.post('/', auth, admin, createCategory);
router.put('/:oldName', auth, admin, updateCategory);
router.delete('/:name', auth, admin, deleteCategory);

export default router;