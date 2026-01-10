import React, { useEffect, useState } from "react";
import { Upload, X, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

import {
  getBanksApi,
  addBankApi,
  updateBankApi,
  deleteBankApi,
  searchBankApi,
  getInactiveBanksApi,
  restoreBankApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

import MasterTable from "../../components/MasterTable";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { serverURL } from "../../services/serverURL";

const Banks = () => {
  // ===============================
  // State Declarations
  // ===============================
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Data
  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentRole = localStorage.getItem("role"); 
  const currentUserId = user?.userId || 1;
  
  // PERMISSION CHECK
  const canAssignCompanyBank = currentRole?.toLowerCase() === 'superadmin' && 
    (user?.userId === 1 || user?.id === 1 || user?.username?.toLowerCase() === 'superadmin');

  // Add Item State
  const [newItem, setNewItem] = useState({
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null,
    isCompanyBank: false,
  });

  // Edit Item State
  const [editItem, setEditItem] = useState({
    id: null,
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null,
    existingSignature: "",
    isInactive: false,
    isCompanyBank: false,
  });

  // Preview
  const [preview, setPreview] = useState("");

  const defaultColumns = {
    id: true,
    bankName: true,
    acName: true,
    acNumber: true,
    branch: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const sortedRows = [...rows];
  if (sortConfig.key) {
    sortedRows.sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // ===============================
  // Helpers
  // ===============================
  const normalizeRows = (items = []) =>
    items.map((r) => ({
        id: r.Id || r.id,
        bankName: r.BankName || r.bankName,
        acName: r.ACName || r.acName,
        acNumber: r.ACNumber || r.acNumber,
        branch: r.Branch || r.branch,
        signature: r.SignaturePicture || r.signaturePicture,
        isCompanyBank: !!(r.IsCompanyBank ?? r.isCompanyBank),
    }));

  // ===============================
  // Load Active
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getBanksApi(page, limit);
      if (res?.status === 200) {
        const data = res.data;
        let items = [];

        if (Array.isArray(data)) {
            items = data;
            setTotalRecords(items.length);
        } else if (Array.isArray(data.records)) {
            items = data.records;
            setTotalRecords(data.total ?? data.records.length);
        } else {
            items = [];
            setTotalRecords(0);
        }

        setRows(normalizeRows(items));
      } else {
        toast.error("Failed to load banks");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load banks");
    }
  };

  // inactive loader
  const loadInactive = async () => {
    try {
      const res = await getInactiveBanksApi();
      if (res?.status === 200) {
        const items = Array.isArray(res.data) 
            ? res.data 
            : res.data.records ?? res.data ?? [];
        setInactiveRows(normalizeRows(items));
      }
    } catch (err) {
      console.error("Load inactive error:", err);
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit]);

  // ===============================
  // Search
  // ===============================
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      setPage(1);
      loadRows();
      return;
    }
    try {
      const res = await searchBankApi(value);
      if (res?.status === 200) {
         const items = Array.isArray(res.data)
          ? res.data
          : res.data.records ?? [];
         setRows(normalizeRows(items));
         setTotalRecords(items.length);
      }
    } catch (err) {
      console.error(err);
    }
  };


  // ===============================
  // Add
  // ===============================
  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditItem((p) => ({ ...p, SignaturePicture: file }));
      } else {
        setNewItem((p) => ({ ...p, SignaturePicture: file }));
      }
      setPreview(URL.createObjectURL(file));
    }
  };

  const checkDuplicates = async(name, acNumber, excludeId = null) => {
      // Name
     try {
         const searchRes = await searchBankApi(name);
         if(searchRes?.status === 200) {
             const rows = searchRes.data || [];
             const existing = rows.find(r => 
                (r.BankName || r.bankName).toLowerCase() === name.toLowerCase() &&
                (r.Id || r.id) !== excludeId
             );
             if(existing) return { error: "Bank name already exists" };
         }
     } catch(e){}

     // AC
     try {
        const searchRes = await searchBankApi(acNumber);
        if(searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
               String(r.ACNumber || r.acNumber).trim() === String(acNumber).trim() &&
               (r.Id || r.id) !== excludeId
            );
            if(existing) return { error: "Account number already exists" };
        }
    } catch(e){}

    return null;
  };

  const handleAdd = async () => {
    if (!newItem.BankName?.trim()) return toast.error("Bank Name required");
    if (!newItem.ACNumber?.trim()) return toast.error("Account Number required");

    const dup = await checkDuplicates(newItem.BankName.trim(), newItem.ACNumber.trim());
    if(dup) return toast.error(dup.error);

    try {
      const payload = { 
          ...newItem, 
          userId: currentUserId,
          isCompanyBank: newItem.isCompanyBank 
      };
      const res = await addBankApi(payload);

      if (res?.status === 200 || res?.status === 201) {
        toast.success("Bank Added");
        setModalOpen(false);
        setNewItem({
            BankName: "",
            ACName: "",
            ACNumber: "",
            Branch: "",
            SignaturePicture: null,
            isCompanyBank: false,
        });
        setPreview("");
        setPage(1);
        loadRows();
      } else {
        toast.error("Add failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // ===============================
  // Edit / Restore
  // ===============================
  const openEdit = (row, inactive = false) => {
    setEditItem({
      id: row.id,
      BankName: row.bankName,
      ACName: row.acName,
      ACNumber: row.acNumber,
      Branch: row.branch,
      existingSignature: row.signature,
      SignaturePicture: null,
      isInactive: inactive,
      isCompanyBank: row.isCompanyBank,
    });
    
    if(row.signature) {
        const baseUrl = serverURL.replace(/\/api\/?$/, "");
        let sigPath = row.signature;
        
        // Remove leading slash to avoid double slash
        if(sigPath.startsWith("/")) {
            sigPath = sigPath.substring(1);
        }
        
        if(sigPath.startsWith("http") || sigPath.startsWith("data:")) {
            setPreview(sigPath);
        } else {
             // If path has 'uploads/', use it directly with baseUrl
             // Otherwise assume it needs 'uploads/' prefix (safeguard)
             if(sigPath.includes("uploads") || sigPath.includes("signature")) {
                 setPreview(`${baseUrl}/${sigPath}`);
             } else {
                 setPreview(`${baseUrl}/uploads/${sigPath}`);
             }
        }
    } else {
        setPreview("");
    }
    
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem.BankName?.trim()) return toast.error("Bank Name required");
    if (!editItem.ACNumber?.trim()) return toast.error("Account Number required");

    const dup = await checkDuplicates(editItem.BankName.trim(), editItem.ACNumber.trim(), editItem.id);
    if(dup) return toast.error(dup.error);

    try {
      const payload = {
          BankName: editItem.BankName,
          ACName: editItem.ACName,
          ACNumber: editItem.ACNumber,
          Branch: editItem.Branch,
          userId: currentUserId,
          SignaturePicture: editItem.SignaturePicture,
          isCompanyBank: editItem.isCompanyBank,
      }
      const res = await updateBankApi(editItem.id, payload);

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      }
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteBankApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleRestore = async () => {
    try {
      const res = await restoreBankApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadRows();
        loadInactive();
      }
    } catch (err) {
      console.error(err);
      toast.error("Restore failed");
    }
  };

  // ===============================
  // Render UI
  // ===============================
  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.bankName && { key: "bankName", label: "Bank Name", sortable: true },
    visibleColumns.acName && { key: "acName", label: "A/C Name", sortable: true },
    visibleColumns.acNumber && { key: "acNumber", label: "A/C Number", sortable: true },
    visibleColumns.branch && { key: "branch", label: "Branch", sortable: true },
  ].filter(Boolean);

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Banks</h2>

          <MasterTable
            columns={tableColumns}
            data={sortedRows}
            inactiveData={inactiveRows}
            showInactive={showInactive}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowClick={(item, isInactive) => openEdit(item, isInactive)}
            // Action Props
            search={searchText}
            onSearch={handleSearch}
            onCreate={() => {
                setPreview("");
                setModalOpen(true);
            }}
            createLabel="New Bank"
            permissionCreate={hasPermission(PERMISSIONS.BANKS.CREATE)}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadRows();
            }}
            onColumnSelector={() => setColumnModalOpen(true)}
            onToggleInactive={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive((s) => !s);
            }}
          />

          <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            total={totalRecords}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadRows();
            }}
            />
        </div>
      </div>

       {/* ADD MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Bank"
       >
          <div className="grid grid-cols-2 gap-4">
             <div>
                 <label className="text-sm text-gray-300">Bank Name *</label>
                 <input value={newItem.BankName} onChange={e => setNewItem({...newItem, BankName: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
             </div>
             <div>
                 <label className="text-sm text-gray-300">A/C Number *</label>
                 <input value={newItem.ACNumber} onChange={e => setNewItem({...newItem, ACNumber: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
             </div>
             <div>
                 <label className="text-sm text-gray-300">A/C Name</label>
                 <input value={newItem.ACName} onChange={e => setNewItem({...newItem, ACName: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
             </div>
             <div>
                 <label className="text-sm text-gray-300">Branch</label>
                 <input value={newItem.Branch} onChange={e => setNewItem({...newItem, Branch: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
             </div>
             <div className="col-span-2">
                  <label className="text-sm text-gray-300">Signature</label>
                  <div className="mt-2 w-full">
                       <div className="w-full border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/50 flex flex-col items-center justify-center relative overflow-hidden h-[160px]">
                            {preview ? (
                                <>
                                    <img 
                                        src={preview} 
                                        alt="Prev" 
                                        className="absolute inset-0 w-full h-full object-contain p-2" 
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <label className="p-1.5 bg-gray-900/80 rounded cursor-pointer hover:bg-black text-white">
                                            <Pencil size={14} />
                                            <input type="file" hidden onChange={(e) => handleFileChange(e)} accept="image/*" />
                                        </label>
                                        <button 
                                            onClick={() => {
                                                setNewItem(p => ({...p, SignaturePicture: null}));
                                                setPreview("");
                                            }}
                                            className="p-1.5 bg-red-900/80 rounded hover:bg-red-800 text-white"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-4 w-full h-full justify-center">
                                    <Upload size={32} />
                                    <span className="text-xs">Click to Upload Signature</span>
                                    <input type="file" hidden onChange={(e) => handleFileChange(e)} accept="image/*" />
                                </label>
                            )}
                       </div>
                  </div>
             </div>
             <div className="col-span-2">
                 {canAssignCompanyBank && (
                     <label className="flex items-center gap-2 cursor-pointer bg-gray-800 p-2 rounded border border-gray-700 w-fit">
                         <input 
                            type="checkbox" 
                            checked={newItem.isCompanyBank} 
                            onChange={e => setNewItem({...newItem, isCompanyBank: e.target.checked})} 
                            className="w-4 h-4"
                         />
                         <span className="text-sm text-gray-300">Apply as Company Bank Account</span>
                     </label>
                 )}
             </div>
          </div>
       </AddModal>

       {/* EDIT MODAL */}
       <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onRestore={handleRestore}
          isInactive={editItem.isInactive}
          title={editItem.isInactive ? "Restore Bank" : "Edit Bank"}
          permissionDelete={hasPermission(PERMISSIONS.BANKS.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.BANKS.EDIT)}
       >
            <div className="grid grid-cols-2 gap-4">
             <div>
                 <label className="text-sm text-gray-300">Bank Name *</label>
                 <input value={editItem.BankName} onChange={e => setEditItem({...editItem, BankName: e.target.value})} disabled={editItem.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
             </div>
             <div>
                 <label className="text-sm text-gray-300">A/C Number *</label>
                 <input value={editItem.ACNumber} onChange={e => setEditItem({...editItem, ACNumber: e.target.value})} disabled={editItem.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
             </div>
             <div>
                 <label className="text-sm text-gray-300">A/C Name</label>
                 <input value={editItem.ACName} onChange={e => setEditItem({...editItem, ACName: e.target.value})} disabled={editItem.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
             </div>
             <div>
                 <label className="text-sm text-gray-300">Branch</label>
                 <input value={editItem.Branch} onChange={e => setEditItem({...editItem, Branch: e.target.value})} disabled={editItem.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
             </div>
             {!editItem.isInactive && (
                <div className="col-span-2">
                    <label className="text-sm text-gray-300">Signature</label>
                     <div className="mt-2 w-full">
                       <div className="w-full border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/50 flex flex-col items-center justify-center relative overflow-hidden h-[160px]">
                            {preview ? (
                                <>
                                    <img 
                                        src={preview} 
                                        alt="Prev" 
                                        className="absolute inset-0 w-full h-full object-contain p-2" 
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <label className="p-1.5 bg-gray-900/80 rounded cursor-pointer hover:bg-black text-white">
                                            <Pencil size={14} />
                                            <input type="file" hidden onChange={(e) => handleFileChange(e, true)} accept="image/*" />
                                        </label>
                                        <button 
                                            onClick={() => {
                                                setNewItem(p => ({...p, SignaturePicture: null, existingSignature: ""}));
                                                setPreview("");
                                            }}
                                            className="p-1.5 bg-red-900/80 rounded hover:bg-red-800 text-white"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-4 w-full h-full justify-center">
                                    <Upload size={32} />
                                    <span className="text-xs">Click to Update Signature</span>
                                    <input type="file" hidden onChange={(e) => handleFileChange(e, true)} accept="image/*" />
                                </label>
                            )}
                       </div>
                  </div>
                </div>
             )}
             
             {!editItem.isInactive && canAssignCompanyBank && (
                 <div className="col-span-2">
                     <label className="flex items-center gap-2 cursor-pointer bg-gray-800 p-2 rounded border border-gray-700 w-fit">
                         <input 
                            type="checkbox" 
                            checked={editItem.isCompanyBank} 
                            onChange={e => setEditItem({...editItem, isCompanyBank: e.target.checked})} 
                            className="w-4 h-4"
                         />
                         <span className="text-sm text-gray-300">Apply as Company Bank Account</span>
                     </label>
                 </div>
             )}
          </div>
       </EditModal>

       {/* COLUMN PICKER MODAL */}
       <ColumnPickerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
       />

    </PageLayout>
  );
};

export default Banks;
