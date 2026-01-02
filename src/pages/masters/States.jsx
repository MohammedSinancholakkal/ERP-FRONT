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
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

import {
  addStateApi,
  getStatesApi,
  updateStateApi,
  deleteStateApi,
  searchStateApi,
  getInactiveStatesApi,
  restoreStateApi,
  getCountriesApi,
  addCountryApi,
} from "../../services/allAPI";

const States = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [states, setStates] = useState([]);
  const [inactiveStates, setInactiveStates] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // Dropdown data
  const [countries, setCountries] = useState([]);

  const [newData, setNewData] = useState({ name: "", countryId: "" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    countryId: "",
    isInactive: false,
  });

  // QUICK ADD MODAL STATES
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");

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

  const sortedStates = [...states];
  if (sortConfig.key) {
    sortedStates.sort((a, b) => {
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
  const loadCountries = async () => {
    try {
      const res = await getCountriesApi(1, 1000); 
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        setCountries(rows.map(r => ({ id: r.Id || r.id, name: r.Name || r.name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  // LOAD STATES
  const loadStates = async () => {
    try {
      const res = await getStatesApi(page, limit);
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = rows.map(r => ({
            id: r.Id || r.id,
            name: r.Name || r.name,
            countryId: r.CountryId || r.countryId,
            countryName: r.Country?.Name || r.countryName || "N/A"
        }));
        setStates(normalized);
        const total = res.data.total || normalized.length;
        setTotalRecords(total);
      } else {
        toast.error("Failed to load states");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load states");
    }
  };

  useEffect(() => {
    loadStates();
  }, [page, limit]);

  const loadInactive = async () => {
    try {
      const res = await getInactiveStatesApi();
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = rows.map(r => ({
            id: r.Id || r.id,
            name: r.Name || r.name,
            countryId: r.CountryId || r.countryId,
            countryName: r.Country?.Name || r.countryName || "N/A"
        }));
        setInactiveStates(normalized);
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
      return loadStates();
    }
    try {
      const res = await searchStateApi(text);
      if (res?.status === 200) {
        const rows = res.data || [];
        const normalized = rows.map(r => ({
             id: r.Id || r.id,
            name: r.Name || r.name,
            countryId: r.CountryId || r.countryId,
            countryName: r.Country?.Name || r.countryName || "N/A"
        }));
        setStates(normalized);
        setTotalRecords(rows.length);
      }
    } catch (err) {
        console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Name required");
    if (!newData.countryId) return toast.error("Country required");
    
    try {
      const res = await addStateApi({ ...newData, userId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Added");
        setNewData({ name: "", countryId: "" });
        setModalOpen(false);
        setPage(1); 
        loadStates();
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
    
    try {
      const res = await updateStateApi(editData.id, {
        name: editData.name,
        countryId: editData.countryId,
        userId
      });
      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadStates();
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
      const res = await deleteStateApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadStates();
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
      const res = await restoreStateApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadStates();
        loadInactive();
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  // --- QUICK ADD HANDLER ---
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
                      if(modalOpen) setNewData(prev => ({ ...prev, countryId: createdId }));
                      if(editModalOpen) setEditData(prev => ({ ...prev, countryId: createdId }));
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

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">States</h2>

          <div className="flex flex-wrap items-center gap-1 mb-4">
             <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
                <Search size={16} className="text-gray-300" />
                <input
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent pl-2 text-sm w-full outline-none"
                />
              </div>
              {hasPermission(PERMISSIONS.STATES.CREATE) && (
              <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded">
                <Plus size={16} /> New State
              </button>
              )}
              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadStates();
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

          <div className="flex-grow overflow-auto min-h-0">
            <table className="w-[600px] border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                        {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                        {visibleColumns.name && <SortableHeader label="Name" sortOrder={sortConfig.key === "name" ? sortConfig.direction : null} onClick={() => handleSort("name")} />}
                        {visibleColumns.country && <SortableHeader label="Country" sortOrder={sortConfig.key === "countryName" ? sortConfig.direction : null} onClick={() => handleSort("countryName")} />}
                    </tr>
                </thead>
                <tbody>
                    {!sortedStates.length && !showInactive && (
                         <tr><td colSpan="3" className="text-center py-4 text-gray-400">No records found</td></tr>
                    )}
                    {!showInactive && sortedStates.map(r => (
                        <tr key={r.id} onClick={() => {
                            setEditData({ id: r.id, name: r.name, countryId: r.countryId, isInactive: false });
                            setEditModalOpen(true);
                        }} className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-center">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.country && <td className="px-2 py-1">{r.countryName}</td>}
                        </tr>
                    ))}
                    {showInactive && inactiveStates.map(r => (
                        <tr key={`inactive-${r.id}`} onClick={() => {
                            setEditData({ id: r.id, name: r.name, countryId: r.countryId, isInactive: true });
                            setEditModalOpen(true);
                        }} className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer text-center">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.country && <td className="px-2 py-1">{r.countryName}</td>}
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
                  loadStates();
                }}
              />
        </div>
      </div>

       {/* MODALS */}
       {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
               <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                  <h2 className="font-semibold">New State</h2>
                  <button onClick={() => setModalOpen(false)}><X size={20}/></button>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                      <label className="text-sm">Name *</label>
                      <input value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                  </div>
                  <div>
                      <label className="text-sm">Country *</label>
                      <div className="flex items-center gap-2">
                          <SearchableSelect
                            options={countries.map(c => ({ id: c.id, name: c.name }))}
                            value={newData.countryId}
                            onChange={(val) => setNewData({...newData, countryId: val})}
                            placeholder="Select Country"
                            className="w-full"
                            direction="up"
                          />
                          {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (<button onClick={() => setAddCountryModalOpen(true)} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700">
                               <Star size={18} className="text-yellow-400" />
                           </button>)}
                      </div>
                  </div>
               </div>
               <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
                   {hasPermission(PERMISSIONS.STATES.CREATE) && (
                   <button onClick={handleAdd} className="bg-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-600"><Save size={16}/> Save</button>
                   )}
               </div>
            </div>
          </div>
       )}

       {editModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
               <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                  <h2 className="font-semibold">{editData.isInactive ? "Restore State" : "Edit State"}</h2>
                  <button onClick={() => setEditModalOpen(false)}><X size={20}/></button>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                      <label className="text-sm">Name *</label>
                      <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50" />
                  </div>
                   <div>
                      <label className="text-sm">Country *</label>
                      <div className="flex items-center gap-2">
                          <SearchableSelect
                            options={countries.map(c => ({ id: c.id, name: c.name }))}
                            value={editData.countryId}
                            onChange={(val) => setEditData({...editData, countryId: val})}
                            placeholder="Select Country"
                            disabled={editData.isInactive}
                            className="w-full"
                            direction="up"
                          />
                          {!editData.isInactive && (
                              <button onClick={() => setAddCountryModalOpen(true)} className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700">
                                   <Star size={18} className="text-yellow-400" />
                               </button>
                          )}
                      </div>
                  </div>
               </div>
               <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
                   {editData.isInactive ? (
                       <button onClick={handleRestore} className="bg-green-600 px-4 py-2 rounded flex items-center gap-2"><ArchiveRestore size={16}/> Restore</button>
                   ) : (
                       hasPermission(PERMISSIONS.STATES.DELETE) && (
                       <button onClick={handleDelete} className="bg-red-600 px-4 py-2 rounded flex items-center gap-2"><Trash2 size={16}/> Delete</button>
                       )
                   )}
                   {!editData.isInactive && hasPermission(PERMISSIONS.STATES.EDIT) && (
                       <button onClick={handleUpdate} className="bg-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-600"><Save size={16}/> Save</button>
                   )}
               </div>
            </div>
          </div>
       )}

       {/* QUICK ADD COUNTRY MODAL */}
       {addCountryModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
                <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
                    <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                        <h2 className="font-semibold">Add Country</h2>
                        <button onClick={() => setAddCountryModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-5">
                        <label className="text-sm">Country Name *</label>
                        <input 
                            value={newCountryName} 
                            onChange={e => setNewCountryName(e.target.value)} 
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                            autoFocus
                        />
                    </div>
                    <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
                        <button onClick={handleAddCountry} className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">Save</button>
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

export default States;
