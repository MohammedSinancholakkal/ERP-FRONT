import React, { useState, useEffect, useRef } from "react";
import {
//   Search,
//   Plus,
//   RefreshCw,
//   List,
  X,
  Save,
  Trash2,
  ArchiveRestore
} from "lucide-react";
import MasterTable from "../../components/MasterTable";


import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

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
// import SortableHeader from "../../components/SortableHeader"; // REMOVED

import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";
import toast from "react-hot-toast";

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
    const res = await getDepartmentsApi(page, limit, sortConfig.key, sortConfig.direction);
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
  }, [page, limit, sortConfig]);

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

  const handleRefresh = async () => {
    setSearchText("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    setShowInactive(false);
    
    // Call API directly with default values to avoid stale state closure issues
    const res = await getDepartmentsApi(1, limit, null, 'asc');
    if (res.status === 200) {
      setDepartments(res.data.records);
      setTotalRecords(res.data.total);
      // showSuccessToast("Refreshed");
    }
  };

  // =============================
  // ADD DEPARTMENT
  // =============================
  const handleAdd = async () => {
    if (!newDepartment.department.trim()) return toast.error("Department required");

    if (newDepartment.department.trim().length < 2 || newDepartment.department.trim().length > 50) return toast.error("Department Name must be between 2 and 50 characters");
    if (newDepartment.description && (newDepartment.description.trim().length < 2 || newDepartment.description.trim().length > 300)) return toast.error("Description must be between 2 and 300 characters");

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

    if (editDepartment.department.trim().length < 2 || editDepartment.department.trim().length > 50) return toast.error("Department Name must be between 2 and 50 characters");
    if (editDepartment.description && (editDepartment.description.trim().length < 2 || editDepartment.description.trim().length > 300)) return toast.error("Description must be between 2 and 300 characters");

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
    const result = await showDeleteConfirm("this department");

    if (!result.isConfirmed) return;

    try {
      const res = await deleteDepartmentApi(editDepartment.id, { userId: currentUserId });

      if (res.status === 200) {
        showSuccessToast("Department deleted successfully.");
        setEditModalOpen(false);
        loadDepartments();
        if (showInactive) loadInactive();
      } else {
         showErrorToast(res.data?.message || "Failed to delete department");
      }
    } catch(err) {
        console.error("Delete failed", err);
        showErrorToast("An error occurred while deleting.");
    }
  };

  // =============================
  // RESTORE
  // =============================
  const handleRestore = async () => {
     const result = await showRestoreConfirm("this department");

    if (!result.isConfirmed) return;

    try {
      const res = await restoreDepartmentApi(editDepartment.id, { userId: currentUserId });

      if (res.status === 200) {
        showSuccessToast("Department restored successfully.");
        setEditModalOpen(false);
        loadDepartments();
        loadInactive();
      } else {
        showErrorToast("Failed to restore department");
      }
    } catch(err) {
        console.error("Restore failed", err);
        showErrorToast("An error occurred while restoring.");
    }
  };



  const { theme } = useTheme();

  return (
    <>

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
      <InputField
        label="Department"
        value={newDepartment.department}
        onChange={(e) =>
          setNewDepartment((p) => ({ ...p, department: e.target.value }))
        }
        required
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <InputField
        label="Description"
        textarea
        value={newDepartment.description}
        onChange={(e) =>
          setNewDepartment((p) => ({ ...p, description: e.target.value }))
        }
        className="h-20"
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
  saveText="Update"
  width="700px"
>
  <div className="p-0 space-y-4">
    {/* DEPARTMENT */}
    <div>
      <InputField
        label="Department"
        value={editDepartment.department}
        onChange={(e) =>
          setEditDepartment((p) => ({ ...p, department: e.target.value }))
        }
        disabled={editDepartment.isInactive}
        required
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <InputField
        label="Description"
        textarea
        value={editDepartment.description}
        onChange={(e) =>
          setEditDepartment((p) => ({ ...p, description: e.target.value }))
        }
        disabled={editDepartment.isInactive}
        className="h-20"
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Departments</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.department && { key: "department", label: "Department", sortable: true },
                    visibleColumns.description && { key: "description", label: "Description", sortable: true },
                    visibleColumns.parentName && { key: "parentName", label: "Parent Department", sortable: true, render: (r) => r.parentName || "-" },
                ].filter(Boolean)}
                data={departments}
                inactiveData={inactiveDepartments}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(c, isInactive) => {
                     setEditDepartment({ 
                        id: c.id, 
                        department: c.department, 
                        description: c.description, 
                        parentDepartmentId: c.parentDepartmentId, 
                        parentName: c.parentName, 
                        isInactive: isInactive 
                    }); 
                    setEditModalOpen(true);
                }}
                // Action Bar
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New Department"
                permissionCreate={hasPermission(PERMISSIONS.HR.DEPARTMENTS.CREATE)}
                onRefresh={handleRefresh}
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactive();
                    setShowInactive(!showInactive);
                }}
            />

             {/* PAGINATION */}
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                onRefresh={handleRefresh}
              />
          </div>
          </ContentCard>
        </div>
      </PageLayout>

      
    </>
  );
};

export default Departments;



