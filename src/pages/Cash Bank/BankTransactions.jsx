// src/pages/bank/BankTransactions.jsx
import React, { useState, useEffect, useRef } from "react";
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
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";

const BankTransactions = () => {
  // ------------------------- Columns -------------------------
  const defaultColumns = {
    id: true,
    wdId: true,
    voucherType: true,
    date: true,
    coaHeadName: true,
    coa: true,
    description: true,
    debit: true,
    credit: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // ------------------------- Data -------------------------
  const sampleData = [
    {
      id: 1,
      wdId: "WD-001",
      voucherType: "Deposit",
      date: "2024-01-05",
      coaHeadName: "Cash In Bank",
      coa: "1002",
      description: "Customer payment received",
      debit: 0,
      credit: 5000,
    },
    {
      id: 2,
      wdId: "WD-002",
      voucherType: "Withdraw",
      date: "2024-01-07",
      coaHeadName: "Cash In Bank",
      coa: "1002",
      description: "Office purchase",
      debit: 1200,
      credit: 0,
    },
  ];

  const [rows, setRows] = useState(sampleData);
  const [inactiveRows] = useState([]); // placeholder
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  // ------------------------- Pagination -------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // ------------------------- Add Modal -------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

const [newTx, setNewTx] = useState({
  date: today,
  accountType: "Debit",
  wdId: "",
  bank: "",
  bankSearch: "",
  bankDropdown: false,
  amount: "",
  description: "",
});



  const handleRefresh = () => {
    setSearchText("");
    setFilterSupplier("");
    setFilterDate("");
    setPage(1);
    fetchPurchases();
    toast.success("Refreshed");
  };


  const handleAdd = () => {
    const newEntry = {
      id: rows.length + 1,
      wdId: newTx.wdId,
      voucherType: newTx.accountType === "Debit" ? "Withdraw" : "Deposit",
      date: newTx.date,
      coaHeadName: newTx.bank,
      coa: "0000",
      description: newTx.description,
      debit: newTx.accountType === "Debit" ? Number(newTx.amount) : 0,
      credit: newTx.accountType === "Credit" ? Number(newTx.amount) : 0,
    };

    setRows([...rows, newEntry]);
    setModalOpen(false);

    setNewTx({
      date: today,
      accountType: "Debit",
      wdId: "",
      bank: "",
      amount: "",
      description: "",
    });
  };

  // ------------------------- Render -------------------------
  return (
    <>
      {/* ---------------------- ADD MODAL ---------------------- */}
      {/* ---------------------- ADD MODAL ---------------------- */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Bank Transaction"
        width="750px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="p-0 space-y-4">
          {/* Date */}
          <div>
            <label className="text-sm">Date</label>
            <input
              type="date"
              value={newTx.date}
              onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="text-sm">Account Type</label>
            <select
              value={newTx.accountType}
              onChange={(e) =>
                setNewTx({ ...newTx, accountType: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            >
              <option value="Debit">Debit (-)</option>
              <option value="Credit">Credit (+)</option>
            </select>
          </div>

          {/* WD ID */}
          <div>
            <label className="text-sm">Withdraw / Deposit ID</label>
            <input
              value={newTx.wdId}
              onChange={(e) => setNewTx({ ...newTx, wdId: e.target.value })}
              placeholder="WD-001"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Bank */}
          {/* Bank Searchable Dropdown */}
          <div className="relative">
            <label className="text-sm">Bank</label>

            {/* INPUT FIELD */}
            <input
              value={newTx.bankSearch || newTx.bank}
              onChange={(e) =>
                setNewTx({
                  ...newTx,
                  bankSearch: e.target.value,
                  bankDropdown: true,
                })
              }
              onClick={() =>
                setNewTx((p) => ({ ...p, bankDropdown: !p.bankDropdown }))
              }
              placeholder="Search or select bank..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
            />

            {/* DROPDOWN LIST */}
            {newTx.bankDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow max-h-[150px] overflow-auto">
                {["Meezan Bank", "HBL", "UBL", "Bank Al Habib", "Alfalah"]
                  .filter((b) =>
                    b.toLowerCase().includes(newTx.bankSearch.toLowerCase())
                  )
                  .map((b) => (
                    <div
                      key={b}
                      onClick={() =>
                        setNewTx({
                          ...newTx,
                          bank: b,
                          bankSearch: "",
                          bankDropdown: false,
                        })
                      }
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {b}
                    </div>
                  ))}

                {/* No results */}
                {["Meezan Bank", "HBL", "UBL", "Bank Al Habib", "Alfalah"].filter(
                  (b) =>
                    b.toLowerCase().includes(newTx.bankSearch.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm">Amount</label>
            <input
              value={newTx.amount}
              onChange={(e) =>
                setNewTx({ ...newTx, amount: e.target.value })
              }
              type="number"
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm">Description</label>
            <textarea
              value={newTx.description}
              onChange={(e) =>
                setNewTx({ ...newTx, description: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              rows={2}
            />
          </div>
        </div>
      </AddModal>


      {/* COLUMN PICKER MODAL */}
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* ---------------------- MAIN ---------------------- */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden"> 
        <h2 className="text-2xl font-semibold mb-4">Bank Transactions</h2>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search */}
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search transactions..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {/* New Transaction */}
          {hasPermission(PERMISSIONS.CASH_BANK.CREATE) && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} />
            New Transaction
          </button>
          )}

          {/* Refresh */}
          <button  onClick={handleRefresh} className="p-2 bg-gray-700 border border-gray-600 rounded">
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

          {/* Inactive Button */}
          <button
            onClick={() => setShowInactive((s) => !s)}
            className="flex items-center gap-2 p-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1300px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.wdId && (
                    <th className="pb-2 border-b">W/D ID</th>
                  )}
                  {visibleColumns.voucherType && (
                    <th className="pb-2 border-b">Voucher Type</th>
                  )}
                  {visibleColumns.date && (
                    <th className="pb-2 border-b">Date</th>
                  )}
                  {visibleColumns.coaHeadName && (
                    <th className="pb-2 border-b">COA Head</th>
                  )}
                  {visibleColumns.coa && (
                    <th className="pb-2 border-b">COA</th>
                  )}
                  {visibleColumns.description && (
                    <th className="pb-2 border-b">Description</th>
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
                    className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                  >
                    {visibleColumns.id && <td className="py-2">{r.id}</td>}
                    {visibleColumns.wdId && <td className="py-2">{r.wdId}</td>}
                    {visibleColumns.voucherType && (
                      <td className="py-2">{r.voucherType}</td>
                    )}
                    {visibleColumns.date && <td className="py-2">{r.date}</td>}
                    {visibleColumns.coaHeadName && (
                      <td className="py-2">{r.coaHeadName}</td>
                    )}
                    {visibleColumns.coa && <td className="py-2">{r.coa}</td>}
                    {visibleColumns.description && (
                      <td className="py-2">{r.description}</td>
                    )}
                    {visibleColumns.debit && <td className="py-2">{r.debit}</td>}
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
                onRefresh={handleRefresh}
              />
            </div>
      </div>
      </PageLayout>
    </>
  );
};

export default BankTransactions;



