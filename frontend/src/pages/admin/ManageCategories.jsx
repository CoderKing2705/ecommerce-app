import React, { useState } from 'react';
import CategoryManager from '../../components/admin/CategoryManager';

const ManageCategories = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleCategoryUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
                    <p className="text-gray-600 mt-2">
                        Create, edit, and delete product categories
                    </p>
                </div>

                <CategoryManager
                    key={refreshTrigger}
                    isOpen={true}
                    onClose={() => { }}
                    onCategoryUpdate={handleCategoryUpdate}
                />
            </div>
        </div>
    );
};

export default ManageCategories;