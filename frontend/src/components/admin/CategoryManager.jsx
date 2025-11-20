import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { productsAPI, handleAPIError, categoriesAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const CategoryManager = ({ isOpen, onClose, onCategoryUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoriesAPI.getAll(); // Use categoriesAPI
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
        if (!newCategoryName.trim()) return;

        try {
            await categoriesAPI.create({ name: newCategoryName }); // Use categoriesAPI
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
        if (!editName.trim()) return;

        try {
            await categoriesAPI.update(oldName, editName); // Use categoriesAPI
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
            await categoriesAPI.delete(name); // Use categoriesAPI
            toast.success('Category deleted successfully');
            fetchCategories();
            onCategoryUpdate?.();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error(handleAPIError(error));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Manage Categories</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Add New Category */}
                    <form onSubmit={handleCreateCategory} className="mb-6">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Enter new category name"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </button>
                        </div>
                    </form>

                    {/* Categories List */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {categories.map((category) => (
                                <div
                                    key={category.name}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                >
                                    {editingCategory === category.name ? (
                                        <div className="flex items-center gap-3 flex-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleUpdateCategory(category.name)}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <Save className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(null);
                                                    setEditName('');
                                                }}
                                                className="text-gray-600 hover:text-gray-800"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1">
                                                <span className="font-medium">{category.name}</span>
                                                <span className="text-sm text-gray-500 ml-2">
                                                    ({category.product_count} products)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(category.name);
                                                        setEditName(category.name);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category.name)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {categories.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No categories found. Create your first category above.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;