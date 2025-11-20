import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Tag, Package, Search } from 'lucide-react';
import { categoriesAPI, handleAPIError } from '../../utils/api';
import toast from 'react-hot-toast';

const CategoryManager = ({ isOpen, onClose, onCategoryUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editName, setEditName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoriesAPI.getAll();
            setCategories(response.data.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            await categoriesAPI.create({ name: newCategoryName });
            toast.success('Category created successfully');
            setNewCategoryName('');
            fetchCategories();
            onCategoryUpdate?.();
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleUpdateCategory = async (oldName) => {
        if (!editName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            await categoriesAPI.update(oldName, editName);
            toast.success('Category updated successfully');
            setEditingCategory(null);
            setEditName('');
            fetchCategories();
            onCategoryUpdate?.();
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleDeleteCategory = async (name) => {
        if (!confirm(`Are you sure you want to delete category "${name}"? This will remove the category from all products.`)) {
            return;
        }

        try {
            await categoriesAPI.delete(name);
            toast.success('Category deleted successfully');
            fetchCategories();
            onCategoryUpdate?.();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error(handleAPIError(error));
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Tag className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
                                <p className="text-blue-100 text-sm">
                                    Organize your product categories
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 group"
                        >
                            <X className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Add New Category Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Plus className="h-5 w-5 mr-2 text-blue-600" />
                            Add New Category
                        </h3>
                        <form onSubmit={handleCreateCategory} className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Enter category name (e.g., Electronics, Clothing)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add Category</span>
                            </button>
                        </form>
                    </div>

                    {/* Search and Stats */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search categories..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                            {categories.length} total categories
                            {searchTerm && ` • ${filteredCategories.length} found`}
                        </div>
                    </div>

                    {/* Categories List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading categories...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCategories.map((category, index) => (
                                <div
                                    key={category.name}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-200 group"
                                >
                                    {editingCategory === category.name ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter new category name"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateCategory(category.name)}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                                                    title="Save changes"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(null);
                                                        setEditName('');
                                                    }}
                                                    className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                                                    title="Cancel editing"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                                                    <Package className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-lg truncate">
                                                        {category.name}
                                                    </h4>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span className="flex items-center space-x-1">
                                                            <Package className="h-3 w-3" />
                                                            <span>{category.product_count} products</span>
                                                        </span>
                                                        {category.created_at && (
                                                            <span>
                                                                Created {new Date(category.created_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(category.name);
                                                        setEditName(category.name);
                                                    }}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                                                    title="Edit category"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category.name)}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
                                                    title="Delete category"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filteredCategories.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {searchTerm ? 'No categories found' : 'No categories yet'}
                                    </h3>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        {searchTerm
                                            ? `No categories match "${searchTerm}". Try a different search term.`
                                            : 'Get started by creating your first product category above.'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-600">
                            Categories help organize your products and improve customer experience
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                            >
                                Close
                            </button>
                            {categories.length > 0 && (
                                <button
                                    onClick={fetchCategories}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
                                >
                                    Refresh List
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;