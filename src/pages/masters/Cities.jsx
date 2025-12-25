// Part 1/3 — imports + state + logic
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  Star,
  Pencil,
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

import SortableHeader from "../../components/SortableHeader";

// Services (make sure these exist in your services/allAPI)
import {
  getCountriesApi,
  getStatesByCountryApi,
  getCitiesApi,
  addCityApi,
  updateCityApi,
  deleteCityApi,
  searchCityApi,
  addCountryApi,
  updateCountryApi,
  searchCountryApi,
  addStateApi,
  updateStateApi,
  searchStateApi,
  // inactive / restore endpoints for cities
  getInactiveCitiesApi,
  restoreCityApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";

const Cities = () => {
  // ---------- modals ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // small reuse modals for create/edit country/state
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [editCountryModalOpen, setEditCountryModalOpen] = useState(false);
  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [editStateModalOpen, setEditStateModalOpen] = useState(false);

  // ---------- data ----------
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  // ---------- inactive ----------
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveCities, setInactiveCities] = useState([]);

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
    isInactive: false,
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

  // inline create form fields (for star modals)
  const [countryFormName, setCountryFormName] = useState("");
  const [countryEditData, setCountryEditData] = useState({ id: "", name: "" });
  const [stateFormName, setStateFormName] = useState("");
  const [stateEditData, setStateEditData] = useState({
    id: "",
    name: "",
    countryId: "",
  });

  // callbacks so create modal can return created item to the calling flow
  const [countryModalCallback, setCountryModalCallback] = useState(null);
  const [stateModalCallback, setStateModalCallback] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const sortedCities = [...cities];
  if (sortConfig.key) {
    sortedCities.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "countryName") {
         valA = a.countryName || getCountryName(a.countryId);
         valB = b.countryName || getCountryName(b.countryId);
      }
      if (sortConfig.key === "stateName") {
         valA = a.stateName || getStateName(a.stateId);
         valB = b.stateName || getStateName(b.stateId);
      }

      valA = valA || "";
      valB = valB || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
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
      // load large list for dropdowns (1..5000)
      const res = await getCountriesApi(1, 5000);
      if (res?.status === 200) {
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
  const loadStates = async (countryId) => {
    if (!countryId) {
      setStates([]);
      return [];
    }
    try {
      const res = await getStatesByCountryApi(countryId);
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

  // INACTIVE loaders
  const loadInactiveCities = async () => {
    try {
      const res = await getInactiveCitiesApi();
      if (res?.status === 200) {
        setInactiveCities(res.data.records || res.data || []);
      } else {
        toast.error("Failed to load inactive cities");
      }
    } catch (err) {
      console.error("LOAD INACTIVE CITIES ERROR:", err);
      toast.error("Failed to load inactive cities");
    }
  };

  useEffect(() => {
    loadCountries();
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const items = await loadStates(countryIdStr);
    const stateExists = items.some((s) => String(s.id) === stateIdStr);

    setEditCity({
      id: c.id,
      name: c.name ?? "",
      countryId: countryIdStr,
      stateId: stateExists ? stateIdStr : "",
      isInactive: c.isInactive === true || c.isActive === 0 || false,
    });

    setCountrySearchEdit("");
    setStateSearchEdit("");
    setEditModalOpen(true);
  };

  // ========== UPDATE CITY ==========
  const handleUpdateCity = async () => {
    const { id, name, countryId, stateId } = editCity;
    if (!name?.trim() || !countryId || !stateId)
      return toast.error("All fields are required");

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

  // ========== RESTORE CITY ==========
  const handleRestoreCity = async () => {
    try {
      const res = await restoreCityApi(editCity.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("City restored");
        setEditModalOpen(false);
        await loadCities();
        await loadInactiveCities();
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error("RESTORE CITY ERROR:", err);
      toast.error("Server error");
    }
  };

  // ========== COUNTRY / STATE create helpers ==========
  // create country and return created object (uses search fallback)
  const createCountryAndReload = async (name) => {
    if (!name?.trim()) return null;
    try {
      const res = await addCountryApi({ name: name.trim(), userId: currentUserId });
      if (res?.status === 200) {
        // reload list & try to find created record by searching
        await loadCountries();
        const sres = await searchCountryApi(name.trim());
        const arr = Array.isArray(sres.data) ? sres.data : sres.data?.records ?? [];
        return arr[0] ?? null;
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

  // create state and return created object (uses search fallback)
  const createStateAndReload = async (name, countryId) => {
    if (!name?.trim() || !countryId) return null;
    try {
      const res = await addStateApi({ name: name.trim(), countryId: Number(countryId), userId: currentUserId });
      if (res?.status === 200) {
        // reload states and try to find created by searching or by list
        const items = await loadStates(countryId);
        const created = items.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
        if (created) return created;
        const sres = await searchStateApi(name.trim());
        const arr = Array.isArray(sres.data) ? sres.data : sres.data?.records ?? [];
        const found = arr.find((a) => String(a.countryId) === String(countryId));
        return found ?? null;
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

  // ========== ACTIONS FROM DROPDOWN "NO MATCHES" BUTTONS ==========
  // When user clicks "Create new country 'xxx' and select" — open the SAME add-country modal (star)
  // and set callback so after creation the dropdown selects the created item.
  const onSuggestionCreateCountryFromAdd = (suggestedName) => {
    setCountryFormName(suggestedName);
    // define callback to select created country into Add City form
    setCountryModalCallback(() => (created) => {
      if (!created) return;
      setNewCity((p) => ({ ...p, countryId: String(created.id), stateId: "" }));
      // load states for new country
      loadStates(String(created.id));
    });
    setAddCountryModalOpen(true);
  };

  const onSuggestionCreateCountryFromEdit = (suggestedName) => {
    setCountryFormName(suggestedName);
    setCountryModalCallback(() => (created) => {
      if (!created) return;
      setEditCity((p) => ({ ...p, countryId: String(created.id), stateId: "" }));
      loadStates(String(created.id));
    });
    setAddCountryModalOpen(true);
  };

  const onSuggestionCreateStateFromAdd = (suggestedName) => {
    setStateFormName(suggestedName);
    setStateModalCallback(() => (created) => {
      if (!created) return;
      setNewCity((p) => ({ ...p, stateId: String(created.id) }));
    });
    setAddStateModalOpen(true);
  };

  const onSuggestionCreateStateFromEdit = (suggestedName) => {
    setStateFormName(suggestedName);
    setStateModalCallback(() => (created) => {
      if (!created) return;
      setEditCity((p) => ({ ...p, stateId: String(created.id) }));
    });
    setAddStateModalOpen(true);
  };

  // ========== STAR / MODAL SAVES — call callbacks if present ==========
  const handleAddCountryModalSave = async () => {
    const name = countryFormName.trim();
    if (!name) return toast.error("Country name required");
    const created = await createCountryAndReload(name);
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

  const handleAddStateModalSave = async (countryIdToUse) => {
    const name = stateFormName.trim();
    const countryId = countryIdToUse || editCity.countryId || newCity.countryId;
    if (!name) return toast.error("State name required");
    if (!countryId) return toast.error("Country required");
    const created = await createStateAndReload(name, countryId);
    if (created) {
      if (typeof stateModalCallback === "function") {
        try {
          stateModalCallback(created);
        } catch (e) {
          console.error("stateModalCallback error:", e);
        }
      }
      setAddStateModalOpen(false);
      setStateFormName("");
      setStateModalCallback(null);
    }
  };

  // ========== EDIT COUNTRY (pencil modal) save ==========
  const handleEditCountryModalSave = async () => {
    const { id, name } = countryEditData;
    if (!id || !name.trim()) return toast.error("Invalid country details");
    try {
      const res = await updateCountryApi(id, { name: name.trim(), userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Country updated");
        await loadCountries();
        setEditCountryModalOpen(false);
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error("UPDATE COUNTRY ERROR:", err);
      toast.error("Server error");
    }
  };

  // ========== EDIT STATE (pencil modal) save ==========
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

  // filtered lists for dropdowns (client-side)
  const filteredCountriesAdd = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearchAdd.toLowerCase())
  );
  const filteredCountriesEdit = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearchEdit.toLowerCase())
  );

  const filteredStatesAdd = states.filter((s) =>
    s.name.toLowerCase().includes(stateSearchAdd.toLowerCase())
  );
  const filteredStatesEdit = states.filter((s) =>
    s.name.toLowerCase().includes(stateSearchEdit.toLowerCase())
  );

  // ---- end of Part 1: logic, state, and helpers ----
// Part 2/3 — full JSX (copy entire block)
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
                <SearchableSelect
                  options={countries.map(c => ({ id: c.id, name: c.name }))}
                  value={newCity.countryId}
                  onChange={(val) => {
                     setNewCity((p) => ({ ...p, countryId: val, stateId: "" }));
                     loadStates(String(val));
                  }}
                  placeholder="Select Country"
                  className="w-full"
                />

                {/* STAR BUTTON -> opens add country modal */}
                <button type="button" className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition" onClick={() => { setCountryFormName(""); setCountryModalCallback(null); setAddCountryModalOpen(true); }}>
                  <Star size={18} className="text-yellow-400" />
                </button>
              </div>
            </div>

            {/* STATE WITH STAR + SEARCHABLE */}
            <div>
              <label className="block text-sm mb-1">State *</label>
              <div className="flex items-center gap-2">
                <SearchableSelect
                  options={states.map(s => ({ id: s.id, name: s.name }))}
                  value={newCity.stateId}
                  onChange={(val) => setNewCity((p) => ({ ...p, stateId: val }))}
                  placeholder="Select State"
                  disabled={!newCity.countryId}
                  className="w-full"
                />

                {/* STAR BUTTON -> open add state modal */}
                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                  onClick={() => { setStateFormName(""); setStateModalCallback(null); setAddStateModalOpen(true); }}
                  disabled={!newCity.countryId}
                >
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
              <input type="text" value={editCity.name} onChange={(e) => setEditCity((p) => ({ ...p, name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base" />
            </div>

            {/* COUNTRY WITH PENCIL + SEARCHABLE */}
            <div>
              <label className="block text-sm mb-1">Country *</label>
              <div className="flex items-center gap-2">
                <SearchableSelect
                  options={countries.map(c => ({ id: c.id, name: c.name }))}
                  value={editCity.countryId}
                  onChange={(val) => {
                     setEditCity((p) => ({ ...p, countryId: val, stateId: "" }));
                     loadStates(String(val));
                  }}
                  placeholder="Select Country"
                  className="w-full"
                />

                {/* STAR BUTTON */}
                <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                    onClick={() => { setCountryFormName(""); setCountryModalCallback(null); setAddCountryModalOpen(true); }}
                >
                    <Star size={18} className="text-yellow-400" />
                </button>
              </div>
            </div>

            {/* STATE WITH PENCIL + SEARCHABLE */}
            <div>
              <label className="block text-sm mb-1">State *</label>
              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="px-4 sm:px-5 py-3 border-t border-gray-700 flex justify-between">
            {/* DELETE OR RESTORE */}
            {!editCity.isInactive ? (
              <button onClick={handleDeleteCity} className="flex items-center gap-2 bg-red-600 px-3 sm:px-4 py-2 rounded border border-red-900 text-sm sm:text-base">
                <Trash2 size={16} /> Delete
              </button>
            ) : (
              <button onClick={handleRestoreCity} className="flex items-center gap-2 bg-green-700 px-3 sm:px-4 py-2 rounded border border-green-900 text-sm sm:text-base">
                <ArchiveRestore size={16} /> Restore
              </button>
            )}

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

            <div className="bg-gray-800 p-3 rounded border border-gray-700">
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

              {Object.keys(visibleColumns).filter(
                (col) => !visibleColumns[col]
              ).length === 0 && (
                <p className="text-gray-400 text-sm">No hidden columns</p>
              )}
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
            <button onClick={() => { setAddCountryModalOpen(false); setCountryModalCallback(null); }}>
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
            <button onClick={() => { setAddStateModalOpen(false); setStateModalCallback(null); }}><X size={20} className="text-gray-300 hover:text-white" /></button>
          </div>

          <div className="p-6">
            <label className="block text-sm mb-1">State Name</label>
            <input value={stateFormName} onChange={(e) => setStateFormName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400 mt-2">State will be created for the currently selected country in the modal (or the city form).</p>
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
    <PageLayout>
    <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
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

          {/* INACTIVE TOGGLE */}
          <button onClick={async () => { if (!showInactive) await loadInactiveCities(); setShowInactive(!showInactive); }} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm">
            <ArchiveRestore size={16} className="text-yellow-300" />
            {showInactive ? "Hide Inactive" : "Inactive"}
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto min-h-0">
          <div className="w-full overflow-auto">
            <table className="w-[690px] border-separate border-spacing-y-1 text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                  {visibleColumns.name && <SortableHeader label="Name" sortOrder={sortConfig.key === "name" ? sortConfig.direction : null} onClick={() => handleSort("name")} />}
                  {visibleColumns.country && <SortableHeader label="Country" sortOrder={sortConfig.key === "countryName" ? sortConfig.direction : null} onClick={() => handleSort("countryName")} />}
                  {visibleColumns.state && <SortableHeader label="State" sortOrder={sortConfig.key === "stateName" ? sortConfig.direction : null} onClick={() => handleSort("stateName")} />}
                </tr>
              </thead>

              <tbody className="text-center">
                {/* Active Records */}
                {sortedCities.length === 0 && !showInactive && (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-6 text-center text-gray-400">
                      No records found
                    </td>
                  </tr>
                )}

                {sortedCities.map((c) => (
                  <tr key={c.id} className="bg-gray-900 hover:bg-gray-700 cursor-pointer" onClick={() => openEditModal(c)}>
                    {visibleColumns.id && <td className="px-2 py-2">{c.id}</td>}
                    {visibleColumns.name && <td className="px-2 py-2">{c.name}</td>}
                    {visibleColumns.country && <td className="px-2 py-2">{c.countryName ?? getCountryName(c.countryId)}</td>}
                    {visibleColumns.state && <td className="px-2 py-2">{c.stateName ?? getStateName(c.stateId)}</td>}
                  </tr>
                ))}

                {/* INACTIVE ROWS */}
                {showInactive && inactiveCities.map((c) => (
                  <tr key={`inactive-${c.id}`} className="bg-gray-900/50 hover:bg-gray-700/50 cursor-pointer opacity-50" onClick={() => openEditModal({ ...c, isInactive: true })}>
                    {visibleColumns.id && <td className="px-2 py-2 line-through">{c.id}</td>}
                    {visibleColumns.name && <td className="px-2 py-2 line-through">{c.name}</td>}
                    {visibleColumns.country && <td className="px-2 py-2 line-through">{c.countryName ?? getCountryName(c.countryId)}</td>}
                    {visibleColumns.state && <td className="px-2 py-2 line-through">{c.stateName ?? getStateName(c.stateId)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <Pagination
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          total={totalRecords}
          onRefresh={() => {
            setSearchText("");
            setPage(1);
            loadCities();
          }}
        />

    </div>
    </div>
    </PageLayout>
  </>
);
};

export default Cities;



