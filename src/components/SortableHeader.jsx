import React from "react";

export default function SortableHeader({ label, sortKey, currentSort, onSort, sortOrder, onClick }) {
  let direction = null;
  let handleClick = null;

  // New API: uses currentSort object and onSort function
  if (currentSort && onSort && sortKey) {
    direction = currentSort.key === sortKey ? currentSort.direction : null;
    handleClick = () => onSort(sortKey);
  } 
  // Old API: uses sortOrder string/null and onClick function
  else if (onClick) {
    direction = sortOrder;
    handleClick = onClick;
  }

  return (
    <th
      className="pb-1 border-b text-center cursor-pointer select-none transition border-white"
      onClick={handleClick}
    >
      <div className="flex items-center justify-center gap-1">
        {/* icon */}
        {direction === "asc" && <span>▲</span>}
        {direction === "desc" && <span>▼</span>}
        {!direction && <span className="opacity-40">⬍</span>}

        {/* title */}
        <span>{label}</span>
      </div>
    </th>
  );
}
