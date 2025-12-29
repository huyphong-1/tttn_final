// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Simplified providers for production
const SimpleProvider = ({ children }) => children;

// Fallback context providers
const PrismaAuthProvider = ({ children }) => children;
const CartProvider = ({ children }) => children;
const ToastProvider = ({ children }) => children;
const WishlistProvider = ({ children }) => children;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <PrismaAuthProvider>
          <WishlistProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </WishlistProvider>
        </PrismaAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
