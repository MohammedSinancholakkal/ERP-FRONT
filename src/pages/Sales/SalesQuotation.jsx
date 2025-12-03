import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  FileSpreadsheet,
  FileText,
  Eye
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";

/* Searchable Dropdown */
const SearchableDropdown = ({ options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered =
    !query.trim()
      ? options
      : options.filter((o) =>
          o.name.toLowerCase().includes(query.toLowerCase())
        );

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
        <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded max-h-56 overflow-auto mt-1 z-50">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
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

/* Export Buttons Icons */
const ExportButtons = () => (
  <div className="flex items-center gap-2">
    <button
      className="p-1.5 bg-green-700/10 border border-green-700 rounded hover:bg-green-700/20"
      title="Export to Excel"
    >
      <FileSpreadsheet size={18} className="text-green-300" />
    </button>

    <button
      className="p-1.5 bg-red-700/10 border border-red-700 rounded hover:bg-red-700/20"
      title="Export to PDF"
    >
      <FileText size={18} className="text-red-300" />
    </button>
  </div>
);

const SalesQuotation = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterExpiry, setFilterExpiry] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const customers = [
    { id: 1, name: "Customer A" },
    { id: 2, name: "Customer B" }
  ];

  const defaultColumns = {
    id: true,
    customerName: true,
    date: true,
    discount: true,
    totalDiscount: true,
    vat: true,
    totalTax: true,
    shippingCost: true,
    grandTotal: true,
    netTotal: true,
    details: true,
    expiryDate: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const quotationData = [
    {
      id: 1,
      customerName: "Customer A",
      date: "2025-02-12",
      discount: 10,
      totalDiscount: 50,
      vat: 18,
      totalTax: 120,
      shippingCost: 60,
      grandTotal: 2000,
      netTotal: 1880,
      details: "Quotation details here",
      expiryDate: "2025-02-20"
    }
  ];

  return (
    <>
      {/* ===========================
          MAIN PAGE
      ============================ */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Sales Quotation</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-52">
              <Search size={16} />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-transparent outline-none pl-2 text-sm w-full"
              />
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600"
            >
              <Plus size={16} /> New Quotation
            </button>

            <button className="p-1.5 bg-gray-700 border border-gray-600 rounded">
              <RefreshCw size={16} className="text-blue-300" />
            </button>

            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
            >
              <List size={16} className="text-blue-300" />
            </button>

            <ExportButtons />
          </div>

          {/* FILTER BAR */}
          <div className="flex items-center gap-3 bg-gray-900 p-3 rounded border border-gray-700 mb-4">
            <SearchableDropdown
              options={customers}
              value={filterCustomer}
              onChange={setFilterCustomer}
              placeholder="Customer"
            />

            <input
              type="datetime-local"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />

            <input
              type="datetime-local"
              value={filterExpiry}
              onChange={(e) => setFilterExpiry(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />

            <button className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">
              Apply
            </button>
            <button
              onClick={() => {
                setFilterCustomer("");
                setFilterDate("");
                setFilterExpiry("");
              }}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              Clear
            </button>
          </div>

          {/* TABLE SCROLL */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1800px] text-center border-separate border-spacing-y-1 text-sm w-full">
                <thead className="sticky top-0 bg-gray-900">
                  <tr>
                    {visibleColumns.id && <th className="pb-1 border-b">ID</th>}
                    {visibleColumns.customerName && (
                      <th className="pb-1 border-b">Customer</th>
                    )}
                    {visibleColumns.date && (
                      <th className="pb-1 border-b">Date</th>
                    )}
                    {visibleColumns.discount && (
                      <th className="pb-1 border-b">Disc</th>
                    )}
                    {visibleColumns.totalDiscount && (
                      <th className="pb-1 border-b">Total Disc</th>
                    )}
                    {visibleColumns.vat && <th className="pb-1 border-b">VAT</th>}
                    {visibleColumns.totalTax && (
                      <th className="pb-1 border-b">Total Tax</th>
                    )}
                    {visibleColumns.shippingCost && (
                      <th className="pb-1 border-b">Shipping</th>
                    )}
                    {visibleColumns.grandTotal && (
                      <th className="pb-1 border-b">Grand Total</th>
                    )}
                    {visibleColumns.netTotal && (
                      <th className="pb-1 border-b">Net Total</th>
                    )}
                    {visibleColumns.details && (
                      <th className="pb-1 border-b">Details</th>
                    )}
                    {visibleColumns.expiryDate && (
                      <th className="pb-1 border-b">Expiry</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {quotationData.map((q) => (
                    <tr
                      key={q.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.id && <td className="px-2 py-2">{q.id}</td>}

                      {visibleColumns.customerName && (
                        <td className="px-2 py-2 flex items-center justify-center gap-2">
                          {/* PDF icon */}
                          <button
                            className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700"
                            title="Download PDF"
                          >
                            <FileText size={14} className="text-red-300" />
                          </button>

                          {/* Preview */}
                          <button
                            className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700"
                            title="Preview"
                          >
                            <Eye size={14} className="text-blue-300" />
                          </button>

                          {q.customerName}
                        </td>
                      )}

                      {visibleColumns.date && (
                        <td className="px-2 py-2">{q.date}</td>
                      )}

                      {visibleColumns.discount && (
                        <td className="px-2 py-2">{q.discount}</td>
                      )}

                      {visibleColumns.totalDiscount && (
                        <td className="px-2 py-2">{q.totalDiscount}</td>
                      )}

                      {visibleColumns.vat && (
                        <td className="px-2 py-2">{q.vat}</td>
                      )}

                      {visibleColumns.totalTax && (
                        <td className="px-2 py-2">{q.totalTax}</td>
                      )}

                      {visibleColumns.shippingCost && (
                        <td className="px-2 py-2">{q.shippingCost}</td>
                      )}

                      {visibleColumns.grandTotal && (
                        <td className="px-2 py-2">{q.grandTotal}</td>
                      )}

                      {visibleColumns.netTotal && (
                        <td className="px-2 py-2">{q.netTotal}</td>
                      )}

                      {visibleColumns.details && (
                        <td className="px-2 py-2">{q.details}</td>
                      )}

                      {visibleColumns.expiryDate && (
                        <td className="px-2 py-2">{q.expiryDate}</td>
                      )}
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
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
                onChange={(e) => setPage(Number(e.target.value))}
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

export default SalesQuotation;
