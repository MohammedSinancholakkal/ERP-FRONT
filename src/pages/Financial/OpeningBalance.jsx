// src/pages/accounts/OpeningBalance.jsx
import React, { useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Save,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";

const OpeningBalance = () => {
  // -------------------------------
  // COLUMN VISIBILITY
  // -------------------------------
  const defaultColumns = {
    id: true,
    vdate: true,
    accountHead: true,
    balanceType: true,
    amount: true,
    remark: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // -------------------------------
  // MODAL
  // -------------------------------
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    vdate: new Date().toISOString().split("T")[0],
    accountHead: "",
    balanceType: "",
    amount: "",
    remark: "",
  });

  const accountHeadOptions = [
    "Asset",
    "Equity",
    "Income",
    "Expense",
    "Liabilities",
    "Non Current Asset",
  ];

  // -------------------------------
  // SAMPLE DATA
  // -------------------------------
  const [rows] = useState([
    {
      id: 1,
      vdate: "2025-01-01",
      accountHead: "Asset",
      balanceType: "Debit",
      amount: 5000,
      remark: "Opening cash",
    },
  ]);

  // -------------------------------
  // Pagination
  // -------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const totalRecords = rows.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto 
                bg-gradient-to-b from-gray-900 to-gray-800 
                border border-gray-700 rounded-lg text-white">
            <div className="sticky top-0 bg-gray-900 px-5 py-3 border-b border-gray-700 
                    flex justify-between">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <X onClick={() => setColumnModalOpen(false)} className="cursor-pointer" />
            </div>

            <div className="px-5 py-3">
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible */}
              <div className="border border-gray-700 bg-gray-900/30 rounded p-3 
                        max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                {Object.keys(tempVisibleColumns)
                  .filter((c) => tempVisibleColumns[c])
                  .filter((c) => c.includes(columnSearch))
                  .map((c) => (
                    <div
                      key={c}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between my-1"
                    >
                      <span>{c}</span>
                      <button
                        className="text-red-400"
                        onClick={() =>
                          setTempVisibleColumns((p) => ({ ...p, [c]: false }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden */}
              <div className="border border-gray-700 bg-gray-900/30 rounded p-3 
                        max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                {Object.keys(tempVisibleColumns)
                  .filter((c) => !tempVisibleColumns[c])
                  .filter((c) => c.includes(columnSearch))
                  .map((c) => (
                    <div
                      key={c}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between my-1"
                    >
                      <span>{c}</span>
                      <button
                        className="text-green-400"
                        onClick={() =>
                          setTempVisibleColumns((p) => ({ ...p, [c]: true }))
                        }
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 
                    flex justify-between">
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

      {/* ADD OPENING BALANCE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[750px] bg-gradient-to-b 
                from-gray-900 to-gray-800 border border-gray-700 
                rounded-lg text-white p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h2 className="text-lg font-semibold">Add Opening Balance</h2>
              <X className="cursor-pointer" onClick={() => setModalOpen(false)} />
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4 mt-4">

              {/* DATE */}
              <div className="col-span-2">
                <label className="text-sm">Date *</label>
                <input
                  type="date"
                  value={form.vdate}
                  onChange={(e) => setForm((p) => ({ ...p, vdate: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* ACCOUNT HEAD */}
              <div className="col-span-2">
                <label className="text-sm">Account Head *</label>
                <select
                  value={form.accountHead}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, accountHead: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="">Select</option>
                  {accountHeadOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* BALANCE TYPE */}
              <div>
                <label className="text-sm">Balance Type *</label>
                <select
                  value={form.balanceType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, balanceType: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              {/* AMOUNT */}
              <div>
                <label className="text-sm">Amount *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* REMARK */}
              <div className="col-span-2">
                <label className="text-sm">Remark *</label>
                <textarea
                  rows={3}
                  value={form.remark}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, remark: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                ></textarea>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-5 border-t border-gray-700 pt-3">
              <button
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>

              <button className="flex items-center gap-2 
                        bg-gray-800 px-4 py-2 border border-gray-600 
                        rounded text-blue-300">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden"> 
        <h2 className="text-2xl font-semibold mb-4">Opening Balance</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded 
                    border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 
                    border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> Add Opening Balance
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
        <div className="flex-grow overflow-auto min-h-0">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1000px] border-separate border-spacing-y-1 
                        text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-center">

                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.vdate && <th className="pb-2 border-b">Date</th>}
                  {visibleColumns.accountHead && (
                    <th className="pb-2 border-b">Account Head</th>
                  )}
                  {visibleColumns.balanceType && (
                    <th className="pb-2 border-b">Balance Type</th>
                  )}
                  {visibleColumns.amount && (
                    <th className="pb-2 border-b">Amount</th>
                  )}
                  {visibleColumns.remark && (
                    <th className="pb-2 border-b">Remark</th>
                  )}
                </tr>
              </thead>

              <tbody className="text-center">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                  >
                    {visibleColumns.id && <td className="py-2">{r.id}</td>}
                    {visibleColumns.vdate && <td className="py-2">{r.vdate}</td>}
                    {visibleColumns.accountHead && (
                      <td className="py-2">{r.accountHead}</td>
                    )}
                    {visibleColumns.balanceType && (
                      <td className="py-2">{r.balanceType}</td>
                    )}
                    {visibleColumns.amount && (
                      <td className="py-2">{r.amount}</td>
                    )}
                    {visibleColumns.remark && (
                      <td className="py-2">{r.remark}</td>
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
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
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
              setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))
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

export default OpeningBalance;
