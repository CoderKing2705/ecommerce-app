import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Package,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    ArrowRight,
    Eye,
    Download
} from 'lucide-react';
import { orderAPI, handleAPIError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user, currentPage]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getMyOrders({
                page: currentPage,
                limit: 8
            });
            setOrders(response.data.orders);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'shipped':
                return <Truck className="h-5 w-5 text-blue-600" />;
            case 'processing':
            case 'confirmed':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'cancelled':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Package className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
            processing: 'bg-purple-100 text-purple-800 border-purple-200',
            shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            delivered: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusText = (status) => {
        const statusMap = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled'
        };
        return statusMap[status] || status;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading && orders.length === 0) {
        return <LoadingSpinner text="Loading your orders..." />;
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                            <p className="text-gray-600 mt-2">
                                View your order history and track recent purchases
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                {orders.length > 0 ? `${orders.length} orders` : 'No orders yet'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Orders Grid */}
                {orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                            >
                                {/* Order Header */}
                                <div className="border-b border-gray-200 px-6 py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center space-x-4">
                                            {getStatusIcon(order.status)}
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Order #{order.order_number}
                                                </h3>
                                                <p className="text-sm text-gray-500 flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    Placed on {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900 flex items-center">
                                                <DollarSign className="h-4 w-4 mr-1" />
                                                {parseFloat(order.total_amount).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="px-6 py-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                                        </h4>
                                        <div className="text-sm text-gray-500">
                                            Payment: <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' :
                                                    order.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {order.payment_status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex space-x-4 overflow-x-auto pb-4">
                                        {order.items?.slice(0, 4).map((item, itemIndex) => (
                                            <div key={itemIndex} className="flex-shrink-0 w-20">
                                                <div className="bg-gray-100 rounded-lg h-20 w-20 flex items-center justify-center overflow-hidden">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.product_name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="h-8 w-8 text-gray-400" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 mt-2 truncate">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                        ))}
                                        {order.items_count > 4 && (
                                            <div className="flex-shrink-0 w-20 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="bg-gray-100 rounded-lg h-20 w-20 flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-gray-400">+{order.items_count - 4}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">More items</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Actions */}
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                        <div className="text-sm text-gray-600">
                                            {order.payment_method && (
                                                <span>Paid with {order.payment_method}</span>
                                            )}
                                        </div>
                                        <div className="flex space-x-3">
                                            <Link
                                                to={`/orders/${order.id}`}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Link>
                                            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                                                <Download className="h-4 w-4 mr-2" />
                                                Invoice
                                            </button>
                                            {order.status === 'delivered' && (
                                                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Reorder
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="max-w-md mx-auto">
                            <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
                            <p className="text-gray-600 mb-8">
                                You haven't placed any orders yet. Start shopping to see your orders here.
                            </p>
                            <Link
                                to="/products"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Start Shopping
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex justify-center"
                    >
                        <nav className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 border text-sm font-medium rounded-md transition-colors ${currentPage === page
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </nav>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;