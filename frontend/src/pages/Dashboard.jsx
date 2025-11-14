import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Package, CreditCard, User, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [cartItems, setCartItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);

    // Mock data - replace with actual API calls
    useEffect(() => {
        const mockCartItems = [
            { id: 1, product: { name: 'Classic White T-Shirt', price: 29.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' }, quantity: 2 },
            { id: 2, product: { name: 'Designer Blue Jeans', price: 89.99, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop' }, quantity: 1 }
        ];

        const mockWishlistItems = [
            { id: 1, product: { name: 'Sports Jacket', price: 129.99, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop' } },
            { id: 2, product: { name: 'Running Shoes', price: 79.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop' } }
        ];

        setCartItems(mockCartItems);
        setWishlistItems(mockWishlistItems);
    }, []);

    const totalCartValue = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

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
                                <p className="text-2xl font-bold text-gray-800">{cartItems.length}</p>
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
                                <p className="text-2xl font-bold text-gray-800">{wishlistItems.length}</p>
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
                                    {cartItems.slice(0, 3).map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center p-4 border border-gray-200 rounded-lg"
                                        >
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="h-12 w-12 object-cover rounded-md"
                                            />
                                            <div className="ml-4 flex-1">
                                                <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                                                <p className="text-gray-600 text-sm">Added to cart</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-800">${item.product.price}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'cart' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Cart</h3>
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Your cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <img
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        className="h-16 w-16 object-cover rounded-md"
                                                    />
                                                    <div className="ml-4">
                                                        <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                                                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-800">
                                                        ${(item.product.price * item.quantity).toFixed(2)}
                                                    </p>
                                                    <button className="text-red-600 text-sm hover:text-red-800 mt-2">
                                                        Remove
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                        <div className="border-t pt-4 mt-4">
                                            <div className="flex justify-between items-center text-lg font-semibold">
                                                <span>Total:</span>
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
                                {wishlistItems.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Your wishlist is empty</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {wishlistItems.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                            >
                                                <img
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    className="h-40 w-full object-cover rounded-md mb-3"
                                                />
                                                <h4 className="font-medium text-gray-800 mb-1">{item.product.name}</h4>
                                                <p className="text-gray-600 mb-3">${item.product.price}</p>
                                                <div className="flex space-x-2">
                                                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors">
                                                        Add to Cart
                                                    </button>
                                                    <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                                                        Remove
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;