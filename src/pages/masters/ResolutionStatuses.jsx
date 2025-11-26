// src/pages/masters/ResolutionStatuses.jsx
import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getResolutionStatusesApi,
  addResolutionStatusApi,
  updateResolutionStatusApi,
  deleteResolutionStatusApi,
  searchResolutionStatusApi,
  getInactiveResolutionStatusesApi,
  restoreResolutionStatusApi,
} from "../../services/allAPI";

import SortableHeader from "../../components/SortableHeader";

const ResolutionStatuses = () => {
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // DATA
  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  // USER
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ADD FORM
  const [newItem, setNewItem] = useState("");

  // EDIT FORM
  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    isInactive: false,
  });

  // COLUMN PICKER
  const defaultColumns = { id: true, name: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const toggleColumn = (col) =>
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  const [columnSearch, setColumnSearch] = useState("");

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // SORTING
  const [sortOrder, setSortOrder] = useState("asc");
  const sortedActiveRows = [...rows];
  if (sortOrder === "asc") {
    sortedActiveRows.sort((a, b) => Number(a.id) - Number(b.id));
  }

  // ================================
  // LOAD ACTIVE
  // ================================
  const loadRows = async () => {
    try {
      const res = await getResolutionStatusesApi(page, limit);

      if (res?.status === 200) {
        const items = res.data.records || [];

        const normalized = items.map((r) => ({
          id: r.Id ?? r.id,
          name: r.Name ?? r.name,
        }));

        setRows(normalized);
        setTotalRecords(res.data.total);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading data");
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit]);

  // ================================
  // LOAD INACTIVE
  // ================================
  const loadInactive = async () => {
    try {
      const res = await getInactiveResolutionStatusesApi();
      if (res?.status === 200) {
        const items = res.data.records || res.data || [];

        const normalized = items.map((r) => ({
          id: r.Id ?? r.id,
          name: r.Name ?? r.name,
        }));

        setInactiveRows(normalized);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inactive");
    }
  };

  // ================================
  // SEARCH
  // ================================
  const handleSearch = async (text) => {
    setSearchText(text);

    if (!text.trim()) return loadRows();

    try {
      const res = await searchResolutionStatusApi(text);
      if (res?.status === 200) {
        const normalized = res.data.map((r) => ({
          id: r.Id,
          name: r.Name,
        }));
        setRows(normalized);
        setTotalRecords(normalized.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================================
  // ADD
  // ================================
  const handleAdd = async () => {
    if (!newItem.trim()) return toast.error("Name required");

    try {
      const res = await addResolutionStatusApi({
        name: newItem,
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Added");
        setModalOpen(false);
        setNewItem("");
        setPage(1);
        loadRows();
      }
    } catch (err) {
      toast.error("Add failed");
    }
  };

  // ================================
  // OPEN EDIT
  // ================================
  const openEdit = (row, isInactive) => {
    setEditItem({
      id: row.id,
      name: row.name,
      isInactive: isInactive,
    });
    setEditModalOpen(true);
  };

  // ================================
  // UPDATE
  // ================================
  const handleUpdate = async () => {
    if (!editItem.name.trim()) return toast.error("Name required");

    try {
      const res = await updateResolutionStatusApi(editItem.id, {
        name: editItem.name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadRows();
      }
    } catch (err) {
      toast.error("Update error");
    }
  };

  // ================================
  // DELETE
  // ================================
  const handleDelete = async () => {
    try {
      const res = await deleteResolutionStatusApi(editItem.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadRows();
        loadInactive();
      }
    } catch (err) {
      toast.error("Delete error");
    }
  };

  // ================================
  // RESTORE
  // ================================
  const handleRestore = async () => {
    try {
      const res = await restoreResolutionStatusApi(editItem.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadRows();
        loadInactive();
      }
    } catch (err) {
      toast.error("Restore failed");
    }
  };
  return (
    <>
      {/* =============================
          ADD RESOLUTION STATUS MODAL
      ============================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">

            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Resolution Status</h2>

              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>

              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter resolution status"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================
          EDIT / RESTORE MODAL
      ============================== */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editItem.isInactive ? "Restore Resolution Status" : "Edit Resolution Status"} ({editItem.name})
              </h2>

              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>

              <input
                type="text"
                value={editItem.name}
                onChange={(e) =>
                  setEditItem((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={editItem.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none ${
                  editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">

              {/* RESTORE / DELETE BUTTONS */}
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

              {/* SAVE button only for ACTIVE */}
              {!editItem.isInactive && (
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
                >
                  <Save size={16} /> Save
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =============================
          COLUMN PICKER MODAL
      ============================== */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* SEARCH */}
            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="search columns..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-60 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            {/* VISIBLE / HIDDEN COLUMNS */}
            <div className="grid grid-cols-2 gap-4 px-5 pb-5">
              {/* VISIBLE */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">👁 Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                    >
                      <span>☰ {col.toUpperCase()}</span>
                      <button
                        className="text-red-400"
                        onClick={() => toggleColumn(col)}
                      >
                        ✖
                      </button>
                    </div>
                  ))}
              </div>

              {/* HIDDEN */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">📋 Hidden Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                    >
                      <span>☰ {col.toUpperCase()}</span>
                      <button
                        className="text-green-400"
                        onClick={() => toggleColumn(col)}
                      >
                        ➕
                      </button>
                    </div>
                  ))}

                {Object.keys(visibleColumns).filter((col) => !visibleColumns[col]).length === 0 && (
                  <p className="text-gray-400 text-sm">No hidden columns</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setVisibleColumns(defaultColumns)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <button
                onClick={() => setColumnModalOpen(false)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}
      {/* =============================
              MAIN PAGE
      ============================== */}
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Resolution Statuses</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">

            {/* SEARCH */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-60">
              <Search size={16} className="text-gray-300" />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent outline-none pl-2 text-gray-200 w-full text-sm"
              />
            </div>

            {/* ADD BUTTON */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"
            >
              <Plus size={16} /> New Status
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadRows();
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* COLUMN PICKER */}
            <button
              onClick={() => setColumnModalOpen(true)}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <List size={16} className="text-blue-300" />
            </button>

            {/* INACTIVE TOGGLE */}
            <button
              onClick={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
            </button>

          </div>

          {/* =============================
                  TABLE
          ============================== */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="w-[400px] text-left border-separate border-spacing-y-1 text-sm">

                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">

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

                <tbody>

                  {/* ACTIVE ROWS */}
                  {sortedActiveRows.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => openEdit(row, false)}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center">{row.id}</td>
                      )}

                      {visibleColumns.name && (
                        <td className="px-2 py-1 text-center">{row.name}</td>
                      )}
                    </tr>
                  ))}

                  {/* INACTIVE ROWS */}
                  {showInactive &&
                    inactiveRows.map((row) => (
                      <tr
                        key={`inactive-${row.id}`}
                        className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                        onClick={() => openEdit(row, true)}
                      >
                        {visibleColumns.id && (
                          <td className="px-2 py-1 text-center">{row.id}</td>
                        )}

                        {visibleColumns.name && (
                          <td className="px-2 py-1 text-center">{row.name}</td>
                        )}
                      </tr>
                    ))}

                </tbody>
              </table>
            </div>
          </div>

          {/* =============================
                PAGINATION (same as countries)
          ============================== */}
          <div className="mt-5 sticky bottom-0 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
            <div className="flex flex-wrap items-center gap-3 text-sm">

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <button disabled={page === 1} onClick={() => setPage(1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronsLeft size={16} />
              </button>

              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
                value={page}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= totalPages) setPage(value);
                }}
              />

              <span>/ {totalPages}</span>

              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronRight size={16} />
              </button>

              <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronsRight size={16} />
              </button>

              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadRows();
                }}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <RefreshCw size={16} />
              </button>

              <span>
                Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
              </span>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ResolutionStatuses;
