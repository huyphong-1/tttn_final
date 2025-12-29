// src/providers/AppProviders.jsx
import { BrowserRouter } from "react-router-dom";

import { PrismaAuthProvider } from "../context/PrismaAuthContext";
import { ToastProvider } from "../context/ToastContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext"; // ✅ thêm dòng này

export default function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <PrismaAuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </PrismaAuthProvider>
    </BrowserRouter>
  );
}
