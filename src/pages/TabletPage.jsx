import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";
import AdvancedFilterBar from "../components/filters/AdvancedFilterBar";
import Pagination from "../components/Pagination";
import { BRAND_OPTIONS, SORT_OPTIONS, getSortConfig } from "../constants/filterOptions";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { expandCategoryValues } from "../utils/categoryUtils";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const toNumberOrNull = (value) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const PAGE_SIZE = 12;

export default function TabletPage() {
  const { addItem } = useCart();

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const normalizedMin = useMemo(() => toNumberOrNull(minPrice), [minPrice]);
  const normalizedMax = useMemo(() => toNumberOrNull(maxPrice), [maxPrice]);
  const debouncedKeyword = useDebouncedValue(q.trim(), 300);
  const sortConfig = useMemo(() => getSortConfig(SORT_OPTIONS, sort), [sort]);

  useEffect(() => {
    setPage(1);
  }, [brand, debouncedKeyword, normalizedMin, normalizedMax, sort]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    const fetchProducts = async () => {
      try {
        let query = supabase
          .from("products")
          .select("id,name,price,image,brand,category,created_at,status,condition", {
            count: "exact",
          });

        const tabletVariants = expandCategoryValues(["tablet"]);
        if (tabletVariants.length) {
          query = query.in("category", tabletVariants);
        }

        query = query.eq("status", "active").eq("condition", "new");

        if (debouncedKeyword) {
          query = query.ilike("name", `%${debouncedKeyword}%`);
        }

        if (brand !== "all") {
          query = query.eq("brand", brand);
        }

        if (normalizedMin !== null) {
          query = query.gte("price", normalizedMin);
        }
        if (normalizedMax !== null) {
          query = query.lte("price", normalizedMax);
        }

        if (sortConfig?.orderBy) {
          query = query.order(sortConfig.orderBy, { ascending: !!sortConfig.ascending });
        }

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (!alive) return;

        if (error) {
          setErr(error.message || "Khong the tai san pham");
          setItems([]);
          setTotalCount(0);
        } else {
          setItems(data || []);
          setTotalCount(typeof count === "number" ? count : data?.length || 0);
        }
      } catch (error) {
        if (!alive) return;
        setErr(error?.message || "Loi khong xac dinh");
        setItems([]);
        setTotalCount(0);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      alive = false;
    };
  }, [brand, debouncedKeyword, normalizedMax, normalizedMin, sortConfig, page]);

  const handleAdd = (p) => {
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
  };

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
        <h1 className="text-2xl md:text-3xl font-semibold">May tinh bang</h1>
        <p className="text-sm text-slate-400 mt-1">
          Chon tablet de hoc, ve, xem phim.
        </p>
      </div>

      <AdvancedFilterBar
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
      {err && <p className="text-sm text-red-400 mb-4">{err}</p>}

      {!loading && !err && items.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          Không có sản phẩm phù hợp với yêu cầu.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-blue-500/60 transition"
          >
            <Link to={`/product/${p.id}`} className="block h-[380px] bg-slate-900">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition duration-300"
                loading="lazy"
              />
            </Link>

            <div className="p-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">{p.brand || "Tablet"}</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Tablet
                </span>
              </div>

              <Link to={`/product/${p.id}`}>
                <p className="mt-1 text-sm font-semibold line-clamp-2 hover:text-blue-400 transition">
                  {p.name}
                </p>
              </Link>

              <div className="mt-2 flex items-end gap-2">
                <p className="text-sm font-bold text-blue-400">{formatPrice(p.price)}</p>
              </div>

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
