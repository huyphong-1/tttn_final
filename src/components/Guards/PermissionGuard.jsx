import React from 'react';
import { useAuth } from '../../context/AuthContext';

const PermissionGuard = ({ 
  children, 
  permission, 
  permissions, 
  requireAll = false, 
  fallback = null,
  showFallback = true 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = false;

  if (permission) {
    // Kiểm tra một permission duy nhất
    hasAccess = hasPermission(permission);
  } else if (permissions && Array.isArray(permissions)) {
    // Kiểm tra nhiều permissions
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // Nếu không có permission nào được chỉ định, cho phép truy cập
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showFallback && fallback) {
      return fallback;
    }
    return null;
  }

  return children;
};

export default PermissionGuard;
