import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useSupabaseProducts } from "../hooks/useSupabaseProducts";
import ProductCard from "../components/ProductCard";
import OptimizedFilterBar from "../components/OptimizedFilterBar";
import Pagination from "../components/Pagination";
import {
  BRAND_OPTIONS,
  SORT_OPTIONS,
  getSortConfig,
} from "../constants/filterOptions";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { PRODUCT_LIST_FIELDS } from "../constants/productFields";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const toNumberOrNull = (value) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const PAGE_SIZE = 12;
const CACHE_TTL_MS = 300000;

export default function AccessoriesPage() {
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

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, brand, normalizedMin, normalizedMax, sort]);

  const { products, loading, error, totalCount } = useSupabaseProducts({
    inCategory: ["accessory", "accessories"],
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

  const isFiltering =
    !!debouncedKeyword || brand !== "all" || minPrice !== "" || maxPrice !== "";

  const resetFilters = () => {
    setQ("");
    setBrand("all");
    setMinPrice("");
    setMaxPrice("");
    setSort(SORT_OPTIONS[0].value);
  };

  const handleAddToCart = useCallback(
    (acc) => {
      addItem({
        id: `acc-${acc.id}`,
        productId: acc.id,
        name: acc.name,
        price: Number(acc.price),
        image: acc.image,
      });
    },
    [addItem]
  );

  const showEmpty = !loading && !error && products.length === 0;
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 md:py-12">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">Tất cả</h1>

      <OptimizedFilterBar
        query={q}
        onQueryChange={setQ}
        searchPlaceholder="VD: AirPods, sạc nhanh..."
        brand={brand}
        onBrandChange={setBrand}
        brandOptions={BRAND_OPTIONS}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        priceHint="VD: 200000 - 5000000"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        onReset={resetFilters}
      />

      {loading && <p className="text-sm text-slate-400 mt-2">Đang tải phụ kiện</p>}
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      {showEmpty && (
        <p className="text-sm text-slate-400 mt-2">
          {isFiltering ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào."}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((acc) => (
          <ProductCard
            key={acc.id}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/70 transition"
          >
            <Link
              to={`/product/${acc.id}`}
              className="block aspect-[4/3] bg-slate-900"
            >
              <img
                loading="lazy"
                src={acc.image}
                alt={acc.name}
                className="w-full h-full object-cover transition duration-300 hover:scale-105"
              />
            </Link>

            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold">{acc.name}</p>
              <p className="text-sm font-bold text-blue-400">
                {formatPrice(acc.price)}
              </p>

              <button
                onClick={() => handleAddToCart(acc)}
                className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-medium"
              >
                Thêm vào giỏ
              </button>
            </div>
          </ProductCard>
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </main>
  );
}
