import React from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";

const Pagination = ({
  page,
  setPage,
  limit,
  setLimit,
  total,
  onRefresh,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="sticky bottom-0 bg-gray-900 px-10 py-2 border-t border-gray-700 z-30 ">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white outline-none focus:border-blue-500"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          disabled={page === 1}
          onClick={() => setPage(1)}
          className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50 hover:bg-gray-700 text-gray-300"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50 hover:bg-gray-700 text-gray-300"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-gray-400">Page</span>

        <input
          type="number"
          className="w-12 bg-gray-800 border border-gray-600 rounded text-center text-white outline-none focus:border-blue-500"
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
          className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50 hover:bg-gray-700 text-gray-300"
        >
          <ChevronRight size={16} />
        </button>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
          className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50 hover:bg-gray-700 text-gray-300"
        >
          <ChevronsRight size={16} />
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-blue-400"
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
