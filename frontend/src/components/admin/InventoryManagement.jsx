import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Package, Search, TrendingUp,
    AlertTriangle, CheckCircle, XCircle, RefreshCw,
    Download} from 'lucide-react';
import { inventoryAPI } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';


const InventoryManagement = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        status: '',
        lowStock: false
    });
    const [pagination, setPagination] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [stockAdjustment, setStockAdjustment] = useState({
        adjustment: '',
        reason: '',
        movement_type: 'adjustment'
    });

    const [activeChart, setActiveChart] = useState('status');

    useEffect(() => {
        fetchInventory();
        fetchStats();
    }, [filters]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await inventoryAPI.getInventory(filters);
            setInventory(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await inventoryAPI.getInventoryStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getChartData = () => {
        switch (activeChart) {
            case 'status':
                return getStatusChartData();
            case 'stock':
                return getStockLevelChartData();
            case 'movements':
                return getMovementChartData();
            default:
                return getStatusChartData();
        }
    };


    const getStatusChartData = () => {
        const statusCounts = {
            'In Stock': 0,
            'Low Stock': 0,
            'Out of Stock': 0
        };

        inventory.forEach(item => {
            if (item.current_stock === 0) {
                statusCounts['Out of Stock']++;
            } else if (item.current_stock <= item.minimum_stock_level) {
                statusCounts['Low Stock']++;
            } else {
                statusCounts['In Stock']++;
            }
        });

        return Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value,
            color: name === 'In Stock' ? '#10B981' : name === 'Low Stock' ? '#F59E0B' : '#EF4444'
        }));
    };

    // Chart 2: Stock Levels by Product (Top 10)
    const getStockLevelChartData = () => {
        return inventory
            .slice(0, 10) // Top 10 products
            .map(item => ({
                name: item.product_name.length > 15
                    ? item.product_name.substring(0, 15) + '...'
                    : item.product_name,
                stock: item.current_stock,
                minLevel: item.minimum_stock_level,
                status: item.current_stock === 0 ? 'Out of Stock' :
                    item.current_stock <= item.minimum_stock_level ? 'Low Stock' : 'In Stock'
            }));
    };

    // Chart 3: Recent Stock Movements (Mock data - you'd integrate with your API)
    const getMovementChartData = () => {
        // This would come from your stock movements API
        return [
            { date: 'Jan 1', incoming: 45, outgoing: 32, adjustments: 5 },
            { date: 'Jan 2', incoming: 52, outgoing: 38, adjustments: 2 },
            { date: 'Jan 3', incoming: 38, outgoing: 45, adjustments: 8 },
            { date: 'Jan 4', incoming: 61, outgoing: 29, adjustments: 3 },
            { date: 'Jan 5', incoming: 47, outgoing: 42, adjustments: 6 },
            { date: 'Jan 6', incoming: 55, outgoing: 38, adjustments: 4 },
            { date: 'Jan 7', incoming: 42, outgoing: 51, adjustments: 7 },
        ];
    };

    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

    const handleStockUpdate = async (e) => {
        e.preventDefault();
        try {
            await inventoryAPI.updateStock(selectedItem.id, stockAdjustment);
            toast.success('Stock updated successfully');
            setShowStockModal(false);
            setStockAdjustment({ adjustment: '', reason: '', movement_type: 'adjustment' });
            fetchInventory();
            fetchStats();
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error(error.response?.data?.error || 'Failed to update stock');
        }
    };

    const handleSettingsUpdate = async (e) => {
        e.preventDefault();
        try {
            await inventoryAPI.updateInventorySettings(selectedItem.id, {
                minimum_stock_level: parseInt(selectedItem.minimum_stock_level),
                maximum_stock_level: selectedItem.maximum_stock_level ? parseInt(selectedItem.maximum_stock_level) : null,
                reorder_quantity: parseInt(selectedItem.reorder_quantity),
                location: selectedItem.location
            });
            toast.success('Inventory settings updated successfully');
            setShowSettingsModal(false);
            fetchInventory();
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update inventory settings');
        }
    };

    const getStatusColor = (status, currentStock, minimumStock) => {
        if (status === 'out_of_stock' || currentStock === 0) {
            return 'bg-red-100 text-red-800';
        }
        if (status === 'low_stock' || currentStock <= minimumStock) {
            return 'bg-orange-100 text-orange-800';
        }
        return 'bg-green-100 text-green-800';
    };

    const getStatusIcon = (status, currentStock, minimumStock) => {
        if (status === 'out_of_stock' || currentStock === 0) {
            return <XCircle className="h-4 w-4" />;
        }
        if (status === 'low_stock' || currentStock <= minimumStock) {
            return <AlertTriangle className="h-4 w-4" />;
        }
        return <CheckCircle className="h-4 w-4" />;
    };

    const exportInventory = () => {
        toast.success('Exporting inventory data...');
        // Implement export functionality
    };

    if (loading && inventory.length === 0) {
        return <LoadingSpinner text="Loading inventory..." />;
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
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                            <p className="text-gray-600 mt-2">
                                Manage stock levels, track movements, and monitor inventory health
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={fetchInventory}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                            <button
                                onClick={exportInventory}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            icon: Package,
                            label: 'Total Products',
                            value: stats.overview?.total_products || 0,
                            color: 'blue'
                        },
                        {
                            icon: TrendingUp,
                            label: 'Total Stock',
                            value: stats.overview?.total_stock_value || 0,
                            color: 'green'
                        },
                        {
                            icon: AlertTriangle,
                            label: 'Low Stock',
                            value: stats.overview?.low_stock_count || 0,
                            color: 'orange'
                        },
                        {
                            icon: XCircle,
                            label: 'Out of Stock',
                            value: stats.overview?.out_of_stock_count || 0,
                            color: 'red'
                        }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                        >
                            <div className="flex items-center">
                                <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {stat.value.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>


                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Inventory Analytics</h2>
                            <div className="flex space-x-2">
                                {[
                                    { key: 'status', label: 'Status Distribution' },
                                    { key: 'stock', label: 'Stock Levels' },
                                    { key: 'movements', label: 'Movements' }
                                ].map((chart) => (
                                    <button
                                        key={chart.key}
                                        onClick={() => setActiveChart(chart.key)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeChart === chart.key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {chart.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                {activeChart === 'status' && (
                                    <PieChart>
                                        <Pie
                                            data={getStatusChartData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {getStatusChartData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                )}

                                {activeChart === 'stock' && (
                                    <BarChart data={getStockLevelChartData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar
                                            dataKey="stock"
                                            name="Current Stock"
                                            fill="#3B82F6"
                                        />
                                        <Bar
                                            dataKey="minLevel"
                                            name="Minimum Level"
                                            fill="#F59E0B"
                                        />
                                    </BarChart>
                                )}

                                {activeChart === 'movements' && (
                                    <LineChart data={getMovementChartData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="incoming"
                                            name="Incoming Stock"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="outgoing"
                                            name="Outgoing Stock"
                                            stroke="#EF4444"
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="adjustments"
                                            name="Adjustments"
                                            stroke="#F59E0B"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>

                        {/* Chart Insights */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">Insights</h3>
                            {activeChart === 'status' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                        <span>{getStatusChartData().find(d => d.name === 'In Stock')?.value || 0} products in stock</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                        <span>{getStatusChartData().find(d => d.name === 'Low Stock')?.value || 0} products need reordering</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                        <span>{getStatusChartData().find(d => d.name === 'Out of Stock')?.value || 0} products out of stock</span>
                                    </div>
                                </div>
                            )}
                            {activeChart === 'stock' && (
                                <p className="text-sm text-gray-600">
                                    Showing top 10 products by stock level. Monitor products approaching their minimum levels.
                                </p>
                            )}
                            {activeChart === 'movements' && (
                                <p className="text-sm text-gray-600">
                                    Track incoming, outgoing, and adjustment movements to identify inventory patterns.
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>


                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-4">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={filters.lowStock}
                                    onChange={(e) => setFilters(prev => ({ ...prev, lowStock: e.target.checked, page: 1 }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Low Stock Only</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Current Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Min Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Updated
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.product_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.category} • {item.brand} • ${item.price}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {item.current_stock}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Reorder: {item.reorder_quantity}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.minimum_stock_level}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.computed_status, item.current_stock, item.minimum_stock_level)}`}>
                                                {getStatusIcon(item.computed_status, item.current_stock, item.minimum_stock_level)}
                                                <span className="ml-1 capitalize">
                                                    {item.computed_status?.replace('_', ' ') || 'Unknown'}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.location || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowStockModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                >
                                                    Adjust Stock
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowSettingsModal(true);
                                                    }}
                                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                                >
                                                    Settings
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {inventory.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No inventory items found</p>
                            <p className="text-gray-400 mt-1">
                                {filters.search || filters.status ? 'Try adjusting your filters' : 'No products in inventory'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">
                                    Showing {inventory.length} of {pagination.totalItems} items
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={filters.page === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 text-sm text-gray-700">
                                        Page {filters.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={filters.page === pagination.totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Stock Adjustment Modal */}
            {showStockModal && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Adjust Stock - {selectedItem.product_name}
                        </h3>

                        <form onSubmit={handleStockUpdate} className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-sm text-gray-600">Current Stock: <strong>{selectedItem.current_stock}</strong></p>
                                <p className="text-sm text-gray-600">Minimum Level: {selectedItem.minimum_stock_level}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adjustment Amount *
                                </label>
                                <input
                                    type="number"
                                    value={stockAdjustment.adjustment}
                                    onChange={(e) => setStockAdjustment(prev => ({ ...prev, adjustment: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Positive to add, negative to remove"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use positive numbers to add stock, negative to remove
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason
                                </label>
                                <select
                                    value={stockAdjustment.movement_type}
                                    onChange={(e) => setStockAdjustment(prev => ({ ...prev, movement_type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="adjustment">Stock Adjustment</option>
                                    <option value="purchase">Purchase</option>
                                    <option value="sale">Sale</option>
                                    <option value="return">Return</option>
                                    <option value="damage">Damage/Loss</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={stockAdjustment.reason}
                                    onChange={(e) => setStockAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Additional notes about this adjustment..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowStockModal(false);
                                        setStockAdjustment({ adjustment: '', reason: '', movement_type: 'adjustment' });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Update Stock
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Inventory Settings - {selectedItem.product_name}
                        </h3>

                        <form onSubmit={handleSettingsUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Stock Level *
                                </label>
                                <input
                                    type="number"
                                    value={selectedItem.minimum_stock_level}
                                    onChange={(e) => setSelectedItem(prev => ({ ...prev, minimum_stock_level: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Alert when stock falls below this level
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Stock Level
                                </label>
                                <input
                                    type="number"
                                    value={selectedItem.maximum_stock_level || ''}
                                    onChange={(e) => setSelectedItem(prev => ({ ...prev, maximum_stock_level: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reorder Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={selectedItem.reorder_quantity}
                                    onChange={(e) => setSelectedItem(prev => ({ ...prev, reorder_quantity: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="1"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Quantity to order when stock is low
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={selectedItem.location || ''}
                                    onChange={(e) => setSelectedItem(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., A1-05"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;