// src/pages/accounts/OpeningBalance.jsx
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
import { showSuccessToast, showErrorToast } from "../../utils/notificationUtils"; 

const OpeningBalance = () => {
  const { theme } = useTheme();

  // -----------------------------------
  // VISIBILITY COLS
  // -----------------------------------
  const defaultColumns = {
    id: true,
    vdate: true,
    accountHead: true,
    balanceType: true,
    amount: true,
    remark: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // -----------------------------------
  // DATA STATES
  // -----------------------------------
  const [dataList, setDataList] = useState([
    {
      id: 1,
      vdate: "2025-01-01",
      accountHead: "Asset",
      balanceType: "Debit",
      amount: 5000,
      remark: "Opening cash",
    },
  ]);
  
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

  // -----------------------------------
  // MODAL STATES
  // -----------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    vdate: new Date().toISOString().split("T")[0],
    accountHead: "",
    balanceType: "",
    amount: "",
    remark: "",
  });

  const accountHeadOptions = [
    "Asset",
    "Equity",
    "Income",
    "Expense",
    "Liabilities",
    "Non Current Asset",
  ];

  // -----------------------------------
  // HANDLERS
  // -----------------------------------
  const resetForm = () => {
    setForm({
        id: null,
        vdate: new Date().toISOString().split("T")[0],
        accountHead: "",
        balanceType: "",
        amount: "",
        remark: "",
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleRowClick = (item) => {
      setForm({
          id: item.id,
          vdate: item.vdate,
          accountHead: item.accountHead,
          balanceType: item.balanceType,
          amount: item.amount,
          remark: item.remark
      });
      setEditModalOpen(true);
  };

  const handleSave = () => {
      showSuccessToast("Saved Successfully (Mock)");
      setModalOpen(false);
      setEditModalOpen(false);
  };

  const handleDelete = () => {
      showSuccessToast("Deleted (Mock)");
      setEditModalOpen(false);
  };

  // -----------------------------------
  // COLUMNS CONFIG
  // -----------------------------------
  const columns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.vdate && { key: "vdate", label: "Date", sortable: true },
    visibleColumns.accountHead && { key: "accountHead", label: "Account Head", sortable: true },
    visibleColumns.balanceType && { key: "balanceType", label: "Balance Type", sortable: true },
    visibleColumns.amount && { key: "amount", label: "Amount", sortable: true, className: "text-right" },
    visibleColumns.remark && { key: "remark", label: "Remark", sortable: true },
  ].filter(Boolean);

  const ModalContent = () => (
      <div className="space-y-4">
        <div>
           <InputField
             label="Date"
             type="date"
             value={form.vdate}
             onChange={(e) => setForm({ ...form, vdate: e.target.value })}
             required
           />
        </div>
        <div>
           <label className="text-sm text-black font-medium block mb-1">Account Head *</label>
           <select
             value={form.accountHead}
             onChange={(e) => setForm({ ...form, accountHead: e.target.value })}
             className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                  theme === "emerald"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                    : theme === "purple"
                    ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                    : "bg-gray-800 border-gray-700 text-white"
             }`}
           >
             <option value="">Select Account Head</option>
             {accountHeadOptions.map((a) => (
               <option key={a} value={a}>{a}</option>
             ))}
           </select>
        </div>
        <div>
           <label className="text-sm text-black font-medium block mb-1">Balance Type *</label>
           <select
             value={form.balanceType}
             onChange={(e) => setForm({ ...form, balanceType: e.target.value })}
             className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                  theme === "emerald"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                    : theme === "purple"
                    ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                    : "bg-gray-800 border-gray-700 text-white"
             }`}
           >
             <option value="">Select</option>
             <option value="Debit">Debit</option>
             <option value="Credit">Credit</option>
           </select>
        </div>
        <div>
           <InputField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
           />
        </div>
        <div>
            <label className="text-sm text-black font-medium block mb-1">Remarks *</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors h-24 ${
                  theme === "emerald"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                    : theme === "purple"
                    ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                    : "bg-gray-800 border-gray-700 text-white"
              }`}
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
            title="New Opening Balance"
            permission={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
        >
             <ModalContent />
        </AddModal>
        
        {/* EDIT MODAL */}
        <EditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={handleSave}
            onDelete={handleDelete}
            title="Edit Opening Balance"
            permissionEdit={hasPermission(PERMISSIONS.FINANCIAL.EDIT)}
            permissionDelete={hasPermission(PERMISSIONS.FINANCIAL.DELETE)}
            saveText="Update"
        >
             <ModalContent />
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
                    <h2 className="text-xl font-bold text-[#6448AE] mb-2">Opening Balance</h2>
                    <hr className="mb-4 border-gray-300" />
            
                    <MasterTable
                        columns={columns}
                        data={sortedList}
                        
                        search={searchText}
                        onSearch={setSearchText}
                        
                        onCreate={handleOpenAdd}
                        createLabel="New Opening Balance"
                        permissionCreate={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
                        
                        onRefresh={() => showSuccessToast("Refreshed")}
                        onColumnSelector={() => setColumnModalOpen(true)}
                        
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

export default OpeningBalance;
