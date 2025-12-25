// Định nghĩa các roles và permissions trong hệ thống
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

export const PERMISSIONS = {
  // Product permissions
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_MANAGE: 'product:manage',

  // Order permissions
  ORDER_VIEW: 'order:view',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  ORDER_MANAGE: 'order:manage',

  // User permissions
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',

  // Profile permissions
  PROFILE_VIEW: 'profile:view',
  PROFILE_UPDATE: 'profile:update',

  // Cart & Wishlist permissions
  CART_MANAGE: 'cart:manage',
  WISHLIST_MANAGE: 'wishlist:manage',

  // Admin dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view',
  ANALYTICS_VIEW: 'analytics:view',

  // System permissions
  SYSTEM_SETTINGS: 'system:settings',
  ROLE_MANAGE: 'role:manage'
};

// Định nghĩa permissions cho từng role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin có toàn quyền
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_MANAGE,
    
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_DELETE,
    PERMISSIONS.ORDER_MANAGE,
    
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE,
    
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    
    PERMISSIONS.CART_MANAGE,
    PERMISSIONS.WISHLIST_MANAGE,
    
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.ROLE_MANAGE
  ],

  [ROLES.USER]: [
    // User chỉ có quyền cơ bản
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.CART_MANAGE,
    PERMISSIONS.WISHLIST_MANAGE
  ],

  [ROLES.GUEST]: [
    // Guest chỉ có thể xem sản phẩm
    PERMISSIONS.PRODUCT_VIEW
  ]
};

// Helper functions để kiểm tra permissions
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.every(permission => hasPermission(userRole, permission));
};

export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

export const isUser = (userRole) => {
  return userRole === ROLES.USER;
};

export const isGuest = (userRole) => {
  return userRole === ROLES.GUEST || !userRole;
};

// Lấy tất cả permissions của một role
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// Kiểm tra xem user có thể truy cập route không
export const canAccessRoute = (userRole, routePermissions) => {
  if (!routePermissions || routePermissions.length === 0) return true;
  
  return hasAnyPermission(userRole, routePermissions);
};
