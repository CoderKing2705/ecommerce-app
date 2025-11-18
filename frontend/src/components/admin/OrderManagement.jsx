import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Download,
    MoreVertical,
    Truck,
    CheckCircle,
    XCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Package
} from 'lucide-react';
import { orderAPI } from '../../utils/api';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 10,
        search: ''
    });

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.getOrders(filters);
            setOrders(response.data.orders);
            setPagination({
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                totalOrders: response.data.totalOrders
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAction = async (action, data) => {
        try {
            const response = await orderAPI.bulkUpdateOrders({
                orderIds: selectedOrders,
                action,
                data
            });

            // Update local state
            setOrders(prev => prev.map(order => {
                const result = response.data.results.find(r => r.orderId === order.id);
                if (result && result.success) {
                    return { ...order, ...result.data };
                }
                return order;
            }));

            setSelectedOrders([]);
            fetchOrders(); // Refresh the list
        } catch (error) {
            console.error('Bulk action error:', error);
        }
    };

    const handleStatusFilter = (status) => {
        setFilters(prev => ({
            ...prev,
            status: status === 'all' ? '' : status,
            page: 1 // Reset to first page when filter changes
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-purple-100 text-purple-800',
            shipped: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <RefreshCw className="h-4 w-4" />,
            confirmed: <CheckCircle className="h-4 w-4" />,
            processing: <RefreshCw className="h-4 w-4" />,
            shipped: <Truck className="h-4 w-4" />,
            delivered: <CheckCircle className="h-4 w-4" />,
            cancelled: <XCircle className="h-4 w-4" />
        };
        return icons[status] || <MoreVertical className="h-4 w-4" />;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
                <p className="text-gray-600">Manage orders, process refunds, and handle cancellations</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchOrders}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <span className="text-blue-800 font-medium">
                            {selectedOrders.length} orders selected
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <select
                                className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleBulkAction('update_status', { status: e.target.value });
                                        e.target.value = '';
                                    }
                                }}
                            >
                                <option value="">Update Status</option>
                                <option value="confirmed">Confirm</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                            </select>
                            <button
                                onClick={() => handleBulkAction('cancel_orders', { reason: 'Bulk cancellation' })}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                            >
                                Cancel Orders
                            </button>
                            <button
                                onClick={() => setSelectedOrders([])}
                                className="border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition-colors"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading orders...</span>
                    </div>
                ) : (
                    <>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedOrders(orders.map(order => order.id));
                                                } else {
                                                    setSelectedOrders([]);
                                                }
                                            }}
                                            checked={selectedOrders.length === orders.length && orders.length > 0}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedOrders(prev => [...prev, order.id]);
                                                    } else {
                                                        setSelectedOrders(prev => prev.filter(id => id !== order.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.id}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.customer_name}</div>
                                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${order.total_amount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="ml-1">{order.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                                                View
                                            </button>
                                            {order.status === 'delivered' && order.refund_status === 'none' && (
                                                <button className="text-green-600 hover:text-green-900">
                                                    Refund
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {orders.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No orders found</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {filters.status ? `No ${filters.status} orders` : 'No orders have been placed yet'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 bg-white px-6 py-3 rounded-lg shadow">
                    <div className="text-sm text-gray-700">
                        Showing {orders.length} of {pagination.totalOrders} orders
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <span className="text-sm text-gray-700">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>

                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;