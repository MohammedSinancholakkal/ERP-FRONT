import React, { useState, useEffect } from "react";
import {
  Star,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
// import SortableHeader from "../../components/SortableHeader";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";

import {
  addStateApi,
//   getStatesApi,
  updateStateApi,
  deleteStateApi,
//   searchStateApi,
//   getInactiveStatesApi,
  restoreStateApi,
  getCountriesApi,
  addCountryApi,
} from "../../services/allAPI";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const States = () => {
  const { theme } = useTheme();
  const { 
    loadStates: loadStatesCtx, 
    // refreshStates, 
    loadInactiveStates: loadInactiveCtx, 
    refreshInactiveStates 
  } = useMasters();

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
  // const [searchColumn, setSearchColumn] = useState(""); // Moved to Modal

  // const toggleColumn = (col) => { ... } // Moved to Modal
  // const restoreDefaultColumns = () => { ... } // Moved to Modal

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
  const loadStates = async (forceRefresh = false) => {
    const { data, total } = await loadStatesCtx(page, limit, searchText, forceRefresh);
    setStates(data || []);
    setTotalRecords(total || 0);
  };

  useEffect(() => {
    loadStates();
  }, [page, limit]);

  const loadInactive = async () => {
    const data = await loadInactiveCtx();
    setInactiveStates(data || []);
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
        const { data, total } = await loadStatesCtx(1, limit, "");
        setStates(data || []);
        setTotalRecords(total || 0);
        return;
    }
    const { data, total } = await loadStatesCtx(1, limit, text);
    setStates(data || []);
    setTotalRecords(total || 0);
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
        // refreshStates();
        loadStates(true);
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
        // refreshStates();
        loadStates(true);
        if (showInactive) {
            refreshInactiveStates();
            loadInactive();
        }
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const handleDelete = async () => {
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
          try {
            const res = await deleteStateApi(editData.id, { userId });
            if (res?.status === 200) {
              toast.success("Deleted");
              setEditModalOpen(false);
              // refreshStates();
              loadStates(true);
              if (showInactive) {
                  refreshInactiveStates();
                  loadInactive();
              }
            } else {
              toast.error("Delete failed");
            }
          } catch (err) {
              console.error(err);
              toast.error("Server error");
          }
        }
      });
  };

  const handleRestore = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to restore this state?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restore it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await restoreStateApi(editData.id, { userId });
          if (res?.status === 200) {
            toast.success("Restored");
            setEditModalOpen(false);
            // refreshStates();
            loadStates(true);
            refreshInactiveStates();
            loadInactive();
          } else {
            toast.error("Restore failed");
          }
        } catch (err) {
            console.error(err);
            toast.error("Server error");
        }
      }
    });

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

  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.name && { key: "name", label: "Name", sortable: true },
    visibleColumns.country && { key: "countryName", label: "Country", sortable: true },
  ].filter(Boolean);

  return (
    <PageLayout>
      <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <div className="flex flex-col h-full overflow-hidden gap-2">
          <h2 className="text-2xl font-semibold mb-4">States</h2>

          <MasterTable
            columns={tableColumns}
            data={sortedStates}
            inactiveData={inactiveStates}
            showInactive={showInactive}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowClick={(item, isInactive) => {
              setEditData({
                id: item.id,
                name: item.name,
                countryId: item.countryId,
                isInactive: isInactive,
              });
              setEditModalOpen(true);
            }}
            // Action Bar Props
            search={searchText}
            onSearch={handleSearch}
            onCreate={() => setModalOpen(true)}
            createLabel="New State"
            permissionCreate={hasPermission(PERMISSIONS.STATES.CREATE)}
            onRefresh={() => {
              setSearchText("");
              setPage(1);
              loadStates();
            }}
            onColumnSelector={() => setColumnModal(true)}
            onToggleInactive={async () => {
              if (!showInactive) await loadInactive();
              setShowInactive((s) => !s);
            }}
          />

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

       {/* ADD STATE MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New State"
       >
          <div className="space-y-4">
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
       </AddModal>

       {/* EDIT STATE MODAL */}
       <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onRestore={handleRestore}
          isInactive={editData.isInactive}
          title={editData.isInactive ? "Restore State" : "Edit State"}
          permissionDelete={hasPermission(PERMISSIONS.STATES.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.STATES.EDIT)}
       >
           <div className="space-y-4">
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
       </EditModal>

       {/* QUICK ADD COUNTRY MODAL */}
       <AddModal
          isOpen={addCountryModalOpen}
          onClose={() => setAddCountryModalOpen(false)}
          onSave={handleAddCountry}
          title="Add Country"
       >
            <div className="">
                <label className="text-sm">Country Name *</label>
                <input 
                    value={newCountryName} 
                    onChange={e => setNewCountryName(e.target.value)} 
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                    autoFocus
                />
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

export default States;
