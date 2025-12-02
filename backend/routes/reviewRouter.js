import express from 'express';
import { pool } from '../config/database.js';
import { auth } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router({ mergeParams: true }); // ✅ ADD THIS

// Get reviews for a product
router.get('/', async (req, res) => {
    try {
        const { productId } = req.params; // Now this will work

        const {
            page = 1,
            limit = 10,
            sort = 'recent'
        } = req.query;

        const offset = (page - 1) * limit;
        let queryParams = [productId];
        let orderBy = 'r.created_at DESC';

        if (sort === 'helpful') orderBy = 'r.helpful_count DESC, r.created_at DESC';
        if (sort === 'highest') orderBy = 'r.rating DESC, r.created_at DESC';
        if (sort === 'lowest') orderBy = 'r.rating ASC, r.created_at DESC';

        const baseQuery = `
            SELECT 
                r.*,
                u.name as user_name,
                COUNT(ri.id) as image_count,
                EXISTS(
                    SELECT 1 FROM orders o 
                    JOIN order_items oi ON o.id = oi.order_id 
                    WHERE o.user_id = r.user_id AND oi.product_id = r.product_id
                ) as is_verified_purchase
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_images ri ON r.id = ri.review_id
            WHERE r.product_id = $1 AND r.is_approved = true
            GROUP BY r.id, u.name
            ORDER BY ${orderBy}
        `;

        // Count query
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as filtered`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // Main query with pagination
        const resultQuery = baseQuery + ` LIMIT $2 OFFSET $3`;
        queryParams.push(limit, offset);

        const result = await pool.query(resultQuery, queryParams);

        // Get rating distribution
        const ratingDistribution = await pool.query(
            `SELECT 
                rating,
                COUNT(*) as count
             FROM reviews 
             WHERE product_id = $1 AND is_approved = true
             GROUP BY rating
             ORDER BY rating DESC`,
            [productId]
        );

        res.json({
            success: true,
            data: {
                reviews: result.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit)
                },
                ratingDistribution: ratingDistribution.rows
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews',
            details: error.message
        });
    }
});

// Create a new review
router.post('/', auth, upload.array('images', 5), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ✅ FIX: Get productId from req.params (now available due to mergeParams: true)
        const { productId } = req.params;

        const { rating, title, comment } = req.body;
        const userId = req.user.id;

        if (!productId) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await client.query(
            'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
            [productId, userId]
        );

        if (existingReview.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'You have already reviewed this product'
            });
        }

        // Check if user purchased the product (for verified purchase badge)
        const purchaseCheck = await client.query(
            `SELECT 1 FROM orders o 
             JOIN order_items oi ON o.id = oi.order_id 
             WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'`,
            [userId, productId]
        );
        const isVerifiedPurchase = purchaseCheck.rows.length > 0;

        // Insert review
        const reviewResult = await client.query(
            `INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [productId, userId, rating, title, comment, isVerifiedPurchase]
        );

        // Handle review images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await client.query(
                    'INSERT INTO review_images (review_id, image_url) VALUES ($1, $2)',
                    [reviewResult.rows[0].id, file.path]
                );
            }
        }

        // Update product rating summary
        await updateProductRatingSummary(client, productId);

        await client.query('COMMIT');

        // Fetch the complete review with user info
        const completeReview = await client.query(
            `SELECT r.*, u.name as user_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.id = $1`,
            [reviewResult.rows[0].id]
        );

        res.status(201).json({
            success: true,
            data: completeReview.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({
            success: false,
            error: 'Failed to create review',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Update a review
router.put('/:reviewId', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user.id;

        // Check if review belongs to user
        const reviewCheck = await client.query(
            'SELECT product_id FROM reviews WHERE id = $1 AND user_id = $2',
            [reviewId, userId]
        );

        if (reviewCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        const productId = reviewCheck.rows[0].product_id;

        // Update review
        const result = await client.query(
            `UPDATE reviews 
             SET rating = $1, title = $2, comment = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [rating, title, comment, reviewId]
        );

        // Update product rating summary
        await updateProductRatingSummary(client, productId);

        await client.query('COMMIT');

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({
            success: false,
            error: 'Failed to update review',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { reviewId } = req.params;
        const userId = req.user.id;

        // Check if review belongs to user or user is admin
        const reviewCheck = await client.query(
            'SELECT product_id FROM reviews WHERE id = $1 AND (user_id = $2 OR $3 = true)',
            [reviewId, userId, req.user.role === 'ADMIN']
        );

        if (reviewCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        const productId = reviewCheck.rows[0].product_id;

        // Delete review
        await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

        // Update product rating summary
        await updateProductRatingSummary(client, productId);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({
            success: false,
            error: 'Failed to delete review',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Mark review as helpful
router.post('/:reviewId/helpful', auth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        // Check if already voted
        const existingVote = await pool.query(
            'SELECT id FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2',
            [reviewId, userId]
        );

        if (existingVote.rows.length > 0) {
            // Remove vote
            await pool.query('DELETE FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
            await pool.query('UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = $1', [reviewId]);
        } else {
            // Add vote
            await pool.query(
                'INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2)',
                [reviewId, userId]
            );
            await pool.query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1', [reviewId]);
        }

        const updatedReview = await pool.query(
            'SELECT helpful_count FROM reviews WHERE id = $1',
            [reviewId]
        );

        res.json({
            success: true,
            data: {
                helpfulCount: updatedReview.rows[0].helpful_count
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update helpful vote',
            details: error.message
        });
    }
});

// Get review images
router.get('/:reviewId/images', async (req, res) => {
    try {
        const { reviewId } = req.params;

        const result = await pool.query(
            'SELECT * FROM review_images WHERE review_id = $1 ORDER BY created_at',
            [reviewId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch review images',
            details: error.message
        });
    }
});

// Helper function to update product rating summary
async function updateProductRatingSummary(client, productId) {
    const stats = await client.query(
        `SELECT 
            AVG(rating) as average_rating,
            COUNT(*) as review_count
         FROM reviews 
         WHERE product_id = $1 AND is_approved = true`,
        [productId]
    );

    await client.query(
        'UPDATE products SET average_rating = $1, review_count = $2 WHERE id = $3',
        [
            parseFloat(stats.rows[0].average_rating) || 0,
            parseInt(stats.rows[0].review_count) || 0,
            productId
        ]
    );
}

export default router;