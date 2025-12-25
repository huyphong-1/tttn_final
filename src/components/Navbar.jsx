import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { IoMdSearch } from "react-icons/io";
import { FaShoppingCart } from "react-icons/fa";  // Sử dụng đúng FaShoppingCart
import { FaCaretDown } from "react-icons/fa";
import { FaHistory, FaHeart } from "react-icons/fa";  // Thêm icon History và Heart từ react-icons
import DarkMode from "./DarkMode";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { AdminOnly } from "./Guards/RoleGuard";
import PermissionGuard from "./Guards/PermissionGuard";
import { PERMISSIONS } from "../config/permissions";

const Menu = [
  { id: 1, name: "Điện thoại", link: "/phones" },
  { id: 2, name: "Phụ kiện", link: "/accessories" },
  { id: 3, name: "Khuyến mãi", link: "/sale" },
  { id: 4, name: "Hỗ trợ", link: "/support" },
];

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const Navbar = ({ handleOrderPopup }) => {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // ✅ Search state
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // ✅ Dropdown click-state (CÁCH A)
  const [openTrending, setOpenTrending] = useState(false);
  const trendingRef = useRef(null);

  // Hàm handle đăng xuất
  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent double click
    
    try {
      setIsSigningOut(true);
      console.log("Bắt đầu đăng xuất...");
      
      // Sử dụng signOut từ AuthContext
      await signOut();
      
      console.log("Đăng xuất thành công, chuyển hướng...");
      
      // Chuyển hướng về trang chủ
      navigate("/", { replace: true });
      
      // Reload page sau một chút để đảm bảo state được reset
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      // Vẫn chuyển hướng về trang chủ ngay cả khi có lỗi
      navigate("/", { replace: true });
      window.location.reload();
    } finally {
      setIsSigningOut(false);
    }
  };

  // ✅ Click outside => đóng dropdown Trending
  useEffect(() => {
    const onClickOutside = (e) => {
      if (trendingRef.current && !trendingRef.current.contains(e.target)) {
        setOpenTrending(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ✅ Query Supabase khi gõ (debounce 300ms)
  useEffect(() => {
    const q = keyword.trim();

    if (!q) {
      setResults([]);
      setOpenSuggest(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id,name,price,image,category")
          .ilike("name", `%${q}%`)
          .limit(6);

        if (error) {
          console.error("Supabase search error:", error);
          setResults([]);
        } else {
          setResults(data || []);
        }
        setOpenSuggest(true);
      } catch (err) {
        console.error(err);
        setResults([]);
        setOpenSuggest(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [keyword]);

  const goToProduct = (p) => {
    navigate(`/products/${p.id}`);
    setOpenSuggest(false);
    setKeyword("");
  };

  return (
    <div className="shadow-md bg-slate-950 text-slate-100 duration-200 sticky top-0 z-[9999]">
      {/* Thanh trên */}
      <div className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-sm font-bold">
              TP
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">TechPhone</p>
              <p className="text-[11px] text-slate-400">
                Điện thoại chính hãng - Giá tốt
              </p>
            </div>
          </Link>

          {/* Search + Order + Darkmode + Cart mobile */}
          <div className="flex items-center gap-3">
            {/* Search box + dropdown */}
            <div className="hidden md:block relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => {
                  if (keyword.trim()) setOpenSuggest(true);
                }}
                onBlur={() => setTimeout(() => setOpenSuggest(false), 150)}
                placeholder="Tìm theo tên điện thoại..."
                className="w-52 md:w-64 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 pr-8 text-xs outline-none focus:border-blue-500"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                <IoMdSearch />
              </span>

              {openSuggest && (
                <div className="absolute top-full left-0 mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden z-[9999]">
                  {loading ? (
                    <div className="p-3 text-xs text-slate-400">Đang tìm...</div>
                  ) : results.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400">
                      Không thấy sản phẩm phù hợp 🥲
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-800">
                      {results.map((p) => (
                        <li
                          key={p.id}
                          className="p-3 hover:bg-slate-800 cursor-pointer"
                          onMouseDown={() => goToProduct(p)}
                        >
                          <p className="text-xs font-semibold text-slate-100 line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center justify-between gap-2">
                            <span className="truncate">
                              {p.category || "Sản phẩm"}
                            </span>
                            <span className="text-blue-400 font-medium">
                              {formatPrice(p.price)}
                            </span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist & Cart Desktop - Chỉ hiển thị cho user đã đăng nhập */}
            <PermissionGuard permission={PERMISSIONS.WISHLIST_MANAGE}>
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/wishlist"
                  className="relative p-2 text-slate-300 hover:text-red-400 transition-colors"
                  title="Danh sách yêu thích"
                >
                  <FaHeart className="text-lg" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                
                <Link
                  to="/cart"
                  className="relative p-2 text-slate-300 hover:text-blue-400 transition-colors"
                  title="Giỏ hàng"
                >
                  <FaShoppingCart className="text-lg" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </PermissionGuard>

            <DarkMode />
            {/* Auth buttons */}
              {!user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs rounded-full border border-slate-700 hover:border-sky-400 hover:text-sky-400 transition"
                  >
                    Đăng nhập
                  </Link>

                  <Link
                    to="/register"
                    className="px-3 py-1.5 text-xs rounded-full bg-blue-500 hover:bg-blue-600 font-medium transition"
                  >
                    Đăng ký
                  </Link>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <Link
                    to="/profile"
                    className="text-slate-300 hover:text-blue-400 truncate max-w-[120px] transition"
                  >
                    {user.email}
                  </Link>

                  {/* Admin Dashboard Link - Chỉ hiển thị cho admin */}
                  <AdminOnly>
                    <Link
                      to="/admin"
                      className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition"
                    >
                      Admin
                    </Link>
                  </AdminOnly>

                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`px-3 py-1.5 rounded-full border border-slate-700 hover:border-red-400 hover:text-red-400 transition ${
                      isSigningOut ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSigningOut ? 'Đang xuất...' : 'Đăng xuất'}
                  </button>
                </div>
              )}

            {/* Wishlist & Cart mobile - Chỉ hiển thị cho user có quyền */}
            <PermissionGuard permission={PERMISSIONS.WISHLIST_MANAGE}>
              <div className="sm:hidden flex items-center gap-2">
                <Link
                  to="/wishlist"
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full bg-red-500 text-xs font-medium"
                >
                  <FaHeart />
                </Link>
                <Link
                  to="/cart"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 text-xs font-medium"
                >
                  <FaShoppingCart />
                  <span>{cartCount}</span>
                </Link>
              </div>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Thanh dưới */}
      <div className="hidden sm:block border-b border-slate-800 relative z-[9999]">
        <div className="max-w-6xl mx-auto px-4 h-11 flex items-center justify-between">
          <ul className="flex items-center gap-4 text-xs">
            {Menu.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className="px-2 py-1 hover:text-blue-400 transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}

            {/* ✅ Trending dropdown */}
            <li ref={trendingRef} className="relative">
              <button
                type="button"
                onClick={() => setOpenTrending((v) => !v)}
                className="flex items-center gap-1 px-2 py-1 hover:text-blue-400 transition"
              >
                Trending Products
                <FaCaretDown
                  className={`text-[10px] transition ${
                    openTrending ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openTrending && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-[9999]">
                  <ul className="py-1 text-xs">
                    <li>
                      <Link
                        to="/trending"
                        onClick={() => setOpenTrending(false)}
                        className="block px-3 py-1.5 hover:bg-slate-800"
                      >
                        Trending Products
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/best-selling"
                        onClick={() => setOpenTrending(false)}
                        className="block px-3 py-1.5 hover:bg-slate-800"
                      >
                        Best Selling
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/top-rated"
                        onClick={() => setOpenTrending(false)}
                        className="block px-3 py-1.5 hover:bg-slate-800"
                      >
                        Top Rated
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>

            {/* ✅ Lịch sử đơn hàng */}
            <li className="flex items-center gap-2">
              <Link
                to="/order-history"
                className="flex items-center gap-2 px-2 py-1 hover:text-blue-400 transition"
              >
                <FaHistory />
                Lịch Sử Đơn Hàng
              </Link>
            </li>
          </ul>

          {/* Nút giỏ hàng desktop */}
          <Link
            to="/cart"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500 text-xs font-medium hover:bg-blue-600"
          >
            <FaShoppingCart />
            <span>Giỏ hàng ({cartCount})</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
