import React from 'react';
import { useAuth } from '../../hooks/usePrismaAuth';
import { ROLES } from '../../config/permissions';

const RoleGuard = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  showFallback = true 
}) => {
  const { role, isAdmin, isUser, isGuest } = useAuth();

  let hasAccess = false;

  if (allowedRoles.length === 0) {
    // Nếu không chỉ định roles, cho phép tất cả
    hasAccess = true;
  } else {
    // Kiểm tra role hiện tại có trong danh sách cho phép không
    hasAccess = allowedRoles.includes(role);
  }

  if (!hasAccess) {
    if (showFallback && fallback) {
      return fallback;
    }
    return null;
  }

  return children;
};

// Các component wrapper tiện lợi
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleGuard allowedRoles={[ROLES.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const UserOnly = ({ children, fallback = null }) => (
  <RoleGuard allowedRoles={[ROLES.USER]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AuthenticatedOnly = ({ children, fallback = null }) => (
  <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export default RoleGuard;
