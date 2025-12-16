import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    ShoppingBag,
    BarChart3,
    TrendingUp,
    Package,
    UserPlus,
    Activity,
    Calendar
} from 'lucide-react';
import { adminAPI, handleAPIError } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar
} from 'recharts';


const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [chartType, setChartType] = useState('area');
    const [showChart, setShowChart] = useState(false);

    useEffect(() => {
        fetchStats();
        const timer = setTimeout(() => {
            setShowChart(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getStats();
            // Ensure we always have an object, even if response.data is undefined
            setStats(response.data || {
                totalUsers: 0,
                weekUsers: 0,
                totalProducts: 0,
                todayUsers: 0,
                totalOrders: 0,
                productsByCategory: [],
                userSignups: [],
                recentUsers: []
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            setError(handleAPIError(error));
            toast.error('Failed to load dashboard data');
            // Set default stats on error
            setStats({
                totalUsers: 0,
                weekUsers: 0,
                totalProducts: 0,
                todayUsers: 0,
                totalOrders: 0,
                productsByCategory: [],
                userSignups: [],
                recentUsers: []
            });
        } finally {
            setLoading(false);
        }
    };


    const chartData = useMemo(() => {
        if (!stats?.userSignups || stats.userSignups.length === 0) {
            // Generate empty data for the last 30 days if no data exists
            const today = new Date();
            const emptyData = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const formattedDate = date.toISOString().split('T')[0];
                emptyData.push({
                    date: formattedDate,
                    displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    signups: 0
                });
            }
            return emptyData;
        }

        // If we have data from backend, format it properly
        return stats.userSignups.map(day => ({
            date: day.date,
            displayDate: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            signups: parseInt(day.count || 0)
        }));
    }, [stats]);

    const totalSignups = useMemo(() => {
        if (!stats?.userSignups) return 0;
        return stats.userSignups.reduce((total, day) => total + parseInt(day.count || 0), 0);
    }, [stats]);

    // Custom tooltip component for the chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-medium text-gray-900">
                        {new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-blue-600">
                        Signups: <span className="font-bold">{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom tick formatter for XAxis
    const formatXAxis = (tickItem) => {
        const date = new Date(tickItem);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };


    if (loading) {
        return <LoadingSpinner text="Loading admin dashboard..." />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">Error loading dashboard</div>
                    <div className="text-gray-600 mb-4">{error}</div>
                    <button
                        onClick={fetchStats}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
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
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome to your administration panel</p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users */}
                    <motion.div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers || 0}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span>{(stats.weekUsers || 0)} new this week</span>
                        </div>
                    </motion.div>

                    {/* Total Products */}
                    <motion.div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <ShoppingBag className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalProducts || 0}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            Across {(stats.productsByCategory || []).length} categories
                        </div>
                    </motion.div>

                    {/* Total Orders */}
                    <motion.div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            Order management
                        </div>
                    </motion.div>

                    {/* Today's Signups */}
                    <motion.div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <UserPlus className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Today's Signups</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.todayUsers || 0}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            New users today
                        </div>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* User Signups Chart */}
                    {/* User Signups Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200 min-w-0 overflow-hidden"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                                    User Signups (Last 30 Days)
                                </h3>
                                <div className="flex items-center mt-1 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    <span>{totalSignups} total signups</span>
                                </div>
                            </div>
                            <div className="flex space-x-2 mt-3 sm:mt-0">
                                <button
                                    onClick={() => setChartType('area')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${chartType === 'area'
                                        ? 'bg-blue-100 text-blue-600 border border-blue-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Area
                                </button>
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${chartType === 'bar'
                                        ? 'bg-blue-100 text-blue-600 border border-blue-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Bar
                                </button>
                            </div>
                        </div>

                        {/* Chart Container with explicit dimensions */}
                        <div className="h-64 w-full min-w-0">
                            {showChart && chartData.length > 0 ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                    minHeight={256}  // 16rem = 256px
                                    minWidth={0}     // Important for flex containers
                                >
                                    {chartType === 'area' ? (
                                        <AreaChart
                                            data={chartData}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatXAxis}
                                                stroke="#666"
                                                fontSize={12}
                                                tickMargin={10}
                                            />
                                            <YAxis
                                                stroke="#666"
                                                fontSize={12}
                                                allowDecimals={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="signups"
                                                name="User Signups"
                                                stroke="#3b82f6"
                                                fill="#3b82f6"
                                                fillOpacity={0.2}
                                                strokeWidth={2}
                                                activeDot={{ r: 6, fill: '#3b82f6' }}
                                            />
                                        </AreaChart>
                                    ) : (
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatXAxis}
                                                stroke="#666"
                                                fontSize={12}
                                                tickMargin={10}
                                            />
                                            <YAxis
                                                stroke="#666"
                                                fontSize={12}
                                                allowDecimals={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                dataKey="signups"
                                                name="User Signups"
                                                fill="#3b82f6"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={30}
                                            />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                                    <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-gray-500">No signup data available</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        User signup data will appear here once available
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Summary stats below chart */}
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-sm text-gray-600">Today</div>
                                <div className="text-lg font-bold text-gray-800">
                                    {stats.todayUsers || 0}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">This Week</div>
                                <div className="text-lg font-bold text-gray-800">
                                    {stats.weekUsers || 0}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Total</div>
                                <div className="text-lg font-bold text-gray-800">
                                    {stats.totalUsers || 0}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Products by Category */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Products by Category</h3>
                        <div className="space-y-3">
                            {(stats.productsByCategory || []).map((category, index) => (
                                <div key={category.category || index} className="flex items-center justify-between">
                                    <span className="text-gray-700">{category.category || 'Uncategorized'}</span>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${((category.count || 0) / (stats.totalProducts || 1)) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 w-8">
                                            {category.count || 0}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Recent Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Users</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(stats.recentUsers || []).map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email || 'No email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(user.role || 'USER') === 'ADMIN'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {user.role || 'USER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {user.status || 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;