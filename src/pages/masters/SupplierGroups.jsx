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
  getSupplierGroupsApi,
  addSupplierGroupApi,
  updateSupplierGroupApi,
  deleteSupplierGroupApi,
  searchSupplierGroupApi,
  getInactiveSupplierGroupsApi,
  restoreSupplierGroupApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";

const SupplierGroups = () => {
  // modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // data
  const [groups, setGroups] = useState([]);
  const [inactiveGroups, setInactiveGroups] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // search
  const [searchText, setSearchText] = useState("");

  // user
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // add form
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  // edit form
  const [editGroup, setEditGroup] = useState({
    id: null,
    name: "",
    description: "",
    isInactive: false,
  });

  // column picker
  const defaultCols = { id: true, name: true, description: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultCols);

  // temp columns used inside modal
  const [tempColumns, setTempColumns] = useState(defaultCols);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleTempColumn = (col) =>
    setTempColumns((p) => ({ ...p, [col]: !p[col] }));

  const restoreTempDefaults = () => setTempColumns(defaultCols);

  const applyColumnChanges = () => {
    setVisibleColumns(tempColumns);
    setColumnModal(false);
  };

  const openColumnModal = () => {
    setTempColumns(visibleColumns);
    setColumnModal(true);
  };

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // sorting
  const [sortOrder, setSortOrder] = useState("asc");
  const sortedGroups = [...groups];
  if (sortOrder === "asc") {
    sortedGroups.sort((a, b) => Number(a.id) - Number(b.id));
  }

  // Normalize helper (handles different backend shapes)
  const normalizeRows = (rows = []) =>
    rows.map((r) => ({
      id: r.Id ?? r.id ?? r.supplierGroupId ?? null,
      name: r.GroupName ?? r.groupName ?? r.Name ?? r.name ?? "",
      description:
        r.Description ??
        r.description ??
        r.GroupDescription ??
        r.groupDescription ??
        "",
    }));

  // load active groups
  const loadGroups = async () => {
    try {
      const res = await getSupplierGroupsApi(page, limit);

      if (res?.status === 200) {
        const data = res.data;
        let rows = [];

        if (Array.isArray(data.records)) {
          rows = data.records;
          setTotalRecords(data.total ?? data.records.length);
        } else if (Array.isArray(data)) {
          rows = data;
          setTotalRecords(data.length);
        } else {
          rows = [];
          setTotalRecords(0);
        }

        setGroups(normalizeRows(rows));
      } else {
        toast.error("Failed to load supplier groups");
      }
    } catch (err) {
      console.error("Load supplier groups error:", err);
      toast.error("Failed to load supplier groups");
    }
  };

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // load inactive groups
  const loadInactive = async () => {
    try {
      const res = await getInactiveSupplierGroupsApi();
      if (res?.status === 200) {
        const rows = res.data.records ?? res.data ?? [];
        setInactiveGroups(normalizeRows(rows));
      } else {
        toast.error("Failed to load inactive groups");
      }
    } catch (err) {
      console.error("Load inactive groups error:", err);
      toast.error("Failed to load inactive groups");
    }
  };

  // search
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      setPage(1);
      loadGroups();
      return;
    }

    try {
      const res = await searchSupplierGroupApi(value);
      if (res?.status === 200) {
        const rows = Array.isArray(res.data) ? res.data : res.data.records ?? [];
        setGroups(normalizeRows(rows));
        setTotalRecords(rows.length);
      }
    } catch (err) {
      console.error("Search supplier groups error:", err);
    }
  };

  // add
  const handleAdd = async () => {
    if (!newGroup.name || !newGroup.name.trim()) {
      return toast.error("Name is required");
    }

    try {
      const res = await addSupplierGroupApi({
        groupName: newGroup.name.trim(),
        description: newGroup.description || "",
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Supplier group added");
        setModalOpen(false);
        setNewGroup({ name: "", description: "" });
        setPage(1);
        loadGroups();
      } else {
        toast.error(res?.response?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("Add supplier group error:", err);
      toast.error("Server error");
    }
  };

  // open edit (handles both active and inactive rows)
  const openEdit = (row, inactive = false) => {
    setEditGroup({
      id: row.id,
      name: row.name,
      description: row.description,
      isInactive: !!inactive,
    });
    setEditModalOpen(true);
  };

  // update
  const handleUpdate = async () => {
    if (!editGroup.name || !editGroup.name.trim()) return toast.error("Name is required");

    try {
      const res = await updateSupplierGroupApi(editGroup.id, {
        groupName: editGroup.name.trim(),
        description: editGroup.description || "",
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadGroups();
        if (showInactive) loadInactive();
      } else {
        toast.error(res?.response?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update supplier group error:", err);
      toast.error("Server error");
    }
  };

  // delete (soft)
  const handleDelete = async () => {
    try {
      const res = await deleteSupplierGroupApi(editGroup.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadGroups();
        if (showInactive) loadInactive();
      } else {
        toast.error(res?.response?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete supplier group error:", err);
      toast.error("Server error");
    }
  };

  // restore
  const handleRestore = async () => {
    try {
      const res = await restoreSupplierGroupApi(editGroup.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Supplier group restored");
        setEditModalOpen(false);
        loadGroups();
        loadInactive();
      } else {
        toast.error(res?.response?.data?.message || "Restore failed");
      }
    } catch (err) {
      console.error("Restore supplier group error:", err);
      toast.error("Server error");
    }
  };

  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Supplier Group</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  rows={3}
                  value={newGroup.description}
                  onChange={(e) => setNewGroup((p) => ({ ...p, description: e.target.value }))}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editGroup.isInactive ? "Restore Supplier Group" : "Edit Supplier Group"} ({editGroup.name})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300">Name</label>
                <input
                  type="text"
                  value={editGroup.name}
                  onChange={(e) => setEditGroup((p) => ({ ...p, name: e.target.value }))}
                  disabled={editGroup.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editGroup.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  rows={3}
                  value={editGroup.description}
                  onChange={(e) => setEditGroup((p) => ({ ...p, description: e.target.value }))}
                  disabled={editGroup.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editGroup.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {editGroup.isInactive ? (
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

              {!editGroup.isInactive && (
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
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg border border-gray-700 text-white">
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

                {Object.keys(tempColumns)
                  .filter((c) => tempColumns[c])
                  .filter((c) => c.includes(searchColumn))
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

                {Object.keys(tempColumns)
                  .filter((c) => !tempColumns[c])
                  .filter((c) => c.includes(searchColumn))
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
              <button onClick={restoreTempDefaults} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button onClick={applyColumnChanges} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                  OK
                </button>
                <button onClick={() => setColumnModal(false)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
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

    <h2 className="text-2xl font-semibold mb-4">Supplier Groups</h2>

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
        onClick={openColumnModal}
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
        className={`p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1 ${showInactive ? "ring-1 ring-yellow-300" : ""}`}
      >
        <ArchiveRestore size={16} className="text-yellow-300" />
        <span className="text-xs opacity-80">Inactive</span>
      </button>
    </div>

    {/* TABLE */}
    <div className="flex-grow overflow-auto min-h-0">
      <table className="w-[450px] border-separate border-spacing-y-1 text-sm">

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
              <th className="pb-1 border-b border-white">Name</th>
            )}

            {visibleColumns.description && (
              <th className="pb-1 border-b border-white">Description</th>
            )}
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="text-center">

          {/* No records */}
          {sortedGroups.length === 0 && inactiveGroups.length === 0 && (
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
          {sortedGroups.map((row) => (
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
              {visibleColumns.description && (
                <td className="px-2 py-1 align-middle">{row.description}</td>
              )}
            </tr>
          ))}

          {/* INACTIVE ROWS */}
          {showInactive &&
            inactiveGroups.map((row) => (
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
                {visibleColumns.description && (
                  <td className="px-2 py-1 align-middle">
                    {row.description}
                  </td>
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

      <button
        onClick={() => loadGroups()}
        className="p-1 bg-gray-800 border border-gray-700 rounded"
      >
        <RefreshCw size={16} />
      </button>

      <span>
        Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b> of{" "}
        <b>{totalRecords}</b> records
      </span>
    </div>

  </div>
</div>
</PageLayout>

    </>
  );
};

export default SupplierGroups;
