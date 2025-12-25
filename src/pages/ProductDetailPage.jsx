import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ProductDetailPage = () => {
  const { id } = useParams();  // Lấy ID sản phẩm từ URL
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,price,image,category,description")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
      } else {
        setProduct(data);
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-semibold">{product.name}</h1>
      <img src={product.image} alt={product.name} className="w-full h-96 object-cover mt-4" />
      <p className="text-lg mt-4">{product.description}</p>
      <p className="text-xl text-blue-500 mt-4">{formatPrice(product.price)}</p>
    </div>
  );
};

export default ProductDetailPage;
