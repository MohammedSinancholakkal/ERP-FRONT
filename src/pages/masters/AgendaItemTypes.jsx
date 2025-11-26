// src/pages/masters/AgendaItemTypes.jsx
import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

import SortableHeader from "../../components/SortableHeader";

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
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnSearch, setColumnSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  const [sortOrder, setSortOrder] = useState("asc");

  const sortedRows = [...rows];
  if (sortOrder === "asc") {
    sortedRows.sort((a, b) => Number(a.id) - Number(b.id));
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
  // Column Picker Functions
  // ===============================
  const openColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(true);
  };

  const applyColumnPicker = () => {
    setVisibleColumns(tempVisibleColumns);
    setColumnModalOpen(false);
  };

  // ===============================
  // Render UI
  // ===============================
  return (
    <>
      {/* -------------------- ADD MODAL -------------------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[520px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">

            {/* HEADER */}
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Agenda Item Type</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- EDIT / RESTORE MODAL -------------------- */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[520px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">

            {/* HEADER */}
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editItem.isInactive ? "Restore Agenda Item Type" : "Edit Agenda Item Type"} ({editItem.name})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300">Name</label>
                <input
                  type="text"
                  value={editItem.name}
                  onChange={(e) =>
                    setEditItem((p) => ({ ...p, name: e.target.value }))
                  }
                  disabled={editItem.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">

              {editItem.isInactive ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {!editItem.isInactive && (
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded"
                >
                  <Save size={16} /> Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- COLUMN PICKER -------------------- */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">

              {/* Visible Columns */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Visible Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((col) => tempVisibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2">
                      <span>{col.toUpperCase()}</span>
                      <button
                        className="text-red-400"
                        onClick={() =>
                          setTempVisibleColumns((p) => ({ ...p, [col]: false }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden Columns */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((col) => !tempVisibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2">
                      <span>{col.toUpperCase()}</span>
                      <button
                        className="text-green-400"
                        onClick={() =>
                          setTempVisibleColumns((p) => ({ ...p, [col]: true }))
                        }
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setTempVisibleColumns(defaultColumns)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={applyColumnPicker}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MAIN PAGE -------------------- */}
      <div className="p-4 sm:p-6 text-white min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col">

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
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded"
          >
            <Plus size={16} /> New Type
          </button>

          {/* REFRESH */}
          <button
            onClick={() => {
              setSearchText("");
              setPage(1);
              loadRows();
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          {/* COLUMNS */}
          <button
            onClick={openColumnPicker}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>

          {/* INACTIVE TOGGLE */}
          <button
            onClick={async () => {
              if (!showInactive) await loadInactive();
              setShowInactive((s) => !s);
            }}
            className={`p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1 ${
              showInactive ? "ring-1 ring-yellow-300" : ""
            }`}
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto">
          <table className="w-[350px] border-separate border-spacing-y-1 text-sm">

            {/* HEADER */}
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="text-white text-center">

                {visibleColumns.id && (
                  <SortableHeader
                    label="ID"
                    sortOrder={sortOrder}
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? null : "asc"))
                    }
                  />
                )}

                {visibleColumns.name && (
                  <th className="pb-1 border-b border-white text-center">
                    Name
                  </th>
                )}
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="text-center">
              {sortedRows.length === 0 && (
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
        <div className="mt-5 flex flex-wrap items-center gap-3 bg-gray-900/50 px-4 py-2 border border-gray-700 rounded text-sm">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>
          <input
            type="number"
            className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
            value={page}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v >= 1 && v <= totalPages) setPage(v);
            }}
          />

          <span>/ {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronsRight size={16} />
          </button>

          <button
            onClick={() => loadRows()}
            className="p-1 bg-gray-800 border border-gray-700 rounded"
          >
            <RefreshCw size={16} />
          </button>

          <span>
            Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b>{" "}
            of <b>{totalRecords}</b> records
          </span>
        </div>
      </div>
    </>
  );
};

export default AgendaItemTypes;
