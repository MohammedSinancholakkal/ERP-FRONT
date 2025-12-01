import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  addExpenseApi,
  getExpensesApi,
  updateExpenseApi,
  deleteExpenseApi,
  searchExpenseApi,
  getInactiveExpensesApi,
  restoreExpenseApi,
  getExpenseTypesApi,
  addExpenseTypeApi,
} from "../../services/allAPI";

const Expenses = () => {
  // ====================
  // STATES
  // ====================
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [inactiveExpenses, setInactiveExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");
  
  // local UI for add modal expense type dropdown
  const [expenseTypeOpen, setExpenseTypeOpen] = useState(false);
  const [expenseTypeSearch, setExpenseTypeSearch] = useState("");

  // edit form
  const [editExpense, setEditExpense] = useState({
    id: null,
    expenseTypeId: "",
    date: "",
    amount: "",
    paymentAccount: "",
    isInactive: false,
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const [newExpense, setNewExpense] = useState({
  expenseTypeId: "",
  expenseTypeText: "",
  date: todayStr,
  amount: "",
  paymentAccount: "",
});

  // quick-create modal for Expense Type
  const [showExpenseTypeCreate, setShowExpenseTypeCreate] = useState(false);
  const [expenseTypeCreateName, setExpenseTypeCreateName] = useState("");


  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // column picker
  const defaultColumns = {
    id: true,
    expenseType: true,
    date: true,
    paymentAccount: true,
    amount: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (c) => {
    setVisibleColumns((prev) => ({ ...prev, [c]: !prev[c] }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  // ==========================
  // LOAD EXPENSE TYPES
  // ==========================
  const loadExpenseTypes = async () => {
    // Use the paginated API but request a large limit so we get all types
    // (the API returns { records, total } or array directly depending on endpoint)
    try {
      const res = await getExpenseTypesApi(1, 5000);
      if (res?.status === 200) {
        const items = res.data?.records ?? res.data;
        setExpenseTypes(items || []);
      }
    } catch (err) {
      console.error("loadExpenseTypes error", err);
      setExpenseTypes([]);
    }
  };

  // ========================= CREATE EXPENSE TYPE (quick-create from Add modal) =========================
  const handleCreateExpenseType = async () => {
    if (!expenseTypeCreateName.trim()) return toast.error("Type required");

    try {
      const res = await addExpenseTypeApi({
        typeName: expenseTypeCreateName.trim(),
        userId: currentUserId,
      });

      if (res?.status === 200 || res?.status === 201) {
        // reload full list and pick the created one
        const listRes = await getExpenseTypesApi(1, 5000);
        const items = listRes?.data?.records ?? listRes?.data ?? [];
        setExpenseTypes(items || []);

        const found = (items || []).find(
          (t) => (t.typeName || t.type || "").toLowerCase() === expenseTypeCreateName.trim().toLowerCase()
        );

        if (found) {
          const id = found.typeId ?? found.id;
          setNewExpense((p) => ({ ...p, expenseTypeId: id, expenseTypeText: found.typeName ?? found.type }));
        }

        setShowExpenseTypeCreate(false);
        toast.success("Expense type added");
        setExpenseTypeCreateName("");
      } else {
        toast.error(res?.response?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("Create expense type error:", err);
      toast.error("Server error");
    }
  };

  // ==========================
  // LOAD EXPENSES
  // ==========================
  const loadExpenses = async () => {
    setSearchText("");
    const res = await getExpensesApi(page, limit);

    if (res?.status === 200) {
      setExpenses(res.data.records || []);
      setTotalRecords(res.data.total || 0);
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveExpensesApi();
    if (res?.status === 200) {
      setInactiveExpenses(res.data.records || res.data);
    }
  };

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  useEffect(() => {
    if (showInactive) loadInactive();
    else loadExpenses();
  }, [page, limit, showInactive]);

  // ==========================
  // SEARCH
  // ==========================
  const handleSearch = async (txt) => {
    setSearchText(txt);

    if (!txt.trim()) return loadExpenses();

    const res = await searchExpenseApi(txt);
    if (res?.status === 200) {
      setExpenses(res.data);
      setTotalRecords(res.data.length);
    }
  };

  // ==========================
  // ADD
  // ==========================
  const handleAdd = async () => {
    const { expenseTypeId, date, amount, paymentAccount } = newExpense;

    if (!expenseTypeId || !date || !amount) {
      return toast.error("Please fill required fields");
    }

    const res = await addExpenseApi({
      expenseTypeId,
      date,
      amount,
      paymentAccount,
      userId: currentUserId,
    });
    console.log(res);
    

    if (res?.status === 200) {
      setModalOpen(false);
      toast.success("Expense added");
      setPage(1);
      loadExpenses();
      setNewExpense({
        expenseTypeId: "",
        date: todayStr,
        amount: "",
        paymentAccount: "",
        expenseTypeText: "",
      });
    }
  };

  // ==========================
  // OPEN EDIT
  // ==========================
  const openEditModal = (exp, inactive) => {
    setEditExpense({
      id: exp.id,
      expenseTypeId: exp.expenseTypeId,
      date: exp.date?.split("T")[0],
      amount: exp.amount,
      paymentAccount: exp.paymentAccount,
      isInactive: inactive,
    });

    setEditModalOpen(true);
  };

  // ==========================
  // UPDATE
  // ==========================
  const handleUpdate = async () => {
    const res = await updateExpenseApi(editExpense.id, {
      expenseTypeId: editExpense.expenseTypeId,
      date: editExpense.date,
      amount: editExpense.amount,
      paymentAccount: editExpense.paymentAccount,
      userId: currentUserId,
    });

    if (res?.status === 200) {
      toast.success("Expense updated");
      setEditModalOpen(false);

      if (showInactive) loadInactive();
      else loadExpenses();
    }
  };

  // ==========================
  // DELETE
  // ==========================
  const handleDelete = async () => {
    const res = await deleteExpenseApi(editExpense.id, {
      userId: currentUserId,
    });

    if (res?.status === 200) {
      toast.success("Deleted");
      setEditModalOpen(false);
      loadExpenses();
    }
  };

  // ==========================
  // RESTORE
  // ==========================
  const handleRestore = async () => {
    const res = await restoreExpenseApi(editExpense.id, {
      userId: currentUserId,
    });

    if (res?.status === 200) {
      toast.success("Restored");
      setEditModalOpen(false);
      loadExpenses();
      loadInactive();
    }
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <>
      {/* ---------------- ADD EXPENSE MODAL ---------------- */}
{/* ADD MODAL */}
{/* ADD MODAL */}
{modalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999]">
    <div className="w-[650px] max-h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">New Expense</h2>
        <button onClick={() => setModalOpen(false)}>
          <X size={20} className="text-gray-300 hover:text-white" />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-4 overflow-y-auto">

        {/* Expense Type (searchable input + dropdown) */}
        <div>
          <label className="block text-sm mb-1">
            Expense Type <span className="text-red-500">*</span>
          </label>

          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={expenseTypeOpen ? expenseTypeSearch : newExpense.expenseTypeText}
                placeholder="Search or type…"
                onFocus={(e) => { setExpenseTypeOpen(true); setExpenseTypeSearch(newExpense.expenseTypeText || ""); }}
                onChange={(e) => {
                  const typed = e.target.value;
                  setExpenseTypeSearch(typed);
                  const match = expenseTypes.find(
                    (t) => (t.typeName || "").toLowerCase() === typed.toLowerCase()
                  );
                  setNewExpense((p) => ({
                    ...p,
                    expenseTypeText: typed,
                    expenseTypeId: match ? (match.typeId ?? match.id) : "",
                  }));
                  setExpenseTypeOpen(true);
                }}
                onBlur={() => setTimeout(() => setExpenseTypeOpen(false), 120)}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
              />

              {expenseTypeOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                  {expenseTypes.filter((t) =>
                    (t.typeName || "").toLowerCase().includes((expenseTypeSearch || "").toLowerCase())
                  ).map((t) => (
                    <div
                      key={t.typeId ?? t.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                      onMouseDown={() => {
                        const id = t.typeId ?? t.id;
                        setNewExpense((p) => ({ ...p, expenseTypeId: id, expenseTypeText: t.typeName }));
                        setExpenseTypeOpen(false);
                        setExpenseTypeSearch("");
                      }}
                    >
                      {t.typeName}
                    </div>
                  ))}
                  {expenseTypes.filter((t) => (t.typeName || "").toLowerCase().includes((expenseTypeSearch || "").toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-gray-300">No matches</div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowExpenseTypeCreate(true)}
              title="Add expense type"
              className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 flex items-center"
            >
              <Star size={16} className="text-yellow-300" />
            </button>
          </div>
        </div>

        {/* Date (selectable + typable) */}
        <div>
          <label className="block text-sm mb-1">
            Date <span className="text-red-500">*</span>
          </label>

          <input
            type="date"
            value={newExpense.date}
            onChange={(e) =>
              setNewExpense((p) => ({ ...p, date: e.target.value }))
            }
            className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm mb-1">
            Amount <span className="text-red-500">*</span>
          </label>

          <input
            type="number"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense((p) => ({ ...p, amount: e.target.value }))
            }
            className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
          />
        </div>

        {/* Payment Account (default empty) */}
        <div>
          <label className="block text-sm mb-1">Payment Account *</label>

          <select
            value={newExpense.paymentAccount}
            onChange={(e) =>
              setNewExpense((p) => ({
                ...p,
                paymentAccount: e.target.value,
              }))
            }
            className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
          >
            <option value="">--select--</option>
            <option value="Cash at Hand">Cash at Hand</option>
            <option value="Cash at Bank">Cash at Bank</option>
          </select>
        </div>

        {/* Voucher No removed */}
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm"
        >
          <Save size={16} /> Save
        </button>
      </div>
    </div>
  </div>
)}

{/* ---------------- QUICK-CREATE EXPENSE TYPE MODAL ---------------- */}
{showExpenseTypeCreate && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[10000]">
    <div className="w-[420px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
      <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">New Expense Type</h2>
        <button onClick={() => setShowExpenseTypeCreate(false)}>
          <X size={20} className="text-gray-300 hover:text-white" />
        </button>
      </div>

      <div className="p-6">
        <label className="block text-sm mb-1">Type <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={expenseTypeCreateName}
          onChange={(e) => setExpenseTypeCreateName(e.target.value)}
          placeholder="Enter type"
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
        <button
          onClick={handleCreateExpenseType}
          className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm"
        >
          <Save size={16} /> Save
        </button>
      </div>
    </div>
  </div>
)}



      {/* ---------------- EDIT EXPENSE MODAL ---------------- */}
{/* EDIT MODAL */}
{/* EDIT MODAL */}
{editModalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999]">
    <div className="w-[650px] max-h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">
          {editExpense.isInactive ? "Restore Expense" : "Edit Expense"}
        </h2>
        <button onClick={() => setEditModalOpen(false)}>
          <X size={20} className="text-gray-300 hover:text-white" />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-4 overflow-y-auto">

        {/* Expense Type (searchable dropdown) */}
        <div>
          <label className="block text-sm mb-1">Expense Type *</label>

          <input
            type="text"
            list="expenseTypesListEdit"
            value={
              editExpense.expenseTypeId
                ? expenseTypes.find((t) => (t.typeId ?? t.id) === editExpense.expenseTypeId)?.typeName || ""
                : ""
            }
            placeholder="Search or type…"
            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
            onChange={(e) => {
              const typed = e.target.value;

              const match = expenseTypes.find(
                (t) => t.typeName.toLowerCase() === typed.toLowerCase()
              );

              setEditExpense((p) => ({
                ...p,
                expenseTypeId: match ? (match.typeId ?? match.id) : "",
              }));
            }}
            disabled={editExpense.isInactive}
            className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded disabled:opacity-50"
          />

          <datalist id="expenseTypesListEdit">
                {expenseTypes.map((t) => (
              <option key={t.typeId ?? t.id} value={t.typeName} />
            ))}
          </datalist>
        </div>

        {/* Date (selectable + typable) */}
        <div>
          <label className="block text-sm mb-1">Date *</label>

          <input
            type="date"
            value={editExpense.date}
            onChange={(e) =>
              setEditExpense((p) => ({ ...p, date: e.target.value }))
            }
            disabled={editExpense.isInactive}
            className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded disabled:opacity-50"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm mb-1">Amount *</label>

          <input
            type="number"
            value={editExpense.amount}
            onChange={(e) =>
              setEditExpense((p) => ({ ...p, amount: e.target.value }))
            }
            disabled={editExpense.isInactive}
            className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded disabled:opacity-50"
          />
        </div>

        {/* Payment Account */}
        <div>
          <label className="block text-sm mb-1">Payment Account *</label>

          <select
            value={editExpense.paymentAccount}
            onChange={(e) =>
              setEditExpense((p) => ({ ...p, paymentAccount: e.target.value }))
            }
            disabled={editExpense.isInactive}
            className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded disabled:opacity-50"
          >
            <option value="">--select--</option>
            <option value="Cash at Hand">Cash at Hand</option>
            <option value="Cash at Bank">Cash at Bank</option>
          </select>
        </div>

        {/* Voucher No removed */}
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
        {editExpense.isInactive ? (
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 bg-green-700 px-4 py-2 border border-green-900 rounded"
          >
            <ArchiveRestore size={16} /> Restore
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}

        {!editExpense.isInactive && (
          <button
            onClick={handleUpdate}
            className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
          >
            <Save size={16} /> Save
          </button>
        )}
      </div>
    </div>
  </div>
)}



      {/* ---------------- COLUMN PICKER ---------------- */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                placeholder="search columns..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-60 bg-gray-900 border border-gray-700 px-3 py-2 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 px-5 pb-5">
              {/* Visible */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((c) => visibleColumns[c])
                  .filter((c) => c.includes(searchColumn))
                  .map((c) => (
                    <div key={c} className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2">
                      <span>{c.toUpperCase()}</span>
                      <button className="text-red-400" onClick={() => toggleColumn(c)}>
                        ✖
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">Hidden Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((c) => !visibleColumns[c])
                  .filter((c) => c.includes(searchColumn))
                  .map((c) => (
                    <div key={c} className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2">
                      <span>{c.toUpperCase()}</span>
                      <button className="text-green-400" onClick={() => toggleColumn(c)}>
                        ➕
                      </button>
                    </div>
                  ))}

                {Object.keys(visibleColumns).filter((c) => !visibleColumns[c]).length === 0 && (
                  <p className="text-gray-400 text-sm">No hidden columns</p>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={restoreDefaultColumns} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">
                Restore Defaults
              </button>
              <button onClick={() => setColumnModal(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MAIN PAGE ---------------- */}
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Expenses</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* SEARCH */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-60">
              <Search size={16} className="text-gray-300" />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent outline-none pl-2 text-gray-200 w-full text-sm"
              />
            </div>

            {/* ADD */}
            <button
              onClick={() => { setNewExpense((p) => ({ ...p, date: todayStr })); setModalOpen(true); }}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"
            >
              <Plus size={16} /> New Expense
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadExpenses();
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* COLUMN PICKER */}
            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <List size={16} className="text-blue-300" />
            </button>

            {/* INACTIVE */}
            <button
              onClick={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
            </button>
          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto">
            <table className="min-w-[800px] w-max text-sm border-separate border-spacing-y-1">
              <thead className="sticky top-0 bg-gray-900 text-white z-10">
                <tr>
                  {visibleColumns.id && (
                    <th className="pb-1 border-b border-white text-center">ID</th>
                  )}
                  {visibleColumns.expenseType && (
                    <th className="pb-1 border-b border-white text-center">Expense Type</th>
                  )}
                  {visibleColumns.date && (
                    <th className="pb-1 border-b border-white text-center">Date</th>
                  )}
                  {visibleColumns.paymentAccount && (
                    <th className="pb-1 border-b border-white text-center">Payment Account</th>
                  )}
                  {visibleColumns.amount && (
                    <th className="pb-1 border-b border-white text-center">Amount</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {!showInactive &&
                  expenses.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => openEditModal(e, false)}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center">{e.id}</td>
                      )}
                      {visibleColumns.expenseType && (
                                <td className="px-2 py-1 text-center">
                                  {
                                    expenseTypes.find((t) => (t.typeId ?? t.id) === e.expenseTypeId)
                                      ?.typeName
                                  }
                                </td>
                      )}
                      {visibleColumns.date && (
                        <td className="px-2 py-1 text-center">
                          {e.date?.split("T")[0]}
                        </td>
                      )}
                      {visibleColumns.paymentAccount && (
                        <td className="px-2 py-1 text-center">
                          {e.paymentAccount}
                        </td>
                      )}
                      {visibleColumns.amount && (
                        <td className="px-2 py-1 text-center">{e.amount}</td>
                      )}
                    </tr>
                  ))}

                {showInactive &&
                  inactiveExpenses.map((e) => (
                    <tr
                      key={`inactive-${e.id}`}
                      onClick={() => openEditModal(e, true)}
                      className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center">{e.id}</td>
                      )}
                      {visibleColumns.expenseType && (
                                <td className="px-2 py-1 text-center">
                                  {
                                    expenseTypes.find((t) => (t.typeId ?? t.id) === e.expenseTypeId)
                                      ?.typeName
                                  }
                                </td>
                      )}
                      {visibleColumns.date && (
                        <td className="px-2 py-1 text-center">
                          {e.date?.split("T")[0]}
                        </td>
                      )}
                      {visibleColumns.paymentAccount && (
                        <td className="px-2 py-1 text-center">
                          {e.paymentAccount}
                        </td>
                      )}
                      {visibleColumns.amount && (
                        <td className="px-2 py-1 text-center">{e.amount}</td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION (active only) */}
          {!showInactive && (
            <div className="mt-5 sticky bottom-0 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                {/* previous */}
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
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 1 && v <= totalPages) setPage(v);
                  }}
                  className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
                />

                <span>/ {totalPages}</span>

                {/* next */}
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

                <button
                  onClick={() => {
                    setSearchText("");
                    setPage(1);
                    loadExpenses();
                  }}
                  className="p-1 bg-gray-800 border border-gray-700 rounded"
                >
                  <RefreshCw size={16} />
                </button>

                <span>
                  Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b>{" "}
                  of <b>{totalRecords}</b> records
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Expenses;
