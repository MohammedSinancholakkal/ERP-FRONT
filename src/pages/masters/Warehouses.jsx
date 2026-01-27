import React, { useState, useEffect } from "react";
import {
  Pencil,
  Star,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  addWarehouseApi,
  getWarehousesApi,
  updateWarehouseApi,
  deleteWarehouseApi,
  searchWarehouseApi,
  getInactiveWarehousesApi,
  restoreWarehouseApi,
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  addCountryApi,
  addStateApi,
  addCityApi,
  searchCountryApi,
  searchStateApi,
  searchCityApi,
  updateCountryApi,
  updateStateApi,
  updateCityApi,
} from "../../services/allAPI"; 
import SearchableSelect from "../../components/SearchableSelect"; 
import FilterBar from "../../components/FilterBar";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions"; 
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";
import MasterTable from "../../components/MasterTable"; 
import ContentCard from "../../components/ContentCard"; 

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";

const Warehouses = () => {
  const { theme } = useTheme();
  const { 
    refreshWarehouses: refreshCtx, 
    refreshInactiveWarehouses: refreshInactiveCtx 
  } = useMasters();
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // Dropdown data
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // FILTERS
  const [filters, setFilters] = useState({
    countryId: "",
    stateId: "",
    cityId: ""
  });

  const [newData, setNewData] = useState({ 
    name: "", 
    description: "",
    countryId: "",
    stateId: "",
    cityId: "",
    phone: "",
    address: ""
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    description: "",
    countryId: "",
    stateId: "",
    cityId: "",
    phone: "",
    address: "",
    isInactive: false,
  });

  // QUICK ADD MODAL STATES
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");

  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [newStateName, setNewStateName] = useState("");

  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");

  // NESTED EDIT STATES
  const [editCountryModalOpen, setEditCountryModalOpen] = useState(false);
  const [countryEditData, setCountryEditData] = useState({ id: null, name: "" });

  const [editStateModalOpen, setEditStateModalOpen] = useState(false);
  const [stateEditData, setStateEditData] = useState({ id: null, name: "" });

  const [editCityModalOpen, setEditCityModalOpen] = useState(false);
  const [cityEditData, setCityEditData] = useState({ id: null, name: "" });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId || 1;

  // SEARCH
  const [searchText, setSearchText] = useState("");

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
    country: true,
    state: true,
    city: true,
    phone: true,
    address: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  
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

  // REMOVED CLIENT SIDE SORT LOGIC
  const sortedRows = rows;

  // LOAD DROPDOWNS
  const loadDropdowns = async () => {
    try {
        const [resC, resS, resCi] = await Promise.all([
            getCountriesApi(1, 1000),
            getStatesApi(1, 1000),
            getCitiesApi(1, 1000)
        ]);
        
        if (resC?.status === 200) {
             const rows = resC.data.records || resC.data || [];
             setCountries(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name })));
        }
        if (resS?.status === 200) {
             const rows = resS.data.records || resS.data || [];
             setStates(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name, countryId: r.CountryId || r.countryId })));
        }
        if (resCi?.status === 200) {
             const rows = resCi.data.records || resCi.data || [];
             setCities(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name, stateId: r.StateId || r.stateId })));
        }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  // ===============================
  // Helpers
  // ===============================
  const capitalize = (str) => {
    if (typeof str !== 'string' || !str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const normalizeRows = (items = []) =>
    items.map((r) => ({
      id: r.Id || r.id,
      name: capitalize(r.Name || r.name),
      description: capitalize(r.Description || r.description),
      countryId: r.CountryId || r.countryId,
      countryName: capitalize(r.CountryName || r.countryName),
      stateId: r.StateId || r.stateId,
      stateName: capitalize(r.StateName || r.stateName),
      cityId: r.CityId || r.cityId,
      cityName: capitalize(r.CityName || r.cityName),
      phone: r.Phone || r.phone,
      address: capitalize(r.Address || r.address),
    }));

  // LOAD WAREHOUSES
  const loadRows = async () => {
    try {
      const res = await getWarehousesApi(page, limit, filters, sortConfig.key, sortConfig.direction);
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = normalizeRows(rows);
        setRows(normalized);
        const total = res.data.total || normalized.length;
        setTotalRecords(total);
      } else {
        toast.error("Failed to load warehouses");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load warehouses");
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit, filters, sortConfig]);

  const loadInactive = async () => {
    try {
      if (getInactiveWarehousesApi) {
          const res = await getInactiveWarehousesApi();
          if (res?.status === 200) {
            const rows = res.data.records || res.data || [];
            setInactiveRows(normalizeRows(rows));
          }
      }
    } catch (err) {
      console.error(err);
      // toast.error("Failed to load inactive");
    }
  };

  // Filter Bar Config
  const filterConfig = [
    {
      label: "Country",
      value: filters.countryId,
      options: countries,
      onChange: (val) => setFilters(prev => ({ ...prev, countryId: val, stateId: "", cityId: "" }))
    },
    {
      label: "State",
      value: filters.stateId,
      options: states.filter(s => !filters.countryId || s.countryId == filters.countryId),
      onChange: (val) => setFilters(prev => ({ ...prev, stateId: val, cityId: "" })),
    },
    {
      label: "City",
      value: filters.cityId,
      options: cities.filter(c => !filters.stateId || c.stateId == filters.stateId),
      onChange: (val) => setFilters(prev => ({ ...prev, cityId: val })),
    }
  ];

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
        setPage(1);
        return loadRows();
    }
    try {
      const res = await searchWarehouseApi(text);
      if (res?.status === 200) {
        const rows = res.data || [];
        setRows(normalizeRows(rows));
        setTotalRecords(rows.length);
      }
    } catch (err) {
        console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Name required");
    const nameToCheck = newData.name.trim();
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Name must be at most 50 characters");

    if (!newData.countryId) return toast.error("Country required");
    if (!newData.stateId) return toast.error("State required");
    if (!newData.cityId) return toast.error("City required");
    
    if (!newData.address?.trim()) return toast.error("Address is required");
    if (newData.address.length > 200) return toast.error("Address must be at most 200 characters");

    // Validate Phone
    if (!newData.phone?.trim()) return toast.error("Phone number is required");
    if (!/^\d{10}$/.test(newData.phone.trim())) return toast.error("Phone number must be exactly 10 digits");

    
    // Check for duplicates
    try {
        const searchRes = await searchWarehouseApi(newData.name.trim());
        if (searchRes?.status === 200) {
             const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
             const existing = rows.find(r => 
                (r.Name || r.name || "").toLowerCase() === newData.name.trim().toLowerCase()
             );
             if (existing) return toast.error("Warehouse with this name already exists");
        }
    } catch (err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    try {
      const res = await addWarehouseApi({ ...newData, userId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Added");
        setNewData({ 
            name: "", 
            description: "",
            countryId: "",
            stateId: "",
            cityId: "",
            phone: "",
            address: "" 
        });
        setModalOpen(false);
        setPage(1); 
        loadRows();
      } else {
        toast.error("Failed to add");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const openEdit = (row, inactive = false) => {
      setEditData({
        id: row.id,
        name: row.name,
        description: row.description,
        countryId: row.countryId,
        stateId: row.stateId,
        cityId: row.cityId,
        phone: row.phone,
        address: row.address,
        isInactive: inactive,
      });
      setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) return toast.error("Name required");
    const nameToCheck = editData.name.trim();
    if (!/^[a-zA-Z\s]+$/.test(nameToCheck)) return toast.error("Name allows only characters");
    if (nameToCheck.length < 2) return toast.error("Name must be at least 2 characters");
    if (nameToCheck.length > 50) return toast.error("Name must be at most 50 characters");

    if (!editData.countryId) return toast.error("Country required");
    if (!editData.stateId) return toast.error("State required");
    if (!editData.cityId) return toast.error("City required");

    if (!editData.address?.trim()) return toast.error("Address is required");
    if (editData.address.length > 200) return toast.error("Address must be at most 200 characters");

    // Validate Phone
    if (!editData.phone?.trim()) return toast.error("Phone number is required");
    if (!/^\d{10}$/.test(editData.phone.trim())) return toast.error("Phone number must be exactly 10 digits");

    // Check for duplicates
    try {
        const searchRes = await searchWarehouseApi(editData.name.trim());
        if (searchRes?.status === 200) {
             const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
             const existing = rows.find(r => 
                (r.Name || r.name || "").toLowerCase() === editData.name.trim().toLowerCase() &&
                (r.Id || r.id) !== editData.id
             );
             if (existing) return toast.error("Warehouse with this name already exists");
        }
    } catch (err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }
    
    try {
      const res = await updateWarehouseApi(editData.id, {
        name: editData.name,
        description: editData.description,
        countryId: editData.countryId,
        stateId: editData.stateId,
        cityId: editData.cityId,
        phone: editData.phone,
        address: editData.address,
        userId
      });
      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const handleDelete = async () => {
    const result = await showDeleteConfirm();

    if (result.isConfirmed) {
        try {
          const res = await deleteWarehouseApi(editData.id, { userId });
          if (res?.status === 200) {
            showSuccessToast("Deleted");
            setEditModalOpen(false);
            loadRows();
            if (showInactive) loadInactive();
          } else {
            showErrorToast("Delete failed");
          }
        } catch (err) {
            console.error(err);
            showErrorToast("Server error");
        }
    }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm();

    if (result.isConfirmed) {
        try {
          const res = await restoreWarehouseApi(editData.id, { userId });
          if (res?.status === 200) {
            showSuccessToast("Restored");
            setEditModalOpen(false);
            loadRows();
            loadInactive();
          } else {
            showErrorToast("Restore failed");
          }
        } catch (err) {
            console.error(err);
            showErrorToast("Server error");
        }
    }
  };

  // --- QUICK ADD HANDLERS ---
  const handleAddCountry = async () => {
      const nameToAdd = newCountryName.trim();
      if(!nameToAdd) return toast.error("Name required");

      // Check duplicates
      try {
        const searchRes = await searchCountryApi(nameToAdd);
        if (searchRes?.status === 200) {
            const rows = searchRes.data.records || searchRes.data || [];
            const existing = rows.find(r => (r.Name || r.name || "").toLowerCase() === nameToAdd.toLowerCase());
            if (existing) return toast.error("Country with this name already exists");
        }
      } catch (err) {
        console.error(err);
        return toast.error("Error checking duplicates");
      }

      try {
          const res = await addCountryApi({ name: nameToAdd, userId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("Country added");
              setAddCountryModalOpen(false);
              setNewCountryName("");
              
              let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

              // Reload and select
              const resC = await getCountriesApi(1, 1000);
              if(resC?.status === 200) {
                  const rows = resC.data.records || resC.data || [];
                  setCountries(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name })));
                  
                  if (!createdId) {
                      const created = rows.find(r => (r.Name || r.name || "").trim().toLowerCase() === nameToAdd.toLowerCase());
                      if (created) createdId = created.Id || created.id;
                  }

                  if(createdId) {
                      if(modalOpen) setNewData(prev => ({ ...prev, countryId: createdId, stateId: "", cityId: "" }));
                      if(editModalOpen) setEditData(prev => ({ ...prev, countryId: createdId, stateId: "", cityId: "" }));
                  }
              }
          } else {
              toast.error("Failed to add country");
          }
      } catch(err) {
          console.error(err);
          toast.error("Server error");
      }
  };

  const handleAddState = async () => {
      const nameToAdd = newStateName.trim();
      if(!nameToAdd) return toast.error("Name required");
      const currentCountryId = modalOpen ? newData.countryId : editData.countryId;
      if(!currentCountryId) return toast.error("Select Country first");

      try {
        const searchRes = await searchStateApi(nameToAdd);
        if (searchRes?.status === 200) {
             const rows = searchRes.data || []; 
             const items = Array.isArray(rows) ? rows : rows.records || [];
             const existing = items.find(r => 
                (r.Name || r.name || "").toLowerCase() === nameToAdd.toLowerCase() && 
                String(r.CountryId || r.countryId) === String(currentCountryId)
             );
             if (existing) return toast.error("State with this name already exists in selected country");
        }
      } catch(err) {
         console.error(err);
         return toast.error("Error checking duplicates");
      }

      try {
          const res = await addStateApi({ name: nameToAdd, countryId: currentCountryId, userId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("State added");
              setAddStateModalOpen(false);
              setNewStateName("");
              
              let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

              const resS = await getStatesApi(1, 1000);
              if(resS?.status === 200) {
                   const rows = resS.data.records || resS.data || [];
                   setStates(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name, countryId: r.CountryId || r.countryId })));

                   if (!createdId) {
                        const created = rows.find(r => (r.Name || r.name || "").trim().toLowerCase() === nameToAdd.toLowerCase() && (r.CountryId || r.countryId) == currentCountryId);
                        if (created) createdId = created.Id || created.id;
                   }

                   if(createdId) {
                       if(modalOpen) setNewData(prev => ({ ...prev, stateId: createdId, cityId: "" }));
                       if(editModalOpen) setEditData(prev => ({ ...prev, stateId: createdId, cityId: "" }));
                   }
              }
          } else {
              toast.error("Failed to add state");
          }
      } catch(err) {
          console.error(err);
          toast.error("Server error");
      }
  };

  const handleAddCity = async () => {
      const nameToAdd = newCityName.trim();
      if(!nameToAdd) return toast.error("Name required");
      const currentStateId = modalOpen ? newData.stateId : editData.stateId;
      const currentCountryId = modalOpen ? newData.countryId : editData.countryId;
      if(!currentStateId) return toast.error("Select State first");

      try {
        const searchRes = await searchCityApi(nameToAdd);
        if (searchRes?.status === 200) {
             const rows = searchRes.data.records || searchRes.data || []; 
             const items = Array.isArray(rows) ? rows : []; 
             const existing = items.find(r => 
                (r.Name || r.name || "").toLowerCase() === nameToAdd.toLowerCase() && 
                String(r.StateId || r.stateId) === String(currentStateId)
             );
             if (existing) return toast.error("City with this name already exists in selected state");
        }
      } catch(err) {
         console.error(err);
         return toast.error("Error checking duplicates");
      }

      try {
          const res = await addCityApi({ name: nameToAdd, stateId: currentStateId, countryId: currentCountryId, userId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("City added");
              setAddCityModalOpen(false);
              setNewCityName("");

              let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

              const resCi = await getCitiesApi(1, 1000);
              if(resCi?.status === 200) {
                  const rows = resCi.data.records || resCi.data || [];
                  setCities(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name, stateId: r.StateId || r.stateId })));

                  if (!createdId) {
                      const created = rows.find(r => (r.Name || r.name || "").trim().toLowerCase() === nameToAdd.toLowerCase() && (r.StateId || r.stateId) == currentStateId);
                      if (created) createdId = created.Id || created.id;
                  }

                  if(createdId) {
                       if(modalOpen) setNewData(prev => ({ ...prev, cityId: createdId }));
                       if(editModalOpen) setEditData(prev => ({ ...prev, cityId: createdId }));
                   }
              }
          } else {
              toast.error("Failed to add city");
          }
      } catch(err) {
          console.error(err);
          toast.error("Server error");
      }
  };

  const handleEditCountrySave = async () => {
    if (!countryEditData.name?.trim()) return toast.error("Name required");
    try {
        const res = await updateCountryApi(countryEditData.id, { name: countryEditData.name, userId });
        if (res?.status === 200) {
            toast.success("Country updated");
            setEditCountryModalOpen(false);
            const resC = await getCountriesApi(1, 1000);
            if(resC?.status === 200) {
                 setCountries((resC.data.records || resC.data || []).map(r => ({ id: r.Id || r.id, name: r.Name || r.name })));
            }
        } else toast.error("Update failed");
    } catch(err) { console.error(err); toast.error("Server error"); }
  };

  const handleEditStateSave = async () => {
    if (!stateEditData.name?.trim()) return toast.error("Name required");
    try {
        const currentState = states.find(s => String(s.id) == String(stateEditData.id));
        const res = await updateStateApi(stateEditData.id, { name: stateEditData.name, countryId: currentState?.countryId, userId });
        if (res?.status === 200) {
            toast.success("State updated");
            setEditStateModalOpen(false);
            const resS = await getStatesApi(1, 1000);
            if(resS?.status === 200) {
                 setStates((resS.data.records || resS.data || []).map(r => ({ id: r.Id || r.id, name: r.Name || r.name, countryId: r.CountryId || r.countryId })));
            }
        } else toast.error("Update failed");
    } catch(err) { console.error(err); toast.error("Server error"); }
  };

  const handleEditCitySave = async () => {
    if (!cityEditData.name?.trim()) return toast.error("Name required");
    try {
        const currentCity = cities.find(c => String(c.id) == String(cityEditData.id));
        const res = await updateCityApi(cityEditData.id, { name: cityEditData.name, stateId: currentCity?.stateId, countryId: editData.countryId, userId });
        if (res?.status === 200) {
            toast.success("City updated");
            setEditCityModalOpen(false);
            const resCi = await getCitiesApi(1, 1000);
            if(resCi?.status === 200) {
                 setCities((resCi.data.records || resCi.data || []).map(r => ({ id: r.Id || r.id, name: r.Name || r.name, stateId: r.StateId || r.stateId })));
            }
        } else toast.error("Update failed");
    } catch(err) { console.error(err); toast.error("Server error"); }
  };

  return (
    <PageLayout>
      <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
      <ContentCard>
        <div className="flex flex-col h-full overflow-hidden gap-2">
          <h2 className="text-xl font-bold text-[#6448AE] mb-2">Warehouses</h2>
          <hr className="mb-4 border-gray-300" />

          <MasterTable
            columns={[
                visibleColumns.id && { key: 'id', label: 'ID', sortable: true },
                visibleColumns.name && { key: 'name', label: 'Name', sortable: true },
                visibleColumns.country && { key: 'countryName', label: 'Country', sortable: true },
                visibleColumns.state && { key: 'stateName', label: 'State', sortable: true },
                visibleColumns.city && { key: 'cityName', label: 'City', sortable: true },
                visibleColumns.phone && { key: 'phone', label: 'Phone', sortable: true },
                visibleColumns.address && { key: 'address', label: 'Address', sortable: true },
            ].filter(Boolean)}
            data={sortedRows}
            inactiveData={inactiveRows}
            showInactive={showInactive}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowClick={(item, isInactive) => openEdit(item, isInactive)}
            // Action Props
            search={searchText}
            onSearch={handleSearch}
            onCreate={() => setModalOpen(true)}
            createLabel="New Warehouse"
            permissionCreate={hasPermission(PERMISSIONS.WAREHOUSES.CREATE)}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                setFilters({ countryId: "", stateId: "", cityId: "" });
                refreshCtx();
                refreshInactiveCtx();
                loadRows();
            }}
            onColumnSelector={() => setColumnModal(true)}
            onToggleInactive={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive((s) => !s);
            }}
          >
             <FilterBar 
                filters={filterConfig} 
                onClear={() => setFilters({ countryId: "", stateId: "", cityId: "" })} 
             />
          </MasterTable>

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
                setFilters({ countryId: "", stateId: "", cityId: "" });
                refreshCtx();
                refreshInactiveCtx();
                loadRows();
            }}
            />
          </div>
      </ContentCard>
    </div>

       {/* ADD MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Warehouse"
       >
          <div className="space-y-4">
               <div>
                   <InputField
                       label="Name"
                       value={newData.name}
                       onChange={e => setNewData({...newData, name: e.target.value})}
                       className="mt-1"
                       required
                   />
                </div>
               <div>
                   <InputField
                       label="Description"
                       textarea
                       value={newData.description}
                       onChange={e => setNewData({...newData, description: e.target.value})}
                       className="mt-1"
                   />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-dark">Country *</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={countries}
                               value={newData.countryId}
                               onChange={(val) => setNewData({...newData, countryId: val, stateId: "", cityId: ""})}
                               className="w-full"
                               direction="down"
                           />
                           {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (<button onClick={() => setAddCountryModalOpen(true)} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                               <Star size={16} />
                           </button>)}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-dark">State *</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={states.filter(s => s.countryId == newData.countryId)}
                               value={newData.stateId}
                               onChange={(val) => setNewData({...newData, stateId: val, cityId: ""})}
                               disabled={!newData.countryId}
                               className="w-full"
                               direction="down"
                           />
                           {hasPermission(PERMISSIONS.STATES.CREATE) && (<button onClick={() => setAddStateModalOpen(true)} disabled={!newData.countryId} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                               <Star size={16} className="" />
                           </button>)}
                       </div>
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-dark">City *</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={cities.filter(c => c.stateId == newData.stateId)}
                               value={newData.cityId}
                               onChange={(val) => setNewData({...newData, cityId: val})}
                               disabled={!newData.stateId}
                               className="w-full"
                               direction="down"
                           />
                           {hasPermission(PERMISSIONS.CITIES.CREATE) && (<button onClick={() => setAddCityModalOpen(true)} disabled={!newData.stateId} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                               <Star size={16} className="" />
                           </button>)}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-dark">Phone *</label>
                        <InputField
                            
                            value={newData.phone}
                            onChange={e => setNewData({...newData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                            className="mt-1"
                        />
                   </div>
               </div>
               <div>
                   <label className="text-sm text-dark">Address *</label>
                    <InputField
                        
                        textarea
                        value={newData.address}
                        onChange={e => setNewData({...newData, address: e.target.value})}
                        className="mt-1"
                    />
               </div>
          </div>
       </AddModal>

       {/* EDIT MODAL */}
       <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onRestore={handleRestore}
          isInactive={editData.isInactive}
          title={editData.isInactive ? "Restore Warehouse" : "Edit Warehouse"}
          permissionDelete={hasPermission(PERMISSIONS.WAREHOUSES.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.WAREHOUSES.EDIT)}
          saveText="Update"
       >
          <div className="space-y-4">
              <div>
               <div>
                   <InputField
                       label="Name"
                       value={editData.name}
                       onChange={e => setEditData({...editData, name: e.target.value})}
                       disabled={editData.isInactive}
                       className="mt-1"
                       required
                   />
                </div>
               </div>
                <div>
                    <InputField
                        label="Description"
                        value={editData.description}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        disabled={editData.isInactive}
                        className="mt-1"
                        textarea
                        rows={2}
                    />
                </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-dark">Country *</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={countries}
                               value={editData.countryId}
                               onChange={(val) => setEditData({...editData, countryId: val, stateId: "", cityId: ""})}
                               disabled={editData.isInactive}
                               className="w-full"
                               direction="down"
                           />
                           {!editData.isInactive && hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (
                               <div className="flex gap-1">
                                   {editData.countryId && (
                                    <button onClick={() => {
                                        const c = countries.find(x => String(x.id) == String(editData.countryId));
                                        setCountryEditData({ id: editData.countryId, name: c?.name || "" });
                                        setEditCountryModalOpen(true);
                                    }} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                                       <Pencil size={16} />
                                    </button>
                                   )}
                               </div>
                           )}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-dark">State *</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={states.filter(s => s.countryId == editData.countryId)}
                               value={editData.stateId}
                               onChange={(val) => setEditData({...editData, stateId: val, cityId: ""})}
                               disabled={!editData.countryId || editData.isInactive}
                               className="w-full"
                               direction="down"
                           />
                           {!editData.isInactive && hasPermission(PERMISSIONS.STATES.CREATE) && (
                               <div className="flex gap-1">
                                   {editData.stateId && (
                                    <button onClick={() => {
                                        const s = states.find(x => String(x.id) == String(editData.stateId));
                                        setStateEditData({ id: editData.stateId, name: s?.name || "" });
                                        setEditStateModalOpen(true);
                                    }} disabled={!editData.countryId} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                                        <Pencil size={16} />
                                    </button>
                                   )}
                               </div>
                           )}
                       </div>
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-dark">City *</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={cities.filter(c => c.stateId == editData.stateId)}
                               value={editData.cityId}
                               onChange={(val) => setEditData({...editData, cityId: val})}
                               disabled={!editData.stateId || editData.isInactive}
                               className="w-full"
                               direction="down"
                           />
                           {!editData.isInactive && hasPermission(PERMISSIONS.CITIES.CREATE) && (
                               <div className="flex gap-1">
                                   {editData.cityId && (
                                     <button onClick={() => {
                                        const c = cities.find(x => String(x.id) == String(editData.cityId));
                                        setCityEditData({ id: editData.cityId, name: c?.name || "" });
                                        setEditCityModalOpen(true);
                                     }} disabled={!editData.stateId} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                                        <Pencil size={16} />
                                     </button>
                                   )}
                               </div>
                           )}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-dark">Phone *</label>
                        <InputField
                             label=""
                             value={editData.phone}
                             onChange={e => setEditData({...editData, phone: e.target.value})}
                             disabled={editData.isInactive}
                             className="mt-1"
                        />
                   </div>
               </div>
               <div>
                   <label className="text-sm text-dark">Address</label>
                    <InputField
                        label=""
                        textarea
                        value={editData.address}
                        onChange={e => setEditData({...editData, address: e.target.value})}
                        disabled={editData.isInactive}
                        className="mt-1"
                    />
               </div>
          </div>
       </EditModal>

       {/* COLUMN PICKER */}
       <ColumnPickerModal
          isOpen={columnModal}
          onClose={() => setColumnModal(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
       />

       {/* --- QUICK ADD SUB-MODALS --- */}
       {addCountryModalOpen && (
           <AddModal isOpen={true} onClose={() => setAddCountryModalOpen(false)} onSave={handleAddCountry} title="Quick Add Country">
               <InputField
                   label="Country Name"
                   value={newCountryName}
                   onChange={e => setNewCountryName(e.target.value)}
                   className="mt-1"
                   autoFocus
                   required
               />
           </AddModal>
       )}
       {addStateModalOpen && (
           <AddModal isOpen={true} onClose={() => setAddStateModalOpen(false)} onSave={handleAddState} title="Quick Add State">
               <InputField
                   label="State Name"
                   value={newStateName}
                   onChange={e => setNewStateName(e.target.value)}
                   className="mt-1"
                   autoFocus
                   required
               />
           </AddModal>
       )}
       {addCityModalOpen && (
           <AddModal isOpen={true} onClose={() => setAddCityModalOpen(false)} onSave={handleAddCity} title="Quick Add City">
               <InputField
                   label="City Name"
                   value={newCityName}
                   onChange={e => setNewCityName(e.target.value)}
                   className="mt-1"
                   autoFocus
                   required
               />
           </AddModal>
       )}

       {/* EDIT SUB-MODALS */}
       {editCountryModalOpen && (
            <AddModal isOpen={true} onClose={() => setEditCountryModalOpen(false)} onSave={handleEditCountrySave} title={`Edit Country (${countryEditData.name})`} saveText="Update">
                <InputField value={countryEditData.name} onChange={e => setCountryEditData(p => ({...p, name: e.target.value}))} autoFocus required />
            </AddModal>
       )}
       {editStateModalOpen && (
            <AddModal isOpen={true} onClose={() => setEditStateModalOpen(false)} onSave={handleEditStateSave} title={`Edit State (${stateEditData.name})`} saveText="Update">
                <InputField value={stateEditData.name} onChange={e => setStateEditData(p => ({...p, name: e.target.value}))} autoFocus required />
            </AddModal>
       )}
       {editCityModalOpen && (
            <AddModal isOpen={true} onClose={() => setEditCityModalOpen(false)} onSave={handleEditCitySave} title={`Edit City (${cityEditData.name})`} saveText="Update">
                <InputField value={cityEditData.name} onChange={e => setCityEditData(p => ({...p, name: e.target.value}))} autoFocus required />
            </AddModal>
       )}

    </PageLayout>
  );
};

export default Warehouses;