import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Package, CreditCard, User, TrendingUp, Trash2, Plus, Minus } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const {
        cart,
        wishlist,
        getCartTotal,
        getCartItemsCount,
        removeFromCart,
        removeFromWishlist,
        updateCartQuantity,
        addToCart
    } = useCart();

    const [activeTab, setActiveTab] = useState('overview');

    const totalCartValue = getCartTotal();
    const cartItemsCount = getCartItemsCount();

    const handleRemoveFromCart = async (cartItemId) => {
        await removeFromCart(cartItemId);
    };

    const handleRemoveFromWishlist = async (wishlistItemId) => {
        await removeFromWishlist(wishlistItemId);
    };

    const handleIncreaseQuantity = async (cartItem) => {
        await updateCartQuantity(cartItem.id, cartItem.quantity + 1);
    };

    const handleDecreaseQuantity = async (cartItem) => {
        await updateCartQuantity(cartItem.id, cartItem.quantity - 1);
    };

    const handleMoveToCart = async (wishlistItem) => {
        // Add to cart and remove from wishlist
        await addToCart(wishlistItem, 1);
        await removeFromWishlist(wishlistItem.id);
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
                    <p className="text-gray-600 text-lg">Welcome back, {user?.name}! Here's your shopping overview.</p>
                </motion.div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                    >
                        <div className="flex items-center">
                            <ShoppingCart className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Cart Items</p>
                                <p className="text-2xl font-bold text-gray-800">{cartItemsCount}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                    >
                        <div className="flex items-center">
                            <Heart className="h-8 w-8 text-pink-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Wishlist Items</p>
                                <p className="text-2xl font-bold text-gray-800">{wishlist.length}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                    >
                        <div className="flex items-center">
                            <CreditCard className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Cart Value</p>
                                <p className="text-2xl font-bold text-gray-800">${totalCartValue.toFixed(2)}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                    >
                        <div className="flex items-center">
                            <User className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Member Since</p>
                                <p className="text-2xl font-bold text-gray-800">{new Date().getFullYear()}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {['overview', 'cart', 'wishlist', 'activity'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center py-4 px-6 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab === 'overview' && <TrendingUp className="h-5 w-5 mr-2" />}
                                    {tab === 'cart' && <ShoppingCart className="h-5 w-5 mr-2" />}
                                    {tab === 'wishlist' && <Heart className="h-5 w-5 mr-2" />}
                                    {tab === 'activity' && <Package className="h-5 w-5 mr-2" />}
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
                                <div className="space-y-4">
                                    {cart.slice(0, 3).map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center p-4 border border-gray-200 rounded-lg"
                                        >
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="h-12 w-12 object-cover rounded-md"
                                            />
                                            <div className="ml-4 flex-1">
                                                <h4 className="font-medium text-gray-800">{item.name}</h4>
                                                <p className="text-gray-600 text-sm">Added to cart • Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {wishlist.slice(0, 3).map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center p-4 border border-gray-200 rounded-lg"
                                        >
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="h-12 w-12 object-cover rounded-md"
                                            />
                                            <div className="ml-4 flex-1">
                                                <h4 className="font-medium text-gray-800">{item.name}</h4>
                                                <p className="text-gray-600 text-sm">Added to wishlist</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-800">${item.price}</p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {(cart.length === 0 && wishlist.length === 0) && (
                                        <div className="text-center py-8">
                                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No recent activity</p>
                                            <p className="text-gray-400 text-sm mt-1">Start shopping to see your activity here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'cart' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Cart</h3>
                                {cart.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Your cart is empty</p>
                                        <p className="text-gray-400 text-sm mt-1">Add some products to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="h-16 w-16 object-cover rounded-md"
                                                    />
                                                    <div className="ml-4">
                                                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                                                        <p className="text-gray-600">Size: {item.size} • Color: {item.color}</p>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <button
                                                                onClick={() => handleDecreaseQuantity(item)}
                                                                className={`p-1 rounded-md border border-gray-300 hover:bg-gray-100 ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                                                                    }`}
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </button>
                                                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => handleIncreaseQuantity(item)}
                                                                className={`p-1 rounded-md border border-gray-300 hover:bg-gray-100 ${item.quantity >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                                                                    }`}
                                                                disabled={item.quantity >= 5}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </button>
                                                            {item.quantity >= 5 && (
                                                                <span className="text-xs text-red-600 ml-2">Max 5</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-800">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">${item.price} each</p>
                                                    <button
                                                        onClick={() => handleRemoveFromCart(item.id)}
                                                        className="text-red-600 text-sm hover:text-red-800 mt-2 flex items-center justify-end w-full"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Remove
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                        <div className="border-t pt-4 mt-4">
                                            <div className="flex justify-between items-center text-lg font-semibold">
                                                <span>Total ({cartItemsCount} items):</span>
                                                <span>${totalCartValue.toFixed(2)}</span>
                                            </div>
                                            <button className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                                Proceed to Checkout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'wishlist' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Wishlist</h3>
                                {wishlist.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Your wishlist is empty</p>
                                        <p className="text-gray-400 text-sm mt-1">Add some products to your wishlist</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {wishlist.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                            >
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="h-40 w-full object-cover rounded-md mb-3"
                                                />
                                                <h4 className="font-medium text-gray-800 mb-1">{item.name}</h4>
                                                <p className="text-gray-600 mb-2">${item.price}</p>
                                                <p className="text-sm text-gray-500 mb-3">Size: {item.size} • Color: {item.color}</p>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleMoveToCart(item)}
                                                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors"
                                                    >
                                                        Add to Cart
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFromWishlist(item.id)}
                                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
                                <div className="space-y-4">
                                    {[...cart, ...wishlist]
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .slice(0, 10)
                                        .map((item, index) => (
                                            <motion.div
                                                key={`${item.id}-${index}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center p-4 border border-gray-200 rounded-lg"
                                            >
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="h-12 w-12 object-cover rounded-md"
                                                />
                                                <div className="ml-4 flex-1">
                                                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                                                    <p className="text-gray-600 text-sm">
                                                        {item.quantity ? `Added to cart • Qty: ${item.quantity}` : 'Added to wishlist'} •
                                                        ${item.quantity ? (item.price * item.quantity).toFixed(2) : item.price}
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        {new Date(item.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}

                                    {cart.length === 0 && wishlist.length === 0 && (
                                        <div className="text-center py-8">
                                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No activity yet</p>
                                            <p className="text-gray-400 text-sm mt-1">Your shopping activity will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;