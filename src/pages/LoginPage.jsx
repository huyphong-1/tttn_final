import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await signIn(email, password);
      if (error) throw error;
      nav("/");
    } catch (err) {
      alert(err.message || "Login fail");
    } finally {
      setLoading(false);
    }
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
