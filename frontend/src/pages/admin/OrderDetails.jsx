import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Package, User, MapPin, CreditCard, Truck, Clock,
    MessageSquare, Edit, Printer, Mail, CheckCircle, AlertCircle,
    Calendar, Map, RefreshCw, ExternalLink, Phone, Home, 
    Loader2, Shield, Download, Copy, Eye, EyeOff
} from 'lucide-react';
import { adminAPI, handleAPIError } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [newNote, setNewNote] = useState('');
    const [isNoteInternal, setIsNoteInternal] = useState(true);
    
    // Tracking states
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [showTrackingEventModal, setShowTrackingEventModal] = useState(false);
    const [showDeliveryAttemptModal, setShowDeliveryAttemptModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Tracking form states
    const [trackingForm, setTrackingForm] = useState({
        tracking_number: '',
        carrier: '',
        estimated_delivery: '',
        delivery_notes: '',
        status: ''
    });
    
    const [trackingEventForm, setTrackingEventForm] = useState({
        status: '',
        location: '',
        description: ''
    });
    
    const [deliveryAttemptForm, setDeliveryAttemptForm] = useState({
        attempt_number: 1,
        status: 'attempted',
        notes: '',
        delivery_person_contact: ''
    });

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            
            const response = await adminAPI.getOrderDetails(id);
            setOrder(response.data.order);
            setNewStatus(response.data.order?.status || '');
            
            // Initialize tracking form with existing data
            if (response.data.order) {
                setTrackingForm({
                    tracking_number: response.data.order.tracking_number || '',
                    carrier: response.data.order.carrier || '',
                    estimated_delivery: response.data.order.estimated_delivery ? 
                        response.data.order.estimated_delivery.split('T')[0] : '',
                    delivery_notes: response.data.order.delivery_notes || '',
                    status: response.data.order.status || ''
                });
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error(handleAPIError(error));
            if (!silent) navigate('/admin/orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        if (!newStatus || !statusNote) {
            toast.error('Please select status and add a note');
            return;
        }

        try {
            setUpdating(true);
            await adminAPI.addStatusHistory(id, {
                status: newStatus,
                note: statusNote
            });

            toast.success('Order status updated successfully');
            setStatusNote('');
            fetchOrderDetails(true); // Refresh data silently
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(handleAPIError(error));
        } finally {
            setUpdating(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) {
            toast.error('Please enter a note');
            return;
        }

        try {
            await adminAPI.addOrderNote(id, {
                note: newNote,
                is_internal: isNoteInternal
            });

            toast.success('Note added successfully');
            setNewNote('');
            fetchOrderDetails(true); // Refresh data silently
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleUpdateTracking = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.updateOrderTracking(id, trackingForm);
            toast.success('Tracking information updated successfully');
            setShowTrackingModal(false);
            fetchOrderDetails(true);
        } catch (error) {
            console.error('Error updating tracking:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleAddTrackingEvent = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.addTrackingEvent(id, trackingEventForm);
            toast.success('Tracking event added successfully');
            setShowTrackingEventModal(false);
            setTrackingEventForm({ status: '', location: '', description: '' });
            fetchOrderDetails(true);
        } catch (error) {
            console.error('Error adding tracking event:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleAddDeliveryAttempt = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.addDeliveryAttempt(id, deliveryAttemptForm);
            toast.success('Delivery attempt recorded successfully');
            setShowDeliveryAttemptModal(false);
            setDeliveryAttemptForm({
                attempt_number: (deliveryAttemptForm.attempt_number || 0) + 1,
                status: 'attempted',
                notes: '',
                delivery_person_contact: ''
            });
            fetchOrderDetails(true);
        } catch (error) {
            console.error('Error adding delivery attempt:', error);
            toast.error(handleAPIError(error));
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const openTrackingLink = () => {
        if (order?.tracking_url) {
            window.open(order.tracking_url, '_blank');
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'processing': return <Package className="h-6 w-6 text-blue-500" />;
            case 'shipped': return <Truck className="h-6 w-6 text-yellow-500" />;
            case 'out_for_delivery': return <Truck className="h-6 w-6 text-orange-500" />;
            case 'delivered': return <Home className="h-6 w-6 text-green-600" />;
            case 'cancelled': return <AlertCircle className="h-6 w-6 text-red-500" />;
            default: return <Package className="h-6 w-6 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            processing: 'bg-blue-100 text-blue-800 border-blue-200',
            shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
            delivered: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            refunded: 'bg-gray-100 text-gray-800 border-gray-200',
            delivery_failed: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateProgress = () => {
        if (!order?.timeline) return 0;
        const completed = order.timeline.filter(step => step.completed).length;
        return Math.round((completed / order.timeline.length) * 100);
    };

    const getCarrierLogo = (carrier) => {
        const logos = {
            'USPS': '📮',
            'UPS': '📦',
            'FedEx': '🚚',
            'DHL': '✈️',
            'Amazon Logistics': '📦',
            'Local Delivery': '🚗'
        };
        return logos[carrier] || '📦';
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
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/admin/orders')}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Order #{order.order_number}
                                </h1>
                                <div className="flex items-center space-x-4 mt-1">
                                    <p className="text-gray-600">
                                        Placed on {formatDate(order.created_at)}
                                    </p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                        {order.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => fetchOrderDetails(true)}
                                disabled={refreshing}
                                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span>Refresh</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Printer className="h-4 w-4" />
                                <span>Print</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Mail className="h-4 w-4" />
                                <span>Email</span>
                            </button>
                        </div>
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
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowTrackingModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Update Tracking
                            </button>
                            <button
                                onClick={() => setShowTrackingEventModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Add Event
                            </button>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateProgress()}%` }}
                            transition={{ duration: 1 }}
                            className="bg-green-600 h-2.5 rounded-full"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            {['overview', 'tracking', 'items', 'history', 'notes'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-4 px-6 text-center font-medium capitalize ${activeTab === tab
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab === 'overview' && 'Overview'}
                                    {tab === 'tracking' && 'Tracking'}
                                    {tab === 'items' && 'Items'}
                                    {tab === 'history' && 'History'}
                                    {tab === 'notes' && 'Notes'}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Customer Info */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <User className="h-5 w-5 mr-2 text-blue-600" />
                                            Customer Information
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Name</p>
                                                <p className="font-medium">{order.customer_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Email</p>
                                                <p className="font-medium">{order.customer_email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Customer ID</p>
                                                <p className="font-medium">{order.user_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                            Shipping Address
                                        </h3>
                                        <div className="space-y-1 text-sm">
                                            <p>{order.shipping_first_name} {order.shipping_last_name}</p>
                                            <p>{order.shipping_address_line1}</p>
                                            {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                                            <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}</p>
                                            <p>{order.shipping_country}</p>
                                            <p className="text-gray-500 mt-2">📞 {order.shipping_phone}</p>
                                            <p className="text-gray-500">✉️ {order.shipping_email}</p>
                                        </div>
                                    </div>

                                    {/* Billing Address */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                            <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                                            Billing Address
                                        </h3>
                                        {order.billing_first_name ? (
                                            <div className="space-y-1 text-sm">
                                                <p>{order.billing_first_name} {order.billing_last_name}</p>
                                                <p>{order.billing_address_line1}</p>
                                                {order.billing_address_line2 && <p>{order.billing_address_line2}</p>}
                                                <p>{order.billing_city}, {order.billing_state} {order.billing_zip_code}</p>
                                                <p>{order.billing_country}</p>
                                                <p className="text-gray-500 mt-2">📞 {order.billing_phone}</p>
                                                <p className="text-gray-500">✉️ {order.billing_email}</p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Same as shipping address</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Order Summary */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Order Number</span>
                                                <span className="font-medium">{order.order_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Order Date</span>
                                                <span>{formatDate(order.created_at)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Method</span>
                                                <span className="font-medium">{order.payment_method}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Status</span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.payment_status)}`}>
                                                    {order.payment_status}
                                                </span>
                                            </div>
                                            <div className="pt-3 border-t">
                                                <div className="flex justify-between text-lg font-semibold">
                                                    <span>Total Amount</span>
                                                    <span>${order.total_amount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Update Form */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4">Update Status</h3>
                                        <form onSubmit={handleStatusUpdate} className="space-y-4">
                                            <div>
                                                <select
                                                    value={newStatus}
                                                    onChange={(e) => setNewStatus(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="out_for_delivery">Out for Delivery</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                    <option value="refunded">Refunded</option>
                                                    <option value="delivery_failed">Delivery Failed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <textarea
                                                    value={statusNote}
                                                    onChange={(e) => setStatusNote(e.target.value)}
                                                    rows="3"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    placeholder="Add a note about this status change..."
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={updating || !statusNote.trim()}
                                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {updating ? 'Updating...' : 'Update Status'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tracking Tab */}
                        {activeTab === 'tracking' && (
                            <div className="space-y-6">
                                {/* Tracking Information */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-2">Tracking Information</h3>
                                            <p className="text-gray-600">Real-time tracking updates for this order</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            {order.tracking_url && (
                                                <button
                                                    onClick={openTrackingLink}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Track on Carrier
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowDeliveryAttemptModal(true)}
                                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                            >
                                                Record Attempt
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Tracking Details */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                                                {order.tracking_number ? (
                                                    <div className="flex items-center">
                                                        <code className="bg-white px-3 py-2 rounded-lg border font-mono">
                                                            {order.tracking_number}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(order.tracking_number)}
                                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500">Not assigned</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Carrier</p>
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-2">{getCarrierLogo(order.carrier)}</span>
                                                    <span className="font-medium">{order.carrier || 'Not specified'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Information */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Estimated Delivery</p>
                                                <div className="flex items-center">
                                                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                                                    <span className="font-medium">
                                                        {order.estimated_delivery ? formatDate(order.estimated_delivery) : 'Not set'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Actual Delivery</p>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                                    <span className="font-medium">
                                                        {order.actual_delivery ? formatDate(order.actual_delivery) : 'Not delivered'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Notes */}
                                    {order.delivery_notes && (
                                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm font-medium text-gray-800 mb-1">Delivery Notes</p>
                                            <p className="text-gray-600">{order.delivery_notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tracking Timeline */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-800 mb-6">Delivery Timeline</h3>
                                    {order.timeline && order.timeline.length > 0 ? (
                                        <div className="relative">
                                            {order.timeline.map((step, index) => (
                                                <div key={step.id} className="flex mb-8 last:mb-0">
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
                                                        {index < order.timeline.length - 1 && (
                                                            <div className={`flex-1 w-0.5 mt-2 ${step.completed ? 'bg-green-300' : 'bg-gray-200'}`} />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 pb-8">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800">{step.title}</h4>
                                                                <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                                                                {step.date && (
                                                                    <p className="text-xs text-gray-500 mt-2">
                                                                        {formatDateTime(step.date)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {step.completed && (
                                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No timeline available</p>
                                    )}
                                </div>

                                {/* Tracking History */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Tracking Updates</h3>
                                    {order.tracking_history && order.tracking_history.length > 0 ? (
                                        <div className="space-y-4">
                                            {order.tracking_history.map((update) => (
                                                <div key={update.id} className="border-l-2 border-blue-500 pl-4 pb-4">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-800 capitalize">
                                                                {update.status.replace('_', ' ')}
                                                            </p>
                                                            <p className="text-gray-600 text-sm mt-1">{update.description}</p>
                                                            {update.location && (
                                                                <p className="text-gray-500 text-sm mt-1 flex items-center">
                                                                    <Map className="h-3 w-3 mr-1" />
                                                                    {update.location}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">{formatDate(update.event_time)}</p>
                                                            <p className="text-xs text-gray-400">{formatDateTime(update.event_time)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No tracking updates yet</p>
                                    )}
                                </div>

                                {/* Delivery Attempts */}
                                {order.delivery_attempts && order.delivery_attempts.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4">Delivery Attempts</h3>
                                        <div className="space-y-3">
                                            {order.delivery_attempts.map((attempt) => (
                                                <div key={attempt.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <p className="font-medium">Attempt #{attempt.attempt_number}</p>
                                                            <p className="text-sm text-gray-600 mt-1">{attempt.status}</p>
                                                            {attempt.notes && (
                                                                <p className="text-sm text-gray-500 mt-1">{attempt.notes}</p>
                                                            )}
                                                            {attempt.delivery_person_contact && (
                                                                <p className="text-sm text-gray-500 mt-1">Contact: {attempt.delivery_person_contact}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">{formatDate(attempt.attempted_at)}</p>
                                                            <p className="text-xs text-gray-400">{formatDateTime(attempt.attempted_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Items Tab */}
                        {activeTab === 'items' && (
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="font-semibold text-gray-800 mb-6">Order Items</h3>
                                <div className="space-y-4">
                                    {order.items?.map((item) => (
                                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.product_name}
                                                            className="h-16 w-16 rounded-lg object-cover mr-4"
                                                        />
                                                    ) : (
                                                        <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                                                            <Package className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                                                        <p className="text-sm text-gray-600">SKU: {item.sku || 'N/A'}</p>
                                                        <p className="text-sm text-gray-600">Price: ${item.product_price}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold">${item.total_price}</p>
                                                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                    <p className="text-sm text-gray-600">Stock: {item.stock_quantity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Order Totals */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium">${order.items?.reduce((sum, item) => sum + (item.total_price || 0), 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Shipping</span>
                                                <span className="font-medium">${order.shipping_fee || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tax</span>
                                                <span className="font-medium">${order.tax_amount || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                                                <span>Total</span>
                                                <span>${order.total_amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-800 mb-6">Status History</h3>
                                    <div className="space-y-4">
                                        {order.status_history?.map((history) => (
                                            <div key={history.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(history.status).split(' ')[0]}`} />
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(history.status)}`}>
                                                            {history.status}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDateTime(history.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{history.note}</p>
                                                {history.updated_by_name && (
                                                    <p className="text-xs text-gray-500 mt-2">Updated by: {history.updated_by_name}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 'notes' && (
                            <div className="space-y-6">
                                {/* Add Note Form */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Add Note</h3>
                                    <form onSubmit={handleAddNote} className="space-y-4">
                                        <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            rows="4"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Add a note about this order..."
                                        />
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="internal-note"
                                                checked={isNoteInternal}
                                                onChange={(e) => setIsNoteInternal(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="internal-note" className="ml-2 text-sm text-gray-700">
                                                Internal note (not visible to customer)
                                            </label>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newNote.trim()}
                                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                                        >
                                            Add Note
                                        </button>
                                    </form>
                                </div>

                                {/* Existing Notes */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-800 mb-6">Order Notes</h3>
                                    <div className="space-y-4">
                                        {order.notes?.map((note) => (
                                            <div key={note.id} className={`p-4 rounded-lg ${note.is_internal ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                                                <p className="text-gray-700">{note.note}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className={`text-xs ${note.is_internal ? 'text-blue-600' : 'text-gray-500'}`}>
                                                        {note.is_internal ? 'Internal Note' : 'Customer Note'}
                                                    </span>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{formatDate(note.created_at)}</p>
                                                        {note.created_by_name && (
                                                            <p className="text-xs text-gray-400">By: {note.created_by_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Tracking Modal */}
            {showTrackingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Tracking Information</h3>
                        <form onSubmit={handleUpdateTracking} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tracking Number
                                </label>
                                <input
                                    type="text"
                                    value={trackingForm.tracking_number}
                                    onChange={(e) => setTrackingForm({...trackingForm, tracking_number: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Enter tracking number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Carrier
                                </label>
                                <select
                                    value={trackingForm.carrier}
                                    onChange={(e) => setTrackingForm({...trackingForm, carrier: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select Carrier</option>
                                    <option value="USPS">USPS</option>
                                    <option value="UPS">UPS</option>
                                    <option value="FedEx">FedEx</option>
                                    <option value="DHL">DHL</option>
                                    <option value="Amazon Logistics">Amazon Logistics</option>
                                    <option value="Local Delivery">Local Delivery</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estimated Delivery
                                </label>
                                <input
                                    type="date"
                                    value={trackingForm.estimated_delivery}
                                    onChange={(e) => setTrackingForm({...trackingForm, estimated_delivery: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Notes
                                </label>
                                <textarea
                                    value={trackingForm.delivery_notes}
                                    onChange={(e) => setTrackingForm({...trackingForm, delivery_notes: e.target.value})}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Add delivery notes..."
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Update Tracking
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTrackingModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tracking Event Modal */}
            {showTrackingEventModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Tracking Event</h3>
                        <form onSubmit={handleAddTrackingEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={trackingEventForm.status}
                                    onChange={(e) => setTrackingEventForm({...trackingEventForm, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select Status</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="out_for_delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="delivery_failed">Delivery Failed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={trackingEventForm.location}
                                    onChange={(e) => setTrackingEventForm({...trackingEventForm, location: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="City, State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={trackingEventForm.description}
                                    onChange={(e) => setTrackingEventForm({...trackingEventForm, description: e.target.value})}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Describe the tracking event..."
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                                >
                                    Add Event
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTrackingEventModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delivery Attempt Modal */}
            {showDeliveryAttemptModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Delivery Attempt</h3>
                        <form onSubmit={handleAddDeliveryAttempt} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Attempt Number
                                </label>
                                <input
                                    type="number"
                                    value={deliveryAttemptForm.attempt_number}
                                    onChange={(e) => setDeliveryAttemptForm({...deliveryAttemptForm, attempt_number: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={deliveryAttemptForm.status}
                                    onChange={(e) => setDeliveryAttemptForm({...deliveryAttemptForm, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="attempted">Attempted</option>
                                    <option value="failed">Failed</option>
                                    <option value="successful">Successful</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={deliveryAttemptForm.notes}
                                    onChange={(e) => setDeliveryAttemptForm({...deliveryAttemptForm, notes: e.target.value})}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Add notes about the delivery attempt..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Person Contact
                                </label>
                                <input
                                    type="text"
                                    value={deliveryAttemptForm.delivery_person_contact}
                                    onChange={(e) => setDeliveryAttemptForm({...deliveryAttemptForm, delivery_person_contact: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Phone number or name"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700"
                                >
                                    Record Attempt
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeliveryAttemptModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetails;