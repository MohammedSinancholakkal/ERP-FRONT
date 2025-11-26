// src/pages/masters/States.jsx
import React, { useEffect, useState, useRef } from "react";
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
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getStatesApi,
  addStateApi,
  updateStateApi,
  deleteStateApi,
  getCountriesApi,
  searchStateApi,
  addCountryApi,
  updateCountryApi,
  // new services
  getInactiveStatesApi,
  restoreStateApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const States = () => {
  // modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // country create/edit modals (for star/pencil)
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [editCountryModalOpen, setEditCountryModalOpen] = useState(false);

  // data
  const [states, setStates] = useState([]);
  const [inactiveStates, setInactiveStates] = useState([]);
  const [countries, setCountries] = useState([]);

  // show inactive toggle
  const [showInactive, setShowInactive] = useState(false);

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // add form
  const [newStateName, setNewStateName] = useState("");
  const [newStateCountryId, setNewStateCountryId] = useState("");

  // edit form
  const [editStateData, setEditStateData] = useState({
    id: null,
    name: "",
    countryId: "",
    isInactive: false,
  });

  // column picker
  const defaultColumns = { id: true, name: true, country: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  const toggleColumn = (col) =>
    setVisibleColumns((p) => ({ ...p, [col]: !p[col] }));

  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  // ****************** Country dropdown helpers ******************
  const [countryDropdownOpenAdd, setCountryDropdownOpenAdd] = useState(false);
  const [countryDropdownOpenEdit, setCountryDropdownOpenEdit] = useState(false);

  const [countrySearchAdd, setCountrySearchAdd] = useState("");
  const [countrySearchEdit, setCountrySearchEdit] = useState("");

  const [countryFormName, setCountryFormName] = useState(""); // for add country modal (star)
  const [countryEditData, setCountryEditData] = useState({ id: "", name: "" }); // for pencil modal

  const addDropdownRef = useRef(null);
  const editDropdownRef = useRef(null);

  const [sortOrder, setSortOrder] = useState("asc"); // smallest ID first on load

  const sortedStates = [...states];
  if (sortOrder === "asc") sortedStates.sort((a, b) => a.id - b.id);

  // callback when star modal creates a country (used by "no matches" suggestion)
  const [countryModalCallback, setCountryModalCallback] = useState(null);

  // close dropdowns if click outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
        setCountryDropdownOpenAdd(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target)) {
        setCountryDropdownOpenEdit(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // load countries
  const loadCountries = async () => {
    try {
      const res = await getCountriesApi(1, 5000); // large list for dropdowns
      if (res?.status === 200) {
        const recs = res.data?.records ?? res.data ?? [];
        setCountries(recs);
        return recs;
      } else {
        setCountries([]);
        return [];
      }
    } catch (err) {
      console.error("Failed to load countries:", err);
      toast.error("Failed to load countries");
      setCountries([]);
      return [];
    }
  };

  // load states (paginated or search)
  const loadStates = async () => {
    try {
      if (searchText.trim()) {
        const res = await searchStateApi(searchText.trim());
        const items = Array.isArray(res.data) ? res.data : res.data?.records || [];
        setStates(items);
        setTotalRecords(items.length);
        return;
      }

      const res = await getStatesApi(page, limit);
      if (res?.status === 200) {
        setStates(res.data.records || []);
        setTotalRecords(res.data.total || 0);
      } else {
        setStates([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Load States Error:", err);
      toast.error("Failed to load states");
    }
  };

  // load inactive states
  const loadInactiveStates = async () => {
    try {
      const res = await getInactiveStatesApi();
      if (res?.status === 200) {
        setInactiveStates(res.data.records || res.data || []);
      } else {
        toast.error("Failed to load inactive states");
      }
    } catch (err) {
      console.error("LOAD INACTIVE STATES ERROR:", err);
      toast.error("Failed to load inactive states");
    }
  };

  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      setPage(1);
      loadStates();
      return;
    }

    try {
      const res = await searchStateApi(value.trim());
      const items = Array.isArray(res.data) ? res.data : res.data?.records || [];
      setStates(items);
      setTotalRecords(items.length);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  useEffect(() => {
    // initial load and when page/limit change
    loadCountries();
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // ****************** Country operations (for star/pencil and inline create) ******************
  const handleAddCountry = async (name) => {
    if (!name || !name.trim()) return null;
    try {
      const res = await addCountryApi({
        name: name.trim(),
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("Country created");
        const newList = await loadCountries();
        const found = newList.find(
          (c) => String(c.name).toLowerCase() === String(name).toLowerCase()
        );
        return found || null;
      } else {
        toast.error("Failed to create country");
      }
    } catch (err) {
      console.error("Add country error", err);
      toast.error("Failed to create country");
    }
    return null;
  };

  const handleUpdateCountry = async (id, name) => {
    if (!id || !name?.trim()) return false;
    try {
      const res = await updateCountryApi(id, {
        name: name.trim(),
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("Country updated");
        await loadCountries();
        return true;
      } else {
        toast.error("Failed to update country");
      }
    } catch (err) {
      console.error("Update country error", err);
      toast.error("Failed to update country");
    }
    return false;
  };

  // OPEN add-country modal via star button (no callback)
  const onStarClickOpenAddCountry = () => {
    setCountryFormName("");
    setCountryModalCallback(null);
    setAddCountryModalOpen(true);
  };

  // OPEN add-country modal from suggestion (NO MATCH) — set callback so created country is selected
  const onSuggestionCreateCountryFromAdd = (suggestedName) => {
    setCountryFormName(suggestedName);
    setCountryModalCallback(() => (created) => {
      if (!created) return;
      setNewStateCountryId(created.id);
      setCountryDropdownOpenAdd(false);
      setCountrySearchAdd("");
    });
    setAddCountryModalOpen(true);
  };

  const onSuggestionCreateCountryFromEdit = (suggestedName) => {
    setCountryFormName(suggestedName);
    setCountryModalCallback(() => (created) => {
      if (!created) return;
      setEditStateData((p) => ({ ...p, countryId: created.id }));
      setCountryDropdownOpenEdit(false);
      setCountrySearchEdit("");
    });
    setAddCountryModalOpen(true);
  };

  // pencil click -> open edit country modal for currently selected country in edit-state modal
  const onPencilClickOpenEditCountry = () => {
    const id = editStateData.countryId;
    if (!id) return toast.error("No country selected to edit");
    const name = getCountryName(id);
    setCountryEditData({ id, name });
    setEditCountryModalOpen(true);
  };

  // add country modal save — calls callback if present
  const handleAddCountryModalSave = async () => {
    const name = countryFormName.trim();
    if (!name) return toast.error("Country name required");
    const created = await handleAddCountry(name);
    if (created) {
      // call callback if present
      if (typeof countryModalCallback === "function") {
        try {
          countryModalCallback(created);
        } catch (e) {
          console.error("countryModalCallback error:", e);
        }
      }
      // cleanup
      setAddCountryModalOpen(false);
      setCountryFormName("");
      setCountryModalCallback(null);
    }
  };

  // edit country modal save
  const handleEditCountryModalSave = async () => {
    const { id, name } = countryEditData;
    if (!id || !name.trim()) return toast.error("Invalid country details");
    const ok = await handleUpdateCountry(id, name);
    if (ok) setEditCountryModalOpen(false);
  };

  // ===================== STATE CRUD =====================
  const handleAddState = async () => {
    if (!newStateName.trim() || !newStateCountryId) {
      return toast.error("Name and Country are required");
    }
    try {
      const res = await addStateApi({
        name: newStateName.trim(),
        countryId: newStateCountryId,
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("State added");
        setModalOpen(false);
        setNewStateName("");
        setNewStateCountryId("");
        setPage(1);
        loadStates();
      }
    } catch (err) {
      console.error("ADD STATE ERROR:", err);
      toast.error("Server error");
    }
  };

  const openEditModal = (s) => {
    setEditStateData({
      id: s.id,
      name: s.name,
      countryId: s.countryId,
      isInactive: s.isInactive === true || s.isActive === 0 || false,
    });
    setEditModalOpen(true);
  };

  const handleUpdateState = async () => {
    const { id, name, countryId } = editStateData;
    if (!name.trim() || !countryId)
      return toast.error("Name and Country required");
    try {
      const res = await updateStateApi(id, {
        name: name.trim(),
        countryId,
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("State updated");
        setEditModalOpen(false);
        loadStates();
      }
    } catch (err) {
      console.error("UPDATE STATE ERROR:", err);
      toast.error("Server error");
    }
  };

  const handleDeleteState = async () => {
    const id = editStateData.id;
    try {
      const res = await deleteStateApi(id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("State deleted");
        setEditModalOpen(false);
        const newTotal = Math.max(0, totalRecords - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));
        if (page > newTotalPages) setPage(newTotalPages);
        loadStates();
      }
    } catch (err) {
      console.error("DELETE STATE ERROR:", err);
      toast.error("Server error");
    }
  };

  // restore state
  const handleRestoreState = async () => {
    try {
      const res = await restoreStateApi(editStateData.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("State restored");
        setEditModalOpen(false);
        await loadStates();
        await loadInactiveStates();
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error("RESTORE STATE ERROR:", err);
      toast.error("Server error");
    }
  };

  // helper
  const getCountryName = (id) => {
    const c = countries.find((x) => String(x.id) === String(id));
    return c ? c.name : "";
  };

  // filtered countries for dropdown
  const filteredCountriesAdd = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearchAdd.toLowerCase())
  );
  const filteredCountriesEdit = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearchEdit.toLowerCase())
  );

  return (
    <>
      {/* ADD STATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New State</h2>

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
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />

              <label className="block text-sm mt-4 mb-1">Country</label>

              <div className="flex items-center gap-2">
                {/* searchable dropdown input */}
                <div className="relative w-full" ref={addDropdownRef}>
                  <input
                    type="text"
                    value={
                      countrySearchAdd ||
                      getCountryName(newStateCountryId) ||
                      countrySearchAdd
                    }
                    onChange={(e) => {
                      setCountrySearchAdd(e.target.value);
                      setCountryDropdownOpenAdd(true);
                    }}
                    onFocus={() => setCountryDropdownOpenAdd(true)}
                    placeholder="Search or type to create..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                  />

                  {countryDropdownOpenAdd && (
                    <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                      {filteredCountriesAdd.length > 0 ? (
                        filteredCountriesAdd.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setNewStateCountryId(c.id);
                              setCountryDropdownOpenAdd(false);
                              setCountrySearchAdd("");
                            }}
                            className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                          >
                            {c.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm">
                          <div className="mb-2 text-gray-300">No matches</div>
                          <button
                            onClick={() => onSuggestionCreateCountryFromAdd(countrySearchAdd)}
                            className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                          >
                            Create new country "{countrySearchAdd}" — open create modal
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* star button to open full add country modal */}
                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                  onClick={onStarClickOpenAddCountry}
                >
                  <Star size={18} className="text-yellow-400" />
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddState}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                Edit State ({editStateData.name})
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
                value={editStateData.name}
                onChange={(e) =>
                  setEditStateData((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />

              <label className="block text-sm mt-4 mb-1">Country</label>

              <div className="flex items-center gap-2">
                <div className="relative w-full" ref={editDropdownRef}>
                  <input
                    type="text"
                    value={
                      countrySearchEdit ||
                      getCountryName(editStateData.countryId) ||
                      countrySearchEdit
                    }
                    onChange={(e) => {
                      setCountrySearchEdit(e.target.value);
                      setCountryDropdownOpenEdit(true);
                    }}
                    onFocus={() => setCountryDropdownOpenEdit(true)}
                    placeholder="Search or type to create..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                  />

                  {countryDropdownOpenEdit && (
                    <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                      {filteredCountriesEdit.length > 0 ? (
                        filteredCountriesEdit.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setEditStateData((p) => ({
                                ...p,
                                countryId: c.id,
                              }));
                              setCountryDropdownOpenEdit(false);
                              setCountrySearchEdit("");
                            }}
                            className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                          >
                            {c.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm">
                          <div className="mb-2 text-gray-300">No matches</div>
                          <button
                            onClick={() => onSuggestionCreateCountryFromEdit(countrySearchEdit)}
                            className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                          >
                            Create new country "{countrySearchEdit}" — open create modal
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* pencil opens edit-country modal */}
                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                  onClick={() => {
                    const id = editStateData.countryId;
                    if (!id) return toast.error("No country selected to edit");
                    const name = getCountryName(id);
                    setCountryEditData({ id, name });
                    setEditCountryModalOpen(true);
                  }}
                >
                  <Pencil size={18} className="text-blue-400" />
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {/* Delete or Restore depending on status */}
              {!editStateData.isInactive ? (
                <button
                  onClick={handleDeleteState}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded text-sm"
                >
                  <Trash2 size={16} /> Delete
                </button>
              ) : (
                <button
                  onClick={handleRestoreState}
                  className="flex items-center gap-2 bg-green-700 px-4 py-2 border border-green-900 rounded text-sm"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              )}

              <button
                onClick={handleUpdateState}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-sm text-blue-300"
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
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button
                onClick={() => setColumnModal(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="search..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-60 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 px-5 pb-5">
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

                {Object.keys(visibleColumns).filter((c) => !visibleColumns[c])
                  .length === 0 && (
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

      {/* ADD COUNTRY MODAL (star) */}
      {addCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Country</h2>
              <button
                onClick={() => { setAddCountryModalOpen(false); setCountryModalCallback(null); }}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={countryFormName}
                onChange={(e) => setCountryFormName(e.target.value)}
                placeholder="Enter country name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddCountryModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COUNTRY MODAL (pencil) */}
      {editCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                Edit Country ({countryEditData.name})
              </h2>
              <button
                onClick={() => setEditCountryModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={countryEditData.name}
                onChange={(e) =>
                  setCountryEditData((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleEditCountryModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">States</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center bg-gray-800 px-2 py-1.5 rounded border border-gray-700 w-full sm:w-60">
              <Search size={16} className="text-gray-300" />
              <input
                placeholder="search..."
                className="bg-transparent pl-2 w-full text-sm text-gray-200 outline-none"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded border border-gray-700 text-sm"
            >
              <Plus size={16} /> New State
            </button>

            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadStates();
              }}
              className="p-1.5 bg-gray-800 rounded border border-gray-700"
            >
              <RefreshCw className="text-blue-400" size={16} />
            </button>

            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-800 rounded border border-gray-700"
            >
              <List className="text-blue-300" size={16} />
            </button>

            {/* INACTIVE TOGGLE */}
            <button
              onClick={async () => {
                if (!showInactive) await loadInactiveStates();
                setShowInactive(!showInactive);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              {showInactive ? "Hide Inactive" : "Inactive"}
            </button>
          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0">
            <table className="w-[550px] border-separate border-spacing-y-1 text-sm">
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

                  {visibleColumns.country && (
                    <th className="pb-1 border-b border-white text-center">
                      Country Name
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {sortedStates.length === 0 && !showInactive && (
                  <tr>
                    <td
                      colSpan={
                        Object.values(visibleColumns).filter(Boolean).length
                      }
                      className="text-center py-4 text-gray-400"
                    >
                      No records found
                    </td>
                  </tr>
                )}

                {sortedStates.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => openEditModal(s)}
                    className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                  >
                    {visibleColumns.id && (
                      <td className="px-2 py-1 text-center">{s.id}</td>
                    )}

                    {visibleColumns.name && (
                      <td className="px-2 py-1 text-center">{s.name}</td>
                    )}

                    {visibleColumns.country && (
                      <td className="px-2 py-1 text-center">
                        {s.countryName || getCountryName(s.countryId)}
                      </td>
                    )}
                  </tr>
                ))}

                {/* INACTIVE ROWS */}
                {showInactive &&
                  inactiveStates.map((s) => (
                    <tr
                      key={`inactive-${s.id}`}
                      className="bg-gray-900/50 hover:bg-gray-700/50 cursor-pointer opacity-50"
                      onClick={() =>
                        openEditModal({ ...s, isInactive: true })
                      }
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center line-through">
                          {s.id}
                        </td>
                      )}

                      {visibleColumns.name && (
                        <td className="px-2 py-1 text-center line-through">
                          {s.name}
                        </td>
                      )}

                      {visibleColumns.country && (
                        <td className="px-2 py-1 text-center line-through">
                          {s.countryName || getCountryName(s.countryId)}
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
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
                  loadStates();
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
          {/* end pagination */}
        </div>
      </div>
    </>
  );
};

export default States;
