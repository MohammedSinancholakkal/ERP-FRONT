import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  getServicesApi,
  addServiceApi,
  updateServiceApi,
  deleteServiceApi,
  searchServiceApi,
  getInactiveServicesApi,
  restoreServiceApi,
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

const Services = () => {
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

  const [newItem, setNewItem] = useState({ 
    name: "", 
    charge: "", 
    description: "", 
    tax: "" 
  });

  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    charge: "",
    description: "",
    tax: "",
    isInactive: false,
  });

  const defaultColumns = { 
    id: true, 
    name: true, 
    charge: true, 
    description: true, 
    tax: true 
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

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
      id: r.Id ?? r.id ?? r.serviceId ?? null,
      name: r.Name ?? r.ServiceName ?? r.name ?? r.serviceName ?? "",
      charge: r.Charge ?? r.charge ?? "",
      description: r.Description ?? r.description ?? "",
      tax: r.Tax ?? r.tax ?? "",
    }));

  // ===============================
  // Load Active
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getServicesApi(page, limit);
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
        toast.error("Failed to load services");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load services");
    }
  };

  // inactive loader
  const loadInactive = async () => {
    try {
      const res = await getInactiveServicesApi();
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
      const res = await searchServiceApi(value);
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
    if (!newItem.name?.trim())
      return toast.error("Name is required");

    // Check for duplicates
    try {
      const searchRes = await searchServiceApi(newItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data)
          ? searchRes.data
          : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || r.ServiceName || r.serviceName || "").toLowerCase() === newItem.name.trim().toLowerCase()
        );
        if (existing) return toast.error("Service with this name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const payload = {
          ServiceName: newItem.name.trim(),
          Charge: newItem.charge,
          Description: newItem.description,
          Tax: newItem.tax,
          userId: currentUserId
      };
      const res = await addServiceApi(payload);

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Service added");
        setModalOpen(false);
        setNewItem({ name: "", charge: "", description: "", tax: "" });
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
      charge: row.charge,
      description: row.description,
      tax: row.tax,
      isInactive: inactive,
    });

    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem.name?.trim()) return toast.error("Name is required");

    // Check for duplicates
    try {
      const searchRes = await searchServiceApi(editItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data)
          ? searchRes.data
          : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || r.ServiceName || r.serviceName || "").toLowerCase() === editItem.name.trim().toLowerCase() && 
                 (r.Id || r.id || r.ServiceId || r.serviceId) !== editItem.id
        );
        if (existing) return toast.error("Service with this name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const payload = {
        ServiceName: editItem.name.trim(),
        Charge: editItem.charge,
        Description: editItem.description,
        Tax: editItem.tax,
        userId: currentUserId
      };
      const res = await updateServiceApi(editItem.id, payload);

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
        const res = await deleteServiceApi(editItem.id, {
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
      try {
        const res = await restoreServiceApi(editItem.id, {
            userId: currentUserId,
        });

        if (res?.status === 200) {
            showSuccessToast("Restored");
            setEditModalOpen(false);
            loadRows();
            loadInactive();
        }
      } catch (err) {
        console.error(err);
        showErrorToast("Restore failed");
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

          <h2 className="text-xl font-bold text-[#6448AE] mb-2">Services</h2>
          <hr className="mb-4 border-gray-300" />

        <MasterTable
            columns={[
                visibleColumns.id && { key: 'id', label: 'ID', sortable: true },
                visibleColumns.name && { key: 'name', label: 'Name', sortable: true },
                visibleColumns.charge && { key: 'charge', label: 'Charge', sortable: true },
                visibleColumns.description && { key: 'description', label: 'Description', sortable: true },
                visibleColumns.tax && { key: 'tax', label: 'Tax (%)', sortable: true },
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
            createLabel="New Service"
            permissionCreate={hasPermission(PERMISSIONS.SERVICES_MASTER.CREATE)}
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
        

        {/* PAGINATION */}
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
      </ContentCard>
    </div>

       {/* ADD MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Service"
       >
          <div className="space-y-4">
            <div>
                <InputField
                    label="Name"
                    value={newItem.name}
                    onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1"
                    required
                />
            </div>
            <div>
                <InputField
                    label="Charge"
                    type="number"
                    value={newItem.charge}
                    onChange={(e) => setNewItem((p) => ({ ...p, charge: e.target.value }))}
                    className="mt-1"
                />
            </div>
            <div>
                <InputField
                    label="Description"
                    textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                    className="mt-1"
                    rows={3}
                />
            </div>
            <div>
                <InputField
                    label="Tax (%)"
                    type="number"
                    value={newItem.tax}
                    onChange={(e) => setNewItem((p) => ({ ...p, tax: e.target.value }))}
                    className="mt-1"
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
          isInactive={editItem.isInactive}
          title={editItem.isInactive ? "Restore Service" : "Edit Service"}
          permissionDelete={hasPermission(PERMISSIONS.SERVICES_MASTER.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.SERVICES_MASTER.EDIT)}
       >
          <div className="space-y-4">
              <div>
                 <InputField
                     label="Name"
                     value={editItem.name}
                     onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                     disabled={editItem.isInactive}
                     className="mt-1"
                     required
                 />
              </div>
              <div>
                 <InputField
                     label="Charge"
                     type="number"
                     value={editItem.charge}
                     onChange={(e) => setEditItem((p) => ({ ...p, charge: e.target.value }))}
                     disabled={editItem.isInactive}
                     className="mt-1"
                 />
              </div>
              <div>
                 <InputField
                     label="Description"
                     textarea
                     value={editItem.description}
                     onChange={(e) => setEditItem((p) => ({ ...p, description: e.target.value }))}
                     disabled={editItem.isInactive}
                     className="mt-1"
                     rows={3}
                 />
              </div>
              <div>
                 <InputField
                     label="Tax (%)"
                     type="number"
                     value={editItem.tax}
                     onChange={(e) => setEditItem((p) => ({ ...p, tax: e.target.value }))}
                     disabled={editItem.isInactive}
                     className="mt-1"
                 />
              </div>
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

export default Services;
