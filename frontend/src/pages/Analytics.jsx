import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BarChart, PieChart, TrendingUp, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

const Analytics = () => {
    const { user } = useAuth();

    // Mock analytics data
    const userAnalytics = {
        totalOrders: 12,
        totalSpent: 1250.75,
        favoriteCategory: 'T-Shirts',
        itemsInCart: 3,
        wishlistItems: 7,
        monthlySpending: [120, 180, 210, 150, 300, 280, 320, 290, 250, 200, 180, 220]
    };

    const adminAnalytics = {
        totalUsers: 1542,
        totalProducts: 89,
        totalOrders: 842,
        revenue: 75420.50,
        topProducts: [
            { name: 'Classic White T-Shirt', sales: 142 },
            { name: 'Designer Blue Jeans', sales: 98 },
            { name: 'Sports Jacket', sales: 76 },
            { name: 'Running Shoes', sales: 65 },
            { name: 'Summer Dress', sales: 54 }
        ],
        userActivity: [
            { month: 'Jan', newUsers: 120, orders: 65 },
            { month: 'Feb', newUsers: 145, orders: 78 },
            { month: 'Mar', newUsers: 132, orders: 82 },
            { month: 'Apr', newUsers: 158, orders: 91 },
            { month: 'May', newUsers: 167, orders: 105 },
            { month: 'Jun', newUsers: 182, orders: 124 }
        ]
    };

    const isAdmin = user?.role === 'ADMIN';
    const analyticsData = isAdmin ? adminAnalytics : userAnalytics;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        {isAdmin ? 'Store Analytics' : 'Your Shopping Analytics'}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        {isAdmin
                            ? 'Comprehensive overview of your store performance'
                            : 'Track your shopping habits and preferences'
                        }
                    </p>
                </motion.div>

                {isAdmin ? (
                    /* Admin Analytics */
                    <div className="space-y-8">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                            >
                                <div className="flex items-center">
                                    <Users className="h-8 w-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Total Users</p>
                                        <p className="text-2xl font-bold text-gray-800">{analyticsData.totalUsers}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                            >
                                <div className="flex items-center">
                                    <Package className="h-8 w-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Total Products</p>
                                        <p className="text-2xl font-bold text-gray-800">{analyticsData.totalProducts}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                            >
                                <div className="flex items-center">
                                    <ShoppingCart className="h-8 w-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Total Orders</p>
                                        <p className="text-2xl font-bold text-gray-800">{analyticsData.totalOrders}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                            >
                                <div className="flex items-center">
                                    <DollarSign className="h-8 w-8 text-yellow-600" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Revenue</p>
                                        <p className="text-2xl font-bold text-gray-800">${analyticsData.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Top Products */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-6 rounded-xl shadow-md"
                            >
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
                                <div className="space-y-3">
                                    {analyticsData.topProducts.map((product, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-700">{product.name}</span>
                                            <span className="font-semibold text-gray-800">{product.sales} sales</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* User Activity */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-6 rounded-xl shadow-md"
                            >
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
                                <div className="space-y-3">
                                    {analyticsData.userActivity.map((month, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-700 font-medium">{month.month}</span>
                                            <div className="flex space-x-4">
                                                <span className="text-sm text-blue-600">{month.newUsers} users</span>
                                                <span className="text-sm text-green-600">{month.orders} orders</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                ) : (
                    /* User Analytics */
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-xl shadow-md text-center"
                            >
                                <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-800">{analyticsData.totalOrders}</p>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-xl shadow-md text-center"
                            >
                                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">Total Spent</p>
                                <p className="text-2xl font-bold text-gray-800">${analyticsData.totalSpent}</p>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-xl shadow-md text-center"
                            >
                                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">Favorite Category</p>
                                <p className="text-2xl font-bold text-gray-800">{analyticsData.favoriteCategory}</p>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-xl shadow-md"
                        >
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Shopping Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Items in Cart</span>
                                    <span className="font-semibold text-gray-800">{analyticsData.itemsInCart}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Wishlist Items</span>
                                    <span className="font-semibold text-gray-800">{analyticsData.wishlistItems}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Average Order Value</span>
                                    <span className="font-semibold text-gray-800">
                                        ${(analyticsData.totalSpent / analyticsData.totalOrders).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;