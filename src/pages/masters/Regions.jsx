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
  getRegionsApi,
  addRegionApi,
  updateRegionApi,
  deleteRegionApi,
  searchRegionApi,
  getInactiveRegionsApi,
  restoreRegionApi,
} from "../../services/allAPI";

const Regions = () => {
  // MODALS
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // LIST DATA
  const [regions, setRegions] = useState([]);
  const [inactiveRegions, setInactiveRegions] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // ADD FORM
  const [newRegionName, setNewRegionName] = useState("");

  // EDIT FORM
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    isInactive: false,
  });

  // SEARCH
  const [searchText, setSearchText] = useState("");

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // COLUMNS
  const defaultColumns = { id: true, name: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) =>
    setVisibleColumns((p) => ({ ...p, [col]: !p[col] }));
  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  // SORT ORDER
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedRegions = [...regions];
  if (sortOrder === "asc") {
    sortedRegions.sort((a, b) => a.regionId - b.regionId);
  }

  // USER
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // LOAD ACTIVE REGIONS
  const loadRegions = async () => {
    setSearchText("");
    const res = await getRegionsApi(page, limit);
    if (res?.status === 200) {
      setRegions(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      toast.error("Failed to load regions");
    }
  };

  useEffect(() => {
    loadRegions();
  }, [page, limit]);

  // LOAD INACTIVE REGIONS
  const loadInactive = async () => {
    const res = await getInactiveRegionsApi();
    if (res?.status === 200) {
      setInactiveRegions(res.data.records || res.data);
    } else {
      toast.error("Failed to load inactive records");
    }
  };

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) return loadRegions();

    const res = await searchRegionApi(text);
    if (res?.status === 200) {
      setRegions(res.data);
      setTotalRecords(res.data.length);
    }
  };

  // ADD REGION
  const handleAddRegion = async () => {
    if (!newRegionName.trim()) return toast.error("Name required");

    const res = await addRegionApi({
      regionName: newRegionName.trim(),
      userId: currentUserId,
    });

    if (res?.status === 201) {
      toast.success("Region added");
      setModalOpen(false);
      setNewRegionName("");
      loadRegions();
    } else {
      toast.error("Failed to add");
    }
  };

  // OPEN EDIT MODAL
  const openEdit = (r, inactive = false) => {
    setEditData({
      id: r.regionId,
      name: r.regionName,
      isInactive: inactive,
    });
    setEditModalOpen(true);
  };

  // UPDATE REGION
  const handleUpdateRegion = async () => {
    if (!editData.name.trim()) return toast.error("Name required");

    const res = await updateRegionApi(editData.id, {
      regionName: editData.name,
      userId: currentUserId,
    });

    if (res?.status === 200) {
      toast.success("Region updated");
      setEditModalOpen(false);
      loadRegions();
      if (showInactive) loadInactive();
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE REGION
  const handleDeleteRegion = async () => {
    const res = await deleteRegionApi(editData.id, { userId: currentUserId });

    if (res?.status === 200) {
      toast.success("Region deleted");
      setEditModalOpen(false);
      loadRegions();
      if (showInactive) loadInactive();
    } else {
      toast.error("Delete failed");
    }
  };

  // RESTORE REGION
  const handleRestoreRegion = async () => {
    const res = await restoreRegionApi(editData.id, { userId: currentUserId });

    if (res?.status === 200) {
      toast.success("Region restored");
      setEditModalOpen(false);
      loadRegions();
      loadInactive();
    } else {
      toast.error("Failed to restore");
    }
  };

  return (
    <>
      {/* ADD REGION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Region</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block mb-1 text-sm">Name *</label>
              <input
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddRegion}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
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
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editData.isInactive ? "Restore Region" : "Edit Region"} ({editData.name})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block mb-1 text-sm">Name *</label>

              <input
                type="text"
                value={editData.name}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, name: e.target.value }))
                }
                disabled={editData.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm ${
                  editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">

              {editData.isInactive ? (
                <button
                  onClick={handleRestoreRegion}
                  className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              ) : (
                <button
                  onClick={handleDeleteRegion}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {!editData.isInactive && (
                <button
                  onClick={handleUpdateRegion}
                  className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="search columns..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-60 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 px-5 pb-5">
              {/* VISIBLE */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">👁 Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
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
                  .filter((col) => col.includes(searchColumn))
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

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={restoreDefaultColumns}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <button
                onClick={() => setColumnModal(false)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                OK
              </button>

            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col h-[calc(100vh-80px)] overflow-hidden">

        <h2 className="text-2xl font-semibold mb-4">Regions</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">

          {/* SEARCH */}
          <div className="flex items-center bg-gray-700 rounded-md border border-gray-600 px-2 py-1.5 w-full sm:w-60">
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
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"
          >
            <Plus size={16} /> New Region
          </button>

          {/* REFRESH */}
          <button
            onClick={() => {
              setSearchText("");
              setPage(1);
              loadRegions();
            }}
            className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          {/* COLUMNS */}
          <button
            onClick={() => setColumnModal(true)}
            className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <List size={16} className="text-blue-300" />
          </button>

          {/* INACTIVE TOGGLE */}
          <button
            onClick={async () => {
              if (!showInactive) await loadInactive();
              setShowInactive(!showInactive);
            }}
            className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 flex items-center gap-1"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>

        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto min-h-0 w-full">
          <table className="w-[400px] border-separate border-spacing-y-1 text-sm">
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="text-white">

                {visibleColumns.id && (
                  <th
                    className="pb-1 border-b border-white text-center cursor-pointer select-none"
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? null : "asc"))
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      {sortOrder === "asc" && <span>▲</span>}
                      {sortOrder === null && <span className="opacity-40">⬍</span>}
                      <span>ID</span>
                    </div>
                  </th>
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
              {sortedRegions.map((r) => (
                <tr
                  key={r.regionId}
                  className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded"
                  onClick={() => openEdit(r, false)}
                >
                  {visibleColumns.id && (
                    <td className="px-2 py-1 text-center">{r.regionId}</td>
                  )}
                  {visibleColumns.name && (
                    <td className="px-2 py-1 text-center">{r.regionName}</td>
                  )}
                </tr>
              ))}

              {/* INACTIVE ROWS */}
              {showInactive &&
                inactiveRegions.map((r) => (
                  <tr
                    key={`inactive-${r.regionId}`}
                    className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded"
                    onClick={() => openEdit(r, true)}
                  >
                    {visibleColumns.id && (
                      <td className="px-2 py-1 text-center">{r.regionId}</td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-2 py-1 text-center">{r.regionName}</td>
                    )}
                  </tr>
                ))}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="mt-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">

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

          <button onClick={() => loadRegions()} className="p-1 bg-gray-800 border border-gray-700 rounded">
            <RefreshCw size={16} />
          </button>

          <span>
            Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
          </span>

        </div>

      </div>
    </>
  );
};

export default Regions;
