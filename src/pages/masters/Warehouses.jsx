import React, { useState, useEffect } from "react";
import {
  Star,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";

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
} from "../../services/allAPI"; 
import SearchableSelect from "../../components/SearchableSelect"; 
import FilterBar from "../../components/FilterBar";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions"; 
import MasterTable from "../../components/MasterTable"; 

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const Warehouses = () => {
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
  const loadRows = async () => {
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
  }, [page, limit, filters]);

  const loadInactive = async () => {
    try {
      if (getInactiveWarehousesApi) {
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
            setInactiveRows(normalized);
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
        return loadRows();
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
        setRows(normalized);
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
      const res = await deleteWarehouseApi(editData.id, { userId });
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
      const res = await restoreWarehouseApi(editData.id, { userId });
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
          <h2 className="text-2xl font-semibold mb-4">Warehouses</h2>

          <MasterTable
            columns={[
                visibleColumns.id && { key: 'id', label: 'ID', sortable: true },
                visibleColumns.name && { key: 'name', label: 'Name', sortable: true },
                visibleColumns.country && { key: 'countryName', label: 'Country', sortable: true },
                visibleColumns.state && { key: 'stateName', label: 'State', sortable: true },
                visibleColumns.city && { key: 'cityName', label: 'City', sortable: true },
                visibleColumns.phone && { key: 'phone', label: 'Phone', sortable: true },
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
         title="New Warehouse"
       >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300">Name *</label>
                  <input value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
               </div>
               <div>
                   <label className="text-sm text-gray-300">Description</label>
                   <textarea value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">Country *</label>
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
                       <label className="text-sm text-gray-300">State *</label>
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
                       <label className="text-sm text-gray-300">City *</label>
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
                   <div>
                       <label className="text-sm text-gray-300">Phone</label>
                       <input value={newData.phone} onChange={e => setNewData({...newData, phone: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
                   </div>
               </div>
               <div>
                   <label className="text-sm text-gray-300">Address</label>
                   <textarea value={newData.address} onChange={e => setNewData({...newData, address: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
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
       >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300">Name *</label>
                  <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
               </div>
               <div>
                   <label className="text-sm text-gray-300">Description</label>
                   <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">Country *</label>
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
                               <button onClick={() => setAddCountryModalOpen(true)} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           )}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-gray-300">State *</label>
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
                               <button onClick={() => setAddStateModalOpen(true)} disabled={!editData.countryId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           )}
                       </div>
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-sm text-gray-300">City *</label>
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
                               <button onClick={() => setAddCityModalOpen(true)} disabled={!editData.stateId} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                           )}
                       </div>
                   </div>
                   <div>
                       <label className="text-sm text-gray-300">Phone</label>
                       <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
                   </div>
               </div>
               <div>
                   <label className="text-sm text-gray-300">Address</label>
                   <textarea value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
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

export default Warehouses;