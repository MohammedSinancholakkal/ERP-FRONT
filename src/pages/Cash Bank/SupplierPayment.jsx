// src/pages/suppliers/SupplierPayment.jsx
import React, { useState, useEffect, useRef } from "react";
// import {
//   Star
// } from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import EditModal from "../../components/modals/EditModal";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";
import { Star } from "lucide-react";

const SupplierPayment = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  /* -------------------------------- Columns -------------------------------- */
  const defaultColumns = {
    id: true,
    voucherName: true,
    voucherType: true,
    voucherDate: true,
    coaHeadName: true,
    coa: true,
    narration: true,
    debit: true,
    credit: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  /* --------------------------------- Data ---------------------------------- */
  const sampleData = [
    {
      id: 1,
      voucherName: "SP-001",
      voucherType: "Supplier Payment",
      voucherDate: "2024-01-10",
      coaHeadName: "Cash at Bank",
      coa: "2001",
      narration: "Payment to supplier",
      debit: 5000,
      credit: 0,
    },
  ];

  const [rows, setRows] = useState(sampleData);
  const [inactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [searchText, setSearchText] = useState("");

  /* ------------------------------- Pagination ------------------------------ */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  /* --------------------------------- Modal -------------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [newPay, setNewPay] = useState({
    date: today,
    supplier: "",
    supplierSearch: "",
    supplierDropdown: false,
    paymentType: "",
    amount: "",
    remarks: "",
  });

  const [editData, setEditData] = useState({
    id: null,
    voucherDate: today,
    supplier: "",
    supplierSearch: "",
    supplierDropdown: false,
    paymentType: "",
    amount: "",
    remarks: "",
    isInactive: false,
  });

  const suppliers = ["Alpha Traders", "Global Supply Co", "Rapid Industries"];

  const handleAdd = () => {
    if (!newPay.date || !newPay.supplier || !newPay.paymentType || !newPay.amount) {
      alert("Please fill all required fields.");
      return;
    }

    const newEntry = {
      id: rows.length + 1,
      voucherName: `SP-${rows.length + 1}`,
      voucherType: "Supplier Payment",
      voucherDate: newPay.date,
      coaHeadName: newPay.paymentType,
      coa: "0000",
      narration: newPay.remarks,
      debit: Number(newPay.amount),
      credit: 0,
    };

      setRows([...rows, newEntry]);
      setModalOpen(false);

    setNewPay({
      date: today,
      supplier: "",
      supplierSearch: "",
      supplierDropdown: false,
      paymentType: "",
      amount: "",
      remarks: "",
    });
  };

  const handleUpdate = () => {
    if (!editData.voucherDate || !editData.supplier || !editData.paymentType || !editData.amount) {
      alert("Please fill required fields");
      return;
    }

    setRows(rows.map(r => r.id === editData.id ? {
        ...r,
        voucherDate: editData.voucherDate,
        coaHeadName: editData.paymentType,
        narration: editData.remarks,
        debit: Number(editData.amount),
        // other fields updated implicitly or handled by real backend
    } : r));
    setEditModalOpen(false);
  };

  const openEditModal = (row) => {
    setEditData({
      id: row.id,
      voucherDate: row.voucherDate,
      supplier: "Alpha Traders", // derived in real app, mocked here as we don't track supplier name separately in sampleData
      supplierSearch: "",
      supplierDropdown: false,
      paymentType: row.coaHeadName,
      amount: row.debit,
      remarks: row.narration,
      isInactive: false,
    });
    setEditModalOpen(true);
  };

  /* --------------------------------- Render -------------------------------- */
  return (
    <>
      {/* ------------------------------ ADD MODAL ------------------------------ */}
      {/* ------------------------------ ADD MODAL ------------------------------ */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Supplier Payment"
        width="750px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="p-0 space-y-4">
          {/* Date */}
          <div>
            <label className="text-sm">Voucher Date *</label>
            <input
              type="date"
              value={newPay.date}
              onChange={(e) => setNewPay({ ...newPay, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Supplier Searchable Dropdown */}
          <div className="relative">
            <label className="text-sm">Supplier *</label>

            <div className="flex items-center gap-2">
              <input
                value={newPay.supplierSearch || newPay.supplier}
                onChange={(e) =>
                  setNewPay({
                    ...newPay,
                    supplierSearch: e.target.value,
                    supplierDropdown: true,
                  })
                }
                onClick={() =>
                  setNewPay((p) => ({
                    ...p,
                    supplierDropdown: !p.supplierDropdown,
                  }))
                }
                placeholder="Search or select supplier..."
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
              />

              {/* New Supplier Button */}
              {hasPermission(PERMISSIONS.SUPPLIERS.CREATE) && (
                <button
                  onClick={() => navigate("/masters/new-supplier")}
                  className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                >
                  <Star size={16} className="text-yellow-300" />
                </button>
              )}
            </div>

            {newPay.supplierDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow max-h-[150px] overflow-auto">
                {suppliers
                  .filter((s) =>
                    s
                      .toLowerCase()
                      .includes(newPay.supplierSearch.toLowerCase())
                  )
                  .map((s) => (
                    <div
                      key={s}
                      onClick={() =>
                        setNewPay({
                          ...newPay,
                          supplier: s,
                          supplierSearch: "",
                          supplierDropdown: false,
                        })
                      }
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {s}
                    </div>
                  ))}

                {suppliers.filter((s) =>
                  s.toLowerCase().includes(newPay.supplierSearch.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="text-sm">Payment Type *</label>
            <select
              value={newPay.paymentType}
              onChange={(e) =>
                setNewPay({ ...newPay, paymentType: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            >
              <option value="">Select Payment Type</option>
              <option value="Cash at Hand">Cash at Hand</option>
              <option value="Cash at Bank">Cash at Bank</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm">Amount *</label>
            <input
              type="number"
              value={newPay.amount}
              onChange={(e) =>
                setNewPay({ ...newPay, amount: e.target.value })
              }
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm">Remarks (optional)</label>
            <textarea
              value={newPay.remarks}
              onChange={(e) =>
                setNewPay({ ...newPay, remarks: e.target.value })
              }
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>
        </div>
      </AddModal>

      {/* ------------------------------ MAIN PAGE ------------------------------ */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        title="Edit Supplier Payment"
        width="750px"
        permissionEdit={hasPermission(PERMISSIONS.CASH_BANK.EDIT)}
        permissionDelete={false}
        saveText="Update"
        isInactive={editData.isInactive}
      >
        <div className="p-0 space-y-4">
           {/* Date */}
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

          {/* Supplier (Mocked for edit) */}
          <div>
            <label className="text-sm">Supplier *</label>
             <input
                value={editData.supplier}
                onChange={(e) => setEditData({ ...editData, supplier: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                disabled={editData.isInactive}
              />
          </div>

           <div>
            <label className="text-sm">Payment Type *</label>
            <select
              value={editData.paymentType}
              onChange={(e) => setEditData({ ...editData, paymentType: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
               disabled={editData.isInactive}
            >
              <option value="">Select Payment Type</option>
              <option value="Cash at Hand">Cash at Hand</option>
              <option value="Cash at Bank">Cash at Bank</option>
            </select>
          </div>

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

          <div>
            <label className="text-sm">Remarks (optional)</label>
            <textarea
              value={editData.remarks}
              onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
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

      {/* ------------------------------ MAIN PAGE ------------------------------ */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
             <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Supplier Payment</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.voucherName && { key: "voucherName", label: "Voucher Name", sortable: true },
                    visibleColumns.voucherType && { key: "voucherType", label: "Voucher Type", sortable: true },
                    visibleColumns.voucherDate && { key: "voucherDate", label: "Date", sortable: true },
                    visibleColumns.coaHeadName && { key: "coaHeadName", label: "COA Head", sortable: true },
                    visibleColumns.coa && { key: "coa", label: "COA", sortable: true },
                    visibleColumns.narration && { key: "narration", label: "Narration", sortable: true },
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
                createLabel="New Payment"
                permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
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

export default SupplierPayment;



