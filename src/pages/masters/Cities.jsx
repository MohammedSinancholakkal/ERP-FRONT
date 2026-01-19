import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

// Services
import {
  getCountriesApi,
  getStatesByCountryApi,
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
  restoreCityApi,
  getCitiesApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ContentCard from "../../components/ContentCard";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";
import { Pencil, Star } from "lucide-react";

const Cities = () => {
  const { theme } = useTheme();
  const { 
      loadCities: loadCitiesCtx,
      loadInactiveCities: loadInactiveCtx,
      refreshInactiveCities 
  } = useMasters();

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
  // const [searchColumn, setSearchColumn] = useState(""); // Moved to Modal

  // ---------- search ----------
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ---------- dropdown/search helpers ----------
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

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  // Client-side sort logic removed
  const sortedCities = cities;

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

  // Add helper
  const capitalize = (str) => {
    if (typeof str !== 'string' || !str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const loadCities = async () => {
    try {
        const res = await getCitiesApi(page, limit, sortConfig.key, sortConfig.direction);
        if (res?.status === 200) {
            const rows = res.data.records || res.data || [];
            const normalized = rows.map(c => ({
                ...c,
                name: capitalize(c.name)
            }));
            setCities(normalized);
            setTotalRecords(res.data.total || rows.length || 0);
        }
    } catch(err) {
        console.error(err);
    }
  };

  // INACTIVE loaders
  const loadInactiveCities = async () => {
     const data = await loadInactiveCtx();
     const normalized = (data || []).map(c => ({
        ...c,
        name: capitalize(c.name)
    }));
     setInactiveCities(normalized);
  };

  useEffect(() => {
    loadCountries();
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortConfig]);

  // ========== SEARCH HANDLER ==========
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      // reload default
      const { data, total } = await loadCitiesCtx(1, limit, "");
      setCities(data || []);
      setTotalRecords(total || 0);
      return;
    }
    const { data, total } = await loadCitiesCtx(1, limit, value);
    setCities(data || []);
    setTotalRecords(total || 0);
  };

  // ========== ADD CITY ==========
  const handleAddCity = async () => {
    // VALIDATIONS
    if (!newCity.name?.trim() || !newCity.countryId || !newCity.stateId) {
      return toast.error("All fields are required");
    }
    const nameToCheck = newCity.name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 20) return toast.error("Name must be at most 20 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

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
        // refreshCities();
        loadCities(true);
      } else {
        if (res?.status === 409) {
            toast.error(res?.data?.message || "City already exists");
        } else {
            toast.error(res?.data?.message || "Add failed");
        }
      }
    } catch (err) {
      console.error("ADD CITY ERROR:", err);
      toast.error("Server error");
    }
  };

  const openAddModal = () => {
    setNewCity({ name: "", countryId: "", stateId: "" });
    setStates([]);
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
    setEditModalOpen(true);
  };

  // ========== UPDATE CITY ==========
  const handleUpdateCity = async () => {
    const { id, name, countryId, stateId } = editCity;
    if (!name?.trim() || !countryId || !stateId)
      return toast.error("All fields are required");

    // VALIDATIONS
    const nameToCheck = name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 20) return toast.error("Name must be at most 20 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

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
        // refreshCities();
        loadCities(true);
      } else {
        if (res?.status === 409) {
             toast.error(res?.data?.message || "City already exists");
        } else {
             toast.error(res?.data?.message || "Update failed");
        }
      }
    } catch (err) {
      console.error("UPDATE CITY ERROR:", err);
      toast.error("Server error");
    }
  };

  // ========== DELETE CITY ==========
  const handleDeleteCity = async () => {
    const result = await showDeleteConfirm();

    if (result.isConfirmed) {
      const id = editCity.id;
      try {
        const res = await deleteCityApi(id, { userId: currentUserId });
        if (res?.status === 200) {
          showSuccessToast("City deleted");
          setEditModalOpen(false);
  
          // refreshCities();
          loadCities(true);
        } else {
          showErrorToast(res?.data?.message || "Delete failed");
        }
      } catch (err) {
        console.error("DELETE CITY ERROR:", err);
        showErrorToast("Server error");
      }
    }
  };

  // ========== RESTORE CITY ==========
  const handleRestoreCity = async () => {
    const result = await showRestoreConfirm();

    if (result.isConfirmed) {
      try {
        const res = await restoreCityApi(editCity.id, { userId: currentUserId });
        if (res?.status === 200) {
          showSuccessToast("City restored");
          setEditModalOpen(false);
          // refreshCities();
          await loadCities(true);
          refreshInactiveCities();
          await loadInactiveCities();
        } else {
          showErrorToast("Restore failed");
        }
      } catch (err) {
        console.error("RESTORE CITY ERROR:", err);
        showErrorToast("Server error");
      }
    } 
  };

  // ========== COUNTRY / STATE create helpers ==========
  const createCountryAndReload = async (name) => {
    if (!name?.trim()) return null;

    // Check Duplicate
    try {
        const searchRes = await searchCountryApi(name.trim());
        if (searchRes?.status === 200) {
            const existing = (searchRes.data.records || searchRes.data || []).find(
            c => c.name.toLowerCase() === name.trim().toLowerCase()
            );
            if (existing) {
              toast.error("Country with this name already exists");
              return existing;
            }
        }
    } catch (err) {
         toast.error("Error checking duplicates");
         return null;
    }

    try {
      const res = await addCountryApi({ name: name.trim(), userId: currentUserId });
      if (res?.status === 200) {
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

  const createStateAndReload = async (name, countryId) => {
    if (!name?.trim() || !countryId) return null;
    
    // Check Duplicate
    try {
       const searchRes = await searchStateApi(name.trim());
       if (searchRes?.status === 200) {
          const rows = searchRes.data || [];
          const existing = rows.find(r => 
              (r.Name || r.name).toLowerCase() === name.trim().toLowerCase() && 
              String(r.CountryId || r.countryId) === String(countryId)
          );
          if (existing) {
             toast.error("State with this name already exists in selected country");
             return existing;
          }
       }
    } catch(err) {
        toast.error("Error checking duplicates");
        return null;
    }

    try {
      const res = await addStateApi({ name: name.trim(), countryId: Number(countryId), userId: currentUserId });
      if (res?.status === 200) {
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

  // ========== STAR / MODAL SAVES — call callbacks if present ==========
  const handleAddCountryModalSave = async () => {
    const name = countryFormName.trim();
    if (!name) return toast.error("Country name required");

    // VALIDATIONS
    if (name.length < 2) return toast.error("Name must be at least 2 characters");
    if (name.length > 20) return toast.error("Name must be at most 20 characters");
    if (!/^[a-zA-Z\s]+$/.test(name)) return toast.error("Name allows only characters");

    const created = await createCountryAndReload(name);
    if (created) {
      if (typeof countryModalCallback === "function") {
        try {
          countryModalCallback(created);
        } catch (e) {
          console.error("countryModalCallback error:", e);
        }
      }
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

    // VALIDATIONS
    if (name.length < 2) return toast.error("Name must be at least 2 characters");
    if (name.length > 20) return toast.error("Name must be at most 20 characters");
    if (!/^[a-zA-Z\s]+$/.test(name)) return toast.error("Name allows only characters");

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
    
    // VALIDATIONS
    const nameToCheck = name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 20) return toast.error("Name must be at most 20 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

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

    // VALIDATIONS
    const nameToCheck = name.trim();
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 20) return toast.error("Name must be at most 20 characters");
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");

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


  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.name && { key: "name", label: "Name", sortable: true },
    visibleColumns.country && { 
      key: "countryName", 
      label: "Country", 
      sortable: true,
      render: (c) => c.countryName ?? getCountryName(c.countryId)
    },
    visibleColumns.state && { 
      key: "stateName", 
      label: "State", 
      sortable: true,
      render: (c) => c.stateName ?? getStateName(c.stateId)
    },
  ].filter(Boolean);

  return (
    <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Cities</h2>
            <hr className="mb-4 border-gray-300" />

            {/* TABLE */}
            <MasterTable
              columns={tableColumns}
              data={sortedCities}
              inactiveData={inactiveCities}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(item, isInactive) => openEditModal({ ...item, isInactive })}
              // Action Bar Props
              search={searchText}
              onSearch={handleSearch}
              onCreate={openAddModal}
              createLabel="New City"
              permissionCreate={hasPermission(PERMISSIONS.CITIES.CREATE)}
              onRefresh={() => {
                setSearchText("");
                setPage(1);
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                loadCities();
              }}
              onColumnSelector={() => setColumnModal(true)}
              onToggleInactive={async () => {
                if (!showInactive) await loadInactiveCities();
                setShowInactive(!showInactive);
              }}
            />

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
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                loadCities();
              }}
            />
        </div>
          </ContentCard>
        </div>

    {/* ADD CITY MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => { setModalOpen(false); setStates([]); }}
         onSave={handleAddCity}
         title="New City"
       >
           <div className="space-y-4">
                <div>
                   <InputField
                     label="Name"
                     value={newCity.name}
                     onChange={(e) => setNewCity((p) => ({ ...p, name: e.target.value }))}
                     required
                   />
                </div>
               <div>
                  <label className="text-sm">Country *</label>
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
                    {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (
                    <button type="button"  className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`} onClick={() => { setCountryFormName(""); setCountryModalCallback(null); setAddCountryModalOpen(true); }}>
                      <Star size={16} />
                    </button>
                    )}
                  </div>
               </div>
               <div>
                  <label className="text-sm">State *</label>
                  <div className="flex items-center gap-2">
                    <SearchableSelect
                      options={states.map(s => ({ id: s.id, name: s.name }))}
                      value={newCity.stateId}
                      onChange={(val) => setNewCity((p) => ({ ...p, stateId: val }))}
                      placeholder="Select State"
                      disabled={!newCity.countryId}
                      className="w-full"
                      direction="up"
                    />
                    {hasPermission(PERMISSIONS.STATES.CREATE) && (
                    <button
                      type="button"
                     className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                      onClick={() => { setStateFormName(""); setStateModalCallback(null); setAddStateModalOpen(true); }}
                      disabled={!newCity.countryId}
                    >
                      <Star size={16} />
                    </button>
                    )}
                  </div>
               </div>
           </div>
       </AddModal>

    {/* EDIT CITY MODAL */}
       <EditModal
          isOpen={editModalOpen}
          onClose={() => { setEditModalOpen(false); setStates([]); }}
          onSave={handleUpdateCity}
          onDelete={handleDeleteCity}
          onRestore={handleRestoreCity}
          isInactive={editCity.isInactive}
          title={`Edit City (${editCity.name})`}
          permissionDelete={hasPermission(PERMISSIONS.CITIES.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.CITIES.EDIT)}
       >
           <div className="space-y-4">
               <div>
                   <InputField
                     label="Name"
                     value={editCity.name}
                     onChange={(e) => setEditCity((p) => ({ ...p, name: e.target.value }))}
                     disabled={editCity.isInactive}
                     required
                   />
               </div>
              <div>
                  <label className="text-sm">Country *</label>
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
                     {/* Edit Country Pencil */}
                     {editCity.countryId && (
                     <button
                        type="button"
                         className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        onClick={() => { 
                            setCountryEditData({ id: editCity.countryId, name: getCountryName(editCity.countryId) });
                            setEditCountryModalOpen(true); 
                        }}
                    >
                        <Pencil size={16} className="text-blue-400" />
                    </button>
                     )}
                     {/* Add Country Star */}
                    {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (
                    <button
                        type="button"
                       className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        onClick={() => { setCountryFormName(""); setCountryModalCallback(null); setAddCountryModalOpen(true); }}
                    >
                        <Star size={16} />
                    </button>
                    )}
                  </div>
              </div>
              <div>
                  <label className="text-sm">State *</label>
                  <div className="flex items-center gap-2">
                    <SearchableSelect
                      options={states.map(s => ({ id: s.id, name: s.name }))}
                      value={editCity.stateId}
                      onChange={(val) => setEditCity((p) => ({ ...p, stateId: val }))}
                      placeholder="Select State"
                      className="w-full"
                      direction="up"
                    />
                     {/* Edit State Pencil */}
                     {editCity.stateId && (
                     <button
                        type="button"
                        className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        onClick={() => { 
                            setStateEditData({ id: editCity.stateId, name: getStateName(editCity.stateId), countryId: editCity.countryId });
                            setEditStateModalOpen(true); 
                        }}
                    >
                        <Pencil size={16} className="text-blue-400" />
                    </button>
                     )}
                    {/* Add State Star */}
                     {hasPermission(PERMISSIONS.STATES.CREATE) && (
                    <button
                        type="button"
                        className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        onClick={() => { setStateFormName(""); setStateModalCallback(null); setAddStateModalOpen(true); }}
                    >
                        <Star size={16} />
                    </button>
                     )}
                  </div>
              </div>
           </div>
       </EditModal>

    {/* ADD COUNTRY MODAL (STAR) */}
       <AddModal
          isOpen={addCountryModalOpen}
          onClose={() => { setAddCountryModalOpen(false); setCountryModalCallback(null); }}
          onSave={handleAddCountryModalSave}
          title="Create Country"
          zIndex={1100}
          saveText="Add"
       >
          <div>
            <label className="block text-sm mb-1">Country Name</label>
            <InputField value={countryFormName} onChange={(e) => setCountryFormName(e.target.value)} required />
          </div>
       </AddModal>

    {/* EDIT COUNTRY MODAL (PENCIL) */}
       <AddModal
          isOpen={editCountryModalOpen}
          onClose={() => setEditCountryModalOpen(false)}
          onSave={handleEditCountryModalSave}
          title={`Edit Country (${countryEditData.name})`}
          zIndex={1100}
          saveText="Save"
       >
          <div>
            <label className="block text-sm mb-1">Country Name</label>
            <InputField value={countryEditData.name} onChange={(e) => setCountryEditData((p) => ({ ...p, name: e.target.value }))} required />
          </div>
       </AddModal>

    {/* ADD STATE MODAL (STAR) */}
       <AddModal
          isOpen={addStateModalOpen}
          onClose={() => { setAddStateModalOpen(false); setStateModalCallback(null); }}
          onSave={() => handleAddStateModalSave(newCity.countryId || editCity.countryId)}
          title="Create State"
          zIndex={1100}
          saveText="Add"
       >
          <div>
            <label className="block text-sm mb-1">State Name</label>
            <InputField value={stateFormName} onChange={(e) => setStateFormName(e.target.value)} required />
            <p className="text-xs text-gray-400 mt-2">State will be created for the currently selected country.</p>
          </div>
       </AddModal>

    {/* EDIT STATE MODAL (PENCIL) */}
       <AddModal
          isOpen={editStateModalOpen}
          onClose={() => setEditStateModalOpen(false)}
          onSave={handleEditStateModalSave}
          title={`Edit State (${stateEditData.name})`}
          zIndex={1100}
          saveText="Save"
       >
          <div>
            <label className="block text-sm mb-1">State Name</label>
            <InputField value={stateEditData.name} onChange={(e) => setStateEditData((p) => ({ ...p, name: e.target.value }))} required />
          </div>
       </AddModal>

    {/* COLUMN PICKER MODAL */}
       <ColumnPickerModal
          isOpen={columnModal}
          onClose={() => setColumnModal(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
       />

    </PageLayout>
  );
};

export default Cities;

