import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ArchiveRestore,
  Star,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SortableHeader from "../../components/SortableHeader";
import toast from "react-hot-toast";

import {
  addWarehouseApi,
  getWarehousesApi,
  updateWarehouseApi,
  deleteWarehouseApi,
  searchWarehouseApi,
  getInactiveWarehousesApi,
  restoreWarehouseApi,
  getLocationsApi,
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  addCountryApi,
  addStateApi,
  addCityApi,
} from "../../services/allAPI"; 
import SearchableSelect from "../../components/SearchableSelect"; 
import FilterBar from "../../components/FilterBar"; 


const Warehouses = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [inactiveWarehouses, setInactiveWarehouses] = useState([]);
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
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };

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

  const sortedWarehouses = [...warehouses];
  if (sortConfig.key) {
    sortedWarehouses.sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

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

  // LOAD WAREHOUSES
  const loadWarehouses = async () => {
    try {
      const res = await getWarehousesApi(page, limit, filters);
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = rows.map(r => ({
            id: r.Id || r.id,
            name: r.Name || r.name,
            description: r.Description || r.description,
            countryId: r.CountryId || r.countryId,
            countryName: r.CountryName || r.countryName,
            stateId: r.StateId || r.stateId,
            stateName: r.StateName || r.stateName,
            cityId: r.CityId || r.cityId,
            cityName: r.CityName || r.cityName,
            phone: r.Phone || r.phone,
            address: r.Address || r.address,
        }));
        setWarehouses(normalized);
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
    loadWarehouses();
  }, [page, limit, filters]);

  const loadInactive = async () => {
    try {
      if (getActiveWarehousesApi) {
          const res = await getInactiveWarehousesApi();
          if (res?.status === 200) {
            const rows = res.data.records || res.data || [];
            const normalized = rows.map(r => ({
                id: r.Id || r.id,
                name: r.Name || r.name,
                description: r.Description || r.description,
                countryId: r.CountryId || r.countryId,
                countryName: r.CountryName || r.countryName,
                stateId: r.StateId || r.stateId,
                stateName: r.StateName || r.stateName,
                cityId: r.CityId || r.cityId,
                cityName: r.CityName || r.cityName,
                phone: r.Phone || r.phone,
                address: r.Address || r.address,
            }));
            setInactiveWarehouses(normalized);
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

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
        setPage(1);
        return loadWarehouses();
    }
    try {
      const res = await searchWarehouseApi(text);
      if (res?.status === 200) {
        const rows = res.data || [];
        const normalized = rows.map(r => ({
             id: r.Id || r.id,
            name: r.Name || r.name,
            description: r.Description || r.description,
            countryId: r.CountryId || r.countryId,
            countryName: r.CountryName || r.countryName,
            stateId: r.StateId || r.stateId,
            stateName: r.StateName || r.stateName,
            cityId: r.CityId || r.cityId,
            cityName: r.CityName || r.cityName,
            phone: r.Phone || r.phone,
            address: r.Address || r.address,
        }));
        setWarehouses(normalized);
        setTotalRecords(rows.length);
      }
    } catch (err) {
        console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Name required");
    if (!newData.countryId) return toast.error("Country required");
    if (!newData.stateId) return toast.error("State required");
    if (!newData.cityId) return toast.error("City required");
    
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
        loadWarehouses();
      } else {
        toast.error("Failed to add");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) return toast.error("Name required");
    if (!editData.countryId) return toast.error("Country required");
    if (!editData.stateId) return toast.error("State required");
    if (!editData.cityId) return toast.error("City required");
    
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
        loadWarehouses();
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
      const res = await deleteWarehouseApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadWarehouses();
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
      const res = await restoreWarehouseApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadWarehouses();
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
          <h2 className="text-2xl font-semibold mb-4">Warehouses</h2>

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
              <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded">
                <Plus size={16} /> New Warehouse
              </button>
              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadWarehouses();
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <RefreshCw size={16} className="text-blue-400" />
              </button>
              <button onClick={() => setColumnModal(true)} className="p-2 bg-gray-700 border border-gray-600 rounded">
                <List size={16} className="text-blue-300" />
              </button>
              <button
                onClick={async () => {
                  if (!showInactive) await loadInactive();
                  setShowInactive((s) => !s);
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1"
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
                        {visibleColumns.phone && <SortableHeader label="Phone" sortOrder={sortConfig.key === "phone" ? sortConfig.direction : null} onClick={() => handleSort("phone")} />}
                    </tr>
                </thead>
                <tbody>
                    {!sortedWarehouses.length && !showInactive && (
                         <tr><td colSpan="2" className="text-center py-4 text-gray-400">No records found</td></tr>
                    )}
                    {!showInactive && sortedWarehouses.map(r => (
                        <tr key={r.id} onClick={() => {
                            setEditData({ 
                                id: r.id, 
                                name: r.name, 
                                description: r.description,
                                countryId: r.countryId,
                                stateId: r.stateId,
                                cityId: r.cityId,
                                phone: r.phone,
                                address: r.address,
                                isInactive: false 
                            });
                            setEditModalOpen(true);
                        }} className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-center">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.country && <td className="px-2 py-1">{r.countryName}</td>}
                            {visibleColumns.state && <td className="px-2 py-1">{r.stateName}</td>}
                            {visibleColumns.city && <td className="px-2 py-1">{r.cityName}</td>}
                            {visibleColumns.phone && <td className="px-2 py-1">{r.phone}</td>}
                        </tr>
                    ))}
                    {showInactive && inactiveWarehouses.map(r => (
                        <tr key={`inactive-${r.id}`} onClick={() => {
                            setEditData({ 
                                id: r.id, 
                                name: r.name, 
                                description: r.description,
                                countryId: r.countryId,
                                stateId: r.stateId,
                                cityId: r.cityId,
                                phone: r.phone,
                                address: r.address,
                                isInactive: true 
                            });
                            setEditModalOpen(true);
                        }} className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer text-center">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.country && <td className="px-2 py-1">{r.countryName}</td>}
                            {visibleColumns.state && <td className="px-2 py-1">{r.stateName}</td>}
                            {visibleColumns.city && <td className="px-2 py-1">{r.cityName}</td>}
                            {visibleColumns.phone && <td className="px-2 py-1">{r.phone}</td>}
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
                  loadWarehouses();
                }}
              />
        </div>
      </div>

       {/* MODALS */}
       {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
               <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                  <h2 className="font-semibold">New Warehouse</h2>
                  <button onClick={() => setModalOpen(false)}><X size={20}/></button>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                      <label className="text-sm">Name *</label>
                      <input value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                   </div>
                   <div>
                       <label className="text-sm">Description</label>
                       <textarea value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="text-sm">Country *</label>
                           <div className="flex items-center gap-2">
                               <SearchableSelect 
                                   options={countries}
                                   value={newData.countryId}
                                   onChange={(val) => setNewData({...newData, countryId: val, stateId: "", cityId: ""})}
                                   className="w-full"
                               />
                               <button onClick={() => setAddCountryModalOpen(true)} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           </div>
                       </div>
                       <div>
                           <label className="text-sm">State *</label>
                           <div className="flex items-center gap-2">
                               <SearchableSelect 
                                   options={states.filter(s => s.countryId == newData.countryId)}
                                   value={newData.stateId}
                                   onChange={(val) => setNewData({...newData, stateId: val, cityId: ""})}
                                   disabled={!newData.countryId}
                                   className="w-full"
                               />
                               <button onClick={() => setAddStateModalOpen(true)} disabled={!newData.countryId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           </div>
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="text-sm">City *</label>
                           <div className="flex items-center gap-2">
                               <SearchableSelect 
                                   options={cities.filter(c => c.stateId == newData.stateId)}
                                   value={newData.cityId}
                                   onChange={(val) => setNewData({...newData, cityId: val})}
                                   disabled={!newData.stateId}
                                   className="w-full"
                               />
                               <button onClick={() => setAddCityModalOpen(true)} disabled={!newData.stateId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           </div>
                       </div>
                       <div>
                           <label className="text-sm">Phone</label>
                           <input value={newData.phone} onChange={e => setNewData({...newData, phone: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                       </div>
                   </div>
                   <div>
                       <label className="text-sm">Address</label>
                       <textarea value={newData.address} onChange={e => setNewData({...newData, address: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                   </div>
               </div>
               <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
                   <button onClick={handleAdd} className="bg-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-600"><Save size={16}/> Save</button>
               </div>
            </div>
          </div>
       )}

       {editModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
               <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                  <h2 className="font-semibold">{editData.isInactive ? "Restore Warehouse" : "Edit Warehouse"}</h2>
                  <button onClick={() => setEditModalOpen(false)}><X size={20}/></button>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                      <label className="text-sm">Name *</label>
                      <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50" />
                   </div>
                   <div>
                       <label className="text-sm">Description</label>
                       <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="text-sm">Country *</label>
                           <div className="flex items-center gap-2">
                               <SearchableSelect 
                                   options={countries}
                                   value={editData.countryId}
                                   onChange={(val) => setEditData({...editData, countryId: val, stateId: "", cityId: ""})}
                                   disabled={editData.isInactive}
                                   className="w-full"
                               />
                               {!editData.isInactive && (
                                   <button onClick={() => setAddCountryModalOpen(true)} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700">
                                       <Star size={18} className="text-yellow-400" />
                                   </button>
                               )}
                           </div>
                       </div>
                       <div>
                           <label className="text-sm">State *</label>
                           <div className="flex items-center gap-2">
                               <SearchableSelect 
                                   options={states.filter(s => s.countryId == editData.countryId)}
                                   value={editData.stateId}
                                   onChange={(val) => setEditData({...editData, stateId: val, cityId: ""})}
                                   disabled={!editData.countryId || editData.isInactive}
                                   className="w-full"
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
                           <label className="text-sm">City *</label>
                           <div className="flex items-center gap-2">
                               <SearchableSelect 
                                   options={cities.filter(c => c.stateId == editData.stateId)}
                                   value={editData.cityId}
                                   onChange={(val) => setEditData({...editData, cityId: val})}
                                   disabled={!editData.stateId || editData.isInactive}
                                   className="w-full"
                               />
                               {!editData.isInactive && (
                                   <button onClick={() => setAddCityModalOpen(true)} disabled={!editData.stateId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                                       <Star size={18} className="text-yellow-400" />
                                   </button>
                               )}
                           </div>
                       </div>
                       <div>
                           <label className="text-sm">Phone</label>
                           <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50" />
                       </div>
                   </div>
                   <div>
                       <label className="text-sm">Address</label>
                       <textarea value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50" />
                   </div>
               </div>
               <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
                   {editData.isInactive ? (
                       <button onClick={handleRestore} className="bg-green-600 px-4 py-2 rounded flex items-center gap-2"><ArchiveRestore size={16}/> Restore</button>
                   ) : (
                       <button onClick={handleDelete} className="bg-red-600 px-4 py-2 rounded flex items-center gap-2"><Trash2 size={16}/> Delete</button>
                   )}
                   {!editData.isInactive && (
                       <button onClick={handleUpdate} className="bg-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-600"><Save size={16}/> Save</button>
                   )}
               </div>
            </div>
          </div>
       )}

        {/* --- QUICK ADD MODALS --- */}
        {addCountryModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
                <div className="w-[400px] bg-gray-900 text-white rounded-lg border border-gray-700">
                    <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                        <h2 className="font-semibold">Add Country</h2>
                        <button onClick={() => setAddCountryModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-5">
                       <label className="text-sm">Country Name *</label>
                       <input value={newCountryName} onChange={e => setNewCountryName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1" autoFocus />
                    </div>
                    <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
                        <button onClick={handleAddCountry} className="bg-blue-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-500"><Save size={16}/> Save</button>
                    </div>
                </div>
            </div>
        )}

        {addStateModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
                <div className="w-[400px] bg-gray-900 text-white rounded-lg border border-gray-700">
                    <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                        <h2 className="font-semibold">Add State</h2>
                        <button onClick={() => setAddStateModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-5">
                       <label className="text-sm">State Name *</label>
                       <input value={newStateName} onChange={e => setNewStateName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1" autoFocus />
                    </div>
                    <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
                        <button onClick={handleAddState} className="bg-blue-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-500"><Save size={16}/> Save</button>
                    </div>
                </div>
            </div>
        )}

        {addCityModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
                <div className="w-[400px] bg-gray-900 text-white rounded-lg border border-gray-700">
                    <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                        <h2 className="font-semibold">Add City</h2>
                        <button onClick={() => setAddCityModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-5">
                       <label className="text-sm">City Name *</label>
                       <input value={newCityName} onChange={e => setNewCityName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1" autoFocus />
                    </div>
                    <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
                        <button onClick={handleAddCity} className="bg-blue-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-500"><Save size={16}/> Save</button>
                    </div>
                </div>
            </div>
        )}

       {/* columnModal */}
       {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex justify-center items-center">
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

            {/* SEARCH */}
            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="search columns..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-60 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            {/* VISIBLE / HIDDEN COLUMNS */}
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

                {Object.keys(visibleColumns).filter(
                  (col) => !visibleColumns[col]
                ).length === 0 && (
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

    </PageLayout>
  );
};

export default Warehouses;
