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
  getRegionsApi,
  addRegionApi,
  updateRegionApi,
  deleteRegionApi,
  searchRegionApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const Regions = () => {
  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // data
  const [regions, setRegions] = useState([]);

  // add form
  const [newRegionName, setNewRegionName] = useState("");

  // edit form
  const [editRegionData, setEditRegionData] = useState({
    id: null,
    name: "",
  });

  // column picker
  const defaultColumns = { id: true, name: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // search text
  const [searchText, setSearchText] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.ceil(totalRecords / limit);

  const toggleColumn = (col) =>
    setVisibleColumns((p) => ({ ...p, [col]: !p[col] }));
  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  const [sortOrder, setSortOrder] = useState("asc");

const sortedRegions = [...regions];

if (sortOrder === "asc") {
  sortedRegions.sort((a, b) => a.regionId - b.regionId);
}



  // load regions
  const loadRegions = async () => {
    try {
      const res = await getRegionsApi(page, limit);

      if (res?.status === 200) {
        const data = res.data;

        if (Array.isArray(data.records)) {
          setRegions(data.records);
          setTotalRecords(data.total || data.records.length);
        } else if (Array.isArray(data)) {
          setRegions(data);
          setTotalRecords(data.length);
        }
      } else {
        toast.error("Failed to load regions");
      }
    } catch (err) {
      console.error("Load regions error:", err);
      toast.error("Failed to load regions");
    }
  };

  // SEARCH FUNCTION
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      loadRegions();
      return;
    }

    try {
      const res = await searchRegionApi(value);
      if (res?.status === 200) {
        setRegions(res.data);
        setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.log("Search error:", err);
    }
  };

  useEffect(() => {
    loadRegions();
  }, [page, limit]);

  // add region
  const handleAddRegion = async () => {
    if (!newRegionName.trim()) {
      return toast.error("Name is required");
    }
    try {
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
        toast.error(res?.response?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("Add region error:", err);
      toast.error("Server error");
    }
  };

  // open edit modal
  const openEditModal = (r) => {
    setEditRegionData({
      id: r.regionId,
      name: r.regionName,
    });
    setEditModalOpen(true);
  };

  // update region
  const handleUpdateRegion = async () => {
    const { id, name } = editRegionData;
    if (!name.trim()) return toast.error("Name required");

    try {
      const res = await updateRegionApi(id, {
        regionName: name.trim(),
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Region updated");
        setEditModalOpen(false);
        loadRegions();
      } else {
        toast.error(res?.response?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update region error:", err);
      toast.error("Server error");
    }
  };

  // delete region
  const handleDeleteRegion = async () => {
    const id = editRegionData.id;

    try {
      const res = await deleteRegionApi(id, { userId: currentUserId });

      if (res?.status === 200) {
        toast.success("Region deleted");
        setEditModalOpen(false);
        loadRegions();
      } else {
        toast.error(res?.response?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete region error:", err);
      toast.error("Server error");
    }
  };

  // pagination helper values
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  return (
    <>
      {/* ADD REGION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white-400">
                New Region
              </h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="Enter region name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddRegion}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REGION MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white-400">
                Edit Region ({editRegionData.name})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={editRegionData.name}
                onChange={(e) =>
                  setEditRegionData((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleDeleteRegion}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded border border-red-900"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                onClick={handleUpdateRegion}
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
                <X className="text-gray-300 hover:text-white" size={22} />
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

                {Object.keys(visibleColumns).every(
                  (c) => visibleColumns[c]
                ) && <p className="text-gray-400 text-sm">No hidden columns</p>}
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
      <div
        className="
    p-4 sm:p-6 text-white 
    min-h-[calc(100vh-64px)]
    bg-gradient-to-b from-gray-900 to-gray-700
    flex flex-col 
    overflow-hidden
  "
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Regions</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          {/* SEARCH */}
          <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-60">
            <Search className="text-gray-300" size={16} />
            <input
              className="bg-transparent pl-2 w-full text-sm outline-none text-gray-200"
              placeholder="search..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* NEW REGION */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 border border-gray-600 rounded text-sm hover:bg-gray-600"
          >
            <Plus size={16} /> New Region
          </button>

          {/* REFRESH */}
          <button
            onClick={() => {
              setSearchText("");
              loadRegions();
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

{/* TABLE AREA */}
<div className="flex-grow overflow-auto min-h-0 w-full">
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
          <th className="pb-1 border-b border-white">Name</th>
        )}

      </tr>
    </thead>

    {/* BODY */}
    <tbody className="text-center">
      {sortedRegions.length === 0 && (
        <tr>
          <td
            colSpan={Object.values(visibleColumns).filter(Boolean).length}
            className="px-4 py-6 text-center text-gray-400"
          >
            No records found
          </td>
        </tr>
      )}

      {sortedRegions.map((r) => (
        <tr
          key={r.regionId}
          className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded"
          onClick={() => openEditModal(r)}
        >
          {visibleColumns.id && (
            <td className="px-2 py-1 align-middle">{r.regionId}</td>
          )}

          {visibleColumns.name && (
            <td className="px-2 py-1 align-middle">{r.regionName}</td>
          )}
        </tr>
      ))}
    </tbody>

  </table>
</div>


        {/* PAGINATION BAR */}
        <div className="mt-5 flex flex-wrap sm:flex-nowrap items-center gap-3 bg-gray-900/50 px-4 py-2 text-gray-200 text-sm rounded-md border border-gray-700">
          {/* LIMIT SELECT */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
          >
            {[10, 25, 50, 100].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* FIRST */}
          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* PREV */}
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>

          <input
            type="number"
            className="w-12 bg-gray-800 border border-gray-600 rounded px-1 text-center"
            value={page}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (num >= 1 && num <= totalPages) {
                setPage(num);
              }
            }}
          />
          <span>/ {totalPages}</span>

          {/* NEXT */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>

          {/* LAST */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-40"
          >
            <ChevronsRight size={16} />
          </button>

          {/* REFRESH */}
          <button
            onClick={() => loadRegions()}
            className="p-1 bg-gray-800 rounded border border-gray-700"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <span>
            Showing <strong>{start}</strong> to <strong>{end}</strong> of{" "}
            <strong>{totalRecords}</strong> records
          </span>
        </div>
      </div>
    </>
  );
};

export default Regions;
