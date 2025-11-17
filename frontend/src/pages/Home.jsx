import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, Shield, Truck, Star, Users } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const featuredProducts = [
        {
            id: 1,
            name: "Classic White T-Shirt",
            price: 29.99,
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
            category: "T-Shirts",
            brand: "BasicWear",
            description: "Premium quality cotton t-shirt for everyday wear",
            size: "M",
            color: "White",
            stock_quantity: 50
        },
        {
            id: 2,
            name: "Designer Blue Jeans",
            price: 89.99,
            image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
            category: "Jeans",
            brand: "DenimCo",
            description: "Comfortable and stylish denim jeans with modern fit",
            size: "32",
            color: "Blue",
            stock_quantity: 30
        },
        {
            id: 3,
            name: "Floral Summer Dress",
            price: 59.99,
            image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
            category: "Dresses",
            brand: "SummerStyle",
            description: "Beautiful floral pattern dress for summer occasions",
            size: "S",
            color: "Multicolor",
            stock_quantity: 25
        },
        {
            id: 4,
            name: "Sports Jacket",
            price: 129.99,
            image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
            category: "Jackets",
            brand: "ActiveWear",
            description: "Water-resistant sports jacket for outdoor activities",
            size: "L",
            color: "Black",
            stock_quantity: 20
        }
    ];

    const features = [
        {
            icon: <ShoppingBag className="h-8 w-8 text-blue-600" />,
            title: "Wide Selection",
            description: "Discover thousands of fashion items from top brands"
        },
        {
            icon: <TrendingUp className="h-8 w-8 text-green-600" />,
            title: "Trending Styles",
            description: "Stay ahead with the latest fashion trends"
        },
        {
            icon: <Shield className="h-8 w-8 text-purple-600" />,
            title: "Secure Shopping",
            description: "Your data is protected with advanced security"
        },
        {
            icon: <Truck className="h-8 w-8 text-orange-600" />,
            title: "Fast Delivery",
            description: "Free shipping on orders over $50"
        }
    ];

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Fashion Blogger",
            content: "The quality of clothes and customer service is outstanding!",
            rating: 5
        },
        {
            name: "Mike Chen",
            role: "Regular Customer",
            content: "Fast shipping and great prices. My go-to fashion store!",
            rating: 5
        },
        {
            name: "Emily Davis",
            role: "Influencer",
            content: "Love the trendy collections and sustainable options.",
            rating: 4
        }
    ];

    const handleAddToCart = (product) => {
        console.log('Adding to cart:', product);
        // Implement cart functionality
    };

    const handleAddToWishlist = (product) => {
        console.log('Adding to wishlist:', product);
        // Implement wishlist functionality
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Discover Your Style
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                            Shop the latest fashion trends with exclusive collections. Quality meets style in every piece.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/products"
                                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors inline-block"
                            >
                                Shop Now
                            </Link>
                            <Link
                                to="/signup"
                                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors inline-block"
                            >
                                Join Now
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                            Why Choose GlowNest Decor?
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            We're committed to providing the best shopping experience with quality products and excellent service.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="text-center p-6 rounded-lg hover:shadow-lg transition-all duration-300 border border-gray-100"
                            >
                                <div className="flex justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                            Featured Products
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Check out our most popular items loved by thousands of customers
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddToCart}
                                onAddToWishlist={handleAddToWishlist}
                            />
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to="/products"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center"
                        >
                            <ShoppingBag className="h-5 w-5 mr-2" />
                            View All Products
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                            What Our Customers Say
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Don't just take our word for it - hear from our satisfied customers
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-gray-50 p-6 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < testimonial.rating
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                                <div>
                                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Upgrade Your Style?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8">
                            Join thousands of satisfied customers and discover your perfect style today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/signup"
                                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                            >
                                <Users className="h-5 w-5 mr-2" />
                                Create Account
                            </Link>
                            <Link
                                to="/products"
                                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                            >
                                Browse Collection
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Home;