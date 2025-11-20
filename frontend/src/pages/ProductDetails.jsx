import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI, handleAPIError } from '../utils/api';
import {
    ArrowLeft,
    ShoppingCart,
    Heart,
    Star,
    Truck,
    Shield,
    RotateCcw,
    Package,
    Check,
    X
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import ReviewSection from '../components/reviews/ReviewSection';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, addToWishlist, isInCart, isInWishlist } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [imageLoading, setImageLoading] = useState(true);

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await productsAPI.getById(id);
                setProduct(response.data);
            } catch (error) {
                console.error('Error fetching product:', error);
                setError(handleAPIError(error));
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    // Mock multiple images for the product (in real app, this would come from backend)
    const productImages = product ? [
        product.image_url,
        product.image_url, // In real app, you'd have multiple images
        product.image_url,
        product.image_url
    ] : [];

    const handleAddToCart = async () => {
        if (!user) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        try {
            for (let i = 0; i < quantity; i++) {
                await addToCart(product);
            }
            toast.success(`Added ${quantity} ${product.name} to cart!`);
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    const handleAddToWishlist = async () => {
        if (!user) {
            toast.error('Please login to add items to wishlist');
            navigate('/login');
            return;
        }

        try {
            await addToWishlist(product);
        } catch (error) {
            console.error('Error adding to wishlist:', error);
        }
    };

    const handleQuantityChange = (newQuantity) => {
        if (newQuantity < 1) return;
        if (product && newQuantity > product.stock_quantity) {
            toast.error(`Only ${product.stock_quantity} items available`);
            return;
        }
        setQuantity(newQuantity);
    };

    const isProductInCart = product ? isInCart(product.id) : false;
    const isProductInWishlist = product ? isInWishlist(product.id) : false;

    if (loading) {
        return <LoadingSpinner text="Loading product details..." />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Go Back
                        </button>
                        <Link
                            to="/products"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
                    <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
                    <Link
                        to="/products"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
                    <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium truncate">{product.name}</span>
                </nav>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Products
                </button>

                {/* Product Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                <img
                                    src={productImages[selectedImage]}
                                    alt={product.name}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                                        }`}
                                    onLoad={() => setImageLoading(false)}
                                />

                                {/* Stock Badge */}
                                <div className="absolute top-4 left-4">
                                    {product.stock_quantity > 0 ? (
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            In Stock ({product.stock_quantity} available)
                                        </span>
                                    ) : (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            Out of Stock
                                        </span>
                                    )}
                                </div>

                                {/* Category Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        {product.category}
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnail Images */}
                            {productImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-3">
                                    {productImages.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                                                ? 'border-blue-600 ring-2 ring-blue-200'
                                                : 'border-transparent hover:border-gray-300'
                                                }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${product.name} view ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            {/* Brand and Name */}
                            <div>
                                <span className="text-blue-600 font-semibold text-lg">{product.brand}</span>
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">
                                    {product.name}
                                </h1>

                                {/* Rating */}
                                <div className="flex items-center mt-3 space-x-4">
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-5 w-5 ${star <= 4
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-gray-600">(48 reviews)</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline space-x-3">
                                <span className="text-4xl font-bold text-gray-900">
                                    ${product.price}
                                </span>
                                {product.originalPrice && (
                                    <span className="text-xl text-gray-500 line-through">
                                        ${product.originalPrice}
                                    </span>
                                )}
                                {product.originalPrice && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                                        Save ${(product.originalPrice - product.price).toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {product.description || 'No description available for this product.'}
                                </p>
                            </div>

                            {/* Product Details */}
                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
                                <div>
                                    <span className="text-gray-600 text-sm">Size</span>
                                    <p className="font-medium">{product.size}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600 text-sm">Color</span>
                                    <p className="font-medium">{product.color}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600 text-sm">Category</span>
                                    <p className="font-medium">{product.category}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600 text-sm">Brand</span>
                                    <p className="font-medium">{product.brand}</p>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button
                                            onClick={() => handleQuantityChange(quantity - 1)}
                                            disabled={quantity <= 1}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="px-4 py-2 border-l border-r border-gray-300 font-medium min-w-12 text-center">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => handleQuantityChange(quantity + 1)}
                                            disabled={product.stock_quantity && quantity >= product.stock_quantity}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {product.stock_quantity} available
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock_quantity === 0 || isProductInCart}
                                    className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${isProductInCart
                                        ? 'bg-green-500 text-white cursor-default'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {isProductInCart ? 'Added to Cart' : 'Add to Cart'}
                                </button>

                                <button
                                    onClick={handleAddToWishlist}
                                    disabled={isProductInWishlist}
                                    className={`py-4 px-6 border rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${isProductInWishlist
                                        ? 'border-red-500 bg-red-50 text-red-600 cursor-default'
                                        : 'border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                >
                                    <Heart className={`h-5 w-5 ${isProductInWishlist ? 'fill-current' : ''}`} />
                                    {isProductInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                                </button>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                                <div className="flex items-center space-x-3 text-gray-600">
                                    <Truck className="h-6 w-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">Free Shipping</p>
                                        <p className="text-sm">On orders over $50</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-600">
                                    <RotateCcw className="h-6 w-6 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">Easy Returns</p>
                                        <p className="text-sm">30-day return policy</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-600">
                                    <Shield className="h-6 w-6 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">Secure Payment</p>
                                        <p className="text-sm">100% secure payment</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Related Products Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-16"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
                        <Link
                            to="/products"
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                            View All Products
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* This would be populated with related products from API */}
                        <div className="text-center py-8 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Related products will appear here</p>
                        </div>
                    </div>
                </motion.div>

                <ReviewSection productId={id} product={product} />
            </div>
        </div>
    );
};

export default ProductDetails;