import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { productsAPI, handleAPIError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const categories = ['All', 'T-Shirts', 'Jeans', 'Dresses', 'Jackets', 'Shoes', 'Accessories'];

    // Fetch products from backend API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await productsAPI.getAll();
                setProducts(response.data);
                setFilteredProducts(response.data); // Set initial filtered products
            } catch (error) {
                console.error('Error fetching products:', error);
                setError(handleAPIError(error));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Filter and sort products
    const updateFilteredProducts = useCallback(() => {
        let filtered = [...products]; // Create a copy to avoid mutating original

        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        // Sort products
        filtered = filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        setFilteredProducts(filtered);
    }, [searchTerm, selectedCategory, sortBy, products]);

    useEffect(() => {
        if (products.length > 0) {
            updateFilteredProducts();
        }
    }, [updateFilteredProducts, products.length]);

    const handleViewDetails = (product) => {
        // You can implement a product details modal or page here
        console.log('View details:', product);
    };

    if (loading) {
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
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search products by name, brand, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-4 w-full lg:w-auto">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Count */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                </div>

                {/* Products Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredProducts.map((product, index) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </motion.div>

                {filteredProducts.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🔍</div>
                        <p className="text-gray-500 text-lg mb-2">No products found</p>
                        <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;