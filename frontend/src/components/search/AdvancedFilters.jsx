import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Star, DollarSign, Package } from 'lucide-react';

const AdvancedFilters = ({
    filters,
    onFiltersChange,
    filterOptions,
    isOpen,
    onClose
}) => {
    const [localFilters, setLocalFilters] = useState({
        search: '',
        category: '',
        brand: '',
        minPrice: 0,
        maxPrice: 1000,
        minRating: 0,
        inStock: false,
        sortBy: 'name',
        page: 1
    });

    // Initialize with filterOptions when available
    useEffect(() => {
        if (filterOptions) {
            setLocalFilters(prev => ({
                ...prev,
                minPrice: 0,
                maxPrice: filterOptions.max_price || 1000
            }));
        }
    }, [filterOptions]);

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value, page: 1 };
        setLocalFilters(newFilters);
    };

    const handlePriceChange = (type, value) => {
        const numValue = parseFloat(value) || 0;
        setLocalFilters(prev => ({
            ...prev,
            [type]: numValue,
            page: 1
        }));
    };

    const handleApplyFilters = () => {
        onFiltersChange(localFilters);
        onClose();
    };

    const handleResetFilters = () => {
        const resetFilters = {
            search: '',
            category: '',
            brand: '',
            minPrice: 0,
            maxPrice: filterOptions?.max_price || 1000,
            minRating: 0,
            inStock: false,
            sortBy: 'name',
            page: 1
        };
        setLocalFilters(resetFilters);
        onFiltersChange(resetFilters);
        onClose();
    };

    const activeFilterCount = Object.keys(filters).filter(key => {
        if (key === 'page') return false;
        if (key === 'sortBy') return filters[key] !== 'name';
        if (key === 'minPrice') return filters[key] > 0;
        if (key === 'maxPrice') return filters[key] < (filterOptions?.max_price || 1000);
        if (key === 'minRating') return filters[key] > 0;
        return filters[key] && filters[key] !== '';
    }).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={onClose}
                    />

                    {/* Filters Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30 }}
                        className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 lg:relative lg:w-64 lg:shadow-none lg:rounded-lg lg:border lg:border-gray-200 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0">
                            <div className="flex items-center space-x-2">
                                <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Filters Content */}
                        <div className="p-4 space-y-6">
                            {/* Price Range */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Price Range
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex space-x-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
                                            <input
                                                type="number"
                                                value={localFilters.minPrice || 0}
                                                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                                min="0"
                                                max={filterOptions?.max_price || 1000}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
                                            <input
                                                type="number"
                                                value={localFilters.maxPrice || (filterOptions?.max_price || 1000)}
                                                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder={filterOptions?.max_price?.toString() || '1000'}
                                                min="0"
                                                max={filterOptions?.max_price || 1000}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                        ${localFilters.minPrice || 0} - ${localFilters.maxPrice || (filterOptions?.max_price || 1000)}
                                    </div>
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <Star className="h-4 w-4 mr-2" />
                                    Minimum Rating
                                </h4>
                                <div className="space-y-2">
                                    {[4, 3, 2, 1].map((rating) => (
                                        <label key={rating} className="flex items-center space-x-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="minRating"
                                                checked={localFilters.minRating === rating}
                                                onChange={() => handleFilterChange('minRating', rating)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`h-4 w-4 transition-colors ${star <= rating
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                                <span className="text-sm text-gray-600 ml-2">& up</span>
                                            </div>
                                        </label>
                                    ))}
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="minRating"
                                            checked={localFilters.minRating === 0}
                                            onChange={() => handleFilterChange('minRating', 0)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">Any rating</span>
                                    </label>
                                </div>
                            </div>

                            {/* Brand Filter */}
                            {filterOptions?.brands && filterOptions.brands.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Brand</h4>
                                    <select
                                        value={localFilters.brand || ''}
                                        onChange={(e) => handleFilterChange('brand', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">All Brands</option>
                                        {filterOptions.brands.map((brand) => (
                                            <option key={brand} value={brand}>
                                                {brand}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Category Filter */}
                            {filterOptions?.categories && filterOptions.categories.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                                    <select
                                        value={localFilters.category || ''}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">All Categories</option>
                                        {filterOptions.categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Stock Status Filter */}
                            <div>
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={localFilters.inStock || false}
                                        onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 flex items-center">
                                        <Package className="h-4 w-4 mr-2" />
                                        In Stock Only
                                    </span>
                                </label>
                            </div>

                            {/* Sort By (for mobile) */}
                            <div className="lg:hidden">
                                <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                                <select
                                    value={localFilters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="name">Name</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="rating">Highest Rated</option>
                                    <option value="newest">Newest</option>
                                    <option value="popular">Most Popular</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer with Action Buttons */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleResetFilters}
                                    className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleApplyFilters}
                                    className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AdvancedFilters;