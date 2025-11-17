import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    CreditCard,
    Truck,
    Clock,
    MessageSquare,
    Edit,
    Printer,
    Mail
} from 'lucide-react';
import { adminAPI, handleAPIError } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [newNote, setNewNote] = useState('');
    const [isNoteInternal, setIsNoteInternal] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getOrderDetails(id);
            setOrder(response.data.order);
            setNewStatus(response.data.order.status);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error(handleAPIError(error));
            navigate('/admin/orders');
        } finally {
            setLoading(false);
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
            fetchOrderDetails(); // Refresh data
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
            fetchOrderDetails(); // Refresh data
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error(handleAPIError(error));
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
            processing: 'bg-purple-100 text-purple-800 border-purple-200',
            shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            delivered: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            refunded: 'bg-gray-100 text-gray-800 border-gray-200'
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

    const formatAddress = (address) => {
        if (!address) return 'No address provided';
        const addr = typeof address === 'string' ? JSON.parse(address) : address;
        return `${addr.fullName}, ${addr.address}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
    };

    const calculateTotals = () => {
        if (!order) return {
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0
        };

        // Safely calculate subtotal from items
        const subtotal = order.items?.reduce((sum, item) => {
            const itemPrice = parseFloat(item.total_price) || 0;
            return sum + itemPrice;
        }, 0) || 0;

        console.log('Calculated subtotal:', subtotal);

        // Safely parse other amounts
        const tax = parseFloat(order.tax_amount) || 0;
        const shipping = parseFloat(order.shipping_cost) || 0;
        const discount = parseFloat(order.discount_amount) || 0;
        const total = subtotal + tax + shipping - discount;

        return {
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            total: Number(total.toFixed(2))
        };
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

    const totals = calculateTotals();

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
                                <p className="text-gray-600 mt-1">
                                    Placed on {new Date(order.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Package className="h-5 w-5 mr-2 text-blue-600" />
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
                                                <h3 className="font-medium text-gray-900">{item.product_name || 'Unknown Product'}</h3>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity || 0}</p>
                                                <p className="text-sm text-gray-500">SKU: {item.product_id || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">
                                                ${(Number(item.total_price) || 0).toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                ${(Number(item.product_price) || 0).toFixed(2)} each
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Totals */}
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">${(totals.subtotal || 0).toFixed(2)}</span>
                                </div>
                                {(totals.discount || 0) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-${(totals.discount || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium">${(totals.shipping || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-medium">${(totals.tax || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                                    <span>Total</span>
                                    <span>${(totals.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Status Update Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Edit className="h-5 w-5 mr-2 text-blue-600" />
                                Update Status
                            </h2>

                            <form onSubmit={handleStatusUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Status
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status Note (Required)
                                    </label>
                                    <textarea
                                        value={statusNote}
                                        onChange={(e) => setStatusNote(e.target.value)}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Add a note about this status change..."
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating || !statusNote.trim()}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updating ? 'Updating...' : 'Update Status'}
                                </button>
                            </form>
                        </motion.div>

                        {/* Status History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                                Status History
                            </h2>

                            <div className="space-y-4">
                                {order.status_history?.map((history, index) => (
                                    <div key={history.id} className="flex items-start space-x-4">
                                        <div className={`min-w-3 h-3 rounded-full mt-2 ${getStatusColor(history.status).split(' ')[0]}`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(history.status)}`}>
                                                    {history.status}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(history.created_at).toLocaleDateString()} at{' '}
                                                    {new Date(history.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                                            {history.updated_by_name && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Updated by: {history.updated_by_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(!order.status_history || order.status_history.length === 0) && (
                                    <p className="text-gray-500 text-center py-4">No status history available</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Order Status & Payment */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Overview</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Order Status
                                    </label>
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Status
                                    </label>
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                        {order.payment_status}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method
                                    </label>
                                    <p className="text-sm text-gray-900">{order.payment_method || 'Not specified'}</p>
                                </div>

                                {order.shipping && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tracking Number
                                        </label>
                                        <p className="text-sm text-gray-900">{order.shipping.tracking_number}</p>
                                        <p className="text-xs text-gray-500">{order.shipping.carrier}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Customer Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                Customer
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                                    <p className="text-sm text-gray-600">{order.customer_email}</p>
                                    {order.customer_phone && (
                                        <p className="text-sm text-gray-600">{order.customer_phone}</p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Customer ID</p>
                                    <p className="text-sm text-gray-600">{order.user_id}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Shipping Address */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
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

                        {/* Billing Address */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                                Billing Address
                            </h2>

                            <div className="text-sm text-gray-600 space-y-1">
                                {order.billing_address ? (
                                    formatAddress(order.billing_address).split(', ').map((line, index) => (
                                        <p key={index}>{line}</p>
                                    ))
                                ) : (
                                    <p className="text-gray-500">Same as shipping address</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Add Note */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                                Add Note
                            </h2>

                            <form onSubmit={handleAddNote} className="space-y-3">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Add a note about this order..."
                                />

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="internal-note"
                                        checked={isNoteInternal}
                                        onChange={(e) => setIsNoteInternal(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="internal-note" className="text-sm text-gray-700">
                                        Internal note (not visible to customer)
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newNote.trim()}
                                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Note
                                </button>
                            </form>
                        </motion.div>

                        {/* Order Notes */}
                        {order.notes && order.notes.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>

                                <div className="space-y-3">
                                    {order.notes.map((note) => (
                                        <div key={note.id} className={`p-3 rounded-lg ${note.is_internal ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                                            <p className="text-sm text-gray-700">{note.note}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`text-xs ${note.is_internal ? 'text-blue-600' : 'text-gray-500'}`}>
                                                    {note.is_internal ? 'Internal Note' : 'Customer Note'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(note.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {note.created_by_name && (
                                                <p className="text-xs text-gray-500 mt-1">By: {note.created_by_name}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;