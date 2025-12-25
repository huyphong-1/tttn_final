import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiEye } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const WishlistPage = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { showSuccess } = useToast();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
    showSuccess('Đã thêm vào giỏ hàng');
  };

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlist(productId);
  };

  const handleClearWishlist = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?')) {
      clearWishlist();
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <FiHeart className="text-6xl text-slate-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Danh sách yêu thích trống</h1>
        <p className="text-slate-300 mb-8">
          Bạn chưa có sản phẩm nào trong danh sách yêu thích. 
          Hãy khám phá và thêm những sản phẩm bạn thích!
        </p>
        <Link
          to="/phones"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          <FiEye />
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Danh sách yêu thích</h1>
          <p className="text-slate-300">
            Bạn có {items.length} sản phẩm trong danh sách yêu thích
          </p>
        </div>
        
        {items.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <FiTrash2 />
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <div key={product.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden group hover:border-slate-600 transition-colors">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
              
              {/* Remove from Wishlist Button */}
              <button
                onClick={() => handleRemoveFromWishlist(product.id)}
                className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa khỏi yêu thích"
              >
                <FiTrash2 className="text-sm" />
              </button>

              {/* View Product Button */}
              <Link
                to={`/product/${product.id}`}
                className="absolute top-3 left-3 p-2 bg-slate-900/80 hover:bg-slate-900 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xem chi tiết"
              >
                <FiEye className="text-sm" />
              </Link>

              {/* Discount Badge */}
              {product.discount && product.discount > 0 && (
                <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                  -{product.discount}%
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-white font-medium mb-2 line-clamp-2">
                {product.name}
              </h3>
              
              {product.brand && (
                <p className="text-slate-400 text-sm mb-2">{product.brand}</p>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-blue-400 font-bold">
                    {formatPrice(product.price)}
                  </div>
                  {product.discount && product.discount > 0 && (
                    <div className="text-slate-500 text-sm line-through">
                      {formatPrice(product.price / (1 - product.discount / 100))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  <FiShoppingCart className="text-sm" />
                  Thêm vào giỏ
                </button>
                
                <button
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Xóa khỏi yêu thích"
                >
                  <FiHeart className="text-sm fill-current" />
                </button>
              </div>

              {/* Added Date */}
              {product.addedAt && (
                <p className="text-slate-500 text-xs mt-2">
                  Đã thêm: {new Date(product.addedAt).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Shopping */}
      <div className="mt-12 text-center">
        <Link
          to="/phones"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
        >
          <FiEye />
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
};

export default WishlistPage;
