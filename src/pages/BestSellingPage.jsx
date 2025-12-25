import React from "react";
import { useCart } from "../context/CartContext";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

const bestSellingProducts = [
  {
    id: 401,
    name: "iPhone 14 Pro Max (Best Selling)",
    price: 24990000,
    image:
      "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=1200",
    badge: "Best",
  },
  {
    id: 402,
    name: "Samsung S23 Ultra (Best Selling)",
    price: 21990000,
    image:
      "https://images.pexels.com/photos/5082579/pexels-photo-5082579.jpeg?auto=compress&cs=tinysrgb&w=1200",
    badge: "Best",
  },
  {
    id: 403,
    name: "Xiaomi 13T Pro (Best Selling)",
    price: 13990000,
    image:
      "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=1200",
    badge: "Best",
  },
];

const formatPrice = (n) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function BestSellingPage() {
  const { addItem } = useCart();

  useEffect(() => {
    const fetchPhones = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_best_seller", true)
        .order("created_at", { ascending: false });

      if (!error) setPhones(data);
    };
    fetchPhones();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Best Selling</h1>
        <p className="text-sm text-slate-400 mt-1">
          Sản phẩm bán chạy nhất tuần này.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bestSellingProducts.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden relative"
          >
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/90 text-white">
                {p.badge}
              </span>
            </div>

            <div className="h-[380px] bg-slate-900">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover opacity-80"
                loading="lazy"
              />
            </div>

            <div className="p-4 border-t border-slate-800/80">
              <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
              <p className="mt-1 text-sm font-bold text-blue-400">
                {formatPrice(p.price)}
              </p>

              <button
                onClick={() =>
                  addItem({ id: `best-${p.id}`, name: p.name, price: p.price, image: p.image })
                }
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold transition"
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
