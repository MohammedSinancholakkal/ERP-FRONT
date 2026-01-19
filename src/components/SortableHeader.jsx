import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

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
      className="px-4 py-1 border-b text-left cursor-pointer select-none transition border-white whitespace-nowrap"
      onClick={handleClick}
    >
      <div className="flex items-center justify-start gap-1">
        {/* title */}
        <span>{label}</span>

        {/* icon */}
        {direction === "asc" && <ChevronUp size={16} className="opacity-80" />}
        {direction === "desc" && <ChevronDown size={16} className="opacity-80" />}
      </div>
    </th>
  );
}
