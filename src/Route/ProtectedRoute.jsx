// src/Route/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/usePrismaAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading, session } = useAuth();
  const location = useLocation();


  // Cải thiện loading UI với timeout
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-slate-300">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  
  return children;
}
