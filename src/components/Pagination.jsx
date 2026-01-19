import React, { useState } from "react";
import toast from "react-hot-toast";
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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
        setIsRefreshing(true);
        await onRefresh();
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success("Refreshed");
        }, 500); 
    }
  };

  return (
    <div className={`sticky bottom-0 px-1 py-1 z-30 ${theme === 'emerald' ? 'border-t bg-gradient-to-b from-emerald-800 to-emerald-700 border-emerald-600' : theme === 'purple' ? 'border-t bg-white border-[#6448AE] text-[#6448AE]' : 'border-t bg-gray-900 border-gray-700'}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className={`border rounded px-2 py-1 outline-none focus:border-blue-500 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 text-white' : theme === 'purple' ? 'bg-white border-[#6448AE] text-[#6448AE]' : 'bg-gray-800 border-gray-600 text-white'}`}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n} className={theme === 'emerald' ? "bg-emerald-800" : theme === 'purple' ? "bg-white text-gray-900" : "bg-gray-900"}>
              {n}
            </option>
          ))}
        </select>

        <button
          disabled={page === 1}
          onClick={() => setPage(1)}
          className={`p-1 border rounded disabled:opacity-50 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 hover:bg-emerald-600 text-gray-300' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] hover:bg-[#50398f] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'}`}
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={`p-1 border rounded disabled:opacity-50 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 hover:bg-emerald-600 text-gray-300' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] hover:bg-[#50398f] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'}`}
        >
          <ChevronLeft size={16} />
        </button>

        <span className={`${theme === 'purple' ? 'text-[#6448AE]' : 'text-gray-400'}`}>Page</span>

        <input
          type="number"
          className={`w-12 border rounded text-center outline-none focus:border-blue-500 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 text-white' : theme === 'purple' ? 'bg-white border-[#6448AE] text-[#6448AE]' : 'bg-gray-800 border-gray-600 text-white'}`}
          value={page}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 1 && value <= totalPages) setPage(value);
          }}
        />

        <span className={`${theme === 'purple' ? 'text-[#6448AE]' : 'text-gray-400'}`}>/ {totalPages}</span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className={`p-1 border rounded disabled:opacity-50 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 hover:bg-emerald-600 text-gray-300' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] hover:bg-[#50398f] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'}`}
        >
          <ChevronRight size={16} />
        </button>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
          className={`p-1 border rounded disabled:opacity-50 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 hover:bg-emerald-600 text-gray-300' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] hover:bg-[#50398f] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'}`}
        >
          <ChevronsRight size={16} />
        </button>

        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1 border rounded ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 hover:bg-emerald-600 text-blue-400' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] hover:bg-[#50398f] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-blue-400'}`}
            title="Refresh"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        )}

        <span className={`${theme === 'purple' ? 'text-[#6448AE]' : 'text-gray-400'}`}>
          Showing <b className={`${theme === 'purple' ? 'text-[#6448AE] hover:bg-[#6E55B6] ' : 'text-white'}`}>{start <= total ? start : 0}</b> to <b className={`${theme === 'purple' ? 'text-[#6448AE] hover:bg-[#6E55B6] ' : 'text-white'}`}>{end}</b>{" "}
          of <b className={`${theme === 'purple' ? 'text-[#6448AE] hover:bg-[#6E55B6] ' : 'text-white'}`}>{total}</b> records
        </span>
      </div>
    </div>
  );
};

export default Pagination;
