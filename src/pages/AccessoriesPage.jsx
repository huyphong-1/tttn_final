import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function AccessoriesPage() {
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAddToCart = (acc) => {
    addItem({
      id: `acc-${acc.id}`,
      name: acc.name,
      price: Number(acc.price),
      image: acc.image,
    });
  };

  useEffect(() => {
    const fetchAccessories = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", "accessory")
        .order("created_at", { ascending: false });

      if (error) console.error("fetchAccessories:", error);
      setItems(data || []);
      setLoading(false);
    };

    fetchAccessories();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 md:py-12">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">Tất cả phụ kiện</h1>

      {loading && <p className="text-sm text-slate-400 mt-2">Đang tải phụ kiện...</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-400 mt-2">Chưa có phụ kiện trong DB.</p>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((acc) => (
          <div
            key={acc.id}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/70 transition"
          >
            <div className="aspect-[4/3] bg-slate-900">
              <img src={acc.image} alt={acc.name} className="w-full h-full object-cover" />
            </div>

            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold">{acc.name}</p>
              <p className="text-sm font-bold text-blue-400">{formatPrice(acc.price)}</p>

              <button
                onClick={() => handleAddToCart(acc)}
                className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-medium"
              >
                Thêm vào giỏ
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
