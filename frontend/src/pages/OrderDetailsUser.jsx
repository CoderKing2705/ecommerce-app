import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    CreditCard,
    Truck,
    Clock,
    Download,
    ShoppingBag
} from 'lucide-react';
import { orderAPI, handleAPIError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderDetailsUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getMyOrderDetails(id);
            setOrder(response.data.order);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error(handleAPIError(error));
            navigate('/orders');
        } finally {
            setLoading(false);
        }
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

    const formatAddress = (address) => {
        if (!address) return 'No address provided';
        const addr = typeof address === 'string' ? JSON.parse(address) : address;
        return `${addr.fullName}, ${addr.address}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
    };

    if (loading) {
        return <LoadingSpinner text="Loading order details..." />;
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                    <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
                    <Link
                        to="/orders"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/orders')}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Order #{order.order_number}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Placed on {new Date(order.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            <span>Download Invoice</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                                Order Summary
                            </h2>

                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                                        <div className="flex items-center space-x-4">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    className="h-16 w-16 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                                <p className="text-sm text-gray-500">
                                                    ${parseFloat(item.product_price).toFixed(2)} each
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">
                                                ${parseFloat(item.total_price).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Totals */}
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                                    <span>Total</span>
                                    <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Status History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                                Order Status
                            </h2>

                            <div className="space-y-4">
                                {order.status_history?.map((history, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className={`min-w-3 h-3 rounded-full mt-2 ${getStatusColor(history.status).split(' ')[0]}`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(history.status)}`}>
                                                    {history.status}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(history.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Order Status */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>

                            <div className="space-y-4">
                                <div>
                                    <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                {order.shipping && (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                                            <p className="text-sm text-gray-900">{order.shipping.tracking_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Carrier</p>
                                            <p className="text-sm text-gray-900">{order.shipping.carrier}</p>
                                        </div>
                                        {order.shipping.estimated_delivery && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Estimated Delivery</p>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(order.shipping.estimated_delivery).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* Shipping Address */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                                Shipping Address
                            </h2>

                            <div className="text-sm text-gray-600 space-y-1">
                                {formatAddress(order.shipping_address).split(', ').map((line, index) => (
                                    <p key={index}>{line}</p>
                                ))}
                            </div>
                        </motion.div>

                        {/* Payment Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                                Payment Information
                            </h2>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Payment Method</span>
                                    <span className="text-sm font-medium">{order.payment_method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Payment Status</span>
                                    <span className={`text-sm font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                                        }`}>
                                        {order.payment_status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                                    <span>Total Paid</span>
                                    <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsUser;