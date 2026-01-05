import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ArchiveRestore
} from "lucide-react";

import toast from "react-hot-toast";
import Swal from "sweetalert2";

import {
  addDesignationApi,
  getDesignationsApi,
  updateDesignationApi,
  deleteDesignationApi,
  searchDesignationApi,
  getInactiveDesignationsApi,
  restoreDesignationApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";
import SortableHeader from "../../components/SortableHeader";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";

const Designations = () => {
  // =============================
  // STATES
  // =============================
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [designations, setDesignations] = useState([]);
  const [inactiveDesignations, setInactiveDesignations] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newDesignation, setNewDesignation] = useState({
    designation: "",
    description: "",
    parentDesignationId: null
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDesignation, setEditDesignation] = useState({
    id: null,
    designation: "",
    description: "",
    parentDesignationId: null,
    parentName: "",
    isInactive: false
  });

 // pagination
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(25);
 const [totalRecords, setTotalRecords] = useState(0);

 // REQUIRED VALUES
 const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
 const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
 const end = Math.min(page * limit, totalRecords);


  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    designation: true,
    description: true,
    parentName: true
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // SORT
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedDesignations = React.useMemo(() => {
    let sortableItems = [...designations];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
          let aVal = a[sortConfig.key] || "";
          let bVal = b[sortConfig.key] || "";
          if (typeof aVal === 'string') aVal = aVal.toLowerCase();
          if (typeof bVal === 'string') bVal = bVal.toLowerCase();
          
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
    } else {
        // default sort by id
        sortableItems.sort((a,b) => (a.id || 0) - (b.id || 0));
    }
    return sortableItems;
  }, [designations, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // =============================
  // LOADERS
  // =============================
  const loadDesignations = async () => {
    const res = await getDesignationsApi(page, limit);
    if (res.status === 200) {
      setDesignations(res.data.records);
      setTotalRecords(res.data.total);
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveDesignationsApi();
    if (res.status === 200) {
      setInactiveDesignations(res.data.records || res.data);
    }
  };

  useEffect(() => {
    loadDesignations();
  }, [page, limit]);

  // =============================
  // SEARCH HANDLER
  // =============================
  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) return loadDesignations();

    const res = await searchDesignationApi(text.trim());
    if (res.status === 200) {
      setDesignations(res.data);
    }
  };

  // =============================
  // ADD DESIGNATION
  // =============================
  const handleAdd = async () => {
    if (!newDesignation.designation.trim()) return toast.error("Designation required");

    // Check duplicates
    try {
        const searchRes = await searchDesignationApi(newDesignation.designation.trim());
        if (searchRes?.status === 200) {
            const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
            const existing = rows.find(d => 
                d.designation?.toLowerCase() === newDesignation.designation.trim().toLowerCase()
            );
            if (existing) return toast.error("Designation already exists");
        }
    } catch(err) {
        console.error(err);
    }

    const res = await addDesignationApi({
      ...newDesignation,
      userId: currentUserId
    });

    if (res.status === 200) {
      toast.success("Designation added");
      setNewDesignation({ designation: "", description: "", parentDesignationId: null });
      setModalOpen(false);
      loadDesignations();
    }
  };

  // =============================
  // UPDATE
  // =============================
  const handleUpdate = async () => {
    if (!editDesignation.designation.trim()) return toast.error("Designation required");

    // Check duplicates
    try {
        const searchRes = await searchDesignationApi(editDesignation.designation.trim());
        if (searchRes?.status === 200) {
            const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
            const existing = rows.find(d => 
                d.designation?.toLowerCase() === editDesignation.designation.trim().toLowerCase() &&
                d.id !== editDesignation.id
            );
            if (existing) return toast.error("Designation already exists");
        }
    } catch(err) {
        console.error(err);
    }

    const payload = {
      designation: editDesignation.designation,
      description: editDesignation.description,
      parentDesignationId: editDesignation.parentDesignationId || null,
      userId: currentUserId
    };

    const res = await updateDesignationApi(editDesignation.id, payload);

    if (res.status === 200) {
      toast.success("Updated");
      setEditModalOpen(false);
      loadDesignations();
    }
  };

  // =============================
  // DELETE
  // =============================
  // =============================
  // DELETE
  // =============================
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Designation?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteDesignationApi(editDesignation.id, { userId: currentUserId });

      if (res.status === 200) {
        Swal.fire({
          title: "Deleted!",
          text: "Designation has been deleted.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadDesignations();
        if (showInactive) loadInactive();
      } else {
        Swal.fire({
            title: "Error!",
            text: res.data?.message || "Failed to delete designation",
            icon: "error",
         });
      }
    } catch(err) {
        console.error("Delete failed", err);
         Swal.fire({
            title: "Error!",
            text: "An error occurred while deleting.",
            icon: "error",
         });
    }
  };

  // =============================
  // RESTORE
  // =============================
  const handleRestore = async () => {
     const result = await Swal.fire({
      title: "Restore Designation?",
      text: "This designation will be restored",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await restoreDesignationApi(editDesignation.id, { userId: currentUserId });

      if (res.status === 200) {
        Swal.fire({
            title: "Restored!",
            text: "Designation has been restored.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        setEditModalOpen(false);
        loadDesignations();
        loadInactive();
      } else {
        Swal.fire({
            title: "Error!",
            text: "Failed to restore designation",
            icon: "error",
         });
      }
    } catch(err) {
        console.error("Restore failed", err);
        Swal.fire({
            title: "Error!",
            text: "An error occurred while restoring.",
            icon: "error",
         });
    }
  };



  const { theme } = useTheme();

  return (
    <>
{/* =============================
    ADD DESIGNATION MODAL
============================= */}
{/* =============================
    ADD DESIGNATION MODAL
============================= */}
<AddModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onSave={handleAdd}
  title="New Designation"
  width="700px"
  permission={hasPermission(PERMISSIONS.HR.DESIGNATIONS.CREATE)}
>
  <div className="p-0 space-y-4">
    {/* DESIGNATION */}
    <div>
      <label className="block text-sm mb-1">Designation *</label>
      <input
        type="text"
        value={newDesignation.designation}
        onChange={(e) =>
          setNewDesignation((p) => ({ ...p, designation: e.target.value }))
        }
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <label className="block text-sm mb-1">Description</label>
      <textarea
        value={newDesignation.description}
        onChange={(e) =>
          setNewDesignation((p) => ({ ...p, description: e.target.value }))
        }
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 focus:border-blue-500 focus:outline-none"
      />
    </div>

    {/* PARENT DESIGNATION */}
    <div>
      <label className="block text-sm mb-1">Parent Designation</label>
      <SearchableSelect
        value={newDesignation.parentDesignationId}
        onChange={(val) =>
          setNewDesignation({ ...newDesignation, parentDesignationId: val })
        }
        options={designations.map((d) => ({ id: d.id, name: d.designation }))}
        placeholder="Select parent designation"
        className="w-full"
        direction="up"
      />
    </div>
  </div>
</AddModal>

{/* =============================
    EDIT DESIGNATION MODAL
============================= */}
{/* =============================
    EDIT DESIGNATION MODAL
============================= */}
<EditModal
  isOpen={editModalOpen}
  onClose={() => setEditModalOpen(false)}
  onSave={handleUpdate}
  onDelete={handleDelete}
  onRestore={handleRestore}
  isInactive={editDesignation.isInactive}
  title={editDesignation.isInactive ? "Restore Designation" : "Edit Designation"}
  permissionDelete={hasPermission(PERMISSIONS.HR.DESIGNATIONS.DELETE)}
  permissionEdit={hasPermission(PERMISSIONS.HR.DESIGNATIONS.EDIT)}
  width="700px"
>
  <div className="p-0 space-y-4">
    {/* DESIGNATION */}
    <div>
      <label className="block text-sm mb-1">Designation *</label>
      <input
        value={editDesignation.designation}
        onChange={(e) =>
          setEditDesignation((p) => ({ ...p, designation: e.target.value }))
        }
        disabled={editDesignation.isInactive}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <label className="block text-sm mb-1">Description</label>
      <textarea
        value={editDesignation.description}
        onChange={(e) =>
          setEditDesignation((p) => ({ ...p, description: e.target.value }))
        }
        disabled={editDesignation.isInactive}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      />
    </div>

    {/* PARENT DESIGNATION */}
    <div>
      <label className="block text-sm mb-1">Parent Designation</label>
      <SearchableSelect
        value={editDesignation.parentDesignationId}
        onChange={(val) =>
          setEditDesignation({ ...editDesignation, parentDesignationId: val })
        }
        options={designations.map((d) => ({ id: d.id, name: d.designation }))}
        placeholder="Select parent designation"
        disabled={editDesignation.isInactive}
        className="w-full"
        direction="up"
      />
    </div>
  </div>
</EditModal>


      {/* =============================
          COLUMN PICKER
      ============================= */}

      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* ===================================
              MAIN PAGE
      =================================== */}
      <PageLayout>
        <div className={`p-4 text-white h-full ${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-900 to-emerald-700' : 'bg-gradient-to-b from-gray-900 to-gray-700'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Designations</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* SEARCH */}
              <div className={`flex items-center px-2 py-1.5 rounded-md border w-full sm:w-60 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600' : 'bg-gray-700 border-gray-600'}`}>
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
              {hasPermission(PERMISSIONS.HR.DESIGNATIONS.CREATE) && (
              <button onClick={() => setModalOpen(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                <Plus size={16} /> New Designation
              </button>
              )}

              {/* REFRESH */}
              <button onClick={() => { setSearchText(""); setPage(1); loadDesignations(); }} className={`p-1.5 rounded-md border ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                <RefreshCw size={16} className="text-blue-400" />
              </button>

              {/* COLUMN PICKER */}
              <button onClick={() => setColumnModalOpen(true)} className={`p-1.5 rounded-md border ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                <List size={16} className="text-blue-300" />
              </button>

              {/* INACTIVE TOGGLE */}
              <button onClick={async () => { if (!showInactive) await loadInactive(); setShowInactive(!showInactive); }} className={`p-1.5 rounded-md border flex items-center gap-1 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
              </button>
            </div>

          {/* ==========================
                TABLE
          =========================== */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="w-[800px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">
                    {visibleColumns.id && (
                       <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
                    )}
                    {visibleColumns.designation && (
                        <SortableHeader label="Designation" sortKey="designation" currentSort={sortConfig} onSort={handleSort} />
                    )}
                    {visibleColumns.description && (
                         <SortableHeader label="Description" sortKey="description" currentSort={sortConfig} onSort={handleSort} />
                    )}
                    {visibleColumns.parentName && (
                        <SortableHeader label="Parent Designation" sortKey="parentName" currentSort={sortConfig} onSort={handleSort} />
                    )}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE */}
                  {sortedDesignations.map((c) => (
                    <tr key={c.id} className={`${theme === 'emerald' ? 'bg-emerald-800 hover:bg-emerald-700' : 'bg-gray-900 hover:bg-gray-700'} cursor-pointer rounded shadow-sm`} onClick={() => { setEditDesignation({ id: c.id, designation: c.designation, description: c.description, parentDesignationId: c.parentDesignationId, parentName: c.parentName, isInactive: false }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.designation && <td className="px-2 py-1 text-center">{c.designation}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
                    </tr>
                  ))}

                  {/* INACTIVE */}
                  {showInactive && inactiveDesignations.map((c) => (
                    <tr key={`inactive-${c.id}`} className={`${theme === 'emerald' ? 'bg-emerald-900 hover:bg-emerald-800' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer opacity-40 line-through rounded shadow-sm`} onClick={() => { setEditDesignation({ id: c.id, designation: c.designation, description: c.description, parentDesignationId: c.parentDesignationId, parentName: c.parentName, isInactive: true }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.designation && <td className="px-2 py-1 text-center">{c.designation}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

 {/* PAGINATION */}
           
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                // onRefresh={handleRefresh}
              />
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default Designations;



