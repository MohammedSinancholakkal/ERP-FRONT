// src/pages/accounts/JournalVoucher.jsx
import React, { useState, useEffect, useRef } from "react";
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
import Pagination from "../../components/Pagination";

const JournalVoucher = () => {
  // -----------------------------------
  // COLUMN VISIBILITY
  // -----------------------------------
  const defaultColumns = {
    id: true,
    vNo: true,
    vType: true,
    date: true,
    coaHeadName: true,
    coa: true,
    remark: true,
    debit: true,
    credit: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // -----------------------------------
  // MODAL
  // -----------------------------------
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    account: "",
    debit: "",
    credit: "",
    remark: "",
  });

  const accountOptions = ["Cash at Hand", "Cash at Bank"];

  // -----------------------------------
  // SAMPLE DATA
  // -----------------------------------
  const sampleJV = [
    {
      id: 1,
      vNo: "JV/2025/01",
      vType: "Journal Entry",
      date: "2025-01-01",
      coaHeadName: "Cash Head",
      coa: "1001",
      remark: "Initial cash entry",
      debit: 5000,
      credit: 0,
    },
  ];

  const [rows, setRows] = useState(sampleJV);

  // Search
  const [searchText, setSearchText] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // -----------------------------------
  // RENDER UI
  // -----------------------------------
  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
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
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((c) => tempVisibleColumns[c])
                    .filter((c) => c.includes(columnSearch))
                    .map((c) => (
                      <div
                        key={c}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                      >
                        <span>{c}</span>
                        <button
                          className="text-red-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [c]: false,
                            }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((c) => !tempVisibleColumns[c])
                    .filter((c) => c.includes(columnSearch))
                    .map((c) => (
                      <div
                        key={c}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                      >
                        <span>{c}</span>
                        <button
                          className="text-green-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [c]: true,
                            }))
                          }
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-5 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setTempVisibleColumns(defaultColumns)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD JOURNAL ENTRY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[750px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h2 className="text-lg font-semibold">Add Journal Voucher</h2>
              <X
                className="cursor-pointer"
                onClick={() => setModalOpen(false)}
              />
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* DATE */}
              <div className="col-span-2">
                <label className="text-sm">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* ACCOUNT */}
              <div className="col-span-2">
                <label className="text-sm">Account *</label>
                <select
                  value={form.account}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, account: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="">Select Account</option>
                  {accountOptions.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              {/* DEBIT + CREDIT SAME ROW */}
              <div>
                <label className="text-sm">Debit</label>
                <input
                  type="number"
                  value={form.debit}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, debit: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">Credit</label>
                <input
                  type="number"
                  value={form.credit}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, credit: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* REMARKS */}
              <div className="col-span-2">
                <label className="text-sm">Remarks *</label>
                <textarea
                  rows={3}
                  value={form.remark}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, remark: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
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

                <button
                  className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
                >
                  <Save size={16} /> Save
                </button>     
                 </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden"> 

        <h2 className="text-2xl font-semibold mb-4">Journal Voucher</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Voucher
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
            <table className="min-w-[1000px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.vNo && <th className="pb-2 border-b">VNo</th>}
                  {visibleColumns.vType && (
                    <th className="pb-2 border-b">VType</th>
                  )}
                  {visibleColumns.date && (
                    <th className="pb-2 border-b">Date</th>
                  )}
                  {visibleColumns.coaHeadName && (
                    <th className="pb-2 border-b">COA Head Name</th>
                  )}
                  {visibleColumns.coa && (
                    <th className="pb-2 border-b">COA</th>
                  )}
                  {visibleColumns.remark && (
                    <th className="pb-2 border-b">Remark</th>
                  )}
                  {visibleColumns.debit && (
                    <th className="pb-2 border-b">Debit</th>
                  )}
                  {visibleColumns.credit && (
                    <th className="pb-2 border-b">Credit</th>
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
                    {visibleColumns.vNo && <td className="py-2">{r.vNo}</td>}
                    {visibleColumns.vType && <td className="py-2">{r.vType}</td>}
                    {visibleColumns.date && <td className="py-2">{r.date}</td>}
                    {visibleColumns.coaHeadName && (
                      <td className="py-2">{r.coaHeadName}</td>
                    )}
                    {visibleColumns.coa && <td className="py-2">{r.coa}</td>}
                    {visibleColumns.remark && (
                      <td className="py-2">{r.remark}</td>
                    )}
                    {visibleColumns.debit && (
                      <td className="py-2">{r.debit}</td>
                    )}
                    {visibleColumns.credit && (
                      <td className="py-2">{r.credit}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

 {/* PAGINATION */}
           
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                // onRefresh={handleRefresh}
              />
      </div>
      </div>
      </PageLayout>

    </>
  );
};

export default JournalVoucher;



