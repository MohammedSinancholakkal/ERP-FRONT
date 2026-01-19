import React, { useState, useEffect } from "react";
import {
//   Search,
//   Plus,
//   RefreshCw,
//   List,
  X,
  Save,
//   Trash2,
  ArchiveRestore,
  Star,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import FilterBar from "../../components/FilterBar";
import { useTheme } from "../../context/ThemeContext";

import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

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
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import { useDashboard } from "../../context/DashboardContext";

const Expenses = () => {
    const { theme } = useTheme();
  const { invalidateDashboard } = useDashboard();

  // ====================
  // STATES
  // ====================
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [inactiveExpenses, setInactiveExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterExpenseType, setFilterExpenseType] = useState("");
  const [filterPaymentAccount, setFilterPaymentAccount] = useState("");

  // SORT
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  
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
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);


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

    // Duplicate Check
    const existing = expenseTypes.find(
      (t) => (t.typeName || t.type || "").toLowerCase() === expenseTypeCreateName.trim().toLowerCase()
    );
    if (existing) return toast.error("Expense type already exists");

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
        invalidateDashboard();
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
  // ==========================
  // SEARCH
  // ==========================
  const handleSearch = async (txt) => {
    setSearchText(txt);
    if (!txt.trim()) return loadExpenses();

    const res = await searchExpenseApi(txt);
    if (res?.status === 200) {
      setExpenses(res.data);
      // setTotalRecords(res.data.length); // API might return different shape for search
    }
  };

  // --- FILTERED & SORTED LIST (Client-side for current page/search results) ---
  const filteredRows = React.useMemo(() => {
    let list = expenses;

    // We already have searchText handled by API or logic above, 
    // but if we want strictly client-side filtering on the current FETCHED set:
    if (filterExpenseType) {
        list = list.filter(e => e.expenseTypeId === filterExpenseType || (expenseTypes.find(t => (t.typeId ?? t.id) === e.expenseTypeId)?.typeName === filterExpenseType));
    }
    if (filterPaymentAccount) {
        list = list.filter(e => e.paymentAccount === filterPaymentAccount);
    }
    
    return list;
  }, [expenses, filterExpenseType, filterPaymentAccount, expenseTypes]);

  const sortedList = React.useMemo(() => {
    let sortableItems = [...filteredRows];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Derived values for sorting
        if (sortConfig.key === 'expenseType') {
            aValue = expenseTypes.find((t) => (t.typeId ?? t.id) === a.expenseTypeId)?.typeName || "";
            bValue = expenseTypes.find((t) => (t.typeId ?? t.id) === b.expenseTypeId)?.typeName || "";
        }

        if (['id', 'amount'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else {
             aValue = String(aValue || "").toLowerCase();
             bValue = String(bValue || "").toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRows, sortConfig, expenseTypes]);

  // --- FILTER BAR CONFIG ---
   const filters = [
      {
          type: 'select',
          value: filterExpenseType,
          onChange: setFilterExpenseType,
          options: expenseTypes.map(t => ({ id: t.typeId ?? t.id, name: t.typeName })), // Map for consistency if needed, or just use string matching
          placeholder: "All Expense Types"
      },
      {
          type: 'select',
          value: filterPaymentAccount,
          onChange: setFilterPaymentAccount,
          options: [{id: "Cash at Hand", name: "Cash at Hand"}, {id: "Cash at Bank", name: "Cash at Bank"}],
          placeholder: "All Accounts"
      }
  ];

  const handleClearFilters = () => {
    setSearchText("");
    setFilterExpenseType("");
    setFilterPaymentAccount("");
    setSortConfig({ key: null, direction: 'asc' });
    loadExpenses();
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
      invalidateDashboard();
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
      invalidateDashboard();
      setEditModalOpen(false);

      if (showInactive) loadInactive();
      else loadExpenses();
    }
  };

  // ==========================
  // DELETE
  // ==========================
  // ==========================
  // DELETE
  // ==========================
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This record will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteExpenseApi(editExpense.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Deleted");
        invalidateDashboard();
        setEditModalOpen(false);
        loadExpenses();
        if (showInactive) loadInactive();
      }
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Delete failed");
    }
  };

  // ==========================
  // RESTORE
  // ==========================
  const handleRestore = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This record will be restored!",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await restoreExpenseApi(editExpense.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Restored");
        invalidateDashboard();
        setEditModalOpen(false);
        loadExpenses();
        loadInactive();
      }
    } catch (err) {
      console.error("Restore failed", err);
      toast.error("Restore failed");
    }
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <>
      {/* ---------------- ADD EXPENSE MODAL ---------------- */}
{/* ADD MODAL */}
      {/* ---------------- ADD EXPENSE MODAL ---------------- */}
      {/* ADD MODAL */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Expense"
        width="700px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="p-0 space-y-4">
          {/* Expense Type (searchable input + dropdown) */}
          <div>
            <label className="block text-sm mb-1">
              Expense Type <span className="text-red-500">*</span>
            </label>

            <div className="flex items-start gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={
                    expenseTypeOpen
                      ? expenseTypeSearch
                      : newExpense.expenseTypeText
                  }
                  placeholder="Search or type…"
                  onFocus={(e) => {
                    setExpenseTypeOpen(true);
                    setExpenseTypeSearch(newExpense.expenseTypeText || "");
                  }}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setExpenseTypeSearch(typed);
                    const match = expenseTypes.find(
                      (t) =>
                        (t.typeName || "").toLowerCase() === typed.toLowerCase()
                    );
                    setNewExpense((p) => ({
                      ...p,
                      expenseTypeText: typed,
                      expenseTypeId: match ? match.typeId ?? match.id : "",
                    }));
                    setExpenseTypeOpen(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setExpenseTypeOpen(false), 120)
                  }
                  className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
                />

                {expenseTypeOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                    {expenseTypes
                      .filter((t) =>
                        (t.typeName || "")
                          .toLowerCase()
                          .includes((expenseTypeSearch || "").toLowerCase())
                      )
                      .map((t) => (
                        <div
                          key={t.typeId ?? t.id}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                          onMouseDown={() => {
                            const id = t.typeId ?? t.id;
                            setNewExpense((p) => ({
                              ...p,
                              expenseTypeId: id,
                              expenseTypeText: t.typeName,
                            }));
                            setExpenseTypeOpen(false);
                            setExpenseTypeSearch("");
                          }}
                        >
                          {t.typeName}
                        </div>
                      ))}
                    {expenseTypes.filter((t) =>
                      (t.typeName || "")
                        .toLowerCase()
                        .includes((expenseTypeSearch || "").toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-300">No matches</div>
                    )}
                  </div>
                )}
              </div>

              {hasPermission(PERMISSIONS.EXPENSE_TYPES.CREATE) && (
                <button
                  type="button"
                  onClick={() => setShowExpenseTypeCreate(true)}
                  title="Add expense type"
                  className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 flex items-center"
                >
                  <Star size={16} className="text-yellow-300" />
                </button>
              )}
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
              className={`w-full px-3 py-2 rounded border outline-none transition-colors ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
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
              className={`w-full px-3 py-2 rounded border outline-none transition-colors ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
            />
          </div>

          {/* Payment Account (default empty) */}
          <div>
            <label className="block text-sm mb-1">Payment Account *</label>

            <SearchableSelect
              options={[
                { id: "Cash at Hand", name: "Cash at Hand" },
                { id: "Cash at Bank", name: "Cash at Bank" },
              ]}
              value={newExpense.paymentAccount}
              onChange={(val) =>
                setNewExpense((p) => ({ ...p, paymentAccount: val }))
              }
              placeholder="Select Account"
              className="w-full"
              direction="up"
            />
          </div>

          {/* Voucher No removed */}
        </div>
      </AddModal>

{/* ---------------- QUICK-CREATE EXPENSE TYPE MODAL ---------------- */}
{showExpenseTypeCreate && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[70]">
    <div className="w-[500px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
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
          className={`w-full px-3 py-2 rounded border outline-none text-sm ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
        />
      </div>

      <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
        {hasPermission(PERMISSIONS.EXPENSE_TYPES.CREATE) && (
        <button
          onClick={handleCreateExpenseType}
          className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm"
        >
          <Save size={16} /> Save
        </button>
        )}
      </div>
    </div>
  </div>
)}



      {/* ---------------- EDIT EXPENSE MODAL ---------------- */}
{/* EDIT MODAL */}
      {/* ---------------- EDIT EXPENSE MODAL ---------------- */}
      {/* EDIT MODAL */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        isInactive={editExpense.isInactive}
        title={`${editExpense.isInactive ? "Restore Expense" : "Edit Expense"}`}
        permissionDelete={hasPermission(PERMISSIONS.CASH_BANK.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.CASH_BANK.EDIT)}
        width="700px"
      >
        <div className="p-0 space-y-4">
          {/* Expense Type (searchable dropdown) */}
          <div>
            <label className="block text-sm mb-1">Expense Type *</label>

            <input
              type="text"
              list="expenseTypesListEdit"
              value={
                editExpense.expenseTypeId
                  ? expenseTypes.find(
                      (t) => (t.typeId ?? t.id) === editExpense.expenseTypeId
                    )?.typeName || ""
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
                  expenseTypeId: match ? match.typeId ?? match.id : "",
                }));
              }}
              disabled={editExpense.isInactive}
              className={`w-full px-3 py-2 rounded border outline-none disabled:opacity-50 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
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
              className={`w-full px-3 py-2 rounded border outline-none disabled:opacity-50 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
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
              className={`w-full px-3 py-2 rounded border outline-none disabled:opacity-50 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
            />
          </div>

          {/* Payment Account */}
          <div>
            <label className="block text-sm mb-1">Payment Account *</label>

            <SearchableSelect
              options={[
                { id: "Cash at Hand", name: "Cash at Hand" },
                { id: "Cash at Bank", name: "Cash at Bank" },
              ]}
              value={editExpense.paymentAccount}
              onChange={(val) =>
                setEditExpense((p) => ({ ...p, paymentAccount: val }))
              }
              placeholder="Select Account"
              className="w-full"
              direction="up"
            />
          </div>

          {/* Voucher No removed */}
        </div>
      </EditModal>



      {/* ---------------- COLUMN PICKER ---------------- */}
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />


      {/* ---------------- MAIN PAGE ---------------- */}
      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-emerald-50 text-gray-900' : theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2"> 

            <h2 className="text-2xl font-semibold mb-4">Expenses</h2>

            <MasterTable
              columns={[
                visibleColumns.id && { key: "id", label: "ID", sortable: true },
                visibleColumns.expenseType && { key: "expenseType", label: "Expense Type", sortable: true, render: (r) => expenseTypes.find((t) => (t.typeId ?? t.id) === r.expenseTypeId)?.typeName || "-" },
                visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (r) => r.date?.split("T")[0] },
                visibleColumns.paymentAccount && { key: "paymentAccount", label: "Payment Account", sortable: true },
                visibleColumns.amount && { key: "amount", label: "Amount", sortable: true },
              ].filter(Boolean)}
              data={sortedList}
              inactiveData={inactiveExpenses}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(e, isInactive) => openEditModal(e, isInactive)}
              // Action Bar Props
              search={searchText}
              onSearch={handleSearch}
              onCreate={() => { setNewExpense((p) => ({ ...p, date: todayStr })); setModalOpen(true); }}
              createLabel="New Expense"
              permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
              onRefresh={() => {
                setSearchText("");
                if (page === 1) loadExpenses();
                else setPage(1);
              }}
              onColumnSelector={() => {
                  setTempVisibleColumns(visibleColumns);
                  setColumnModalOpen(true);
              }}
              onToggleInactive={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
              }}
            >
              <div className="">
                <FilterBar filters={filters} onClear={handleClearFilters} />
              </div>
            </MasterTable>

            {/* PAGINATION */}
             <Pagination
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  setLimit={setLimit}
                  total={totalRecords}
                  onRefresh={() => {
                      if(page === 1) loadExpenses();
                      else setPage(1);
                  }}
                />

          </div>
        </div>
      </PageLayout>

    </>
  );
};

export default Expenses;



