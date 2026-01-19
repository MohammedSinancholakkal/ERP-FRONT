import React, { useState, useEffect } from "react";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import {
  getUnitsApi,
  addUnitApi,
  updateUnitApi,
  deleteUnitApi,
  searchUnitsApi,
  restoreUnitApi,
  getInactiveUnitsApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import InputField from "../../components/InputField";
import MasterTable from "../../components/MasterTable";
import Pagination from "../../components/Pagination";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";

const Units = () => {
    const { theme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [units, setUnits] = useState([]);
  const [inactiveUnits, setInactiveUnits] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newUnit, setNewUnit] = useState({ name: "", description: "" });

  // EDIT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUnit, setEditUnit] = useState({
    id: null,
    name: "",
    description: "",
    isInactive: false
  });

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // search
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
    description: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedUnits = [...units].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = String(a[sortConfig.key] || "").toLowerCase();
    const valB = String(b[sortConfig.key] || "").toLowerCase();
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // LOAD UNITS
  const loadUnits = async () => {
    setSearchText("");

    const res = await getUnitsApi(page, limit);

    if (res?.status === 200) {
      setUnits(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      showErrorToast("Failed to load units");
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveUnitsApi();
    if (res?.status === 200) {
      setInactiveUnits(res.data.records || res.data || []);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [page, limit]);

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);

    if (text.trim() === "") return loadUnits();

    const res = await searchUnitsApi(text);
    if (res?.status === 200) {
      setUnits(res.data);
    }
  };

  // ADD UNIT
  const handleAddUnit = async () => {
    if (!newUnit.name.trim())
      return showErrorToast("Unit name required");

    // DUPLICATE CHECK
    try {
      const searchRes = await searchUnitsApi(newUnit.name.trim());
      if (searchRes?.status === 200) {
         const existing = searchRes.data.find(u => u.name.toLowerCase() === newUnit.name.trim().toLowerCase());
         if (existing) return showErrorToast("Unit Name already exists");
      }
    } catch(err) {
      console.error("Duplicate check error", err);
    }

    const res = await addUnitApi({
      name: newUnit.name,
      description: newUnit.description,
      userId: user?.userId || 1
    });

    if (res?.status === 200) {
      showSuccessToast("Unit added");
      setNewUnit({ name: "", description: "" });
      setModalOpen(false);
      loadUnits();
    } else {
      showErrorToast("Failed to add");
    }
  };

  // UPDATE UNIT
  const handleUpdateUnit = async () => {
    if (!editUnit.name.trim())
      return showErrorToast("Unit name required");

    // DUPLICATE CHECK
    try {
      const searchRes = await searchUnitsApi(editUnit.name.trim());
      if (searchRes?.status === 200) {
         const existing = searchRes.data.find(u => 
           u.name.toLowerCase() === editUnit.name.trim().toLowerCase() && 
           String(u.id) !== String(editUnit.id)
         );
         if (existing) return showErrorToast("Unit Name already exists");
      }
    } catch(err) {
      console.error("Duplicate check error", err);
    }

    const res = await updateUnitApi(editUnit.id, {
      name: editUnit.name,
      description: editUnit.description,
      userId: user?.userId || 1
    });

    if (res?.status === 200) {
      showSuccessToast("Unit updated");
      setEditModalOpen(false);
      loadUnits();
    } else {
      showErrorToast("Update failed");
    }
  };

  // DELETE UNIT
  const handleDeleteUnit = async () => {
    const result = await showDeleteConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await deleteUnitApi(editUnit.id, {
        userId: user?.userId || 1
      });

      if (res?.status === 200) {
        showSuccessToast("Unit deleted");
        setEditModalOpen(false);
        loadUnits();
        if (showInactive) loadInactive();
      } else {
        showErrorToast("Delete failed");
      }
    } catch(err) {
      console.error("Delete failed", err);
      showErrorToast("Delete failed");
    }
  };

  // RESTORE UNIT
  const handleRestoreUnit = async () => {
    const result = await showRestoreConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await restoreUnitApi(editUnit.id, { userId: user?.userId || 1 });
      if (res?.status === 200) {
        showSuccessToast("Unit restored");
        setEditModalOpen(false);
        loadUnits();
        loadInactive();
      } else {
        showErrorToast("Restore failed");
      }
    } catch(err) {
      console.error("Restore failed", err);
      showErrorToast("Restore failed");
    }
  };

  const toggleInactive = async () => {
    if (!showInactive) await loadInactive();
    setShowInactive(!showInactive);
  };

  const handleRowClick = (u) => {
    setEditUnit({
        id: u.id,
        name: u.name,
        description: u.description,
        isInactive: showInactive
      });
      setEditModalOpen(true);
  };

  const columns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.name && { key: "name", label: "Name", sortable: true },
    visibleColumns.description && { key: "description", label: "Description", sortable: true },
  ].filter(Boolean);


  return (
    <>
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddUnit}
        title="New Unit"
      >
        {/* NAME */}
        <InputField
          label="Name"
          value={newUnit.name}
          onChange={(e) =>
            setNewUnit((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter unit name"
          required
          className="mb-4"
        />

        {/* DESCRIPTION */}
        <InputField
          label="Description"
          textarea
          value={newUnit.description}
          onChange={(e) =>
            setNewUnit((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter description"
          className="h-24"
        />
      </AddModal>

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateUnit}
        onDelete={handleDeleteUnit}
        onRestore={handleRestoreUnit}
        isInactive={editUnit.isInactive}
        title={`${editUnit.isInactive ? "Restore Unit" : "Edit Unit"} (${editUnit.name})`}
        permissionDelete={hasPermission(PERMISSIONS.INVENTORY.UNITS.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.INVENTORY.UNITS.EDIT)}
      >
        {/* NAME */}
        <InputField
          label="Name"
          value={editUnit.name}
          onChange={(e) =>
            setEditUnit((prev) => ({ ...prev, name: e.target.value }))
          }
          className="mb-4"
          disabled={editUnit.isInactive}
          required
        />

        {/* DESCRIPTION */}
        <InputField
          label="Description"
          textarea
          value={editUnit.description}
          onChange={(e) =>
            setEditUnit((prev) => ({ ...prev, description: e.target.value }))
          }
          className="h-24"
          disabled={editUnit.isInactive}
        />
      </EditModal>

      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Units</h2>
            <hr className="mb-4 border-gray-300" />
            
            <MasterTable
                columns={columns}
                data={sortedUnits}
                inactiveData={inactiveUnits}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={handleRowClick}
                // Action Bar Props
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New Unit"
                permissionCreate={hasPermission(PERMISSIONS.INVENTORY.UNITS.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    loadUnits();
                }}
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={toggleInactive}
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
                loadUnits();
              }}
            />
          </div>
          </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};
export default Units;