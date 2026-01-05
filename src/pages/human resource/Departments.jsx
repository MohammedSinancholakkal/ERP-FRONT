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
  addDepartmentApi,
  getDepartmentsApi,
  updateDepartmentApi,
  deleteDepartmentApi,
  searchDepartmentApi,
  getInactiveDepartmentsApi,
  restoreDepartmentApi
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

const Departments = () => {
  // =============================
  // STATES
  // =============================
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [inactiveDepartments, setInactiveDepartments] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newDepartment, setNewDepartment] = useState({
    department: "",
    description: "",
    parentDepartmentId: null
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState({
    id: null,
    department: "",
    description: "",
    parentDepartmentId: null,
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
    department: true,
    description: true,
    parentName: true
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // SORT
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedDepartments = React.useMemo(() => {
    let sortableItems = [...departments];
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
  }, [departments, sortConfig]);

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
  const loadDepartments = async () => {
    const res = await getDepartmentsApi(page, limit);
    if (res.status === 200) {
      setDepartments(res.data.records);
      setTotalRecords(res.data.total);
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveDepartmentsApi();
    if (res.status === 200) {
      setInactiveDepartments(res.data.records || res.data);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [page, limit]);

  // =============================
  // SEARCH HANDLER
  // =============================
  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) return loadDepartments();

    const res = await searchDepartmentApi(text.trim());
    if (res.status === 200) {
      setDepartments(res.data);
    }
  };

  // =============================
  // ADD DEPARTMENT
  // =============================
  const handleAdd = async () => {
    if (!newDepartment.department.trim()) return toast.error("Department required");

    // Check duplicates
    try {
        const searchRes = await searchDepartmentApi(newDepartment.department.trim());
        if (searchRes?.status === 200) {
            const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
            const existing = rows.find(d => 
                d.department?.toLowerCase() === newDepartment.department.trim().toLowerCase()
            );
            if (existing) return toast.error("Department already exists");
        }
    } catch(err) {
        console.error(err);
    }

    const res = await addDepartmentApi({
      ...newDepartment,
      userId: currentUserId
    });

    if (res.status === 200) {
      toast.success("Department added");
      setNewDepartment({ department: "", description: "", parentDepartmentId: null });
      setModalOpen(false);
      loadDepartments();
    }
  };

  // =============================
  // UPDATE
  // =============================
  const handleUpdate = async () => {
    if (!editDepartment.department.trim()) return toast.error("Department required");

    // Check duplicates
    try {
        const searchRes = await searchDepartmentApi(editDepartment.department.trim());
        if (searchRes?.status === 200) {
            const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
            const existing = rows.find(d => 
                d.department?.toLowerCase() === editDepartment.department.trim().toLowerCase() &&
                d.id !== editDepartment.id
            );
            if (existing) return toast.error("Department already exists");
        }
    } catch(err) {
        console.error(err);
    }

    const payload = {
      department: editDepartment.department,
      description: editDepartment.description,
      parentDepartmentId: editDepartment.parentDepartmentId || null,
      userId: currentUserId
    };

    const res = await updateDepartmentApi(editDepartment.id, payload);

    if (res.status === 200) {
      toast.success("Updated");
      setEditModalOpen(false);
      loadDepartments();
    }
  };

  // =============================
  // DELETE
  // =============================
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Department?",
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
      const res = await deleteDepartmentApi(editDepartment.id, { userId: currentUserId });

      if (res.status === 200) {
        Swal.fire({
          title: "Deleted!",
          text: "Department has been deleted.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadDepartments();
        if (showInactive) loadInactive();
      } else {
         Swal.fire({
            title: "Error!",
            text: res.data?.message || "Failed to delete department",
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
      title: "Restore Department?",
      text: "This department will be restored",
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
      const res = await restoreDepartmentApi(editDepartment.id, { userId: currentUserId });

      if (res.status === 200) {
        Swal.fire({
          title: "Restored!",
          text: "Department has been restored.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadDepartments();
        loadInactive();
      } else {
        Swal.fire({
            title: "Error!",
            text: "Failed to restore department",
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
    ADD DEPARTMENT MODAL
============================= */}
{/* =============================
    ADD DEPARTMENT MODAL
============================= */}
<AddModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onSave={handleAdd}
  title="New Department"
  width="700px"
  permission={hasPermission(PERMISSIONS.HR.DEPARTMENTS.CREATE)}
>
  <div className="p-0 space-y-4">
    {/* DEPARTMENT */}
    <div>
      <label className="block text-sm mb-1">Department *</label>
      <input
        type="text"
        value={newDepartment.department}
        onChange={(e) =>
          setNewDepartment((p) => ({ ...p, department: e.target.value }))
        }
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <label className="block text-sm mb-1">Description</label>
      <textarea
        value={newDepartment.description}
        onChange={(e) =>
          setNewDepartment((p) => ({ ...p, description: e.target.value }))
        }
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 focus:border-blue-500 focus:outline-none"
      />
    </div>

    {/* PARENT DEPARTMENT */}
    <div>
      <label className="block text-sm mb-1">Parent Department</label>
      <SearchableSelect
        value={newDepartment.parentDepartmentId}
        onChange={(val) =>
          setNewDepartment({ ...newDepartment, parentDepartmentId: val })
        }
        options={departments.map((d) => ({ id: d.id, name: d.department }))}
        placeholder="Select parent department"
        className="w-full"
        direction="up"
      />
    </div>
  </div>
</AddModal>

{/* =============================
    EDIT DEPARTMENT MODAL
============================= */}
{/* =============================
    EDIT DEPARTMENT MODAL
============================= */}
<EditModal
  isOpen={editModalOpen}
  onClose={() => setEditModalOpen(false)}
  onSave={handleUpdate}
  onDelete={handleDelete}
  onRestore={handleRestore}
  isInactive={editDepartment.isInactive}
  title={editDepartment.isInactive ? "Restore Department" : "Edit Department"}
  permissionDelete={hasPermission(PERMISSIONS.HR.DEPARTMENTS.DELETE)}
  permissionEdit={hasPermission(PERMISSIONS.HR.DEPARTMENTS.EDIT)}
  width="700px"
>
  <div className="p-0 space-y-4">
    {/* DEPARTMENT */}
    <div>
      <label className="block text-sm mb-1">Department *</label>
      <input
        value={editDepartment.department}
        onChange={(e) =>
          setEditDepartment((p) => ({ ...p, department: e.target.value }))
        }
        disabled={editDepartment.isInactive}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <label className="block text-sm mb-1">Description</label>
      <textarea
        value={editDepartment.description}
        onChange={(e) =>
          setEditDepartment((p) => ({ ...p, description: e.target.value }))
        }
        disabled={editDepartment.isInactive}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      />
    </div>

    {/* PARENT DEPARTMENT */}
    <div>
      <label className="block text-sm mb-1">Parent Department</label>
      <SearchableSelect
        value={editDepartment.parentDepartmentId}
        onChange={(val) =>
          setEditDepartment({ ...editDepartment, parentDepartmentId: val })
        }
        options={departments.map((d) => ({ id: d.id, name: d.department }))}
        placeholder="Select parent department"
        disabled={editDepartment.isInactive}
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
            <h2 className="text-2xl font-semibold mb-4">Departments</h2>

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
              {hasPermission(PERMISSIONS.HR.DEPARTMENTS.CREATE) && (
              <button onClick={() => setModalOpen(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                <Plus size={16} /> New Department
              </button>
              )}

              {/* REFRESH */}
              <button onClick={() => { setSearchText(""); setPage(1); loadDepartments(); }} className={`p-1.5 rounded-md border ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
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
                    {visibleColumns.department && (
                        <SortableHeader label="Department" sortKey="department" currentSort={sortConfig} onSort={handleSort} />
                    )}
                    {visibleColumns.description && (
                         <SortableHeader label="Description" sortKey="description" currentSort={sortConfig} onSort={handleSort} />
                    )}
                    {visibleColumns.parentName && (
                        <SortableHeader label="Parent Department" sortKey="parentName" currentSort={sortConfig} onSort={handleSort} />
                    )}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE */}
                  {sortedDepartments.map((c) => (
                    <tr key={c.id} className={`${theme === 'emerald' ? 'bg-emerald-800 hover:bg-emerald-700' : 'bg-gray-900 hover:bg-gray-700'} cursor-pointer rounded shadow-sm`} onClick={() => { setEditDepartment({ id: c.id, department: c.department, description: c.description, parentDepartmentId: c.parentDepartmentId, parentName: c.parentName, isInactive: false }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.department && <td className="px-2 py-1 text-center">{c.department}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
                    </tr>
                  ))}

                  {/* INACTIVE */}
                  {showInactive && inactiveDepartments.map((c) => (
                    <tr key={`inactive-${c.id}`} className={`${theme === 'emerald' ? 'bg-emerald-900 hover:bg-emerald-800' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer opacity-40 line-through rounded shadow-sm`} onClick={() => { setEditDepartment({ id: c.id, department: c.department, description: c.description, parentDepartmentId: c.parentDepartmentId, parentName: c.parentName, isInactive: true }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.department && <td className="px-2 py-1 text-center">{c.department}</td>}
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

export default Departments;



