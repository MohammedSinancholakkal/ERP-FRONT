// src/pages/accounts/CashAdjustment.jsx
import React, { useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  X,
  Save,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

const CashAdjustment = () => {
  /* --------------------------- Column Picker --------------------------- */
  const defaultColumns = {
    id: true,
    voucherName: true,
    voucherDate: true,
    adjustmentType: true,
    coaHeadName: true,
    coa: true,
    amount: true,
    remarks: true,
    debit: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  /* ------------------------------- Data ------------------------------- */
  const sampleData = [
    {
      id: 1,
      voucherName: "CA-001",
      voucherDate: "2024-01-10",
      adjustmentType: "Debit",
      coaHeadName: "Cash Adjustment",
      coa: "5001",
      amount: 2000,
      remarks: "Cash shortage",
      debit: 2000,
    },
  ];

  const [rows, setRows] = useState(sampleData);
  const [inactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  /* ---------------------------- Pagination ---------------------------- */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  /* ------------------------------ Modal ------------------------------ */
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const nextCode = `CA-${String(rows.length + 1).padStart(3, "0")}`;

  const [newAdj, setNewAdj] = useState({
    date: today,
    code: nextCode,
    type: "",
    coaHeadName: "",
    coa: "",
    amount: "",
    remarks: "",
  });

  const handleAdd = () => {
    if (
      !newAdj.date ||
      !newAdj.code ||
      !newAdj.type ||
      !newAdj.coaHeadName ||
      !newAdj.coa ||
      !newAdj.amount ||
      !newAdj.remarks
    ) {
      alert("❗ All fields are required.");
      return;
    }

    const entry = {
      id: rows.length + 1,
      voucherName: newAdj.code,
      voucherDate: newAdj.date,
      adjustmentType: newAdj.type,
      coaHeadName: newAdj.coaHeadName,
      coa: newAdj.coa,
      amount: Number(newAdj.amount),
      remarks: newAdj.remarks,
      debit: newAdj.type === "Debit" ? Number(newAdj.amount) : 0,
    };

    setRows([...rows, entry]);
    setModalOpen(false);

    setNewAdj({
      date: today,
      code: `CA-${String(rows.length + 2).padStart(3, "0")}`,
      type: "",
      coaHeadName: "",
      coa: "",
      amount: "",
      remarks: "",
    });
  };

  /* ------------------------------ Render ------------------------------ */
  return (
    <>
      {/* --------------------------- ADD MODAL --------------------------- */}
      {/* --------------------------- ADD MODAL --------------------------- */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Cash Adjustment"
        width="700px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="p-0 space-y-4">
          {/* Voucher Date */}
          <div>
            <label className="text-sm">Voucher Date *</label>
            <input
              type="date"
              value={newAdj.date}
              onChange={(e) => setNewAdj({ ...newAdj, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Code Auto Generated */}
          <div>
            <label className="text-sm">Code *</label>
            <input
              value={newAdj.code}
              readOnly
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 opacity-70 cursor-not-allowed"
            />
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="text-sm">Adjustment Type *</label>
            <select
              value={newAdj.type}
              onChange={(e) => setNewAdj({ ...newAdj, type: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            >
              <option value="">Select Type</option>
              <option value="Debit">Debit (-)</option>
              <option value="Credit">Credit (+)</option>
            </select>
          </div>

          {/* COA Head Name */}
          <div>
            <label className="text-sm">COA Head Name *</label>
            <input
              value={newAdj.coaHeadName}
              onChange={(e) =>
                setNewAdj({ ...newAdj, coaHeadName: e.target.value })
              }
              placeholder="Cash Adjustment"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* COA Code */}
          <div>
            <label className="text-sm">COA *</label>
            <input
              value={newAdj.coa}
              onChange={(e) => setNewAdj({ ...newAdj, coa: e.target.value })}
              placeholder="5001"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm">Amount *</label>
            <input
              type="number"
              value={newAdj.amount}
              onChange={(e) => setNewAdj({ ...newAdj, amount: e.target.value })}
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm">Remarks *</label>
            <textarea
              value={newAdj.remarks}
              onChange={(e) =>
                setNewAdj({ ...newAdj, remarks: e.target.value })
              }
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>
        </div>
      </AddModal>

      {/* --------------------------- MAIN PAGE --------------------------- */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden gap-2"> 

        <h2 className="text-2xl font-semibold mb-4">Cash Adjustment</h2>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {hasPermission(PERMISSIONS.CASH_BANK.CREATE) && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Adjustment
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

          <button
            onClick={() => setShowInactive((s) => !s)}
            className="flex items-center gap-2 p-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1600px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.voucherName && <th className="pb-2 border-b">Voucher</th>}
                  {visibleColumns.voucherDate && <th className="pb-2 border-b">Date</th>}
                  {visibleColumns.adjustmentType && <th className="pb-2 border-b">Type</th>}
                  {visibleColumns.coaHeadName && <th className="pb-2 border-b">COA Head</th>}
                  {visibleColumns.coa && <th className="pb-2 border-b">COA</th>}
                  {visibleColumns.amount && <th className="pb-2 border-b">Amount</th>}
                  {visibleColumns.remarks && <th className="pb-2 border-b">Remarks</th>}
                  {visibleColumns.debit && <th className="pb-2 border-b">Debit</th>}
                </tr>
              </thead>

              <tbody className="text-center">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-gray-900 hover:bg-gray-700">
                    {visibleColumns.id && <td className="py-2">{r.id}</td>}
                    {visibleColumns.voucherName && <td className="py-2">{r.voucherName}</td>}
                    {visibleColumns.voucherDate && <td className="py-2">{r.voucherDate}</td>}
                    {visibleColumns.adjustmentType && <td className="py-2">{r.adjustmentType}</td>}
                    {visibleColumns.coaHeadName && <td className="py-2">{r.coaHeadName}</td>}
                    {visibleColumns.coa && <td className="py-2">{r.coa}</td>}
                    {visibleColumns.amount && <td className="py-2">{r.amount}</td>}
                    {visibleColumns.remarks && <td className="py-2">{r.remarks}</td>}
                    {visibleColumns.debit && <td className="py-2">{r.debit}</td>}
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

export default CashAdjustment;



