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
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SortableHeader from "../../components/SortableHeader";
import toast from "react-hot-toast";

import {
  addSupplierGroupApi,
  getSupplierGroupsApi,
  updateSupplierGroupApi,
  deleteSupplierGroupApi,
  searchSupplierGroupApi,
  getInactiveSupplierGroupsApi,
  restoreSupplierGroupApi,
} from "../../services/allAPI";

const SupplierGroups = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [supplierGroups, setSupplierGroups] = useState([]);
  const [inactiveSupplierGroups, setInactiveSupplierGroups] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newData, setNewData] = useState({ name: "", description: "" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    description: "",
    isInactive: false,
  });

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
    description: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

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

  const sortedSupplierGroups = [...supplierGroups];
  if (sortConfig.key) {
    sortedSupplierGroups.sort((a, b) => {
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
  const loadSupplierGroups = async () => {
    try {
      const res = await getSupplierGroupsApi(page, limit);
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = rows.map(r => ({
            id: r.Id || r.id,
            name: r.Name || r.name,
            description: r.Description || r.description
        }));
        setSupplierGroups(normalized);
        const total = res.data.total || normalized.length;
        setTotalRecords(total);
      } else {
        toast.error("Failed to load supplier groups");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load supplier groups");
    }
  };

  useEffect(() => {
    loadSupplierGroups();
  }, [page, limit]);

  const loadInactive = async () => {
    try {
      const res = await getInactiveSupplierGroupsApi();
      if (res?.status === 200) {
        const rows = res.data.records || res.data || [];
        const normalized = rows.map(r => ({
            id: r.Id || r.id,
            name: r.Name || r.name,
            description: r.Description || r.description
        }));
        setInactiveSupplierGroups(normalized);
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
        return loadSupplierGroups();
    }
    try {
      const res = await searchSupplierGroupApi(text);
      if (res?.status === 200) {
        const rows = res.data || [];
        const normalized = rows.map(r => ({
            id: r.Id || r.id,
            name: r.Name || r.name,
            description: r.Description || r.description
        }));
        setSupplierGroups(normalized);
        setTotalRecords(rows.length);
      }
    } catch (err) {
        console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Name required");
    try {
      const res = await addSupplierGroupApi({ ...newData, userId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Added");
        setNewData({ name: "", description: "" });
        setModalOpen(false);
        setPage(1); 
        loadSupplierGroups();
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
    try {
      const res = await updateSupplierGroupApi(editData.id, {
        name: editData.name,
        description: editData.description,
        userId
      });
      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadSupplierGroups();
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
      const res = await deleteSupplierGroupApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadSupplierGroups();
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
      const res = await restoreSupplierGroupApi(editData.id, { userId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadSupplierGroups();
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
          <h2 className="text-2xl font-semibold mb-4">Supplier Groups</h2>

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
                <Plus size={16} /> New Supplier Group
              </button>
              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadSupplierGroups();
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
                        {visibleColumns.description && <SortableHeader label="Description" sortOrder={sortConfig.key === "description" ? sortConfig.direction : null} onClick={() => handleSort("description")} />}
                    </tr>
                </thead>
                <tbody>
                    {!sortedSupplierGroups.length && !showInactive && (
                         <tr><td colSpan="3" className="text-center py-4 text-gray-400">No records found</td></tr>
                    )}
                    {!showInactive && sortedSupplierGroups.map(r => (
                        <tr key={r.id} onClick={() => {
                            setEditData({ id: r.id, name: r.name, description: r.description, isInactive: false });
                            setEditModalOpen(true);
                        }} className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-center">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.description && <td className="px-2 py-1">{r.description}</td>}
                        </tr>
                    ))}
                    {showInactive && inactiveSupplierGroups.map(r => (
                        <tr key={`inactive-${r.id}`} onClick={() => {
                            setEditData({ id: r.id, name: r.name, description: r.description, isInactive: true });
                            setEditModalOpen(true);
                        }} className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer text-center">
                            {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                            {visibleColumns.name && <td className="px-2 py-1">{r.name}</td>}
                            {visibleColumns.description && <td className="px-2 py-1">{r.description}</td>}
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
                  loadSupplierGroups();
                }}
              />
        </div>
      </div>

       {/* MODALS */}
       {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="w-[500px] bg-gray-900 text-white rounded-lg border border-gray-700">
               <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                  <h2 className="font-semibold">New Supplier Group</h2>
                  <button onClick={() => setModalOpen(false)}><X size={20}/></button>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                      <label className="text-sm">Name *</label>
                      <input value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                  </div>
                  <div>
                      <label className="text-sm">Description</label>
                      <textarea value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" rows="3" />
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
            <div className="w-[500px] bg-gray-900 text-white rounded-lg border border-gray-700">
               <div className="flex justify-between px-5 py-3 border-b border-gray-700">
                  <h2 className="font-semibold">{editData.isInactive ? "Restore Supplier Group" : "Edit Supplier Group"}</h2>
                  <button onClick={() => setEditModalOpen(false)}><X size={20}/></button>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                      <label className="text-sm">Name *</label>
                      <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50" />
                  </div>
                  <div>
                      <label className="text-sm">Description</label>
                      <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} disabled={editData.isInactive} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50" rows="3" />
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

       {columnModal && (
           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
               <div className="w-[500px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-semibold">Column Picker</h3>
                       <button onClick={() => setColumnModal(false)}><X size={20}/></button>
                   </div>
                   <div className="space-y-2">
                       {Object.keys(defaultColumns).map(col => (
                           <div key={col} className="flex justify-between bg-gray-800 p-2 rounded">
                               <span className="capitalize">{col}</span>
                               <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} />
                           </div>
                       ))}
                   </div>
                   <div className="mt-4 flex justify-end gap-2">
                       <button onClick={restoreDefaultColumns} className="bg-gray-700 px-3 py-1 rounded text-sm">Default</button>
                       <button onClick={() => setColumnModal(false)} className="bg-blue-600 px-3 py-1 rounded text-sm">Close</button>
                   </div>
               </div>
           </div>
       )}

    </PageLayout>
  );
};

export default SupplierGroups;
