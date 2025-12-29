import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiShoppingCart } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import CloudinaryImage from "../components/CloudinaryImage";

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const SPEC_FALLBACK = "Đang cập nhật";

const ensureSpecValue = (value) => {
  if (value === null || typeof value === "undefined") return SPEC_FALLBACK;
  if (typeof value === "string" && value.trim() === "") return SPEC_FALLBACK;
  return value;
};

const parseSpecObject = (rawSpecs) => {
  if (!rawSpecs) return {};
  if (typeof rawSpecs === "object") return rawSpecs;
  if (typeof rawSpecs === "string") {
    try {
      return JSON.parse(rawSpecs);
    } catch (err) {
      console.warn("ProductDetailPage: failed to parse specs JSON", err);
      return {};
    }
  }
  return {};
};

const normalizeTextList = (text) => {
  if (!text || typeof text !== "string") return [];

  return text
    .split(/\r?\n|[,;]|\u2022/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((entry) => {
      if (entry.includes(":")) {
        const [label, ...info] = entry.split(":");
        return {
          label: label.trim() || "Thông số",
          value: ensureSpecValue(info.join(":").trim()),
        };
      }
      return { label: "Thông số", value: ensureSpecValue(entry) };
    });
};

const buildSpecifications = (product) => {
  const specs = parseSpecObject(product.specs);

  const structured = [
    { label: "Hãng", value: ensureSpecValue(product.brand || specs.brand) },
    { label: "Danh mục", value: ensureSpecValue(product.category || specs.category) },
    { label: "Màu sắc", value: ensureSpecValue(product.color || specs.color) },
    { label: "RAM", value: ensureSpecValue(product.ram || specs.ram) },
    {
      label: "Bộ nhớ",
      value: ensureSpecValue(
        product.storage || product.rom || specs.storage || specs.rom
      ),
    },
    { label: "Pin", value: ensureSpecValue(product.battery || specs.battery) },
    { label: "Màn hình", value: ensureSpecValue(product.display || specs.display) },
    { label: "Camera", value: ensureSpecValue(product.camera || specs.camera) },
    { label: "Trọng lượng", value: ensureSpecValue(product.weight || specs.weight) },
    { label: "Bảo hành", value: ensureSpecValue(product.warranty || specs.warranty) },
    { label: "Hệ điều hành", value: ensureSpecValue(specs.os) },
    { label: "Chip xử lý", value: ensureSpecValue(specs.chip) },
    { label: "GPU", value: ensureSpecValue(specs.gpu) },
    { label: "SIM", value: ensureSpecValue(specs.sim) },
    { label: "Kết nối", value: ensureSpecValue(specs.connectivity) },
    { label: "Sạc", value: ensureSpecValue(specs.charging) },
    { label: "Chuẩn kháng nước", value: ensureSpecValue(specs.ip_rating) },
    { label: "Âm thanh", value: ensureSpecValue(specs.audio) },
  ];

  return [...structured, ...normalizeTextList(product.specifications)];
};

const isValidUUID = (value = "") =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!isValidUUID(id)) {
        console.warn("ProductDetailPage: invalid ID format, skipping Supabase fetch", id);
        setError("Sản phẩm mẫu chưa được đồng bộ vào cơ sở dữ liệu.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        setProduct(data);
      } catch (fetchErr) {
        console.error("Error fetching product:", fetchErr);
        setError("Khong tim thay san pham ban can.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const parsedSpecs = useMemo(() => (product ? buildSpecifications(product) : []), [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: `product-${product.id}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-lg text-slate-300 mb-6">{error || "San pham khong ton tai."}</p>
        <Link
          to="/phones"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 hover:border-blue-500 text-sm transition"
        >
          <FiArrowLeft />
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-6"
      >
        <FiArrowLeft className="text-base" />
        Trang trước
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
            <CloudinaryImage
              publicId={product.image}
              alt={product.name}
              preset="PRODUCT_DETAIL"
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
              {product.category || "San pham"}
            </p>
            <h1 className="text-3xl font-semibold text-white">{product.name}</h1>
          </div>

          {product.description && (
            <p className="text-sm text-slate-300 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-blue-400">{formatPrice(product.price)}</p>
            {product.old_price && (
              <p className="text-sm text-slate-500 line-through">{formatPrice(product.old_price)}</p>
            )}
          </div>

          {parsedSpecs.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Chi tiết sản phẩm</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {parsedSpecs.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="rounded-2xl border border-slate-800 px-4 py-3 flex items-center justify-between gap-3 bg-slate-900/30"
                  >
                    <span className="text-[11px] uppercase tracking-[0.18em] text-blue-300 font-semibold">
                      {item.label}
                    </span>
                    <span className="text-sm text-white font-semibold text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition"
          >
            <FiShoppingCart />
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>

    </main>
  );
};

export default ProductDetailPage;
