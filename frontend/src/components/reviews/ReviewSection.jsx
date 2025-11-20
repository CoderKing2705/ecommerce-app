import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Filter, ThumbsUp, Image as ImageIcon, Edit3, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reviewsAPI } from '../../utils/api';
import ReviewForm from './ReviewForm';
import ReviewImagesModal from './ReviewImagesModal';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

// Helper function to safely handle ratings
const getSafeRating = (rating) => {
    const numRating = parseFloat(rating);
    return !isNaN(numRating) ? numRating : 0;
};

const formatRating = (rating) => {
    const safeRating = getSafeRating(rating);
    return safeRating > 0 ? safeRating.toFixed(1) : '0.0';
};

const ReviewSection = ({ productId, product }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [sortBy, setSortBy] = useState('recent');
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [ratingDistribution, setRatingDistribution] = useState([]);
    const [selectedImagesReview, setSelectedImagesReview] = useState(null);
    const { user } = useAuth();

    // Use the helper functions
    const safeRating = getSafeRating(product.average_rating);
    const displayRating = formatRating(product.average_rating);

    useEffect(() => {
        fetchReviews();
    }, [productId, sortBy, currentPage]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewsAPI.getReviews(productId, {
                page: currentPage,
                limit: 5,
                sort: sortBy
            });
            setReviews(response.data.data.reviews);
            setPagination(response.data.data.pagination);
            setRatingDistribution(response.data.data.ratingDistribution);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmitted = (newReview) => {
        setReviews(prev => [newReview, ...prev]);
        setShowReviewForm(false);
        fetchReviews(); // Refresh to get updated stats
    };

    const handleReviewUpdated = (updatedReview) => {
        setReviews(prev => prev.map(review =>
            review.id === updatedReview.id ? updatedReview : review
        ));
        setEditingReview(null);
        fetchReviews(); // Refresh to get updated stats
    };

    const handleReviewDeleted = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            await reviewsAPI.deleteReview(reviewId);
            setReviews(prev => prev.filter(review => review.id !== reviewId));
            toast.success('Review deleted successfully');
            fetchReviews(); // Refresh to get updated stats
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Failed to delete review');
        }
    };

    const handleHelpfulClick = async (reviewId) => {
        if (!user) {
            toast.error('Please login to mark reviews as helpful');
            return;
        }

        try {
            const response = await reviewsAPI.markHelpful(reviewId);
            setReviews(prev => prev.map(review =>
                review.id === reviewId
                    ? { ...review, helpful_count: response.data.data.helpfulCount }
                    : review
            ));
        } catch (error) {
            console.error('Error marking review as helpful:', error);
            toast.error('Failed to update helpful vote');
        }
    };

    const userReview = reviews.find(review => review.user_id === user?.id);

    const calculateRatingPercentage = (rating) => {
        const total = ratingDistribution.reduce((sum, item) => sum + item.count, 0);
        const ratingItem = ratingDistribution.find(item => item.rating === rating);
        return total > 0 ? ((ratingItem?.count || 0) / total) * 100 : 0;
    };

    return (
        <div className="mt-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                    <p className="text-gray-600 mt-1">
                        {product.review_count || 0} reviews • {displayRating} out of 5
                    </p>
                </div>

                {user && !userReview && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mt-4 lg:mt-0"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {/* Rating Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Overall Rating */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900 mb-2">
                            {displayRating}
                        </div>
                        <div className="flex justify-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-5 w-5 ${star <= Math.round(safeRating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-gray-600">
                            Based on {product.review_count || 0} reviews
                        </p>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center">
                                <span className="text-sm text-gray-600 w-8">{rating} star</span>
                                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-yellow-400 h-2 rounded-full"
                                        style={{ width: `${calculateRatingPercentage(rating)}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-600 w-12">
                                    {calculateRatingPercentage(rating).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Review Form Modal */}
            <AnimatePresence>
                {(showReviewForm || editingReview) && (
                    <ReviewForm
                        productId={productId}
                        existingReview={editingReview}
                        onClose={() => {
                            setShowReviewForm(false);
                            setEditingReview(null);
                        }}
                        onSubmit={editingReview ? handleReviewUpdated : handleReviewSubmitted}
                    />
                )}
            </AnimatePresence>

            {/* Reviews Filter and Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
                    {pagination.totalItems || 0} Reviews
                </h3>
                <div className="flex items-center space-x-4">
                    <select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="helpful">Most Helpful</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {loading ? (
                    <LoadingSpinner text="Loading reviews..." />
                ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                        <ReviewItem
                            key={review.id}
                            review={review}
                            productId={productId}
                            currentUserId={user?.id}
                            onEdit={setEditingReview}
                            onDelete={handleReviewDeleted}
                            onHelpfulClick={handleHelpfulClick}
                            onViewImages={setSelectedImagesReview}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                        <p className="text-gray-600 mb-4">Be the first to review this product!</p>
                        {user && (
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Write the First Review
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                            Page {currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                            disabled={currentPage === pagination.totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Review Images Modal */}
            <AnimatePresence>
                {selectedImagesReview && (
                    <ReviewImagesModal
                        review={selectedImagesReview}
                        productId={productId} // ✅ PASS productId here
                        onClose={() => setSelectedImagesReview(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ReviewItem = ({ review, currentUserId, onEdit, onDelete, onHelpfulClick, onViewImages, productId }) => {
    const [imageCount, setImageCount] = useState(0);

    useEffect(() => {
        const fetchImageCount = async () => {
            try {
                // ✅ PASS both productId and review.id
                const response = await reviewsAPI.getReviewImages(productId, review.id);
                setImageCount(response.data.data.length);
            } catch (error) {
                console.error('Error fetching review images:', error);
            }
        };
        fetchImageCount();
    }, [review.id, productId]);

    const canEdit = currentUserId === review.user_id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
            {/* Review Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                    <img
                        src={review.avatar_url || '/default-avatar.png'}
                        alt={review.user_name}
                        className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                        <h4 className="font-semibold text-gray-900">{review.user_name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            {review.is_verified_purchase && (
                                <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Verified Purchase
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {canEdit && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onEdit(review)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit review"
                        >
                            <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(review.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete review"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Review Title and Content */}
            {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
            )}
            <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

            {/* Review Images */}
            {imageCount > 0 && (
                <div className="mb-4">
                    <button
                        onClick={() => onViewImages(review)}
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        View {imageCount} photo{imageCount > 1 ? 's' : ''}
                    </button>
                </div>
            )}

            {/* Helpful Section */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                    onClick={() => onHelpfulClick(review.id)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful ({review.helpful_count})</span>
                </button>
            </div>
        </motion.div>
    );
};

export default ReviewSection;