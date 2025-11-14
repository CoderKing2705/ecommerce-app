import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    ShoppingBag,
    User,
    BarChart3,
    ShoppingCart,
    Heart,
    LogOut
} from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: 'Dashboard', path: '/dashboard' },
        ...(user?.role === 'ADMIN' ? [{ name: 'Analytics', path: '/analytics' }] : []),
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
        }
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center" onClick={() => setIsOpen(false)}>
                            <ShoppingBag className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-800">FashionStore</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
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
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                {/* Cart Icon */}
                                <button className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        3
                                    </span>
                                </button>

                                {/* Wishlist Icon */}
                                <button className="relative p-2 text-gray-700 hover:text-red-600 transition-colors">
                                    <Heart className="h-5 w-5" />
                                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        2
                                    </span>
                                </button>

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
                                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 text-sm font-medium">{user.name}</span>
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                                            >
                                                <div className="px-4 py-2 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                                <Link
                                                    to="/dashboard"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    Dashboard
                                                </Link>
                                                {user.role === 'ADMIN' && (
                                                    <Link
                                                        to="/analytics"
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Analytics
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                                                >
                                                    <LogOut className="h-4 w-4 mr-2" />
                                                    Sign out
                                                </button>
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
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
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
                                <button className="relative p-2 text-gray-700">
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                        3
                                    </span>
                                </button>
                                <button className="relative p-2 text-gray-700">
                                    <Heart className="h-5 w-5" />
                                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                        2
                                    </span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
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
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === item.path
                                                ? 'text-blue-600 bg-blue-50'
                                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}

                                {user ? (
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="px-3 py-2">
                                            <p className="text-sm text-gray-500">Signed in as</p>
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full mt-2 text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sign out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border-t border-gray-200 pt-4 space-y-2">
                                        <Link
                                            to="/login"
                                            className="block text-center text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="block text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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