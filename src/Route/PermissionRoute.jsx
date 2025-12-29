import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/usePrismaAuth';
import { PERMISSIONS } from '../config/permissions';

const PermissionRoute = ({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  redirectTo = "/",
  showUnauthorized = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, profile, role } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('[PermissionRoute] Debug:', {
    permission,
    permissions,
    profile,
    role,
    loading,
    hasPermissionFunc: typeof hasPermission
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-slate-300">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
    console.log('[PermissionRoute] Permission check:', permission, '→', hasAccess);
  } else if (permissions && Array.isArray(permissions)) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
    console.log('[PermissionRoute] Permissions check:', permissions, '→', hasAccess);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showUnauthorized) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Không có quyền truy cập</h1>
            <p className="text-slate-300 mb-6">
              Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }
    
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default PermissionRoute;
