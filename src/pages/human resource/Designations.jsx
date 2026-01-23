import React, { useState, useEffect, useRef } from "react";

import MasterTable from "../../components/MasterTable";
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

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
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";
import toast from "react-hot-toast";

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
    const res = await getDesignationsApi(page, limit, sortConfig.key, sortConfig.direction);
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
  }, [page, limit, sortConfig]);

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

  const handleRefresh = async () => {
    setSearchText("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    setShowInactive(false);
    
    try {
        const res = await getDesignationsApi(1, limit, null, 'asc');
        if (res?.status === 200) {
          setDesignations(res.data.records);
          setTotalRecords(res.data.total);
          // showSuccessToast("Refreshed");
        }
    } catch (err) {
        toast.error("Error refreshing designations");
    }
  };

  // =============================
  // ADD DESIGNATION
  // =============================
  const handleAdd = async () => {
    if (!newDesignation.designation.trim()) return toast.error("Designation required");

    if (newDesignation.designation.trim().length < 2 || newDesignation.designation.trim().length > 50) return toast.error("Designation Name must be between 2 and 50 characters");
    if (newDesignation.description && (newDesignation.description.trim().length < 2 || newDesignation.description.trim().length > 300)) return toast.error("Description must be between 2 and 300 characters");

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

    if (editDesignation.designation.trim().length < 2 || editDesignation.designation.trim().length > 50) return toast.error("Designation Name must be between 2 and 50 characters");
    if (editDesignation.description && (editDesignation.description.trim().length < 2 || editDesignation.description.trim().length > 300)) return toast.error("Description must be between 2 and 300 characters");

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
    const result = await showDeleteConfirm("this designation");

    if (!result.isConfirmed) return;

    try {
      const res = await deleteDesignationApi(editDesignation.id, { userId: currentUserId });

      if (res.status === 200) {
        showSuccessToast("Designation deleted successfully.");
        setEditModalOpen(false);
        loadDesignations();
        if (showInactive) loadInactive();
      } else {
        showErrorToast(res.data?.message || "Failed to delete designation");
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
     const result = await showRestoreConfirm("this designation");

    if (!result.isConfirmed) return;

    try {
      const res = await restoreDesignationApi(editDesignation.id, { userId: currentUserId });

      if (res.status === 200) {
        showSuccessToast("Designation restored successfully.");
        setEditModalOpen(false);
        loadDesignations();
        loadInactive();
      } else {
        showErrorToast("Failed to restore designation");
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
      <InputField
        label="Designation"
        value={newDesignation.designation}
        onChange={(e) =>
          setNewDesignation((p) => ({ ...p, designation: e.target.value }))
        }
        required
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <InputField
        label="Description"
        textarea
        value={newDesignation.description}
        onChange={(e) =>
          setNewDesignation((p) => ({ ...p, description: e.target.value }))
        }
        className="h-20"
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
      <InputField
        label="Designation"
        value={editDesignation.designation}
        onChange={(e) =>
          setEditDesignation((p) => ({ ...p, designation: e.target.value }))
        }
        disabled={editDesignation.isInactive}
        required
      />
    </div>

    {/* DESCRIPTION */}
    <div>
      <InputField
        label="Description"
        textarea
        value={editDesignation.description}
        onChange={(e) =>
          setEditDesignation((p) => ({ ...p, description: e.target.value }))
        }
        disabled={editDesignation.isInactive}
        className="h-20"
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>  
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Designations</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.designation && { key: "designation", label: "Designation", sortable: true },
                    visibleColumns.description && { key: "description", label: "Description", sortable: true },
                    visibleColumns.parentName && { key: "parentName", label: "Parent Designation", sortable: true, render: (r) => r.parentName || "-" },
                ].filter(Boolean)}
                data={designations}
                inactiveData={inactiveDesignations}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(c, isInactive) => {
                     setEditDesignation({ 
                        id: c.id, 
                        designation: c.designation, 
                        description: c.description, 
                        parentDesignationId: c.parentDesignationId, 
                        parentName: c.parentName, 
                        isInactive: isInactive 
                    }); 
                    setEditModalOpen(true);
                }}
                // Action Bar
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New Designation"
                permissionCreate={hasPermission(PERMISSIONS.HR.DESIGNATIONS.CREATE)}
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

export default Designations;



