// src/pages/suppliers/SupplierPayment.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  X,
  Save,
  Star,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

const SupplierPayment = () => {
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
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

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

  /* --------------------------------- Render -------------------------------- */
  return (
    <>
      {/* ------------------------------ ADD MODAL ------------------------------ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[750px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-lg">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Supplier Payment</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white">
                <X />
              </button>
            </div>

            <div className="p-5 space-y-4">

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
                      setNewPay((p) => ({ ...p, supplierDropdown: !p.supplierDropdown }))
                    }
                    placeholder="Search or select supplier..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
                  />

                  {/* New Supplier Button */}
                  <button
                    onClick={() => navigate("/masters/new-supplier")}
                    className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    <Star size={16} className="text-yellow-300" />
                  </button>
                </div>

                {newPay.supplierDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow max-h-[150px] overflow-auto">
                    {suppliers
                      .filter((s) =>
                        s.toLowerCase().includes(newPay.supplierSearch.toLowerCase())
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
                      <div className="px-3 py-2 text-gray-400 text-sm">No results found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Type */}
              <div>
                <label className="text-sm">Payment Type *</label>
                <select
                  value={newPay.paymentType}
                  onChange={(e) => setNewPay({ ...newPay, paymentType: e.target.value })}
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
                  onChange={(e) => setNewPay({ ...newPay, amount: e.target.value })}
                  placeholder="0"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="text-sm">Remarks (optional)</label>
                <textarea
                  value={newPay.remarks}
                  onChange={(e) => setNewPay({ ...newPay, remarks: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-gray-700">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------ MAIN PAGE ------------------------------ */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">

        <h2 className="text-2xl font-semibold mb-4">Supplier Payment</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search payments..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Payment
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
            <table className="min-w-[1500px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.voucherName && <th className="pb-2 border-b">Voucher Name</th>}
                  {visibleColumns.voucherType && <th className="pb-2 border-b">Voucher Type</th>}
                  {visibleColumns.voucherDate && <th className="pb-2 border-b">Date</th>}
                  {visibleColumns.coaHeadName && <th className="pb-2 border-b">COA Head</th>}
                  {visibleColumns.coa && <th className="pb-2 border-b">COA</th>}
                  {visibleColumns.narration && <th className="pb-2 border-b">Narration</th>}
                  {visibleColumns.debit && <th className="pb-2 border-b">Debit</th>}
                  {visibleColumns.credit && <th className="pb-2 border-b">Credit</th>}
                </tr>
              </thead>

              <tbody className="text-center">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-gray-900 hover:bg-gray-700">
                    {visibleColumns.id && <td className="py-2">{r.id}</td>}
                    {visibleColumns.voucherName && <td className="py-2">{r.voucherName}</td>}
                    {visibleColumns.voucherType && <td className="py-2">{r.voucherType}</td>}
                    {visibleColumns.voucherDate && <td className="py-2">{r.voucherDate}</td>}
                    {visibleColumns.coaHeadName && <td className="py-2">{r.coaHeadName}</td>}
                    {visibleColumns.coa && <td className="py-2">{r.coa}</td>}
                    {visibleColumns.narration && <td className="py-2">{r.narration}</td>}
                    {visibleColumns.debit && <td className="py-2">{r.debit}</td>}
                    {visibleColumns.credit && <td className="py-2">{r.credit}</td>}
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

export default SupplierPayment;



