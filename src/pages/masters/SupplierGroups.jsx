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
  getSupplierGroupsApi,
  addSupplierGroupApi,
  updateSupplierGroupApi,
  deleteSupplierGroupApi,
  searchSupplierGroupApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const SupplierGroups = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [groups, setGroups] = useState([]);
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // add form
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  // edit form
  const [editGroup, setEditGroup] = useState({
    id: null,
    name: "",
    description: "",
  });

  // column picker
  const defaultCols = { id: true, name: true, description: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultCols);

  // temp columns used inside modal (OK applies changes)
  const [tempColumns, setTempColumns] = useState(defaultCols);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleTempColumn = (col) =>
    setTempColumns((p) => ({ ...p, [col]: !p[col] }));

  const restoreTempDefaults = () => setTempColumns(defaultCols);

  // pagination
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


  // load groups
  const loadGroups = async () => {
    try {
      const res = await getSupplierGroupsApi(page, limit);

      if (res?.status === 200) {
        const data = res.data;
        let rows = [];

        if (Array.isArray(data.records)) {
          rows = data.records;
          setTotalRecords(data.total || data.records.length);
        } else if (Array.isArray(data)) {
          rows = data;
          setTotalRecords(data.length);
        } else {
          rows = [];
          setTotalRecords(0);
        }

        // normalize to consistent keys
        const normalized = rows.map((r) => ({
          id: r.Id ?? r.id ?? r.supplierGroupId,
          name: r.GroupName ?? r.groupName ?? r.Name ?? r.name,
          description:
            r.Description ?? r.description ?? r.GroupDescription ?? r.groupDescription ?? "",
        }));

        setGroups(normalized);
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
    // when opening column modal, copy current visible to temp
  }, [page, limit]);

  // search
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      loadGroups();
      return;
    }

    try {
      const res = await searchSupplierGroupApi(value);
      if (res?.status === 200) {
        const rows = Array.isArray(res.data) ? res.data : res.data.records ?? [];
        const normalized = rows.map((r) => ({
          id: r.Id ?? r.id,
          name: r.GroupName ?? r.name,
          description: r.Description ?? r.description,
        }));
        setGroups(normalized);
        setTotalRecords(normalized.length);
      }
    } catch (err) {
      console.error("Search supplier groups error:", err);
    }
  };

  // add
  const handleAdd = async () => {
    if (!newGroup.name || !newGroup.name.trim()) return toast.error("Name is required");

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
        // refresh current page
        loadGroups();
      } else {
        toast.error(res?.response?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("Add supplier group error:", err);
      toast.error("Server error");
    }
  };

  const openEdit = (row) => {
    setEditGroup({
      id: row.id,
      name: row.name,
      description: row.description,
    });
    setEditModalOpen(true);
  };

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
      } else {
        toast.error(res?.response?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update supplier group error:", err);
      toast.error("Server error");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteSupplierGroupApi(editGroup.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadGroups();
      } else {
        toast.error(res?.response?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete supplier group error:", err);
      toast.error("Server error");
    }
  };

  // open column modal and copy current visibleColumns to tempColumns
  const openColumnModal = () => {
    setTempColumns(visibleColumns);
    setColumnModal(true);
  };

  // apply tempColumns to visibleColumns when OK clicked
  const applyColumnChanges = () => {
    setVisibleColumns(tempColumns);
    setColumnModal(false);
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

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Supplier Group ({editGroup.name})</h2>
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
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  rows={3}
                  value={editGroup.description}
                  onChange={(e) => setEditGroup((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
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
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded border border-gray-600"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER (uses tempColumns; OK applies) */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
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
              <button
                  onClick={() => setColumnModal(false)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                >
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
      <div className="p-4 sm:p-6 text-white min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col">
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

          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded">
            <Plus size={16} /> New Group
          </button>

          <button onClick={() => loadGroups()} className="p-2 bg-gray-700 border border-gray-600 rounded">
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <button onClick={openColumnModal} className="p-2 bg-gray-700 border border-gray-600 rounded">
            <List size={16} className="text-blue-300" />
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto">
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
      {sortedGroups.length === 0 && (
        <tr>
          <td
            colSpan={Object.values(visibleColumns).filter(Boolean).length}
            className="px-4 py-6 text-center text-gray-400"
          >
            No records found
          </td>
        </tr>
      )}

      {sortedGroups.map((row) => (
        <tr
          key={row.id}
          className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
          onClick={() => openEdit(row)}
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

          <button onClick={() => loadGroups()} className="p-1 bg-gray-800 border border-gray-700 rounded">
            <RefreshCw size={16} />
          </button>

          <span>Showing <b>{start}</b> to <b>{end}</b> of <b>{totalRecords}</b> records</span>
        </div>
      </div>
    </>
  );
};

export default SupplierGroups;
