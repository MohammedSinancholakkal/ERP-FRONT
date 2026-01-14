import SortableHeader from "./SortableHeader";
import { useTheme } from "../context/ThemeContext";
import { Search, Plus, RefreshCw, List, ArchiveRestore } from "lucide-react";
import { useState } from "react"; // ADDED
import toast from "react-hot-toast"; // ADDED

const MasterTable = ({
  columns,
  data,
  inactiveData,
  showInactive,
  sortConfig,
  onSort,
  onRowClick,
  search,
  onSearch,
  onCreate,
  createLabel = "Create New",
  onRefresh,
  onColumnSelector,
  onToggleInactive,
  permissionCreate = true,
  customActions,
  children,
}) => {
  const { theme } = useTheme();
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
          className={`px-4 py-1 text-center whitespace-nowrap ${
            theme === "emerald" && !isInactive ? "border-b border-emerald-200" : ""
          } ${col.className || ""}`}
        >
          {col.render ? col.render(item) : item[col.key]}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="w-full flex flex-col gap-4 flex-1 min-h-0">
      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-1">
        {/* Search */}
        <div
          className={`flex items-center px-2 py-1.5 rounded-md border w-full sm:w-60 ${
            theme === "emerald"
              ? "bg-gray-100 border-emerald-500"
              : "bg-gray-700 border-gray-600"
          }`}
        >
          <Search
            size={16}
            className={theme === "emerald" ? "text-gray-500" : "text-gray-300"}
          />
          <input
            type="text"
            placeholder="search..."
            value={search || ""}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className={`bg-transparent outline-none pl-2 w-full text-sm ${
              theme === "emerald"
                ? "text-gray-900 placeholder-gray-500"
                : "text-gray-200 placeholder-gray-500"
            }`}
          />
        </div>

        {/* Create Button */}
        {onCreate && permissionCreate && (
          <button
            onClick={onCreate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${
              theme === "emerald"
                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            }`}
          >
            <Plus size={16} /> {createLabel}
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-md border ${
              theme === "emerald"
                ? "bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
            }`}
          >
            <RefreshCw
              size={16}
              className={`${theme === "emerald" ? "text-white" : "text-blue-400"} ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        )}

        {/* Column Selector */}
        {onColumnSelector && (
          <button
            onClick={onColumnSelector}
            className={`p-1.5 rounded-md border ${
              theme === "emerald"
                ? "bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
            }`}
          >
            <List
              size={16}
              className={theme === "emerald" ? "text-white" : "text-blue-300"}
            />
          </button>
        )}

        {/* Inactive Toggle */}
        {onToggleInactive && (
          <button
            onClick={onToggleInactive}
            className={`p-1.5 rounded-md border flex items-center gap-1 ${
              theme === "emerald"
                ? "bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
            }`}
          >
            <ArchiveRestore
              size={16}
              className={theme === "emerald" ? "text-white" : "text-yellow-300"}
            />
            <span
              className={`text-xs opacity-80 ${
                theme === "emerald" ? "text-white" : ""
              }`}
            >
              Inactive
            </span>
          </button>
        )}

        {/* Custom Actions */}
        {customActions}
      </div>

      {children}

      <div className="w-full overflow-auto flex-1 rounded-lg scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <table 
          style={{ 
            minWidth: `${
              columns.length > 6 
                ? 900 + (columns.length - 6) * 200 
                : 500 + Math.max(0, columns.length - 2) * 100
            }px` 
          }}
          className="text-left border-separate border-spacing-y-1 text-sm w-auto"
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
                  <th key={col.key} className="px-1 py-1 font-semibold text-center uppercase tracking-wider whitespace-nowrap">
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
    </div>
  );
};

export default MasterTable;
