import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Add error boundary for better debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Có lỗi xảy ra</h1>
            <p className="text-gray-600 mb-4">Vui lòng refresh trang hoặc liên hệ hỗ trợ</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import HomePage from "./pages/HomePage";
const PhonesPage = React.lazy(() => import("./pages/PhonesPage"));
const AccessoriesPage = React.lazy(() => import("./pages/AccessoriesPage"));
const TabletPage = React.lazy(() => import("./pages/TabletPage"));
const UsedPage = React.lazy(() => import("./pages/UsedPage"));
const TrendingPage = React.lazy(() => import("./pages/TrendingPage"));
const BestSellingPage = React.lazy(() => import("./pages/BestSellingPage"));
const TopRatedPage = React.lazy(() => import("./pages/TopRatedPage"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage"));
const PaymentConfirmationPage = React.lazy(() => import("./pages/PaymentConfirmationPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const ProductDetailPage = React.lazy(() => import("./pages/ProductDetailPage"));
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const OrderHistory = React.lazy(() => import('./components/OrderHistory'));

// Import ProtectedRoute và AdminRoute
import ProtectedRoute from "./Route/ProtectedRoute";
import PermissionRoute from "./Route/PermissionRoute";
import { PERMISSIONS } from "./config/permissions";

const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const ProductManagement = React.lazy(() => import("./pages/admin/ProductManagement"));
const OrderManagement = React.lazy(() => import("./pages/admin/OrderManagement"));
const UserManagement = React.lazy(() => import("./pages/admin/UserManagement"));
const ProfitManagement = React.lazy(() => import("./pages/admin/ProfitManagement"));
const UserProfile = React.lazy(() => import("./pages/user/UserProfile"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      }>
        <Routes>
          <Route element={<Layout />}>
            {/* Các trang chính */}
            <Route path="/" element={<HomePage />} />
            <Route path="/phones" element={<PhonesPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/accessories" element={<AccessoriesPage />} />
            <Route path="/tablets" element={<TabletPage />} />
            <Route path="/used" element={<UsedPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/best-selling" element={<BestSellingPage />} />
            <Route path="/top-rated" element={<TopRatedPage />} />
            <Route path="/cart" element={<CartPage />} />
            
            {/* Route cho trang Lịch sử Đơn hàng */}
            <Route
              path="/order-history"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Các trang khác */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User Profile - Protected Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Các route cần bảo vệ */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout/confirmation"
            element={
              <ProtectedRoute>
                <PaymentConfirmationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
                <AdminDashboard />
              </PermissionRoute>
            }
          />
          
          <Route
            path="/admin/products"
            element={
              <PermissionRoute permission={PERMISSIONS.PRODUCT_MANAGE}>
                <ProductManagement />
              </PermissionRoute>
            }
          />
          
          <Route
            path="/admin/cart/*"
            element={
              <PermissionRoute permission={PERMISSIONS.ORDER_MANAGE}>
                <OrderManagement />
              </PermissionRoute>
            }
          />
          
          <Route
            path="/admin/user"
            element={
              <PermissionRoute permission={PERMISSIONS.USER_MANAGE}>
                <UserManagement />
              </PermissionRoute>
            }
          />

          <Route
            path="/admin/profit"
            element={
              <PermissionRoute permission={PERMISSIONS.ANALYTICS_VIEW}>
                <ProfitManagement />
              </PermissionRoute>
            }
          />

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
