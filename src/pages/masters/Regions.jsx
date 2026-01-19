import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  addRegionApi,
  getRegionsApi,
  updateRegionApi,
  deleteRegionApi,
  searchRegionApi,
  getInactiveRegionsApi,
  restoreRegionApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";

const Regions = () => {
  const { theme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newData, setNewData] = useState({ name: "" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    isInactive: false,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId || 1;

  const [searchText, setSearchText] = useState("");

  const defaultColumns = {
    id: true,
    name: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  // REMOVED CLIENT SIDE SORT LOGIC
  const sortedRows = rows;

  // ===============================
  // Helpers
  // ===============================
  const capitalize = (str) => {
    if (typeof str !== 'string' || !str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const normalizeRows = (items = []) =>
    items.map((r) => ({
      id: r.RegionId ?? r.regionId ?? r.id ?? null,
      name: capitalize(r.RegionName ?? r.regionName ?? r.name ?? ""),
    }));

  // LOAD
  const loadRows = async () => {
    try {
      const res = await getRegionsApi(page, limit, sortConfig.key, sortConfig.direction);
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = normalizeRows(rows);
        setRows(normalized);
        const total = res.data.total || normalized.length;
        setTotalRecords(total);
      } else {
        toast.error("Failed to load regions");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load regions");
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit, sortConfig]);

  const loadInactive = async () => {
    try {
      const res = await getInactiveRegionsApi();
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        setInactiveRows(normalizeRows(rows));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inactive");
    }
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
        setPage(1);
        return loadRows();
    }
    try {
      const res = await searchRegionApi(text);
      if (res?.status === 200) {
        const rows = res.data || [];
        setRows(normalizeRows(rows));
        setTotalRecords(rows.length);
      }
    } catch (err) {
        console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Name required");
    const nameToCheck = newData.name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Name must be at most 50 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

    // Check for duplicates
    try {
        const searchRes = await searchRegionApi(newData.name.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.RegionName || r.regionName || r.name || "").toLowerCase() === newData.name.trim().toLowerCase()
            );
            if (existing) return toast.error("Region with this name already exists");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    try {
      const res = await addRegionApi({ regionName: newData.name, userId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Added");
        setNewData({ name: "" });
        setModalOpen(false);
        setPage(1); 
        loadRows();
      } else {
        toast.error("Failed to add");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const openEdit = (row, inactive = false) => {
       setEditData({ id: row.id, name: row.name, isInactive: inactive });
       setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) return toast.error("Name required");
    const nameToCheck = editData.name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Name must be at most 50 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

    // Check for duplicates
    try {
        const searchRes = await searchRegionApi(editData.name.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.RegionName || r.regionName || r.name || "").toLowerCase() === editData.name.trim().toLowerCase() &&
                (r.RegionId || r.regionId || r.id) !== editData.id
            );
            if (existing) return toast.error("Region with this name already exists");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    try {
      const res = await updateRegionApi(editData.id, {
        regionName: editData.name,
        userId
      });
      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const handleDelete = async () => {
    const result = await showDeleteConfirm();

    if (result.isConfirmed) {
        try {
          const res = await deleteRegionApi(editData.id, { userId });
          if (res?.status === 200) {
            showSuccessToast("Deleted");
            setEditModalOpen(false);
            loadRows();
            if (showInactive) loadInactive();
          } else {
            showErrorToast("Delete failed");
          }
        } catch (err) {
            console.error(err);
            showErrorToast("Server error");
        }
    }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm();

    if (result.isConfirmed) {
        try {
          const res = await restoreRegionApi(editData.id, { userId });
          if (res?.status === 200) {
            showSuccessToast("Restored");
            setEditModalOpen(false);
            loadRows();
            loadInactive();
          } else {
            showErrorToast("Restore failed");
          }
        } catch (err) {
            console.error(err);
            showErrorToast("Server error");
        }
    }
  };

  return (
    <PageLayout>
      <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Regions</h2>
          <hr className="mb-4 border-gray-300" />

          <MasterTable
            columns={[
                visibleColumns.id && { key: 'id', label: 'ID', sortable: true },
                visibleColumns.name && { key: 'name', label: 'Name', sortable: true },
            ].filter(Boolean)}
            data={sortedRows}
            inactiveData={inactiveRows}
            showInactive={showInactive}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowClick={(item, isInactive) => openEdit(item, isInactive)}
            // Action Props
            search={searchText}
            onSearch={handleSearch}
            onCreate={() => setModalOpen(true)}
            createLabel="New Region"
            permissionCreate={hasPermission(PERMISSIONS.REGIONS.CREATE)}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                loadRows();
            }}
            onColumnSelector={() => setColumnModal(true)}
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
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                loadRows();
            }}
            />
          </div>
        </ContentCard>
      </div>

       {/* ADD MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Region"
       >
          <div className="space-y-4">
              <div>
                  <InputField
                    label="Name"
                    value={newData.name}
                    onChange={e => setNewData({...newData, name: e.target.value})}
                    className="mt-1"
                    required
                  />
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
          isInactive={editData.isInactive}
          title={editData.isInactive ? "Restore Region" : "Edit Region"}
          permissionDelete={hasPermission(PERMISSIONS.REGIONS.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.REGIONS.EDIT)}
       >
          <div className="space-y-4">
              <div>
                  <InputField
                    label="Name"
                    value={editData.name}
                    onChange={e => setEditData({...editData, name: e.target.value})}
                    disabled={editData.isInactive}
                    className="mt-1"
                    required
                  />
              </div>
          </div>
       </EditModal>

       {/* COLUMN PICKER */}
       <ColumnPickerModal
          isOpen={columnModal}
          onClose={() => setColumnModal(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
       />
    </PageLayout>
  );
};

export default Regions;