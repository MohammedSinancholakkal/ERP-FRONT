import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  getCustomerGroupsApi,
  addCustomerGroupApi,
  updateCustomerGroupApi,
  deleteCustomerGroupApi,
  searchCustomerGroupApi,
  getInactiveCustomerGroupsApi,
  restoreCustomerGroupApi,
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

const CustomerGroups = () => {
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
      id: r.Id ?? r.id ?? r.customerGroupId ?? null,
      name: r.Name ?? r.GroupName ?? r.name ?? "",
    }));

  // ===============================
  // Load Active
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getCustomerGroupsApi(page, limit);
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
        toast.error("Failed to load customer groups");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer groups");
    }
  };

  // inactive loader
  const loadInactive = async () => {
    try {
      const res = await getInactiveCustomerGroupsApi();
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
      const res = await searchCustomerGroupApi(value);
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
      const searchRes = await searchCustomerGroupApi(newItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data)
          ? searchRes.data
          : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || "").toLowerCase() === newItem.name.trim().toLowerCase()
        );
        if (existing) return toast.error("Customer group with this name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const res = await addCustomerGroupApi({
        groupName: newItem.name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Customer group added");
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

     // Check for duplicates
     try {
      const searchRes = await searchCustomerGroupApi(editItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data)
          ? searchRes.data
          : searchRes.data?.records || [];
        const existing = rows.find(
          (r) => (r.Name || r.name || "").toLowerCase() === editItem.name.trim().toLowerCase() && 
                 (r.Id || r.id) !== editItem.id
        );
        if (existing) return toast.error("Customer group with this name already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const res = await updateCustomerGroupApi(editItem.id, {
        groupName: editItem.name.trim(),
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
        const res = await deleteCustomerGroupApi(editItem.id, {
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
        const res = await restoreCustomerGroupApi(editItem.id, {
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
          
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Customer Groups</h2>
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
            createLabel="New Group"
            permissionCreate={hasPermission(PERMISSIONS.CUSTOMER_GROUPS.CREATE)}
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
      </ContentCard>
    </div>

       {/* ADD MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Customer Group"
       >
          <div>
             <div className="flex gap-2 items-start">
               <div className="flex-grow">
                 <InputField
                   label="Name"
                   value={newItem.name}
                   onChange={(e) => setNewItem({ name: e.target.value })}
                   className="mt-1"
                   required
                 />
               </div>
               <div className="w-[34px] h-[34px]"></div>
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
          title={editItem.isInactive ? "Restore Customer Group" : "Edit Customer Group"}
          permissionDelete={hasPermission(PERMISSIONS.CUSTOMER_GROUPS.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.CUSTOMER_GROUPS.EDIT)}
       >
          <div>
              <div className="flex gap-2 items-start">
                <div className="flex-grow">
                  <InputField
                     label="Name"
                     value={editItem.name}
                     onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                     disabled={editItem.isInactive}
                     className="mt-1"
                     required
                  />
                </div>
                <div className="w-[34px] h-[34px]"></div>
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

export default CustomerGroups;
