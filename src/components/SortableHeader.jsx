import React from "react";

export default function SortableHeader({ label, sortOrder, onClick }) {
  return (
    <th
      className={`pb-1 border-b text-center cursor-pointer select-none transition 
        ${sortOrder ? "border-white" : "border-white"}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-1">

        {/* icon on left */}
        {sortOrder === "asc" && <span>▲</span>}
        {!sortOrder && <span className="opacity-40">⬍</span>}

        {/* title */}
        <span>{label}</span>
      </div>
    </th>
  );
}
