// import React from "react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   RefreshCw,
// } from "lucide-react";

// const Pagination = ({
//   page,
//   totalPages,
//   totalRecords,
//   limit,
//   onLimitChange,
//   onPageChange,
//   onRefresh,
//   fixed = false, // optional: fixed footer style
// }) => {
//   const start = (page - 1) * limit + 1;
//   const end = Math.min(page * limit, totalRecords);

//   return (
// <div
//   className="
//     sticky bottom-0
//     bg-gray-900/80 backdrop-blur-md
//     border-t border-gray-700
//     px-4 py-2
//     z-20
//     flex flex-col sm:flex-row sm:items-center sm:justify-between
//     gap-3
//     text-gray-200 text-xs sm:text-sm
//   "
// >

//   {/* LEFT CONTROLS */}
//   <div className="flex flex-wrap items-center gap-2 sm:gap-3">

//     <select
//       value={limit}
//       onChange={(e) => onLimitChange(Number(e.target.value))}
//       className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
//     >
//       {[10, 25, 50, 100].map((opt) => (
//         <option key={opt} value={opt}>{opt}</option>
//       ))}
//     </select>

//     <button
//       onClick={() => onPageChange(1)}
//       disabled={page === 1}
//       className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
//     >
//       <ChevronsLeft size={14} />
//     </button>

//     <button
//       onClick={() => onPageChange(page - 1)}
//       disabled={page === 1}
//       className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
//     >
//       <ChevronLeft size={14} />
//     </button>

//     <span className="hidden sm:block">Page</span>

//     <input
//       type="number"
//       value={page}
//       onChange={(e) => onPageChange(Number(e.target.value))}
//       className="w-12 bg-gray-800 border border-gray-600 rounded px-1 text-center"
//     />

//     <span className="hidden sm:block">/ {totalPages}</span>

//     <button
//       onClick={() => onPageChange(page + 1)}
//       disabled={page === totalPages}
//       className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
//     >
//       <ChevronRight size={14} />
//     </button>

//     <button
//       onClick={() => onPageChange(totalPages)}
//       disabled={page === totalPages}
//       className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
//     >
//       <ChevronsRight size={14} />
//     </button>

//     <button
//       onClick={onRefresh}
//       className="p-1 bg-gray-800 rounded border border-gray-700"
//     >
//       <RefreshCw size={14} className="text-blue-400" />
//     </button>
//   </div>

//   {/* RIGHT TEXT */}
//   <div className="text-center sm:text-right">
//     Showing <strong>{start}</strong> to <strong>{end}</strong> of{" "}
//     <strong>{totalRecords}</strong> records
//   </div>
// </div>

//   );
// };

// export default Pagination;
