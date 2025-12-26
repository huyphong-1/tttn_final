import React from "react";

const Pagination = ({ currentPage = 1, totalPages = 10, onChange }) => {
  const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1);

  const changePage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onChange?.(page);
  };

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border border-slate-700 transition ${
          currentPage === 1
            ? "text-slate-500 cursor-not-allowed"
            : "text-slate-200 hover:border-blue-500 hover:text-blue-400"
        }`}
      >
        Trước
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => changePage(page)}
          className={`w-9 h-9 rounded-full text-sm font-semibold transition border ${
            currentPage === page
              ? "bg-blue-500 border-blue-500 text-white"
              : "border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border border-slate-700 transition ${
          currentPage === totalPages
            ? "text-slate-500 cursor-not-allowed"
            : "text-slate-200 hover:border-blue-500 hover:text-blue-400"
        }`}
      >
        Sau
      </button>
    </div>
  );
};

export default Pagination;
