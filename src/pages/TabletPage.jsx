import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { usePrismaProducts } from "../hooks/usePrismaProducts";
import ProductCard from "../components/ProductCard";
import OptimizedFilterBar from "../components/OptimizedFilterBar";
import Pagination from "../components/Pagination";
import { BRAND_OPTIONS, SORT_OPTIONS, getSortConfig } from "../constants/filterOptions";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { PRODUCT_LIST_FIELDS } from "../constants/productFields";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const toNumberOrNull = (value) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const PAGE_SIZE = 12;
const CACHE_TTL_MS = 300000;

export default function TabletPage() {
  const { addItem } = useCart();

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);

  const normalizedMin = useMemo(() => toNumberOrNull(minPrice), [minPrice]);
  const normalizedMax = useMemo(() => toNumberOrNull(maxPrice), [maxPrice]);
  const debouncedKeyword = useDebouncedValue(q.trim(), 300);
  const sortConfig = useMemo(() => getSortConfig(SORT_OPTIONS, sort), [sort]);

  const { products, loading, error, totalCount } = usePrismaProducts({
    inCategory: ["tablet"],
    keyword: debouncedKeyword || undefined,
    brand,
    priceGte: normalizedMin,
    priceLte: normalizedMax,
    orderBy: sortConfig.orderBy,
    ascending: sortConfig.ascending,
    pageSize: PAGE_SIZE,
    page,
    fields: PRODUCT_LIST_FIELDS,
    cacheTtlMs: CACHE_TTL_MS,
  });

  useEffect(() => {
    setPage(1);
  }, [brand, debouncedKeyword, normalizedMin, normalizedMax, sort]);

  const handleAdd = useCallback((p) => {
    addItem({
      id: p.id,
      productId: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      image: p.image,
      quantity: 1,
      category: p.category || "tablet",
      brand: p.brand || "",
    });
  }, [addItem]);

  const resetFilters = () => {
    setQ("");
    setBrand("all");
    setMinPrice("");
    setMaxPrice("");
    setSort(SORT_OPTIONS[0].value);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Máy tính bảng</h1>
        <p className="text-sm text-slate-400 mt-1">
          Chọn tablet chính hãng, giá tốt nhất tại Di Động Việt.
        </p>
      </div>

      <OptimizedFilterBar
        query={q}
        onQueryChange={setQ}
        searchPlaceholder="VD: iPad Air, Tab S9..."
        brand={brand}
        onBrandChange={setBrand}
        brandOptions={BRAND_OPTIONS}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        priceHint="VD: 8000000 - 20000000"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        onReset={resetFilters}
      />

      {loading && <p className="text-sm text-slate-400 mb-4">Đang tải sản phẩm...</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          Không có sản phẩm phù hợp với yêu cầu.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={{ ...p, badge: "Tablet" }}
            onAddToCart={handleAdd}
          />
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </main>
  );
}
