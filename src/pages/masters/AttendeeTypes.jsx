// src/pages/masters/AttendeeTypes.jsx

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
  getAttendeeTypesApi,
  addAttendeeTypeApi,
  updateAttendeeTypeApi,
  deleteAttendeeTypeApi,
  searchAttendeeTypeApi,
  getInactiveAttendeeTypesApi,
  restoreAttendeeTypeApi,
} from "../../services/allAPI";

import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";

const AttendeeTypes = () => {
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

  // Edit form
  const [editItem, setEditItem] = useState({ id: null, name: "" });
  const [isInactiveEdit, setIsInactiveEdit] = useState(false);

  // Column Picker
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

  const [sortOrder, setSortOrder] = useState("asc");

  // Sorting
  const sortedRows = [...rows];
  if (sortOrder === "asc") {
    sortedRows.sort((a, b) => Number(a.id) - Number(b.id));
  }

  // Load ACTIVE
  const loadRows = async () => {
    try {
      const res = await getAttendeeTypesApi(page, limit);

      if (res?.status === 200) {
        const data = res.data;

        const items = Array.isArray(data.records)
          ? data.records
          : Array.isArray(data)
          ? data
          : [];

        setTotalRecords(data.total || items.length);

        const normalized = items.map((r) => ({
          id: r.Id ?? r.id,
          name: r.Name ?? r.name,
        }));

        setRows(normalized);
      }
    } catch (err) {
      console.error("Load attendee types error:", err);
      toast.error("Error loading data");
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit]);

  // Load INACTIVE
  const loadInactiveRows = async () => {
    try {
      const res = await getInactiveAttendeeTypesApi();

      if (res?.status === 200) {
        const list = res.data.records || res.data;

        const normalized = list.map((r) => ({
          id: r.Id ?? r.id,
          name: r.Name ?? r.name,
          isInactive: true,
        }));

        setInactiveRows(normalized);
      }
    } catch (err) {
      console.error("Inactive load error:", err);
    }
  };

  // Search
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      loadRows();
      return;
    }

    try {
      const res = await searchAttendeeTypeApi(value);

      if (res?.status === 200) {
        const items = Array.isArray(res.data) ? res.data : [];

        const normalized = items.map((r) => ({
          id: r.Id,
          name: r.Name,
        }));

        setRows(normalized);
        setTotalRecords(normalized.length);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Add
  const handleAdd = async () => {
    if (!newItem.name.trim()) return toast.error("Name is required");

    try {
      const res = await addAttendeeTypeApi({
        name: newItem.name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Attendee type added");
        setModalOpen(false);
        setNewItem({ name: "" });
        setPage(1);
        loadRows();
      }
    } catch (err) {
      console.error("Add error:", err);
      toast.error("Server error");
    }
  };

  // Open edit modal
  const openEdit = (row) => {
    setEditItem({ id: row.id, name: row.name });
    setIsInactiveEdit(row.isInactive === true);
    setEditModalOpen(true);
  };

  // Update
  const handleUpdate = async () => {
    if (!editItem.name.trim()) return toast.error("Name is required");

    try {
      const res = await updateAttendeeTypeApi(editItem.id, {
        name: editItem.name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadRows();
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      const res = await deleteAttendeeTypeApi(editItem.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadRows();
        loadInactiveRows();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Restore
  const handleRestore = async () => {
    try {
      const res = await restoreAttendeeTypeApi(editItem.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadRows();
        loadInactiveRows();
      }
    } catch (err) {
      console.error("Restore error:", err);
      toast.error("Failed to restore");
    }
  };

  // Column picker open
  const openColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(true);
  };

  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[520px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Attendee Type</h2>
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[520px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {isInactiveEdit ? "Restore Attendee Type" : "Edit Attendee Type"}
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
                onChange={(e) =>
                  setEditItem((p) => ({ ...p, name: e.target.value }))
                }
                disabled={isInactiveEdit}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-2 ${
                  isInactiveEdit ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {isInactiveEdit ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded border border-green-900"
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

              {!isInactiveEdit ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                  >
                    <Save size={16} /> Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            {/* Columns */}
            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Visible Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((c) => tempVisibleColumns[c])
                  .filter((c) => c.includes(columnSearch))
                  .map((c) => (
                    <div
                      key={c}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{c.toUpperCase()}</span>
                      <button
                        className="text-red-400"
                        onClick={() =>
                          setTempVisibleColumns((p) => ({
                            ...p,
                            [c]: false,
                          }))
                        }
                      >
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
                  .map((c) => (
                    <div
                      key={c}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{c.toUpperCase()}</span>
                      <button
                        className="text-green-400"
                        onClick={() =>
                          setTempVisibleColumns((p) => ({
                            ...p,
                            [c]: true,
                          }))
                        }
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer */}
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
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
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
        <h2 className="text-2xl font-semibold mb-4">Attendee Types</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search */}
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {/* Add */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded"
          >
            <Plus size={16} /> New Type
          </button>

          {/* Refresh */}
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

          {/* Column Picker */}
          <button
            onClick={openColumnPicker}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>

          {/* Inactive Toggle */}
          <button
            onClick={async () => {
              if (!showInactive) await loadInactiveRows();
              setShowInactive(!showInactive);
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto">
          <table className="w-[350px] border-separate border-spacing-y-1 text-sm">
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

            <tbody className="text-center">
              {sortedRows.length === 0 && !showInactive && (
                <tr>
                  <td
                    colSpan={Object.values(visibleColumns).filter(Boolean).length}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No records found
                  </td>
                </tr>
              )}

              {/* ACTIVE */}
              {sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                  onClick={() => openEdit(row)}
                >
                  {visibleColumns.id && (
                    <td className="px-2 py-1">{row.id}</td>
                  )}

                  {visibleColumns.name && (
                    <td className="px-2 py-1">{row.name}</td>
                  )}
                </tr>
              ))}

              {/* INACTIVE */}
              {showInactive &&
                inactiveRows.map((row) => (
                  <tr
                    key={`inactive-${row.id}`}
                    className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer"
                    onClick={() => openEdit(row)}
                  >
                    {visibleColumns.id && (
                      <td className="px-2 py-1">{row.id}</td>
                    )}

                    {visibleColumns.name && (
                      <td className="px-2 py-1">{row.name}</td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
    <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
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

          <span>
            Showing <b>{Math.min(start, totalRecords)}</b> to <b>{end}</b> of{" "}
            <b>{totalRecords}</b> records
          </span>
        </div>
      </div>
</div>
</PageLayout>
    </>
  );
};

export default AttendeeTypes;



