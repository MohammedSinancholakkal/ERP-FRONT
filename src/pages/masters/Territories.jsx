// src/pages/masters/Territories.jsx
import React, { useState, useEffect, useRef } from "react";
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
  Star,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getTerritoriesApi,
  addTerritoryApi,
  updateTerritoryApi,
  deleteTerritoryApi,
  getRegionsApi,
  addRegionApi,
  updateRegionApi,
  deleteRegionApi,
  searchTerritoryApi,
  searchRegionApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const Territories = () => {
  // DATA STATES
  const [territories, setTerritories] = useState([]);
  const [regions, setRegions] = useState([]); // normalized array for dropdowns

  // SEARCH STATE
  const [searchText, setSearchText] = useState("");

  // MODAL STATES
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // REGION modals (star/pencil)
  const [addRegionModalOpen, setAddRegionModalOpen] = useState(false);
  const [editRegionModalOpen, setEditRegionModalOpen] = useState(false);

  // FORM STATES
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  const [newTerritory, setNewTerritory] = useState({
    territoryDescription: "",
    regionId: "",
    userId: currentUserId,
  });

  const [editData, setEditData] = useState({
    id: null,
    territoryDescription: "",
    regionId: "",
    userId: currentUserId,
  });

  // Region form state for star/pencil modals
  const [regionFormName, setRegionFormName] = useState("");
  const [regionEditData, setRegionEditData] = useState({ id: "", name: "" });

  // searchable dropdown helpers (like States page)
  const [regionDropdownOpenAdd, setRegionDropdownOpenAdd] = useState(false);
  const [regionDropdownOpenEdit, setRegionDropdownOpenEdit] = useState(false);
  const [regionSearchAdd, setRegionSearchAdd] = useState("");
  const [regionSearchEdit, setRegionSearchEdit] = useState("");
  const addDropdownRef = useRef(null);
  const editDropdownRef = useRef(null);


  const [sortOrder, setSortOrder] = useState("asc");

const sortedTerritories = [...territories];

if (sortOrder === "asc") {
  sortedTerritories.sort((a, b) => a.id - b.id);
}



  // close dropdowns if click outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
        setRegionDropdownOpenAdd(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target)) {
        setRegionDropdownOpenEdit(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Column Visibility
  const defaultColumns = { id: true, description: true, region: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (key) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // --------------- Load Regions (for dropdown) ----------------
  const loadRegions = async () => {
    try {
      // load large list for dropdowns
      const res = await getRegionsApi(1, 5000);

      // accept multiple possible shapes: res.data.records, res.data (array), res (array), res.records
      let arr = [];
      if (!res) {
        arr = [];
      } else if (Array.isArray(res)) {
        arr = res;
      } else if (Array.isArray(res.data)) {
        arr = res.data;
      } else if (res.data && Array.isArray(res.data.records)) {
        arr = res.data.records;
      } else if (Array.isArray(res.records)) {
        arr = res.records;
      } else {
        // fallback: try to find any array inside object
        const maybeArray = Object.values(res).find((v) => Array.isArray(v));
        arr = Array.isArray(maybeArray) ? maybeArray : [];
      }

      setRegions(arr);
      return arr;
    } catch (err) {
      console.error("LOAD REGIONS ERROR:", err);
      toast.error("Failed to load regions");
      setRegions([]);
      return [];
    }
  };

  // --------------- Load Territories (paginated or search) ----------------
  const loadTerritories = async () => {
    try {
      if (searchText?.trim()) {
        const res = await searchTerritoryApi(searchText.trim());
        if (res?.status === 200) {
          const items = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : res?.data?.records || res?.records || [];
          setTerritories(items);
          setTotalRecords(items.length);
        } else {
          toast.error("Search failed");
        }
        return;
      }

      const res = await getTerritoriesApi(page, limit);
      if (res?.status === 200) {
        const records =
          (Array.isArray(res.data) && !res.data.records) ? res.data : res.data?.records || res.records || [];
        const total = res.data?.total ?? res.total ?? (Array.isArray(records) ? records.length : 0);

        setTerritories(records || []);
        setTotalRecords(total || 0);
      } else {
        toast.error("Failed to load territories");
      }
    } catch (err) {
      console.error("LOAD TERRITORIES ERROR:", err);
      toast.error("Server error");
    }
  };

  // SEARCH handler
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      setPage(1);
      loadTerritories();
      return;
    }

    try {
      const res = await searchTerritoryApi(value.trim());
      if (res?.status === 200) {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : res?.data?.records || res?.records || [];
        setTerritories(items);
        setTotalRecords(items.length);
      } else {
        toast.error("Search failed");
      }
    } catch (err) {
      console.error("SEARCH ERROR:", err);
      toast.error("Search failed");
    }
  };

  // initial loads
  useEffect(() => {
    // load regions once for dropdowns
    loadRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTerritories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // ---------------- Region operations (inline create & modals) ----------------
  const handleAddRegion = async (name) => {
    if (!name || !name.trim()) return null;
    try {
      const res = await addRegionApi({ regionName: name.trim(), userId: currentUserId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Region created");
        const newList = await loadRegions();
        // try to find created by matching name (case-insensitive)
        const found =
          newList.find(
            (r) =>
              String(r.regionName ?? r.name ?? r.region?.regionName ?? r.name)
                .toLowerCase()
                .trim() === name.trim().toLowerCase()
          ) || null;
        return found;
      } else {
        toast.error("Failed to create region");
      }
    } catch (err) {
      console.error("Add region error", err);
      toast.error("Failed to create region");
    }
    return null;
  };

  const handleUpdateRegion = async (id, name) => {
    if (!id || !name?.trim()) return false;
    try {
      const res = await updateRegionApi(id, { regionName: name.trim(), userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Region updated");
        await loadRegions();
        return true;
      } else {
        toast.error("Failed to update region");
      }
    } catch (err) {
      console.error("Update region error", err);
      toast.error("Failed to update region");
    }
    return false;
  };

  // inline create from add dropdown
  const handleInlineCreateFromAdd = async () => {
    const name = regionSearchAdd.trim();
    if (!name) return;
    const created = await handleAddRegion(name);
    if (created) {
      setNewTerritory((p) => ({ ...p, regionId: created.regionId ?? created.id ?? "" }));
      setRegionSearchAdd("");
      setRegionDropdownOpenAdd(false);
    }
  };

  // inline create from edit dropdown
  const handleInlineCreateFromEdit = async () => {
    const name = regionSearchEdit.trim();
    if (!name) return;
    const created = await handleAddRegion(name);
    if (created) {
      setEditData((p) => ({ ...p, regionId: created.regionId ?? created.id ?? "" }));
      setRegionSearchEdit("");
      setRegionDropdownOpenEdit(false);
    }
  };

  // star click -> open add region modal
  const onStarClickOpenAddRegion = () => {
    setRegionFormName("");
    setAddRegionModalOpen(true);
  };

  // pencil click -> open edit region modal for currently selected region in edit-territory modal
  const onPencilClickOpenEditRegion = () => {
    const id = editData.regionId;
    if (!id) return toast.error("No region selected to edit");
    const name = getRegionName(id);
    setRegionEditData({ id, name });
    setEditRegionModalOpen(true);
  };

  const handleAddRegionModalSave = async () => {
    const name = regionFormName.trim();
    if (!name) return toast.error("Region name required");
    const created = await handleAddRegion(name);
    if (created) {
      // if Add Territory modal is open, preselect created region
      if (modalOpen) setNewTerritory((p) => ({ ...p, regionId: created.regionId ?? created.id ?? "" }));
      setAddRegionModalOpen(false);
      setRegionFormName("");
    }
  };

  const handleEditRegionModalSave = async () => {
    const { id, name } = regionEditData;
    if (!id || !name.trim()) return toast.error("Invalid region details");
    const ok = await handleUpdateRegion(id, name);
    if (ok) setEditRegionModalOpen(false);
  };

  // ---------------- Territory CRUD ----------------
  const handleAdd = async () => {
    if (!newTerritory.territoryDescription?.trim() || !newTerritory.regionId) {
      return toast.error("Description and Region are required");
    }

    try {
      const payload = {
        territoryDescription: newTerritory.territoryDescription.trim(),
        regionId: newTerritory.regionId,
        userId: currentUserId,
      };
      const result = await addTerritoryApi(payload);
      if (result?.status === 201 || result?.status === 200) {
        toast.success("Territory added");
        setModalOpen(false);
        setNewTerritory({ territoryDescription: "", regionId: "", userId: currentUserId });
        setPage(1);
        loadTerritories();
      } else {
        toast.error(result?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("ADD TERRITORY ERROR:", err);
      toast.error("Server error");
    }
  };

  // open edit modal
  const openEditModal = (t) => {
    setEditData({
      id: t.id,
      territoryDescription: t.territoryDescription,
      regionId: t.regionId,
      userId: currentUserId,
    });
    setEditModalOpen(true);
  };

  // UPDATE Territory
  const handleUpdate = async () => {
    if (!editData.territoryDescription?.trim() || !editData.regionId) {
      return toast.error("Description and Region are required");
    }
    try {
      const payload = {
        territoryDescription: editData.territoryDescription.trim(),
        regionId: editData.regionId,
        userId: currentUserId,
      };
      const res = await updateTerritoryApi(editData.id, payload);
      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadTerritories();
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("UPDATE TERRITORY ERROR:", err);
      toast.error("Server error");
    }
  };

  // DELETE Territory
  const handleDelete = async () => {
    try {
      const res = await deleteTerritoryApi(editData.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);

        // adjust page if we removed the last item on the current page
        const newTotal = Math.max(0, totalRecords - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));
        if (page > newTotalPages) setPage(newTotalPages);

        loadTerritories();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("DELETE TERRITORY ERROR:", err);
      toast.error("Server error");
    }
  };

  // helper to get region name from regions array
  const getRegionName = (id) => {
    const r = regions.find((x) => String(x.regionId ?? x.id) === String(id));
    return r ? r.regionName ?? r.name ?? "" : "";
  };

  // filtered regions for dropdowns
  const filteredRegionsAdd = regions.filter((r) =>
    (r.regionName ?? r.name ?? "").toLowerCase().includes(regionSearchAdd.toLowerCase())
  );
  const filteredRegionsEdit = regions.filter((r) =>
    (r.regionName ?? r.name ?? "").toLowerCase().includes(regionSearchEdit.toLowerCase())
  );

  // render region options (used for fallback select when needed)
  const renderRegionOptions = () => {
    return (Array.isArray(regions) ? regions : []).map((r) => {
      const value = r.regionId ?? r.id ?? (r.region && (r.region.regionId ?? r.region.id));
      const label = r.regionName ?? r.name ?? (r.region && (r.region.regionName ?? r.region.name)) ?? String(value);
      return (
        <option key={value ?? Math.random()} value={value}>
          {label}
        </option>
      );
    });
  };

  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Territory</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="text-sm">Description</label>
              <textarea
                rows="3"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
                value={newTerritory.territoryDescription}
                onChange={(e) =>
                  setNewTerritory((prev) => ({ ...prev, territoryDescription: e.target.value }))
                }
              ></textarea>

              <label className="text-sm mt-4 block">Region *</label>

              {/* Searchable Region Dropdown + Star */}
              <div className="flex items-center gap-2 mt-1">
                <div className="relative w-full" ref={addDropdownRef}>
                  <input
                    type="text"
                    value={regionSearchAdd || getRegionName(newTerritory.regionId) || regionSearchAdd}
                    onChange={(e) => {
                      setRegionSearchAdd(e.target.value);
                      setRegionDropdownOpenAdd(true);
                    }}
                    onFocus={() => setRegionDropdownOpenAdd(true)}
                    placeholder="Search or type to create..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                  />

                  {regionDropdownOpenAdd && (
                    <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                      {filteredRegionsAdd.length > 0 ? (
                        filteredRegionsAdd.map((c) => (
                          <div
                            key={c.regionId ?? c.id}
                            onClick={() => {
                              setNewTerritory((p) => ({ ...p, regionId: c.regionId ?? c.id }));
                              setRegionDropdownOpenAdd(false);
                              setRegionSearchAdd("");
                            }}
                            className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                          >
                            {c.regionName ?? c.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm">
                          <div className="mb-2 text-gray-300">No matches</div>
                          <button
                            onClick={handleInlineCreateFromAdd}
                            className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                          >
                            Create new region &quot;{regionSearchAdd}&quot; and select
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* star opens add region modal */}
                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                  onClick={onStarClickOpenAddRegion}
                >
                  <Star size={18} className="text-yellow-400" />
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
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
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg">Edit Territory</h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="text-sm">Description</label>
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                rows={3}
                value={editData.territoryDescription}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, territoryDescription: e.target.value }))
                }
              ></textarea>

              <label className="text-sm mt-4 block">Region</label>

              {/* Searchable Region Dropdown + Pencil */}
              <div className="flex items-center gap-2 mt-1">
                <div className="relative w-full" ref={editDropdownRef}>
                  <input
                    type="text"
                    value={regionSearchEdit || getRegionName(editData.regionId) || regionSearchEdit}
                    onChange={(e) => {
                      setRegionSearchEdit(e.target.value);
                      setRegionDropdownOpenEdit(true);
                    }}
                    onFocus={() => setRegionDropdownOpenEdit(true)}
                    placeholder="Search or type to create..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                  />

                  {regionDropdownOpenEdit && (
                    <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                      {filteredRegionsEdit.length > 0 ? (
                        filteredRegionsEdit.map((c) => (
                          <div
                            key={c.regionId ?? c.id}
                            onClick={() => {
                              setEditData((p) => ({ ...p, regionId: c.regionId ?? c.id }));
                              setRegionDropdownOpenEdit(false);
                              setRegionSearchEdit("");
                            }}
                            className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                          >
                            {c.regionName ?? c.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm">
                          <div className="mb-2 text-gray-300">No matches</div>
                          <button
                            onClick={handleInlineCreateFromEdit}
                            className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                          >
                            Create new region &quot;{regionSearchEdit}&quot; and select
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* pencil opens edit-region modal */}
                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                  onClick={onPencilClickOpenEditRegion}
                >
                  <Pencil size={18} className="text-blue-400" />
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD REGION MODAL (star) */}
      {addRegionModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Region</h2>
              <button onClick={() => setAddRegionModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={regionFormName}
                onChange={(e) => setRegionFormName(e.target.value)}
                placeholder="Enter region name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddRegionModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REGION MODAL (pencil) */}
      {editRegionModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Region ({regionEditData.name})</h2>
              <button onClick={() => setEditRegionModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={regionEditData.name}
                onChange={(e) => setRegionEditData((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleEditRegionModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
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
          <div className="w-[750px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)} className="text-gray-300 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <div className="px-5 py-4">
              <input
                type="text"
                placeholder="search columns..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible Columns */}
              <div className="bg-gray-800/40 p-4 rounded border border-gray-700">
                <h3 className="font-medium mb-3">Visible Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div key={col} className="flex justify-between bg-gray-700 p-2 rounded mb-2">
                      <span>{col.toUpperCase()}</span>
                      <button onClick={() => toggleColumn(col)} className="text-red-400">
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden Columns */}
              <div className="bg-gray-800/40 p-4 rounded border border-gray-700">
                <h3 className="font-medium mb-3">Hidden Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div key={col} className="flex justify-between bg-gray-700 p-2 rounded mb-2">
                      <span>{col.toUpperCase()}</span>
                      <button onClick={() => toggleColumn(col)} className="text-green-400">
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-between px-5 py-3 border-t border-gray-700">
              <button onClick={restoreDefaultColumns} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button onClick={() => setColumnModal(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">
                  OK
                </button>
                <button onClick={() => setColumnModal(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-97px)] overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Territories</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center bg-gray-800 px-2 py-1.5 rounded border border-gray-700 w-full sm:w-60">
              <Search size={16} className="text-gray-300" />
              <input
                className="bg-transparent pl-2 w-full text-sm text-gray-200 outline-none"
                placeholder="search..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded border border-gray-700 text-sm"
            >
              <Plus size={16} /> New Territory
            </button>

            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadTerritories();
              }}
              className="p-1.5 bg-gray-800 border border-gray-700 rounded"
              aria-label="Refresh"
            >
              <RefreshCw className="text-blue-400" size={16} />
            </button>

            <button onClick={() => setColumnModal(true)} className="p-1.5 bg-gray-800 border border-gray-700 rounded" aria-label="Columns">
              <List className="text-blue-300" size={16} />
            </button>
          </div>

          {/* TABLE (scrollable area) */}
          <div className="flex-grow overflow-auto min-h-0">
  <div className="w-full overflow-auto">
    <table className="w-[500px] border-separate border-spacing-y-1 text-sm">
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

          {visibleColumns.description && (
            <th className="pb-1 border-b border-white text-center">
              Description
            </th>
          )}

          {visibleColumns.region && (
            <th className="pb-1 border-b border-white text-center">
              Region
            </th>
          )}

        </tr>
      </thead>

      <tbody className="text-center">
        {sortedTerritories.length === 0 && (
          <tr>
            <td
              colSpan={Object.values(visibleColumns).filter(Boolean).length}
              className="px-4 py-6 text-center text-gray-400"
            >
              No records found
            </td>
          </tr>
        )}

        {sortedTerritories.map((t) => (
          <tr
            key={t.id}
            className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
            onClick={() => openEditModal(t)}
          >
            {visibleColumns.id && (
              <td className="px-2 py-2 text-center">{t.id}</td>
            )}

            {visibleColumns.description && (
              <td className="px-2 py-2 text-center">
                {t.territoryDescription}
              </td>
            )}

            {visibleColumns.region && (
              <td className="px-2 py-2 text-center">
                {t.regionName ??
                  t.region?.regionName ??
                  getRegionName(t.regionId) ??
                  ""}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


          {/* PAGINATION (Sticky bottom) */}
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
                  if (!value) return;
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
                  loadTerritories();
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
          {/* end pagination */}
        </div>
      </div>
    </>
  );
};

export default Territories;
