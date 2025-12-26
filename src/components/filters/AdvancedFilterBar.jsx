import React from "react";

export default function AdvancedFilterBar({
  query,
  onQueryChange,
  searchPlaceholder,
  brand,
  onBrandChange,
  brandOptions = [],
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  priceHint,
  sort,
  onSortChange,
  sortOptions = [],
  onReset,
}) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <label className="block text-[11px] text-slate-400 mb-1">Tìm theo tên</label>
          <input
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[11px] text-slate-400 mb-1">Hãng</label>
          <select
            value={brand}
            onChange={(e) => onBrandChange?.(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả</option>
            {brandOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-[11px] text-slate-400 mb-1">Khoảng giá (VND)</label>
          <div className="flex gap-2">
            <input
              value={minPrice}
              onChange={(e) => onMinPriceChange?.(e.target.value)}
              inputMode="numeric"
              placeholder="Tu"
              className="w-1/2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              value={maxPrice}
              onChange={(e) => onMaxPriceChange?.(e.target.value)}
              inputMode="numeric"
              placeholder="Den"
              className="w-1/2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          {priceHint ? <p className="text-[11px] text-slate-500 mt-1">{priceHint}</p> : null}
        </div>

        <div className="md:col-span-2 flex flex-col">
          <label className="block text-[11px] text-slate-400 mb-1">Thứ tự</label>
          <select
            value={sort}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {onReset && (
            <button
              onClick={onReset}
              type="button"
              className="mt-3 text-xs px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-600 text-slate-200 transition"
            >
              Làm mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
