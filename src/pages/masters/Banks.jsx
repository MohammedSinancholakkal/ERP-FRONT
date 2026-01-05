import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  Upload,
} from "lucide-react";
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

import SortableHeader from "../../components/SortableHeader";
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
  const currentUserId = user?.userId || 1;

  // Add Item State
  const [newItem, setNewItem] = useState({
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null,
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
      const payload = { ...newItem, userId: currentUserId };
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
    });
    setPreview(row.signature ? `${serverURL}/uploads/${row.signature}` : "");
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
          SignaturePicture: editItem.SignaturePicture
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
  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Banks</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
             {/* SEARCH */}
             <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
                <Search size={16} className="text-gray-300" />
                <input
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent pl-2 text-sm w-full outline-none"
                />
              </div>

            {/* ADD */}
            {hasPermission(PERMISSIONS.BANKS.CREATE) && (
              <button
                onClick={() => {
                    setPreview("");
                    setModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
              >
                <Plus size={16} /> New Bank
              </button>
            )}

            {/* REFRESH */}
            <button
                onClick={() => {
                setSearchText("");
                setPage(1);
                loadRows();
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
            >
                <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* COLUMNS */}
            <button
                onClick={() => setColumnModalOpen(true)}
                className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
            >
                <List size={16} className="text-blue-300" />
            </button>

             {/* INACTIVE TOGGLE */}
             <button
                onClick={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive((s) => !s);
                }}
                className={`p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1 hover:bg-gray-600 ${
                showInactive ? "ring-1 ring-yellow-300" : ""
                }`}
            >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
            </button>
          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0">
            <table className="w-[800px] border-separate border-spacing-y-1 text-sm">
                 {/* HEADER */}
                <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                        {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                        {visibleColumns.bankName && <SortableHeader label="Bank Name" sortOrder={sortConfig.key === "bankName" ? sortConfig.direction : null} onClick={() => handleSort("bankName")} />}
                        {visibleColumns.acName && <SortableHeader label="A/C Name" sortOrder={sortConfig.key === "acName" ? sortConfig.direction : null} onClick={() => handleSort("acName")} />}
                        {visibleColumns.acNumber && <SortableHeader label="A/C Number" sortOrder={sortConfig.key === "acNumber" ? sortConfig.direction : null} onClick={() => handleSort("acNumber")} />}
                        {visibleColumns.branch && <SortableHeader label="Branch" sortOrder={sortConfig.key === "branch" ? sortConfig.direction : null} onClick={() => handleSort("branch")} />}
                    </tr>
                </thead>
                <tbody className="text-center">
                    {sortedRows.length === 0 && inactiveRows.length === 0 && (
                        <tr><td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-6 text-gray-400">No records found</td></tr>
                    )}

                    {sortedRows.map((row) => (
                        <tr key={row.id} className="bg-gray-900 hover:bg-gray-700 cursor-pointer" onClick={() => openEdit(row, false)}>
                            {visibleColumns.id && <td className="px-2 py-1">{row.id}</td>}
                            {visibleColumns.bankName && <td className="px-2 py-1">{row.bankName}</td>}
                            {visibleColumns.acName && <td className="px-2 py-1">{row.acName}</td>}
                            {visibleColumns.acNumber && <td className="px-2 py-1">{row.acNumber}</td>}
                            {visibleColumns.branch && <td className="px-2 py-1">{row.branch}</td>}
                        </tr>
                    ))}
                    
                    {showInactive && inactiveRows.map((row) => (
                        <tr key={`inactive-${row.id}`} className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer" onClick={() => openEdit(row, true)}>
                            {visibleColumns.id && <td className="px-2 py-1">{row.id}</td>}
                            {visibleColumns.bankName && <td className="px-2 py-1">{row.bankName}</td>}
                            {visibleColumns.acName && <td className="px-2 py-1">{row.acName}</td>}
                            {visibleColumns.acNumber && <td className="px-2 py-1">{row.acNumber}</td>}
                            {visibleColumns.branch && <td className="px-2 py-1">{row.branch}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

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
                 <div className="flex items-center gap-4 mt-2">
                     <label className="flex items-center gap-2 cursor-pointer bg-gray-800 px-3 py-2 rounded hover:bg-gray-700 border border-gray-600">
                         <Upload size={16} /> Upload
                         <input type="file" hidden onChange={(e) => handleFileChange(e)} />
                     </label>
                     {preview && (
                         <img src={preview} alt="Prev" className="h-10 border border-gray-600 rounded" />
                     )}
                 </div>
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
                    <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-800 px-3 py-2 rounded hover:bg-gray-700 border border-gray-600">
                            <Upload size={16} /> Change
                            <input type="file" hidden onChange={(e) => handleFileChange(e, true)} />
                        </label>
                        {preview && (
                            <img src={preview} alt="Prev" className="h-10 border border-gray-600 rounded" />
                        )}
                    </div>
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
