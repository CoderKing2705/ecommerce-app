import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product, onAddToCart, onAddToWishlist, onViewDetails }) => {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const { user } = useAuth();

    const handleAddToCart = (e) => {
        e.stopPropagation();
        if (onAddToCart) {
            onAddToCart(product);
        }
    };

    const handleAddToWishlist = (e) => {
        e.stopPropagation();
        setIsWishlisted(!isWishlisted);
        if (onAddToWishlist) {
            onAddToWishlist(product);
        }
    };

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(product);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
            {/* Product Image */}
            <div className="relative overflow-hidden">
                <div className="aspect-w-1 aspect-h-1 w-full h-48 bg-gray-200">
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    <img
                        src={product.image_url || product.image}
                        alt={product.name}
                        className={`w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={handleAddToWishlist}
                        className={`p-2 rounded-full shadow-md transition-colors ${isWishlisted
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                            }`}
                    >
                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>

                    <button
                        onClick={handleViewDetails}
                        className="p-2 bg-white text-gray-600 rounded-full shadow-md hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {product.category}
                    </span>
                </div>

                {/* Stock Status */}
                {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                    <div className="absolute bottom-3 left-3">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Low Stock
                        </span>
                    </div>
                )}

                {product.stock_quantity === 0 && (
                    <div className="absolute bottom-3 left-3">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                <div className="mb-2">
                    <span className="text-sm text-blue-600 font-semibold">
                        {product.brand}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                        {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                        {product.description}
                    </p>
                </div>

                {/* Product Details */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>Size: {product.size}</span>
                    <span>Color: {product.color}</span>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-2xl font-bold text-gray-900">
                            ${product.price}
                        </span>
                        {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                                ${product.originalPrice}
                            </span>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleAddToCart}
                            disabled={product.stock_quantity === 0 || !user}
                            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            title={!user ? "Please login to add to cart" : "Add to cart"}
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Add to Cart Button - Mobile */}
                <button
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0 || !user}
                    className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 md:hidden"
                >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                </button>
            </div>
        </motion.div>
    );
};

export default ProductCard;