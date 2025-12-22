// src/pages/masters/MeetingTypes.jsx
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
  getMeetingTypesApi,
  addMeetingTypeApi,
  updateMeetingTypeApi,
  deleteMeetingTypeApi,
  searchMeetingTypeApi,
  getInactiveMeetingTypesApi,
  restoreMeetingTypeApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";

const MeetingTypes = () => {
  // UI states
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Data
  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  // User
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // Add form
  const [newItem, setNewItem] = useState({ name: "" });

  // Edit form - includes isInactive flag to show restore mode
  const [editItem, setEditItem] = useState({ id: null, name: "", isInactive: false });

  // Column picker
  const defaultColumns = { id: true, name: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnSearch, setColumnSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // Sorting
  const [sortOrder, setSortOrder] = useState("asc");
  const sortedRows = [...rows];
  if (sortOrder === "asc") {
    sortedRows.sort((a, b) => Number(a.id) - Number(b.id));
  }

  // Helper: normalize backend shapes
  const normalize = (items = []) =>
    items.map((r) => ({
      id: r.Id ?? r.id ?? r.meetingTypeId ?? null,
      name: r.Name ?? r.name ?? r.MeetingTypeName ?? "",
    }));

  // -------------------------
  // Load active rows
  // -------------------------
  const loadRows = async () => {
    try {
      const res = await getMeetingTypesApi(page, limit);
      if (res?.status === 200) {
        const data = res.data;
        let items = [];

        if (Array.isArray(data.records)) {
          items = data.records;
          setTotalRecords(data.total ?? data.records.length);
        } else if (Array.isArray(data)) {
          items = data;
          setTotalRecords(data.length);
        } else {
          items = [];
          setTotalRecords(0);
        }

        setRows(normalize(items));
      } else {
        toast.error("Failed to load meeting types");
      }
    } catch (err) {
      console.error("Load meeting types error:", err);
      toast.error("Failed to load meeting types");
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // -------------------------
  // Load inactive rows
  // -------------------------
  const loadInactive = async () => {
    try {
      const res = await getInactiveMeetingTypesApi();
      if (res?.status === 200) {
        const rowsData = res.data.records ?? res.data ?? [];
        setInactiveRows(normalize(rowsData));
      } else {
        toast.error("Failed to load inactive meeting types");
      }
    } catch (err) {
      console.error("Load inactive meeting types error:", err);
      toast.error("Failed to load inactive meeting types");
    }
  };

  // -------------------------
  // Search
  // -------------------------
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      setPage(1);
      loadRows();
      return;
    }

    try {
      const res = await searchMeetingTypeApi(value);
      if (res?.status === 200) {
        const items = Array.isArray(res.data) ? res.data : res.data.records ?? [];
        setRows(normalize(items));
        setTotalRecords(items.length);
      }
    } catch (err) {
      console.error("Search meeting types error:", err);
    }
  };

  // -------------------------
  // Add
  // -------------------------
  const handleAdd = async () => {
    if (!newItem.name?.trim()) return toast.error("Name is required");

    try {
      const res = await addMeetingTypeApi({
        name: newItem.name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Meeting type added");
        setModalOpen(false);
        setNewItem({ name: "" });
        setPage(1);
        loadRows();
      } else {
        toast.error(res?.response?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("Add meeting type error:", err);
      toast.error("Server error");
    }
  };

  // -------------------------
  // Open edit modal (active or inactive)
  // -------------------------
  const openEdit = (row, inactive = false) => {
    setEditItem({ id: row.id, name: row.name, isInactive: !!inactive });
    setEditModalOpen(true);
  };

  // -------------------------
  // Update
  // -------------------------
  const handleUpdate = async () => {
    if (!editItem.name?.trim()) return toast.error("Name is required");

    try {
      const res = await updateMeetingTypeApi(editItem.id, {
        name: editItem.name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      } else {
        toast.error(res?.response?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update meeting type error:", err);
      toast.error("Server error");
    }
  };

  // -------------------------
  // Delete (soft)
  // -------------------------
  const handleDelete = async () => {
    try {
      const res = await deleteMeetingTypeApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      } else {
        toast.error(res?.response?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete meeting type error:", err);
      toast.error("Server error");
    }
  };

  // -------------------------
  // Restore
  // -------------------------
  const handleRestore = async () => {
    try {
      const res = await restoreMeetingTypeApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadRows();
        loadInactive();
      } else {
        toast.error(res?.response?.data?.message || "Restore failed");
      }
    } catch (err) {
      console.error("Restore meeting type error:", err);
      toast.error("Server error");
    }
  };

  // -------------------------
  // Column picker handlers
  // -------------------------
  const openColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(true);
  };

  const applyColumnPicker = () => {
    setVisibleColumns(tempVisibleColumns);
    setColumnModalOpen(false);
  };

  const cancelColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(false);
  };

  const toggleTempColumn = (col) =>
    setTempVisibleColumns((p) => ({ ...p, [col]: !p[col] }));

  const restoreDefaultColumns = () => setTempVisibleColumns(defaultColumns);

  // -------------------------
  // Render
  // -------------------------
  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[520px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Meeting Type</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="text-sm text-gray-300">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-2"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setNewItem({ name: "" });
                }}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Cancel
              </button>
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

      {/* EDIT / RESTORE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[520px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editItem.isInactive ? "Restore Meeting Type" : "Edit Meeting Type"} ({editItem.name})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="text-sm text-gray-300">Name</label>
              <input
                type="text"
                value={editItem.name}
                onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                disabled={editItem.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-2 ${
                  editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

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
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded border border-red-900"
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

      {/* COLUMN PICKER */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg border border-gray-700 text-white">
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
              {/* Visible */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Visible Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((c) => tempVisibleColumns[c])
                  .filter((c) => c.includes(columnSearch))
                  .map((col) => (
                    <div key={col} className="bg-gray-800 px-3 py-2 rounded mb-2 flex justify-between">
                      <span>{col.toUpperCase()}</span>
                      <button className="text-red-400" onClick={() => toggleTempColumn(col)}>
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((c) => !tempVisibleColumns[c])
                  .filter((c) => c.includes(columnSearch))
                  .map((col) => (
                    <div key={col} className="bg-gray-800 px-3 py-2 rounded mb-2 flex justify-between">
                      <span>{col.toUpperCase()}</span>
                      <button className="text-green-400" onClick={() => toggleTempColumn(col)}>
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={restoreDefaultColumns} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button onClick={cancelColumnPicker} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                  Cancel
                </button>
                <button onClick={applyColumnPicker} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>

<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Meeting Types</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded"
          >
            <Plus size={16} /> New Type
          </button>

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

          <button onClick={openColumnPicker} className="p-2 bg-gray-700 border border-gray-600 rounded">
            <List size={16} className="text-blue-300" />
          </button>

          {/* INACTIVE toggle */}
          <button
            onClick={async () => {
              if (!showInactive) await loadInactive();
              setShowInactive((s) => !s);
            }}
            className={`p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1 ${showInactive ? "ring-1 ring-yellow-300" : ""}`}
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
                    onClick={() => setSortOrder((prev) => (prev === "asc" ? null : "asc"))}
                  />
                )}

                {visibleColumns.name && <th className="pb-1 border-b border-white text-center">Name</th>}
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="text-center">
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-6 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              )}

              {sortedRows.map((row) => (
                <tr key={row.id} className="bg-gray-900 hover:bg-gray-700 cursor-pointer" onClick={() => openEdit(row, false)}>
                  {visibleColumns.id && <td className="px-2 py-1 align-middle">{row.id}</td>}
                  {visibleColumns.name && <td className="px-2 py-1 align-middle">{row.name}</td>}
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
                    {visibleColumns.id && <td className="px-2 py-1 align-middle">{row.id}</td>}
                    {visibleColumns.name && <td className="px-2 py-1 align-middle">{row.name}</td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
           <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-gray-800 border border-gray-600 rounded px-2 py-1">
            {[10, 25, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>

          <button disabled={page === 1} onClick={() => setPage(1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
            <ChevronsLeft size={16} />
          </button>

          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>
          <input type="number" className="w-12 bg-gray-800 border border-gray-600 rounded text-center" value={page} onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= 1 && v <= totalPages) setPage(v);
          }} />
          <span>/ {totalPages}</span>

          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
            <ChevronRight size={16} />
          </button>

          <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
            <ChevronsRight size={16} />
          </button>

          <button onClick={() => loadRows()} className="p-1 bg-gray-800 border border-gray-700 rounded">
            <RefreshCw size={16} />
          </button>

          <span>Showing <b>{Math.min(start <= totalRecords ? start : 0, totalRecords)}</b> to <b>{end}</b> of <b>{totalRecords}</b> records</span>
        </div>
      </div>
      </div>
       </PageLayout>

    </>
  );
};

export default MeetingTypes;



