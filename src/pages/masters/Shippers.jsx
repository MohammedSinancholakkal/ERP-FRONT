import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  getShippersApi,
  addShipperApi,
  updateShipperApi,
  deleteShipperApi,
  searchShipperApi,
  getInactiveShippersApi,
  restoreShipperApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";

import MasterTable from "../../components/MasterTable";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ContentCard from "../../components/ContentCard";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";

const Shippers = () => {
  const { theme } = useTheme();
  const { 
    refreshShippers: refreshCtx, 
    refreshInactiveShippers: refreshInactiveCtx 
  } = useMasters();
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
    phone: "" 
  });

  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    phone: "",
    isInactive: false,
  });

  const defaultColumns = { 
    id: true, 
    name: true, 
    phone: true 
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

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
      id: r.Id ?? r.id ?? r.shipperId ?? null,
      name: capitalize(r.CompanyName ?? r.companyName ?? r.name ?? ""),
      phone: r.Phone ?? r.phone ?? "",
    }));

  // ===============================
  // Load Active
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getShippersApi(page, limit, sortConfig.key, sortConfig.direction);
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
        toast.error("Failed to load shippers");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shippers");
    }
  };

  // inactive loader
  const loadInactive = async () => {
    try {
      const res = await getInactiveShippersApi();
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
      const res = await searchShipperApi(value);
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
    if (!newItem.name?.trim()) return toast.error("Company Name is required");
    const nameToCheck = newItem.name.trim();
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Company Name allows only characters");
    if (nameToCheck.length < 2) return toast.error("Company Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Company Name must be at most 50 characters");

    if (newItem.phone?.trim()) {
        if (newItem.phone.length !== 10) return toast.error("Phone number must be exactly 10 digits");
        if (!/^\d+$/.test(newItem.phone)) return toast.error("Phone number allows only digits");
    }

    // Check for duplicate Name
    try {
      const searchRes = await searchShipperApi(newItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || r.CompanyName || r.companyName || "").toLowerCase() === newItem.name.trim().toLowerCase()
        );
        if (existing) return toast.error("Shipper with this company name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    // Check for duplicate Phone
    if (newItem.phone?.trim()) {
        try {
            const searchRes = await searchShipperApi(newItem.phone.trim());
            if (searchRes?.status === 200) {
                const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
                const existing = rows.find(
                    (r) => (r.Phone || r.phone) === newItem.phone.trim()
                );
                if (existing) return toast.error("Shipper with this phone number already exists");
            }
        } catch (err) {
            console.error(err);
            return toast.error("Error checking duplicates");
        }
    }

    try {
      const payload = {
          companyName: newItem.name.trim(), // API expects companyName
          phone: newItem.phone,
          userId: currentUserId
      };
      const res = await addShipperApi(payload);

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Shipper added");
        setModalOpen(false);
        setNewItem({ name: "", phone: "" });
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
      phone: row.phone,
      isInactive: inactive,
    });

    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem.name?.trim()) return toast.error("Company Name is required");
    const nameToCheck = editItem.name.trim();
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Company Name allows only characters");
    if (nameToCheck.length < 2) return toast.error("Company Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Company Name must be at most 50 characters");

    if (editItem.phone?.trim()) {
        if (editItem.phone.length !== 10) return toast.error("Phone number must be exactly 10 digits");
        if (!/^\d+$/.test(editItem.phone)) return toast.error("Phone number allows only digits");
    }

    // Check for duplicate Name
    try {
      const searchRes = await searchShipperApi(editItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || r.CompanyName || r.companyName || "").toLowerCase() === editItem.name.trim().toLowerCase() && 
                 (r.Id || r.id || r.ShipperId || r.shipperId) !== editItem.id
        );
        if (existing) return toast.error("Shipper with this company name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    // Check for duplicate Phone
    if (editItem.phone?.trim()) {
        try {
            const searchRes = await searchShipperApi(editItem.phone.trim());
            if (searchRes?.status === 200) {
                const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
                const existing = rows.find(
                    (r) => (r.Phone || r.phone) === editItem.phone.trim() &&
                           (r.Id || r.id || r.ShipperId || r.shipperId) !== editItem.id
                );
                if (existing) return toast.error("Shipper with this phone number already exists");
            }
        } catch (err) {
            console.error(err);
            return toast.error("Error checking duplicates");
        }
    }

    try {
      const payload = {
        companyName: editItem.name.trim(),
        phone: editItem.phone,
        userId: currentUserId
      };
      const res = await updateShipperApi(editItem.id, payload);

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
        const res = await deleteShipperApi(editItem.id, {
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
        const res = await restoreShipperApi(editItem.id, {
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

          <h2 className="text-xl font-bold text-[#6448AE] mb-2">Shippers</h2>
          <hr className="mb-4 border-gray-300" />

        <MasterTable
            columns={[
                visibleColumns.id && { key: 'id', label: 'ID', sortable: true },
                visibleColumns.name && { key: 'name', label: 'Company Name', sortable: true },
                visibleColumns.phone && { key: 'phone', label: 'Phone', sortable: true },
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
            createLabel="New Shipper"
            permissionCreate={hasPermission(PERMISSIONS.SHIPPERS.CREATE)}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                refreshCtx();
                refreshInactiveCtx();
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
            refreshCtx();
            refreshInactiveCtx();
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
         title="New Shipper"
       >
          <div className="space-y-4">
            <div>
                <InputField
                    label="Company Name"
                    value={newItem.name}
                    onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1"
                    required
                />
            </div>
            <div>
                <InputField
                    label="Phone"
                    value={newItem.phone}
                    onChange={(e) => setNewItem((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
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
          title={editItem.isInactive ? "Restore Shipper" : "Edit Shipper"}
          permissionDelete={hasPermission(PERMISSIONS.SHIPPERS.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.SHIPPERS.EDIT)}
       >
          <div className="space-y-4">
            <div>
                <InputField
                    label="Company Name"
                    value={editItem.name}
                    onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                    disabled={editItem.isInactive}
                    className="mt-1"
                    required
                />
            </div>
            <div>
                <InputField
                    label="Phone"
                    value={editItem.phone}
                    onChange={(e) => setEditItem((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
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

export default Shippers;
