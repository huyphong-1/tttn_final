import React from 'react';
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import CloudinaryImage from '../CloudinaryImage';

const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  onView, 
  loading = false 
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Hoạt động', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      inactive: { label: 'Tạm dừng', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryLabel = (category) => {
    const categoryLabels = {
      phone: 'Điện thoại',
      accessory: 'Phụ kiện',
      tablet: 'Máy tính bảng',
      laptop: 'Laptop',
      smartwatch: 'Đồng hồ thông minh',
      headphone: 'Tai nghe'
    };
    return categoryLabels[category] || category;
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
        <div className="p-8 text-center">
          <p className="text-slate-400">Không có sản phẩm nào được tìm thấy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Kho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-600">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <CloudinaryImage
                        publicId={product.image}
                        alt={product.name}
                        preset="PRODUCT_THUMB"
                        className="h-12 w-12 rounded-lg object-cover"
                        fallbackSrc="https://via.placeholder.com/48x48/e2e8f0/64748b?text=No+Image"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {product.name}
                      </div>
                      <div className="text-sm text-slate-400">
                        {product.brand}
                      </div>
                      {product.featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                          Nổi bật
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white">
                    {getCategoryLabel(product.category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {formatPrice(product.price)}
                  </div>
                  {product.discount > 0 && (
                    <div className="text-xs text-red-400">
                      Giảm {product.discount}%
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                    product.stock > 10 
                      ? 'text-green-400' 
                      : product.stock > 0 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                  }`}>
                    {product.stock} sản phẩm
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(product.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(product)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
