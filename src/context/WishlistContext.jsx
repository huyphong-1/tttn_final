import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/usePrismaAuth';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'techphone_wishlist';

const readWishlistFromStorage = () => {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { showSuccess, showInfo } = useToast();
  const [items, setItems] = useState(readWishlistFromStorage);

  // Lưu vào localStorage mỗi khi wishlist thay đổi
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  const addToWishlist = useCallback((product) => {
    if (!product) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        showInfo('Sản phẩm đã có trong danh sách yêu thích');
        return prev;
      }

      showSuccess('Đã thêm vào danh sách yêu thích');
      return [...prev, { ...product, addedAt: new Date().toISOString() }];
    });
  }, [showSuccess, showInfo]);

  const removeFromWishlist = useCallback((productId) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== productId);
      if (filtered.length < prev.length) {
        showSuccess('Đã xóa khỏi danh sách yêu thích');
      }
      return filtered;
    });
  }, [showSuccess]);

  const isInWishlist = useCallback((productId) => {
    return items.some((item) => item.id === productId);
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
    showSuccess('Đã xóa toàn bộ danh sách yêu thích');
  }, [showSuccess]);

  const toggleWishlist = useCallback((product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  const wishlistCount = items.length;

  const value = {
    items,
    wishlistCount,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    toggleWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
