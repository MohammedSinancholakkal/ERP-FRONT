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
  getCustomerGroupsApi,
  addCustomerGroupApi,
  updateCustomerGroupApi,
  deleteCustomerGroupApi,
  searchCustomerGroupApi,
  getInactiveCustomerGroupsApi,
  restoreCustomerGroupApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";

const CustomerGroups = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // Data
  const [groups, setGroups] = useState([]);
  const [inactiveGroups, setInactiveGroups] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ADD FORM
  const [newData, setNewData] = useState({
    name: "",
    description: "",
  });

  // EDIT FORM
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    description: "",
    isInactive: false,
  });

  // COLUMN PICKER
  const defaultCols = { id: true, name: true, description: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultCols);
  const [tempCols, setTempCols] = useState(defaultCols); // used inside modal
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumnTemp = (col) =>
    setTempCols((prev) => ({ ...prev, [col]: !prev[col] }));

  const restoreDefaults = () => setTempCols(defaultCols);

  const applyColumnChanges = () => {
    setVisibleColumns(tempCols);
    setColumnModal(false);
  };

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  const [sortOrder, setSortOrder] = useState("asc");

  const sortedGroups = [...groups];
  if (sortOrder === "asc") {
    sortedGroups.sort((a, b) => Number(a.id) - Number(b.id));
  }

  // LOAD GROUPS
  const loadGroups = async () => {
    try {
      const res = await getCustomerGroupsApi(page, limit);

      if (res?.status === 200) {
        const rows = Array.isArray(res.data) ? res.data : res.data.records || [];
        setGroups(
          rows.map((g) => ({
            id: g.Id,
            name: g.GroupName,
            description: g.Description,
          }))
        );

        // prefer server total when provided
        const total = res.data && res.data.total ? res.data.total : rows.length;
        setTotalRecords(total);
      } else {
        toast.error("Failed to load customer groups");
      }
    } catch (err) {
      console.error("loadGroups error:", err);
      toast.error("Failed to load customer groups");
    }
  };

  useEffect(() => {
    loadGroups();
  }, [page, limit]);

  // LOAD INACTIVE GROUPS
  const loadInactive = async () => {
    try {
      const res = await getInactiveCustomerGroupsApi();
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        setInactiveGroups(
          rows.map((g) => ({
            id: g.Id,
            name: g.GroupName,
            description: g.Description,
          }))
        );
      } else {
        toast.error("Failed to load inactive groups");
      }
    } catch (err) {
      console.error("loadInactive error:", err);
      toast.error("Failed to load inactive groups");
    }
  };

  // SEARCH
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      setPage(1);
      loadGroups();
      return;
    }

    try {
      const res = await searchCustomerGroupApi(value);
      if (res?.status === 200) {
        const rows = res.data || [];
        setGroups(
          rows.map((g) => ({
            id: g.Id,
            name: g.GroupName,
            description: g.Description,
          }))
        );
        setTotalRecords(rows.length);
      }
    } catch (err) {
      console.error("search error:", err);
    }
  };

  // ADD
  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Group name is required");

    try {
      const res = await addCustomerGroupApi({
        groupName: newData.name,
        description: newData.description,
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Customer Group added");
        setModalOpen(false);
        setNewData({ name: "", description: "" });
        // reload first page
        setPage(1);
        loadGroups();
      } else {
        toast.error(res?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("add error:", err);
      toast.error("Server error");
    }
  };

  // OPEN EDIT (correct name used throughout)
  const openEdit = (row, inactive = false) => {
    setEditData({
      id: row.id,
      name: row.name,
      description: row.description,
      isInactive: inactive,
    });
    setEditModalOpen(true);
  };

  // UPDATE
  const handleUpdate = async () => {
    if (!editData.name.trim()) return toast.error("Group name is required");

    try {
      const res = await updateCustomerGroupApi(editData.id, {
        groupName: editData.name,
        description: editData.description,
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadGroups();
        if (showInactive) loadInactive();
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("update error:", err);
      toast.error("Server error");
    }
  };

  // DELETE (soft delete)
  const handleDelete = async () => {
    try {
      const res = await deleteCustomerGroupApi(editData.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        // refresh lists
        loadGroups();
        if (showInactive) loadInactive();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("delete error:", err);
      toast.error("Server error");
    }
  };

  // RESTORE
  const handleRestore = async () => {
    try {
      const res = await restoreCustomerGroupApi(editData.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Customer Group restored");
        setEditModalOpen(false);
        loadGroups();
        loadInactive();
      } else {
        toast.error(res?.data?.message || "Restore failed");
      }
    } catch (err) {
      console.error("restore error:", err);
      toast.error("Server error");
    }
  };

  // When opening column modal, copy visibleColumns into temp so modal edits don't reflect until OK
  const openColumnModal = () => {
    setTempCols(visibleColumns);
    setColumnModal(true);
  };

  // =============================================================
  // UI START
  // =============================================================
  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Customer Group</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm text-gray-300">
                  Group Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newData.name}
                  onChange={(e) =>
                    setNewData((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  value={newData.description}
                  onChange={(e) =>
                    setNewData((p) => ({ ...p, description: e.target.value }))
                  }
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

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

      {/* EDIT / RESTORE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editData.isInactive ? "Restore Customer Group" : "Edit Customer Group"} (
                {editData.name})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300">Group Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, name: e.target.value }))
                  }
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  rows="3"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, description: e.target.value }))
                  }
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {editData.isInactive ? (
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

              {!editData.isInactive && (
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

      {/* COLUMN PICKER MODAL */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Visible Columns</h3>

                {Object.keys(tempCols)
                  .filter((col) => tempCols[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        onClick={() => toggleColumnTemp(col)}
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>

                {Object.keys(tempCols)
                  .filter((col) => !tempCols[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        onClick={() => toggleColumnTemp(col)}
                        className="text-green-400"
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={restoreDefaults}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={applyColumnChanges}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
                <button
                  onClick={() => setColumnModal(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>

<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Customer Groups</h2>

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
            <Plus size={16} /> New Group
          </button>

          <button
            onClick={() => {
              setSearchText("");
              setPage(1);
              loadGroups();
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <button
            onClick={() => openColumnModal()}
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
            className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto min-h-0">
          <table className="w-[650px] border-separate border-spacing-y-1 text-sm">
            {/* HEADER */}
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="text-white">
                {/* Sortable ID */}
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
                  <th className="pb-1 border-b border-white text-center">Group Name</th>
                )}

                {visibleColumns.description && (
                  <th className="pb-1 border-b border-white text-center">Description</th>
                )}
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {sortedGroups.length === 0 && (
                <tr>
                  <td
                    colSpan={Object.values(visibleColumns).filter(Boolean).length}
                    className="text-center py-4 text-gray-400"
                  >
                    No records found
                  </td>
                </tr>
              )}

              {sortedGroups.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => openEdit(g, false)}
                  className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                >
                  {visibleColumns.id && <td className="px-2 py-1 text-center">{g.id}</td>}
                  {visibleColumns.name && <td className="px-2 py-1 text-center">{g.name}</td>}
                  {visibleColumns.description && <td className="px-2 py-1 text-center">{g.description}</td>}
                </tr>
              ))}

              {/* INACTIVE ROWS */}
              {showInactive &&
                inactiveGroups.map((g) => (
                  <tr
                    key={`inactive-${g.id}`}
                    onClick={() => openEdit(g, true)}
                    className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer"
                  >
                    {visibleColumns.id && <td className="px-2 py-1 text-center">{g.id}</td>}
                    {visibleColumns.name && <td className="px-2 py-1 text-center">{g.name}</td>}
                    {visibleColumns.description && <td className="px-2 py-1 text-center">{g.description}</td>}
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

          <button onClick={() => loadGroups()} className="p-1 bg-gray-800 border border-gray-700 rounded">
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <span>
            Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
          </span>
        </div>
      </div>
      </div>
     </PageLayout>

    </>
  );
};

export default CustomerGroups;
