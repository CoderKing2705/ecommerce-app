import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { productsAPI, handleAPIError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AdvancedFilters from '../components/search/AdvancedFilters';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);
    const [filterOptions, setFilterOptions] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 6
    });
    const { user } = useAuth();

    // Initialize filters from URL or defaults
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        brand: searchParams.get('brand') || '',
        minPrice: parseInt(searchParams.get('minPrice')) || 0,
        maxPrice: parseInt(searchParams.get('maxPrice')) || 1000,
        minRating: parseInt(searchParams.get('minRating')) || 0,
        inStock: searchParams.get('inStock') === 'true',
        sortBy: searchParams.get('sortBy') || 'name',
        page: parseInt(searchParams.get('page')) || 1,
        limit: 6
    });

    // Update URL when filters change
    const updateURL = useCallback((newFilters) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && key !== 'limit') {
                params.set(key, value.toString());
            }
        });
        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch products with filters
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await productsAPI.search(filters);
            setProducts(response.data.data.products);
            setFilterOptions(response.data.data.filterOptions);
            setPagination(response.data.data.pagination);

        } catch (error) {
            console.error('Error fetching products:', error);
            setError(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Handle filter changes
    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
        updateURL(newFilters);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            handleFiltersChange({ ...filters, page: newPage });
        }
    };

    // Handle search input with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (filters.search !== searchParams.get('search')) {
                handleFiltersChange({ ...filters, page: 1 });
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filters.search]);

    // Fetch products when filters change
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const activeFilterCount = Object.keys(filters).filter(key => {
        if (key === 'page') return false;
        if (key === 'sortBy') return filters[key] !== 'name';
        if (key === 'minPrice') return filters[key] > 0;
        if (key === 'maxPrice') return filters[key] < (filterOptions?.max_price || 1000);
        if (key === 'minRating') return filters[key] > 0;
        return filters[key] && filters[key] !== '';
    }).length;

    // Generate page numbers for pagination
    const generatePageNumbers = () => {
        const pages = [];
        const current = pagination.currentPage;
        const total = pagination.totalPages;

        // Always show first page
        pages.push(1);

        // Calculate range around current page
        let start = Math.max(2, current - 1);
        let end = Math.min(total - 1, current + 1);

        // Add ellipsis if needed
        if (start > 2) pages.push('...');

        // Add middle pages
        for (let i = start; i <= end; i++) {
            if (i !== 1 && i !== total) {
                pages.push(i);
            }
        }

        // Add ellipsis if needed
        if (end < total - 1) pages.push('...');

        // Always show last page if there is more than one page
        if (total > 1) pages.push(total);

        return pages;
    };

    if (loading && products.length === 0) {
        return <LoadingSpinner text="Loading products..." />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">Error loading products</div>
                    <div className="text-gray-600">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Products</h1>
                    <p className="text-gray-600 text-lg">Discover our exclusive fashion collection</p>
                </motion.div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 w-full min-w-0">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search products by name, brand, or category..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Filter Controls */}
                        <div className="flex gap-3 w-full lg:w-auto">
                            {/* Mobile Filter Button */}
                            <button
                                onClick={() => setShowFilters(true)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Desktop Filter Button */}
                            <button
                                onClick={() => setShowFilters(true)}
                                className="hidden lg:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Sort Dropdown */}
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFiltersChange({ ...filters, sortBy: e.target.value, page: 1 })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                                <option value="newest">Newest</option>
                                <option value="popular">Most Popular</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Filters Sidebar - Desktop */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <AdvancedFilters
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            filterOptions={filterOptions}
                            isOpen={true}
                            onClose={() => { }}
                        />
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Products Count and Pagination Info */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 w-full gap-4">
                            <p className="text-gray-600">
                                Showing {products.length} of {pagination.totalItems} products
                                {filters.search && ` for "${filters.search}"`}
                            </p>
                            {pagination.totalPages > 1 && (
                                <div className="text-sm text-gray-600">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <LoadingSpinner text="Loading products..." />
                            </div>
                        ) : (
                            <>
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full"
                                >
                                    {products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                        />
                                    ))}
                                </motion.div>

                                {/* No Results */}
                                {products.length === 0 && !loading && (
                                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                                        <div className="text-gray-500 text-lg mb-4">No products found</div>
                                        <p className="text-gray-400 mb-4">
                                            Try adjusting your search criteria or filters
                                        </p>
                                        <button
                                            onClick={() => handleFiltersChange({
                                                search: '',
                                                category: '',
                                                brand: '',
                                                minPrice: 0,
                                                maxPrice: filterOptions?.max_price || 1000,
                                                minRating: 0,
                                                inStock: false,
                                                sortBy: 'name',
                                                page: 1
                                            })}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center mt-8">
                                <nav className="flex items-center space-x-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>

                                    {/* Page Numbers */}
                                    {generatePageNumbers().map((pageNum, index) => (
                                        pageNum === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-4 py-2 rounded-lg border transition-colors ${pagination.currentPage === pageNum
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    ))}

                                    {/* Next Button */}
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Filters Modal */}
                <AdvancedFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    filterOptions={filterOptions}
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                />
            </div>
        </div>
    );
};

export default Products;