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
  updateDebitVoucherApi, 
  deleteDebitVoucherApi,
  restoreDebitVoucherApi 
} from "../../services/allAPI"; 

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
    creditAccountHead: true,
    account: true,
    remark: true,
    amount: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // -----------------------------------
  // DATA STATES
  // -----------------------------------
  const [dataList, setDataList] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

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

  const filteredList = sortedList.filter(item => {
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
  const loadData = async (overrideShowInactive = null) => {
    try {
      const effectiveShowInactive = overrideShowInactive === null ? showInactive : overrideShowInactive;
      const res = await getDebitVouchersApi(effectiveShowInactive);
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
  }, [showInactive]);

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

  // ...

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

  // ...

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleRowClick = (item) => {
      setForm({
          id: item.id,
          date: item.date ? item.date.split("T")[0] : "",
          creditAccountHead: item.creditAccountHead,
          account: item.account,
          amount: item.amount,
          remark: item.remark,
          isActive: item.isActive
      });
      setEditModalOpen(true);
  };

  const handleSave = async () => {
    if(!form.creditAccountHead || !form.account || !form.amount || !form.date) {
        showErrorToast("Please fill all required fields");
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const payload = { ...form, userId: user?.userId || 1 };
        
        let res;
        if(form.id) {
            res = await updateDebitVoucherApi(form.id, payload);
        } else {
            res = await addDebitVoucherApi(payload);
        }

        if(res && (res.status === 200 || res.status === 201)){
            showSuccessToast(form.id ? "Updated Successfully" : "Created Successfully");
            setModalOpen(false);
            setEditModalOpen(false);
            loadData();
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
        const res = await deleteDebitVoucherApi(form.id, { userId: user?.userId || 1 });
        if(res && res.status === 200) {
             showSuccessToast("Deleted Successfully");
             setEditModalOpen(false);
             loadData();
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
        const res = await restoreDebitVoucherApi(form.id, { userId: user?.userId || 1 });
        if(res && res.status === 200) {
             showSuccessToast("Restored Successfully");
             setEditModalOpen(false);
             loadData();
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
    visibleColumns.id && { key: "id", label: "ID", sortable: true, render: (item) => item.id || item.Id },
    visibleColumns.vno && { key: "vno", label: "V No", sortable: true, render: (item) => item.vno || item.VNo },
    visibleColumns.vtype && { key: "vtype", label: "V Type", sortable: true, render: (item) => item.vtype || item.VType },
    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (item) => new Date(item.date || item.Date).toLocaleDateString() },
    visibleColumns.creditAccountHead && { key: "creditAccountHead", label: "Credit A/C Head", sortable: true, render: (item) => item.creditAccountHead || item.CreditAccountHead },
    visibleColumns.account && { key: "account", label: "Account", sortable: true, render: (item) => item.account || item.Account },
    visibleColumns.remark && { key: "remark", label: "Remark", sortable: true, render: (item) => item.remark || item.Remark },
    visibleColumns.amount && { key: "amount", label: "Amount", sortable: true, render: (item) => (item.amount || item.Amount) },
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
           <label className="text-sm text-black font-medium block mb-1">Credit Account Head *</label>
           <select
              value={form.creditAccountHead}
              onChange={(e) => setForm({ ...form, creditAccountHead: e.target.value })}
              disabled={!form.isActive}
              className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                  theme === "emerald"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                    : theme === "purple"
                    ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                    : "bg-gray-800 border-gray-700 text-white"
              } ${!form.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
              <option value="">Select Account</option>
              {accountOptions.map((opt) => (
                 <option key={opt} value={opt}>{opt}</option>
              ))}
           </select>
        </div>
        <div>
           <label className="text-sm text-black font-medium block mb-1">Account *</label>
           <select
             value={form.account}
             onChange={(e) => setForm({ ...form, account: e.target.value })}
             disabled={!form.isActive}
             className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                  theme === "emerald"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                    : theme === "purple"
                    ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                    : "bg-gray-800 border-gray-700 text-white"
             } ${!form.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             <option value="">Select Account</option>
             {accountOptions.map((a) => (
               <option key={a} value={a}>{a}</option>
             ))}
           </select>
        </div>
        <div>
           <InputField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={!form.isActive}
              required
           />
        </div>
        <div>
            <label className="text-sm text-black font-medium block mb-1">Remarks</label>
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
        
        {/* EDIT MODAL */}
        <EditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={handleSave}
            onDelete={handleDelete}
            onRestore={handleRestore}
            isInactive={!form.isActive}
            title={!form.isActive ? "Restore Debit Voucher" : "Edit Debit Voucher"}
            permissionEdit={hasPermission(PERMISSIONS.FINANCIAL.EDIT)}
            permissionDelete={hasPermission(PERMISSIONS.FINANCIAL.DELETE)}
            saveText="Update"
        >
             {renderModalContent()}
        </EditModal>

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
                    <h2 className="text-xl font-bold text-[#6448AE] mb-2">Debit Voucher</h2>
                    <hr className="mb-4 border-gray-300" />
            
                    <MasterTable
                        columns={columns}
                        data={filteredList.filter(item => item.isActive)}
                        inactiveData={filteredList.filter(item => !item.isActive)}
                        
                        search={searchText}
                        onSearch={setSearchText}
                        
                        onCreate={handleOpenAdd}
                        createLabel="New Voucher"
                        permissionCreate={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
                        
                        onRefresh={() => {
                            setSearchText("");
                            loadData();
                        }}
                        onColumnSelector={() => setColumnModalOpen(true)}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        showInactive={showInactive}
                        
                        onRowClick={handleRowClick}
                        
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
