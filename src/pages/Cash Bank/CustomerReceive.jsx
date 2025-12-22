// src/pages/customer-receive/CustomerReceive.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  Save,
  X,
  Star,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";

const CustomerReceive = () => {
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

  // ------------------ RENDER ------------------
  return (
    <>
      {/* ------------------ ADD MODAL ------------------ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[750px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-lg">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Customer Receive</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white">
                <X />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4">

              {/* Voucher Date */}
              <div>
                <label className="text-sm">Voucher Date *</label>
                <input
                  type="date"
                  value={form.voucherDate}
                  onChange={(e) => setForm({ ...form, voucherDate: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* PAYMENT TYPE */}
              <div>
                <label className="text-sm">Payment Type *</label>
                <select
                  value={form.paymentType}
                  onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
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
                      setForm((p) => ({ ...p, customerDropdown: !p.customerDropdown }))
                    }
                    placeholder="Search or select customer..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
                  />

                  {/* Star icon */}
                  <button
                    onClick={() => navigate("/new-customers")}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600"
                  >
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>

                {/* DROPDOWN */}
                {form.customerDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow max-h-[150px] overflow-auto z-50">

                    {customerList
                      .filter((c) =>
                        c.toLowerCase().includes((form.customerSearch || "").toLowerCase())
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
                      c.toLowerCase().includes((form.customerSearch || "").toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-400 text-sm">No customers found</div>
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

            {/* Save */}
            <div className="flex justify-end px-5 py-3 border-t border-gray-700">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ PAGE HEADER ------------------ */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Customer Receive</h2>

        {/* ------------------ ACTION BAR ------------------ */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search */}
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-64">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {/* New Receive */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Receive
          </button>

          {/* Refresh */}
          <button className="p-2 bg-gray-700 border border-gray-600 rounded">
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          {/* Column Picker */}
          <button
            onClick={() => {
              setTempColumns(visibleColumns);
              setColumnModalOpen(true);
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>

          {/* Inactive */}
          <button
            onClick={() => setShowInactive((s) => !s)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* ------------------ TABLE ------------------ */}
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


        {/* ------------------ PAGINATION ------------------ */}
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
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button disabled={page === 1} onClick={() => setPage(1)} className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50">
            <ChevronsLeft size={16} />
          </button>

          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50">
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>

          <input
            type="number"
            className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
            value={page}
            onChange={(e) =>
              setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))
            }
          />

          <span>/ {totalPages}</span>

          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50">
            <ChevronRight size={16} />
          </button>

          <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50">
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

export default CustomerReceive;



