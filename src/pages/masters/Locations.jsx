// src/pages/masters/Locations.jsx
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

// APIs
import {
  getLocationsApi,
  addLocationApi,
  updateLocationApi,
  deleteLocationApi,
  searchLocationApi,
  getCountriesApi,
  addCountryApi,
  updateCountryApi,
  getStatesApi,
  addStateApi,
  updateStateApi,
  getCitiesApi,
  addCityApi,
  updateCityApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const Locations = () => {
  // UI states
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Data
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");

  // Filtering
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");

  // Dropdown data
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // User
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // Add form
  const [newItem, setNewItem] = useState({
    name: "",
    countryId: "",
    stateId: "",
    cityId: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  // Edit form
  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    countryId: "",
    stateId: "",
    cityId: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  // Column picker
  const defaultColumns = {
    id: true,
    name: true,
    country: true,
    state: true,
    city: true,
    address: true,
    latitude: true,
    longitude: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnSearch, setColumnSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // Searchable dropdown helpers (add/edit)
  const [countryDropdownOpenAdd, setCountryDropdownOpenAdd] = useState(false);
  const [countryDropdownOpenEdit, setCountryDropdownOpenEdit] = useState(false);
  const [countrySearchAdd, setCountrySearchAdd] = useState("");
  const [countrySearchEdit, setCountrySearchEdit] = useState("");
  const countryAddRef = useRef(null);
  const countryEditRef = useRef(null);

  const [stateDropdownOpenAdd, setStateDropdownOpenAdd] = useState(false);
  const [stateDropdownOpenEdit, setStateDropdownOpenEdit] = useState(false);
  const [stateSearchAdd, setStateSearchAdd] = useState("");
  const [stateSearchEdit, setStateSearchEdit] = useState("");
  const stateAddRef = useRef(null);
  const stateEditRef = useRef(null);

  const [cityDropdownOpenAdd, setCityDropdownOpenAdd] = useState(false);
  const [cityDropdownOpenEdit, setCityDropdownOpenEdit] = useState(false);
  const [citySearchAdd, setCitySearchAdd] = useState("");
  const [citySearchEdit, setCitySearchEdit] = useState("");
  const cityAddRef = useRef(null);
  const cityEditRef = useRef(null);

  // Country/State/City modals (star/pencil)
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [editCountryModalOpen, setEditCountryModalOpen] = useState(false);
  const [countryFormName, setCountryFormName] = useState("");
  const [countryEditData, setCountryEditData] = useState({ id: "", name: "" });

  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [editStateModalOpen, setEditStateModalOpen] = useState(false);
  const [stateFormName, setStateFormName] = useState("");
  const [stateEditData, setStateEditData] = useState({
    id: "",
    name: "",
    countryId: "",
  });

  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [editCityModalOpen, setEditCityModalOpen] = useState(false);
  const [cityFormName, setCityFormName] = useState("");
  const [cityEditData, setCityEditData] = useState({
    id: "",
    name: "",
    countryId: "",
    stateId: "",
  });

  // Close dropdowns if click outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (countryAddRef.current && !countryAddRef.current.contains(e.target))
        setCountryDropdownOpenAdd(false);
      if (countryEditRef.current && !countryEditRef.current.contains(e.target))
        setCountryDropdownOpenEdit(false);
      if (stateAddRef.current && !stateAddRef.current.contains(e.target))
        setStateDropdownOpenAdd(false);
      if (stateEditRef.current && !stateEditRef.current.contains(e.target))
        setStateDropdownOpenEdit(false);
      if (cityAddRef.current && !cityAddRef.current.contains(e.target))
        setCityDropdownOpenAdd(false);
      if (cityEditRef.current && !cityEditRef.current.contains(e.target))
        setCityDropdownOpenEdit(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ===============================
  // Load dropdowns (robust shape handling)
  // ===============================
  const parseArrayFromResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.records)) return res.data.records;
    if (Array.isArray(res.records)) return res.records;
    const maybeArray = Object.values(res).find((v) => Array.isArray(v));
    return Array.isArray(maybeArray) ? maybeArray : [];
  };


// ===============================
// Filtering logic  (must come first)
// ===============================
const filteredRows = rows.filter((r) => {
  let valid = true;
  if (filterCountry)
    valid = valid && String(r.countryId) === String(filterCountry);
  if (filterState) valid = valid && String(r.stateId) === String(filterState);
  if (filterCity) valid = valid && String(r.cityId) === String(filterCity);
  return valid;
});

// ===============================
// Sorting logic (AFTER filteredRows)
// ===============================
const [sortOrder, setSortOrder] = useState("asc");

const sortedRows = [...filteredRows];

if (sortOrder === "asc") {
  sortedRows.sort((a, b) => Number(a.id) - Number(b.id));
}



  const loadCountries = async () => {
    try {
      const res = await getCountriesApi(1, 9999);
      const arr = parseArrayFromResponse(res);
      setCountries(arr);
      return arr;
    } catch (err) {
      console.error("loadCountries", err);
      toast.error("Failed to load countries");
      setCountries([]);
      return [];
    }
  };

  const loadStates = async () => {
    try {
      const res = await getStatesApi(1, 9999);
      const arr = parseArrayFromResponse(res);
      setStates(arr);
      return arr;
    } catch (err) {
      console.error("loadStates", err);
      toast.error("Failed to load states");
      setStates([]);
      return [];
    }
  };

  const loadCities = async () => {
    try {
      const res = await getCitiesApi(1, 9999);
      console.log(res);
      
      const arr = parseArrayFromResponse(res);
      setCities(arr);
      return arr;
    } catch (err) {
      console.error("loadCities", err);
      toast.error("Failed to load cities");
      setCities([]);
      return [];
    }
  };
  // ===============================
  // Load table rows
  // ===============================
  const loadRows = async () => {
    try {
      const res = await getLocationsApi(page, limit);
      if (res?.status === 200) {
        const data = res.data ?? res;
        const items = Array.isArray(data.records)
          ? data.records
          : Array.isArray(data)
          ? data
          : Array.isArray(res)
          ? res
          : [];
        setTotalRecords(data.total ?? res.total ?? items.length);
        const normalized = (items || []).map((r) => ({
          id: r.Id ?? r.id,
          name: r.Name ?? r.name,
          countryName: r.CountryName ?? r.countryName ?? r.country?.name ?? "",
          countryId: r.CountryId ?? r.countryId ?? r.country?.id ?? "",
          stateName: r.StateName ?? r.stateName ?? r.state?.name ?? "",
          stateId: r.StateId ?? r.stateId ?? r.state?.id ?? "",
          cityName: r.CityName ?? r.cityName ?? r.city?.name ?? "",
          cityId: r.CityId ?? r.cityId ?? r.city?.id ?? "",
          address: r.Address ?? r.address ?? "",
          latitude: r.Latitude ?? r.latitude ?? "",
          longitude: r.Longitude ?? r.longitude ?? "",
        }));
        setRows(normalized);
      }
    } catch (err) {
      console.error("loadRows error", err);
      toast.error("Failed to load locations");
    }
  };

  useEffect(() => {
    (async () => {
      await loadCountries();
      await loadStates();
      await loadCities();
      await loadRows();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);


  // ===============================
  // SEARCH
  // ===============================
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      loadRows();
      return;
    } 
    try {
      const res = await searchLocationApi(value);
      if (res?.status === 200) {
        const items = res.data ?? [];
        const normalized = (items || []).map((r) => ({
          id: r.Id ?? r.id,
          name: r.Name ?? r.name,
          countryName: r.CountryName ?? r.countryName,
          stateName: r.StateName ?? r.stateName,
          cityName: r.CityName ?? r.cityName,
          address: r.Address ?? r.address,
          latitude: r.Latitude ?? r.latitude,
          longitude: r.Longitude ?? r.longitude,
        }));
        setRows(normalized);
        setTotalRecords(normalized.length);
      } else {
        toast.error("Search failed");
      }
    } catch (err) {
      console.error("searchLocation error", err);
      toast.error("Search failed");
    }
  };

  // ===============================
  // Add / Update / Delete location
  // ===============================
  const handleAdd = async () => {
    if (!newItem.name.trim()) return toast.error("Name required");
    if (!newItem.countryId) return toast.error("Select a country");
    if (!newItem.stateId) return toast.error("Select a state");
    if (!newItem.cityId) return toast.error("Select a city");

    try {
      const res = await addLocationApi({ ...newItem, userId: currentUserId });
      if (res?.status === 201 || res?.status === 200) {
        toast.success("Location added");
        setModalOpen(false);
        setNewItem({
          name: "",
          countryId: "",
          stateId: "",
          cityId: "",
          address: "",
          latitude: "",
          longitude: "",
        });
        await loadRows();
      } else {
        toast.error(res?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("addLocation error", err);
      toast.error("Add failed");
    }
  };

  const openEdit = (row) => {
    setEditItem({
      id: row.id,
      name: row.name,
      countryId: row.countryId,
      stateId: row.stateId,
      cityId: row.cityId,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
    });
    // clear mini-searches so getName(...) shows current names
    setCountrySearchEdit("");
    setStateSearchEdit("");
    setCitySearchEdit("");
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem.name.trim()) return toast.error("Name required");
    try {
      const res = await updateLocationApi(editItem.id, {
        ...editItem,
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("Location updated");
        setEditModalOpen(false);
        await loadRows();
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("updateLocation error", err);
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteLocationApi(editItem.id, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        await loadRows();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("deleteLocation error", err);
      toast.error("Delete failed");
    }
  };

  // ===============================
  // Country / State / City CRUD helpers
  // ===============================
  const handleAddCountry = async (name) => {
    if (!name?.trim()) return null;
    try {
      const res = await addCountryApi({
        name: name.trim(),
        userId: currentUserId,
      });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Country created");
        const list = await loadCountries();
        return (
          list.find(
            (c) => String(c.name).toLowerCase() === name.trim().toLowerCase()
          ) || null
        );
      }
    } catch (err) {
      console.error("addCountry", err);
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
        // clear search so new name shows
        setCountrySearchEdit("");
        return true;
      }
    } catch (err) {
      console.error("updateCountry", err);
      toast.error("Failed to update country");
    }
    return false;
  };

  const handleAddState = async (name, countryId) => {
    if (!name?.trim() || !countryId) return null;
    try {
      const res = await addStateApi({
        name: name.trim(),
        countryId,
        userId: currentUserId,
      });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("State created");
        const list = await loadStates();
        return (
          list.find(
            (s) =>
              String(s.name).toLowerCase() === name.trim().toLowerCase() &&
              String(s.countryId) === String(countryId)
          ) || null
        );
      }
    } catch (err) {
      console.error("addState", err);
      toast.error("Failed to create state");
    }
    return null;
  };

  const handleUpdateState = async (id, name, countryId) => {
    if (!id || !name?.trim() || !countryId) return false;
    try {
      const res = await updateStateApi(id, {
        name: name.trim(),
        countryId,
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("State updated");
        await loadStates();
        // clear mini-search so updated name shows
        setStateSearchEdit("");
        return true;
      }
    } catch (err) {
      console.error("updateState", err);
      toast.error("Failed to update state");
    }
    return false;
  };

  const handleAddCity = async (name, countryId, stateId) => {
    if (!name?.trim() || !countryId || !stateId) return null;
    try {
      const res = await addCityApi({
        name: name.trim(),
        countryId,
        stateId,
        userId: currentUserId,
      });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("City created");
        const list = await loadCities();
        return (
          list.find(
            (c) =>
              String(c.name ?? c.CityName ?? "").toLowerCase() ===
                name.trim().toLowerCase() &&
              String(c.stateId) === String(stateId)
          ) || null
        );
      }
    } catch (err) {
      console.error("addCity", err);
      toast.error("Failed to create city");
    }
    return null;
  };

  const handleUpdateCity = async (id, name, countryId, stateId) => {
    if (!id || !name?.trim() || !countryId || !stateId) return false;
    try {
      const res = await updateCityApi(id, {
        name: name.trim(),
        countryId,
        stateId,
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("City updated");
        await loadCities();
        // clear search so updated name shows
        setCitySearchEdit("");
        return true;
      }
    } catch (err) {
      console.error("updateCity", err);
      toast.error("Failed to update city");
    }
    return false;
  };
  // Inline create helpers (from dropdown no-matches)
  const inlineCreateCountryFromAdd = async () => {
    const name = countrySearchAdd.trim();
    if (!name) return;
    const created = await handleAddCountry(name);
    if (created) {
      setNewItem((p) => ({
        ...p,
        countryId: created.id ?? created.Id ?? created.countryId,
      }));
      setCountrySearchAdd("");
      setCountryDropdownOpenAdd(false);
      await loadStates();
    }
  };

  const inlineCreateCountryFromEdit = async () => {
    const name = countrySearchEdit.trim();
    if (!name) return;
    const created = await handleAddCountry(name);
    if (created) {
      setEditItem((p) => ({
        ...p,
        countryId: created.id ?? created.Id ?? created.countryId,
      }));
      setCountrySearchEdit("");
      setCountryDropdownOpenEdit(false);
      await loadStates();
    }
  };

  const inlineCreateStateFromAdd = async () => {
    const name = stateSearchAdd.trim();
    const countryId = newItem.countryId;
    if (!name) return;
    if (!countryId) return toast.error("Select country first");
    const created = await handleAddState(name, countryId);
    if (created) {
      setNewItem((p) => ({
        ...p,
        stateId: created.id ?? created.Id ?? created.stateId,
      }));
      setStateSearchAdd("");
      setStateDropdownOpenAdd(false);
      await loadCities();
    }
  };

  const inlineCreateStateFromEdit = async () => {
    const name = stateSearchEdit.trim();
    const countryId = editItem.countryId;
    if (!name) return;
    if (!countryId) return toast.error("Select country first");
    const created = await handleAddState(name, countryId);
    if (created) {
      setEditItem((p) => ({
        ...p,
        stateId: created.id ?? created.Id ?? created.stateId,
      }));
      setStateSearchEdit("");
      setStateDropdownOpenEdit(false);
      await loadCities();
    }
  };

  const inlineCreateCityFromAdd = async () => {
    const name = citySearchAdd.trim();
    const countryId = newItem.countryId;
    const stateId = newItem.stateId;
    if (!name) return;
    if (!countryId || !stateId)
      return toast.error("Select country & state first");
    const created = await handleAddCity(name, countryId, stateId);
    if (created) {
      setNewItem((p) => ({
        ...p,
        cityId: created.id ?? created.Id ?? created.cityId,
      }));
      setCitySearchAdd("");
      setCityDropdownOpenAdd(false);
    }
  };

  const inlineCreateCityFromEdit = async () => {
    const name = citySearchEdit.trim();
    const countryId = editItem.countryId;
    const stateId = editItem.stateId;
    if (!name) return;
    if (!countryId || !stateId)
      return toast.error("Select country & state first");
    const created = await handleAddCity(name, countryId, stateId);
    if (created) {
      setEditItem((p) => ({
        ...p,
        cityId: created.id ?? created.Id ?? created.cityId,
      }));
      setCitySearchEdit("");
      setCityDropdownOpenEdit(false);
    }
  };

  // column picker open
  const openColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(true);
  };

  // Helpers to get names
  const getCountryName = (id) => {
    const c = countries.find((x) => String(x.id) === String(id));
    return c ? c.name : "";
  };
  const getStateName = (id) => {
    const s = states.find((x) => String(x.id) === String(id));
    return s ? s.name : "";
  };
  const getCityName = (id) => {
    const c = cities.find((x) => String(x.id) === String(id));
    return c ? c.name : "";
  };

  // filtered lists for dropdowns
  const filteredCountriesAdd = countries.filter((c) =>
    String(c.name ?? "")
      .toLowerCase()
      .includes(countrySearchAdd.toLowerCase())
  );
  const filteredCountriesEdit = countries.filter((c) =>
    String(c.name ?? "")
      .toLowerCase()
      .includes(countrySearchEdit.toLowerCase())
  );

  const filteredStatesAdd = states
    .filter((s) =>
      newItem.countryId
        ? String(s.countryId) === String(newItem.countryId)
        : true
    )
    .filter((s) =>
      String(s.name ?? "")
        .toLowerCase()
        .includes(stateSearchAdd.toLowerCase())
    );

  const filteredStatesEdit = states
    .filter((s) =>
      editItem.countryId
        ? String(s.countryId) === String(editItem.countryId)
        : true
    )
    .filter((s) =>
      String(s.name ?? "")
        .toLowerCase()
        .includes(stateSearchEdit.toLowerCase())
    );

  const filteredCitiesAdd = cities
    .filter((c) =>
      newItem.stateId ? String(c.stateId) === String(newItem.stateId) : true
    )
    .filter((c) =>
      String(c.name ?? "")
        .toLowerCase()
        .includes(citySearchAdd.toLowerCase())
    );

  const filteredCitiesEdit = cities
    .filter((c) =>
      editItem.stateId ? String(c.stateId) === String(editItem.stateId) : true
    )
    .filter((c) =>
      String(c.name ?? "")
        .toLowerCase()
        .includes(citySearchEdit.toLowerCase())
    );

  // ===============================
  // RENDER
  // ===============================
  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Location</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm">Name *</label>
                <input
                  className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                />
              </div>

              {/* Country (searchable + inline create + star modal) */}
              <div>
                <label className="text-sm">Country *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={countryAddRef}>
                    <input
                      type="text"
                      value={
                        countrySearchAdd ||
                        getCountryName(newItem.countryId) ||
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
                                setNewItem((p) => ({
                                  ...p,
                                  countryId: c.id,
                                  stateId: "",
                                  cityId: "",
                                }));
                                setCountryDropdownOpenAdd(false);
                                setCountrySearchAdd("");
                                loadStates();
                                loadCities();
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
                              onClick={inlineCreateCountryFromAdd}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new country &quot;{countrySearchAdd}&quot;
                              and select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                    onClick={() => {
                      setCountryFormName("");
                      setAddCountryModalOpen(true);
                    }}
                  >
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>
              </div>

              {/* State (searchable + inline create + star modal) */}
              <div>
                <label className="text-sm">State *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={stateAddRef}>
                    <input
                      type="text"
                      value={
                        stateSearchAdd ||
                        getStateName(newItem.stateId) ||
                        stateSearchAdd
                      }
                      onChange={(e) => {
                        setStateSearchAdd(e.target.value);
                        setStateDropdownOpenAdd(true);
                      }}
                      onFocus={() => setStateDropdownOpenAdd(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    />

                    {stateDropdownOpenAdd && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredStatesAdd.length > 0 ? (
                          filteredStatesAdd.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setNewItem((p) => ({
                                  ...p,
                                  stateId: s.id,
                                  cityId: "",
                                }));
                                setStateDropdownOpenAdd(false);
                                setStateSearchAdd("");
                                loadCities();
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
                              onClick={inlineCreateStateFromAdd}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new state &quot;{stateSearchAdd}&quot; and
                              select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                    onClick={() => {
                      setStateFormName("");
                      setStateEditData((p) => ({
                        ...p,
                        countryId: newItem.countryId || "",
                      }));
                      setAddStateModalOpen(true);
                    }}
                  >
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>
              </div>

              {/* City (searchable + inline create + star modal) */}
              <div>
                <label className="text-sm">City *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={cityAddRef}>
                    <input
                      type="text"
                      value={
                        citySearchAdd ||
                        getCityName(newItem.cityId) ||
                        citySearchAdd
                      }
                      onChange={(e) => {
                        setCitySearchAdd(e.target.value);
                        setCityDropdownOpenAdd(true);
                      }}
                      onFocus={() => setCityDropdownOpenAdd(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    />

                    {cityDropdownOpenAdd && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredCitiesAdd.length > 0 ? (
                          filteredCitiesAdd.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setNewItem((p) => ({ ...p, cityId: c.id }));
                                setCityDropdownOpenAdd(false);
                                setCitySearchAdd("");
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
                              onClick={inlineCreateCityFromAdd}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new city &quot;{citySearchAdd}&quot; and
                              select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                    onClick={() => {
                      setCityFormName("");
                      setCityEditData((p) => ({
                        ...p,
                        countryId: newItem.countryId || "",
                        stateId: newItem.stateId || "",
                      }));
                      setAddCityModalOpen(true);
                    }}
                  >
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-sm">Address</label>
                <textarea
                  className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  value={newItem.address}
                  onChange={(e) =>
                    setNewItem({ ...newItem, address: e.target.value })
                  }
                />
              </div>

              {/* Lat / Long */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Latitude</label>
                  <input
                    className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                    value={newItem.latitude}
                    onChange={(e) =>
                      setNewItem({ ...newItem, latitude: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Longitude</label>
                  <input
                    className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                    value={newItem.longitude}
                    onChange={(e) =>
                      setNewItem({ ...newItem, longitude: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
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
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Location</h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm">Name *</label>
                <input
                  className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  value={editItem.name}
                  onChange={(e) =>
                    setEditItem({ ...editItem, name: e.target.value })
                  }
                />
              </div>

              {/* Country (searchable + pencil edit) */}
              <div>
                <label className="text-sm">Country *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={countryEditRef}>
                    <input
                      type="text"
                      value={
                        countrySearchEdit ||
                        getCountryName(editItem.countryId) ||
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
                                setEditItem((p) => ({
                                  ...p,
                                  countryId: c.id,
                                  stateId: "",
                                  cityId: "",
                                }));
                                setCountryDropdownOpenEdit(false);
                                setCountrySearchEdit("");
                                loadStates();
                                loadCities();
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
                              onClick={inlineCreateCountryFromEdit}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new country &quot;{countrySearchEdit}&quot;
                              and select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                    onClick={() => {
                      const id = editItem.countryId;
                      const c = countries.find(
                        (x) => String(x.id) === String(id)
                      );

                      setCountryEditData({
                        id: c?.id || "",
                        name: c?.name || "",
                      });

                      // ensure input shows the name
                      setCountrySearchEdit(c?.name || "");

                      setEditCountryModalOpen(true);
                    }}
                  >
                    <Pencil size={18} className="text-blue-400" />
                  </button>
                </div>
              </div>

              {/* State (searchable + pencil edit) */}
              <div>
                <label className="text-sm">State *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={stateEditRef}>
                    <input
                      type="text"
                      value={
                        stateSearchEdit ||
                        getStateName(editItem.stateId) ||
                        stateSearchEdit
                      }
                      onChange={(e) => {
                        setStateSearchEdit(e.target.value);
                        setStateDropdownOpenEdit(true);
                      }}
                      onFocus={() => setStateDropdownOpenEdit(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    />

                    {stateDropdownOpenEdit && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredStatesEdit.length > 0 ? (
                          filteredStatesEdit.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setEditItem((p) => ({
                                  ...p,
                                  stateId: s.id,
                                  cityId: "",
                                }));
                                setStateDropdownOpenEdit(false);
                                setStateSearchEdit("");
                                loadCities();
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
                              onClick={inlineCreateStateFromEdit}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new state &quot;{stateSearchEdit}&quot; and
                              select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                    onClick={() => {
                      const id = editItem.stateId;
                      const s = states.find((x) => String(x.id) === String(id));

                      setStateEditData({
                        id: s?.id ?? "",
                        name: s?.name ?? "",
                        countryId: s?.countryId ?? editItem.countryId ?? "",
                      });

                      setStateSearchEdit(s?.name ?? "");
                      setEditStateModalOpen(true);
                    }}
                  >
                    <Pencil size={18} className="text-blue-400" />
                  </button>
                </div>
              </div>

              {/* City (searchable + pencil edit) */}
              <div>
                <label className="text-sm">City *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={cityEditRef}>
                    <input
                      type="text"
                      value={
                        citySearchEdit ||
                        getCityName(editItem.cityId) ||
                        citySearchEdit
                      }
                      onChange={(e) => {
                        setCitySearchEdit(e.target.value);
                        setCityDropdownOpenEdit(true);
                      }}
                      onFocus={() => setCityDropdownOpenEdit(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    />

                    {cityDropdownOpenEdit && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredCitiesEdit.length > 0 ? (
                          filteredCitiesEdit.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setEditItem((p) => ({ ...p, cityId: c.id }));
                                setCityDropdownOpenEdit(false);
                                setCitySearchEdit("");
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
                              onClick={inlineCreateCityFromEdit}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new city &quot;{citySearchEdit}&quot; and
                              select
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                    onClick={() => {
                      const id = editItem.cityId;
                      const c = cities.find((x) => String(x.id) === String(id));

                      setCityEditData({
                        id: c?.id ?? "",
                        name: c?.name ?? c?.CityName ?? "",
                        countryId: c?.countryId ?? editItem.countryId ?? "",
                        stateId: c?.stateId ?? editItem.stateId ?? "",
                      });

                      setCitySearchEdit(c?.name ?? c?.CityName ?? "");
                      setEditCityModalOpen(true);
                    }}
                  >
                    <Pencil size={18} className="text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-sm">Address</label>
                <textarea
                  className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  value={editItem.address}
                  onChange={(e) =>
                    setEditItem({ ...editItem, address: e.target.value })
                  }
                />
              </div>

              {/* Lat / Long */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Latitude</label>
                  <input
                    className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                    value={editItem.latitude}
                    onChange={(e) =>
                      setEditItem({ ...editItem, latitude: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Longitude</label>
                  <input
                    className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                    value={editItem.longitude}
                    onChange={(e) =>
                      setEditItem({ ...editItem, longitude: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded border border-red-900"
              >
                <Trash2 size={16} /> Delete
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT COUNTRY MODALS */}
      {addCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Country</h2>
              <button onClick={() => setAddCountryModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={countryFormName}
                onChange={(e) => setCountryFormName(e.target.value)}
                placeholder="Enter country name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={async () => {
                  const created = await handleAddCountry(
                    countryFormName.trim()
                  );
                  if (created) {
                    setAddCountryModalOpen(false);
                    setCountryFormName("");
                    // if add modal open preselect
                    if (modalOpen)
                      setNewItem((p) => ({
                        ...p,
                        countryId:
                          created.id ?? created.Id ?? created.countryId,
                      }));
                  }
                }}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {editCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Country</h2>
              <button onClick={() => setEditCountryModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
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
                placeholder="Enter country name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={async () => {
                  const ok = await handleUpdateCountry(
                    countryEditData.id,
                    countryEditData.name
                  );
                  if (ok) setEditCountryModalOpen(false);
                }}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STATE MODALS */}
      {addStateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New State</h2>
              <button onClick={() => setAddStateModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={stateFormName}
                onChange={(e) => setStateFormName(e.target.value)}
                placeholder="Enter state name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />

              <label className="block text-sm mb-1">Country *</label>
              <select
                value={stateEditData.countryId}
                onChange={(e) =>
                  setStateEditData((p) => ({ ...p, countryId: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={async () => {
                  if (!stateFormName.trim())
                    return toast.error("Name required");
                  if (!stateEditData.countryId)
                    return toast.error("Select country");
                  const created = await handleAddState(
                    stateFormName.trim(),
                    stateEditData.countryId
                  );
                  if (created) {
                    setAddStateModalOpen(false);
                    setStateFormName("");
                    if (modalOpen)
                      setNewItem((p) => ({
                        ...p,
                        stateId: created.id ?? created.Id ?? created.stateId,
                      }));
                  }
                }}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {editStateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit State</h2>
              <button onClick={() => setEditStateModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={stateEditData.name}
                onChange={(e) =>
                  setStateEditData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Enter state name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />

              <label className="block text-sm mb-1">Country *</label>
              <select
                value={stateEditData.countryId}
                onChange={(e) =>
                  setStateEditData((p) => ({ ...p, countryId: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={async () => {
                  const ok = await handleUpdateState(
                    stateEditData.id,
                    stateEditData.name,
                    stateEditData.countryId
                  );
                  if (ok) setEditStateModalOpen(false);
                }}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CITY MODALS */}
      {addCityModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New City</h2>
              <button onClick={() => setAddCityModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={cityFormName}
                onChange={(e) => setCityFormName(e.target.value)}
                placeholder="Enter city name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />

              <label className="block text-sm mb-1">Country *</label>
              <select
                value={cityEditData.countryId}
                onChange={(e) =>
                  setCityEditData((p) => ({ ...p, countryId: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="block text-sm mb-1">State *</label>
              <select
                value={cityEditData.stateId}
                onChange={(e) =>
                  setCityEditData((p) => ({ ...p, stateId: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">Select State</option>
                {states
                  .filter(
                    (s) =>
                      !cityEditData.countryId ||
                      String(s.countryId) === String(cityEditData.countryId)
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={async () => {
                  if (!cityFormName.trim()) return toast.error("Name required");
                  if (!cityEditData.countryId || !cityEditData.stateId)
                    return toast.error("Select country & state");
                  const created = await handleAddCity(
                    cityFormName.trim(),
                    cityEditData.countryId,
                    cityEditData.stateId
                  );
                  if (created) {
                    setAddCityModalOpen(false);
                    setCityFormName("");
                    if (modalOpen)
                      setNewItem((p) => ({
                        ...p,
                        cityId: created.id ?? created.Id ?? created.cityId,
                      }));
                  }
                }}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {editCityModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit City</h2>
              <button onClick={() => setEditCityModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={cityEditData.name}
                onChange={(e) =>
                  setCityEditData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Enter city name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />

              <label className="block text-sm mb-1">Country *</label>
              <select
                value={cityEditData.countryId}
                onChange={(e) =>
                  setCityEditData((p) => ({ ...p, countryId: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="block text-sm mb-1">State *</label>
              <select
                value={cityEditData.stateId}
                onChange={(e) =>
                  setCityEditData((p) => ({ ...p, stateId: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">Select State</option>
                {states
                  .filter(
                    (s) =>
                      !cityEditData.countryId ||
                      String(s.countryId) === String(cityEditData.countryId)
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={async () => {
                  const ok = await handleUpdateCity(
                    cityEditData.id,
                    cityEditData.name,
                    cityEditData.countryId,
                    cityEditData.stateId
                  );
                  if (ok) setEditCityModalOpen(false);
                }}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER (scrollable when many columns) */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => tempVisibleColumns[col])
                    .filter((col) => col.includes(columnSearch))
                    .map((col) => (
                      <div
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                        key={col}
                      >
                        <span>{col.toUpperCase()}</span>
                        <button
                          className="text-red-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [col]: false,
                            }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => !tempVisibleColumns[col])
                    .filter((col) => col.includes(columnSearch))
                    .map((col) => (
                      <div
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                        key={col}
                      >
                        <span>{col.toUpperCase()}</span>
                        <button
                          className="text-green-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [col]: true,
                            }))
                          }
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setTempVisibleColumns(defaultColumns)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 sm:p-6 text-white min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Locations</h2>

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
          {/* Country filter */}
          <select
            value={filterCountry}
            onChange={(e) => {
              setFilterCountry(e.target.value);
              setFilterState("");
              setFilterCity("");
            }}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            <option value="">Filter by Country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* State filter */}
          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setFilterCity("");
            }}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            <option value="">Filter by State</option>
            {states
              .filter(
                (s) =>
                  !filterCountry ||
                  String(s.countryId) === String(filterCountry)
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>

          {/* City filter */}
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            <option value="">Filter by City</option>
            {cities
              .filter(
                (c) => !filterState || String(c.stateId) === String(filterState)
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <button
            onClick={() => {
              setFilterCountry("");
              setFilterState("");
              setFilterCity("");
            }}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
          >
            Clear Filters
          </button>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search locations..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded"
          >
            <Plus size={16} /> New Location
          </button>

          <button
            onClick={() => {
              setSearchText("");
              loadRows();
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <button
            onClick={openColumnPicker}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
  <div className="w-full overflow-x-auto">
    <table className="min-w-[1200px] text-left border-separate border-spacing-y-1 text-sm table-fixed">

      {/* Column widths */}
      <colgroup>
        {visibleColumns.id && <col className="w-[80px]" />}
        {visibleColumns.name && <col className="w-[220px]" />}
        {visibleColumns.country && <col className="w-[160px]" />}
        {visibleColumns.state && <col className="w-[160px]" />}
        {visibleColumns.city && <col className="w-[160px]" />}
        {visibleColumns.address && <col className="w-[200px]" />}
        {visibleColumns.latitude && <col className="w-[140px]" />}
        {visibleColumns.longitude && <col className="w-[140px]" />}
      </colgroup>

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
            <th className="pb-2 border-b border-white">Name</th>
          )}

          {visibleColumns.country && (
            <th className="pb-2 border-b border-white">Country</th>
          )}

          {visibleColumns.state && (
            <th className="pb-2 border-b border-white">State</th>
          )}

          {visibleColumns.city && (
            <th className="pb-2 border-b border-white">City</th>
          )}

          {visibleColumns.address && (
            <th className="pb-2 border-b border-white">Address</th>
          )}

          {visibleColumns.latitude && (
            <th className="pb-2 border-b border-white">Lat</th>
          )}

          {visibleColumns.longitude && (
            <th className="pb-2 border-b border-white">Long</th>
          )}
        </tr>
      </thead>

      {/* BODY */}
      <tbody className="text-center">

        {sortedRows.length === 0 && (
          <tr>
            <td
              colSpan={Object.values(visibleColumns).filter(Boolean).length}
              className="px-4 py-6 text-center text-gray-400"
            >
              No records found
            </td>
          </tr>
        )}

        {sortedRows.map((row) => (
          <tr
            key={row.id}
            className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
            onClick={() => openEdit(row)}
          >
            {visibleColumns.id && (
              <td className="px-2 py-3">{row.id}</td>
            )}

            {visibleColumns.name && (
              <td className="px-2 py-3">{row.name}</td>
            )}

            {visibleColumns.country && (
              <td className="px-2 py-3">{row.countryName}</td>
            )}

            {visibleColumns.state && (
              <td className="px-2 py-3">{row.stateName}</td>
            )}

            {visibleColumns.city && (
              <td className="px-2 py-3">{row.cityName}</td>
            )}

            {visibleColumns.address && (
              <td className="px-2 py-3">{row.address}</td>
            )}

            {visibleColumns.latitude && (
              <td className="px-2 py-3">{row.latitude}</td>
            )}

            {visibleColumns.longitude && (
              <td className="px-2 py-3">{row.longitude}</td>
            )}
          </tr>
        ))}

      </tbody>
    </table>
  </div>
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

          <span>
            Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b>{" "}
            of <b>{totalRecords}</b> records
          </span>
        </div>
      </div>
    </>
  );
};

export default Locations;
