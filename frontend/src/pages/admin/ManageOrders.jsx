import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Search,
    Package,
    Eye,
    Edit,
    Truck,
    DollarSign,
    Filter,
    RefreshCw,
    ChevronDown,
    RotateCcw,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { adminAPI, handleAPIError } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Refund modal state
    const [refundModal, setRefundModal] = useState({
        isOpen: false,
        order: null,
        refundAmount: '',
        reason: ''
    });

    // Bulk actions state
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [bulkAction, setBulkAction] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter]);

    const fetchOrders = async (page = 1, search = '', status = statusFilter) => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (status) params.status = status;

            const response = await adminAPI.getOrders(params);
            setOrders(response.data.orders);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.currentPage);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await adminAPI.updateOrderStatus(orderId, { status: newStatus });
            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error(handleAPIError(error));
        }
    };

    // Refund Processing Functions
    const openRefundModal = (order) => {
        setRefundModal({
            isOpen: true,
            order: order,
            refundAmount: order.total_amount,
            reason: ''
        });
    };

    const closeRefundModal = () => {
        setRefundModal({
            isOpen: false,
            order: null,
            refundAmount: '',
            reason: ''
        });
    };

    const processRefund = async () => {
        try {
            const { order, refundAmount, reason } = refundModal;

            console.log('Starting refund process for order:', order.id);

            // Validate inputs
            if (!refundAmount || refundAmount <= 0) {
                toast.error('Please enter a valid refund amount');
                return;
            }

            const amount = parseFloat(refundAmount);
            if (isNaN(amount)) {
                toast.error('Please enter a valid number for refund amount');
                return;
            }

            if (amount > parseFloat(order.total_amount)) {
                toast.error('Refund amount cannot exceed order total');
                return;
            }

            console.log('Sending refund request:', {
                orderId: order.id,
                refund_amount: amount,
                reason: reason || 'Refund processed by admin'
            });

            // Make API call
            await adminAPI.processRefund(order.id, {
                refund_amount: amount,
                reason: reason || 'Refund processed by admin'
            });

            // Update local state
            setOrders(prev => prev.map(o =>
                o.id === order.id
                    ? {
                        ...o,
                        refund_status: 'processed',
                        refund_amount: amount,
                        status: 'refunded'
                    }
                    : o
            ));

            // Show success message
            toast.success(`Refund of $${amount.toFixed(2)} processed successfully!`);

            // Close modal
            closeRefundModal();

        } catch (error) {
            console.error('Error processing refund:', error);
            console.error('Error details:', error.response?.data);

            // Show specific error message
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to process refund';
            toast.error(errorMessage);
        }
    };

    // Bulk Operations
    const handleBulkAction = async () => {
        if (!bulkAction || selectedOrders.length === 0) return;

        try {
            let actionData = {};

            switch (bulkAction) {
                case 'update_status':
                    actionData = { action: 'update_status', data: { status: 'processing' } };
                    break;
                case 'cancel_orders':
                    actionData = { action: 'cancel_orders', data: { reason: 'Bulk cancellation' } };
                    break;
                case 'mark_shipped':
                    actionData = { action: 'update_status', data: { status: 'shipped' } };
                    break;
                default:
                    return;
            }

            const response = await adminAPI.bulkUpdateOrders({
                orderIds: selectedOrders,
                ...actionData
            });

            // Update local state for successful operations
            setOrders(prev => prev.map(order => {
                const result = response.data.results.find(r => r.orderId === order.id);
                if (result && result.success) {
                    return { ...order, ...result.data };
                }
                return order;
            }));

            setSelectedOrders([]);
            setBulkAction('');
            toast.success(`Bulk action completed for ${selectedOrders.length} orders`);
        } catch (error) {
            console.error('Bulk action error:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value === '') {
            fetchOrders(1, '');
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchOrders(1, searchTerm);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-purple-100 text-purple-800',
            shipped: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            refunded: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            refunded: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const isRefundable = (order) => {
        return (order.status === 'delivered' || order.status === 'cancelled') &&
            order.payment_status === 'paid' &&
            order.refund_status !== 'processed';
    };

    if (loading && orders.length === 0) {
        return <LoadingSpinner text="Loading orders..." />;
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
                    <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
                    <p className="text-gray-600 mt-2">View and manage customer orders</p>
                </motion.div>

                {/* Bulk Actions */}
                {selectedOrders.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <span className="text-blue-800 font-medium">
                                {selectedOrders.length} orders selected
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={bulkAction}
                                    onChange={(e) => setBulkAction(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Bulk Actions</option>
                                    <option value="update_status">Mark as Processing</option>
                                    <option value="mark_shipped">Mark as Shipped</option>
                                    <option value="cancel_orders">Cancel Orders</option>
                                </select>
                                <button
                                    onClick={handleBulkAction}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => setSelectedOrders([])}
                                    className="border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search by order number or customer..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </form>

                        <div className="flex gap-4">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                            </select>

                            <button
                                onClick={() => fetchOrders()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
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
                                        Payment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Refund
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
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
                                            <div className="flex items-center">
                                                <Package className="h-5 w-5 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.order_number}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {order.items_count} items
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.customer_name}</div>
                                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            ${parseFloat(order.total_amount).toFixed(2)}
                                            {order.refund_amount && (
                                                <div className="text-xs text-red-600">
                                                    Refunded: ${parseFloat(order.refund_amount).toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                className={`text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(order.status)}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="refunded">Refunded</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {order.refund_status === 'processed' ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Refunded
                                                </span>
                                            ) : isRefundable(order) ? (
                                                <button
                                                    onClick={() => openRefundModal(order)}
                                                    className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
                                                >
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                    Refund
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    N/A
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Link
                                                    to={`/admin/orders/${order.id}`}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                                                    title="View order details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                                                    title="Update shipping"
                                                >
                                                    <Truck className="h-4 w-4" />
                                                </button>
                                                {isRefundable(order) && (
                                                    <button
                                                        onClick={() => openRefundModal(order)}
                                                        className="text-orange-600 hover:text-orange-900 transition-colors p-1 rounded hover:bg-orange-50"
                                                        title="Process refund"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {orders.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No orders found</p>
                            <p className="text-gray-400 mt-1">
                                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'No orders have been placed yet'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
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

            {/* Refund Modal */}
            {refundModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Process Refund - Order #{refundModal.order?.order_number}
                        </h3>

                        <div className="space-y-4">
                            {/* Order Info */}
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-sm"><strong>Customer:</strong> {refundModal.order?.customer_name}</p>
                                <p className="text-sm"><strong>Order Total:</strong> ${refundModal.order?.total_amount}</p>
                            </div>

                            {/* Refund Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Refund Amount *
                                </label>
                                <input
                                    type="number"
                                    value={refundModal.refundAmount}
                                    onChange={(e) => setRefundModal(prev => ({
                                        ...prev,
                                        refundAmount: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter refund amount"
                                    max={refundModal.order?.total_amount}
                                    step="0.01"
                                    min="0.01"
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Refund
                                </label>
                                <textarea
                                    value={refundModal.reason}
                                    onChange={(e) => setRefundModal(prev => ({
                                        ...prev,
                                        reason: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter reason for refund"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={closeRefundModal}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processRefund}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                            >
                                Process Refund
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ManageOrders;