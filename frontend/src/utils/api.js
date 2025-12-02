import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - REMOVE the auto-redirect to avoid loops
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't auto-redirect, let components handle 401
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (email, password, name) => api.post('/auth/register', { email, password, name }),
    getMe: () => api.get('/auth/me'),
};

// Products API
export const productsAPI = {
    getAll: (params = {}) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post('/products', productData),
    update: (id, productData) => api.put(`/products/${id}`, productData),
    delete: (id) => api.delete(`/products/${id}`),
    search: (filters = {}) =>
        api.get('/products/search', { params: filters }),

    // Search suggestions (new)
    getSearchSuggestions: (query) =>
        api.get(`/products/search/suggestions?q=${query}`),

    // Filter options (new)
    getFilterOptions: () =>
        api.get('/products/filters/options')
};

// Cart API
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (productId, quantity = 1) => api.post('/cart', { product_id: productId, quantity }),
    remove: (cartItemId) => api.delete(`/cart/${cartItemId}`),
    update: (cartItemId, quantity) => api.put(`/cart/${cartItemId}`, { quantity }),
    clear: () => api.delete('/cart/clear')
};

// Wishlist API (you'll need to create these endpoints in backend)
export const wishlistAPI = {
    get: () => api.get('/wishlist'),
    add: (productId) => api.post('/wishlist', { product_id: productId }),
    remove: (wishlistItemId) => api.delete(`/wishlist/${wishlistItemId}`),
};

// Users API (admin only)
export const usersAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
};

// Analytics API
export const analyticsAPI = {
    getSales: () => api.get('/analytics/sales'),
    getUsers: () => api.get('/analytics/users'),
    getProducts: () => api.get('/analytics/products'),
};

// Utility functions
export const handleAPIError = (error) => {
    if (error.response) {
        // Server responded with error status
        return error.response.data.message || 'Something went wrong';
    } else if (error.request) {
        // Request made but no response received
        return 'Network error. Please check your connection.';
    } else {
        // Something else happened
        return error.message || 'Something went wrong';
    }
};

export const isAdmin = (user) => {
    return user?.role === 'ADMIN';
};

export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
};

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const orderAPI = {
    getMyOrders: (params) => api.get('/orders/my-orders', { params }),
    getMyOrderDetails: (id) => api.get(`/orders/my-orders/${id}`),
    getOrders: (params = {}) => api.get('/orders', { params }),
    getUserOrders: () => api.get('/orders/user'),
    getOrderById: (id) => api.get(`/orders/${id}`),
    updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: (params = {}) => api.get('/admin/users', { params }),
    updateUserRole: (userId, data) => api.put(`/admin/users/${userId}/role`, data),
    getUserActivities: () => api.get('/admin/user-activities'),
    getOrders: (params) => api.get('/admin/orders', { params }),
    updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
    updateOrderPaymentStatus: (id, data) => api.put(`/admin/orders/${id}/payment-status`, data),
    addShippingInfo: (id, data) => api.post(`/admin/orders/${id}/shipping`, data),
    getOrderDetails: (id) => api.get(`/admin/orders/${id}/details`),
    addStatusHistory: (id, data) => api.post(`/admin/orders/${id}/status-history`, data),
    addOrderNote: (id, data) => api.post(`/admin/orders/${id}/notes`, data),
    cancelOrder: (id, reason) => api.put(`/order-ops/${id}/cancel`, { reason }),
    processRefund: (orderId, data) => api.put(`/order-ops/${orderId}/refund`, data),
    bulkUpdateOrders: (data) => api.post('/order-ops/bulk', data),
    getDailyOrders: (params) => api.get('/analytics/orders/daily', { params }),
    getStatusDistribution: () => api.get('/analytics/orders/status-distribution'),
    getRevenueStats: (params) => api.get('/analytics/orders/revenue', { params })
};


export const inventoryAPI = {
    getInventory: (params) => api.get('/inventory', { params }),
    getInventoryItem: (id) => api.get(`/inventory/${id}`),
    updateStock: (id, data) => api.put(`/inventory/${id}/stock`, data),
    updateInventorySettings: (id, data) => api.put(`/inventory/${id}/settings`, data),
    getStockMovements: (id, params) => api.get(`/inventory/${id}/movements`, { params }),
    getLowStockAlerts: () => api.get('/inventory/alerts/low-stock'),
    getInventoryStats: () => api.get('/inventory/stats/overview'),
    getPurchaseOrders: (params) => api.get('/purchase-orders', { params }),
    createPurchaseOrder: (data) => api.post('/purchase-orders', data),
    updatePurchaseOrder: (id, data) => api.put(`/purchase-orders/${id}`, data),
    getSuppliers: () => api.get('/suppliers'),
    createSupplier: (data) => api.post('/suppliers', data),
};

// Reviews API
export const reviewsAPI = {
    getReviews: (productId, params = {}) =>
        api.get(`/products/${productId}/reviews`, { params }),

    createReview: (productId, data) =>
        api.post(`/products/${productId}/reviews`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    updateReview: (reviewId, data) =>
        api.put(`/reviews/${reviewId}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    deleteReview: (reviewId) =>
        api.delete(`/reviews/${reviewId}`),

    markHelpful: (reviewId) =>
        api.post(`/reviews/${reviewId}/helpful`),

    getReviewImages: (reviewId) =>
        api.get(`/reviews/${reviewId}/images`)
};

export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    getStats: () => api.get('/categories/stats'),
    create: (data) => api.post('/categories', data),
    update: (oldName, newName) => api.put(`/categories/${oldName}`, { newName }),
    delete: (name) => api.delete(`/categories/${name}`),
};

export const checkoutAPI = {
    createSession: (data) => api.post('/checkout/create-session', data),
    getCheckoutSummary: () => api.get('/checkout/summary'),
    getShippingAddresses: () => api.get('/checkout/shipping-addresses'),
    createShippingAddress: (data) => api.post('/checkout/shipping-addresses', data),
    updateShippingAddress: (id, data) => api.put(`/checkout/shipping-addresses/${id}`, data),
    deleteShippingAddress: (id) => api.delete(`/checkout/shipping-addresses/${id}`),
    getOrderDetails: (orderId) => api.get(`/checkout/order/${orderId}`),
};

export default api;