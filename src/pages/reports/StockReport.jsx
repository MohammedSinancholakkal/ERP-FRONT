import React, { useState } from "react";
import {
  Search,
  RefreshCw,
  ArchiveRestore,
  List,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";

/* Searchable Dropdown */
const SearchableDropdown = ({ options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered =
    !query.trim()
      ? options
      : options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  const selected = options.find((o) => o.id == value)?.name || "";

  return (
    <div className="relative w-56">
      <input
        type="text"
        value={open ? query : selected || query}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-sm"
      />
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded max-h-56 overflow-auto z-50">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
              >
                {o.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

/* COLUMN PICKER */
const ColumnPickerModal = ({ open, onClose, visibleColumns, setVisibleColumns }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="w-[500px] bg-gray-900 rounded border border-gray-700 text-white">
        <div className="flex justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-lg">Column Picker</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-5 max-h-72 overflow-auto space-y-2">
          {Object.keys(visibleColumns).map((col) => (
            <div
              key={col}
              className="flex justify-between bg-gray-800 px-3 py-2 rounded border border-gray-700"
            >
              <span>{col.toUpperCase()}</span>
              <input
                type="checkbox"
                checked={visibleColumns[col]}
                onChange={() =>
                  setVisibleColumns((p) => ({ ...p, [col]: !p[col] }))
                }
              />
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded border border-gray-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const StockReport = () => {
  /* UI State */
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  /* Filters */
  const [filterCategory, setFilterCategory] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* Columns */
  const defaultColumns = {
    productName: true,
    categoryName: true,
    purchasePrice: true,
    salePrice: true,
    qtyIn: true,
    qtyOut: true,
    stock: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  /* Dropdown Dummy Data */
  const categories = [
    { id: 1, name: "Electronics" },
    { id: 2, name: "Stationery" }
  ];

  /* Table Dummy Data */
  const activeData = [
    {
      id: 1,
      productName: "Monitor",
      categoryName: "Electronics",
      purchasePrice: 5000,
      salePrice: 6500,
      qtyIn: 50,
      qtyOut: 20,
      stock: 30
    },
    {
      id: 2,
      productName: "Notebook",
      categoryName: "Stationery",
      purchasePrice: 20,
      salePrice: 35,
      qtyIn: 100,
      qtyOut: 40,
      stock: 60
    }
  ];

  const inactiveData = [
    {
      id: 3,
      productName: "Headphones",
      categoryName: "Electronics",
      purchasePrice: 1200,
      salePrice: 1800,
      qtyIn: 30,
      qtyOut: 25,
      stock: 5
    }
  ];

  return (
    <>
      {/* COLUMN PICKER */}
      <ColumnPickerModal
        open={columnModal}
        onClose={() => setColumnModal(false)}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />

      {/* PAGE */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-full overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Stock Report</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-3">

            {/* Search */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-56">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-transparent outline-none pl-2 text-sm w-full"
              />
            </div>

            {/* Refresh */}
            <button className="p-1.5 bg-gray-700 border border-gray-600 rounded">
              <RefreshCw size={16} className="text-blue-300" />
            </button>

            {/* Column Picker */}
            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
            >
              <List size={16} className="text-blue-300" />
            </button>

            {/* Inactive toggle */}
            <button
              onClick={() => setShowInactive((s) => !s)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-70">Inactive</span>
            </button>
          </div>

          {/* FILTERS */}
          <div className="flex items-center gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
            <SearchableDropdown
              options={categories}
              value={filterCategory}
              onChange={setFilterCategory}
              placeholder="Filter by Category"
            />

            <button className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">
              Apply
            </button>

            <button
              onClick={() => setFilterCategory("")}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              Clear
            </button>
          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[950px] text-center border-separate border-spacing-y-1 text-sm">

                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr>
                    {visibleColumns.productName && <th className="pb-1 border-b">Product Name</th>}
                    {visibleColumns.categoryName && <th className="pb-1 border-b">Category</th>}
                    {visibleColumns.purchasePrice && <th className="pb-1 border-b">Purchase Price</th>}
                    {visibleColumns.salePrice && <th className="pb-1 border-b">Sale Price</th>}
                    {visibleColumns.qtyIn && <th className="pb-1 border-b">Qty In</th>}
                    {visibleColumns.qtyOut && <th className="pb-1 border-b">Qty Out</th>}
                    {visibleColumns.stock && <th className="pb-1 border-b">Stock</th>}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE ROWS */}
                  {activeData.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.productName && <td className="px-2 py-2">{row.productName}</td>}
                      {visibleColumns.categoryName && <td className="px-2 py-2">{row.categoryName}</td>}
                      {visibleColumns.purchasePrice && <td className="px-2 py-2">{row.purchasePrice}</td>}
                      {visibleColumns.salePrice && <td className="px-2 py-2">{row.salePrice}</td>}
                      {visibleColumns.qtyIn && <td className="px-2 py-2">{row.qtyIn}</td>}
                      {visibleColumns.qtyOut && <td className="px-2 py-2">{row.qtyOut}</td>}
                      {visibleColumns.stock && <td className="px-2 py-2">{row.stock}</td>}
                    </tr>
                  ))}

                  {/* INACTIVE ROWS */}
                  {showInactive &&
                    inactiveData.map((row) => (
                      <tr
                        key={`inactive-${row.id}`}
                        className="bg-gray-900 opacity-40 hover:bg-gray-700 cursor-pointer line-through"
                      >
                        {visibleColumns.productName && <td className="px-2 py-2">{row.productName}</td>}
                        {visibleColumns.categoryName && <td className="px-2 py-2">{row.categoryName}</td>}
                        {visibleColumns.purchasePrice && <td className="px-2 py-2">{row.purchasePrice}</td>}
                        {visibleColumns.salePrice && <td className="px-2 py-2">{row.salePrice}</td>}
                        {visibleColumns.qtyIn && <td className="px-2 py-2">{row.qtyIn}</td>}
                        {visibleColumns.qtyOut && <td className="px-2 py-2">{row.qtyOut}</td>}
                        {visibleColumns.stock && <td className="px-2 py-2">{row.stock}</td>}
                      </tr>
                    ))}
                </tbody>

              </table>
            </div>
          </div>

          {/* PAGINATION */}
        <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">         
           <div className="flex items-center gap-3 text-sm">

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsLeft size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              />

              <span>/ 1</span>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronRight size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsRight size={16} />
              </button>

            </div>
          </div>

        </div>
      </div>
      </PageLayout>
      
    </>
  );
};

export default StockReport;



