// src/pages/masters/Cities.jsx
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
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getCountriesApi,
  getStatesByCountryApi,
  getCitiesApi,
  addCityApi,
  updateCityApi,
  deleteCityApi,
  searchCityApi,
  // country/state APIs (we assume these exist in your allAPI)
  addCountryApi,
  updateCountryApi,
  searchCountryApi,
  addStateApi,
  updateStateApi,
  searchStateApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const Cities = () => {
  // ---------- modals ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // extra modals for inline create / edit
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [editCountryModalOpen, setEditCountryModalOpen] = useState(false);
  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [editStateModalOpen, setEditStateModalOpen] = useState(false);

  // ---------- data ----------
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  // ---------- pagination ----------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // ---------- forms ----------
  const [newCity, setNewCity] = useState({
    name: "",
    countryId: "",
    stateId: "",
  });

  const [editCity, setEditCity] = useState({
    id: null,
    name: "",
    countryId: "",
    stateId: "",
  });

  // ---------- column picker ----------
  const defaultColumns = { id: true, name: true, country: true, state: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) =>
    setVisibleColumns((p) => ({ ...p, [col]: !p[col] }));
  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  // ---------- search ----------
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ---------- dropdown/search helpers ----------
  // Country dropdown (add)
  const [countrySearchAdd, setCountrySearchAdd] = useState("");
  const [countryDropdownOpenAdd, setCountryDropdownOpenAdd] = useState(false);
  const addCountryRef = useRef(null);

  // Country dropdown (edit)
  const [countrySearchEdit, setCountrySearchEdit] = useState("");
  const [countryDropdownOpenEdit, setCountryDropdownOpenEdit] = useState(false);
  const editCountryRef = useRef(null);

  // State dropdown (add)
  const [stateSearchAdd, setStateSearchAdd] = useState("");
  const [stateDropdownOpenAdd, setStateDropdownOpenAdd] = useState(false);
  const addStateRef = useRef(null);

  // State dropdown (edit)
  const [stateSearchEdit, setStateSearchEdit] = useState("");
  const [stateDropdownOpenEdit, setStateDropdownOpenEdit] = useState(false);
  const editStateRef = useRef(null);

  // inline add/edit forms
  const [countryFormName, setCountryFormName] = useState("");
  const [countryEditData, setCountryEditData] = useState({ id: "", name: "" });
  const [stateFormName, setStateFormName] = useState("");
  const [stateEditData, setStateEditData] = useState({ id: "", name: "", countryId: "" });

  const [sortOrder, setSortOrder] = useState("asc");

  const sortedCities = [...cities];
  
  if (sortOrder === "asc") {
    sortedCities.sort((a, b) => a.id - b.id);
  }
  

  // close dropdowns when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (addCountryRef.current && !addCountryRef.current.contains(e.target))
        setCountryDropdownOpenAdd(false);
      if (editCountryRef.current && !editCountryRef.current.contains(e.target))
        setCountryDropdownOpenEdit(false);
      if (addStateRef.current && !addStateRef.current.contains(e.target))
        setStateDropdownOpenAdd(false);
      if (editStateRef.current && !editStateRef.current.contains(e.target))
        setStateDropdownOpenEdit(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ========== LOADERS ==========
  const loadCountries = async () => {
    try {
      const res = await getCountriesApi(1, 5000);
      if (res?.status === 200) {
        // support res.data.records or res.data array
        const recs = res.data?.records ?? res.data ?? [];
        setCountries(recs);
      } else {
        toast.error("Failed to load countries");
        setCountries([]);
      }
    } catch (err) {
      console.error("LOAD COUNTRIES ERROR:", err);
      toast.error("Failed to load countries");
      setCountries([]);
    }
  };

  // load states for a given country
  // returns the items (array)
  const loadStates = async (countryId) => {
    if (!countryId) {
      setStates([]);
      return [];
    }

    try {
      // Use your service that returns states by country
      const res = await getStatesByCountryApi(countryId);
      // your getStatesByCountryApi returns array in res.data
      const items = Array.isArray(res?.data) ? res.data : res.data?.records ?? [];
      setStates(items);
      return items;
    } catch (err) {
      console.error("LOAD STATES ERROR:", err);
      setStates([]);
      return [];
    }
  };

  const loadCities = async () => {
    try {
      if (searchText.trim()) {
        const res = await searchCityApi(searchText.trim());
        const items = Array.isArray(res.data) ? res.data : res.data?.records ?? [];
        setCities(items);
        setTotalRecords(items.length);
        return;
      }
      const res = await getCitiesApi(page, limit);
      if (res?.status === 200) {
        setCities(res.data.records || []);
        setTotalRecords(res.data.total || 0);
      } else {
        toast.error("Failed to load cities");
      }
    } catch (err) {
      console.error("LOAD CITIES ERROR:", err);
      toast.error("Failed to load cities");
    }
  };

  // initial load
  useEffect(() => {
    loadCountries();
    loadCities();
  }, [page, limit]);

  // ========== SEARCH HANDLER ==========
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      setPage(1);
      loadCities();
      return;
    }

    try {
      const res = await searchCityApi(value.trim());
      if (res?.status === 200) {
        const items = Array.isArray(res.data) ? res.data : res.data?.records ?? [];
        setCities(items);
        setTotalRecords(items.length);
      } else {
        toast.error("Search failed");
      }
    } catch (err) {
      console.error("SEARCH CITIES ERROR:", err);
      toast.error("Search failed");
    }
  };

  // ========== ADD CITY ==========
  const handleAddCity = async () => {
    if (!newCity.name?.trim() || !newCity.countryId || !newCity.stateId) {
      return toast.error("All fields are required");
    }

    try {
      const payload = {
        ...newCity,
        countryId: Number(newCity.countryId),
        stateId: Number(newCity.stateId),
        userId: currentUserId,
      };

      const res = await addCityApi(payload);
      if (res?.status === 200) {
        toast.success("City added");
        setModalOpen(false);
        setNewCity({ name: "", countryId: "", stateId: "" });
        setStates([]);
        setPage(1);
        loadCities();
      } else {
        toast.error(res?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("ADD CITY ERROR:", err);
      toast.error("Server error");
    }
  };

  const openAddModal = () => {
    setNewCity({ name: "", countryId: "", stateId: "" });
    setStates([]);
    setCountrySearchAdd("");
    setStateSearchAdd("");
    setModalOpen(true);
  };

  // ========== OPEN EDIT ==========
  const openEditModal = async (c) => {
    const countryIdStr = c.countryId ? String(c.countryId) : "";
    const stateIdStr = c.stateId ? String(c.stateId) : "";

    // load states for that country first
    const items = await loadStates(countryIdStr);
    const stateExists = items.some((s) => String(s.id) === stateIdStr);

    setEditCity({
      id: c.id,
      name: c.name ?? "",
      countryId: countryIdStr,
      stateId: stateExists ? stateIdStr : "",
    });

    setCountrySearchEdit("");
    setStateSearchEdit("");
    setEditModalOpen(true);
  };

  // ========== UPDATE CITY ==========
  const handleUpdateCity = async () => {
    const { id, name, countryId, stateId } = editCity;
    if (!name?.trim() || !countryId || !stateId) return toast.error("All fields are required");

    try {
      const payload = {
        name: name.trim(),
        countryId: Number(countryId),
        stateId: Number(stateId),
        userId: currentUserId,
      };

      const res = await updateCityApi(id, payload);
      if (res?.status === 200) {
        toast.success("City updated");
        setEditModalOpen(false);
        loadCities();
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("UPDATE CITY ERROR:", err);
      toast.error("Server error");
    }
  };

  // ========== DELETE CITY ==========
  const handleDeleteCity = async () => {
    const id = editCity.id;
    try {
      const res = await deleteCityApi(id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("City deleted");
        setEditModalOpen(false);

        const newTotal = Math.max(0, totalRecords - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));
        if (page > newTotalPages) setPage(newTotalPages);

        loadCities();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("DELETE CITY ERROR:", err);
      toast.error("Server error");
    }
  };

  // ========== COUNTRY / STATE inline create & edit ==========
  // create country (used by star modal and inline create)
  const createCountryAndReload = async (name) => {
    if (!name?.trim()) return null;
    try {
      const res = await addCountryApi({ name: name.trim(), userId: currentUserId });
      if (res?.status === 200) {
        // reload list & return newly created object by name match
        await loadCountries();
        const created = countries.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
        // if not found in client list (because getCountriesApi returns paginated), try search
        if (!created) {
          const sres = await searchCountryApi(name.trim());
          const arr = Array.isArray(sres.data) ? sres.data : sres.data?.records ?? [];
          return arr[0] ?? null;
        }
        return created ?? null;
      } else {
        toast.error("Failed to add country");
        return null;
      }
    } catch (err) {
      console.error("CREATE COUNTRY ERROR:", err);
      toast.error("Server error");
      return null;
    }
  };

  // create state (requires countryId)
  const createStateAndReload = async (name, countryId) => {
    if (!name?.trim() || !countryId) return null;
    try {
      const res = await addStateApi({ name: name.trim(), countryId: Number(countryId), userId: currentUserId });
      if (res?.status === 200) {
        // reload states for that country and return new one
        const items = await loadStates(countryId);
        const created = items.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
        // fallback to searchStateApi if needed
        if (!created) {
          const sres = await searchStateApi(name.trim());
          const arr = Array.isArray(sres.data) ? sres.data : sres.data?.records ?? [];
          // filter by country if API search returns cross-country results
          const found = arr.find((a) => String(a.countryId) === String(countryId));
          return found ?? null;
        }
        return created ?? null;
      } else {
        toast.error("Failed to add state");
        return null;
      }
    } catch (err) {
      console.error("CREATE STATE ERROR:", err);
      toast.error("Server error");
      return null;
    }
  };

  // inline create from country dropdown in Add modal
  const handleInlineCreateCountryFromAdd = async () => {
    const name = countrySearchAdd.trim();
    if (!name) return;
    const created = await createCountryAndReload(name);
    if (created) {
      setNewCity((p) => ({ ...p, countryId: String(created.id), stateId: "" }));
      // clear state list and load states for new country
      await loadStates(String(created.id));
      setCountryDropdownOpenAdd(false);
      setCountrySearchAdd("");
    }
  };

  // inline create from country dropdown in Edit modal
  const handleInlineCreateCountryFromEdit = async () => {
    const name = countrySearchEdit.trim();
    if (!name) return;
    const created = await createCountryAndReload(name);
    if (created) {
      setEditCity((p) => ({ ...p, countryId: String(created.id), stateId: "" }));
      await loadStates(String(created.id));
      setCountryDropdownOpenEdit(false);
      setCountrySearchEdit("");
    }
  };

  // inline create state from Add state dropdown
  const handleInlineCreateStateFromAdd = async () => {
    const countryId = newCity.countryId;
    if (!countryId) return toast.error("Select country first");
    const name = stateSearchAdd.trim();
    if (!name) return;
    const created = await createStateAndReload(name, countryId);
    if (created) {
      setNewCity((p) => ({ ...p, stateId: String(created.id) }));
      setStateDropdownOpenAdd(false);
      setStateSearchAdd("");
    }
  };

  // inline create state from Edit state dropdown
  const handleInlineCreateStateFromEdit = async () => {
    const countryId = editCity.countryId;
    if (!countryId) return toast.error("Select country first");
    const name = stateSearchEdit.trim();
    if (!name) return;
    const created = await createStateAndReload(name, countryId);
    if (created) {
      setEditCity((p) => ({ ...p, stateId: String(created.id) }));
      setStateDropdownOpenEdit(false);
      setStateSearchEdit("");
    }
  };

  // open star modal to add country (Add modal)
  const onStarOpenAddCountryModal = () => {
    setCountryFormName("");
    setAddCountryModalOpen(true);
  };

  // open pencil edit country modal from edit city modal
  const onPencilOpenEditCountryModal = () => {
    const id = editCity.countryId;
    if (!id) return toast.error("No country selected to edit");
    const name = (countries.find((c) => String(c.id) === String(id)) || {}).name || "";
    setCountryEditData({ id: id, name });
    setEditCountryModalOpen(true);
  };

  // add country modal save
  const handleAddCountryModalSave = async () => {
    const name = countryFormName.trim();
    if (!name) return toast.error("Country name required");
    const created = await createCountryAndReload(name);
    if (created) {
      // if add-state modal open, select
      if (modalOpen) setNewCity((p) => ({ ...p, countryId: String(created.id), stateId: "" }));
      setAddCountryModalOpen(false);
      setCountryFormName("");
    }
  };

  // edit country modal save
  const handleEditCountryModalSave = async () => {
    const { id, name } = countryEditData;
    if (!id || !name.trim()) return toast.error("Invalid country details");
    try {
      const res = await updateCountryApi(id, { name: name.trim(), userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Country updated");
        await loadCountries();
        // update editCity country name if matches
        if (editCity.countryId && String(editCity.countryId) === String(id)) {
          // no change to id, but list will show updated name
        }
        setEditCountryModalOpen(false);
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error("UPDATE COUNTRY ERROR:", err);
      toast.error("Server error");
    }
  };

  // add state modal save (general small modal if used)
  const handleAddStateModalSave = async (countryIdToUse) => {
    const name = stateFormName.trim();
    const countryId = countryIdToUse || editCity.countryId || newCity.countryId;
    if (!name) return toast.error("State name required");
    if (!countryId) return toast.error("Country required");
    const created = await createStateAndReload(name, countryId);
    if (created) {
      // select depending on which modal is open
      if (modalOpen) setNewCity((p) => ({ ...p, stateId: String(created.id) }));
      if (editModalOpen) setEditCity((p) => ({ ...p, stateId: String(created.id) }));
      setAddStateModalOpen(false);
      setStateFormName("");
    }
  };

  const handleEditStateModalSave = async () => {
    const { id, name, countryId } = stateEditData;
    if (!id || !name.trim()) return toast.error("Invalid state data");
    try {
      const res = await updateStateApi(id, { name: name.trim(), countryId: Number(countryId), userId: currentUserId });
      if (res?.status === 200) {
        toast.success("State updated");
        if (editCity.countryId) await loadStates(editCity.countryId);
        setEditStateModalOpen(false);
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error("UPDATE STATE ERROR:", err);
      toast.error("Server error");
    }
  };

  // helper functions to get name if API didn't include
  const getCountryName = (id) => {
    const c = countries.find((x) => String(x.id) === String(id));
    return c ? c.name : "";
  };
  const getStateName = (id) => {
    const s = states.find((x) => String(x.id) === String(id));
    return s ? s.name : "";
  };

  // filtered lists for dropdowns
  const filteredCountriesAdd = countries.filter((c) => c.name.toLowerCase().includes(countrySearchAdd.toLowerCase()));
  const filteredCountriesEdit = countries.filter((c) => c.name.toLowerCase().includes(countrySearchEdit.toLowerCase()));

  const filteredStatesAdd = states.filter((s) => s.name.toLowerCase().includes(stateSearchAdd.toLowerCase()));
  const filteredStatesEdit = states.filter((s) => s.name.toLowerCase().includes(stateSearchEdit.toLowerCase()));

  // ---------- RENDER ----------
  return (
    <>
      {/* ---------------- ADD CITY MODAL ---------------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-base sm:text-lg font-semibold">New City</h2>
              <button onClick={() => { setModalOpen(false); setStates([]); }}>
                <X className="text-gray-300 hover:text-white" size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* NAME */}
              <div>
                <label className="block text-sm mb-1">Name *</label>
                <input
                  type="text"
                  value={newCity.name}
                  onChange={(e) => setNewCity((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              {/* COUNTRY WITH STAR + SEARCHABLE */}
              <div>
                <label className="block text-sm mb-1">Country *</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full" ref={addCountryRef}>
                    <input
                      type="text"
                      value={countrySearchAdd || getCountryName(newCity.countryId) || countrySearchAdd}
                      onChange={(e) => {
                        setCountrySearchAdd(e.target.value);
                        setCountryDropdownOpenAdd(true);
                      }}
                      onFocus={() => setCountryDropdownOpenAdd(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                    />

                    {countryDropdownOpenAdd && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredCountriesAdd.length > 0 ? (
                          filteredCountriesAdd.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setNewCity((p) => ({ ...p, countryId: String(c.id), stateId: "" }));
                                setCountryDropdownOpenAdd(false);
                                setCountrySearchAdd("");
                                loadStates(String(c.id));
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
                              onClick={handleInlineCreateCountryFromAdd}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new country &quot;{countrySearchAdd}&quot; and select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* STAR BUTTON -> opens add country modal */}
                  <button type="button" className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition" onClick={() => { setCountryFormName(""); setAddCountryModalOpen(true); }}>
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>
              </div>

              {/* STATE WITH STAR + SEARCHABLE */}
              <div>
                <label className="block text-sm mb-1">State *</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full" ref={addStateRef}>
                    <input
                      type="text"
                      value={stateSearchAdd || getStateName(newCity.stateId) || stateSearchAdd}
                      onChange={(e) => {
                        setStateSearchAdd(e.target.value);
                        setStateDropdownOpenAdd(true);
                      }}
                      onFocus={() => setStateDropdownOpenAdd(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                    />

                    {stateDropdownOpenAdd && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredStatesAdd.length > 0 ? (
                          filteredStatesAdd.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setNewCity((p) => ({ ...p, stateId: String(s.id) }));
                                setStateDropdownOpenAdd(false);
                                setStateSearchAdd("");
                              }}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                              {s.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm">
                            <div className="mb-2 text-gray-300">No matches</div>
                            <button
                              onClick={handleInlineCreateStateFromAdd}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new state &quot;{stateSearchAdd}&quot; for selected country and select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* STAR BUTTON -> open add state modal */}
                  <button type="button" className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition" onClick={() => { setStateFormName(""); setAddStateModalOpen(true); }}>
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-gray-700">
              <button onClick={handleAddCity} className="flex items-center gap-2 bg-gray-800 px-3 sm:px-4 py-2 rounded border border-gray-600 text-sm sm:text-base">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EDIT CITY MODAL ---------------- */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-base sm:text-lg font-semibold">Edit City ({editCity.name})</h2>
              <button onClick={() => { setEditModalOpen(false); setStates([]); }}>
                <X className="text-gray-300 hover:text-white" size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* NAME */}
              <div>
                <label className="block text-sm mb-1">Name *</label>
                <input
                  type="text"
                  value={editCity.name}
                  onChange={(e) => setEditCity((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              {/* COUNTRY WITH PENCIL + SEARCHABLE */}
              <div>
                <label className="block text-sm mb-1">Country *</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full" ref={editCountryRef}>
                    <input
                      type="text"
                      value={countrySearchEdit || getCountryName(editCity.countryId) || countrySearchEdit}
                      onChange={(e) => {
                        setCountrySearchEdit(e.target.value);
                        setCountryDropdownOpenEdit(true);
                      }}
                      onFocus={() => setCountryDropdownOpenEdit(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                    />

                    {countryDropdownOpenEdit && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredCountriesEdit.length > 0 ? (
                          filteredCountriesEdit.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setEditCity((p) => ({ ...p, countryId: String(c.id), stateId: "" }));
                                setCountryDropdownOpenEdit(false);
                                setCountrySearchEdit("");
                                loadStates(String(c.id));
                              }}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                              {c.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm">
                            <div className="mb-2 text-gray-300">No matches</div>
                            <button onClick={handleInlineCreateCountryFromEdit} className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded">
                              Create new country &quot;{countrySearchEdit}&quot; and select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PENCIL -> open edit country modal */}
                  <button type="button" className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition" onClick={() => {
                    const id = editCity.countryId;
                    if (!id) return toast.error("No country selected to edit");
                    const name = (countries.find((c) => String(c.id) === String(id)) || {}).name || "";
                    setCountryEditData({ id, name });
                    setEditCountryModalOpen(true);
                  }}>
                    <Pencil size={18} className="text-blue-400" />
                  </button>
                </div>
              </div>

              {/* STATE WITH PENCIL + SEARCHABLE */}
              <div>
                <label className="block text-sm mb-1">State *</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full" ref={editStateRef}>
                    <input
                      type="text"
                      value={stateSearchEdit || getStateName(editCity.stateId) || stateSearchEdit}
                      onChange={(e) => {
                        setStateSearchEdit(e.target.value);
                        setStateDropdownOpenEdit(true);
                      }}
                      onFocus={() => setStateDropdownOpenEdit(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                    />

                    {stateDropdownOpenEdit && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredStatesEdit.length > 0 ? (
                          filteredStatesEdit.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setEditCity((p) => ({ ...p, stateId: String(s.id) }));
                                setStateDropdownOpenEdit(false);
                                setStateSearchEdit("");
                              }}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                              {s.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm">
                            <div className="mb-2 text-gray-300">No matches</div>
                            <button onClick={handleInlineCreateStateFromEdit} className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded">
                              Create new state &quot;{stateSearchEdit}&quot; for selected country and select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PENCIL -> open edit state modal */}
                  <button type="button" className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition" onClick={() => {
                    const id = editCity.stateId;
                    if (!id) return toast.error("No state selected to edit");
                    const stateName = (states.find((s) => String(s.id) === String(id)) || {}).name || "";
                    setStateEditData({ id, name: stateName, countryId: editCity.countryId });
                    setEditStateModalOpen(true);
                  }}>
                    <Pencil size={18} className="text-blue-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
              <button onClick={handleDeleteCity} className="flex items-center gap-2 bg-red-600 px-3 sm:px-4 py-2 rounded border border-red-900 text-sm sm:text-base">
                <Trash2 size={16} /> Delete
              </button>

              <button onClick={handleUpdateCity} className="flex items-center gap-2 bg-gray-800 px-3 sm:px-4 py-2 rounded border border-gray-600 text-blue-300 text-sm sm:text-base">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- COLUMN PICKER (unchanged) ---------------- */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[600px] md:w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between px-4 sm:px-5 py-3 border-b border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X size={22} className="text-gray-300" />
              </button>
            </div>

            <div className="px-4 sm:px-5 py-3">
              <input type="text" placeholder="Search columns…" value={searchColumn} onChange={(e) => setSearchColumn(e.target.value.toLowerCase())} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm sm:text-base" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-5 pb-5">
              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <h3 className="text-sm font-medium mb-3">Visible Columns</h3>
                {Object.keys(visibleColumns).filter((c) => visibleColumns[c]).filter((c) => c.includes(searchColumn)).map((c) => (
                  <div key={c} className="flex justify-between bg-gray-700 p-2 rounded mb-2">
                    <span>{c}</span>
                    <button onClick={() => toggleColumn(c)} className="text-red-400">✕</button>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <h3 className="text-sm font-medium mb-3">Hidden Columns</h3>
                {Object.keys(visibleColumns).filter((c) => !visibleColumns[c]).filter((c) => c.includes(searchColumn)).map((c) => (
                  <div key={c} className="flex justify-between bg-gray-700 p-2 rounded mb-2">
                    <span>{c}</span>
                    <button onClick={() => toggleColumn(c)} className="text-green-400">➕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 px-4 sm:px-5 py-3 border-t border-gray-700">
              <button onClick={restoreDefaultColumns} className="px-3 sm:px-4 py-2 bg-gray-800 border border-gray-600 rounded text-sm sm:text-base">Restore Defaults</button>
              <button onClick={() => setColumnModal(false)} className="px-3 sm:px-4 py-2 bg-gray-800 border border-gray-600 rounded text-sm sm:text-base">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD COUNTRY MODAL (star) ---------------- */}
      {addCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[480px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Create Country</h2>
              <button onClick={() => setAddCountryModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Country Name</label>
              <input value={countryFormName} onChange={(e) => setCountryFormName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button onClick={handleAddCountryModalSave} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-sm text-blue-300">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EDIT COUNTRY MODAL (pencil) ---------------- */}
      {editCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[480px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Country ({countryEditData.name})</h2>
              <button onClick={() => setEditCountryModalOpen(false)}><X size={20} className="text-gray-300 hover:text-white" /></button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Country Name</label>
              <input value={countryEditData.name} onChange={(e) => setCountryEditData((p) => ({ ...p, name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button onClick={handleEditCountryModalSave} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-sm text-blue-300">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD STATE MODAL ---------------- */}
      {addStateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[480px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Create State</h2>
              <button onClick={() => setAddStateModalOpen(false)}><X size={20} className="text-gray-300 hover:text-white" /></button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">State Name</label>
              <input value={stateFormName} onChange={(e) => setStateFormName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
              <p className="text-xs text-gray-400 mt-2">State will be created for the currently selected country in the modal.</p>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button onClick={() => handleAddStateModalSave(newCity.countryId || editCity.countryId)} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-sm text-blue-300">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EDIT STATE MODAL ---------------- */}
      {editStateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[480px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit State ({stateEditData.name})</h2>
              <button onClick={() => setEditStateModalOpen(false)}><X size={20} className="text-gray-300 hover:text-white" /></button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">State Name</label>
              <input value={stateEditData.name} onChange={(e) => setStateEditData((p) => ({ ...p, name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button onClick={handleEditStateModalSave} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-sm text-blue-300">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MAIN PAGE ---------------- */}
      <div className="p-4 sm:p-6 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-113px)] overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Cities</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <div className="flex items-center bg-gray-700 px-2 py-1.5 w-full sm:w-60 rounded border border-gray-600">
              <Search size={16} className="text-gray-300" />
              <input className="bg-transparent pl-2 w-full text-sm text-gray-200 outline-none" placeholder="search..." value={searchText} onChange={(e) => handleSearch(e.target.value)} />
            </div>

            <button onClick={openAddModal} className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 border border-gray-600 rounded text-sm"><Plus size={16} /> New City</button>

            <button onClick={() => { setSearchText(""); setPage(1); loadCities(); }} className="p-1.5 bg-gray-700 border border-gray-600 rounded" aria-label="Refresh"><RefreshCw size={16} className="text-blue-400" /></button>

            <button onClick={() => setColumnModal(true)} className="p-1.5 bg-gray-700 border border-gray-600 rounded" aria-label="Columns"><List size={16} className="text-blue-300" /></button>
          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0">
            <div className="w-full overflow-auto">
              <table className="w-[690px] border-separate border-spacing-y-1 text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10">
  <tr className="text-white text-center">

    {visibleColumns.id && (
      <SortableHeader
        label="ID"
        sortOrder={sortOrder}
        onClick={() => setSortOrder(prev => (prev === "asc" ? null : "asc"))}
      />
    )}

    {visibleColumns.name && <th className="pb-1 border-b border-white">Name</th>}
    {visibleColumns.country && <th className="pb-1 border-b border-white">Country</th>}
    {visibleColumns.state && <th className="pb-1 border-b border-white">State</th>}

  </tr>
</thead>


<tbody className="text-center">

{sortedCities.length === 0 && (
  <tr>
    <td
      colSpan={Object.values(visibleColumns).filter(Boolean).length}
      className="px-4 py-6 text-center text-gray-400"
    >
      No records found
    </td>
  </tr>
)}

{sortedCities.map((c) => (
  <tr
    key={c.id}
    className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
    onClick={() => openEditModal(c)}
  >
    {visibleColumns.id && <td className="px-2 py-2 align-middle">{c.id}</td>}
    {visibleColumns.name && <td className="px-2 py-2 align-middle">{c.name}</td>}
    {visibleColumns.country && (
      <td className="px-2 py-2 align-middle">
        {c.countryName ?? getCountryName(c.countryId)}
      </td>
    )}
    {visibleColumns.state && (
      <td className="px-2 py-2 align-middle">
        {c.stateName ?? getStateName(c.stateId)}
      </td>
    )}
  </tr>
))}
</tbody>

              </table>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="mt-5 sticky bottom-0 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
            <div className="flex flex-wrap items-center gap-3 bg-transparent rounded text-sm">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-gray-800 border border-gray-600 rounded px-2 py-1">
                {[10,25,50,100].map((n)=> <option key={n} value={n}>{n}</option>)}
              </select>

              <button disabled={page===1} onClick={()=>setPage(1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronsLeft size={16} /></button>
              <button disabled={page===1} onClick={()=>setPage(page-1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronLeft size={16} /></button>

              <span>Page</span>
              <input type="number" className="w-12 bg-gray-800 border border-gray-600 rounded text-center" value={page} onChange={(e)=>{ const value=Number(e.target.value); if (value>=1 && value<=totalPages) setPage(value); }} />
              <span>/ {totalPages}</span>

              <button disabled={page===totalPages} onClick={()=>setPage(page+1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronRight size={16} /></button>
              <button disabled={page===totalPages} onClick={()=>setPage(totalPages)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronsRight size={16} /></button>

              <button onClick={()=>{ setSearchText(""); setPage(1); loadCities(); }} className="p-1 bg-gray-800 border border-gray-700 rounded"><RefreshCw size={16} /></button>

              <span>Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b> of <b>{totalRecords}</b> records</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cities;
