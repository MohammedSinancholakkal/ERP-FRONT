// src/pages/masters/ExpenseTypes.jsx
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
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getExpenseTypesApi,
  addExpenseTypeApi,
  updateExpenseTypeApi,
  deleteExpenseTypeApi,
  searchExpenseTypeApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const ExpenseTypes = () => {
  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // data
  const [expenseTypes, setExpenseTypes] = useState([]);

  // 🔥 PAGINATION ADDED (same as Banks)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // add form
  const [newType, setNewType] = useState("");

  // edit form
  const [editData, setEditData] = useState({
    id: null,
    type: "",
  });

  // column picker
  const defaultColumns = { id: true, type: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // search
  const [searchText, setSearchText] = useState("");

  const toggleColumn = (col) =>
    setVisibleColumns((p) => ({ ...p, [col]: !p[col] }));

  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  const [sortOrder, setSortOrder] = useState("asc");

  const sortedExpenseTypes = [...expenseTypes];

  if (sortOrder === "asc") {
    sortedExpenseTypes.sort((a, b) => {
      const idA = a.typeId ?? a.id;
      const idB = b.typeId ?? b.id;
      return idA - idB;
    });
  }

  // 🔥 UPDATED: supports backend pagination + search mode
  const loadExpenseTypes = async () => {
    try {
      // When searching, backend pagination is bypassed (search returns full list)
      if (searchText?.trim()) {
        const res = await searchExpenseTypeApi(searchText.trim());
        if (res?.status === 200) {
          // server might return array or { records: [], total: n }
          const items = Array.isArray(res.data)
            ? res.data
            : res.data?.records || [];
          setExpenseTypes(items);
          setTotalRecords(items.length);
        } else {
          toast.error("Failed to search expense types");
        }
        return;
      }

      // Normal paginated load
      const res = await getExpenseTypesApi(page, limit);
      if (res?.status === 200) {
        const { records = [], total = 0 } = res.data || {};
        setExpenseTypes(records || []);
        setTotalRecords(total || 0);
      } else {
        toast.error("Failed to load expense types");
      }
    } catch (err) {
      console.error("Load error:", err);
      toast.error("Failed to load expense types");
    }
  };

  // search
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      // clear search -> go back to paginated list
      setPage(1);
      loadExpenseTypes();
      return;
    }

    try {
      const res = await searchExpenseTypeApi(value);
      if (res?.status === 200) {
        const items = Array.isArray(res.data)
          ? res.data
          : res.data?.records || [];
        setExpenseTypes(items);
        setTotalRecords(items.length);
      } else {
        toast.error("Search failed");
      }
    } catch (err) {
      console.log("Search error:", err);
      toast.error("Search failed");
    }
  };

  // reload when page or limit changes
  useEffect(() => {
    loadExpenseTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // add
  const handleAdd = async () => {
    if (!newType.trim()) return toast.error("Type required");

    try {
      const res = await addExpenseTypeApi({
        typeName: newType.trim(),
        userId: currentUserId,
      });

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Expense type added");
        setModalOpen(false);
        setNewType("");
        // After add, go to first page and reload
        setPage(1);
        loadExpenseTypes();
      } else {
        toast.error(res?.response?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("Add error:", err);
      toast.error("Server error");
    }
  };

  // open edit modal
  const openEditModal = (item) => {
    setEditData({
      id: item.typeId ?? item.id,
      type: item.typeName ?? item.type ?? "",
    });
    setEditModalOpen(true);
  };

  // update
  const handleUpdate = async () => {
    const { id, type } = editData;

    if (!type.trim()) return toast.error("Type required");

    try {
      const res = await updateExpenseTypeApi(id, {
        typeName: type.trim(),
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadExpenseTypes();
      } else {
        toast.error(res?.response?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Server error");
    }
  };

  // delete
  const handleDelete = async () => {
    const id = editData.id;

    try {
      const res = await deleteExpenseTypeApi(id, { userId: currentUserId });

      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);

        // adjust page if last record on page deleted
        const newTotal = Math.max(0, totalRecords - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));
        if (page > newTotalPages) setPage(newTotalPages);

        loadExpenseTypes();
      } else {
        toast.error(res?.response?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Server error");
    }
  };

  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Expense Type</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">
                Type <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Enter type"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm"
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
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                Edit Expense Type ({editData.type})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">
                Type <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={editData.type}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, type: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded border border-red-900"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded border border-gray-600 text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[750px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X size={22} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="px-5 py-4">
              <input
                type="text"
                placeholder="search..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible */}
              <div className="bg-gray-900/40 border border-gray-700 p-4 rounded">
                <h3 className="mb-3 font-medium">👁 Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-800 p-2 rounded mb-2"
                    >
                      <span>☰ {col.toUpperCase()}</span>
                      <button
                        className="text-red-400"
                        onClick={() => toggleColumn(col)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden */}
              <div className="bg-gray-900/40 border border-gray-700 p-4 rounded">
                <h3 className="mb-3 font-medium">📋 Hidden Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-800 p-2 rounded mb-2"
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

                {Object.keys(visibleColumns).filter((c) => !visibleColumns[c])
                  .length === 0 && (
                  <p className="text-gray-400 text-sm">No hidden columns</p>
                )}
              </div>
            </div>

            <div className="flex justify-between px-5 py-3 border-t border-gray-700">
              <button
                onClick={restoreDefaultColumns}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModal(false)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
                <button
                  onClick={() => setColumnModal(false)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 text-white min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Expense Types</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            {/* SEARCH BAR */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded border border-gray-600 w-full sm:w-60">
              <Search size={16} className="text-gray-300" />
              <input
                className="bg-transparent pl-2 w-full text-sm text-gray-200 outline-none"
                placeholder="search..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* ADD NEW */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 border border-gray-600 rounded text-sm hover:bg-gray-600"
            >
              <Plus size={16} /> New Type
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadExpenseTypes();
              }}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
            >
              <RefreshCw className="text-blue-400" size={16} />
            </button>

            {/* COLUMN PICKER */}
            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
            >
              <List className="text-blue-300" size={16} />
            </button>
          </div>

          {/* RESPONSIVE TABLE */}
          <div className="flex-grow overflow-auto w-full min-h-0">
            <div className="w-full overflow-auto">
              <table className="w-[390px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">
                    {visibleColumns.id && (
                      <SortableHeader
                        label="ID"
                        sortOrder={sortOrder}
                        onClick={() =>
                          setSortOrder((prev) =>
                            prev === "asc" ? null : "asc"
                          )
                        }
                      />
                    )}

                    {visibleColumns.type && (
                      <th className="pb-1 border-b border-white text-center">
                        Type
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {sortedExpenseTypes.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          Object.values(visibleColumns).filter(Boolean).length
                        }
                        className="px-4 py-6 text-center text-gray-400"
                      >
                        No records found
                      </td>
                    </tr>
                  )}

                  {sortedExpenseTypes.map((item) => {
                    const id = item.typeId ?? item.id;

                    return (
                      <tr
                        key={id}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                        onClick={() => openEditModal(item)}
                      >
                        {visibleColumns.id && (
                          <td className="px-2 py-1 text-center">{id}</td>
                        )}

                        {visibleColumns.type && (
                          <td className="px-2 py-1 text-center">
                            {item.typeName ?? item.type}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------------- STICKY PAGINATION (Banks-style) ---------------- */}
          <div className="mt-5 sticky bottom-0 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
            <div className="flex flex-wrap items-center gap-3 bg-transparent rounded text-sm">
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
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= totalPages) setPage(value);
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
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadExpenseTypes();
                }}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <RefreshCw size={16} />
              </button>

              <span>
                Showing <b>{start <= totalRecords ? start : 0}</b> to{" "}
                <b>{end}</b> of <b>{totalRecords}</b> records
              </span>
            </div>
          </div>
          {/* end sticky pagination */}
        </div>
      </div>
    </>
  );
};

export default ExpenseTypes;
