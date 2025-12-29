import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import CloudinaryImage from '../CloudinaryImage';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const ProductCard = memo(({ product, onAddToCart, linkPrefix = '' }) => {
  if (!product) return null;

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/10 transition">
      <Link
        to={`/product/${product.id}`}
        className="relative aspect-[3/4] bg-slate-900 overflow-hidden block"
      >
        <CloudinaryImage
          publicId={product.image}
          alt={product.name}
          preset="PRODUCT_CARD"
          className="w-full h-full group-hover:scale-105 transition duration-300"
          enableProgressiveLoading={true}
        />
        
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/90 text-white">
              {product.badge}
            </span>
          </div>
        )}
      </Link>
      
      <div className="p-3 space-y-2">
        {product.brand && (
          <p className="text-xs uppercase text-slate-400">
            {product.brand}
          </p>
        )}
        
        <Link to={`/product/${product.id}`}>
          <p className="font-semibold text-sm line-clamp-2 hover:text-blue-400 transition">
            {product.name}
          </p>
        </Link>
        
        <p className="text-sm font-bold text-blue-400">
          {formatPrice(product.price)}
        </p>

        {onAddToCart && (
          <button
            onClick={handleAddClick}
            className="mt-2 text-[11px] px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 font-medium transition w-full"
          >
            Thêm vào giỏ
          </button>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
