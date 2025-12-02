import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI, wishlistAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Only fetch cart/wishlist when user is authenticated
    useEffect(() => {
        if (user) {
            fetchCart();
            fetchWishlist();
        } else {
            setCart([]);
            setWishlist([]);
        }
    }, [user]); // Only depend on user

    const fetchCart = async () => {
        if (!user) return;

        try {
            const response = await cartAPI.get();
            setCart(response.data);
        } catch (error) {
            // Don't set state on error to avoid loops
            if (error.response?.status !== 401) {
                setCart([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchWishlist = async () => {
        if (!user) return;

        try {
            const response = await wishlistAPI.get();
            setWishlist(response.data);
        } catch (error) {
            // Don't set state on error to avoid loops
            if (error.response?.status !== 401) {
                setWishlist([]);
            }
        }
    };

    const addToCart = async (product, quantity = 1) => {
        if (!user) {
            toast.error('Please login to add items to cart');
            return;
        }

        // Frontend validation
        if (quantity > 5) {
            toast.error('Maximum quantity limit is 5 items per product');
            return;
        }

        try {
            setLoading(true);
            await cartAPI.add(product.id, quantity);
            await fetchCart();
            toast.success(`${product.name} added to cart!`, {
                icon: '🛒',
            });
        } catch (error) {

            if (error.response?.status === 400) {
                toast.error(error.response.data.message);
            } else if (error.response?.status === 401) {
                toast.error('Please login again');
            } else {
                toast.error('Failed to add item to cart');
            }
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            setLoading(true);
            await cartAPI.remove(cartItemId);
            setCart(prev => prev.filter(item => item.id !== cartItemId));
            toast.success('Item removed from cart!');
        } catch (error) {
            toast.error('Failed to remove item from cart');
        } finally {
            setLoading(false);
        }
    };

    const updateCartQuantity = async (cartItemId, quantity) => {
        try {
            if (quantity < 1) {
                await removeFromCart(cartItemId);
                return;
            }

            // Frontend validation (optional, but good for UX)
            if (quantity > 5) {
                toast.error('Maximum quantity limit is 5 items per product');
                return;
            }

            await cartAPI.update(cartItemId, quantity);
            setCart(prev => prev.map(item =>
                item.id === cartItemId ? { ...item, quantity } : item
            ));
        } catch (error) {
            if (error.response?.status === 400) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to update quantity');
            }
        }
    };

    const addToWishlist = async (product) => {
        if (!user) {
            toast.error('Please login to add items to wishlist');
            return;
        }

        try {
            setLoading(true);
            await wishlistAPI.add(product.id);
            await fetchWishlist();
            toast.success(`${product.name} added to wishlist!`, {
                icon: '❤️',
            });
        } catch (error) {
            if (error.response?.status === 401) {
                toast.error('Please login again');
            } else {
                toast.error('Failed to add item to wishlist');
            }
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        try {
            setLoading(true);

            // Call API to clear cart on backend
            await cartAPI.clear(); // This will work once you add the endpoint

            // Clear the local cart state
            setCart([]);

            toast.success('Cart cleared successfully!');
            return true;
        } catch (error) {
            // Still clear local state even if API fails
            setCart([]);
            toast.error('Cart cleared locally, but server sync failed');
            return true;
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (wishlistItemId) => {
        try {
            setLoading(true);
            await wishlistAPI.remove(wishlistItemId);
            setWishlist(prev => prev.filter(item => item.id !== wishlistItemId));
            toast.success('Item removed from wishlist!');
        } catch (error) {
            toast.error('Failed to remove item from wishlist');
        } finally {
            setLoading(false);
        }
    };

    const isInCart = (productId) => {
        return cart.some(item => item.product_id === productId);
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.product_id === productId);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    };

    const getCartItemsCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const value = {
        cart: Array.isArray(cart) ? cart : [],
        wishlist: Array.isArray(wishlist) ? wishlist : [],
        loading,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        addToWishlist,
        removeFromWishlist,
        isInCart,
        isInWishlist,
        getCartTotal,
        getCartItemsCount,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};