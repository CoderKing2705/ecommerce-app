import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getSearchSuggestions,
    getFilterOptions
} from '../controllers/productController.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts); // Advanced search with filters
router.get('/search/suggestions', getSearchSuggestions); // Search suggestions
router.get('/filters/options', getFilterOptions); // Filter options
router.get('/:id', getProductById);

// Admin routes
router.post('/', auth, admin, createProduct);
router.put('/:id', auth, admin, updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

export default router;