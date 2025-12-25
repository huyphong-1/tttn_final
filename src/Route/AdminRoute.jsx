import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth(); // role phải có trong AuthContext

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-slate-300">
        Đang kiểm tra quyền...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role !== "admin") return <Navigate to="/" replace />;

  return children;
}
