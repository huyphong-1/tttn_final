import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useProducts";
import AdvancedFilterBar from "../components/filters/AdvancedFilterBar";
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
const CACHE_TTL_MS = 60000;

export default function PhonesPage() {
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

  const { products, loading, error, totalCount } = useProducts({
    inCategory: ["phone", "phones"],
    keyword: debouncedKeyword || undefined,
    brand,
    priceGte: normalizedMin,
    priceLte: normalizedMax,
    orderBy: sortConfig.orderBy,
    ascending: sortConfig.ascending,
    isActive: true,
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

  const handleAdd = (p) => {
    addItem({
      id: `phone-${p.id}`,
      productId: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
    });
  };

  const showEmpty = !loading && !error && products.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Điện thoại nổi bật</h1>
        <p className="text-sm text-slate-400 mt-1">Flagship mới nhất, thu cũ, đổi mới hỗ trợ lên tới 40%.</p>
      </div>

      <AdvancedFilterBar
        query={q}
        onQueryChange={setQ}
        searchPlaceholder="VD: iPhone 15, Galaxy S24..."
        brand={brand}
        onBrandChange={setBrand}
        brandOptions={BRAND_OPTIONS}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        priceHint="VD: 5000000 - 20000000"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        onReset={resetFilters}
      />

      {loading && <p className="text-sm text-slate-400 mb-4">Đang tải điẹn thoại...</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {showEmpty && (
        <p className="text-sm text-slate-400 mb-4">
          {isFiltering ? "Hiện tại không có sản phẩm ." : "Hết hàng."}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <Link to={`/product/${p.id}`} className="block h-[380px] bg-slate-900">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover opacity-80 transition duration-300 hover:opacity-100"
                loading="lazy"
              />
            </Link>

            <div className="p-4 border-t border-slate-800/80">
              <Link to={`/product/${p.id}`}>
                <p className="text-sm font-semibold line-clamp-2 hover:text-blue-400 transition">
                  {p.name}
                </p>
              </Link>
              <p className="text-sm font-bold text-blue-400 mt-1">
                {formatPrice(p.price)}
              </p>

              <button
                onClick={() => handleAdd(p)}
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold transition"
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </main>
  );
}
