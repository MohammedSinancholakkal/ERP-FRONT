// src/pages/accounts/ChartOfAccounts.jsx
import React, { useState, useEffect } from "react";
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

const ChartOfAccounts = () => {
  // -----------------------------------
  // COLUMN VISIBILITY
  // -----------------------------------
  const defaultColumns = {
    headCode: true,
    headName: true,
    openingBalance: true,
    balance: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // -----------------------------------
  // MODAL (Add/Edit)
  // -----------------------------------
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    headName: "",
    headCode: "",
    parentHead: "",
    parentHeadName: "",
    headLevel: "",
    headType: "",
    isTransaction: false,
    isGI: false,
  });

  // -----------------------------------
  // SAMPLE DATA
  // -----------------------------------
  const sampleData = [
    {
      headCode: "1001",
      headName: "Cash at Hand",
      openingBalance: 5000,
      balance: 5000,
    },
  ];

  const [rows, setRows] = useState(sampleData);

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
  // UI
  // -----------------------------------
  return (
    <>
      {/* COLUMN PICKER */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b 
                          from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            
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
              {/* Visible */}
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
                            setTempVisibleColumns((p) => ({ ...p, [c]: false }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Hidden */}
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
                            setTempVisibleColumns((p) => ({ ...p, [c]: true }))
                          }
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
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

      {/* ADD COA MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[750px] bg-gradient-to-b from-gray-900 to-gray-800 
                          border border-gray-700 rounded-lg text-white p-5 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h2 className="text-lg font-semibold">Add Head</h2>
              <X className="cursor-pointer" onClick={() => setModalOpen(false)} />
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4 mt-4">

              <div className="col-span-2">
                <label className="text-sm">Head Name *</label>
                <input
                  value={form.headName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, headName: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm">Head Code *</label>
                <input
                  value={form.headCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, headCode: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">Parent Head</label>
                <input
                  value={form.parentHead}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, parentHead: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">Parent Head Name</label>
                <input
                  value={form.parentHeadName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, parentHeadName: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">Head Level</label>
                <input
                  value={form.headLevel}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, headLevel: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">Head Type</label>
                <input
                  value={form.headType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, headType: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.isTransaction}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isTransaction: e.target.checked }))
                  }
                />
                <label className="text-sm">Is Transaction</label>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.isGI}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isGI: e.target.checked }))
                  }
                />
                <label className="text-sm">Is GI</label>
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

              <button className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300">
                <Save size={16} /> Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden"> 

        <h2 className="text-2xl font-semibold mb-4">Chart of Accounts</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded 
                          border border-gray-600 w-full sm:w-60">
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
            className="flex items-center gap-2 px-3 py-1.5 
                       bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Head
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
            <table className="min-w-[700px] border-separate border-spacing-y-1 
                               text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-center">
                  {visibleColumns.headCode && (
                    <th className="pb-2 border-b">Head Code</th>
                  )}
                  {visibleColumns.headName && (
                    <th className="pb-2 border-b">Head Name</th>
                  )}
                  {visibleColumns.openingBalance && (
                    <th className="pb-2 border-b">Opening Balance</th>
                  )}
                  {visibleColumns.balance && (
                    <th className="pb-2 border-b">Balance</th>
                  )}
                </tr>
              </thead>

              <tbody className="text-center">
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="bg-gray-900 hover:bg-gray-700 cursor-default"
                  >
                    {visibleColumns.headCode && (
                      <td className="py-2">{r.headCode}</td>
                    )}
                    {visibleColumns.headName && (
                      <td className="py-2">{r.headName}</td>
                    )}
                    {visibleColumns.openingBalance && (
                      <td className="py-2">{r.openingBalance}</td>
                    )}
                    {visibleColumns.balance && (
                      <td className="py-2">{r.balance}</td>
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

export default ChartOfAccounts;
