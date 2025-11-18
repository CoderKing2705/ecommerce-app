import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Calendar, TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

const OrderAnalytics = () => {
    const [dailyData, setDailyData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30'); // days

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
    const STATUS_COLORS = {
        pending: '#FFBB28',
        confirmed: '#0088FE',
        processing: '#00C49F',
        shipped: '#8884D8',
        delivered: '#00C49F',
        cancelled: '#FF8042',
        refunded: '#FF6B6B'
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);

            const [dailyResponse, statusResponse, revenueResponse] = await Promise.all([
                adminAPI.getDailyOrders({ days: timeRange }),
                adminAPI.getStatusDistribution(),
                adminAPI.getRevenueStats({ period: 'month' })
            ]);

            // Initialize with default values to prevent errors
            setTotals({
                total_orders: 0,
                total_revenue: 0,
                average_order_value: 0,
                ...revenueResponse.data.totals
            });

            if (dailyResponse.data.success) setDailyData(dailyResponse.data.data || []);
            if (statusResponse.data.success) setStatusData(statusResponse.data.data || []);
            if (revenueResponse.data.success) {
                setRevenueData(revenueResponse.data.data || []);
                setTotals(prev => ({
                    ...prev,
                    ...revenueResponse.data.totals
                }));
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');

            // Set default values on error
            setDailyData([]);
            setStatusData([]);
            setRevenueData([]);
            setTotals({
                total_orders: 0,
                total_revenue: 0,
                average_order_value: 0
            });
        } finally {
            setLoading(false);
        }
    };

    // Format daily data for charts
    const formattedDailyData = dailyData.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }),
        fullDate: item.date,
        orders: parseInt(item.order_count) || 0,
        revenue: parseFloat(item.total_revenue) || 0,
        delivered: parseInt(item.delivered_orders) || 0,
        cancelled: parseInt(item.cancelled_orders) || 0
    }));


    // Format status data for pie chart
    const formattedStatusData = statusData.map(item => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        value: parseInt(item.count) || 0,
        percentage: parseFloat(item.percentage) || 0,
        color: STATUS_COLORS[item.status] || COLORS[0]
    }));

    if (loading) {
        return <LoadingSpinner text="Loading analytics..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Order Analytics</h1>
                            <p className="text-gray-600 mt-2">
                                Track order performance and revenue metrics
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {parseInt(totals.total_orders) || 0}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Total Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    ${(parseFloat(totals.total_revenue) || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Avg Order Value Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    ${(parseFloat(totals.average_order_value) || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <div className="flex items-center">
                            <Calendar className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Period</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {timeRange} days
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Daily Orders Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Daily Orders Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formattedDailyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="orders"
                                    name="Total Orders"
                                    fill="#3B82F6"
                                    radius={[2, 2, 0, 0]}
                                />
                                <Bar
                                    dataKey="delivered"
                                    name="Delivered"
                                    fill="#10B981"
                                    radius={[2, 2, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Revenue Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Revenue Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={formattedDailyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Daily Revenue"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: '#10B981' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Order Status Distribution */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Order Status Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={formattedStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {formattedStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Recent Order Activity
                        </h3>
                        <div className="space-y-3">
                            {formattedDailyData.slice(-5).reverse().map((day, index) => ( // Reverse to show latest first
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">
                                        {day.date}
                                    </span>
                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <span>{day.orders} orders</span>
                                        <span>${(parseFloat(day.revenue) || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default OrderAnalytics;