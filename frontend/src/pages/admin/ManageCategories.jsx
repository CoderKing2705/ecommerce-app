import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryManager from '../../components/admin/CategoryManager';

const ManageCategories = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const navigate = useNavigate();

    const handleCategoryUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleClose = () => {
        // Navigate back to admin dashboard or products page
        navigate('/admin/products'); // or navigate(-1) to go back
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with Back Button */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
                        <p className="text-gray-600 mt-2">
                            Create, edit, and delete product categories
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <span>← Back to Products</span>
                    </button>
                </div>

                <CategoryManager
                    key={refreshTrigger}
                    isOpen={true}
                    onClose={handleClose}
                    onCategoryUpdate={handleCategoryUpdate}
                />
            </div>
        </div>
    );
};

export default ManageCategories;