import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth(); // role phải có trong AuthContext

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-slate-300">Đang kiểm tra quyền...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role !== "admin") return <Navigate to="/" replace />;

  return children;
}
