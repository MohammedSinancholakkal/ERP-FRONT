import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SortableHeader from "../../components/SortableHeader";
import toast from "react-hot-toast";

import {
  addRegionApi,
  getRegionsApi,
  updateRegionApi,
  deleteRegionApi,
  searchRegionApi,
  getInactiveRegionsApi,
  restoreRegionApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const Regions = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newData, setNewData] = useState({ name: "" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    isInactive: false,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId || 1;

  const [searchText, setSearchText] = useState("");

  const defaultColumns = {
    id: true,
    name: true,
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

  // LOAD
  const loadRows = async () => {
    try {
      const res = await getRegionsApi(page, limit);
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = rows.map(r => ({
            id: r.regionId || r.id,
            name: r.regionName || r.name
        }));
        setRows(normalized);
        const total = res.data.total || normalized.length;
        setTotalRecords(total);
      } else {
        toast.error("Failed to load regions");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load regions");
    }
  };

  useEffect(() => {
    loadRows();
  }, [page, limit]);

  const loadInactive = async () => {
    try {
      const res = await getInactiveRegionsApi();
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = rows.map(r => ({
            id: r.regionId || r.id,
            name: r.regionName || r.name
        }));
        setInactiveRows(normalized);
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
      const res = await searchRegionApi(text);
      if (res?.status === 200) {
        const rows = res.data || [];
        const normalized = rows.map(r => ({
            id: r.regionId || r.id,
            name: r.regionName || r.name
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
    try {
      const res = await addRegionApi({ regionName: newData.name, userId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Added");
        setNewData({ name: "" });
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
       setEditData({ id: row.id, name: row.name, isInactive: inactive });
       setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) return toast.error("Name required");
    try {
      const res = await updateRegionApi(editData.id, {
        regionName: editData.name,
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
      const res = await deleteRegionApi(editData.id, { userId });
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
      const res = await restoreRegionApi(editData.id, { userId });
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

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Regions</h2>

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
              {hasPermission(PERMISSIONS.REGIONS.CREATE) && (
              <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
                <Plus size={16} /> New Region
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

          <div className="flex-grow overflow-auto min-h-0">
            <table className="w-[500px] border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                        {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                        {visibleColumns.name && <SortableHeader label="Name" sortOrder={sortConfig.key === "name" ? sortConfig.direction : null} onClick={() => handleSort("name")} />}
                    </tr>
                </thead>
                <tbody className="text-center">
                    {!rows.length && !showInactive && (
                         <tr><td colSpan="2" className="text-center py-4 text-gray-400">No records found</td></tr>
                    )}
                    {!showInactive && sortedRows.map(r => (
                        <tr key={r.id} onClick={() => openEdit(r, false)} className="bg-gray-900 hover:bg-gray-700 cursor-pointer">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                        </tr>
                    ))}
                    {showInactive && inactiveRows.map(r => (
                        <tr key={`inactive-${r.id}`} onClick={() => openEdit(r, true)} className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
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
         title="New Region"
       >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300">Name *</label>
                  <input value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1" />
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
          title={editData.isInactive ? "Restore Region" : "Edit Region"}
          permissionDelete={hasPermission(PERMISSIONS.REGIONS.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.REGIONS.EDIT)}
       >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300">Name *</label>
                  <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1 disabled:opacity-50" />
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
    </PageLayout>
  );
};

export default Regions;