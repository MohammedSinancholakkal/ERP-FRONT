import React, { useEffect, useState } from "react";
import { Star, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  getTerritoriesApi,
  addTerritoryApi,
  updateTerritoryApi,
  deleteTerritoryApi,
  searchTerritoryApi,
  getInactiveTerritoriesApi,
  restoreTerritoryApi,
  getRegionsApi,
  addRegionApi,
  updateRegionApi,
  searchRegionApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";

import MasterTable from "../../components/MasterTable";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ContentCard from "../../components/ContentCard";
import SearchableSelect from "../../components/SearchableSelect";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";

const Territories = () => {
  const { theme } = useTheme();
  const {
      refreshTerritories,
      refreshInactiveTerritories,
      loadTerritories: loadTerritoriesCtx
  } = useMasters();
  // ===============================
  // State Declarations
  // ===============================
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  
  const [addRegionModalOpen, setAddRegionModalOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");

  const [editRegionModalOpen, setEditRegionModalOpen] = useState(false);
  const [regionEditData, setRegionEditData] = useState({ id: null, name: "" });

  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [regions, setRegions] = useState([]);

  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  const [newItem, setNewItem] = useState({ 
    name: "", 
    regionId: ""
  });

  const [editItem, setEditItem] = useState({
    id: null,
    name: "",
    regionId: "",
    isInactive: false,
  });

  const defaultColumns = { 
    id: true, 
    name: true, 
    regionName: true 
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

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

  // ===============================
  // Helpers
  // ===============================
  const capitalize = (str) => {
    if (typeof str !== 'string' || !str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const normalizeRows = (items = []) =>
    items.map((r) => ({
      id: r.Id ?? r.id ?? null,
      name: capitalize(r.TerritoryDescription ?? r.territoryDescription ?? r.name ?? ""),
      regionId: r.RegionId ?? r.regionId ?? "",
      regionName: capitalize(r.RegionName ?? r.regionName ?? "N/A"),
    }));

  // ===============================
  // Load Dropdowns & Data
  // ===============================
  const loadRegions = async () => {
    try {
        const res = await getRegionsApi(1, 10000); // fetch all
        if (res?.status === 200) {
            const data = res.data.records || res.data || [];
            setRegions(data.map(r => ({
                id: r.RegionId ?? r.regionId ?? r.Id ?? r.id,
                name: r.RegionName ?? r.regionName ?? r.Name ?? r.name
            })));
        }
    } catch (err) {
        console.error(err);
    }
  };

  const loadRows = async () => {
    try {
      const res = await getTerritoriesApi(page, limit, sortConfig.key, sortConfig.direction);
      if (res?.status === 200) {
        const data = res.data;
        let items = [];

        if (Array.isArray(data.records)) {
          items = data.records;
          setTotalRecords(data.total ?? data.records.length);
        } else if (Array.isArray(data)) {
          items = data;
          setTotalRecords(items.length);
        } else {
          items = [];
          setTotalRecords(0);
        }

        setRows(normalizeRows(items));
      } else {
        toast.error("Failed to load territories");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load territories");
    }
  };

  const loadInactive = async () => {
    try {
      const res = await getInactiveTerritoriesApi();
      if (res?.status === 200) {
        const items = res.data.records ?? res.data ?? [];
        setInactiveRows(normalizeRows(items));
      }
    } catch (err) {
      console.error("Load inactive error:", err);
    }
  };

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    loadRows();
  }, [page, limit, sortConfig]);

  // ===============================
  // Search
  // ===============================
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      setPage(1);
      loadRows();
      return;
    }

    try {
      const res = await searchTerritoryApi(value);
      if (res?.status === 200) {
        const items = Array.isArray(res.data)
          ? res.data
          : res.data.records ?? [];
        setRows(normalizeRows(items));
        setTotalRecords(items.length);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // ===============================
  // Add Territory
  // ===============================
  const handleAdd = async () => {
    if (!newItem.name?.trim()) return toast.error("Territory name is required");
    const nameToCheck = newItem.name.trim();

    if (!newItem.regionId) return toast.error("Region is required");

    // Check for duplicates
    try {
      const searchRes = await searchTerritoryApi(nameToCheck);
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        const existing = rows.find(r => 
           (r.TerritoryDescription || r.territoryDescription || r.name || r.Name || "").toLowerCase() === nameToCheck.toLowerCase() &&
           String(r.RegionId || r.regionId) === String(newItem.regionId)
        );
        if (existing) {
             toast.error("Territory with this name already exists in the selected region");
             return; // Stop execution
        }
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const payload = {
          territoryDescription: nameToCheck,
          regionId: Number(newItem.regionId), // Ensure it's a number/valid type
          userId: currentUserId
      };
      const res = await addTerritoryApi(payload);

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Territory added");
        setModalOpen(false);
        setNewItem({ name: "", regionId: "" });
        setPage(1);
        loadRows();
      } else {
         toast.error(res?.data?.message || "Failed to add territory");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Server error");
    }
  };

  // ===============================
  // Quick Add Region
  // ===============================
  const handleAddRegion = async () => {
      const nameToAdd = newRegionName.trim();
      if(!nameToAdd) return toast.error("Region name required");

      // Check duplicate
      try {
        const searchRes = await searchRegionApi(nameToAdd);
        if (searchRes?.status === 200) {
             const rows = searchRes.data.records || searchRes.data || [];
             const existing = rows.find(r => (r.Name || r.name || r.RegionName || r.regionName || "").toLowerCase() === nameToAdd.toLowerCase());
             if (existing) return toast.error("Region with this name already exists");
        }
      } catch(err) {
          console.error(err);
          return toast.error("Error checking duplicates");
      }

      try {
          const res = await addRegionApi({ regionName: nameToAdd, userId: currentUserId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("Region added");
              setAddRegionModalOpen(false);
              setNewRegionName("");
              
              let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

              // Refresh regions
              const resR = await getRegionsApi(1, 10000);
              if(resR?.status === 200) {
                  const data = resR.data.records || resR.data || [];
                  const mapped = data.map(r => ({
                    id: r.RegionId ?? r.regionId ?? r.Id ?? r.id,
                    name: r.RegionName ?? r.regionName ?? r.Name ?? r.name
                  }));
                  setRegions(mapped);

                  // Auto select the new region
                  if(!createdId) {
                      const created = mapped.find(r => r.name.trim().toLowerCase() === nameToAdd.toLowerCase());
                      if(created) createdId = created.id;
                  }

                  if(createdId) {
                      if(modalOpen) setNewItem(prev => ({ ...prev, regionId: createdId }));
                      if(editModalOpen) setEditItem(prev => ({ ...prev, regionId: createdId }));
                  }
              }
          }
      } catch (err) {
          console.error(err);
          toast.error("Failed to add region");
      }
  }

  const handleEditRegionSave = async () => {
    if (!regionEditData.name?.trim()) return toast.error("Name required");
    try {
        const res = await updateRegionApi(regionEditData.id, { regionName: regionEditData.name, userId: currentUserId });
        if (res?.status === 200) {
            toast.success("Region updated");
            setEditRegionModalOpen(false);
            const resR = await getRegionsApi(1, 10000);
            if(resR?.status === 200) {
                const data = resR.data.records || resR.data || [];
                setRegions(data.map(r => ({
                  id: r.RegionId ?? r.regionId ?? r.Id ?? r.id,
                  name: r.RegionName ?? r.regionName ?? r.Name ?? r.name
                })));
            }
        } else toast.error("Update failed");
    } catch(err) { console.error(err); toast.error("Server error"); }
  };

  // ===============================
  // Edit / Restore
  // ===============================
  const openEdit = (row, inactive = false) => {
    setEditItem({
      id: row.id,
      name: row.name,
      regionId: row.regionId,
      isInactive: inactive,
    });

    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem.name?.trim()) return toast.error("Territory name is required");
    if (!editItem.regionId) return toast.error("Region is required");

    // Check for duplicates
    try {
      const searchRes = await searchTerritoryApi(editItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        const existing = rows.find(r => 
           (r.TerritoryDescription || r.territoryDescription || r.name || r.Name || "").toLowerCase() === editItem.name.trim().toLowerCase() &&
           String(r.RegionId || r.regionId) === String(editItem.regionId) &&
           (r.Id || r.id) !== editItem.id
        );
        if (existing) return toast.error("Territory with this name already exists in the selected region");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const payload = {
        territoryDescription: editItem.name.trim(),
        regionId: editItem.regionId,
        userId: currentUserId
      };
      const res = await updateTerritoryApi(editItem.id, payload);

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadRows();
        if (showInactive) loadInactive();
      }
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    const result = await showDeleteConfirm();
    if (result.isConfirmed) {
      if (result.isConfirmed) {
        try {
          const res = await deleteTerritoryApi(editItem.id, {
            userId: currentUserId,
          });

          if (res?.status === 200) {
            toast.success("Deleted");
            setEditModalOpen(false);
            loadRows();
            if (showInactive) loadInactive();
          }
        } catch (err) {
          console.error(err);
          toast.error("Delete failed");
        }
      }
    }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm();
    if (result.isConfirmed) {
      if (result.isConfirmed) {
        try {
          const res = await restoreTerritoryApi(editItem.id, {
            userId: currentUserId,
          });

          if (res?.status === 200) {
            toast.success("Restored");
            setEditModalOpen(false);
            loadRows();
            loadInactive();
          }
        } catch (err) {
          console.error(err);
          toast.error("Restore failed");
        }
      }
    }
  };


  // ===============================
  // Render UI
  // ===============================
  return (
    <PageLayout>
    <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
      <ContentCard>
        <div className="flex flex-col h-full overflow-hidden gap-2">

          <h2 className="text-xl font-bold text-[#6448AE] mb-2">Territories</h2>
          <hr className="mb-4 border-gray-300" />

        <MasterTable
            columns={[
                visibleColumns.id && { key: 'id', label: 'ID', sortable: true },
                visibleColumns.name && { key: 'name', label: 'Territory Description', sortable: true },
                visibleColumns.regionName && { key: 'regionName', label: 'Region Name', sortable: true },
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
            createLabel="New Territory"
            permissionCreate={hasPermission(PERMISSIONS.TERRITORIES.CREATE)}
            onRefresh={() => {
                setSearchText("");
                setPage(1);
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                refreshTerritories();
                refreshInactiveTerritories();
                loadRows();
            }}
            onColumnSelector={() => setColumnModalOpen(true)}
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
            setSortConfig({ key: "id", direction: "asc" });
            setShowInactive(false);
            refreshTerritories();
            refreshInactiveTerritories();
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
         title="New Territory"
       >
          <div className="space-y-4">
              <div>
                  <div className="flex gap-2 items-start">
                      <div className="flex-grow">
                          <InputField
                              label="Territory Description"
                              value={newItem.name}
                              onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                              className="mt-1"
                              required
                          />
                      </div>
                      <div className="w-[34px] h-[34px]"></div>
                  </div>
              </div>
            <div>
                <label className="text-sm text-gray-300">Region *</label>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-grow">
                        <SearchableSelect
                            options={regions.map(r => ({ id: r.id, name: r.name }))}
                            value={newItem.regionId}
                            onChange={(val) => setNewItem((p) => ({ ...p, regionId: val }))}
                            placeholder="Select Region"
                            className="w-full"
                            direction="up"
                        />
                    </div>
                    {hasPermission(PERMISSIONS.REGIONS.CREATE) && (
                    <button
                        onClick={() => setAddRegionModalOpen(true)}
                        className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        title="Quick Add Region"
                    >
                        <Star size={16} className="" />
                    </button>
                    )}
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
          isInactive={editItem.isInactive}
          title={editItem.isInactive ? "Restore Territory" : "Edit Territory"}
          permissionDelete={hasPermission(PERMISSIONS.TERRITORIES.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.TERRITORIES.EDIT)}
          saveText="Update"
       >
          <div className="space-y-4">
             <div>
                 <div className="flex gap-2 items-start">
                     <div className="flex-grow">
                        <InputField
                            label="Territory Description"
                            value={editItem.name}
                            onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                            disabled={editItem.isInactive}
                            className="mt-1"
                            required
                        />
                     </div>
                     <div className="w-[34px] h-[34px]"></div>
                 </div>
             </div>
             <div>
                <label className="text-sm text-dark">Region *</label>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-grow">
                        <SearchableSelect
                            options={regions.map(r => ({ id: r.id, name: r.name }))}
                            value={editItem.regionId}
                            onChange={(val) => setEditItem((p) => ({ ...p, regionId: val }))}
                            placeholder="Select Region"
                            className="w-full"
                            disabled={editItem.isInactive}
                            direction="up"
                        />
                    </div>
                    {!editItem.isInactive && hasPermission(PERMISSIONS.REGIONS.CREATE) && (
                        <div className="flex gap-1">
                             {editItem.regionId && (
                                <button
                                    onClick={() => {
                                        const r = regions.find(x => String(x.id) == String(editItem.regionId));
                                        setRegionEditData({ id: editItem.regionId, name: r?.name || "" });
                                        setEditRegionModalOpen(true);
                                    }}
                                    className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                                    title="Edit Region"
                                >
                                    <Pencil size={16} />
                                </button>
                             )}
                        </div>
                    )}
                </div>
             </div>
          </div>
       </EditModal>
     
       {/* QUICK ADD REGION MODAL (Using AddModal reused) */}
       <AddModal
            isOpen={addRegionModalOpen}
            onClose={() => setAddRegionModalOpen(false)}
            onSave={handleAddRegion}
            title="New Region"
            zIndex={1060}
       >
           <div>
               <div className="flex gap-2 items-start">
                   <div className="flex-grow">
                       <InputField
                           label="Region Name"
                           value={newRegionName}
                           onChange={e => setNewRegionName(e.target.value)}
                           className="mt-1"
                           autoFocus
                           required
                       />
                   </div>
                   <div className="w-[34px] h-[34px]"></div>
               </div>
           </div>
       </AddModal>

       {editRegionModalOpen && (
           <AddModal isOpen={true} onClose={() => setEditRegionModalOpen(false)} onSave={handleEditRegionSave} title={`Edit Region (${regionEditData.name})`} saveText="Update">
               <InputField value={regionEditData.name} onChange={e => setRegionEditData(p => ({...p, name: e.target.value}))} autoFocus required />
           </AddModal>
       )}

       {/* COLUMN PICKER MODAL */}
       <ColumnPickerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
       />

    </PageLayout>
  );
};

export default Territories;