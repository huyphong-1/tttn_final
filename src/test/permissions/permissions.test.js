import { describe, it, expect } from 'vitest';
import { 
  ROLES, 
  PERMISSIONS, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  isAdmin,
  isUser,
  isGuest,
  canAccessRoute
} from '../../config/permissions';

describe('Permission System', () => {
  describe('Role Definitions', () => {
    it('should have correct role definitions', () => {
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.USER).toBe('user');
      expect(ROLES.GUEST).toBe('guest');
    });
  });

  describe('Permission Checking', () => {
    it('should correctly check admin permissions', () => {
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PRODUCT_MANAGE)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.USER_MANAGE)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.DASHBOARD_VIEW)).toBe(true);
    });

    it('should correctly check user permissions', () => {
      expect(hasPermission(ROLES.USER, PERMISSIONS.PRODUCT_VIEW)).toBe(true);
      expect(hasPermission(ROLES.USER, PERMISSIONS.CART_MANAGE)).toBe(true);
      expect(hasPermission(ROLES.USER, PERMISSIONS.WISHLIST_MANAGE)).toBe(true);
      
      // User should NOT have admin permissions
      expect(hasPermission(ROLES.USER, PERMISSIONS.PRODUCT_MANAGE)).toBe(false);
      expect(hasPermission(ROLES.USER, PERMISSIONS.USER_MANAGE)).toBe(false);
      expect(hasPermission(ROLES.USER, PERMISSIONS.DASHBOARD_VIEW)).toBe(false);
    });

    it('should correctly check guest permissions', () => {
      expect(hasPermission(ROLES.GUEST, PERMISSIONS.PRODUCT_VIEW)).toBe(true);
      
      // Guest should NOT have user or admin permissions
      expect(hasPermission(ROLES.GUEST, PERMISSIONS.CART_MANAGE)).toBe(false);
      expect(hasPermission(ROLES.GUEST, PERMISSIONS.WISHLIST_MANAGE)).toBe(false);
      expect(hasPermission(ROLES.GUEST, PERMISSIONS.PRODUCT_MANAGE)).toBe(false);
    });
  });

  describe('Multiple Permission Checking', () => {
    it('should check any permission correctly', () => {
      const userPermissions = [PERMISSIONS.CART_MANAGE, PERMISSIONS.PRODUCT_MANAGE];
      
      expect(hasAnyPermission(ROLES.USER, userPermissions)).toBe(true); // Has CART_MANAGE
      expect(hasAnyPermission(ROLES.ADMIN, userPermissions)).toBe(true); // Has both
      expect(hasAnyPermission(ROLES.GUEST, userPermissions)).toBe(false); // Has neither
    });

    it('should check all permissions correctly', () => {
      const adminPermissions = [PERMISSIONS.PRODUCT_MANAGE, PERMISSIONS.USER_MANAGE];
      const userPermissions = [PERMISSIONS.CART_MANAGE, PERMISSIONS.WISHLIST_MANAGE];
      
      expect(hasAllPermissions(ROLES.ADMIN, adminPermissions)).toBe(true);
      expect(hasAllPermissions(ROLES.USER, userPermissions)).toBe(true);
      expect(hasAllPermissions(ROLES.USER, adminPermissions)).toBe(false);
    });
  });

  describe('Role Utilities', () => {
    it('should correctly identify admin role', () => {
      expect(isAdmin(ROLES.ADMIN)).toBe(true);
      expect(isAdmin(ROLES.USER)).toBe(false);
      expect(isAdmin(ROLES.GUEST)).toBe(false);
    });

    it('should correctly identify user role', () => {
      expect(isUser(ROLES.USER)).toBe(true);
      expect(isUser(ROLES.ADMIN)).toBe(false);
      expect(isUser(ROLES.GUEST)).toBe(false);
    });

    it('should correctly identify guest role', () => {
      expect(isGuest(ROLES.GUEST)).toBe(true);
      expect(isGuest(null)).toBe(true);
      expect(isGuest(undefined)).toBe(true);
      expect(isGuest(ROLES.USER)).toBe(false);
      expect(isGuest(ROLES.ADMIN)).toBe(false);
    });
  });

  describe('Route Access Control', () => {
    it('should allow access to routes with no permission requirements', () => {
      expect(canAccessRoute(ROLES.GUEST, [])).toBe(true);
      expect(canAccessRoute(ROLES.USER, [])).toBe(true);
      expect(canAccessRoute(ROLES.ADMIN, [])).toBe(true);
    });

    it('should correctly control route access based on permissions', () => {
      const adminRoutePermissions = [PERMISSIONS.DASHBOARD_VIEW];
      const userRoutePermissions = [PERMISSIONS.CART_MANAGE];
      
      expect(canAccessRoute(ROLES.ADMIN, adminRoutePermissions)).toBe(true);
      expect(canAccessRoute(ROLES.USER, adminRoutePermissions)).toBe(false);
      expect(canAccessRoute(ROLES.GUEST, adminRoutePermissions)).toBe(false);
      
      expect(canAccessRoute(ROLES.USER, userRoutePermissions)).toBe(true);
      expect(canAccessRoute(ROLES.ADMIN, userRoutePermissions)).toBe(true);
      expect(canAccessRoute(ROLES.GUEST, userRoutePermissions)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined roles gracefully', () => {
      expect(hasPermission(null, PERMISSIONS.PRODUCT_VIEW)).toBe(false);
      expect(hasPermission(undefined, PERMISSIONS.PRODUCT_VIEW)).toBe(false);
      expect(hasPermission('', PERMISSIONS.PRODUCT_VIEW)).toBe(false);
    });

    it('should handle null/undefined permissions gracefully', () => {
      expect(hasPermission(ROLES.ADMIN, null)).toBe(false);
      expect(hasPermission(ROLES.ADMIN, undefined)).toBe(false);
      expect(hasPermission(ROLES.ADMIN, '')).toBe(false);
    });

    it('should handle invalid roles', () => {
      expect(hasPermission('invalid_role', PERMISSIONS.PRODUCT_VIEW)).toBe(false);
    });

    it('should handle invalid permissions', () => {
      expect(hasPermission(ROLES.ADMIN, 'invalid_permission')).toBe(false);
    });
  });
});
