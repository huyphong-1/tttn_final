// src/pages/RegisterPage.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
  });

  const pwOk = useMemo(() => form.password.length >= 6, [form.password]);
  const matchOk = useMemo(() => form.password === form.confirm, [form]);

  const onChange = (e) => {
    setError("");
    setSuccess("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = form.email.trim();
    if (!email || !form.password || !form.confirm) {
      setError("Nhập đủ email + mật khẩu + xác nhận nha bro 😤");
      return;
    }
    if (!pwOk) {
      setError("Mật khẩu tối thiểu 6 ký tự nha 😗");
      return;
    }
    if (!matchOk) {
      setError("Xác nhận mật khẩu không khớp 🥲");
      return;
    }

    try {
      setLoading(true);

      // ✅ đăng ký qua AuthContext
      const { data, error } = await signUp(email, form.password);
      if (error) throw error;

      // ✅ Auto login nếu Supabase trả session luôn
      // (tuỳ project setting: có thể cần confirm email => không có session)
      const session = data?.session;

      if (session) {
        setSuccess("Đăng ký xong rồi nha ✅ Đang đưa về trang chủ...");
        setTimeout(() => navigate("/"), 600);
      } else {
        setSuccess(
          "Đăng ký thành công ✅ Check email để xác nhận rồi đăng nhập nha!"
        );
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Có lỗi khi đăng ký, thử lại nhé 🥲");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="text-sm text-slate-400 mt-1">
            Đăng ký để mua sắm nhanh hơn và lưu đơn hàng.
          </p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-300">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="email@gmail.com"
              className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Mật khẩu</label>
            <div className="mt-1 relative">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={onChange}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm pr-12 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                {showPw ? "Ẩn" : "Hiện"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {pwOk ? "✅ Ok" : "⚠️ Mật khẩu >= 6 ký tự"}
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-300">Xác nhận mật khẩu</label>
            <input
              name="confirm"
              type={showPw ? "text" : "password"}
              value={form.confirm}
              onChange={onChange}
              placeholder="Nhập lại mật khẩu"
              className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {form.confirm
                ? matchOk
                  ? "✅ Khớp"
                  : "❌ Không khớp"
                : " "}
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-full bg-blue-500 hover:bg-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Có tài khoản rồi?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
