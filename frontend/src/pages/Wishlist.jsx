import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Plus } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Wishlist = () => {
    const { wishlist, loading, removeFromWishlist, addToCart } = useCart();
    const { user } = useAuth();

    const handleRemoveFromWishlist = async (item) => {
        await removeFromWishlist(item.id);
    };

    const handleMoveToCart = async (item) => {
        await addToCart(item, 1);
        await removeFromWishlist(item.id);
    };

    const handleAddToCartAndKeep = async (item) => {
        await addToCart(item, 1);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Please Login</h2>
                    <p className="text-gray-600 mb-4">You need to be logged in to view your wishlist</p>
                    <Link
                        to="/login"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Login to Continue
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingSpinner text="Loading your wishlist..." />;
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/products"
                            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back to Products
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800">My Wishlist</h1>
                            <p className="text-gray-600 mt-2">
                                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-pink-600">
                        <Heart className="h-8 w-8" />
                        <span className="text-2xl font-bold">{wishlist.length}</span>
                    </div>
                </div>

                {/* Wishlist Items */}
                {wishlist.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100"
                    >
                        <div className="max-w-md mx-auto">
                            <Heart className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your wishlist is empty</h3>
                            <p className="text-gray-600 mb-8">
                                Start saving your favorite items! Click the heart icon on any product to add it here.
                            </p>
                            <Link
                                to="/products"
                                className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 transition-colors inline-flex items-center"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Explore Products
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlist.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
                            >
                                {/* Product Image */}
                                <div className="relative overflow-hidden">
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    {/* Action Buttons */}
                                    <div className="absolute top-3 right-3 flex flex-col space-y-2">
                                        <button
                                            onClick={() => handleRemoveFromWishlist(item)}
                                            className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors"
                                            title="Remove from wishlist"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-pink-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <div className="mb-3">
                                        <span className="text-sm text-gray-500 font-medium">{item.brand}</span>
                                        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                        <span>Size: {item.size}</span>
                                        <span>Color: {item.color}</span>
                                    </div>

                                    {/* Price and Actions */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl font-bold text-gray-900">
                                            ${item.price}
                                        </span>
                                        <div className="text-sm text-gray-500">
                                            {item.stock_quantity > 0 ? (
                                                <span className="text-green-600">In Stock</span>
                                            ) : (
                                                <span className="text-red-600">Out of Stock</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleMoveToCart(item)}
                                            disabled={item.stock_quantity === 0}
                                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                            Move to Cart
                                        </button>
                                        <button
                                            onClick={() => handleAddToCartAndKeep(item)}
                                            disabled={item.stock_quantity === 0}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                            title="Add to cart but keep in wishlist"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Wishlist Stats */}
                {wishlist.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold mb-2">{wishlist.length}</div>
                                <div className="text-pink-100">Items Saved</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2">
                                    ${wishlist.reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2)}
                                </div>
                                <div className="text-pink-100">Total Value</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-2">
                                    {new Set(wishlist.map(item => item.category)).size}
                                </div>
                                <div className="text-pink-100">Categories</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;