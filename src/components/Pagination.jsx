import React from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Pagination = ({
  page,
  setPage,
  limit,
  setLimit,
  total,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className={`sticky bottom-0 px-10 py-2 border-t z-30 ${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-900 to-emerald-800 border-emerald-700' : 'bg-gray-900 border-gray-700'}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className={`border rounded px-2 py-1 text-white outline-none focus:border-blue-500 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600' : 'bg-gray-800 border-gray-600'}`}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n} className="bg-gray-900">
              {n}
            </option>
          ))}
        </select>

        <button
          disabled={page === 1}
          onClick={() => setPage(1)}
          className={`p-1 border rounded disabled:opacity-50 text-gray-300 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={`p-1 border rounded disabled:opacity-50 text-gray-300 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-gray-400">Page</span>

        <input
          type="number"
          className={`w-12 border rounded text-center text-white outline-none focus:border-blue-500 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600' : 'bg-gray-800 border-gray-600'}`}
          value={page}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 1 && value <= totalPages) setPage(value);
          }}
        />

        <span className="text-gray-400">/ {totalPages}</span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className={`p-1 border rounded disabled:opacity-50 text-gray-300 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
        >
          <ChevronRight size={16} />
        </button>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
          className={`p-1 border rounded disabled:opacity-50 text-gray-300 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
        >
          <ChevronsRight size={16} />
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`p-1 border rounded text-blue-400 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        )}

        <span className="text-gray-400">
          Showing <b className="text-white">{start <= total ? start : 0}</b> to <b className="text-white">{end}</b>{" "}
          of <b className="text-white">{total}</b> records
        </span>
      </div>
    </div>
  );
};

export default Pagination;
