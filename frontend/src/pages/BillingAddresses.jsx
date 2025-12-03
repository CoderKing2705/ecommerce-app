import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkoutAPI } from '../utils/api';
import { Edit, Trash2, MapPin, Plus, CreditCard } from 'lucide-react';

const BillingAddresses = () => {
    const { token } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await checkoutAPI.getBillingAddresses();
            setAddresses(response.data);
        } catch (error) {
            console.error('Error fetching billing addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await checkoutAPI.updateBillingAddress(editingId, formData);
                alert('Billing address updated successfully');
            } else {
                await checkoutAPI.createBillingAddress(formData);
                alert('Billing address saved successfully');
            }
            fetchAddresses();
            resetForm();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving address');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this billing address?')) {
            try {
                await checkoutAPI.deleteBillingAddress(id);
                fetchAddresses();
            } catch (error) {
                alert(error.response?.data?.message || 'Error deleting address');
            }
        }
    };

    const handleEdit = (address) => {
        setFormData({
            firstName: address.first_name,
            lastName: address.last_name,
            email: address.email,
            phone: address.phone,
            addressLine1: address.address_line1,
            addressLine2: address.address_line2 || '',
            city: address.city,
            state: address.state,
            zipCode: address.zip_code,
            country: address.country,
            isDefault: address.is_default
        });
        setEditingId(address.id);
        setShowForm(true);
    };

    const handleSetDefault = async (id) => {
        try {
            await api.put(`/billing-addresses/${id}/default`);
            fetchAddresses();
            alert('Default billing address updated');
        } catch (error) {
            alert('Error setting default address');
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA',
            isDefault: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Billing Addresses</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add New Billing Address
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? 'Edit Billing Address' : 'Add New Billing Address'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                        />
                        <input
                            type="tel"
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Address Line 1"
                            value={formData.addressLine1}
                            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Address Line 2 (Optional)"
                            value={formData.addressLine2}
                            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="City"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="ZIP Code"
                                value={formData.zipCode}
                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <label htmlFor="isDefault">Set as default billing address</label>
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {editingId ? 'Update Address' : 'Save Address'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((address) => (
                    <div key={address.id} className={`bg-white p-6 rounded-lg shadow-md ${address.is_default ? 'border-2 border-blue-500' : 'border'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <CreditCard className="text-green-600" />
                                <h3 className="font-semibold text-lg">
                                    {address.first_name} {address.last_name}
                                </h3>
                                {address.is_default && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                        Default
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(address)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(address.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 text-gray-600">
                            <p>{address.address_line1}</p>
                            {address.address_line2 && <p>{address.address_line2}</p>}
                            <p>{address.city}, {address.state} {address.zip_code}</p>
                            <p>{address.country}</p>
                            <p>📱 {address.phone}</p>
                            <p>✉️ {address.email}</p>
                        </div>
                        {!address.is_default && (
                            <button
                                onClick={() => handleSetDefault(address.id)}
                                className="mt-4 text-sm text-green-600 hover:text-green-800"
                            >
                                Set as default
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {addresses.length === 0 && !showForm && (
                <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No billing addresses saved yet.</p>
                    <p className="text-gray-400 text-sm mb-4">Add billing addresses for faster checkout</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Add your first billing address
                    </button>
                </div>
            )}
        </div>
    );
};

export default BillingAddresses;