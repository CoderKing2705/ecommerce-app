import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    ShoppingBag,
    User,
    BarChart3,
    ShoppingCart,
    Heart,
    LogOut,
    Settings,
    Package,
    ChevronDown
} from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout } = useAuth();
    const { getCartItemsCount, wishlist } = useCart();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: 'Wishlist', path: '/wishlist' },
        { name: 'Dashboard', path: '/dashboard' },
        ...(user?.role === 'ADMIN' ? [
            {
                name: 'Admin',
                path: '#',
                children: [
                    { name: 'Dashboard', path: '/admin/dashboard' },
                    { name: 'Manage Products', path: '/admin/products' },
                    { name: 'Manage Users', path: '/admin/users' },
                    { name: 'Manage Orders', path: '/admin/orders' },
                ]
            }
        ] : []),
        { name: 'Contact', path: '/contact' },
    ];

    const handleLogout = () => {
        logout();
        setIsProfileOpen(false);
        setIsOpen(false);
        navigate('/');
    };

    const handleProfileClick = () => {
        if (user) {
            setIsProfileOpen(!isProfileOpen);
        } else {
            navigate('/login');
            setIsOpen(false);
        }
    };

    const cartItemsCount = getCartItemsCount();
    const wishlistCount = wishlist.length;

    const renderNavItem = (item) => {
        if (item.children) {
            return (
                <div key={item.name} className="relative group">
                    <button className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                        {item.name}
                        <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {item.children.map((child) => (
                            <Link
                                key={child.name}
                                to={child.path}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                                {child.name}
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${location.pathname === item.path
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
            >
                {item.name}
                {location.pathname === item.path && (
                    <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    />
                )}
            </Link>
        );
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link
                            to="/"
                            className="flex-shrink-0 flex items-center"
                            onClick={() => setIsOpen(false)}
                        >
                            <ShoppingBag className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-800">GlowNest Decor</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map(renderNavItem)}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                {/* Cart Icon */}
                                <Link
                                    to="/dashboard?tab=cart"
                                    className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                                    title="View Cart"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartItemsCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                                        >
                                            {cartItemsCount}
                                        </motion.span>
                                    )}
                                </Link>

                                {/* Wishlist Icon */}
                                <Link
                                    to="/wishlist"
                                    className="relative p-2 text-gray-700 hover:text-red-600 transition-colors"
                                    title="View Wishlist"
                                >
                                    <Heart className="h-5 w-5" />
                                    {wishlistCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                                        >
                                            {wishlistCount}
                                        </motion.span>
                                    )}
                                </Link>

                                {/* Admin Badge */}
                                {user.role === 'ADMIN' && (
                                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        <BarChart3 className="h-4 w-4" />
                                        <span className="text-xs font-medium">ADMIN</span>
                                    </div>
                                )}

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={handleProfileClick}
                                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-gray-700 text-sm font-medium max-w-32 truncate">
                                            {user.name}
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                                            >
                                                {/* User Info */}
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                    <div className="flex items-center mt-1">
                                                        <div className={`text-xs px-2 py-1 rounded-full ${user.role === 'ADMIN'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {user.role}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu Items */}
                                                <Link
                                                    to="/dashboard"
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <User className="h-4 w-4 mr-3 text-gray-400" />
                                                    Dashboard
                                                </Link>

                                                <Link
                                                    to="/wishlist"
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <Heart className="h-4 w-4 mr-3 text-gray-400" />
                                                    My Wishlist
                                                    {wishlistCount > 0 && (
                                                        <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                            {wishlistCount}
                                                        </span>
                                                    )}
                                                </Link>

                                                <Link
                                                    to="/dashboard?tab=cart"
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <ShoppingCart className="h-4 w-4 mr-3 text-gray-400" />
                                                    My Cart
                                                    {cartItemsCount > 0 && (
                                                        <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                            {cartItemsCount}
                                                        </span>
                                                    )}
                                                </Link>

                                                {user.role === 'ADMIN' && (
                                                    <Link
                                                        to="/analytics"
                                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        <BarChart3 className="h-4 w-4 mr-3 text-gray-400" />
                                                        Analytics
                                                    </Link>
                                                )}

                                                <div className="border-t border-gray-100 mt-2 pt-2">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <LogOut className="h-4 w-4 mr-3" />
                                                        Sign out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="flex space-x-4">
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        {user && (
                            <>
                                {/* Cart Icon - Mobile */}
                                <Link
                                    to="/dashboard?tab=cart"
                                    className="relative p-2 text-gray-700"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartItemsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                            {cartItemsCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Wishlist Icon - Mobile */}
                                <Link
                                    to="/wishlist"
                                    className="relative p-2 text-gray-700"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Heart className="h-5 w-5" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none transition-colors"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
                        >
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${location.pathname === item.path
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}

                                {user ? (
                                    <div className="border-t border-gray-200 pt-4 mt-2">
                                        {/* User Info */}
                                        <div className="px-3 py-2 mb-2">
                                            <p className="text-sm text-gray-500">Signed in as</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            <div className="flex items-center mt-1">
                                                <div className={`text-xs px-2 py-1 rounded-full ${user.role === 'ADMIN'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {user.role}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Links */}
                                        <Link
                                            to="/wishlist"
                                            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <Heart className="h-4 w-4 mr-3 text-gray-400" />
                                            My Wishlist
                                            {wishlistCount > 0 && (
                                                <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                    {wishlistCount}
                                                </span>
                                            )}
                                        </Link>

                                        <Link
                                            to="/dashboard?tab=cart"
                                            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <ShoppingCart className="h-4 w-4 mr-3 text-gray-400" />
                                            My Cart
                                            {cartItemsCount > 0 && (
                                                <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    {cartItemsCount}
                                                </span>
                                            )}
                                        </Link>

                                        {/* Logout Button */}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center transition-colors"
                                        >
                                            <LogOut className="h-4 w-4 mr-3" />
                                            Sign out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border-t border-gray-200 pt-4 space-y-2">
                                        <Link
                                            to="/login"
                                            className="block text-center text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;