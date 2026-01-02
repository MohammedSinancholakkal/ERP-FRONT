// src/pages/accounts/ContraVoucher.jsx
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
  ArchiveRestore,
  Save,
  X,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

const ContraVoucher = () => {
  // -----------------------------------
  // COLUMN VISIBILITY
  // -----------------------------------
  const defaultColumns = {
    id: true,
    vno: true,
    vtype: true,
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
  // DATA
  // -----------------------------------
  const sampleRows = [
    {
      id: 1,
      vno: "CONTRA/2025/01",
      vtype: "Contra",
      date: "2025-01-01",
      coaHeadName: "Cash Accounts",
      coa: "Cash at Hand",
      remark: "Adjustment",
      debit: 500,
      credit: 0,
    },
  ];

  const [rows, setRows] = useState(sampleRows);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const searchText = "";

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // -----------------------------------
  // MODAL
  // -----------------------------------
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    account: "",
    debit: "",
    credit: "",
    remarks: "",
  });

  const accountOptions = ["Cash at Hand", "Cash at Bank"];

  // -----------------------------------
  // RENDER
  // -----------------------------------
  return (
    <>
      {/* ========================= MODAL ========================= */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[750px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white p-5 max-h-[85vh] overflow-y-auto shadow-xl">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h2 className="text-lg font-semibold">New Contra Voucher</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <div className="mt-4 space-y-4">

              {/* DATE */}
              <div>
                <label className="text-sm">Date <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mt-1"
                />
              </div>

              {/* ACCOUNT */}
              <div>
                <label className="text-sm">
                  Account <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mt-1"
                >
                  <option value="">Select Account</option>
                  {accountOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* DEBIT + CREDIT IN SAME ROW */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Debit</label>
                  <input
                    type="number"
                    value={form.debit}
                    onChange={(e) =>
                      setForm({ ...form, debit: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm">Credit</label>
                  <input
                    type="number"
                    value={form.credit}
                    onChange={(e) =>
                      setForm({ ...form, credit: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mt-1"
                  />
                </div>
              </div>

              {/* REMARKS */}
              <div>
                <label className="text-sm">
                  Remarks <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mt-1 h-24"
                ></textarea>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end mt-6">
              {hasPermission(PERMISSIONS.FINANCIAL.CREATE) && (
              <button
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================= MAIN PAGE ========================= */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden"> 

        <h2 className="text-2xl font-semibold mb-4">Contra Voucher</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search Box */}
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {/* NEW BUTTON */}
          {hasPermission(PERMISSIONS.FINANCIAL.CREATE) && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New
          </button>
          )}

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
          <table className="min-w-[1000px] border-separate border-spacing-y-1 text-sm table-fixed">
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr className="text-center">
                {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                {visibleColumns.vno && (
                  <th className="pb-2 border-b">V No</th>
                )}
                {visibleColumns.vtype && (
                  <th className="pb-2 border-b">V Type</th>
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
                <tr key={r.id} className="bg-gray-900 hover:bg-gray-700">
                  {visibleColumns.id && <td className="py-2">{r.id}</td>}
                  {visibleColumns.vno && <td>{r.vno}</td>}
                  {visibleColumns.vtype && <td>{r.vtype}</td>}
                  {visibleColumns.date && <td>{r.date}</td>}
                  {visibleColumns.coaHeadName && (
                    <td>{r.coaHeadName}</td>
                  )}
                  {visibleColumns.coa && <td>{r.coa}</td>}
                  {visibleColumns.remark && <td>{r.remark}</td>}
                  {visibleColumns.debit && <td>{r.debit}</td>}
                  {visibleColumns.credit && <td>{r.credit}</td>}
                </tr>
              ))}
            </tbody>
          </table>
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

export default ContraVoucher;



