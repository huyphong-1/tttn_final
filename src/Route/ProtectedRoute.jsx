// src/Route/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/usePrismaAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  // While checking/restoring auth, don't redirect early
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <p className="ml-4 text-slate-300">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  // Consider session as source of truth (user can be null briefly in some edge cases)
  const isAuthed = !!(session?.user || user);

  if (!isAuthed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}
