import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  getAgendaItemTypesApi,
  addAgendaItemTypeApi,
  updateAgendaItemTypeApi,
  deleteAgendaItemTypeApi,
  searchAgendaItemTypeApi,
  getInactiveAgendaItemTypesApi,
  restoreAgendaItemTypeApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";

import MasterTable from "../../components/MasterTable";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ContentCard from "../../components/ContentCard";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";

const AgendaItemTypes = () => {
  const { theme } = useTheme();
  // ===============================
  // State Declarations
  // ===============================
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  const [newItem, setNewItem] = useState({ name: "" });

  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    isInactive: false,
  });

  const defaultColumns = { id: true, name: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  // const [searchColumn, setSearchColumn] = useState("");

  // const toggleColumn = (col) => { ... } // Replaced by Modal logic
  // const restoreDefaultColumns = () => { ... } // Replaced by Modal logic

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  // const start = (page - 1) * limit + 1;
  // const end = Math.min(page * limit, totalRecords);

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
  // ===============================
  // Helpers
  // ===============================
  const capitalize = (str) => {
    if (typeof str !== 'string' || !str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const normalizeRows = (items = []) =>
    items.map((r) => ({
      id: r.Id ?? r.id ?? r.agendaItemTypeId ?? null,
      name: capitalize(r.Name ?? r.AgendaTypeName ?? r.name ?? ""),
    }));

  // ===============================
  // Load Active
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getAgendaItemTypesApi(page, limit, sortConfig.key, sortConfig.direction);
      if (res?.status === 200) {
        const data = res.data;
        let items = [];

        if (Array.isArray(data.records)) {
          items = data.records;
          setTotalRecords(data.total ?? data.records.length);
        } else if (Array.isArray(data)) {
          items = data;
          setTotalRecords(items.length);
        } else {
          items = [];
          setTotalRecords(0);
        }

        setRows(normalizeRows(items));
      } else {
        toast.error("Failed to load agenda item types");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load agenda item types");
    }
  };

  // inactive loader
  const loadInactive = async () => {
    try {
      const res = await getInactiveAgendaItemTypesApi();
      if (res?.status === 200) {
        const items = res.data.records ?? res.data ?? [];
        setInactiveRows(normalizeRows(items));
      }
    } catch (err) {
      console.error("Load inactive error:", err);
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit, sortConfig]);

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
      const res = await searchAgendaItemTypeApi(value);
      if (res?.status === 200) {
        const items = Array.isArray(res.data)
          ? res.data
          : res.data.records ?? [];
        setRows(normalizeRows(items));
        setTotalRecords(items.length);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // ===============================
  // Add
  // ===============================
  const handleAdd = async () => {
    if (!newItem.name?.trim()) return toast.error("Name is required");
    const nameToCheck = newItem.name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Name must be at most 50 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

    // Check for duplicates
    try {
      const searchRes = await searchAgendaItemTypeApi(newItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data)
          ? searchRes.data
          : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || "").toLowerCase() === newItem.name.trim().toLowerCase()
        );
        if (existing) return toast.error("Agenda item type with this name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const res = await addAgendaItemTypeApi({
        name: newItem.name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Agenda item type added");
        setModalOpen(false);
        setNewItem({ name: "" });
        setPage(1);
        loadRows();
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
      name: row.name,
      isInactive: inactive,
    });

    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem.name?.trim()) return toast.error("Name is required");
    const nameToCheck = editItem.name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Name must be at most 50 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

    // Check for duplicates
    try {
      const searchRes = await searchAgendaItemTypeApi(editItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data)
          ? searchRes.data
          : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || "").toLowerCase() === editItem.name.trim().toLowerCase() && 
                 (r.Id || r.id) !== editItem.id
        );
        if (existing) return toast.error("Agenda item type with this name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const res = await updateAgendaItemTypeApi(editItem.id, {
        name: editItem.name.trim(),
        userId: currentUserId,
      });

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
    const result = await showDeleteConfirm();

    if (result.isConfirmed) {
      try {
        const res = await deleteAgendaItemTypeApi(editItem.id, {
          userId: currentUserId,
        });

        if (res?.status === 200) {
          showSuccessToast("Deleted");
          setEditModalOpen(false);
          loadRows();
          if (showInactive) loadInactive();
        }
      } catch (err) {
        console.error(err);
        showErrorToast("Delete failed");
      }
    }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm();

    if (result.isConfirmed) {
      if (result.isConfirmed) {
        try {
          const res = await restoreAgendaItemTypeApi(editItem.id, {
            userId: currentUserId,
          });

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
      }
    }
  };


  // ===============================
  // Render UI
  // ===============================
  return (
    <PageLayout>
    <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
      <ContentCard>
      <div className="flex flex-col h-full overflow-hidden gap-2">

        <h2 className="text-xl font-bold text-[#6448AE] mb-2">Agenda Item Types</h2>
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
            createLabel="New Type"
            permissionCreate={hasPermission(PERMISSIONS.AGENDA_ITEM_TYPES.CREATE)}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
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
         title="New Agenda Item Type"
       >
          <div>
             <InputField
                label="Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ name: e.target.value })}
                required
            />
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
          title={editItem.isInactive ? "Restore Agenda Item Type" : "Edit Agenda Item Type"}
          permissionDelete={hasPermission(PERMISSIONS.AGENDA_ITEM_TYPES.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.AGENDA_ITEM_TYPES.EDIT)}
       >
          <div>
             <InputField
                label="Name"
                value={editItem.name}
                onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                disabled={editItem.isInactive}
                required
             />
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

export default AgendaItemTypes;
