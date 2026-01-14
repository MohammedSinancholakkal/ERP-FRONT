import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

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
  searchRegionApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

import MasterTable from "../../components/MasterTable";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const Territories = () => {
  // ===============================
  // State Declarations
  // ===============================
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  
  // Quick Add Region
  const [addRegionModalOpen, setAddRegionModalOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");

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
    items.map((r) => ({
      id: r.Id ?? r.id ?? null,
      name: r.TerritoryDescription ?? r.territoryDescription ?? r.name ?? "",
      regionId: r.RegionId ?? r.regionId ?? "",
      regionName: r.RegionName ?? r.regionName ?? "N/A",
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
      const res = await getTerritoriesApi(page, limit);
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
  }, [page, limit]);

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
    if (!newItem.regionId) return toast.error("Region is required");

    // Check for duplicates
    try {
      const searchRes = await searchTerritoryApi(newItem.name.trim());
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        const existing = rows.find(r => 
           (r.TerritoryDescription || r.territoryDescription || r.name || r.Name || "").toLowerCase() === newItem.name.trim().toLowerCase() &&
           String(r.RegionId || r.regionId) === String(newItem.regionId)
        );
        if (existing) return toast.error("Territory with this name already exists in the selected region");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const payload = {
          territoryDescription: newItem.name.trim(),
          regionId: newItem.regionId,
          userId: currentUserId
      };
      const res = await addTerritoryApi(payload);

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Territory added");
        setModalOpen(false);
        setNewItem({ name: "", regionId: "" });
        setPage(1);
        loadRows();
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // ===============================
  // Quick Add Region
  // ===============================
  const handleAddRegion = async () => {
      if(!newRegionName.trim()) return toast.error("Region name required");

      // Check duplicate
      try {
        const searchRes = await searchRegionApi(newRegionName.trim());
        if (searchRes?.status === 200) {
             const rows = searchRes.data.records || searchRes.data || [];
             const existing = rows.find(r => (r.Name || r.name || r.RegionName || r.regionName || "").toLowerCase() === newRegionName.trim().toLowerCase());
             if (existing) return toast.error("Region with this name already exists");
        }
      } catch(err) {
          console.error(err);
          return toast.error("Error checking duplicates");
      }

      try {
          const res = await addRegionApi({ regionName: newRegionName, userId: currentUserId });
          if(res?.status === 200 || res?.status === 201) {
              toast.success("Region added");
              setAddRegionModalOpen(false);
              setNewRegionName("");
              
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
                  const created = mapped.find(r => r.name.toLowerCase() === newRegionName.toLowerCase());
                  if(created) {
                      if(modalOpen) setNewItem(prev => ({ ...prev, regionId: created.id }));
                      if(editModalOpen) setEditItem(prev => ({ ...prev, regionId: created.id }));
                  }
              }
          }
      } catch (err) {
          console.error(err);
          toast.error("Failed to add region");
      }
  }

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
  };

  const handleRestore = async () => {
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
  };


  // ===============================
  // Render UI
  // ===============================
  return (
    <PageLayout>
    <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
      <div className="flex flex-col h-full overflow-hidden gap-2">

        <h2 className="text-2xl font-semibold mb-4">Territories</h2>

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
         title="New Territory"
       >
          <div className="space-y-4">
            <div>
                <label className="text-sm text-gray-300">Territory Description *</label>
                <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
                />
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
                        className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700"
                        title="Quick Add Region"
                    >
                        <Star size={18} className="text-yellow-400" />
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
       >
          <div className="space-y-4">
             <div>
                <label className="text-sm text-gray-300">Territory Description *</label>
                <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))}
                    disabled={editItem.isInactive}
                    className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                />
             </div>
             <div>
                <label className="text-sm text-gray-300">Region *</label>
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
                    <button
                        onClick={() => setAddRegionModalOpen(true)}
                        className="p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700"
                        title="Quick Add Region"
                    >
                        <Star size={18} className="text-yellow-400" />
                    </button>
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
            zIndex={60}
       >
           <div>
               <label className="text-sm text-gray-300">Region Name *</label>
               <input 
                   value={newRegionName} 
                   onChange={e => setNewRegionName(e.target.value)} 
                   className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
                   autoFocus
               />
           </div>
       </AddModal>

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