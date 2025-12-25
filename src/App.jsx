import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Import các trang
import HomePage from "./pages/HomePage";
import PhonesPage from "./pages/PhonesPage";
import AccessoriesPage from "./pages/AccessoriesPage";
import SalePage from "./pages/SalePage";
import TrendingPage from "./pages/TrendingPage";
import BestSellingPage from "./pages/BestSellingPage";
import TopRatedPage from "./pages/TopRatedPage";
import CartPage from "./pages/CartPage";  // Trang Đơn hàng
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import OrderHistory from './components/OrderHistory';  // Trang Lịch sử Đơn hàng

// Import ProtectedRoute và AdminRoute
import ProtectedRoute from "./Route/ProtectedRoute";
import AdminRoute from "./Route/AdminRoute";
import AdminPage from "./pages/AdminPage";

// Import CartContext và CartProvider để sử dụng giỏ hàng
import { CartProvider } from './context/CartContext';  // Đảm bảo đường dẫn đúng

export default function App() {
  return (
    <CartProvider> {/* Bọc toàn bộ ứng dụng trong CartProvider */}
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
          <Route path="/cart" element={<CartPage />} />  {/* Route cho trang Đơn hàng */}
          
          {/* Route cho trang Lịch sử Đơn hàng */}
          <Route path="/order-history" element={<OrderHistory />} />  {/* Thêm route cho Lịch sử Đơn hàng */}

          {/* Các trang khác */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}
