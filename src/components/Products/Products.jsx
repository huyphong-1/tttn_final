import React from "react";
import { useCart } from "../../context/CartContext";

const ProductsPage = () => {
  const { addItem } = useCart();

  const products = [
    {
      id: 1,
      name: "iPhone 15 Pro Max",
      price: 31990000,
      image: "https://example.com/iphone.png",
    },
    {
      id: 2,
      name: "Samsung S24 Ultra",
      price: 28990000,
      image: "https://example.com/s24.png",
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Tất cả sản phẩm</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 p-4 rounded-lg shadow border border-slate-700"
          >
            <img src={p.image} alt={p.name} className="rounded mb-3" />
            <h2 className="font-semibold text-lg">{p.name}</h2>
            <p className="text-blue-400 font-bold">
              {p.price.toLocaleString("vi-VN")}₫
            </p>

            <button
              onClick={() => addItem(p)}
              className="mt-3 bg-blue-600 px-3 py-2 rounded text-white hover:bg-blue-500"
            >
              Thêm vào giỏ
            </button>
          </div>
        ))}
      </div>
    </main>
  );
};

export default ProductsPage;
