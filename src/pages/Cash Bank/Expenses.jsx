import React, { useState, useEffect } from "react";
// import {
//   Search,
//   Plus,
//   RefreshCw,
//   List,
//   ArchiveRestore,
// } from "lucide-react";
import { X, Star, Pencil } from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
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
  updateExpenseTypeApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
// import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import { useDashboard } from "../../context/DashboardContext";
import InputField from "../../components/InputField";

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
  const [isEditingType, setIsEditingType] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

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
    try {
      const res = await getExpenseTypesApi(1, 1000); // Fetch enough
      if (res?.status === 200) {
        const items = res.data?.records ?? res.data;
        setExpenseTypes(items || []);
      }
    } catch (err) {
      console.error("loadExpenseTypes error", err);
      setExpenseTypes([]);
    }
  };

  // ========================= CREATE / UPDATE EXPENSE TYPE =========================
  const handleSaveExpenseType = async () => {
    if (!expenseTypeCreateName.trim()) return toast.error("Type required");

    try {
      if (isEditingType) {
          // UPDATE
          const res = await updateExpenseTypeApi(editingTypeId, {
              typeName: expenseTypeCreateName.trim(),
              userId: currentUserId
          });

          if(res?.status === 200) {
             toast.success("Expense type updated");
             // reload
             const listRes = await getExpenseTypesApi(1, 1000);
             const items = listRes?.data?.records ?? listRes?.data ?? [];
             setExpenseTypes(items || []);
             setShowExpenseTypeCreate(false);
             setExpenseTypeCreateName("");
             setIsEditingType(false);
             setEditingTypeId(null);
             invalidateDashboard();
          } else {
             toast.error(res?.response?.data?.message || "Update failed");
          }

      } else {
          // CREATE
        // Duplicate Check
        const existing = expenseTypes.find(
        (t) => (t.typeName || t.type || "").toLowerCase() === expenseTypeCreateName.trim().toLowerCase()
        );
        if (existing) return toast.error("Expense type already exists");

        const res = await addExpenseTypeApi({
            typeName: expenseTypeCreateName.trim(),
            userId: currentUserId,
        });

        if (res?.status === 200 || res?.status === 201) {
            const listRes = await getExpenseTypesApi(1, 1000);
            const items = listRes?.data?.records ?? listRes?.data ?? [];
            setExpenseTypes(items || []);

            const found = (items || []).find(
            (t) => (t.typeName || t.type || "").toLowerCase() === expenseTypeCreateName.trim().toLowerCase()
            );

            if (found) {
            const id = found.typeId ?? found.id;
            if(modalOpen) {
                setNewExpense((p) => ({ ...p, expenseTypeId: id }));
            } else if(editModalOpen) {
                setEditExpense((p) => ({ ...p, expenseTypeId: id }));
            }
            }

            setShowExpenseTypeCreate(false);
            toast.success("Expense type added");
            setExpenseTypeCreateName("");
            invalidateDashboard();
        } else {
            toast.error(res?.response?.data?.message || "Add failed");
        }
      }
    } catch (err) {
      console.error("Save expense type error:", err);
      toast.error("Server error");
    }
  };

  // ==========================
  // DATA LOAD & HANDLING
  // ==========================
  const loadData = async (overrideShowInactive = null) => {
    try {
        const effectiveShowInactive = overrideShowInactive === null ? showInactive : overrideShowInactive;
        
        // In Expenses, we typically have server-side pagination because of volume.
        // DebitVoucher example provided uses getDebitVouchersApi(showInactive) which returns ALL.
        // Assuming Expenses should also follow this pattern if we want "same" behavior, 
        // OR we adapt the pattern to server-side.
        // Given the request "apply the complete feature", and DebitVoucher loads all, 
        // I will attempt to align with that pattern if possible, or adapt the "Single List" approach.
        
        // HOWEVER, Expenses usually has pagination params (page, limit). 
        // If we want exact match to DebitVoucher, we might lose server pagination if DebitVoucher is client-side.
        // Let's stick to Server Pagination but structure props identically where possible.
        
        setSearchText(""); 
        // Fetch Active
        const res = await getExpensesApi(page, limit);
        // Fetch Inactive (if needed or separate?)
        // DebitVoucher does: getDebitVouchersApi(effectiveShowInactive).
        
        // If we want "Same Inactive Row" behavior, we need to pass INACTIVE data to MasterTable.
        let activeRecords = [];
        let inactiveRecords = [];

        if (res?.status === 200) {
            activeRecords = res.data.records || [];
            setTotalRecords(res.data.total || 0);
        }

        if (effectiveShowInactive) {
            const resInactive = await getInactiveExpensesApi();
            if (resInactive?.status === 200) {
                inactiveRecords = resInactive.data.records || resInactive.data || [];
            }
        }
        
        setExpenses(activeRecords);
        setInactiveExpenses(inactiveRecords);

    } catch (err) {
        console.error("loadData error", err);
    }
  };

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, limit, showInactive]);


  // ==========================
  // SEARCH
  // ==========================
  const handleSearch = async (txt) => {
    setSearchText(txt);
    if (!txt.trim()) {
        const res = await getExpensesApi(page, limit);
        if (res?.status === 200) setExpenses(res.data.records || []);
        return;
    }

    const res = await searchExpenseApi(txt);
    if (res?.status === 200) {
      setExpenses(res.data);
      // Search usually returns flat list, so we might set total to length
      // setTotalRecords(res.data.length); 
    }
  };

  // --- FILTERED & SORTED LIST (Client-side for loaded records) ---
  const filteredRows = React.useMemo(() => {
    let list = expenses; // Start with active expenses loaded

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
          options: expenseTypes.map(t => ({ id: t.typeId ?? t.id, name: t.typeName })), 
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

  // Render Helpers
  const expenseTypeOptions = expenseTypes.map(t => ({ id: t.typeId ?? t.id, name: t.typeName }));

  return (
    <>
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Expense"
        width="600px" // Standard width
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="space-y-4">
          {/* Expense Type */}
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <SearchableSelect
                        label="Expense Type *"
                        options={expenseTypeOptions}
                        value={newExpense.expenseTypeId}
                        onChange={(val) => setNewExpense({ ...newExpense, expenseTypeId: val })}
                        placeholder="Select Expense Type"
                    />
                </div>
                {hasPermission(PERMISSIONS.EXPENSE_TYPES.CREATE) && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditingType(false);
                            setExpenseTypeCreateName("");
                            setShowExpenseTypeCreate(true);
                        }}
                         className={`p-2  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        title="New Expense Type"
                    >
                        <Star size={18} />
                    </button>
                )}
            </div>

          {/* Date */}
          <InputField
            label="Date"
            type="date"
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            required
          />

          {/* Amount */}
          <InputField
            label="Amount"
            type="number"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            required
          />

          {/* Payment Account */}
          <div className="block">
             <label className="block text-sm mb-1 text-black font-medium">Payment Account *</label>
             <SearchableSelect
               options={[
                 { id: "Cash at Hand", name: "Cash at Hand" },
                 { id: "Cash at Bank", name: "Cash at Bank" },
               ]}
               value={newExpense.paymentAccount}
               onChange={(val) => setNewExpense({ ...newExpense, paymentAccount: val })}
               placeholder="Select Account"
               direction="down"
             />
          </div>
        </div>
      </AddModal>

    {/* Quick Create Expense Type Modal */}
    {showExpenseTypeCreate && !isEditingType && (
       <AddModal
           isOpen={showExpenseTypeCreate}
           onClose={() => setShowExpenseTypeCreate(false)}
           onSave={handleSaveExpenseType}
           title="New Expense Type"
           width="400px"
           zIndex={1200} // Ensuring it's above the main modal (default 1000)
           permission={hasPermission(PERMISSIONS.EXPENSE_TYPES.CREATE)}
       >
           <div className="pt-2">
                <InputField
                    label="Type Name"
                    value={expenseTypeCreateName}
                    onChange={(e) => setExpenseTypeCreateName(e.target.value)}
                    autoFocus
                    required
                />
           </div>
       </AddModal>
    )}

    {/* Edit Expense Type Modal using EditModal component */}
    {showExpenseTypeCreate && isEditingType && (
        <EditModal
            isOpen={showExpenseTypeCreate}
            onClose={() => setShowExpenseTypeCreate(false)}
            onSave={handleSaveExpenseType}
            title="Edit Expense Type"
            width="400px"
            zIndex={1200} // Ensuring it's above the main modal (default 1000)
            permissionEdit={hasPermission(PERMISSIONS.EXPENSE_TYPES.EDIT)}
            permissionDelete={false} 
            saveText="Update"
        >
             <div className="pt-2">
                <InputField
                    label="Type Name"
                    value={expenseTypeCreateName}
                    onChange={(e) => setExpenseTypeCreateName(e.target.value)}
                    autoFocus
                    required
                />
           </div>
        </EditModal>
    )}

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        isInactive={editExpense.isInactive}
        title={editExpense.isInactive ? "Restore Expense" : "Edit Expense"}
        permissionDelete={hasPermission(PERMISSIONS.CASH_BANK.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.CASH_BANK.EDIT)}
        saveText="Update"
        width="600px"
      >
        <div className="space-y-4">
          <div className="flex items-end gap-2">
             <div className="flex-1">
                <SearchableSelect
                    label="Expense Type *"
                    options={expenseTypeOptions}
                    value={editExpense.expenseTypeId}
                    onChange={(val) => setEditExpense({ ...editExpense, expenseTypeId: val })}
                    placeholder="Select Expense Type"
                    disabled={editExpense.isInactive}
                />
             </div>
             {hasPermission(PERMISSIONS.EXPENSE_TYPES.EDIT) && !editExpense.isInactive && (
                <button
                    type="button"
                    onClick={() => {
                        const typeId = editExpense.expenseTypeId;
                        if(!typeId) {
                            return toast.error("Select a type to edit");
                        }
                        const type = expenseTypes.find(t => (t.typeId ?? t.id) === typeId);
                        if(type) {
                            setIsEditingType(true);
                            setEditingTypeId(typeId);
                            setExpenseTypeCreateName(type.typeName);
                            setShowExpenseTypeCreate(true);
                        }
                    }}
                    className={`p-2  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                    title="Edit Expense Type"
                >
                    <Pencil size={18} />
                </button>
             )}
          </div>

          <InputField
            label="Date"
            type="date"
            value={editExpense.date}
            onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
            disabled={editExpense.isInactive}
            required
          />


          <InputField
            label="Amount"
            type="number"
            value={editExpense.amount}
            onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
            disabled={editExpense.isInactive}
            required
          />

          <div className="block">
             <label className="block text-sm mb-1 text-black font-medium">Payment Account *</label>
             <SearchableSelect
               options={[
                 { id: "Cash at Hand", name: "Cash at Hand" },
                 { id: "Cash at Bank", name: "Cash at Bank" },
               ]}
               value={editExpense.paymentAccount}
               onChange={(val) => setEditExpense({ ...editExpense, paymentAccount: val })}
               placeholder="Select Account"
               disabled={editExpense.isInactive}
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

      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
             <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2"> 
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Expenses</h2>
            <hr className="mb-4 border-gray-300" />

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
              
              page={page}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              total={totalRecords}
            >
              <div className="">
                <FilterBar filters={filters} onClear={handleClearFilters} />
              </div>
            </MasterTable>

          </div>
          </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default Expenses;
