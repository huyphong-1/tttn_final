import React from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

const CATEGORIES = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'accessory', label: 'Phụ kiện' },
  { value: 'tablet', label: 'Máy tính bảng' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'smartwatch', label: 'Đồng hồ thông minh' },
  { value: 'headphone', label: 'Tai nghe' }
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const ProductFilters = ({
  searchTerm,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  pageSize,
  onPageSizeChange,
  totalCount
}) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-sm p-6 mb-6 border border-slate-700">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="lg:w-64">
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={filterCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white appearance-none"
            >
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Size */}
        <div className="lg:w-32">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-slate-400">
        Tìm thấy <span className="font-medium text-white">{totalCount}</span> sản phẩm
      </div>
    </div>
  );
};

export default ProductFilters;
