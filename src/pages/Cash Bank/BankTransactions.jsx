// src/pages/bank/BankTransactions.jsx
import React, { useState, useEffect, useRef } from "react";
// import {
//   Save,
// } from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import EditModal from "../../components/modals/EditModal";
import toast from "react-hot-toast";
import PageLayout from "../../layout/PageLayout";
// import Pagination from "../../components/Pagination";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";

const BankTransactions = () => {
  const { theme } = useTheme();
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
  const [columnModalOpen, setColumnModalOpen] = useState(false);

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
  const [editModalOpen, setEditModalOpen] = useState(false);
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

const [editData, setEditData] = useState({
  id: null,
  date: today,
  accountType: "Debit",
  wdId: "",
  bank: "",
  amount: "0",
  description: "",
  isInactive: false,
});




  const handleAdd = () => {
    if (newTx.wdId && rows.some(r => r.wdId === newTx.wdId)) {
        return toast.error("Transaction ID (WD ID) already exists");
    }
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

  const handleUpdate = () => {
    // Basic validation
    if (!editData.date || !editData.bank || !editData.amount) {
        return toast.error("Please fill required fields");
    }

    setRows(rows.map(r => r.id === editData.id ? {
      ...r,
      date: editData.date,
      coaHeadName: editData.bank,
      description: editData.description,
      debit: editData.accountType === "Debit" ? Number(editData.amount) : 0,
      credit: editData.accountType === "Credit" ? Number(editData.amount) : 0,
      wdId: editData.wdId, // Assuming WD ID is editable or display only
    } : r));

    setEditModalOpen(false);
    toast.success("Transaction updated");
  };

  const openEditModal = (row) => {
    setEditData({
      id: row.id,
      date: row.date,
      accountType: row.debit > 0 ? "Debit" : "Credit",
      wdId: row.wdId,
      bank: row.coaHeadName,
      amount: row.debit > 0 ? row.debit : row.credit,
      description: row.description,
      isInactive: false,
    });
    setEditModalOpen(true);
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
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        title="Edit Bank Transaction"
        width="750px"
        permissionEdit={hasPermission(PERMISSIONS.CASH_BANK.EDIT)}
        permissionDelete={false}
        saveText="Update"
        isInactive={editData.isInactive}
      >
        <div className="p-0 space-y-4">
             {/* Date */}
          <div>
            <label className="text-sm">Date</label>
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="text-sm">Account Type</label>
            <select
              value={editData.accountType}
              onChange={(e) =>
                setEditData({ ...editData, accountType: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            >
              <option value="Debit">Debit (-)</option>
              <option value="Credit">Credit (+)</option>
            </select>
          </div>

           {/* WD ID */}
           <div>
            <label className="text-sm">Withdraw / Deposit ID</label>
            <input
              value={editData.wdId}
              onChange={(e) => setEditData({ ...editData, wdId: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            />
          </div>

          {/* Bank (Simple input for simplified logic) */}
           <div>
            <label className="text-sm">Bank</label>
             <input
              value={editData.bank}
              onChange={(e) => setEditData({ ...editData, bank: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            />
           </div>

           {/* Amount */}
          <div>
            <label className="text-sm">Amount</label>
            <input
              value={editData.amount}
              onChange={(e) =>
                setEditData({ ...editData, amount: e.target.value })
              }
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            />
          </div>

           {/* Description */}
          <div>
            <label className="text-sm">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              rows={2}
               disabled={editData.isInactive}
            />
          </div>

        </div>
      </EditModal>

      <ColumnPickerModal
        isOpen={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        defaultColumns={defaultColumns}
      />

      {/* ---------------------- MAIN ---------------------- */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Bank Transactions</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.wdId && { key: "wdId", label: "W/D ID", sortable: true },
                    visibleColumns.voucherType && { key: "voucherType", label: "Voucher Type", sortable: true },
                    visibleColumns.date && { key: "date", label: "Date", sortable: true },
                    visibleColumns.coaHeadName && { key: "coaHeadName", label: "COA Head", sortable: true },
                    visibleColumns.coa && { key: "coa", label: "COA", sortable: true },
                    visibleColumns.description && { key: "description", label: "Description", sortable: true },
                    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true },
                    visibleColumns.credit && { key: "credit", label: "Credit", sortable: true },
                ].filter(Boolean)}
                data={rows}
                // inactiveData={inactiveRows}
                showInactive={showInactive}
                // sortConfig={sortConfig}
                // onSort={handleSort}
                onRowClick={(r) => openEditModal(r)}
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => setModalOpen(true)}
                createLabel="New Transaction"
                permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    toast.success("Refreshed");
                }}
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={() => setShowInactive((s) => !s)}

                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
            />
          </div>
          </ContentCard>
      </div>
      </PageLayout>
    </>
  );
};

export default BankTransactions;



