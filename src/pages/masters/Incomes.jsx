// src/pages/masters/Incomes.jsx
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
  getIncomesApi,
  addIncomeApi,
  updateIncomeApi,
  deleteIncomeApi,
  searchIncomeApi,
  getInactiveIncomesApi,
  restoreIncomeApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";

const Incomes = () => {
  // Modals
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
  const [newItem, setNewItem] = useState({ name: "", description: "" });

  // Edit form
  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    description: "",
    isInactive: false,
  });

  // Column Picker
  const defaultColumns = { id: true, name: true, description: true };
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

  // ================================
  // Load ACTIVE rows
  // ================================
  const loadRows = async () => {
    try {
      const res = await getIncomesApi(page, limit);

      if (res?.status === 200) {
        const data = res.data;
        let items = [];

        if (Array.isArray(data.records)) {
          items = data.records;
          setTotalRecords(data.total ?? data.records.length);
        } else if (Array.isArray(data)) {
          items = data;
          setTotalRecords(data.length);
        }

        const normalized = items.map((r) => ({
          id: r.Id ?? r.id,
          incomeName: r.IncomeName ?? r.Name ?? r.name ?? "",
          description: r.Description ?? r.Description ?? r.description ?? "",
        }));

        setRows(normalized);
      } else {
        toast.error("Failed to load incomes");
      }
    } catch (err) {
      console.error("Load incomes error:", err);
      toast.error("Server Error");
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit]);

  // ================================
  // Load INACTIVE rows
  // ================================
  const loadInactive = async () => {
    try {
      const res = await getInactiveIncomesApi();
      if (res?.status === 200) {
        const items = res.data.records || res.data || [];
        const normalized = items.map((r) => ({
          id: r.Id ?? r.id,
          incomeName: r.IncomeName ?? r.Name ?? r.name ?? "",
          description: r.Description ?? r.description ?? "",
        }));
        setInactiveRows(normalized);
      }
    } catch (err) {
      console.error("Load inactive incomes error:", err);
      toast.error("Failed to load inactive incomes");
    }
  };

  // ================================
  // Search
  // ================================
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      loadRows();
      return;
    }

    try {
      const res = await searchIncomeApi(value);
      if (res?.status === 200) {
        const items = res.data || [];
        const normalized = items.map((r) => ({
          id: r.Id ?? r.id,
          incomeName: r.IncomeName ?? r.Name ?? r.name ?? "",
          description: r.Description ?? r.description ?? "",
        }));
        setRows(normalized);
        setTotalRecords(normalized.length);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // ================================
  // Add
  // ================================
  const handleAdd = async () => {
    if (!newItem.name.trim()) return toast.error("Name is required");

    try {
      const res = await addIncomeApi({
        incomeName: newItem.name.trim(),
        description: newItem.description.trim(),
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Income added");
        setModalOpen(false);
        setNewItem({ name: "", description: "" });
        setPage(1);
        loadRows();
      } else {
        toast.error("Add failed");
      }
    } catch (err) {
      console.error("Add income error:", err);
      toast.error("Server error");
    }
  };

  // ================================
  // Open edit modal (supports inactive)
  // ================================
  const openEdit = (row, isInactive = false) => {
    setEditItem({
      id: row.id,
      name: row.incomeName ?? row.name ?? "",
      description: row.description ?? "",
      isInactive,
    });
    setEditModalOpen(true);
  };

  // ================================
  // Update
  // ================================
  const handleUpdate = async () => {
    if (!editItem.name.trim()) return toast.error("Name is required");

    try {
      const res = await updateIncomeApi(editItem.id, {
        incomeName: editItem.name.trim(),
        description: editItem.description.trim(),
        userId: currentUserId,
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
      console.error("Update error:", err);
      toast.error("Server error");
    }
  };

  // ================================
  // Delete (soft)
  // ================================
  const handleDelete = async () => {
    try {
      const res = await deleteIncomeApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Server error");
    }
  };

  // ================================
  // Restore
  // ================================
  const handleRestore = async () => {
    try {
      const res = await restoreIncomeApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadRows();
        loadInactive();
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error("Restore error:", err);
      toast.error("Server error");
    }
  };

  // Column picker helpers
  const openColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(true);
  };

  const toggleTempColumn = (col) =>
    setTempVisibleColumns((p) => ({ ...p, [col]: !p[col] }));

  const restoreDefaultColumns = () => {
    setTempVisibleColumns(defaultColumns);
  };

  // Render
  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            {/* HEADER */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Income</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6">
              <label className="block text-sm mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                placeholder="Enter income name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />

              <label className="block text-sm mt-4 mb-1">Description</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-24 outline-none focus:border-white"
              />
            </div>

            {/* FOOTER */}
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

      {/* EDIT / RESTORE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            {/* HEADER */}
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editItem.isInactive ? "Restore Income" : "Edit Income"} ({editItem.name})
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={editItem.name}
                onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                disabled={editItem.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none ${
                  editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />

              <label className="block text-sm mt-4 mb-1">Description</label>
              <textarea
                value={editItem.description}
                onChange={(e) => setEditItem((p) => ({ ...p, description: e.target.value }))}
                disabled={editItem.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-24 outline-none ${
                  editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

            {/* FOOTER */}
            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {/* RESTORE OR DELETE */}
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

              {/* SAVE */}
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

      {/* COLUMN PICKER */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModalOpen(false)} className="text-gray-300 hover:text-white">
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

            {/* VISIBLE / HIDDEN */}
            <div className="grid grid-cols-2 gap-4 px-5 pb-5">
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">👁 Visible Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div key={col} className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2">
                      <span>☰ {col.toUpperCase()}</span>
                      <button className="text-red-400" onClick={() => setVisibleColumns((p) => ({ ...p, [col]: false }))}>✖</button>
                    </div>
                  ))}
              </div>

              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">📋 Hidden Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div key={col} className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2">
                      <span>☰ {col.toUpperCase()}</span>
                      <button className="text-green-400" onClick={() => setVisibleColumns((p) => ({ ...p, [col]: true }))}>➕</button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={() => setVisibleColumns(defaultColumns)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">Restore Defaults</button>
              <button onClick={() => setColumnModalOpen(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
            <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Incomes</h2>

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

            {/* ADD */}
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600">
              <Plus size={16} /> New Income
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadRows();
                if (showInactive) loadInactive();
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* COLUMN PICKER */}
            <button onClick={() => setColumnModalOpen(true)} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600">
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

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="w-[450px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">
                    {visibleColumns.id && (
                      <th
                        className="pb-1 border-b border-white text-center cursor-pointer select-none"
                        onClick={() => setSortOrder((prev) => (prev === "asc" ? null : "asc"))}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {sortOrder === "asc" && <span>▲</span>}
                          {sortOrder === null && <span className="opacity-40">⬍</span>}
                          <span>ID</span>
                        </div>
                      </th>
                    )}

                    {visibleColumns.name && (
                      <th className="pb-1 border-b border-white text-center">Name</th>
                    )}

                    {visibleColumns.description && (
                      <th className="pb-1 border-b border-white text-center">Description</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE ROWS */}
                  {sortedRows.map((r) => (
                    <tr
                      key={r.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => openEdit(r, false)}
                    >
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{r.id}</td>}
                      {visibleColumns.name && <td className="px-2 py-1 text-center">{r.incomeName}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{r.description}</td>}
                    </tr>
                  ))}

                  {/* INACTIVE ROWS */}
                  {showInactive &&
                    inactiveRows.map((r) => (
                      <tr
                        key={`inactive-${r.id}`}
                        className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                        onClick={() => openEdit(r, true)}
                      >
                        {visibleColumns.id && <td className="px-2 py-1 text-center">{r.id}</td>}
                        {visibleColumns.name && <td className="px-2 py-1 text-center">{r.incomeName}</td>}
                        {visibleColumns.description && <td className="px-2 py-1 text-center">{r.description}</td>}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
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
                  <option key={n} value={n}>
                    {n}
                  </option>
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
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= totalPages) setPage(v);
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
                  if (showInactive) loadInactive();
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
      </PageLayout>
    </>
  );
};

export default Incomes;



