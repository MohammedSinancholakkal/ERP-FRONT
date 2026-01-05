import React from "react";
import SortableHeader from "./SortableHeader";
import { useTheme } from "../context/ThemeContext";

const MasterTable = ({
  columns,
  data,
  inactiveData,
  showInactive,
  sortConfig,
  onSort,
  onRowClick,
}) => {
  const { theme } = useTheme();

  const renderRow = (item, isInactive = false) => (
    <tr
      key={isInactive ? `inactive-${item.id}` : item.id}
      className={`
        cursor-pointer rounded shadow-sm border-b transition-colors
        ${
          isInactive
            ? `opacity-40 line-through ${
                theme === "emerald"
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-500"
                  : "bg-gray-900 hover:bg-gray-700 text-white"
              }`
            : `${
                theme === "emerald"
                  ? "bg-gradient-to-r from-emerald-100 to-white hover:from-emerald-200 hover:to-white text-gray-900 border-emerald-300"
                  : "bg-gray-900 hover:bg-gray-700 text-white"
              }`
        }
      `}
      onClick={() => onRowClick && onRowClick(item, isInactive)}
    >
      {columns.map((col) => (
        <td
          key={col.key}
          className={`px-2 py-1 text-center ${
            theme === "emerald" && !isInactive ? "border-b border-emerald-200" : ""
          } ${col.className || ""}`}
        >
          {col.render ? col.render(item) : item[col.key]}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="w-full overflow-auto h-[65vh] rounded-lg scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <table 
          className="text-left border-separate border-spacing-y-1 text-sm"
          style={{ minWidth: `${300 + columns.length * 100}px` }}
        >
          <thead
            className={`sticky top-0 z-10 ${
              theme === "emerald" ? "bg-emerald-700 text-white" : "bg-gray-900 text-white"
            }`}
          >
            <tr>
              {columns.map((col) =>
                col.sortable ? (
                  <SortableHeader
                    key={col.key}
                    label={col.label}
                    sortOrder={sortConfig?.key === col.key ? sortConfig.direction : null}
                    onClick={() => onSort && onSort(col.key)}
                  />
                ) : (
                  <th key={col.key} className="px-4 py-2 font-semibold text-center uppercase tracking-wider">
                    {col.label}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {!data?.length && !showInactive && (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-gray-400">
                  No records found
                </td>
              </tr>
            )}
            
            {data?.map((item) => renderRow(item, false))}
            
            {showInactive && inactiveData?.map((item) => renderRow(item, true))}
          </tbody>
        </table>
    </div>
  );
};

export default MasterTable;
