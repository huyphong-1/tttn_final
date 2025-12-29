import React from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../hooks/usePrismaAuth';
import { useToast } from '../context/ToastContext';
import { PERMISSIONS } from '../config/permissions';

const WishlistButton = ({ product, className = '', size = 'md' }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, hasPermission } = useAuth();
  const { showInfo } = useToast();
  
  const isLiked = isInWishlist(product.id);

  // Kiểm tra quyền wishlist
  if (!hasPermission(PERMISSIONS.WISHLIST_MANAGE)) {
    return null; // Không hiển thị button nếu không có quyền
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showInfo('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }
    
    toggleWishlist(product);
  };

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative rounded-full transition-all duration-200 
        ${isLiked 
          ? 'text-red-500 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30' 
          : 'text-slate-400 bg-slate-100 dark:bg-slate-800 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20'
        }
        ${sizeClasses[size]}
        ${className}
      `}
      title={isLiked ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
    >
      {isLiked ? (
        <FaHeart className="animate-bounce-in" />
      ) : (
        <FaRegHeart />
      )}
    </button>
  );
};

export default WishlistButton;
