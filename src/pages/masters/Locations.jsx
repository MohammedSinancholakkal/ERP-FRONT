import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  Star,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SortableHeader from "../../components/SortableHeader";
import toast from "react-hot-toast";

import {
  addLocationApi,
  getLocationsApi,
  updateLocationApi,
  deleteLocationApi,
  searchLocationApi,
  getInactiveLocationsApi,
  restoreLocationApi,
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  addCountryApi,
  addStateApi,
  addCityApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import SearchableSelect from "../../components/SearchableSelect";
import FilterBar from "../../components/FilterBar";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const Locations = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // Data
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
    countryId: "",
    stateId: "",
    cityId: "",
    address: "",
    latitude: "",
    longitude: ""
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
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

  // QUICK ADD STATE
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");

  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [newStateName, setNewStateName] = useState("");

  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId || 1;

  const [searchText, setSearchText] = useState("");

  // COLUMN PICKER
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

  const sortedRows = [...rows];
  if (sortConfig.key) {
    sortedRows.sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // ===============================
  // Helpers
  // ===============================
  const normalizeRows = (items = []) => 
     items.map(r => ({
        id: r.Id || r.id,
        name: r.Name || r.name,
        countryId: r.CountryId || r.countryId,
        countryName: r.CountryName || r.countryName,
        stateId: r.StateId || r.stateId,
        stateName: r.StateName || r.stateName,
        cityId: r.CityId || r.cityId,
        cityName: r.CityName || r.cityName,
        address: r.Address || r.address,
        latitude: r.Latitude || r.latitude,
        longitude: r.Longitude || r.longitude,
    }));


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

  // LOAD LOCATIONS
  const loadRows = async () => {
    try {
      const res = await getLocationsApi(page, limit, filters);
      if (res?.status === 200) {
        const data = res.data;
        let items = [];
        if (Array.isArray(data.records)) {
             items = data.records;
             setTotalRecords(data.total ?? data.records.length);
        } else if(Array.isArray(data)) {
             items = data;
             setTotalRecords(items.length);
        } else {
             items = [];
             setTotalRecords(0);
        }
        setRows(normalizeRows(items));
      } else {
        toast.error("Failed to load locations");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load locations");
    }
  };

  // Reload when page, limit, or filters change
  useEffect(() => {
    loadRows();
  }, [page, limit, filters]);

  const loadInactive = async () => {
    try {
      const res = await getInactiveLocationsApi();
      if (res?.status === 200) {
        const items = res.data.records || res.data || [];
        setInactiveRows(normalizeRows(items));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inactive");
    }
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
        setPage(1);
        return loadRows();
    }
    try {
      const res = await searchLocationApi(text);
      if (res?.status === 200) {
        const items = res.data.records || res.data || [];
        setRows(normalizeRows(items));
        setTotalRecords(items.length);
      }
    } catch (err) {
        console.error(err);
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
      disabled: !filters.countryId
    },
    {
      label: "City",
      value: filters.cityId,
      options: cities.filter(c => !filters.stateId || c.stateId == filters.stateId),
      onChange: (val) => setFilters(prev => ({ ...prev, cityId: val })),
      disabled: !filters.stateId
    }
  ];

  // ADD
  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Name required");
    try {
      const res = await addLocationApi({ ...newData, userId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Added");
        setNewData({ 
            name: "", 
            countryId: "",
            stateId: "",
            cityId: "",
            address: "",
            latitude: "",
            longitude: "" 
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

  // UPDATE
  const openEdit = (row, inactive = false) => {
      setEditData({
        id: row.id,
        name: row.name,
        countryId: row.countryId,
        stateId: row.stateId,
        cityId: row.cityId,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        isInactive: inactive,
      });
      setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) return toast.error("Name required");
    try {
      const res = await updateLocationApi(editData.id, {
        name: editData.name,
        countryId: editData.countryId,
        stateId: editData.stateId,
        cityId: editData.cityId,
        address: editData.address,
        latitude: editData.latitude,
        longitude: editData.longitude,
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
    try {
      const res = await deleteLocationApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const handleRestore = async () => {
    try {
      const res = await restoreLocationApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadRows();
        loadInactive();
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  // --- QUICK ADD HANDLERS ---
  const handleAddCountry = async () => {
      if(!newCountryName.trim()) return toast.error("Name required");
      try {
          const res = await addCountryApi({ name: newCountryName, userId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("Country added");
              setAddCountryModalOpen(false);
              setNewCountryName("");
              // Reload and select
              const resC = await getCountriesApi(1, 1000);
              if(resC?.status === 200) {
                  const rows = resC.data.records || resC.data || [];
                  const created = rows.find(r => (r.Name || r.name).toLowerCase() === newCountryName.toLowerCase());
                  setCountries(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name })));
                  
                  if(created) {
                      const createdId = created.Id || created.id;
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
      if(!newStateName.trim()) return toast.error("Name required");
      const currentCountryId = modalOpen ? newData.countryId : editData.countryId;
      if(!currentCountryId) return toast.error("Select Country first");

      try {
          const res = await addStateApi({ name: newStateName, countryId: currentCountryId, userId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("State added");
              setAddStateModalOpen(false);
              setNewStateName("");
              
              const resS = await getStatesApi(1, 1000);
              if(resS?.status === 200) {
                   const rows = resS.data.records || resS.data || [];
                   const created = rows.find(r => (r.Name || r.name).toLowerCase() === newStateName.toLowerCase() && (r.CountryId || r.countryId) == currentCountryId);
                   setStates(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name, countryId: r.CountryId || r.countryId })));

                   if(created) {
                       const createdId = created.Id || created.id;
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
      if(!newCityName.trim()) return toast.error("Name required");
      const currentStateId = modalOpen ? newData.stateId : editData.stateId;
      const currentCountryId = modalOpen ? newData.countryId : editData.countryId;
      if(!currentStateId) return toast.error("Select State first");

      try {
          const res = await addCityApi({ name: newCityName, stateId: currentStateId, countryId: currentCountryId, userId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("City added");
              setAddCityModalOpen(false);
              setNewCityName("");

              const resCi = await getCitiesApi(1, 1000);
              if(resCi?.status === 200) {
                  const rows = resCi.data.records || resCi.data || [];
                  const created = rows.find(r => (r.Name || r.name).toLowerCase() === newCityName.toLowerCase() && (r.StateId || r.stateId) == currentStateId);
                  setCities(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name, stateId: r.StateId || r.stateId })));

                  if(created) {
                       const createdId = created.Id || created.id;
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


  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Locations</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
             <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
                <Search size={16} className="text-gray-300" />
                <input
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent pl-2 text-sm w-full outline-none"
                />
              </div>

              {hasPermission(PERMISSIONS.LOCATIONS.CREATE) && (
              <button onClick={() => {
                  setNewData({ name: "", countryId: "", stateId: "", cityId: "", address: "", latitude: "", longitude: "" });
                  setModalOpen(true);
              }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
                <Plus size={16} /> New Location
              </button>
              )}

              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadRows();
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
              >
                <RefreshCw size={16} className="text-blue-400" />
              </button>

              <button onClick={() => setColumnModal(true)} className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
                <List size={16} className="text-blue-300" />
              </button>

              <button
                onClick={async () => {
                  if (!showInactive) await loadInactive();
                  setShowInactive((s) => !s);
                }}
                className={`p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1 hover:bg-gray-600 ${
                  showInactive ? "ring-1 ring-yellow-300" : ""
                }`}
              >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
              </button>
          </div>

          <FilterBar 
             filters={filterConfig} 
             onClear={() => setFilters({ countryId: "", stateId: "", cityId: "" })} 
             className="mb-4"
          />

          <div className="flex-grow overflow-auto min-h-0">
            <table className="w-[1200px] border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                        {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                        {visibleColumns.name && <SortableHeader label="Name" sortOrder={sortConfig.key === "name" ? sortConfig.direction : null} onClick={() => handleSort("name")} />}
                        {visibleColumns.country && <SortableHeader label="Country" sortOrder={sortConfig.key === "countryName" ? sortConfig.direction : null} onClick={() => handleSort("countryName")} />}
                        {visibleColumns.state && <SortableHeader label="State" sortOrder={sortConfig.key === "stateName" ? sortConfig.direction : null} onClick={() => handleSort("stateName")} />}
                        {visibleColumns.city && <SortableHeader label="City" sortOrder={sortConfig.key === "cityName" ? sortConfig.direction : null} onClick={() => handleSort("cityName")} />}
                        {visibleColumns.address && <SortableHeader label="Address" sortOrder={sortConfig.key === "address" ? sortConfig.direction : null} onClick={() => handleSort("address")} />}
                        {visibleColumns.latitude && <SortableHeader label="Latitude" sortOrder={sortConfig.key === "latitude" ? sortConfig.direction : null} onClick={() => handleSort("latitude")} />}
                        {visibleColumns.longitude && <SortableHeader label="Longitude" sortOrder={sortConfig.key === "longitude" ? sortConfig.direction : null} onClick={() => handleSort("longitude")} />}
                    </tr>
                </thead>
                <tbody className="text-center">
                    {!rows.length && !showInactive && (
                         <tr><td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-6 text-gray-400">No records found</td></tr>
                    )}
                    
                    {sortedRows.map(r => (
                        <tr key={r.id} onClick={() => openEdit(r, false)} className="bg-gray-900 hover:bg-gray-700 cursor-pointer">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.country && <td className="px-2 py-1">{r.countryName}</td>}
                            {visibleColumns.state && <td className="px-2 py-1">{r.stateName}</td>}
                            {visibleColumns.city && <td className="px-2 py-1">{r.cityName}</td>}
                            {visibleColumns.address && <td className="px-2 py-1">{r.address}</td>}
                            {visibleColumns.latitude && <td className="px-2 py-1">{r.latitude}</td>}
                            {visibleColumns.longitude && <td className="px-2 py-1">{r.longitude}</td>}
                        </tr>
                    ))}

                    {showInactive && inactiveRows.map(r => (
                        <tr key={`inactive-${r.id}`} onClick={() => openEdit(r, true)} className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.country && <td className="px-2 py-1">{r.countryName}</td>}
                            {visibleColumns.state && <td className="px-2 py-1">{r.stateName}</td>}
                            {visibleColumns.city && <td className="px-2 py-1">{r.cityName}</td>}
                            {visibleColumns.address && <td className="px-2 py-1">{r.address}</td>}
                            {visibleColumns.latitude && <td className="px-2 py-1">{r.latitude}</td>}
                            {visibleColumns.longitude && <td className="px-2 py-1">{r.longitude}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            total={totalRecords}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadRows();
            }}
            />
        </div>
      </div>

       {/* ADD MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Location"
       >
           <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300">Name *</label>
                  <input value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">Country</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={countries}
                               value={newData.countryId}
                               onChange={(val) => setNewData({...newData, countryId: val, stateId: "", cityId: ""})}
                               className="w-full"
                               direction="down"
                           />
                           {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (<button onClick={() => setAddCountryModalOpen(true)} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700">
                               <Star size={18} className="text-yellow-400" />
                           </button>)}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-gray-300">State</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={states.filter(s => s.countryId == newData.countryId)}
                               value={newData.stateId}
                               onChange={(val) => setNewData({...newData, stateId: val, cityId: ""})}
                               disabled={!newData.countryId}
                               className="w-full"
                               direction="down"
                           />
                           {hasPermission(PERMISSIONS.STATES.CREATE) && (<button onClick={() => setAddStateModalOpen(true)} disabled={!newData.countryId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                               <Star size={18} className="text-yellow-400" />
                           </button>)}
                       </div>
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">City</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={cities.filter(c => c.stateId == newData.stateId)}
                               value={newData.cityId}
                               onChange={(val) => setNewData({...newData, cityId: val})}
                               disabled={!newData.stateId}
                               className="w-full"
                               direction="down"
                           />
                           {hasPermission(PERMISSIONS.CITIES.CREATE) && (<button onClick={() => setAddCityModalOpen(true)} disabled={!newData.stateId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                               <Star size={18} className="text-yellow-400" />
                           </button>)}
                       </div>
                   </div>
               </div>
               <div>
                   <label className="text-sm text-gray-300">Address</label>
                   <textarea value={newData.address} onChange={e => setNewData({...newData, address: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" rows="2" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">Latitude</label>
                       <input value={newData.latitude} onChange={e => setNewData({...newData, latitude: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
                   </div>
                   <div>
                       <label className="text-sm text-gray-300">Longitude</label>
                       <input value={newData.longitude} onChange={e => setNewData({...newData, longitude: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
                   </div>
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
          title={editData.isInactive ? "Restore Location" : "Edit Location"}
          permissionDelete={hasPermission(PERMISSIONS.LOCATIONS.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.LOCATIONS.EDIT)}
       >
           <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300">Name *</label>
                  <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">Country</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={countries}
                               value={editData.countryId}
                               onChange={(val) => setEditData({...editData, countryId: val, stateId: "", cityId: ""})}
                               disabled={editData.isInactive}
                               className="w-full"
                               direction="down"
                           />
                           {!editData.isInactive && (
                               <button onClick={() => setAddCountryModalOpen(true)} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           )}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-gray-300">State</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={states.filter(s => s.countryId == editData.countryId)}
                               value={editData.stateId}
                               onChange={(val) => setEditData({...editData, stateId: val, cityId: ""})}
                               disabled={!editData.countryId || editData.isInactive}
                               className="w-full"
                               direction="down"
                           />
                           {!editData.isInactive && (
                               <button onClick={() => setAddStateModalOpen(true)} disabled={!editData.countryId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           )}
                       </div>
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">City</label>
                       <div className="flex items-center gap-2 mt-1">
                           <SearchableSelect 
                               options={cities.filter(c => c.stateId == editData.stateId)}
                               value={editData.cityId}
                               onChange={(val) => setEditData({...editData, cityId: val})}
                               disabled={!editData.stateId || editData.isInactive}
                               className="w-full"
                               direction="down"
                           />
                           {!editData.isInactive && (
                               <button onClick={() => setAddCityModalOpen(true)} disabled={!editData.stateId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           )}
                       </div>
                   </div>
               </div>
               <div>
                   <label className="text-sm text-gray-300">Address</label>
                   <textarea value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" rows="2" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">Latitude</label>
                       <input value={editData.latitude} onChange={e => setEditData({...editData, latitude: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
                   </div>
                   <div>
                       <label className="text-sm text-gray-300">Longitude</label>
                       <input value={editData.longitude} onChange={e => setEditData({...editData, longitude: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
                   </div>
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
       {/* (Inline implementation for now, can be refactored to separate components if needed) */}
       {addCountryModalOpen && (
           <AddModal isOpen={true} onClose={() => setAddCountryModalOpen(false)} onSave={handleAddCountry} title="Quick Add Country">
               <label className="text-sm text-gray-300">Country Name *</label>
               <input value={newCountryName} onChange={e => setNewCountryName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" autoFocus />
           </AddModal>
       )}
       {addStateModalOpen && (
           <AddModal isOpen={true} onClose={() => setAddStateModalOpen(false)} onSave={handleAddState} title="Quick Add State">
               <label className="text-sm text-gray-300">State Name *</label>
               <input value={newStateName} onChange={e => setNewStateName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" autoFocus />
           </AddModal>
       )}
       {addCityModalOpen && (
           <AddModal isOpen={true} onClose={() => setAddCityModalOpen(false)} onSave={handleAddCity} title="Quick Add City">
               <label className="text-sm text-gray-300">City Name *</label>
               <input value={newCityName} onChange={e => setNewCityName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" autoFocus />
           </AddModal>
       )}

    </PageLayout>
  );
};

export default Locations;