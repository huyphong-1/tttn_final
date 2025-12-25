// src/components/DarkMode.jsx
import React, { useEffect, useState } from "react";
import { MdOutlineLightMode, MdOutlineNightlight } from "react-icons/md";

const prefersDarkMode = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const DarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  // initialize theme from localStorage or prefers-color-scheme
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme === "dark" || (!storedTheme && prefersDarkMode())) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center bg-slate-900 hover:border-blue-500 transition text-lg"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <MdOutlineLightMode /> : <MdOutlineNightlight />}
    </button>
  );
};

export default DarkMode;
