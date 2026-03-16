// src/pages/accounts/DebitVoucher.jsx
import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageLayout from "../../layout/PageLayout";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { showSuccessToast, showErrorToast, showDeleteConfirm, showRestoreConfirm } from "../../utils/notificationUtils";
import { 
  getDebitVouchersApi, 
  addDebitVoucherApi, 
  getCOAHeadsApi 
} from "../../services/allAPI"; 
import SearchableSelect from "../../components/SearchableSelect"; 

const DebitVoucher = () => {
  const { theme } = useTheme();

  // -----------------------------------
  // VISIBILITY COLS
  // -----------------------------------
  const defaultColumns = {
    id: true,
    vno: true,
    vtype: true,
    date: true,
    account: true,
    remark: true,
    debit: true,
    credit: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // -----------------------------------
  // DATA STATES
  // -----------------------------------
  const [dataList, setDataList] = useState([]);
  // const [showInactive, setShowInactive] = useState(false); // Removed Inactive toggle
  const [coaList, setCoaList] = useState([]); // Store COA heads
  
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });


  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setPage(1);
    setSortConfig({ key, direction });
  };

  const filteredList = dataList.filter(item => {
     if(!searchText) return true;
     const lowerSearch = searchText.toLowerCase();
     return (
         (item.vno?.toLowerCase() || "").includes(lowerSearch) ||
         (item.creditAccountHead?.toLowerCase() || "").includes(lowerSearch) ||
         (item.account?.toLowerCase() || "").includes(lowerSearch) ||
         (item.remark?.toLowerCase() || "").includes(lowerSearch) ||
         (item.amount?.toString() || "").includes(lowerSearch)
     );
  });

  // -----------------------------------
  // HANDLERS
  // -----------------------------------
  const loadData = async (newSort = sortConfig) => {
    try {
      const res = await getDebitVouchersApi(false, newSort.key, newSort.direction);
      if (res && res.status === 200) {
        // Validate that data is an array and NOT a string (which happens if server returns HTML)
        if (Array.isArray(res.data) && (res.data.length === 0 || typeof res.data[0] === 'object')) {
             setDataList(res.data);
        } else {
             console.error("Invalid data format received:", res.data);
             setDataList([]); // Safety fallback
             // Optionally show error if it's likely a config issue
             if (typeof res.data === 'string') {
                 showErrorToast("Server API mistmatch - Please Restart Server");
             }
        }
      } else {
        showErrorToast("Failed to load debit vouchers");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Error loading data");
    }
  };

  React.useEffect(() => {
    loadData();
  }, [sortConfig]);


  // Fetch COA Heads
  React.useEffect(() => {
    const fetchCoa = async () => {
        try {
            const res = await getCOAHeadsApi();
            if (res.status === 200) {
                setDataList((prev) => prev); // minor no-op to avoid unused var if strict
                setCoaList(res.data);
            }
        } catch (err) {
            console.error("Failed to load COA", err);
        }
    };
    fetchCoa();
  }, []);

  // -----------------------------------
  // MODAL STATES
  // -----------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [form, setForm] = useState({
    id: null,
    date: new Date().toISOString().split("T")[0],
    creditAccountHead: "",
    account: "",
    amount: "",
    remark: "",
    isActive: true
  });


  const accountOptions = ["Cash at Hand", "Cash at Bank"];

  const resetForm = () => {
    setForm({
        id: null,
        date: new Date().toISOString().split("T")[0],
        creditAccountHead: "",
        account: "",
        amount: "",
        remark: "",
        isActive: true
    });
  };

  // -----------------------------------
  // FILTERED COA LIST FOR DEBIT VOUCHER
  // -----------------------------------
  const filteredCoaList = React.useMemo(() => {
    if (!coaList || coaList.length === 0) return [];

    // 1. Find the parent codes we want to allow
    const allowedRoots = coaList.filter(coa => {
        const name = (coa.headName || '').toLowerCase();
        const type = (coa.headType || '');

        return (
            name === 'expense' || type === 'e' || type === 'exp' || // Expenses
            name.includes('liabilit') ||                            // Liabilities (Current Liability, Non Current, etc. but usually just Liability)
            name.includes('payable') ||                             // Account Payable / Accounts Payable
            name === 'equity' || type === 'eq' ||                   // Equity
            name === 'inventory'                                    // Inventory
        );
    }).map(coa => coa.headCode);

    // 2. Filter the entire list to only show items that START WITH any allowed root code
    // This automatically includes the root itself and all its nested children
    return coaList.filter(coa => {
        return allowedRoots.some(rootCode => strStartsWith(coa.headCode, rootCode));
    });
  }, [coaList]);

  // Helper string startsWith
  function strStartsWith(str, prefix) {
      if (!str || !prefix) return false;
      return String(str).startsWith(String(prefix));
  }

  // ...

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };



  const handleSave = async () => {
    if(!form.creditAccountHead || !form.account || !form.amount || !form.date || !form.remark) {
        showErrorToast("Please fill all required fields");
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const payload = { ...form, userId: user?.userId || 1 };
        
        // Only adding functionality is needed now since edit is removed
        const res = await addDebitVoucherApi(payload);

        if(res && (res.status === 200 || res.status === 201)){
            showSuccessToast("Created Successfully");
            setModalOpen(false);
            await loadData();
        } else {
            showErrorToast("Operation Failed");
        }
    } catch (err) {
        console.error(err);
        showErrorToast("Server Error");
    }
  };

  // Removed Edit/Delete/Restore handlers as per request

  // -----------------------------------
  // COLUMNS CONFIG
  // -----------------------------------
  const columns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true, render: (item) => item.id || item.Id },
    visibleColumns.vno && { key: "vno", label: "V No", sortable: true, render: (item) => item.vno || item.VNo },
    visibleColumns.vtype && { key: "vtype", label: "V Type", sortable: true, render: (item) => item.vtype || item.VType },
    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (item) => new Date(item.date || item.Date).toLocaleDateString() },
    visibleColumns.account && { key: "account", label: "Account Head", sortable: true, render: (item) => item.account },
    visibleColumns.remark && { key: "remark", label: "Remark", sortable: true, render: (item) => item.remark },
    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true, render: (item) => (item.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    visibleColumns.credit && { key: "credit", label: "Credit", sortable: true, render: (item) => (item.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  ].filter(Boolean);

  // -----------------------------------
  // RENDER HELPERS
  // -----------------------------------
  const renderModalContent = () => (
      <div className="space-y-4">
        <div>
           <InputField
             label="Date"
             type="date"
             value={form.date}
             onChange={(e) => setForm({ ...form, date: e.target.value })}
             disabled={!form.isActive}
             required
           />
        </div>
        <div>
           {/* Swapped: This maps to CreditAccountHead in backend (Source), but labeled Debit Account Head per user request */}
           <SearchableSelect 
              label="Debit Account Head"
              required
              options={[
                  { id: 'Cash at Hand', name: 'Cash at Hand' },
                  { id: 'Cash at Bank', name: 'Cash at Bank' }
              ]}
              value={form.creditAccountHead}
              onChange={(val) => setForm({ ...form, creditAccountHead: val })}
              disabled={!form.isActive}
              placeholder="Select Payment Source"
           />
        </div>
        <div>
           {/* Swapped: This maps to Account in backend (Destination/Expense), updated to use SearchableSelect with COA */}
           <SearchableSelect 
               label="Account"
               required
               options={filteredCoaList.map(h => ({
                   id: h.headName, // Backend expects Name
                   name: `${h.headCode} - ${h.headName}`
               }))}
               value={form.account}
               onChange={(val) => setForm({ ...form, account: val })}
               disabled={!form.isActive}
               placeholder="Select Account Head"
            />
        </div>
        <div>
           <InputField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={!form.isActive}
              required
              formatted
           />
        </div>
        <div>
            <label className={`text-sm font-medium block mb-1 ${theme === 'dark' ? 'text-white' : theme === 'purple' ? 'text-purple-900' : 'text-black'}`}>Remarks *</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              disabled={!form.isActive}
              className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors h-24 ${
                  theme === "emerald"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                    : theme === "purple"
                    ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                    : "bg-gray-800 border-gray-700 text-white"
              } ${!form.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
         </div>
      </div>
  );

  return (
    <PageLayout>
        {/* ADD MODAL */}
        <AddModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            title="New Debit Voucher"
            permission={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
        >
             {renderModalContent()}
        </AddModal>
        
        {/* EDIT MODAL REMOVED */}

        {/* COLUMN PICKER */}
        <ColumnPickerModal
            isOpen={columnModalOpen}
            onClose={() => setColumnModalOpen(false)}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            defaultColumns={defaultColumns}
        />

        {/* MAIN CONTENT */}
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
            <ContentCard>
                <div className="flex flex-col h-full overflow-hidden gap-2">
                    <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Debit Voucher</h2>
                    <hr className="mb-4 border-gray-300" />
            
                    <MasterTable
                        columns={columns}
                        data={filteredList.filter(item => item.isActive)}
                        // inactiveData={filteredList.filter(item => !item.isActive)}
                        
                        search={searchText}
                        onSearch={setSearchText}
                        
                        onCreate={handleOpenAdd}
                        createLabel="New Voucher"
                        permissionCreate={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
                        
                        onRefresh={async () => {
                            setSearchText("");
                            setPage(1);
                            setLimit(25);
                            const newSort = { key: "id", direction: "desc" };
                            setSortConfig(newSort);
                            await loadData(newSort);
                        }}
                        onColumnSelector={() => setColumnModalOpen(true)}
                        // onToggleInactive={() => setShowInactive(!showInactive)}
                        // showInactive={showInactive}
                        
                        
                        // onRowClick={handleRowClick}
                        
                        sortConfig={sortConfig}
                        onSort={handleSort}

                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        total={dataList.length}
                    />
                </div>
            </ContentCard>
        </div>
    </PageLayout>
  );
};

export default DebitVoucher;
