import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI, wishlistAPI } from '../utils/api';
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

    // Fetch cart and wishlist on app load
    useEffect(() => {
        fetchCart();
        fetchWishlist();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await cartAPI.get();
            setCart(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    const fetchWishlist = async () => {
        try {
            const response = await wishlistAPI.get();
            setWishlist(response.data);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    const addToCart = async (product, quantity = 1) => {
        try {
            setLoading(true);
            await cartAPI.add(product.id, quantity);
            await fetchCart(); // Refresh cart data
            toast.success(`${product.name} added to cart!`, {
                icon: '🛒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add item to cart');
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            setLoading(true);
            await cartAPI.remove(cartItemId);
            await fetchCart(); // Refresh cart data
            toast.success('Item removed from cart!');
        } catch (error) {
            console.error('Error removing from cart:', error);
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

            await cartAPI.update(cartItemId, quantity);
            await fetchCart(); // Refresh cart data
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            toast.error('Failed to update quantity');
        }
    };

    const addToWishlist = async (product) => {
        try {
            setLoading(true);
            await wishlistAPI.add(product.id);
            await fetchWishlist(); // Refresh wishlist data
            toast.success(`${product.name} added to wishlist!`, {
                icon: '❤️',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            toast.error('Failed to add item to wishlist');
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (wishlistItemId) => {
        try {
            setLoading(true);
            await wishlistAPI.remove(wishlistItemId);
            await fetchWishlist(); // Refresh wishlist data
            toast.success('Item removed from wishlist!');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
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

    const clearCart = async () => {
        try {
            setLoading(true);
            // Remove all cart items one by one (you might want to add a bulk delete endpoint)
            for (const item of cart) {
                await cartAPI.remove(item.id);
            }
            await fetchCart();
            toast.success('Cart cleared!');
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Failed to clear cart');
        } finally {
            setLoading(false);
        }
    };

    const value = {
        cart,
        wishlist,
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
        fetchCart,
        fetchWishlist
    };

    // Add this function to the CartContext
    const checkWishlistStatus = async (productId) => {
        try {
            const response = await wishlistAPI.check(productId);
            return response.data.inWishlist;
        } catch (error) {
            console.error('Error checking wishlist status:', error);
            return false;
        }
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};