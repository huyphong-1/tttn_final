import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const { showError, showSuccess } = useToast();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (user && !authLoading) {
      setLoading(false); // Reset loading state
      nav("/", { replace: true });
    }
  }, [user, authLoading, nav]);

  // Debug authLoading state
  useEffect(() => {
  }, [authLoading, user]);

  // Fallback timeout để tránh bị treo
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log("Timeout fallback - force redirect");
        setLoading(false);
        nav("/", { replace: true });
      }, 5000); // 5 giây timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, nav]);

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      showError("Vui lòng nhập email");
      return;
    }
    
    if (!password.trim()) {
      showError("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await signIn(email, password);
      if (error) throw error;
      showSuccess("Đăng nhập thành công!");
      
      // Không navigate ngay, để useEffect handle khi user state được cập nhật
      // nav("/"); // Bỏ dòng này
      
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      showError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      setLoading(false); // Chỉ set loading false khi có lỗi
    }
    // Không có finally để loading vẫn true cho đến khi useEffect redirect
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-6">Đăng nhập</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3"
            placeholder="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full py-3 rounded-full bg-blue-500 hover:bg-blue-600 font-bold disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-4">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </main>
  );
}
