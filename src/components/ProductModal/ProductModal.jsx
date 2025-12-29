import React from 'react';
import { FiX, FiPackage, FiEdit3 } from 'react-icons/fi';
import ProductForm from '../ProductForm/ProductForm';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  onSave, 
  loading = false 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-slate-600/50 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-center gap-3">
            {product ? (
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <FiEdit3 className="w-5 h-5 text-blue-400" />
              </div>
            ) : (
              <div className="p-2 bg-green-600/20 rounded-lg">
                <FiPackage className="w-5 h-5 text-green-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">
                {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              {product && (
                <p className="text-sm text-slate-400 mt-1">
                  ID: {product.id?.slice(0, 8)}... • {product.name}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-600/50 rounded-xl transition-all duration-200 group"
          >
            <FiX className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)] bg-slate-800">
          <ProductForm
            product={product}
            onSave={onSave}
            onCancel={onClose}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
