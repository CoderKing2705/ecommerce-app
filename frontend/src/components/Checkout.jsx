import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Truck, MapPin, Package, Home, Loader2, Clock, Trash2 } from 'lucide-react';
import { checkoutAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [error, setError] = useState('');
    const [shippingAddresses, setShippingAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

    const { token: contextToken } = useAuth();
    const token = contextToken || localStorage.getItem('token');

    const [formData, setFormData] = useState({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ')[1] || '',
        email: user?.email || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        isDefault: true,
        notes: ''
    });

    const subtotal = getCartTotal();
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;


    useEffect(() => {
        const fetchShippingAddresses = async () => {
            if (!token) {
                setIsLoadingAddresses(false);
                return;
            }

            try {
                setIsLoadingAddresses(true);

                const response = await checkoutAPI.getShippingAddresses();

                if (response.data && Array.isArray(response.data)) {
                    setShippingAddresses(response.data);

                    // Set default address if exists
                    const defaultAddress = response.data.find(addr => addr.is_default);
                    if (defaultAddress && response.data.length > 0) {
                        setSelectedAddressId(defaultAddress.id);
                        setShowNewAddressForm(false);
                    } else if (response.data.length > 0) {
                        // If no default, select the first address
                        setSelectedAddressId(response.data[0].id);
                        setShowNewAddressForm(false);
                    } else {
                        // No addresses, show form
                        setShowNewAddressForm(true);
                    }
                } else {

                    setShowNewAddressForm(true);
                }
            } catch (error) {
                console.error('Error fetching shipping addresses:', error);
                console.error('Full error:', error);
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                }
                setError('Failed to load shipping addresses. Please try again.');
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        fetchShippingAddresses();
    }, [token]);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ')[1] || '',
                email: user?.email || ''
            }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!showNewAddressForm && !selectedAddressId) {
            alert('Please select a shipping address or create a new one');
            return false;
        }

        if (showNewAddressForm) {
            const requiredFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city', 'state', 'zipCode'];
            for (const field of requiredFields) {
                if (!formData[field]) {
                    alert(`Please fill in ${field}`);
                    return false;
                }
            }

            if (!formData.email.includes('@')) {
                alert('Please enter a valid email address');
                return false;
            }
        }

        return true;
    };


    const handleSubmitOrder = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let shippingAddressData;

            if (selectedAddressId && !showNewAddressForm) {
                // Use existing address
                shippingAddressData = { shippingAddressId: selectedAddressId };
            } else {
                // Create new address from form
                shippingAddressData = {
                    shippingAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: formData.phone,
                        addressLine1: formData.addressLine1,
                        addressLine2: formData.addressLine2 || '',
                        city: formData.city,
                        state: formData.state,
                        zipCode: formData.zipCode,
                        country: formData.country
                    },
                    saveAsDefault: formData.isDefault
                };
            }

            // Prepare request data for COD
            const requestData = {
                ...shippingAddressData,
                paymentMethod: 'cod',
            };


            // Use the correct endpoint
            const response = await checkoutAPI.createSession(requestData);
            const result = response.data;

            if (!response.ok) {
                throw new Error(result.message || 'Order failed');
            }

            // Success! For COD, the backend should return orderId
            setOrderId(result.orderId);
            setOrderPlaced(true);

            // Clear cart after successful order
            const cleared = await clearCart();

            if (cleared) {
                toast.success('Order placed successfully! Cash on Delivery selected.', {
                    duration: 5000,
                    icon: '✅',
                    position: 'top-right',
                });
            }

        } catch (error) {
            console.error('Order failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Order failed. Please try again.';
            setError(errorMsg);

            // Show error toast
            toast.error(errorMsg, {
                duration: 5000,
                icon: '❌',
                position: 'top-right',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSelection = (addressId) => {
        setSelectedAddressId(addressId);
        setShowNewAddressForm(false);
    };

    const handleDeleteAddress = async (addressId, e) => {
        e.stopPropagation(); // Prevent triggering address selection
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            await checkoutAPI.deleteShippingAddress(addressId);
            // Remove address from state
            setShippingAddresses(prev => prev.filter(addr => addr.id !== addressId));
            // If deleted address was selected, clear selection
            if (selectedAddressId === addressId) {
                setSelectedAddressId(null);
                if (shippingAddresses.length > 1) {
                    // Select another address if available
                    const otherAddress = shippingAddresses.find(addr => addr.id !== addressId);
                    if (otherAddress) {
                        setSelectedAddressId(otherAddress.id);
                    } else {
                        setShowNewAddressForm(true);
                    }
                } else {
                    setShowNewAddressForm(true);
                }
            }
            alert('Address deleted successfully');
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Failed to delete address');
        }
    };

    const handleCreateNewAddress = async () => {
        // Validate the form
        const requiredFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city', 'state', 'zipCode'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                alert(`Please fill in ${field}`);
                return;
            }
        }

        if (!formData.email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        setSavingAddress(true);

        try {
            const response = await checkoutAPI.createShippingAddress({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2 || '',
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                country: formData.country,
                isDefault: formData.isDefault
            });

            const newAddress = response.data;
            setShippingAddresses(prev => [...prev, newAddress]);
            setSelectedAddressId(newAddress.id);
            setShowNewAddressForm(false);
            alert('Address saved successfully!');
        } catch (error) {
            console.error('Error creating address:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save address';
            alert(errorMsg);
        } finally {
            setSavingAddress(false);
        }
    };

    useEffect(() => {
        if (orderPlaced) {
            // Redirect to My Orders page after 3 seconds
            const timer = setTimeout(() => {
                navigate('/orders');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [orderPlaced, navigate]);

    if (orderPlaced) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mb-8"
                    >
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="h-12 w-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Order Confirmed!</h2>
                        <p className="text-gray-600 mb-6">Your order has been placed successfully.</p>

                        <div className="bg-gray-50 p-6 rounded-lg mb-8">
                            <div className="flex items-center justify-center mb-4">
                                <Clock className="h-8 w-8 text-yellow-600 mr-2" />
                                <p className="text-lg font-semibold text-gray-800">Cash on Delivery</p>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Order Number</p>
                            <p className="text-xl font-bold text-gray-800">{orderId}</p>
                            <p className="text-gray-600 mt-4">Please keep this Order Number for reference</p>

                            {/* Add redirect message */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-700 text-sm">
                                    <strong>Note:</strong> You will be redirected to your orders page in 3 seconds...
                                </p>
                            </div>

                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-700 text-sm">
                                    <strong>Payment Instructions:</strong> Please have the exact amount ready for the delivery person.
                                    Total amount: <span className="font-bold">${total.toFixed(2)}</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/orders')}
                                className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                View My Orders Now
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="ml-4 bg-gray-200 text-gray-800 py-3 px-8 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
                    <div className="flex items-center text-gray-600">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                                1
                            </div>
                            <span>Shipping</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                                2
                            </div>
                            <span>Payment</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mr-2">
                                3
                            </div>
                            <span>Confirmation</span>
                        </div>
                    </div>
                </motion.div>
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmitOrder}>
                            {/* Shipping Information */}
                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <MapPin className="h-6 w-6 text-blue-600 mr-3" />
                                        <h2 className="text-xl font-semibold text-gray-800">Shipping Address</h2>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            {showNewAddressForm ? '← Back to addresses' : 'Add new address'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/shipping-addresses')}
                                            className="text-gray-600 hover:text-gray-800 text-sm"
                                        >
                                            Manage all addresses
                                        </button>
                                    </div>
                                </div>

                                {isLoadingAddresses ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
                                        <p className="text-gray-600">Loading addresses...</p>
                                    </div>
                                ) : !showNewAddressForm && shippingAddresses.length > 0 ? (
                                    <div className="space-y-4 mb-6">
                                        <h3 className="text-lg font-medium text-gray-700 mb-4">
                                            Select Shipping Address ({shippingAddresses.length} available)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {shippingAddresses.map((address) => (
                                                <div
                                                    key={address.id}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAddressId === address.id
                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => handleAddressSelection(address.id)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-start">
                                                            <input
                                                                type="radio"
                                                                name="selectedAddress"
                                                                checked={selectedAddressId === address.id}
                                                                onChange={() => handleAddressSelection(address.id)}
                                                                className="mt-1 mr-3"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center mb-2">
                                                                    <p className="font-medium text-gray-800">
                                                                        {address.first_name} {address.last_name}
                                                                    </p>
                                                                    {address.is_default && (
                                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                            Default
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-gray-600 text-sm">{address.address_line1}</p>
                                                                {address.address_line2 && (
                                                                    <p className="text-gray-600 text-sm">{address.address_line2}</p>
                                                                )}
                                                                <p className="text-gray-600 text-sm">
                                                                    {address.city}, {address.state} {address.zip_code}
                                                                </p>
                                                                <p className="text-gray-600 text-sm">{address.country}</p>
                                                                <div className="mt-2 space-y-1">
                                                                    <p className="text-gray-500 text-xs flex items-center">
                                                                        <span className="mr-1">📞</span> {address.phone || 'No phone'}
                                                                    </p>
                                                                    <p className="text-gray-500 text-xs flex items-center">
                                                                        <span className="mr-1">✉️</span> {address.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteAddress(address.id, e)}
                                                            className="text-gray-400 hover:text-red-600 p-1"
                                                            title="Delete address"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    Selected: {selectedAddressId ? '✅' : '❌'}
                                                    {selectedAddressId && (
                                                        <span className="ml-2">
                                                            {shippingAddresses.find(a => a.id === selectedAddressId)?.first_name}'s address
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewAddressForm(true)}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center"
                                                    >
                                                        <span className="mr-1">+</span> Add another address
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                                {shippingAddresses.length === 0 ? 'No addresses found' : 'Add New Address'}
                                            </h3>
                                            <p className="text-gray-600">
                                                {shippingAddresses.length === 0
                                                    ? 'Please add your shipping address to continue with checkout.'
                                                    : 'Fill in the form below to add a new shipping address.'
                                                }
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    First Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required={showNewAddressForm}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Last Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required={showNewAddressForm}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required={showNewAddressForm}
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="(123) 456-7890"
                                                required={showNewAddressForm}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Required for delivery updates and contact
                                            </p>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Street Address *
                                            </label>
                                            <input
                                                type="text"
                                                name="addressLine1"
                                                value={formData.addressLine1}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required={showNewAddressForm}
                                                placeholder="123 Main St"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Apartment, Suite, etc. (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="addressLine2"
                                                value={formData.addressLine2}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Apt 4B"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required={showNewAddressForm}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    State *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required={showNewAddressForm}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ZIP Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="zipCode"
                                                    value={formData.zipCode}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required={showNewAddressForm}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Order Notes (Optional)
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                rows="3"
                                                placeholder="Any special instructions for delivery..."
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="isDefault"
                                                    name="isDefault"
                                                    checked={formData.isDefault}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 rounded"
                                                />
                                                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                                                    Set as default shipping address
                                                </label>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCreateNewAddress}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Save address
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method Section */}
                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                <div className="flex items-center mb-6">
                                    <Package className="h-6 w-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-800">Payment Method</h2>
                                </div>

                                <div className="p-6 border-2 border-yellow-500 rounded-lg bg-yellow-50">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                                            <Clock className="h-6 w-6 text-yellow-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">Cash on Delivery</h3>
                                            <p className="text-gray-600">Pay when you receive your order</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                                        <h4 className="font-semibold text-gray-800 mb-2">How it works:</h4>
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>Place your order without online payment</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>Our delivery partner will contact you to confirm</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>Pay the exact amount in cash when your order arrives</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>Get your receipt and enjoy your purchase!</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <strong>Note:</strong> Please have the exact amount ready for the delivery person.
                                            The total amount will be <span className="font-bold">${total.toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>

                            {cart.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Your cart is empty</p>
                                    <button
                                        onClick={() => navigate('/products')}
                                        className="mt-4 text-blue-600 hover:text-blue-800"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                                        {cart.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="h-12 w-12 object-cover rounded-md mr-3"
                                                    />
                                                    <div className="max-w-[180px]">
                                                        <p className="text-sm font-medium text-gray-800 truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            Qty: {item.quantity}
                                                            {item.size && ` • Size: ${item.size}`}
                                                            {item.color && ` • Color: ${item.color}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-medium text-gray-800 whitespace-nowrap">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span>
                                                {shipping === 0 ? (
                                                    <span className="text-green-600">FREE</span>
                                                ) : (
                                                    `$${shipping.toFixed(2)}`
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Tax (8%)</span>
                                            <span>${tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-gray-800 pt-3 border-t">
                                            <span>Total to Pay</span>
                                            <span>${total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-700">
                                                <strong>Cash Payment:</strong> You will pay <span className="font-bold">${total.toFixed(2)}</span> when your order is delivered.
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleSubmitOrder}
                                            disabled={loading || cart.length === 0}
                                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                    Placing Order...
                                                </>
                                            ) : (
                                                `Place Order (Cash on Delivery)`
                                            )}
                                        </button>

                                        <div className="flex items-center justify-center mt-4 text-sm text-gray-600">
                                            <Truck className="h-4 w-4 mr-2" />
                                            <span>Estimated delivery: 3-5 business days</span>
                                        </div>

                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="w-full mt-4 text-center text-blue-600 hover:text-blue-800 flex items-center justify-center"
                                        >
                                            <Home className="h-4 w-4 mr-2" />
                                            Back to Dashboard
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;