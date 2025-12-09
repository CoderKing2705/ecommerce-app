import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Package, Truck, CheckCircle, Clock, MapPin,
    Home, Calendar, RefreshCw, ExternalLink, Phone,
    AlertCircle, Loader2, Shield, CreditCard
} from 'lucide-react';
import { checkoutAPI, orderAPI } from '../utils/api';
import toast from 'react-hot-toast';

const OrderTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('timeline');
    const [estimatedDelivery, setEstimatedDelivery] = useState(null);

    useEffect(() => {
        fetchTrackingData();
        fetchEstimatedDelivery();

        // Auto-refresh every 30 seconds if not delivered
        const interval = setInterval(() => {
            if (trackingData?.order?.status !== 'delivered') {
                fetchTrackingData(false); // Silent refresh
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [orderId]);

    const fetchTrackingData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        else setRefreshing(true);

        try {
            const response = await orderAPI.getOrderTracking(orderId);
            setTrackingData(response.data);
        } catch (error) {
            console.error('Error fetching tracking data:', error);
            toast.error('Failed to load tracking information');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchEstimatedDelivery = async () => {
        try {
            const response = await orderAPI.getEstimatedDelivery(orderId);
            setEstimatedDelivery(response.data);
        } catch (error) {
            console.error('Error fetching estimated delivery:', error);
        }
    };

    const handleRefresh = () => {
        fetchTrackingData();
        fetchEstimatedDelivery();
        toast.success('Tracking information refreshed');
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'processing': return <Package className="h-6 w-6 text-blue-500" />;
            case 'shipped': return <Truck className="h-6 w-6 text-yellow-500" />;
            case 'out_for_delivery': return <Truck className="h-6 w-6 text-orange-500" />;
            case 'delivered': return <Home className="h-6 w-6 text-green-600" />;
            default: return <Package className="h-6 w-6 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-yellow-100 text-yellow-800';
            case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Pending';
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const calculateProgress = () => {
        if (!trackingData?.timeline) return 0;
        const completed = trackingData.timeline.filter(step => step.completed).length;
        return Math.round((completed / trackingData.timeline.length) * 100);
    };

    const openTrackingLink = () => {
        if (trackingData?.order?.tracking_url) {
            window.open(trackingData.order.tracking_url, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading tracking information...</p>
                </div>
            </div>
        );
    }

    if (!trackingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to load tracking</h3>
                    <p className="text-gray-600 mb-4">Please check your order number or try again later.</p>
                    <button
                        onClick={() => navigate('/orders')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const { order, timeline, tracking_history, delivery_attempts, shipping_address, items } = trackingData;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Order Tracking</h1>
                            <div className="flex items-center space-x-4 mt-2">
                                <p className="text-gray-600">
                                    Order: <span className="font-semibold">{order.order_number}</span>
                                </p>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                    {order.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={() => navigate('/orders')}
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                            >
                                All Orders
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Delivery Progress</h3>
                                <p className="text-gray-600 text-sm">
                                    {calculateProgress()}% complete • {order.status.replace('_', ' ')}
                                </p>
                            </div>
                            {estimatedDelivery?.is_delayed && (
                                <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    <span className="text-sm font-medium">Delivery may be delayed</span>
                                </div>
                            )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${calculateProgress()}%` }}
                                transition={{ duration: 1 }}
                                className="bg-green-600 h-2.5 rounded-full"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>Order Placed</span>
                            <span>Delivered</span>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Tracking Info */}
                    <div className="lg:col-span-2">
                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm mb-6">
                            <div className="border-b border-gray-200">
                                <nav className="flex">
                                    {['timeline', 'details', 'updates'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-4 px-6 text-center font-medium capitalize ${activeTab === tab
                                                ? 'text-blue-600 border-b-2 border-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {tab === 'timeline' && 'Delivery Timeline'}
                                            {tab === 'details' && 'Order Details'}
                                            {tab === 'updates' && 'Tracking Updates'}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6">
                                {/* Timeline Tab */}
                                {activeTab === 'timeline' && (
                                    <div className="space-y-6">
                                        <div className="relative">
                                            {timeline.map((step, index) => (
                                                <motion.div
                                                    key={step.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex mb-8 last:mb-0"
                                                >
                                                    {/* Vertical Line */}
                                                    <div className="flex flex-col items-center mr-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.completed
                                                            ? 'bg-green-100 text-green-600'
                                                            : step.active
                                                                ? 'bg-blue-100 text-blue-600 border-2 border-blue-500'
                                                                : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                            <span className="text-lg">{step.icon}</span>
                                                        </div>
                                                        {index < timeline.length - 1 && (
                                                            <div className={`flex-1 w-0.5 mt-2 ${step.completed ? 'bg-green-300' : 'bg-gray-200'}`} />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 pb-8">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800">{step.title}</h4>
                                                                <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-gray-800">
                                                                    {formatDate(step.date)}
                                                                </p>
                                                                {step.completed && (
                                                                    <p className="text-xs text-green-600 mt-1">Completed</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Delivery Estimation */}
                                        {estimatedDelivery && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                                                <div className="flex items-start">
                                                    <Calendar className="h-5 w-5 text-blue-600 mt-1 mr-3" />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800">Estimated Delivery</h4>
                                                        <p className="text-gray-600">
                                                            {new Date(estimatedDelivery.estimated_delivery).toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                        {estimatedDelivery.days_remaining > 0 && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {estimatedDelivery.days_remaining} {estimatedDelivery.days_remaining === 1 ? 'day' : 'days'} remaining
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Details Tab */}
                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        {/* Shipping Info */}
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                                Shipping Address
                                            </h4>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="font-medium">{shipping_address.name}</p>
                                                <p>{shipping_address.address}</p>
                                                {shipping_address.address2 && <p>{shipping_address.address2}</p>}
                                                <p>{shipping_address.city}, {shipping_address.state} {shipping_address.zip}</p>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                                            <div className="space-y-3">
                                                {items.map((item) => (
                                                    <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-md mr-4 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-800">{item.product_name}</p>
                                                            <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.price}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">${(item.quantity * item.price).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Payment Info */}
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                                                Payment Information
                                            </h4>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-gray-600">Payment Method:</span>
                                                    <span className="font-medium">Cash on Delivery</span>
                                                </div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-gray-600">Order Total:</span>
                                                    <span className="font-semibold">${order.total_amount}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Order Date:</span>
                                                    <span>{formatDate(order.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Updates Tab */}
                                {activeTab === 'updates' && (
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-4">Tracking Updates</h4>
                                        {tracking_history.length > 0 ? (
                                            <div className="space-y-4">
                                                {tracking_history.map((update, index) => (
                                                    <div key={update.id} className="border-l-2 border-blue-500 pl-4 pb-4">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-800 capitalize">
                                                                    {update.status.replace('_', ' ')}
                                                                </p>
                                                                {update.description && (
                                                                    <p className="text-gray-600 text-sm mt-1">{update.description}</p>
                                                                )}
                                                                {update.location && (
                                                                    <p className="text-gray-500 text-sm mt-1 flex items-center">
                                                                        <MapPin className="h-3 w-3 mr-1" />
                                                                        {update.location}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm text-gray-500">{update.display_date}</p>
                                                                <p className="text-xs text-gray-400">{update.formatted_time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500">No tracking updates yet</p>
                                                <p className="text-gray-400 text-sm mt-1">Updates will appear here as your order progresses</p>
                                            </div>
                                        )}

                                        {/* Delivery Attempts */}
                                        {delivery_attempts.length > 0 && (
                                            <div className="mt-8">
                                                <h5 className="font-semibold text-gray-800 mb-3">Delivery Attempts</h5>
                                                <div className="space-y-3">
                                                    {delivery_attempts.map((attempt) => (
                                                        <div key={attempt.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                            <div className="flex justify-between">
                                                                <div>
                                                                    <p className="font-medium">Attempt #{attempt.attempt_number}</p>
                                                                    <p className="text-sm text-gray-600 mt-1">{attempt.status}</p>
                                                                    {attempt.notes && (
                                                                        <p className="text-sm text-gray-500 mt-1">{attempt.notes}</p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm text-gray-500">{attempt.formatted_time}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <Shield className="h-5 w-5 mr-2 text-green-600" />
                                Need Help With Your Delivery?
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h5 className="font-medium text-gray-800 mb-2">Contact Support</h5>
                                    <p className="text-sm text-gray-600 mb-3">Having issues with delivery?</p>
                                    <button
                                        onClick={() => navigate('/contact')}
                                        className="text-blue-600 text-sm font-medium hover:text-blue-800"
                                    >
                                        Contact Customer Service →
                                    </button>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h5 className="font-medium text-gray-800 mb-2">Delivery Instructions</h5>
                                    <p className="text-sm text-gray-600 mb-3">Update delivery preferences</p>
                                    <button
                                        onClick={() => navigate(`/orders/${orderId}/delivery-instructions`)}
                                        className="text-green-600 text-sm font-medium hover:text-green-800"
                                    >
                                        Add Special Instructions →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary & Actions */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Order Summary Card */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h4 className="font-semibold text-gray-800 mb-4">Order Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Number</span>
                                        <span className="font-medium">{order.order_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Date</span>
                                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Amount</span>
                                        <span className="font-semibold">${order.total_amount}</span>
                                    </div>
                                    <div className="pt-3 border-t">
                                        <div className="flex justify-between">
                                            <span className="text-gray-800 font-medium">Status</span>
                                            <div className="flex items-center">
                                                {getStatusIcon(order.status)}
                                                <span className="ml-2 font-medium capitalize">{order.status.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tracking Card */}
                            {order.tracking_number && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h4 className="font-semibold text-gray-800 mb-4">Tracking Information</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                                            <div className="flex items-center">
                                                <code className="bg-gray-100 px-3 py-2 rounded-lg font-mono text-sm">
                                                    {order.tracking_number}
                                                </code>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(order.tracking_number)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Carrier</p>
                                            <p className="font-medium">{order.carrier}</p>
                                        </div>
                                        {order.tracking_url && (
                                            <button
                                                onClick={openTrackingLink}
                                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Track on Carrier Website
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Delivery Card */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h4 className="font-semibold text-gray-800 mb-4">Delivery Information</h4>
                                <div className="space-y-3">
                                    {order.estimated_delivery && (
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center mb-2">
                                                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                                                <span className="font-medium">Estimated Delivery</span>
                                            </div>
                                            <p className="text-gray-800">
                                                {new Date(order.estimated_delivery).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {order.actual_delivery && (
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center mb-2">
                                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                                <span className="font-medium">Delivered On</span>
                                            </div>
                                            <p className="text-gray-800">
                                                {new Date(order.actual_delivery).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {order.delivery_notes && (
                                        <div className="p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Delivery Notes</p>
                                            <p className="text-gray-800">{order.delivery_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h4 className="font-semibold text-gray-800 mb-4">Quick Actions</h4>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate(`/orders/${orderId}/invoice`)}
                                        className="w-full border border-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-50"
                                    >
                                        Download Invoice
                                    </button>
                                    <button
                                        onClick={() => navigate(`/orders/${orderId}/reorder`)}
                                        className="w-full border border-green-300 text-green-700 py-3 rounded-lg hover:bg-green-50"
                                    >
                                        Reorder Items
                                    </button>
                                    <button
                                        onClick={() => navigate(`/orders/${orderId}/help`)}
                                        className="w-full border border-red-300 text-red-700 py-3 rounded-lg hover:bg-red-50"
                                    >
                                        Report an Issue
                                    </button>
                                </div>
                            </div>

                            {/* Help Card */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center mb-3">
                                    <Phone className="h-5 w-5 text-gray-600 mr-2" />
                                    <span className="font-medium text-gray-800">Need Help?</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    If you have questions about your delivery, contact our support team.
                                </p>
                                <div className="space-y-2">
                                    <a href="tel:+15551234567" className="block text-blue-600 hover:text-blue-800">
                                        📞 +1 (555) 123-4567
                                    </a>
                                    <a href="mailto:support@ecommerce.com" className="block text-blue-600 hover:text-blue-800">
                                        ✉️ support@ecommerce.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;