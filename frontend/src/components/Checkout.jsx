import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Truck, MapPin, Package, Home, Loader2, Clock, Trash2, CreditCard } from 'lucide-react';
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

    // Shipping Address States
    const [shippingAddresses, setShippingAddresses] = useState([]);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState(null);
    const [showNewShippingAddressForm, setShowNewShippingAddressForm] = useState(false);

    // Billing Address States
    const [billingAddresses, setBillingAddresses] = useState([]);
    const [selectedBillingAddressId, setSelectedBillingAddressId] = useState(null);
    const [showNewBillingAddressForm, setShowNewBillingAddressForm] = useState(false);
    const [useShippingForBilling, setUseShippingForBilling] = useState(true);

    const [savingAddress, setSavingAddress] = useState(false);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

    const { token: contextToken } = useAuth();
    const token = contextToken || localStorage.getItem('token');

    const [shippingFormData, setShippingFormData] = useState({
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

    const [billingFormData, setBillingFormData] = useState({
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
        isDefault: true
    });

    const subtotal = getCartTotal();
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    useEffect(() => {
        const fetchAddresses = async () => {
            if (!token) {
                setIsLoadingAddresses(false);
                return;
            }

            try {
                setIsLoadingAddresses(true);

                // Fetch both shipping and billing addresses
                const [shippingResponse, billingResponse] = await Promise.all([
                    checkoutAPI.getShippingAddresses(),
                    checkoutAPI.getBillingAddresses()
                ]);

                // Handle shipping addresses
                if (shippingResponse.data && Array.isArray(shippingResponse.data)) {
                    setShippingAddresses(shippingResponse.data);
                    const defaultShippingAddress = shippingResponse.data.find(addr => addr.is_default);
                    if (defaultShippingAddress && shippingResponse.data.length > 0) {
                        setSelectedShippingAddressId(defaultShippingAddress.id);
                        setShowNewShippingAddressForm(false);
                    } else if (shippingResponse.data.length > 0) {
                        setSelectedShippingAddressId(shippingResponse.data[0].id);
                        setShowNewShippingAddressForm(false);
                    } else {
                        setShowNewShippingAddressForm(true);
                    }
                } else {
                    setShowNewShippingAddressForm(true);
                }

                // Handle billing addresses
                if (billingResponse.data && Array.isArray(billingResponse.data)) {
                    setBillingAddresses(billingResponse.data);
                    const defaultBillingAddress = billingResponse.data.find(addr => addr.is_default);
                    if (defaultBillingAddress && billingResponse.data.length > 0 && !useShippingForBilling) {
                        setSelectedBillingAddressId(defaultBillingAddress.id);
                        setShowNewBillingAddressForm(false);
                    } else if (billingResponse.data.length > 0 && !useShippingForBilling) {
                        setSelectedBillingAddressId(billingResponse.data[0].id);
                        setShowNewBillingAddressForm(false);
                    }
                }

            } catch (error) {
                console.error('Error fetching addresses:', error);
                setError('Failed to load addresses. Please try again.');
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        fetchAddresses();
    }, [token, useShippingForBilling]);

    useEffect(() => {
        if (user) {
            setShippingFormData(prev => ({
                ...prev,
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ')[1] || '',
                email: user?.email || ''
            }));
            setBillingFormData(prev => ({
                ...prev,
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ')[1] || '',
                email: user?.email || ''
            }));
        }
    }, [user]);

    const handleShippingInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setShippingFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBillingInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBillingFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        // Validate shipping address
        if (!showNewShippingAddressForm && !selectedShippingAddressId) {
            alert('Please select a shipping address or create a new one');
            return false;
        }

        if (showNewShippingAddressForm) {
            const requiredFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city', 'state', 'zipCode'];
            for (const field of requiredFields) {
                if (!shippingFormData[field]) {
                    alert(`Please fill in shipping ${field}`);
                    return false;
                }
            }

            if (!shippingFormData.email.includes('@')) {
                alert('Please enter a valid shipping email address');
                return false;
            }
        }

        // Validate billing address
        if (!useShippingForBilling) {
            if (!showNewBillingAddressForm && !selectedBillingAddressId) {
                alert('Please select a billing address or create a new one');
                return false;
            }

            if (showNewBillingAddressForm) {
                const requiredFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city', 'state', 'zipCode'];
                for (const field of requiredFields) {
                    if (!billingFormData[field]) {
                        alert(`Please fill in billing ${field}`);
                        return false;
                    }
                }

                if (!billingFormData.email.includes('@')) {
                    alert('Please enter a valid billing email address');
                    return false;
                }
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
            let billingAddressData = null;

            // Prepare shipping address data
            if (selectedShippingAddressId && !showNewShippingAddressForm) {
                shippingAddressData = { shippingAddressId: selectedShippingAddressId };
            } else {
                shippingAddressData = {
                    shippingAddress: {
                        firstName: shippingFormData.firstName,
                        lastName: shippingFormData.lastName,
                        email: shippingFormData.email,
                        phone: shippingFormData.phone,
                        addressLine1: shippingFormData.addressLine1,
                        addressLine2: shippingFormData.addressLine2 || '',
                        city: shippingFormData.city,
                        state: shippingFormData.state,
                        zipCode: shippingFormData.zipCode,
                        country: shippingFormData.country
                    },
                    saveShippingAsDefault: shippingFormData.isDefault
                };
            }

            // Prepare billing address data
            if (!useShippingForBilling) {
                if (selectedBillingAddressId && !showNewBillingAddressForm) {
                    billingAddressData = { billingAddressId: selectedBillingAddressId };
                } else if (showNewBillingAddressForm) {
                    billingAddressData = {
                        billingAddress: {
                            firstName: billingFormData.firstName,
                            lastName: billingFormData.lastName,
                            email: billingFormData.email,
                            phone: billingFormData.phone,
                            addressLine1: billingFormData.addressLine1,
                            addressLine2: billingFormData.addressLine2 || '',
                            city: billingFormData.city,
                            state: billingFormData.state,
                            zipCode: billingFormData.zipCode,
                            country: billingFormData.country
                        },
                        saveBillingAsDefault: billingFormData.isDefault
                    };
                }
            }

            // Prepare request data
            const requestData = {
                ...shippingAddressData,
                ...billingAddressData,
                useSameAddress: useShippingForBilling,
                paymentMethod: 'cod',
                notes: shippingFormData.notes
            };

            const response = await checkoutAPI.createSession(requestData);
            const result = response.data;

            if (response.status < 200 || response.status >= 300) {
                throw new Error(result.message || 'Order failed');
            }

            setOrderId(result.orderId || result.orderNumber);
            setOrderPlaced(true);

            const cleared = await clearCart();
            if (cleared) {
                toast.success('Order placed successfully! Cash on Delivery selected.', {
                    duration: 5000,
                    position: 'top-right',
                    style: {
                        background: '#10B981',
                        color: '#fff',
                    },
                });
            }

        } catch (error) {
            console.error('Order failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Order failed. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#EF4444',
                    color: '#fff',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleShippingAddressSelection = (addressId) => {
        setSelectedShippingAddressId(addressId);
        setShowNewShippingAddressForm(false);
    };

    const handleBillingAddressSelection = (addressId) => {
        setSelectedBillingAddressId(addressId);
        setShowNewBillingAddressForm(false);
        setUseShippingForBilling(false);
    };

    const handleDeleteShippingAddress = async (addressId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this shipping address?')) {
            return;
        }

        try {
            await checkoutAPI.deleteShippingAddress(addressId);
            setShippingAddresses(prev => prev.filter(addr => addr.id !== addressId));
            if (selectedShippingAddressId === addressId) {
                setSelectedShippingAddressId(null);
                if (shippingAddresses.length > 1) {
                    const otherAddress = shippingAddresses.find(addr => addr.id !== addressId);
                    if (otherAddress) {
                        setSelectedShippingAddressId(otherAddress.id);
                    } else {
                        setShowNewShippingAddressForm(true);
                    }
                } else {
                    setShowNewShippingAddressForm(true);
                }
            }
            alert('Shipping address deleted successfully');
        } catch (error) {
            console.error('Error deleting shipping address:', error);
            alert('Failed to delete shipping address');
        }
    };

    const handleDeleteBillingAddress = async (addressId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this billing address?')) {
            return;
        }

        try {
            await checkoutAPI.deleteBillingAddress(addressId);
            setBillingAddresses(prev => prev.filter(addr => addr.id !== addressId));
            if (selectedBillingAddressId === addressId) {
                setSelectedBillingAddressId(null);
                if (billingAddresses.length > 1) {
                    const otherAddress = billingAddresses.find(addr => addr.id !== addressId);
                    if (otherAddress) {
                        setSelectedBillingAddressId(otherAddress.id);
                    } else {
                        setShowNewBillingAddressForm(true);
                    }
                } else {
                    setShowNewBillingAddressForm(true);
                }
            }
            alert('Billing address deleted successfully');
        } catch (error) {
            console.error('Error deleting billing address:', error);
            alert('Failed to delete billing address');
        }
    };

    const handleCreateNewShippingAddress = async () => {
        const requiredFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city', 'state', 'zipCode'];
        for (const field of requiredFields) {
            if (!shippingFormData[field]) {
                alert(`Please fill in shipping ${field}`);
                return;
            }
        }

        if (!shippingFormData.email.includes('@')) {
            alert('Please enter a valid shipping email address');
            return;
        }

        setSavingAddress(true);
        try {
            const response = await checkoutAPI.createShippingAddress({
                firstName: shippingFormData.firstName,
                lastName: shippingFormData.lastName,
                email: shippingFormData.email,
                phone: shippingFormData.phone,
                addressLine1: shippingFormData.addressLine1,
                addressLine2: shippingFormData.addressLine2 || '',
                city: shippingFormData.city,
                state: shippingFormData.state,
                zipCode: shippingFormData.zipCode,
                country: shippingFormData.country,
                isDefault: shippingFormData.isDefault
            });

            const newAddress = response.data;
            setShippingAddresses(prev => [...prev, newAddress]);
            setSelectedShippingAddressId(newAddress.id);
            setShowNewShippingAddressForm(false);
            alert('Shipping address saved successfully!');
        } catch (error) {
            console.error('Error creating shipping address:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save shipping address';
            alert(errorMsg);
        } finally {
            setSavingAddress(false);
        }
    };

    const handleCreateNewBillingAddress = async () => {
        const requiredFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city', 'state', 'zipCode'];
        for (const field of requiredFields) {
            if (!billingFormData[field]) {
                alert(`Please fill in billing ${field}`);
                return;
            }
        }

        if (!billingFormData.email.includes('@')) {
            alert('Please enter a valid billing email address');
            return;
        }

        setSavingAddress(true);
        try {
            const response = await checkoutAPI.createBillingAddress({
                firstName: billingFormData.firstName,
                lastName: billingFormData.lastName,
                email: billingFormData.email,
                phone: billingFormData.phone,
                addressLine1: billingFormData.addressLine1,
                addressLine2: billingFormData.addressLine2 || '',
                city: billingFormData.city,
                state: billingFormData.state,
                zipCode: billingFormData.zipCode,
                country: billingFormData.country,
                isDefault: billingFormData.isDefault
            });

            const newAddress = response.data;
            setBillingAddresses(prev => [...prev, newAddress]);
            setSelectedBillingAddressId(newAddress.id);
            setShowNewBillingAddressForm(false);
            setUseShippingForBilling(false);
            alert('Billing address saved successfully!');
        } catch (error) {
            console.error('Error creating billing address:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save billing address';
            alert(errorMsg);
        } finally {
            setSavingAddress(false);
        }
    };

    const handleUseShippingForBillingChange = (checked) => {
        setUseShippingForBilling(checked);
        if (checked) {
            setSelectedBillingAddressId(null);
            setShowNewBillingAddressForm(false);
        }
    };

    useEffect(() => {
        if (orderPlaced) {
            const timer = setTimeout(() => {
                navigate('/orders');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [orderPlaced, navigate, orderId]);

    if (orderPlaced) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8">
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

    const renderAddressForm = (formData, handleInputChange, isShipping = true) => (
        <div>
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
                        required
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
                        required
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
                    required
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
                    required
                />
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
                    required
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
                        required
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
                        required
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
                        required
                    />
                </div>
            </div>

            {isShipping ? (
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
            ) : null}

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id={`${isShipping ? 'shipping' : 'billing'}IsDefault`}
                        name="isDefault"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`${isShipping ? 'shipping' : 'billing'}IsDefault`} className="ml-2 text-sm text-gray-700">
                        Set as default {isShipping ? 'shipping' : 'billing'} address
                    </label>
                </div>
                <button
                    type="button"
                    onClick={isShipping ? handleCreateNewShippingAddress : handleCreateNewBillingAddress}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                >
                    Save address
                </button>
            </div>
        </div>
    );

    const renderAddressSelection = (addresses, selectedId, handleSelection, handleDelete, isShipping = true) => (
        <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
                Select {isShipping ? 'Shipping' : 'Billing'} Address ({addresses.length} available)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                    <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedId === address.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                        onClick={() => handleSelection(address.id)}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-start">
                                <input
                                    type="radio"
                                    name={isShipping ? "selectedShippingAddress" : "selectedBillingAddress"}
                                    checked={selectedId === address.id}
                                    onChange={() => handleSelection(address.id)}
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
                                onClick={(e) => handleDelete(address.id, e)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title={`Delete ${isShipping ? 'shipping' : 'billing'} address`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
                    <div className="flex items-center text-gray-600">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">1</div>
                            <span>Shipping & Billing</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">2</div>
                            <span>Payment</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mr-2">3</div>
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
                    {/* Left Column - Forms */}
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
                                            onClick={() => setShowNewShippingAddressForm(!showNewShippingAddressForm)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            {showNewShippingAddressForm ? '← Back to addresses' : 'Add new address'}
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
                                ) : !showNewShippingAddressForm && shippingAddresses.length > 0 ? (
                                    <>
                                        {renderAddressSelection(
                                            shippingAddresses,
                                            selectedShippingAddressId,
                                            handleShippingAddressSelection,
                                            handleDeleteShippingAddress,
                                            true
                                        )}
                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    Selected: {selectedShippingAddressId ? '✅' : '❌'}
                                                    {selectedShippingAddressId && (
                                                        <span className="ml-2">
                                                            {shippingAddresses.find(a => a.id === selectedShippingAddressId)?.first_name}'s address
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewShippingAddressForm(true)}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center"
                                                    >
                                                        <span className="mr-1">+</span> Add another address
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                                {shippingAddresses.length === 0 ? 'No shipping addresses found' : 'Add New Shipping Address'}
                                            </h3>
                                            <p className="text-gray-600">
                                                {shippingAddresses.length === 0
                                                    ? 'Please add your shipping address to continue with checkout.'
                                                    : 'Fill in the form below to add a new shipping address.'
                                                }
                                            </p>
                                        </div>
                                        {renderAddressForm(shippingFormData, handleShippingInputChange, true)}
                                    </div>
                                )}
                            </div>

                            {/* Billing Information */}
                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <CreditCard className="h-6 w-6 text-green-600 mr-3" />
                                        <h2 className="text-xl font-semibold text-gray-800">Billing Address</h2>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewBillingAddressForm(!showNewBillingAddressForm)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            {showNewBillingAddressForm ? '← Back to addresses' : 'Add new address'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/billing-addresses')}
                                            className="text-gray-600 hover:text-gray-800 text-sm"
                                        >
                                            Manage all addresses
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="useShippingForBilling"
                                            checked={useShippingForBilling}
                                            onChange={(e) => handleUseShippingForBillingChange(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 rounded"
                                        />
                                        <label htmlFor="useShippingForBilling" className="ml-2 text-sm text-gray-700">
                                            Use shipping address for billing
                                        </label>
                                    </div>
                                    {useShippingForBilling && (
                                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-green-700 text-sm">
                                                ✓ Billing address will be the same as shipping address
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {!useShippingForBilling && (
                                    isLoadingAddresses ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
                                            <p className="text-gray-600">Loading billing addresses...</p>
                                        </div>
                                    ) : !showNewBillingAddressForm && billingAddresses.length > 0 ? (
                                        <>
                                            {renderAddressSelection(
                                                billingAddresses,
                                                selectedBillingAddressId,
                                                handleBillingAddressSelection,
                                                handleDeleteBillingAddress,
                                                false
                                            )}
                                            <div className="mt-6 pt-4 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm text-gray-600">
                                                        Selected: {selectedBillingAddressId ? '✅' : '❌'}
                                                        {selectedBillingAddressId && (
                                                            <span className="ml-2">
                                                                {billingAddresses.find(a => a.id === selectedBillingAddressId)?.first_name}'s address
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewBillingAddressForm(true)}
                                                            className="text-blue-600 hover:text-blue-800 flex items-center"
                                                        >
                                                            <span className="mr-1">+</span> Add another address
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <h3 className="text-lg font-medium text-gray-800 mb-2">
                                                    {billingAddresses.length === 0 ? 'No billing addresses found' : 'Add New Billing Address'}
                                                </h3>
                                                <p className="text-gray-600">
                                                    {billingAddresses.length === 0
                                                        ? 'Please add your billing address to continue with checkout.'
                                                        : 'Fill in the form below to add a new billing address.'
                                                    }
                                                </p>
                                            </div>
                                            {renderAddressForm(billingFormData, handleBillingInputChange, false)}
                                        </div>
                                    )
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