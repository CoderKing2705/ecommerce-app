import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const DebugInfo = () => {
    const { user, loading: authLoading } = useAuth();
    const { cart, wishlist, loading: cartLoading } = useCart();

    React.useEffect(() => {
        console.log('🔍 Debug - Auth:', { user, authLoading });
    }, [user, authLoading]);

    React.useEffect(() => {
        console.log('🔍 Debug - Cart:', { cartItems: cart.length, wishlistItems: wishlist.length, cartLoading });
    }, [cart, wishlist, cartLoading]);

    return null; // This component doesn't render anything
};

export default DebugInfo;