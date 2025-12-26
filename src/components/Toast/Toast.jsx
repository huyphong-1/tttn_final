import React, { useEffect } from "react";

const TYPE_STYLES = {
  success: {
    bg: "bg-emerald-500/15 border-emerald-400/60",
    text: "text-emerald-200",
    label: "Thành công",
  },
  error: {
    bg: "bg-red-500/15 border-red-400/60",
    text: "text-red-200",
    label: "Lỗi",
  },
  warning: {
    bg: "bg-amber-500/15 border-amber-400/60",
    text: "text-amber-200",
    label: "Cảnh báo",
  },
  info: {
    bg: "bg-blue-500/15 border-blue-400/60",
    text: "text-blue-200",
    label: "Thông báo",
  },
};

export default function Toast({ type = "info", message, duration = 5000, onClose }) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = TYPE_STYLES[type] || TYPE_STYLES.info;

  return (
    <div
      role="status"
      className={`min-w-[260px] max-w-sm px-4 py-3 rounded-2xl border shadow-lg shadow-slate-900/40 backdrop-blur ${styles.bg} ${styles.text}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.25em] mb-1 opacity-75">{styles.label}</p>
          <p className="text-sm">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-300 hover:text-white transition"
          aria-label="Đóng thông báo"
        >
          ×
        </button>
      </div>
    </div>
  );
}
