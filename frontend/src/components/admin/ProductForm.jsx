import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image, Package, Tag, DollarSign, Hash, Palette, Layers, Plus, Minus } from 'lucide-react';
import { productsAPI, handleAPIError, categoriesAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ProductForm = ({ product, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: '',
        brand: '',
        size: '',
        color: '',
        stock_quantity: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'advanced'

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
    const colors = [
        { name: 'Black', value: '#000000' },
        { name: 'White', value: '#FFFFFF' },
        { name: 'Red', value: '#DC2626' },
        { name: 'Blue', value: '#2563EB' },
        { name: 'Green', value: '#16A34A' },
        { name: 'Yellow', value: '#CA8A04' },
        { name: 'Purple', value: '#7C3AED' },
        { name: 'Pink', value: '#DB2777' },
        { name: 'Gray', value: '#6B7280' },
        { name: 'Brown', value: '#92400E' }
    ];

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                image_url: product.image_url || '',
                category: product.category || '',
                brand: product.brand || '',
                size: product.size || '',
                color: product.color || '',
                stock_quantity: product.stock_quantity || ''
            });
        }
        fetchCategories();
    }, [product]);

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleNumberChange = (name, operation = 'increase') => {
        setFormData(prev => {
            const currentValue = parseFloat(prev[name]) || 0;
            let newValue = currentValue;

            if (operation === 'increase') {
                newValue = name === 'price' ? (currentValue + 0.01) : (currentValue + 1);
            } else {
                newValue = name === 'price' ? Math.max(0, currentValue - 0.01) : Math.max(0, currentValue - 1);
            }

            return {
                ...prev,
                [name]: newValue.toFixed(name === 'price' ? 2 : 0)
            };
        });
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value === '_new') {
            setShowNewCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
        } else {
            setFormData(prev => ({ ...prev, category: value }));
            setShowNewCategory(false);
        }
    };

    const handleAddNewCategory = async () => {
        if (!newCategory.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            await categoriesAPI.create({ name: newCategory });
            toast.success('Category created successfully');
            setFormData(prev => ({ ...prev, category: newCategory }));
            setNewCategory('');
            setShowNewCategory(false);
            fetchCategories();
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleColorSelect = (colorName) => {
        setFormData(prev => ({
            ...prev,
            color: colorName
        }));
        if (errors.color) {
            setErrors(prev => ({ ...prev, color: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
        if (!formData.image_url.trim()) newErrors.image_url = 'Image URL is required';
        if (!formData.category.trim()) newErrors.category = 'Category is required';
        if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
        if (!formData.size) newErrors.size = 'Size is required';
        if (!formData.color.trim()) newErrors.color = 'Color is required';
        if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
            newErrors.stock_quantity = 'Valid stock quantity is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        try {
            setLoading(true);
            const submitData = {
                ...formData,
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity)
            };

            if (product) {
                await productsAPI.update(product.id, submitData);
                toast.success('Product updated successfully');
            } else {
                await productsAPI.create(submitData);
                toast.success('Product created successfully');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {product ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    {product ? 'Update existing product details' : 'Fill in the details to add a new product'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            title="Close"
                        >
                            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 bg-gray-50">
                        <button
                            onClick={() => setActiveTab('basic')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'basic'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Package className="h-4 w-4" />
                                <span>Basic Info</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('advanced')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'advanced'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Layers className="h-4 w-4" />
                                <span>Details & Inventory</span>
                            </div>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        <div className="space-y-6">
                            {/* Basic Info Tab */}
                            {activeTab === 'basic' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Product Name */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                                <Tag className="h-4 w-4 mr-2 text-blue-500" />
                                                Product Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                placeholder="e.g., Premium Cotton T-Shirt"
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Description *
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={4}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                placeholder="Describe the product features, benefits, and specifications..."
                                            />
                                            {errors.description && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {formData.description.length}/500 characters
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                                                Price ($) *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNumberChange('price', 'increase')}
                                                        className="p-1 hover:bg-gray-100 rounded-t-lg"
                                                    >
                                                        <Plus className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNumberChange('price', 'decrease')}
                                                        className="p-1 hover:bg-gray-100 rounded-b-lg"
                                                    >
                                                        <Minus className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                            {errors.price && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.price}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Image URL */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                                <Image className="h-4 w-4 mr-2 text-purple-500" />
                                                Image URL *
                                            </label>
                                            <input
                                                type="url"
                                                name="image_url"
                                                value={formData.image_url}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.image_url ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                placeholder="https://example.com/product-image.jpg"
                                            />
                                            {errors.image_url && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.image_url}
                                                </p>
                                            )}
                                        </div>

                                        {/* Image Preview */}
                                        {formData.image_url && (
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-gray-700">
                                                    Image Preview
                                                </label>
                                                <div className="relative group">
                                                    <img
                                                        src={formData.image_url}
                                                        alt="Preview"
                                                        className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                                            e.target.className = 'w-full h-48 object-contain rounded-xl border-2 border-gray-200 p-4 bg-gray-100';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Advanced Tab */}
                            {activeTab === 'advanced' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Category */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Category *
                                            </label>
                                            {!showNewCategory ? (
                                                <div className="space-y-2">
                                                    <select
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleCategoryChange}
                                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        <option value="">Select a category</option>
                                                        {categories.map(category => (
                                                            <option key={category.id} value={category.name}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewCategory(true)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Add new category
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={newCategory}
                                                            onChange={(e) => setNewCategory(e.target.value)}
                                                            placeholder="Enter new category name"
                                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleAddNewCategory}
                                                            className="px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewCategory(false)}
                                                            className="px-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        The new category will be available for all products
                                                    </p>
                                                </div>
                                            )}
                                            {errors.category && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.category}
                                                </p>
                                            )}
                                        </div>

                                        {/* Brand */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Brand *
                                            </label>
                                            <input
                                                type="text"
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.brand ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                placeholder="e.g., Nike, Adidas, Apple"
                                            />
                                            {errors.brand && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.brand}
                                                </p>
                                            )}
                                        </div>

                                        {/* Size */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Size *
                                            </label>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                {sizes.map(size => (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, size }))}
                                                        className={`py-2 px-3 rounded-lg border transition-all ${formData.size === size
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.size && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.size}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Color */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                                <Palette className="h-4 w-4 mr-2 text-pink-500" />
                                                Color *
                                            </label>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                    {colors.map(color => (
                                                        <button
                                                            key={color.name}
                                                            type="button"
                                                            onClick={() => handleColorSelect(color.name)}
                                                            className={`relative p-4 rounded-lg border transition-all group ${formData.color === color.name
                                                                ? 'ring-2 ring-offset-2 ring-blue-500'
                                                                : 'hover:ring-2 hover:ring-offset-2 hover:ring-blue-300'
                                                                }`}
                                                            style={{ backgroundColor: color.value }}
                                                            title={color.name}
                                                        >
                                                            <div className={`absolute inset-0 rounded-lg ${formData.color === color.name
                                                                ? 'bg-black bg-opacity-10'
                                                                : 'group-hover:bg-black group-hover:bg-opacity-5'
                                                                }`} />
                                                            {formData.color === color.name && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="bg-white bg-opacity-90 rounded-full p-1">
                                                                        <svg className="h-4 w-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        name="color"
                                                        value={formData.color}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.color ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                        placeholder="Or type custom color..."
                                                    />
                                                </div>
                                            </div>
                                            {errors.color && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.color}
                                                </p>
                                            )}
                                        </div>

                                        {/* Stock Quantity */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                                <Hash className="h-4 w-4 mr-2 text-orange-500" />
                                                Stock Quantity *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="stock_quantity"
                                                    value={formData.stock_quantity}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.stock_quantity ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                    placeholder="0"
                                                />
                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNumberChange('stock_quantity', 'increase')}
                                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                                    >
                                                        <Plus className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNumberChange('stock_quantity', 'decrease')}
                                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                                    >
                                                        <Minus className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                            {errors.stock_quantity && (
                                                <p className="text-red-500 text-sm flex items-center">
                                                    <span className="mr-1">⚠</span> {errors.stock_quantity}
                                                </p>
                                            )}
                                            <div className={`mt-2 p-3 rounded-lg ${parseInt(formData.stock_quantity) > 10
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : parseInt(formData.stock_quantity) > 0
                                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                <div className="flex items-center">
                                                    <div className={`h-2 w-2 rounded-full mr-2 ${parseInt(formData.stock_quantity) > 10
                                                        ? 'bg-green-500'
                                                        : parseInt(formData.stock_quantity) > 0
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                        }`} />
                                                    {parseInt(formData.stock_quantity) > 10
                                                        ? 'Good stock level'
                                                        : parseInt(formData.stock_quantity) > 0
                                                            ? 'Low stock alert'
                                                            : 'Out of stock'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(activeTab === 'basic' ? 'advanced' : 'basic')}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                                >
                                    {activeTab === 'basic' ? (
                                        <>
                                            <Layers className="h-4 w-4 mr-2" />
                                            Advanced Details
                                        </>
                                    ) : (
                                        <>
                                            <Package className="h-4 w-4 mr-2" />
                                            Basic Info
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {product ? 'Update Product' : 'Create Product'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProductForm;