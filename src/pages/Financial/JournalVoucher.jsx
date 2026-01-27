// src/pages/accounts/JournalVoucher.jsx
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

const JournalVoucher = () => {
  const { theme } = useTheme();

  // -----------------------------------
  // VISIBILITY COLS
  // -----------------------------------
  const defaultColumns = {
    id: true,
    vNo: true,
    vType: true,
    date: true,
    coaHeadName: true,
    coa: true,
    remark: true,
    debit: true,
    credit: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // -----------------------------------
  // DATA STATES
  // -----------------------------------
  const [dataList, setDataList] = useState([
    {
      id: 1,
      vNo: "JV/2025/01",
      vType: "Journal Entry",
      date: "2025-01-01",
      coaHeadName: "Cash Head",
      coa: "1001",
      remark: "Initial cash entry",
      debit: 5000,
      credit: 0,
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
    date: new Date().toISOString().split("T")[0],
    account: "",
    debit: "",
    credit: "",
    remark: "",
  });

  const accountOptions = ["Cash at Hand", "Cash at Bank"];

  // -----------------------------------
  // HANDLERS
  // -----------------------------------
  const resetForm = () => {
    setForm({
        id: null,
        date: new Date().toISOString().split("T")[0],
        account: "",
        debit: "",
        credit: "",
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
          date: item.date,
          account: "", // Mock
          debit: item.debit,
          credit: item.credit,
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
    visibleColumns.vNo && { key: "vNo", label: "V No", sortable: true },
    visibleColumns.vType && { key: "vType", label: "V Type", sortable: true },
    visibleColumns.date && { key: "date", label: "Date", sortable: true },
    visibleColumns.coaHeadName && { key: "coaHeadName", label: "COA Head Name", sortable: true },
    visibleColumns.coa && { key: "coa", label: "COA", sortable: true },
    visibleColumns.remark && { key: "remark", label: "Remark", sortable: true },
    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true, className: "text-right" },
    visibleColumns.credit && { key: "credit", label: "Credit", sortable: true, className: "text-right" },
  ].filter(Boolean);

  const ModalContent = () => (
      <div className="space-y-4">
        <div>
           <InputField
             label="Date"
             type="date"
             value={form.date}
             onChange={(e) => setForm({ ...form, date: e.target.value })}
             required
           />
        </div>
        <div>
           <label className="text-sm text-black font-medium block mb-1">Account *</label>
           <select
             value={form.account}
             onChange={(e) => setForm({ ...form, account: e.target.value })}
             className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                  theme === "emerald"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                    : theme === "purple"
                    ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                    : "bg-gray-800 border-gray-700 text-white"
             }`}
           >
             <option value="">Select Account</option>
             {accountOptions.map((a) => (
               <option key={a} value={a}>{a}</option>
             ))}
           </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <InputField
              label="Debit"
              type="number"
              value={form.debit}
              onChange={(e) => setForm({ ...form, debit: e.target.value })}
           />
           <InputField
              label="Credit"
              type="number"
              value={form.credit}
              onChange={(e) => setForm({ ...form, credit: e.target.value })}
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
            title="New Journal Voucher"
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
            title="Edit Journal Voucher"
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
                    <h2 className="text-xl font-bold text-[#6448AE] mb-2">Journal Voucher</h2>
                    <hr className="mb-4 border-gray-300" />
            
                    <MasterTable
                        columns={columns}
                        data={sortedList}
                        
                        search={searchText}
                        onSearch={setSearchText}
                        
                        onCreate={handleOpenAdd}
                        createLabel="New Voucher"
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

export default JournalVoucher;
