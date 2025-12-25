// src/pages/PhonesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { Link, useSearchParams } from "react-router-dom";

const PAGE_SIZE = 12; // ✅ 12 sp / trang

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function PhonesPage() {
  const { addItem } = useCart();

  // ✅ query param: ?page=1
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Number(searchParams.get("page") || 1);

  // ✅ STATE (quan trọng)
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ phân trang
  const [page, setPage] = useState(pageFromUrl);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = useMemo(() => {
    const p = Math.ceil(totalCount / PAGE_SIZE);
    return p <= 0 ? 1 : p;
  }, [totalCount]);

  const handleAdd = (p) => {
    addItem({
      id: `phone-${p.id}`,
      name: p.name,
      price: p.price,
      image: p.image,
      quantity: 1,
    });
  };

  // ✅ đồng bộ page -> URL
  useEffect(() => {
    setSearchParams({ page: String(page) });
  }, [page, setSearchParams]);

  // ✅ fetch theo page
  useEffect(() => {
    const fetchPhones = async () => {
      try {
        setLoading(true);

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // ✅ count cần headless để ra totalCount
        const { data, error, count } = await supabase
          .from("products")
          .select("id,name,price,image,category", { count: "exact" })
          .eq("category", "phone")
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        setPhones(data || []);
        setTotalCount(count || 0);
      } catch (err) {
        console.error("fetchPhones error:", err);
        setPhones([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPhones();
  }, [page]);

  // ✅ UI pagination 1-5 (và có Prev/Next)
  const Pagination = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="mt-10 flex items-center justify-center gap-2 text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/60 disabled:opacity-40 hover:border-blue-500"
        >
          Prev
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-10 h-10 rounded-full border transition
              ${
                p === page
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-slate-700 bg-slate-900/60 hover:border-blue-500"
              }`}
          >
            {p}
          </button>
        ))}

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/60 disabled:opacity-40 hover:border-blue-500"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Điện thoại nổi bật</h1>
        <p className="text-sm text-slate-400 mt-1">
          Flagship mới nhất, giá tốt, hỗ trợ thu cũ đổi mới.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Đang tải sản phẩm...</div>
      ) : phones.length === 0 ? (
        <div className="text-sm text-slate-400">Chưa có sản phẩm nào.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phones.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
              >
                <div className="h-[320px] bg-slate-900">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover opacity-90"
                    loading="lazy"
                  />
                </div>

                <div className="p-4 border-t border-slate-800/80">
                  <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                  <p className="text-sm font-bold text-blue-400 mt-1">
                    {formatPrice(p.price)}
                  </p>

                  <button
                    onClick={() => handleAdd(p)}
                    className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold transition"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination />
        </>
      )}
    </main>
  );
}
