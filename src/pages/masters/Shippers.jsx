import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

import MasterTable from "../../components/MasterTable";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const Shippers = () => {
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
      id: r.Id ?? r.id ?? r.shipperId ?? null,
      name: r.CompanyName ?? r.companyName ?? r.name ?? "",
      phone: r.Phone ?? r.phone ?? "",
    }));

  // ===============================
  // Load Active
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getShippersApi(page, limit);
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
    if (!newItem.name?.trim())
      return toast.error("Company Name is required");

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
    try {
      const res = await deleteShipperApi(editItem.id, {
        userId: currentUserId,
      });

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
      const res = await restoreShipperApi(editItem.id, {
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
  };


  // ===============================
  // Render UI
  // ===============================
  return (
    <PageLayout>
    <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
      <div className="flex flex-col h-full overflow-hidden gap-2">

        <h2 className="text-2xl font-semibold mb-4">Shippers</h2>

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
         title="New Shipper"
       >
          <div className="space-y-4">
            <div>
                <label className="text-sm text-gray-300">Company Name *</label>
                <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
                />
            </div>
            <div>
                <label className="text-sm text-gray-300">Phone</label>
                <input
                    type="text"
                    value={newItem.phone}
                    onChange={(e) => setNewItem((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
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
                <label className="text-sm text-gray-300">Company Name *</label>
                <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                    disabled={editItem.isInactive}
                    className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                />
            </div>
            <div>
                <label className="text-sm text-gray-300">Phone</label>
                <input
                    type="text"
                    value={editItem.phone}
                    onChange={(e) => setEditItem((p) => ({ ...p, phone: e.target.value }))}
                    disabled={editItem.isInactive}
                    className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                    }`}
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
