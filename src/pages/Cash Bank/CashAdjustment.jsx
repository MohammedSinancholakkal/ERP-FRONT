// src/pages/accounts/CashAdjustment.jsx
import React, { useState } from "react";
import {
  Save,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import EditModal from "../../components/modals/EditModal";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";

const CashAdjustment = () => {
  const { theme } = useTheme();
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
  const [editModalOpen, setEditModalOpen] = useState(false);
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

  const [editData, setEditData] = useState({
    id: null,
    voucherDate: today,
    voucherName: "",
    adjustmentType: "",
    coaHeadName: "",
    coa: "",
    amount: "",
    remarks: "",
    isInactive: false,
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

  const handleUpdate = () => {
    // validation
     if (
      !editData.voucherDate ||
      !editData.adjustmentType ||
      !editData.coaHeadName ||
      !editData.coa ||
      !editData.amount ||
      !editData.remarks
    ) {
      alert("❗ All fields are required.");
      return;
    }

    setRows(rows.map(r => r.id === editData.id ? {
        ...r,
        voucherDate: editData.voucherDate,
        adjustmentType: editData.adjustmentType,
        coaHeadName: editData.coaHeadName,
        coa: editData.coa,
        amount: Number(editData.amount),
        remarks: editData.remarks,
        debit: editData.adjustmentType === "Debit" ? Number(editData.amount) : 0,
    } : r));

    setEditModalOpen(false);
  };

  const openEditModal = (row) => {
    setEditData({
      id: row.id,
      voucherDate: row.voucherDate,
      voucherName: row.voucherName,
      adjustmentType: row.adjustmentType,
      coaHeadName: row.coaHeadName,
      coa: row.coa,
      amount: row.amount,
      remarks: row.remarks,
      isInactive: false,
    });
    setEditModalOpen(true);
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
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        title="Edit Cash Adjustment"
        width="700px"
        permissionEdit={hasPermission(PERMISSIONS.CASH_BANK.EDIT)}
        permissionDelete={false}
        isInactive={editData.isInactive}
      >
        <div className="p-0 space-y-4">
           {/* Voucher Date */}
          <div>
            <label className="text-sm">Voucher Date *</label>
            <input
              type="date"
              value={editData.voucherDate}
              onChange={(e) => setEditData({ ...editData, voucherDate: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              disabled={editData.isInactive}
            />
          </div>

          {/* Code Auto Generated - Read Only */}
          <div>
            <label className="text-sm">Code *</label>
            <input
              value={editData.voucherName}
              readOnly
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 opacity-70 cursor-not-allowed"
            />
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="text-sm">Adjustment Type *</label>
            <select
              value={editData.adjustmentType}
              onChange={(e) => setEditData({ ...editData, adjustmentType: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
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
              value={editData.coaHeadName}
              onChange={(e) =>
                setEditData({ ...editData, coaHeadName: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            />
          </div>

          {/* COA Code */}
          <div>
            <label className="text-sm">COA *</label>
            <input
              value={editData.coa}
              onChange={(e) => setEditData({ ...editData, coa: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            />
          </div>

           {/* Amount */}
          <div>
            <label className="text-sm">Amount *</label>
            <input
              type="number"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            />
          </div>

           {/* Remarks */}
          <div>
            <label className="text-sm">Remarks *</label>
            <textarea
              value={editData.remarks}
              onChange={(e) =>
                setEditData({ ...editData, remarks: e.target.value })
              }
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
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

      {/* --------------------------- MAIN PAGE --------------------------- */}
      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <h2 className="text-2xl font-semibold mb-4">Cash Adjustment</h2>

             <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.voucherName && { key: "voucherName", label: "Voucher", sortable: true },
                    visibleColumns.voucherDate && { key: "voucherDate", label: "Date", sortable: true },
                    visibleColumns.adjustmentType && { key: "adjustmentType", label: "Type", sortable: true },
                    visibleColumns.coaHeadName && { key: "coaHeadName", label: "COA Head", sortable: true },
                    visibleColumns.coa && { key: "coa", label: "COA", sortable: true },
                    visibleColumns.amount && { key: "amount", label: "Amount", sortable: true },
                    visibleColumns.remarks && { key: "remarks", label: "Remarks", sortable: true },
                    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true },
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
                createLabel="New Adjustment"
                permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                }}
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={() => setShowInactive((s) => !s)}
            />

             {/* PAGINATION */}
            <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
            />
      </div>
      </div>
      </PageLayout>

    </>
  );
};

export default CashAdjustment;



