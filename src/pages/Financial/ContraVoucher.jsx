// src/pages/accounts/ContraVoucher.jsx
import React, { useState, useEffect } from "react";
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
  getContraVouchersApi, 
  addContraVoucherApi, 
  updateContraVoucherApi, 
  deleteContraVoucherApi,
  restoreContraVoucherApi,
  getBanksDropdownApi
} from "../../services/allAPI"; 
import SearchableSelect from "../../components/SearchableSelect";

const ContraVoucher = () => {
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
    debit: true,
    credit: true,
    remark: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // -----------------------------------
  // DATA STATES
  // -----------------------------------
  const [dataList, setDataList] = useState([]);
  const [bankList, setBankList] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });


  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedList = [...dataList].sort((a, b) => { 
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
  });

  // -----------------------------------
  // HANDLERS
  // -----------------------------------
  const loadData = async (overrideShowInactive = null, overrideSearchText = null) => {
    try {
      const effectiveShowInactive = overrideShowInactive === null ? showInactive : overrideShowInactive;
      const effectiveSearch = overrideSearchText === null ? searchText : overrideSearchText;

      const res = await getContraVouchersApi(effectiveShowInactive, effectiveSearch, sortConfig.key, sortConfig.direction);
      
      if (res && res.status === 200) {
        if (Array.isArray(res.data) && (res.data.length === 0 || typeof res.data[0] === 'object')) {
             setDataList(res.data);
        } else {
             console.error("Invalid data format received:", res.data);
             setDataList([]); 
             if (typeof res.data === 'string') {
                 showErrorToast("Server API mistmatch - Please Restart Server");
             }
        }
      } else {
        showErrorToast("Failed to load contra vouchers");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Error loading data");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        loadData();
    }, 400); 
    return () => clearTimeout(timer);
  }, [showInactive, searchText, sortConfig]);

  useEffect(() => {
    const fetchBanks = async () => {
        try {
            const res = await getBanksDropdownApi();
            if (res.status === 200) {
                setBankList(res.data);
            }
        } catch (err) {
            console.error("Failed to load banks", err);
        }
    };
    fetchBanks();
  }, []);

  // -----------------------------------
  // MODAL STATES
  // -----------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    date: new Date().toISOString().split("T")[0],
    creditType: "", // 'Cash at Hand' or 'Cash at Bank'
    creditBank: "", // If 'Cash at Bank', stores bank name
    debitType: "",  // 'Cash at Hand' or 'Cash at Bank'
    debitBank: "",  // If 'Cash at Bank', stores bank name
    amount: "",
    remark: "",
    isActive: true
  });

  const accountOptions = [
      { id: 'Cash at Hand', name: 'Cash at Hand' },
      { id: 'Cash at Bank', name: 'Cash at Bank' }
  ];

  const resetForm = () => {
    setForm({
        id: null,
        date: new Date().toISOString().split("T")[0],
        creditType: "",
        creditBank: "",
        debitType: "",
        debitBank: "",
        amount: "",
        remark: "",
        isActive: true
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleRowClick = (item) => {
      // Row click to edit is disabled for Contra Vouchers because the table now
      // displays individual debit/credit transaction lines rather than the grouped
      // voucher summary needed to populate the form.
      // If edit is needed in the future, we would need to fetch the grouped
      // voucher data by VNo first.
  };

  const handleSave = async (e) => {
    if(e && e.preventDefault) e.preventDefault();
    if(!form.creditType || !form.debitType || !form.date || !form.amount) {
        showErrorToast("Please fill all required fields");
        return;
    }

    if(form.creditType === 'Cash at Bank' && !form.creditBank) {
        showErrorToast("Please select a Source Bank"); return;
    }
    if(form.debitType === 'Cash at Bank' && !form.debitBank) {
        showErrorToast("Please select a Destination Bank"); return;
    }
    
    const finalCreditAccount = form.creditType === 'Cash at Bank' ? form.creditBank : 'Cash at Hand';
    const finalDebitAccount = form.debitType === 'Cash at Bank' ? form.debitBank : 'Cash at Hand';

    // Prevent same account transfer
    if(finalCreditAccount === finalDebitAccount) {
         showErrorToast("Source and Destination accounts cannot be the same");
         return;
    }

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const payload = { 
            ...form, 
            creditAccount: finalCreditAccount,
            debitAccount: finalDebitAccount,
            userId: user?.userId || 1 
        };
        
        let res;
        if(form.id) {
            res = await updateContraVoucherApi(form.id, payload);
        } else {
            res = await addContraVoucherApi(payload);
        }

        if(res && (res.status === 200 || res.status === 201)){
            showSuccessToast(form.id ? "Updated Successfully" : "Created Successfully");
            setModalOpen(false);
            setEditModalOpen(false);
            await loadData();
        } else {
            showErrorToast("Operation Failed");
        }
    } catch (err) {
        console.error(err);
        showErrorToast("Server Error");
    }
  };

  const handleDelete = async () => {
      const result = await showDeleteConfirm();
      if (!result.isConfirmed) return;

      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await deleteContraVoucherApi(form.id, { userId: user?.userId || 1 });
        if(res && res.status === 200) {
             showSuccessToast("Deleted Successfully");
             setEditModalOpen(false);
             await loadData();
        } else {
             showErrorToast("Delete Failed");
        }
      } catch (err) {
          console.error(err);
          showErrorToast("Server Error");
      }
  };

  const handleRestore = async () => {
      const result = await showRestoreConfirm();
      if (!result.isConfirmed) return;

      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await restoreContraVoucherApi(form.id, { userId: user?.userId || 1 });
        if(res && res.status === 200) {
             showSuccessToast("Restored Successfully");
             setEditModalOpen(false);
             await loadData();
        } else {
             showErrorToast("Restore Failed");
        }
      } catch (err) {
          console.error(err);
          showErrorToast("Server Error");
      }
  };

  // -----------------------------------
  // COLUMNS CONFIG
  // -----------------------------------
  const columns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true, render: (item) => item.id },
    visibleColumns.vno && { key: "vno", label: "V No", sortable: true, render: (item) => item.vno },
    visibleColumns.vtype && { key: "vtype", label: "V Type", sortable: true, render: (item) => item.vtype },
    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (item) => new Date(item.date).toLocaleDateString() },
    visibleColumns.account && { key: "account", label: "Account", sortable: true, render: (item) => {
        if (item.debit > 0) {
            return `${item.account} A/c Dr`;
        } else if (item.credit > 0) {
            return `To ${item.account} A/c`;
        }
        return item.account;
    } }, // ID or Name from Transaction
    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true, render: (item) => (item.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    visibleColumns.credit && { key: "credit", label: "Credit", sortable: true, render: (item) => (item.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    visibleColumns.remark && { key: "remark", label: "Remark", sortable: true, render: (item) => item.remark },
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
        
        <div className="grid grid-cols-2 gap-4">
            <div>
               <SearchableSelect 
                  label="Credit Account (Source)"
                  placeholder="Select Source Type"
                  options={accountOptions}
                  value={form.creditType}
                  onChange={(val) => {
                      setForm({ ...form, creditType: val, creditBank: val === 'Cash at Bank' ? form.creditBank : "" });
                  }}
                  disabled={!form.isActive}
                  required
               />
               <p className="text-xs text-gray-500 mt-1">Money goes OUT from here</p>

               {form.creditType === 'Cash at Bank' && (
                  <div className="mt-3">
                      <SearchableSelect 
                          label="Select Source Bank"
                          placeholder="Select Bank"
                          options={bankList.filter(b => b.IsInternalBank || b.IsCompanyBank).map(b => ({ id: b.BankName, name: b.BankName }))}
                          value={form.creditBank}
                          onChange={(val) => setForm({ ...form, creditBank: val })}
                          disabled={!form.isActive}
                          required
                      />
                  </div>
               )}
            </div>
            <div>
               <SearchableSelect 
                  label="Debit Account (Destination)"
                  placeholder="Select Destination Type"
                  options={accountOptions}
                  value={form.debitType}
                  onChange={(val) => {
                      setForm({ ...form, debitType: val, debitBank: val === 'Cash at Bank' ? form.debitBank : "" });
                  }}
                  disabled={!form.isActive}
                  required
               />
               <p className="text-xs text-gray-500 mt-1">Money comes IN to here</p>

               {form.debitType === 'Cash at Bank' && (
                  <div className="mt-3">
                      <SearchableSelect 
                          label="Select Destination Bank"
                          placeholder="Select Bank"
                          options={bankList.filter(b => b.IsInternalBank || b.IsCompanyBank).map(b => ({ id: b.BankName, name: b.BankName }))}
                          value={form.debitBank}
                          onChange={(val) => setForm({ ...form, debitBank: val })}
                          disabled={!form.isActive}
                          required
                      />
                  </div>
               )}
            </div>
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
            title="New Contra Voucher"
            permission={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
            width="max-w-3xl"
        >
             {renderModalContent()}
        </AddModal>
        
        {/* EDIT MODAL REMOVED FOR LIST VIEW SIMPLICITY - TRANSACTION VIEW ONLY */}

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
                    <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Contra Voucher</h2>
                    <hr className="mb-4 border-gray-300" />
            
                    <MasterTable
                        columns={columns}
                        data={sortedList.filter((item) => item.isActive)}
                        inactiveData={sortedList.filter((item) => !item.isActive)}
                        
                        search={searchText}
                        onSearch={(val) => {
                            setSearchText(val);
                            setPage(1);
                        }}
                        
                        onCreate={handleOpenAdd}
                        createLabel="New Voucher"
                        permissionCreate={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
                        
                        onRefresh={async () => {
                            setSearchText("");
                            setPage(1);
                            await loadData(null, "");
                        }}
                        onColumnSelector={() => setColumnModalOpen(true)}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        showInactive={showInactive}
                        
                        // onRowClick={handleRowClick} // Disabled Edit
                        
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

export default ContraVoucher;
