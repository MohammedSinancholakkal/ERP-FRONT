import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  Star,
  Pencil,
} from "lucide-react";
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
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

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

  const loadCities = async (forceRefresh = false) => {
    // Context handles caching if not searching
    const { data, total } = await loadCitiesCtx(page, limit, searchText, forceRefresh);
    setCities(data || []);
    setTotalRecords(total || 0);
  };

  // INACTIVE loaders
  const loadInactiveCities = async () => {
     const data = await loadInactiveCtx();
     setInactiveCities(data || []);
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
    if (!newCity.name?.trim() || !newCity.countryId || !newCity.stateId) {
      return toast.error("All fields are required");
    }

    // Check Duplicates
    try {
        const searchRes = await searchCityApi(newCity.name.trim());
        if (searchRes?.status === 200) {
            const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
            const existing = rows.find(r => 
                (r.Name || r.name).toLowerCase() === newCity.name.trim().toLowerCase() && 
                String(r.StateId || r.stateId) === String(newCity.stateId)
            );
            if (existing) return toast.error("City with this name already exists in selected state");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
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
        // refreshCities();
        loadCities(true);
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

     // Check Duplicates
     try {
        const searchRes = await searchCityApi(name.trim());
        if (searchRes?.status === 200) {
            const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
            const existing = rows.find(r => 
                (r.Name || r.name).toLowerCase() === name.trim().toLowerCase() && 
                String(r.StateId || r.stateId) === String(stateId) &&
                (r.Id || r.id) !== id
            );
            if (existing) return toast.error("City with this name already exists in selected state");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

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
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("UPDATE CITY ERROR:", err);
      toast.error("Server error");
    }
  };

  // ========== DELETE CITY ==========
  const handleDeleteCity = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const id = editCity.id;
        try {
          const res = await deleteCityApi(id, { userId: currentUserId });
          if (res?.status === 200) {
            toast.success("City deleted");
            setEditModalOpen(false);
    
            // refreshCities();
            loadCities(true);
          } else {
            toast.error(res?.data?.message || "Delete failed");
          }
        } catch (err) {
          console.error("DELETE CITY ERROR:", err);
          toast.error("Server error");
        }
      }
    });
  };

  // ========== RESTORE CITY ==========
  const handleRestoreCity = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to restore this city?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restore it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await restoreCityApi(editCity.id, { userId: currentUserId });
          if (res?.status === 200) {
            toast.success("City restored");
            setEditModalOpen(false);
            // refreshCities();
            await loadCities(true);
            refreshInactiveCities();
            await loadInactiveCities();
          } else {
            toast.error("Restore failed");
          }
        } catch (err) {
          console.error("RESTORE CITY ERROR:", err);
          toast.error("Server error");
        }
      }
    }); 
  };

  // ========== COUNTRY / STATE create helpers ==========
  // create country and return created object (uses search fallback)
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

  // ========== STAR / MODAL SAVES — call callbacks if present ==========
  const handleAddCountryModalSave = async () => {
    const name = countryFormName.trim();
    if (!name) return toast.error("Country name required");
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
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-[calc(100vh-113px)] overflow-hidden">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Cities</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-1 mb-4">
              <div className={`flex items-center px-2 py-1.5 w-full sm:w-60 rounded border ${theme === 'emerald' ? 'bg-gray-100 border-emerald-500' : 'bg-gray-700 border-gray-600'}`}>
                <Search size={16} className={theme === 'emerald' ? 'text-gray-500' : 'text-gray-300'} />
                <input 
                  className={`bg-transparent pl-2 w-full text-sm outline-none ${theme === 'emerald' ? 'text-gray-900 placeholder-gray-500' : 'text-gray-200 placeholder-gray-500'}`} 
                  placeholder="search..." 
                  value={searchText} 
                  onChange={(e) => handleSearch(e.target.value)} 
                />
              </div>

              {hasPermission(PERMISSIONS.CITIES.CREATE) && (
              <button 
                onClick={openAddModal} 
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-sm ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <Plus size={16} /> New City
              </button>
              )}

              <button 
                onClick={() => { setSearchText(""); setPage(1); loadCities(); }} 
                className={`p-1.5 border rounded ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`} 
                aria-label="Refresh"
              >
                <RefreshCw size={16} className={theme === 'emerald' ? 'text-white' : 'text-blue-400'} />
              </button>

              <button 
                onClick={() => setColumnModal(true)} 
                className={`p-1.5 border rounded ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`} 
                aria-label="Columns"
              >
                <List size={16} className={theme === 'emerald' ? 'text-white' : 'text-blue-300'} />
              </button>

              <button 
                onClick={async () => { if (!showInactive) await loadInactiveCities(); setShowInactive(!showInactive); }} 
                className={`flex items-center gap-1 px-3 py-1.5 border rounded text-sm ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <ArchiveRestore size={16} className={theme === 'emerald' ? 'text-white' : 'text-yellow-300'} />
                {showInactive ? "Hide Inactive" : "Inactive"}
              </button>
            </div>

            {/* TABLE */}
            <MasterTable
              columns={tableColumns}
              data={sortedCities}
              inactiveData={inactiveCities}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(item, isInactive) => openEditModal({ ...item, isInactive })}
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
                loadCities();
              }}
            />
        </div>
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
                  <label className="text-sm">Name *</label>
                  <input
                    type="text"
                    value={newCity.name}
                    onChange={(e) => setNewCity((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
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
                    <button type="button" className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition" onClick={() => { setCountryFormName(""); setCountryModalCallback(null); setAddCountryModalOpen(true); }}>
                      <Star size={18} className="text-yellow-400" />
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
                      className={`p-2 rounded-lg border border-gray-600 bg-gray-800 transition ${!newCity.countryId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                      onClick={() => { setStateFormName(""); setStateModalCallback(null); setAddStateModalOpen(true); }}
                      disabled={!newCity.countryId}
                    >
                      <Star size={18} className="text-yellow-400" />
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
                  <label className="text-sm">Name *</label>
                  <input type="text" value={editCity.name} onChange={(e) => setEditCity((p) => ({ ...p, name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
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
                        className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
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
                        className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                        onClick={() => { setCountryFormName(""); setCountryModalCallback(null); setAddCountryModalOpen(true); }}
                    >
                        <Star size={18} className="text-yellow-400" />
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
                        className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
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
                        className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                        onClick={() => { setStateFormName(""); setStateModalCallback(null); setAddStateModalOpen(true); }}
                    >
                        <Star size={18} className="text-yellow-400" />
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
          zIndex={60}
          saveText="Add"
       >
          <div>
            <label className="block text-sm mb-1">Country Name</label>
            <input value={countryFormName} onChange={(e) => setCountryFormName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
       </AddModal>

    {/* EDIT COUNTRY MODAL (PENCIL) */}
       <AddModal
          isOpen={editCountryModalOpen}
          onClose={() => setEditCountryModalOpen(false)}
          onSave={handleEditCountryModalSave}
          title={`Edit Country (${countryEditData.name})`}
          zIndex={60}
          saveText="Save"
       >
          <div>
            <label className="block text-sm mb-1">Country Name</label>
            <input value={countryEditData.name} onChange={(e) => setCountryEditData((p) => ({ ...p, name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
       </AddModal>

    {/* ADD STATE MODAL (STAR) */}
       <AddModal
          isOpen={addStateModalOpen}
          onClose={() => { setAddStateModalOpen(false); setStateModalCallback(null); }}
          onSave={() => handleAddStateModalSave(newCity.countryId || editCity.countryId)}
          title="Create State"
          zIndex={60}
          saveText="Add"
       >
          <div>
            <label className="block text-sm mb-1">State Name</label>
            <input value={stateFormName} onChange={(e) => setStateFormName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400 mt-2">State will be created for the currently selected country.</p>
          </div>
       </AddModal>

    {/* EDIT STATE MODAL (PENCIL) */}
       <AddModal
          isOpen={editStateModalOpen}
          onClose={() => setEditStateModalOpen(false)}
          onSave={handleEditStateModalSave}
          title={`Edit State (${stateEditData.name})`}
          zIndex={60}
          saveText="Save"
       >
          <div>
            <label className="block text-sm mb-1">State Name</label>
            <input value={stateEditData.name} onChange={(e) => setStateEditData((p) => ({ ...p, name: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" />
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
