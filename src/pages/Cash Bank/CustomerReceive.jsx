// src/pages/customer-receive/CustomerReceive.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Star,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import EditModal from "../../components/modals/EditModal";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";

const CustomerReceive = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ------------------ COLUMN VISIBILITY ------------------
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
  const [tempColumns, setTempColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // ------------------ DUMMY DATA ------------------
  const sampleData = [
    {
      id: 1,
      voucherName: "CR-001",
      voucherType: "Customer Receive",
      voucherDate: "2024-01-06",
      coaHeadName: "Sales Receivable",
      coa: "1101",
      narration: "Payment received",
      debit: 0,
      credit: 2500,
    },
  ];

  const [rows, setRows] = useState(sampleData);
  const [inactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // ------------------ SEARCH ------------------
  const [searchText, setSearchText] = useState("");

  // ------------------ PAGINATION ------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, totalRecords);

  // ------------------ MODAL ------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    voucherDate: today,
    customer: "",
    customerSearch: "",
    customerDropdown: false,
    paymentType: "",
    amount: "",
    remarks: "",
  });

  const [editData, setEditData] = useState({
    id: null,
    voucherDate: today,
    customer: "",
    customerSearch: "",
    customerDropdown: false,
    paymentType: "",
    amount: "",
    remarks: "",
    isInactive: false,
  });

  // Dummy customer list
  const customerList = ["John Traders", "Al Meezan Corp", "Punjab Suppliers", "Galaxy Store"];

  const handleSave = () => {
    if (!form.voucherDate || !form.customer || !form.paymentType || !form.amount) {
      alert("Please fill required fields");
      return;
    }

    const entry = {
      id: rows.length + 1,
      voucherName: "CR-" + String(rows.length + 1).padStart(3, "0"),
      voucherType: "Customer Receive",
      voucherDate: form.voucherDate,
      coaHeadName: form.customer,
      coa: "0000",
      narration: form.remarks || "",
      debit: 0,
      credit: Number(form.amount),
    };

    setRows([...rows, entry]);

    setModalOpen(false);
    setForm({
      voucherDate: today,
      customer: "",
      customerSearch: "",
      customerDropdown: false,
      paymentType: "",
      amount: "",
      remarks: "",
    });
  };

  const handleUpdate = () => {
     if (!editData.voucherDate || !editData.customer || !editData.paymentType || !editData.amount) {
      alert("Please fill required fields");
      return;
    }
    
    setRows(rows.map(r => r.id === editData.id ? {
        ...r,
        voucherDate: editData.voucherDate,
        coaHeadName: editData.customer, // Simplified for demo
        narration: editData.remarks,
        credit: Number(editData.amount),
        // other fields...
    } : r));
    setEditModalOpen(false);
  };

  const openEditModal = (row) => {
    setEditData({
      id: row.id,
      voucherDate: row.voucherDate,
      customer: row.coaHeadName,
      customerSearch: "",
      customerDropdown: false,
      paymentType: "Cash At Hand", // Default or derived
      amount: row.credit,
      remarks: row.narration,
      isInactive: false, // Demo
    });
    setEditModalOpen(true);
  };

  return (
    <>
      {/* ------------------ ADD MODAL ------------------ */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="New Customer Receive"
        width="750px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="p-0 grid grid-cols-2 gap-4">
          {/* Voucher Date */}
          <div>
            <label className="text-sm">Voucher Date *</label>
            <input
              type="date"
              value={form.voucherDate}
              onChange={(e) =>
                setForm({ ...form, voucherDate: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* PAYMENT TYPE */}
          <div>
            <label className="text-sm">Payment Type *</label>
            <select
              value={form.paymentType}
              onChange={(e) =>
                setForm({ ...form, paymentType: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            >
              <option value="">Select...</option>
              <option value="Cash At Hand">Cash At Hand</option>
              <option value="Cash At Bank">Cash At Bank</option>
            </select>
          </div>

          {/* CUSTOMER (Searchable Dropdown + Star) */}
          <div className="col-span-2 relative">
            <label className="text-sm">Customer *</label>
            <div className="flex gap-2 items-center">
              {/* Searchable input */}
              <input
                value={form.customerSearch || form.customer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerSearch: e.target.value,
                    customerDropdown: true,
                  })
                }
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    customerDropdown: !p.customerDropdown,
                  }))
                }
                placeholder="Search or select customer..."
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
              />

              {/* Star icon */}
              {hasPermission(PERMISSIONS.CUSTOMERS.CREATE) && (
                <button
                  onClick={() => navigate("/new-customers")}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600"
                >
                  <Star size={16} className="" />
                </button>
              )}
            </div>

            {/* DROPDOWN */}
            {form.customerDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow max-h-[150px] overflow-auto z-50">
                {customerList
                  .filter((c) =>
                    c
                      .toLowerCase()
                      .includes((form.customerSearch || "").toLowerCase())
                  )
                  .map((c) => (
                    <div
                      key={c}
                      onClick={() =>
                        setForm({
                          ...form,
                          customer: c,
                          customerSearch: "",
                          customerDropdown: false,
                        })
                      }
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {c}
                    </div>
                  ))}

                {/* No results */}
                {customerList.filter((c) =>
                  c
                    .toLowerCase()
                    .includes((form.customerSearch || "").toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    No customers found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AMOUNT */}
          <div>
            <label className="text-sm">Amount *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm">Remarks (optional)</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>
        </div>
      </AddModal>

      {/* ------------------ PAGE HEADER ------------------ */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        title="Edit Customer Receive"
        width="750px"
        permissionEdit={hasPermission(PERMISSIONS.CASH_BANK.EDIT)}
        permissionDelete={false} // Disable delete for demo or implement if needed
        isInactive={editData.isInactive}
      >
        <div className="p-0 grid grid-cols-2 gap-4">
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

          <div>
            <label className="text-sm">Payment Type *</label>
            <select
              value={editData.paymentType}
              onChange={(e) => setEditData({ ...editData, paymentType: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              disabled={editData.isInactive}
            >
              <option value="">Select...</option>
              <option value="Cash At Hand">Cash At Hand</option>
              <option value="Cash At Bank">Cash At Bank</option>
            </select>
          </div>

          <div className="col-span-2 relative">
            <label className="text-sm">Customer *</label>
             <input
                value={editData.customer}
                onChange={(e) => setEditData({ ...editData, customer: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                disabled={editData.isInactive}
              />
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

       {/* COLUMN PICKER */}
       <ColumnPickerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
        />

      {/* ------------------ PAGE HEADER ------------------ */}
      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className="text-2xl font-semibold mb-4">Customer Receive</h2>

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
                createLabel="New Receive"
                permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    // load data
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

export default CustomerReceive;



