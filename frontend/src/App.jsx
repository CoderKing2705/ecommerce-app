import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext'; // Import SessionProvider
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Analytics from './pages/Analytics';
import Contact from './pages/Contact';
import OAuthSuccess from './pages/OAuthSuccess';
import ProtectedRoute from './components/ProtectedRoute';
import Wishlist from './pages/Wishlist';
import ProductDetails from './pages/ProductDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageUsers from './pages/admin/ManageUsers';
import OrderDetails from './pages/admin/OrderDetails';
import ManageOrders from './pages/admin/ManageOrders';
import MyOrders from './pages/MyOrders';
import OrderDetailsUser from './pages/OrderDetailsUser';
import OrderAnalytics from './components/admin/OrderAnalytics';
import InventoryManagement from './components/admin/InventoryManagement';
import ManageCategories from './pages/admin/ManageCategories';
import SessionWarning from './components/SessionWarning'; // Import SessionWarning
import Checkout from './components/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import ShippingAddresses from './components/ShippingAddresses';
import AccountSettings from './pages/AccountSettings';
import BillingAddresses from './pages/BillingAddresses';
import OrderTracking from './pages/OrderTracking';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SessionProvider>
          <CartProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
              <SessionWarning /> {/* Add SessionWarning component */}
              <Navbar />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: '10px',
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/products" element={<Products />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth/success" element={<OAuthSuccess />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <ManageProducts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <ManageUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <ManageOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders/:id"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <OrderDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetailsUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id/tracking"
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <OrderAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/inventory"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <InventoryManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <ManageCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path='/checkout'
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/success"
                  element={
                    <ProtectedRoute>
                      <CheckoutSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/cancel"
                  element={
                    <ProtectedRoute>
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Cancelled</h2>
                          <p className="mb-6">Your payment was cancelled. No charges were made.</p>
                          <button
                            onClick={() => navigate('/checkout')}
                            className="bg-blue-600 text-white py-2 px-6 rounded-lg"
                          >
                            Return to Checkout
                          </button>
                        </div>
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shipping-addresses"
                  element={
                    <ProtectedRoute>
                      <ShippingAddresses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/settings"
                  element={
                    <ProtectedRoute>
                      <AccountSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing-addresses"
                  element={
                    <ProtectedRoute>
                      <BillingAddresses />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </CartProvider>
        </SessionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;