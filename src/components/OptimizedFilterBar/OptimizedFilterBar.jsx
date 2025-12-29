import React, { memo, useCallback, useMemo } from 'react';
import { FiSearch, FiRefreshCcw } from 'react-icons/fi';

const OptimizedFilterBar = memo(({
  query,
  onQueryChange,
  searchPlaceholder = "Tìm kiếm sản phẩm...",
  brand,
  onBrandChange,
  brandOptions = [],
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  priceHint = "VD: 1000000 - 5000000",
  sort,
  onSortChange,
  sortOptions = [],
  onReset,
  showAdvancedFilters = true
}) => {
  // Memoize handlers để tránh re-render children
  const handleQueryChange = useCallback((e) => {
    onQueryChange?.(e.target.value);
  }, [onQueryChange]);

  const handleBrandChange = useCallback((e) => {
    onBrandChange?.(e.target.value);
  }, [onBrandChange]);

  const handleMinPriceChange = useCallback((e) => {
    onMinPriceChange?.(e.target.value);
  }, [onMinPriceChange]);

  const handleMaxPriceChange = useCallback((e) => {
    onMaxPriceChange?.(e.target.value);
  }, [onMaxPriceChange]);

  const handleSortChange = useCallback((e) => {
    onSortChange?.(e.target.value);
  }, [onSortChange]);

  const handleReset = useCallback((e) => {
    e.preventDefault();
    onReset?.();
  }, [onReset]);

  // Memoize filtered brand options
  const filteredBrandOptions = useMemo(() => {
    return brandOptions.filter(Boolean).slice(0, 20); // Limit to prevent DOM bloat
  }, [brandOptions]);

  // Memoize sort options  
  const memoizedSortOptions = useMemo(() => {
    return sortOptions.filter(Boolean);
  }, [sortOptions]);

  const hasActiveFilters = useMemo(() => {
    return query || (brand && brand !== 'all') || minPrice || maxPrice;
  }, [query, brand, minPrice, maxPrice]);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={handleQueryChange}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Brand Filter */}
        {showAdvancedFilters && (
          <select
            value={brand}
            onChange={handleBrandChange}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả thương hiệu</option>
            {filteredBrandOptions.map((brandOption) => (
              <option key={brandOption} value={brandOption}>
                {brandOption}
              </option>
            ))}
          </select>
        )}

        {/* Price Range */}
        {showAdvancedFilters && (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Giá từ"
              value={minPrice}
              onChange={handleMinPriceChange}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Giá đến"
              value={maxPrice}
              onChange={handleMaxPriceChange}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={handleSortChange}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {memoizedSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors flex items-center gap-1"
              title="Xóa bộ lọc"
            >
              <FiRefreshCcw className="text-xs" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Price Hint */}
      {showAdvancedFilters && priceHint && (
        <p className="text-xs text-slate-400 mt-2">{priceHint}</p>
      )}
    </div>
  );
});

OptimizedFilterBar.displayName = 'OptimizedFilterBar';

export default OptimizedFilterBar;
