// src/pages/inventory/GoodsIssue.jsx
import React, { useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  X,
  Save,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Star,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";

const GoodsIssue = () => {
  /* --------------------------- Column Picker --------------------------- */
  const defaultColumns = {
    id: true,
    customer: true,
    saleInvoice: true,
    date: true,
    time: true,
    totalQuantity: true,
    employee: true,
    remarks: true,
    reference: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  /* ------------------------------- Filters ------------------------------- */
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterInvoice, setFilterInvoice] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const dropdownOptions = ["A", "B", "C", "D"]; // demo

  /* ------------------------------- Data ------------------------------- */
  const sampleData = [
    {
      id: 1,
      customer: "Alpha Traders",
      saleInvoice: "SI-1001",
      date: "2024-01-11",
      time: "10:30 AM",
      totalQuantity: 25,
      employee: "Muzammil",
      remarks: "Delivered completely.",
      reference: "REF-9001",
      isActive: true,
    },
  ];

  const [rows, setRows] = useState(sampleData);
  const [showInactive, setShowInactive] = useState(false);

  const filteredRows = rows.filter((r) => {
    return (
      r.customer.toLowerCase().includes(filterCustomer.toLowerCase()) &&
      r.saleInvoice.toLowerCase().includes(filterInvoice.toLowerCase()) &&
      r.date.includes(filterDate) &&
      r.time.toLowerCase().includes(filterTime.toLowerCase()) &&
      r.employee.toLowerCase().includes(filterEmployee.toLowerCase())
    );
  });

  /* ------------------------------ Add Modal ------------------------------ */
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [newIssue, setNewIssue] = useState({
    date: today,
    time: currentTime,
    customer: "",
    saleInvoice: "",
    totalQuantity: "",
    employee: "",
    remarks: "",
    reference: "",
  });

  const handleAdd = () => {
    if (
      !newIssue.date ||
      !newIssue.time ||
      !newIssue.customer ||
      !newIssue.saleInvoice ||
      !newIssue.totalQuantity ||
      !newIssue.employee
    ) {
      alert("❗ All required fields must be filled.");
      return;
    }

    const entry = {
      id: rows.length + 1,
      ...newIssue,
      isActive: true,
    };

    setRows([...rows, entry]);
    setModalOpen(false);

    setNewIssue({
      date: today,
      time: currentTime,
      customer: "",
      saleInvoice: "",
      totalQuantity: "",
      employee: "",
      remarks: "",
      reference: "",
    });
  };

  /* ------------------------------ Pagination ------------------------------ */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  /* ------------------------------ Render ------------------------------ */
  return (
    <>
      {/* --------------------------- ADD MODAL --------------------------- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-lg">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Goods Issue</h2>
              <button
                className="text-gray-300 hover:text-white"
                onClick={() => setModalOpen(false)}
              >
                <X />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Date */}
              <div>
                <label className="text-sm">Date *</label>
                <input
                  type="date"
                  value={newIssue.date}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, date: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-sm">Time *</label>
                <input
                  type="time"
                  value={newIssue.time}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, time: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Customer Dropdown */}
              <div>
                <label className="text-sm">Customer *</label>
                <input
                  value={newIssue.customer}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, customer: e.target.value })
                  }
                  placeholder="Search customer..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Sale Invoice */}
              <div>
                <label className="text-sm">Sales Invoice *</label>
                <input
                  value={newIssue.saleInvoice}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, saleInvoice: e.target.value })
                  }
                  placeholder="SI-0001"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Total Quantity */}
              <div>
                <label className="text-sm">Total Quantity *</label>
                <input
                  type="number"
                  value={newIssue.totalQuantity}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, totalQuantity: e.target.value })
                  }
                  placeholder="0"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Employee */}
              <div>
                <label className="text-sm">Employee *</label>
                <input
                  value={newIssue.employee}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, employee: e.target.value })
                  }
                  placeholder="Search employee..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="text-sm">Remarks</label>
                <textarea
                  value={newIssue.remarks}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, remarks: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="text-sm">Reference</label>
                <input
                  value={newIssue.reference}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, reference: e.target.value })
                  }
                  placeholder="REF-0001"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-gray-700">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------- MAIN PAGE --------------------------- */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Goods Issue</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search */}
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {/* New Issue */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Goods Issue
          </button>

          {/* Refresh */}
          <button className="p-2 bg-gray-700 border border-gray-600 rounded">
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          {/* Column Picker */}
          <button
            onClick={() => {
              setTempVisibleColumns(visibleColumns);
              setColumnModalOpen(true);
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>

          {/* Inactive */}
          <button
            onClick={() => setShowInactive((s) => !s)}
            className="flex items-center gap-2 p-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
          {/* Customer */}
          <input
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            placeholder="Customer"
            className="w-40 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          />

          {/* Sales Invoice */}
          <input
            value={filterInvoice}
            onChange={(e) => setFilterInvoice(e.target.value)}
            placeholder="Sales Invoice"
            className="w-40 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          />

          {/* Date */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-40 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          />

          {/* Time */}
          <input
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            placeholder="Time"
            className="w-40 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          />

          {/* Employee */}
          <input
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            placeholder="Employee"
            className="w-40 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          />

          <button
            onClick={() => {
              setFilterCustomer("");
              setFilterInvoice("");
              setFilterDate("");
              setFilterTime("");
              setFilterEmployee("");
            }}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
          >
            Clear Filters
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1500px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.customer && (
                    <th className="pb-2 border-b">Customer</th>
                  )}
                  {visibleColumns.saleInvoice && (
                    <th className="pb-2 border-b">Sales Invoice</th>
                  )}
                  {visibleColumns.date && <th className="pb-2 border-b">Date</th>}
                  {visibleColumns.time && <th className="pb-2 border-b">Time</th>}
                  {visibleColumns.totalQuantity && (
                    <th className="pb-2 border-b">Total Qty</th>
                  )}
                  {visibleColumns.employee && (
                    <th className="pb-2 border-b">Employee</th>
                  )}
                  {visibleColumns.remarks && (
                    <th className="pb-2 border-b">Remarks</th>
                  )}
                  {visibleColumns.reference && (
                    <th className="pb-2 border-b">Reference</th>
                  )}
                </tr>
              </thead>

              <tbody className="text-center">
                {filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    className={`bg-gray-900 hover:bg-gray-700 ${
                      !r.isActive ? "opacity-40 line-through" : ""
                    }`}
                  >
                    {visibleColumns.id && (
                      <td className="px-2 py-3 text-center">{r.id}</td>
                    )}
                    {visibleColumns.customer && (
                      <td className="px-2 py-3 text-center">{r.customer}</td>
                    )}
                    {visibleColumns.saleInvoice && (
                      <td className="px-2 py-3 text-center">{r.saleInvoice}</td>
                    )}
                    {visibleColumns.date && (
                      <td className="px-2 py-3 text-center">{r.date}</td>
                    )}
                    {visibleColumns.time && (
                      <td className="px-2 py-3 text-center">{r.time}</td>
                    )}
                    {visibleColumns.totalQuantity && (
                      <td className="px-2 py-3 text-center">{r.totalQuantity}</td>
                    )}
                    {visibleColumns.employee && (
                      <td className="px-2 py-3 text-center">{r.employee}</td>
                    )}
                    {visibleColumns.remarks && (
                      <td className="px-2 py-3 text-center">{r.remarks}</td>
                    )}
                    {visibleColumns.reference && (
                      <td className="px-2 py-3 text-center">{r.reference}</td>
                    )}
                  </tr>
                ))}

                {/* No results */}
                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        Object.values(visibleColumns).filter(Boolean).length
                      }
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>

          <input
            type="number"
            value={page}
            onChange={(e) =>
              setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))
            }
            className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
          />

          <span>/ {totalPages}</span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronsRight size={16} />
          </button>

          <span>
            Showing <b>{start}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
          </span>
        </div>
      </div>
    </div>
    </PageLayout>
    </>
  );
};

export default GoodsIssue;
