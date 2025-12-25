import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Lazy load các trang để tối ưu performance
const HomePage = React.lazy(() => import("./pages/HomePage"));
const PhonesPage = React.lazy(() => import("./pages/PhonesPage"));
const AccessoriesPage = React.lazy(() => import("./pages/AccessoriesPage"));
const SalePage = React.lazy(() => import("./pages/SalePage"));
const TrendingPage = React.lazy(() => import("./pages/TrendingPage"));
const BestSellingPage = React.lazy(() => import("./pages/BestSellingPage"));
const TopRatedPage = React.lazy(() => import("./pages/TopRatedPage"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const ProductDetailPage = React.lazy(() => import("./pages/ProductDetailPage"));
const OrderHistory = React.lazy(() => import('./components/OrderHistory'));

// Import ProtectedRoute và AdminRoute
import ProtectedRoute from "./Route/ProtectedRoute";
import AdminRoute from "./Route/AdminRoute";
import PermissionRoute from "./Route/PermissionRoute";
import { PERMISSIONS } from "./config/permissions";

const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const ProductManagement = React.lazy(() => import("./pages/admin/ProductManagement"));
const UserManagement = React.lazy(() => import("./pages/admin/UserManagement"));
const UserProfile = React.lazy(() => import("./pages/user/UserProfile"));
const WishlistPage = React.lazy(() => import("./pages/WishlistPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Các trang chính */}
          <Route path="/" element={<HomePage />} />
          <Route path="/phones" element={<PhonesPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/best-selling" element={<BestSellingPage />} />
          <Route path="/top-rated" element={<TopRatedPage />} />
          <Route path="/cart" element={<CartPage />} />
          
          {/* Route cho trang Lịch sử Đơn hàng */}
          <Route path="/order-history" element={<OrderHistory />} />
          
          {/* Wishlist Page */}
          <Route path="/wishlist" element={<WishlistPage />} />

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
            path="/admin/users"
            element={
              <PermissionRoute permission={PERMISSIONS.USER_MANAGE}>
                <UserManagement />
              </PermissionRoute>
            }
          />

          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
