// src/pages/masters/Locations.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
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
  // new
  getInactiveLocationsApi,
  restoreLocationApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";

const Locations = () => {
  // ================================
  // UI STATES
  // ================================
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Data
  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  // Filters (searchable)
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");

  // Dropdowns (arrays)
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // searchable dropdown helpers for add/edit/filter
  const [countryDropdownOpenAdd, setCountryDropdownOpenAdd] = useState(false);
  const [countryDropdownOpenEdit, setCountryDropdownOpenEdit] = useState(false);
  const [countryDropdownOpenFilter, setCountryDropdownOpenFilter] =
    useState(false);
  const [countrySearchAdd, setCountrySearchAdd] = useState("");
  const [countrySearchEdit, setCountrySearchEdit] = useState("");
  const [countrySearchFilter, setCountrySearchFilter] = useState("");
  const countryAddRef = useRef(null);
  const countryEditRef = useRef(null);
  const filterCountryRef = useRef(null);

  const [stateDropdownOpenAdd, setStateDropdownOpenAdd] = useState(false);
  const [stateDropdownOpenEdit, setStateDropdownOpenEdit] = useState(false);
  const [stateDropdownOpenFilter, setStateDropdownOpenFilter] =
    useState(false);
  const [stateSearchAdd, setStateSearchAdd] = useState("");
  const [stateSearchEdit, setStateSearchEdit] = useState("");
  const [stateSearchFilter, setStateSearchFilter] = useState("");
  const stateAddRef = useRef(null);
  const stateEditRef = useRef(null);
  const filterStateRef = useRef(null);

  const [cityDropdownOpenAdd, setCityDropdownOpenAdd] = useState(false);
  const [cityDropdownOpenEdit, setCityDropdownOpenEdit] = useState(false);
  const [cityDropdownOpenFilter, setCityDropdownOpenFilter] =
    useState(false);
  const [citySearchAdd, setCitySearchAdd] = useState("");
  const [citySearchEdit, setCitySearchEdit] = useState("");
  const [citySearchFilter, setCitySearchFilter] = useState("");
  const cityAddRef = useRef(null);
  const cityEditRef = useRef(null);
  const filterCityRef = useRef(null);

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

  // origins for modals: "add", "edit", "filter"
  const [countryModalOrigin, setCountryModalOrigin] = useState(null);
  const [stateModalOrigin, setStateModalOrigin] = useState(null);
  const [cityModalOrigin, setCityModalOrigin] = useState(null);

  // close dropdowns on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (countryAddRef.current && !countryAddRef.current.contains(e.target)) {
        setCountryDropdownOpenAdd(false);
      }
      if (
        countryEditRef.current &&
        !countryEditRef.current.contains(e.target)
      ) {
        setCountryDropdownOpenEdit(false);
      }
      if (
        filterCountryRef.current &&
        !filterCountryRef.current.contains(e.target)
      ) {
        setCountryDropdownOpenFilter(false);
      }

      if (stateAddRef.current && !stateAddRef.current.contains(e.target)) {
        setStateDropdownOpenAdd(false);
      }
      if (stateEditRef.current && !stateEditRef.current.contains(e.target)) {
        setStateDropdownOpenEdit(false);
      }
      if (
        filterStateRef.current &&
        !filterStateRef.current.contains(e.target)
      ) {
        setStateDropdownOpenFilter(false);
      }

      if (cityAddRef.current && !cityAddRef.current.contains(e.target)) {
        setCityDropdownOpenAdd(false);
      }
      if (cityEditRef.current && !cityEditRef.current.contains(e.target)) {
        setCityDropdownOpenEdit(false);
      }
      if (filterCityRef.current && !filterCityRef.current.contains(e.target)) {
        setCityDropdownOpenFilter(false);
      }
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // User
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ================================
  // ADD & EDIT FORM STATES
  // ================================
  const [newItem, setNewItem] = useState({
    name: "",
    countryId: "",
    stateId: "",
    cityId: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    countryId: "",
    stateId: "",
    cityId: "",
    address: "",
    latitude: "",
    longitude: "",
    isInactive: false,
  });

  // ================================
  // COLUMN PICKER
  // ================================
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

  // ================================
  // PAGINATION
  // ================================
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // ================================
  // Filtering (client-side)
  // ================================
  const filteredRows = rows.filter((r) => {
    let valid = true;
    if (filterCountry)
      valid = valid && String(r.countryId) === String(filterCountry);
    if (filterState) valid = valid && String(r.stateId) === String(filterState);
    if (filterCity) valid = valid && String(r.cityId) === String(filterCity);
    return valid;
  });

  const [sortOrder, setSortOrder] = useState("asc");

  const sortedRows = useMemo(() => {
    const arr = [...filteredRows];

    if (sortOrder === "asc") {
      arr.sort((a, b) => Number(a.id) - Number(b.id));
    }

    return arr;
  }, [filteredRows, sortOrder]);

  // ================================
  // LOADERS (Countries/States/Cities)
  // robust to different API shapes
  // ================================
  const parseArrayFromResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.records) return res.data.records;
    if (res.records) return res.records;
    const maybeArray = Object.values(res).find((v) => Array.isArray(v));
    return Array.isArray(maybeArray) ? maybeArray : [];
  };

  const loadCountries = async () => {
    try {
      const res = await getCountriesApi(1, 5000);
      const arr = parseArrayFromResponse(res);
      setCountries(arr);
      return arr;
    } catch (err) {
      console.error("loadCountries error", err);
      toast.error("Failed to load countries");
      setCountries([]);
      return [];
    }
  };

  const loadStates = async () => {
    try {
      const res = await getStatesApi(1, 5000);
      const arr = parseArrayFromResponse(res);
      setStates(arr);
      return arr;
    } catch (err) {
      console.error("loadStates error", err);
      toast.error("Failed to load states");
      setStates([]);
      return [];
    }
  };

  const loadCities = async () => {
    try {
      const res = await getCitiesApi(1, 5000);
      const arr = parseArrayFromResponse(res);
      setCities(arr);
      return arr;
    } catch (err) {
      console.error("loadCities error", err);
      toast.error("Failed to load cities");
      setCities([]);
      return [];
    }
  };

  // convenience: load states for a country asynchronously (when user selects country)
  const awaitLoadStatesForCountry = async (countryId) => {
    await loadStates();
  };

  const awaitLoadCitiesForState = async (stateId) => {
    await loadCities();
  };

  // ================================
  // LOAD LOCATION ROWS
  // ================================
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

  const loadInactiveRows = async () => {
    try {
      const res = await getInactiveLocationsApi();
      if (res?.status === 200) {
        const data = res.data ?? res;
        const items = Array.isArray(data) ? data : data.records ?? [];
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
        setInactiveRows(normalized);
      } else {
        toast.error("Failed to load inactive locations");
      }
    } catch (err) {
      console.error("loadInactiveRows error", err);
      toast.error("Failed to load inactive locations");
    }
  };

  // Initial load
  useEffect(() => {
    (async () => {
      await loadCountries();
      await loadStates();
      await loadCities();
      await loadRows();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // load inactive when toggled on
  useEffect(() => {
    if (showInactive) loadInactiveRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  // ================================
  // SEARCH
  // ================================
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
      }
    } catch (err) {
      console.error("searchLocation error", err);
      toast.error("Search failed");
    }
  };

  // ================================
  // ADD / UPDATE / DELETE / RESTORE
  // ================================
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
        loadRows();
      } else {
        toast.error(res?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("addLocation error", err);
      toast.error("Add failed");
    }
  };

  const openEdit = (row, inactive = false) => {
    setEditItem({
      id: row.id,
      name: row.name,
      countryId: row.countryId,
      stateId: row.stateId,
      cityId: row.cityId,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      isInactive: !!inactive,
    });

    // prefill the search inputs shown in the edit modal
    setCountrySearchEdit(row.countryName || "");
    setStateSearchEdit(row.stateName || "");
    setCitySearchEdit(row.cityName || "");

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
        loadRows();
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
        loadRows();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("deleteLocation error", err);
      toast.error("Delete failed");
    }
  };

  const handleRestore = async () => {
    try {
      const res = await restoreLocationApi(editItem.id, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadRows();
        loadInactiveRows();
        setShowInactive(false);
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error("handleRestore error", err);
      toast.error("Restore failed");
    }
  };

  // ================================
  // Country / State / City CRUD helpers
  // ================================

  // --- Countries ---
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
        const found = list.find(
          (c) => String(c.name).toLowerCase() === name.trim().toLowerCase()
        );
        return found || null;
      } else {
        toast.error("Failed to create country");
      }
    } catch (err) {
      console.error("addCountry error", err);
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
      console.error("updateCountry error", err);
      toast.error("Failed to update country");
    }
    return false;
  };

  // open add-country modal from dropdown suggestion (origin indicates where it was opened)
  const openAddCountryModalFromDropdown = (origin, typed = "") => {
    setCountryFormName(typed);
    setCountryModalOrigin(origin); // "add" | "edit" | "filter"
    setAddCountryModalOpen(true);
  };

  // --- States ---
  const handleAddState = async (name, countryId) => {
    if (!name?.trim() || !countryId) return null;
    try {
      const payload = { name: name.trim(), countryId, userId: currentUserId };
      const res = await addStateApi(payload);
      if (res?.status === 200 || res?.status === 201) {
        toast.success("State created");
        const list = await loadStates();
        const found = list.find(
          (s) =>
            String(s.name).toLowerCase() === name.trim().toLowerCase() &&
            String(s.countryId) === String(countryId)
        );
        return found || null;
      } else {
        toast.error("Failed to create state");
      }
    } catch (err) {
      console.error("addState error", err);
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
        return true;
      } else {
        toast.error("Failed to update state");
      }
    } catch (err) {
      console.error("updateState error", err);
      toast.error("Failed to update state");
    }
    return false;
  };

  const openAddStateModalFromDropdown = (origin, typed = "", countryIdForModal = "") => {
    setStateFormName(typed);
    setStateModalOrigin(origin);
    setStateEditData((p) => ({
      ...p,
      countryId: countryIdForModal || p.countryId || "",
    }));
    setAddStateModalOpen(true);
  };

  // --- Cities ---
  const handleAddCity = async (name, countryId, stateId) => {
    if (!name?.trim() || !countryId || !stateId) return null;
    try {
      const payload = {
        name: name.trim(),
        countryId,
        stateId,
        userId: currentUserId,
      };
      const res = await addCityApi(payload);
      if (res?.status === 200 || res?.status === 201) {
        toast.success("City created");
        const list = await loadCities();
        const found = list.find(
          (c) =>
            String(c.name ?? c.CityName ?? c.cityName).toLowerCase() ===
              name.trim().toLowerCase() &&
            String(c.stateId ?? c.StateId) === String(stateId)
        );
        return found || null;
      } else {
        toast.error("Failed to create city");
      }
    } catch (err) {
      console.error("addCity error", err);
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
        return true;
      } else {
        toast.error("Failed to update city");
      }
    } catch (err) {
      console.error("updateCity error", err);
      toast.error("Failed to update city");
    }
    return false;
  };

  const openAddCityModalFromDropdown = (
    origin,
    typed = "",
    countryIdForModal = "",
    stateIdForModal = ""
  ) => {
    setCityFormName(typed);
    setCityModalOrigin(origin);
    setCityEditData((p) => ({
      ...p,
      countryId: countryIdForModal || p.countryId || "",
      stateId: stateIdForModal || p.stateId || "",
    }));
    setAddCityModalOpen(true);
  };

  // add country modal save - preselect depending on origin
  const handleAddCountryModalSave = async () => {
    const name = countryFormName.trim();
    if (!name) return toast.error("Country name required");
    const created = await handleAddCountry(name);
    if (created) {
      if (countryModalOrigin === "add" || modalOpen) {
        setNewItem((p) => ({
          ...p,
          countryId: created.id ?? created.Id ?? created.countryId,
        }));
        await loadStates();
      } else if (countryModalOrigin === "edit") {
        setEditItem((p) => ({
          ...p,
          countryId: created.id ?? created.Id ?? created.countryId,
        }));
        await loadStates();
      } else if (countryModalOrigin === "filter") {
        setFilterCountry(created.id ?? created.Id ?? created.countryId);
        // reset dependent filters
        setFilterState("");
        setFilterCity("");
      }
      setAddCountryModalOpen(false);
      setCountryFormName("");
      setCountryModalOrigin(null);
    }
  };

  const handleEditCountryModalSave = async () => {
    const { id, name } = countryEditData;
    if (!id || !name.trim()) return toast.error("Invalid country details");
    const ok = await handleUpdateCountry(id, name);
    if (ok) setEditCountryModalOpen(false);
  };

  const handleAddStateModalSave = async () => {
    const name = stateFormName.trim();
    const countryId = stateEditData.countryId || "";
    if (!name) return toast.error("State name required");
    if (!countryId) return toast.error("Select country for state");
    const created = await handleAddState(name, countryId);
    if (created) {
      if (stateModalOrigin === "add" || modalOpen) {
        setNewItem((p) => ({
          ...p,
          stateId: created.id ?? created.Id ?? created.stateId,
        }));
        await loadCities();
      } else if (stateModalOrigin === "edit") {
        setEditItem((p) => ({
          ...p,
          stateId: created.id ?? created.Id ?? created.stateId,
        }));
        await loadCities();
      } else if (stateModalOrigin === "filter") {
        setFilterState(created.id ?? created.Id ?? created.stateId);
        setFilterCity("");
      }
      setAddStateModalOpen(false);
      setStateFormName("");
      setStateModalOrigin(null);
    }
  };

  const handleEditStateModalSave = async () => {
    const { id, name, countryId } = stateEditData;
    if (!id || !name.trim() || !countryId)
      return toast.error("Invalid state details");
    const ok = await handleUpdateState(id, name, countryId);
    if (ok) setEditStateModalOpen(false);
  };

  const handleAddCityModalSave = async () => {
    const name = cityFormName.trim();
    const { countryId, stateId } = cityEditData;
    if (!name) return toast.error("City name required");
    if (!countryId || !stateId)
      return toast.error("Select country & state for city");
    const created = await handleAddCity(name, countryId, stateId);
    if (created) {
      if (cityModalOrigin === "add" || modalOpen) {
        setNewItem((p) => ({
          ...p,
          cityId: created.id ?? created.Id ?? created.cityId,
        }));
      } else if (cityModalOrigin === "edit") {
        setEditItem((p) => ({
          ...p,
          cityId: created.id ?? created.Id ?? created.cityId,
        }));
      } else if (cityModalOrigin === "filter") {
        setFilterCity(created.id ?? created.Id ?? created.cityId);
      }
      setAddCityModalOpen(false);
      setCityFormName("");
      setCityModalOrigin(null);
    }
  };

  const handleEditCityModalSave = async () => {
    const { id, name, countryId, stateId } = cityEditData;
    if (!id || !name.trim() || !countryId || !stateId)
      return toast.error("Invalid city details");
    const ok = await handleUpdateCity(id, name, countryId, stateId);
    if (ok) setEditCityModalOpen(false);
  };

  // Inline create from add/edit dropdowns
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

  // ================================
  // Helper Getters
  // ================================
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

  // filtered lists for searchable dropdowns
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
  const filteredCountriesFilter = countries.filter((c) =>
    String(c.name ?? "")
      .toLowerCase()
      .includes(countrySearchFilter.toLowerCase())
  );

  const filteredStatesAdd = states
    .filter((s) =>
      newItem.countryId ? String(s.countryId) === String(newItem.countryId) : true
    )
    .filter((s) =>
      String(s.name ?? "")
        .toLowerCase()
        .includes(stateSearchAdd.toLowerCase())
    );

  const filteredStatesEdit = states
    .filter((s) =>
      editItem.countryId ? String(s.countryId) === String(editItem.countryId) : true
    )
    .filter((s) =>
      String(s.name ?? "")
        .toLowerCase()
        .includes(stateSearchEdit.toLowerCase())
    );

  const filteredStatesFilter = states
    .filter((s) =>
      filterCountry ? String(s.countryId) === String(filterCountry) : true
    )
    .filter((s) =>
      String(s.name ?? "")
        .toLowerCase()
        .includes(stateSearchFilter.toLowerCase())
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

  const filteredCitiesFilter = cities
    .filter((c) => (filterState ? String(c.stateId) === String(filterState) : true))
    .filter((c) =>
      String(c.name ?? "")
        .toLowerCase()
        .includes(citySearchFilter.toLowerCase())
    );

  // Column picker helpers
  const openColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(true);
  };

  // ================================
  // RENDER
  // ================================
  return (
    <>
      {/* ========================= ADD MODAL ========================= */}
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

              {/* Country (searchable + star modal) */}
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
                                awaitLoadStatesForCountry(c.id);
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
                              onClick={() =>
                                openAddCountryModalFromDropdown("add", countrySearchAdd)
                              }
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new country &quot;{countrySearchAdd}&quot; (open modal)
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
                      setCountryModalOrigin("add");
                      setAddCountryModalOpen(true);
                    }}
                  >
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>
              </div>

              {/* State (searchable + star modal) */}
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
                                awaitLoadCitiesForState(s.id);
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
                              onClick={() =>
                                openAddStateModalFromDropdown("add", stateSearchAdd, newItem.countryId)
                              }
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new state &quot;{stateSearchAdd}&quot; (open modal)
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
                      setStateModalOrigin("add");
                      setAddStateModalOpen(true);
                    }}
                  >
                    <Star size={18} className="text-yellow-400" />
                  </button>
                </div>
              </div>

              {/* City (searchable + star modal) */}
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
                              onClick={() =>
                                openAddCityModalFromDropdown("add", citySearchAdd, newItem.countryId, newItem.stateId)
                              }
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new city &quot;{citySearchAdd}&quot; (open modal)
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
                      setCityModalOrigin("add");
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

      {/* ========================= EDIT MODAL ========================= */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editItem.isInactive ? "Restore Location" : "Edit Location"}
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm">Name *</label>
                <input
                  className={`w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  value={editItem.name}
                  onChange={(e) =>
                    setEditItem({ ...editItem, name: e.target.value })
                  }
                  disabled={editItem.isInactive}
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
                      disabled={editItem.isInactive}
                    />

                    {countryDropdownOpenEdit && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredCountriesEdit.length > 0 ? (
                          filteredCountriesEdit.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setEditItem((p) => ({ ...p, countryId: c.id }));
                                setCountryDropdownOpenEdit(false);
                                setCountrySearchEdit("");
                                awaitLoadStatesForCountry(c.id);
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
                              onClick={() =>
                                openAddCountryModalFromDropdown("edit", countrySearchEdit)
                              }
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new country &quot;{countrySearchEdit}&quot; (open modal)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition ${
                      editItem.isInactive ? "opacity-50 cursor-not-allowed" : ""
                    }`}
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
                    disabled={editItem.isInactive}
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
                      disabled={editItem.isInactive}
                    />

                    {stateDropdownOpenEdit && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredStatesEdit.length > 0 ? (
                          filteredStatesEdit.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setEditItem((p) => ({ ...p, stateId: s.id }));
                                setStateDropdownOpenEdit(false);
                                setStateSearchEdit("");
                                awaitLoadCitiesForState(s.id);
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
                              onClick={() =>
                                openAddStateModalFromDropdown("edit", stateSearchEdit, editItem.countryId)
                              }
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new state &quot;{stateSearchEdit}&quot; (open modal)
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
                    disabled={editItem.isInactive}
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
                      disabled={editItem.isInactive}
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
                              onClick={() =>
                                openAddCityModalFromDropdown("edit", citySearchEdit, editItem.countryId, editItem.stateId)
                              }
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Create new city &quot;{citySearchEdit}&quot; (open modal)
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
                    disabled={editItem.isInactive}
                  >
                    <Pencil size={18} className="text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-sm">Address</label>
                <textarea
                  className={`w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  value={editItem.address}
                  onChange={(e) =>
                    setEditItem({ ...editItem, address: e.target.value })
                  }
                  disabled={editItem.isInactive}
                />
              </div>

              {/* Lat / Long */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Latitude</label>
                  <input
                    className={`w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                      editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    value={editItem.latitude}
                    onChange={(e) =>
                      setEditItem({ ...editItem, latitude: e.target.value })
                    }
                    disabled={editItem.isInactive}
                  />
                </div>

                <div>
                  <label className="text-sm">Longitude</label>
                  <input
                    className={`w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                      editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    value={editItem.longitude}
                    onChange={(e) =>
                      setEditItem({ ...editItem, longitude: e.target.value })
                    }
                    disabled={editItem.isInactive}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {editItem.isInactive ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>
                {!editItem.isInactive && (
                  <button
                    onClick={handleUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                  >
                    <Save size={16} /> Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================= ADD / EDIT COUNTRY MODALS ========================= */}
      {addCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Country</h2>
              <button
                onClick={() => {
                  setAddCountryModalOpen(false);
                  setCountryModalOrigin(null);
                  setCountryFormName("");
                }}
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

      {editCountryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Country ({countryEditData.name})</h2>
              <button onClick={() => setEditCountryModalOpen(false)} className="text-gray-300 hover:text-white">
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
                placeholder="Enter country name"
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

      {/* ========================= ADD / EDIT STATE MODALS ========================= */}
      {addStateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New State</h2>
              <button
                onClick={() => {
                  setAddStateModalOpen(false);
                  setStateModalOrigin(null);
                  setStateFormName("");
                }}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={stateFormName}
                onChange={(e) => setStateFormName(e.target.value)}
                placeholder="Enter state name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
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
                onClick={handleAddStateModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
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
              <h2 className="text-lg font-semibold">Edit State ({stateEditData.name})</h2>
              <button onClick={() => setEditStateModalOpen(false)} className="text-gray-303 hover:text-white">
                <X size={20} />
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
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
                onClick={handleEditStateModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= ADD / EDIT CITY MODALS ========================= */}
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
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
                onClick={handleAddCityModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
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
              <h2 className="text-lg font-semibold">Edit City ({cityEditData.name})</h2>
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
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
                onClick={handleEditCityModalSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= COLUMN PICKER ========================= */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
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
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
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

              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
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

      {/* ========================= MAIN PAGE ========================= */}
<PageLayout>

<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Locations</h2>

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
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Location
          </button>

          <button
            onClick={() => {
              setSearchText("");
              loadRows();
              if (showInactive) loadInactiveRows();
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

          {/* Active/Inactive toggle */}
          <button
            onClick={async () => {
              if (!showInactive) await loadInactiveRows();
              setShowInactive((s) => !s);
            }}
            className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-2 h-[35px]"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* FILTER BAR (searchable) */}
        <div className="flex flex-wrap gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
          {/* Country filter (searchable) */}
          <div className="relative w-48" ref={filterCountryRef}>
            <input
              type="text"
              value={countrySearchFilter || getCountryName(filterCountry) || countrySearchFilter}
              onChange={(e) => {
                setCountrySearchFilter(e.target.value);
                setCountryDropdownOpenFilter(true);
              }}
              onFocus={() => setCountryDropdownOpenFilter(true)}
              placeholder="Filter by Country..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            {countryDropdownOpenFilter && (
              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                {filteredCountriesFilter.length > 0 ? (
                  filteredCountriesFilter.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setFilterCountry(c.id);
                        setCountryDropdownOpenFilter(false);
                        setCountrySearchFilter("");
                        setFilterState("");
                        setFilterCity("");
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
                      onClick={() => {
                        setCountryFormName(countrySearchFilter);
                        setCountryModalOrigin("filter");
                        setAddCountryModalOpen(true);
                        setCountryDropdownOpenFilter(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                    >
                      Create new country &quot;{countrySearchFilter}&quot; (open modal)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* State filter */}
          <div className="relative w-48" ref={filterStateRef}>
            <input
              type="text"
              value={stateSearchFilter || getStateName(filterState) || stateSearchFilter}
              onChange={(e) => {
                setStateSearchFilter(e.target.value);
                setStateDropdownOpenFilter(true);
              }}
              onFocus={() => setStateDropdownOpenFilter(true)}
              placeholder="Filter by State..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            {stateDropdownOpenFilter && (
              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                {filteredStatesFilter.length > 0 ? (
                  filteredStatesFilter.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setFilterState(s.id);
                        setStateDropdownOpenFilter(false);
                        setStateSearchFilter("");
                        setFilterCity("");
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
                      onClick={() => {
                        setStateFormName(stateSearchFilter);
                        setStateEditData((p) => ({
                          ...p,
                          countryId: filterCountry || "",
                        }));
                        setStateModalOrigin("filter");
                        setAddStateModalOpen(true);
                        setStateDropdownOpenFilter(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                    >
                      Create new state &quot;{stateSearchFilter}&quot; (open modal)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* City filter */}
          <div className="relative w-48" ref={filterCityRef}>
            <input
              type="text"
              value={citySearchFilter || getCityName(filterCity) || citySearchFilter}
              onChange={(e) => {
                setCitySearchFilter(e.target.value);
                setCityDropdownOpenFilter(true);
              }}
              onFocus={() => setCityDropdownOpenFilter(true)}
              placeholder="Filter by City..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            {cityDropdownOpenFilter && (
              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                {filteredCitiesFilter.length > 0 ? (
                  filteredCitiesFilter.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setFilterCity(c.id);
                        setCityDropdownOpenFilter(false);
                        setCitySearchFilter("");
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
                      onClick={() => {
                        setCityFormName(citySearchFilter);
                        setCityEditData((p) => ({
                          ...p,
                          countryId: filterCountry || "",
                          stateId: filterState || "",
                        }));
                        setCityModalOrigin("filter");
                        setAddCityModalOpen(true);
                        setCityDropdownOpenFilter(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                    >
                      Create new city &quot;{citySearchFilter}&quot; (open modal)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
          <div className="w-full overflow-x-auto">
            <table className="w-[1200px] table-fixed border-separate border-spacing-y-1 text-sm">
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
                {/* No records at all */}
                {sortedRows.length === 0 && inactiveRows.length === 0 && (
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
                {sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    onClick={() => openEdit(row, false)}
                  >
                    {visibleColumns.id && <td className="px-2 py-3">{row.id}</td>}
                    {visibleColumns.name && <td className="px-2 py-3">{row.name}</td>}
                    {visibleColumns.country && <td className="px-2 py-3">{row.countryName}</td>}
                    {visibleColumns.state && <td className="px-2 py-3">{row.stateName}</td>}
                    {visibleColumns.city && <td className="px-2 py-3">{row.cityName}</td>}
                    {visibleColumns.address && <td className="px-2 py-3">{row.address}</td>}
                    {visibleColumns.latitude && <td className="px-2 py-3">{row.latitude}</td>}
                    {visibleColumns.longitude && <td className="px-2 py-3">{row.longitude}</td>}
                  </tr>
                ))}

                {/* INACTIVE ROWS (inside same table) */}
                {showInactive &&
                  inactiveRows.map((row) => (
                    <tr
                      key={`inactive-${row.id}`}
                      className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                      onClick={() => openEdit(row, true)}
                    >
                      {visibleColumns.id && <td className="px-2 py-3">{row.id}</td>}
                      {visibleColumns.name && <td className="px-2 py-3">{row.name}</td>}
                      {visibleColumns.country && <td className="px-2 py-3">{row.countryName}</td>}
                      {visibleColumns.state && <td className="px-2 py-3">{row.stateName}</td>}
                      {visibleColumns.city && <td className="px-2 py-3">{row.cityName}</td>}
                      {visibleColumns.address && <td className="px-2 py-3">{row.address}</td>}
                      {visibleColumns.latitude && <td className="px-2 py-3">{row.latitude}</td>}
                      {visibleColumns.longitude && <td className="px-2 py-3">{row.longitude}</td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
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

export default Locations;
