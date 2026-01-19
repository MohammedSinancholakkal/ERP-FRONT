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
import ContentCard from "../../components/ContentCard";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";

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
  searchCountryApi,
} from "../../services/allAPI";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";

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

 
  const sortedStates = states; 

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
    const { data, total } = await loadStatesCtx(page, limit, searchText, forceRefresh, sortConfig.key, sortConfig.direction);
    setStates(data || []);
    setTotalRecords(total || 0);
  };

  useEffect(() => {
    loadStates();
  }, [page, limit, sortConfig]);

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
        if (res?.status === 409) {
            toast.error(res?.data?.message || "State already exists");
        } else {
            toast.error("Failed to add");
        }
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
        if (res?.status === 409) {
             toast.error(res?.data?.message || "State already exists");
        } else {
            toast.error("Update failed");
        }
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
        const res = await deleteStateApi(editData.id, { userId });
        if (res?.status === 200) {
          showSuccessToast("Deleted");
          setEditModalOpen(false);
          // refreshStates();
          loadStates(true);
          if (showInactive) {
              refreshInactiveStates();
              loadInactive();
          }
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
        const res = await restoreStateApi(editData.id, { userId });
        if (res?.status === 200) {
          showSuccessToast("Restored");
          setEditModalOpen(false);
          // refreshStates();
          loadStates(true);
          refreshInactiveStates();
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

  // --- QUICK ADD HANDLER ---
  const handleAddCountry = async () => {
      if(!newCountryName.trim()) return toast.error("Name required");

      // Check for duplicates
      try {
        const searchRes = await searchCountryApi(newCountryName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data.records || searchRes.data || [];
            const existing = rows.find(r => (r.Name || r.name || "").toLowerCase() === newCountryName.trim().toLowerCase());
            if (existing) return toast.error("Country with this name already exists");
        }
      } catch (err) {
        console.error(err);
        return toast.error("Error checking duplicates");
      }

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
                  const created = rows.find(r => (r.Name || r.name || "").toLowerCase() === newCountryName.toLowerCase());
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
      <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">States</h2>
            <hr className="mb-4 border-gray-300" />

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
        </ContentCard>
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
                  <div className="flex gap-2 items-start">
                    <div className="flex-grow">
                      <InputField
                        label="Name"
                        value={newData.name}
                        onChange={e => setNewData({...newData, name: e.target.value})}
                        className=""
                        required
                      />
                    </div>
                    <div className="w-[34px] h-[34px]"></div>
                  </div>
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
                      {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (<button onClick={() => setAddCountryModalOpen(true)} className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                            <Star size={16} />
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
                  <div className="flex gap-2 items-start">
                    <div className="flex-grow">
                      <InputField
                        label="Name"
                        value={editData.name}
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        disabled={editData.isInactive}
                        className=""
                        required
                      />
                    </div>
                    <div className="w-[34px] h-[34px]"></div>
                  </div>
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
                          <button onClick={() => setAddCountryModalOpen(true)} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                               <Star size={16} className="" />
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
                <InputField
                    label="Country Name"
                    value={newCountryName}
                    onChange={e => setNewCountryName(e.target.value)}
                    className="mt-1"
                    autoFocus
                    required
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
