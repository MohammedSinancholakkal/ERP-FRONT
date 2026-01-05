import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

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

import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const AgendaItemTypes = () => {
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
      id: r.Id ?? r.id ?? r.agendaItemTypeId ?? null,
      name: r.Name ?? r.AgendaTypeName ?? r.name ?? "",
    }));

  // ===============================
  // Load Active
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getAgendaItemTypesApi(page, limit);
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
    if (!newItem.name?.trim())
      return toast.error("Name is required");

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
    try {
      const res = await deleteAgendaItemTypeApi(editItem.id, {
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
  };


  // ===============================
  // Render UI
  // ===============================
  return (
    <PageLayout>
    <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
      <div className="flex flex-col h-full overflow-hidden">

        <h2 className="text-2xl font-semibold mb-4">Agenda Item Types</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">

          {/* SEARCH */}
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {/* ADD */}
          {hasPermission(PERMISSIONS.AGENDA_ITEM_TYPES.CREATE) && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <Plus size={16} /> New Type
          </button>
          )}

          {/* REFRESH */}
          <button
            onClick={() => {
              setSearchText("");
              setPage(1);
              loadRows();
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          {/* COLUMNS */}
          <button
            onClick={() => setColumnModalOpen(true)}
            className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <List size={16} className="text-blue-300" />
          </button>

          {/* INACTIVE TOGGLE */}
          <button
            onClick={async () => {
              if (!showInactive) await loadInactive();
              setShowInactive((s) => !s);
            }}
            className={`p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1 hover:bg-gray-600 ${
              showInactive ? "ring-1 ring-yellow-300" : ""
            }`}
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto min-h-0">
          <table className="w-[500px] border-separate border-spacing-y-1 text-sm">

            {/* HEADER */}
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="text-white text-center">

                {visibleColumns.id && (
                  <SortableHeader
                    label="ID"
                    sortOrder={sortConfig.key === "id" ? sortConfig.direction : null}
                    onClick={() => handleSort("id")}
                  />
                )}

                {visibleColumns.name && (
                  <SortableHeader
                    label="Name"
                    sortOrder={sortConfig.key === "name" ? sortConfig.direction : null}
                    onClick={() => handleSort("name")}
                  />
                )}
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="text-center">

              {/* No Records */}
              {sortedRows.length === 0 && inactiveRows.length === 0 && (
                <tr>
                  <td
                    colSpan={Object.values(visibleColumns).filter(Boolean).length}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No records found
                  </td>
                </tr>
              )}

              {/* ACTIVE ROWS */}
              {sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                  onClick={() => openEdit(row, false)}
                >
                  {visibleColumns.id && (
                    <td className="px-2 py-1 align-middle">{row.id}</td>
                  )}
                  {visibleColumns.name && (
                    <td className="px-2 py-1 align-middle">{row.name}</td>
                  )}
                </tr>
              ))}

              {/* INACTIVE ROWS */}
              {showInactive &&
                inactiveRows.map((row) => (
                  <tr
                    key={`inactive-${row.id}`}
                    className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer"
                    onClick={() => openEdit(row, true)}
                  >
                    {visibleColumns.id && (
                      <td className="px-2 py-1 align-middle">{row.id}</td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-2 py-1 align-middle">{row.name}</td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        

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
    </div>

       {/* ADD MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Agenda Item Type"
       >
          <div>
            <label className="text-sm text-gray-300">Name *</label>
            <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
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
             <label className="text-sm text-gray-300">Name *</label>
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
