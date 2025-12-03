// src/pages/payroll/Payroll.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";

const Payroll = () => {
  const navigate = useNavigate();

  // -------------------------------
  // COLUMN VISIBILITY
  // -------------------------------
  const defaultColumns = {
    id: true,
    number: true,
    description: true,
    paymentDate: true,
    cashBank: true,
    currency: true,
    totalBasicSalary: true,
    totalIncome: true,
    totalDeduction: true,
    totalTakeHomePay: true,
    totalPaymentAmount: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // -------------------------------
  // SAMPLE DATA
  // -------------------------------
  const samplePayroll = [
    {
      id: 1,
      number: "payroll/2025/01",
      description: "Monthly Payroll - January",
      paymentDate: "2025-01-31",
      cashBank: "HBL - Main Branch",
      currency: "PKR",
      totalBasicSalary: 450000,
      totalIncome: 520000,
      totalDeduction: 35000,
      totalTakeHomePay: 485000,
      totalPaymentAmount: 485000,
    },
  ];

  const [rows, setRows] = useState(samplePayroll);

  // -------------------------------
  // Search
  // -------------------------------
  const [searchText, setSearchText] = useState("");

  // -------------------------------
  // Pagination
  // -------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b 
              from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">

            <div className="sticky top-0 bg-gray-900 px-5 py-3 border-b border-gray-700 flex justify-between">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) =>
                  setColumnSearch(e.target.value.toLowerCase())
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible Columns */}
              <div className="bg-gray-900/30 border border-gray-700 rounded p-4 max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((col) => tempVisibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col}</span>
                      <button
                        className="text-red-400"
                        onClick={() =>
                          setTempVisibleColumns((prev) => ({
                            ...prev,
                            [col]: false,
                          }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden Columns */}
              <div className="bg-gray-900/30 border border-gray-700 rounded p-4 max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((col) => !tempVisibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col}</span>
                      <button
                        className="text-green-400"
                        onClick={() =>
                          setTempVisibleColumns((prev) => ({
                            ...prev,
                            [col]: true,
                          }))
                        }
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                onClick={() => setTempVisibleColumns(defaultColumns)}
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                  onClick={() => setColumnModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden"> 

        <h2 className="text-2xl font-semibold mb-4">Payroll</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded 
              border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search payroll..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => navigate("/payroll/new")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 
                border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Payroll
          </button>

          <button className="p-2 bg-gray-700 border border-gray-600 rounded">
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <button
            onClick={() => {
              setTempVisibleColumns(visibleColumns);
              setColumnModalOpen(true);
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1900px] border-separate border-spacing-y-1 
                text-sm table-fixed">

              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.number && <th className="pb-2 border-b">Number</th>}
                  {visibleColumns.description && (
                    <th className="pb-2 border-b">Description</th>
                  )}
                  {visibleColumns.paymentDate && (
                    <th className="pb-2 border-b">Payment Date</th>
                  )}
                  {visibleColumns.cashBank && (
                    <th className="pb-2 border-b">Cash / Bank</th>
                  )}
                  {visibleColumns.currency && (
                    <th className="pb-2 border-b">Currency</th>
                  )}
                  {visibleColumns.totalBasicSalary && (
                    <th className="pb-2 border-b">Total Basic Salary</th>
                  )}
                  {visibleColumns.totalIncome && (
                    <th className="pb-2 border-b">Total Income</th>
                  )}
                  {visibleColumns.totalDeduction && (
                    <th className="pb-2 border-b">Total Deduction</th>
                  )}
                  {visibleColumns.totalTakeHomePay && (
                    <th className="pb-2 border-b">Take Home Pay</th>
                  )}
                  {visibleColumns.totalPaymentAmount && (
                    <th className="pb-2 border-b">Total Payment</th>
                  )}
                </tr>
              </thead>

              <tbody className="text-center">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="bg-gray-900 hover:bg-gray-700 cursor-default"
                  >
                    {visibleColumns.id && <td className="py-2">{r.id}</td>}
                    {visibleColumns.number && <td className="py-2">{r.number}</td>}
                    {visibleColumns.description && (
                      <td className="py-2">{r.description}</td>
                    )}
                    {visibleColumns.paymentDate && (
                      <td className="py-2">{r.paymentDate}</td>
                    )}
                    {visibleColumns.cashBank && (
                      <td className="py-2">{r.cashBank}</td>
                    )}
                    {visibleColumns.currency && (
                      <td className="py-2">{r.currency}</td>
                    )}
                    {visibleColumns.totalBasicSalary && (
                      <td className="py-2">{r.totalBasicSalary}</td>
                    )}
                    {visibleColumns.totalIncome && (
                      <td className="py-2">{r.totalIncome}</td>
                    )}
                    {visibleColumns.totalDeduction && (
                      <td className="py-2">{r.totalDeduction}</td>
                    )}
                    {visibleColumns.totalTakeHomePay && (
                      <td className="py-2">{r.totalTakeHomePay}</td>
                    )}
                    {visibleColumns.totalPaymentAmount && (
                      <td className="py-2">{r.totalPaymentAmount}</td>
                    )}
                  </tr>
                ))}
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
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map((n) => (
              <option value={n} key={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>

          <input
            type="number"
            value={page}
            onChange={(e) =>
              setPage(
                Math.min(totalPages, Math.max(1, Number(e.target.value)))
              )
            }
            className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
          />

          <span>/ {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
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

export default Payroll;
