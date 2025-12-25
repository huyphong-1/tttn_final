// src/components/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SkipLink from "./Accessibility/SkipLink";

const Layout = () => {
  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen">
      <SkipLink />
      <Navbar />
      <main id="main-content" tabIndex="-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
