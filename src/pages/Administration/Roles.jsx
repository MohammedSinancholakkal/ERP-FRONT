import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ChevronRight,
  Lock,
  ChevronDown,
  Check,
  Ban,
  Save,
  Trash2,
  Search,
  ArchiveRestore
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";

import toast from "react-hot-toast";
import Swal from "sweetalert2";

// API
import {
  addRoleApi,
  getRolesApi,
  updateRoleApi,
  deleteRoleApi,
  searchRoleApi,
  getInactiveRolesApi,
  restoreRoleApi,
  getRolePermissionsApi,

  setRolePermissionsApi,
  getAllPermissionsApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";



// buildPermissionTree moved to backend


const PermissionItem = ({ item, level = 0, onToggle }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 hover:bg-white/5 rounded px-2 ${level > 0 ? "ml-6" : ""}`}
      >
        {/* Expand/Collapse */}
        <div 
          className="w-4 h-4 flex items-center justify-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {hasChildren && (
            expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
          )}
        </div>

        {/* Icon */}
        {item.granted ? (
           <Check size={16} className="text-green-500" />
        ) : (
           <Ban size={16} className="text-red-500" />
        )}

        {/* Name */}
        <span className="text-sm text-gray-200 flex-1">{item.name}</span>

        {/* Checkbox */}
        <div 
          onClick={() => onToggle(item.id)}
          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${item.granted ? "bg-blue-600 border-blue-600" : "border-gray-500 hover:border-gray-400"}`}
        >
             {item.granted && <Check size={12} className="text-white" />}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {item.children.map(child => (
            <PermissionItem key={child.id} item={child} level={level + 1} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};



// Functions moved inside component


const Roles = () => {
  const { theme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [roles, setRoles] = useState([]);
  const [inactiveRoles, setInactiveRoles] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newRole, setNewRole] = useState("");

  // EDIT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRole, setEditRole] = useState({
    id: null,
    roleName: "",
    isInactive: false,
  });

  // PERMISSIONS MODAL
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);

  // Load System Permissions
  useEffect(() => {
    const fetchPerms = async () => {
      const res = await getAllPermissionsApi();
      if (res?.status === 200) {
        // Backend returns tree now
        setAvailablePermissions(res.data);
      }
    };
    fetchPerms();
  }, []);

  // Normalize Helper
  const normalizeRows = (items = []) => 
    items.map(r => ({
      id: r.Id || r.id,
      name: r.Name || r.name || r.RoleName || r.roleName,
    }));

  const togglePermission = (id) => {
    // 1. Update the target item and its children (downwards)
    const updateRecursive = (items) => {
      return items.map(item => {
        if (item.id === id) {
          const newGranted = !item.granted;
          return {
            ...item,
            granted: newGranted,
            children: item.children ? setAllChildren(item.children, newGranted) : item.children
          };
        }
        if (item.children) {
          return {
            ...item,
            children: updateRecursive(item.children)
          };
        }
        return item;
      });
    };

    const setAllChildren = (items, status) => {
      return items.map(item => ({
        ...item,
        granted: status,
        children: item.children ? setAllChildren(item.children, status) : item.children
      }));
    };

    // 2. Update parents based on children (upwards)
    // We re-evaluate the entire tree after the downward update
    const evaluateParents = (items) => {
      return items.map(item => {
        if (item.children && item.children.length > 0) {
          const updatedChildren = evaluateParents(item.children); // Depth-first
          const allChildrenGranted = updatedChildren.every(c => c.granted);
          
          return {
            ...item,
            children: updatedChildren,
            granted: allChildrenGranted // Parent is true ONLY if ALL children are true
          };
        }
        return item;
      });
    };

    setPermissions(prev => {
      const step1 = updateRecursive(prev);
      const step2 = evaluateParents(step1);
      return step2;
    });
  };

  //pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // SEARCH
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    roleName: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  // Sort Active Records
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRoles = useMemo(() => {
    let sortableItems = [...roles];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
         if (typeof aValue === 'string') aValue = aValue.toLowerCase();
         if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [roles, sortConfig]);

  // LOAD ACTIVE ROLES
  const loadRoles = async () => {
    setSearchText("");
    const res = await getRolesApi(page, limit);
    if (res?.status === 200) {
      const rawRecords = res.data.records || [];
      const normalized = normalizeRows(rawRecords);

      // Filter out SuperAdmin (ID 1)
      const visibleRoles = normalized.filter(r => r.id !== 1 && r.name?.toLowerCase() !== 'superadmin');
      
      setRoles(visibleRoles);
      setTotalRecords(res.data.total); // Note: Total might be off by 1 in pagination but acceptable for now
    } else {
      toast.error("Failed to load roles");
    }
  };

  useEffect(() => {
    loadRoles();
  }, [page, limit]);

  // LOAD INACTIVE
  const loadInactive = async () => {
    const res = await getInactiveRolesApi();
    if (res?.status === 200) {
      const items = res.data.records || res.data;
      setInactiveRoles(normalizeRows(items));
    } else {
      toast.error("Failed to load inactive records");
    }
  };

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);
    if (text.trim() === "") return loadRoles();

    const res = await searchRoleApi(text);
    if (res?.status === 200) {
       const normalized = normalizeRows(res.data || []);
       // Filter out SuperAdmin
       const visibleRoles = normalized.filter(r => r.id !== 1 && r.name?.toLowerCase() !== 'superadmin');
      setRoles(visibleRoles);
    }
  };

  // ADD
  const handleAddRole = async () => {
    if (!newRole.trim()) return toast.error("Role name required");

    // Check duplicates
    try {
        const searchRes = await searchRoleApi(newRole.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.Name || r.name || r.RoleName)?.toLowerCase() === newRole.trim().toLowerCase()
            );
            if (existing) return toast.error("Role name already exists");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    const res = await addRoleApi({
      name: newRole,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Role added");
      setNewRole("");
      setModalOpen(false);
      loadRoles();
    } else if (res?.status === 409) {
      toast.error("Role already exists");
    } else {
      toast.error("Failed to add");
    }
  };

  // UPDATE
  const handleUpdateRole = async () => {
    if (!editRole.roleName.trim())
      return toast.error("Name cannot be empty");

    // Check duplicates
    try {
        const searchRes = await searchRoleApi(editRole.roleName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.Name || r.name || r.RoleName)?.toLowerCase() === editRole.roleName.trim().toLowerCase() &&
                (r.Id || r.id) !== editRole.id
            );
            if (existing) return toast.error("Role name already exists");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    const res = await updateRoleApi(editRole.id, {
      name: editRole.roleName,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Role updated");
      setEditModalOpen(false);
      loadRoles();
      if (showInactive) loadInactive();
    } else if (res?.status === 409) {
       toast.error("Role already exists");
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE
  // DELETE
  const handleDeleteRole = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This role will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteRoleApi(editRole.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Role deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadRoles();
        if (showInactive) loadInactive();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete role error:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Failed to delete role. Please try again.",
      });
    }
  };

  // RESTORE
  // RESTORE
  const handleRestoreRole = async () => {
    const result = await Swal.fire({
      title: "Restore role?",
      text: "This role will be restored and made active again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await restoreRoleApi(editRole.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "Role restored successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadRoles();
        loadInactive();
      } else {
        throw new Error("Restore failed");
      }
    } catch (error) {
      console.error("Restore role error:", error);
      Swal.fire({
        icon: "error",
        title: "Restore failed",
        text: "Failed to restore role. Please try again.",
      });
    }
  };



  const collectGranted = (items) => {
    let keys = [];
    for (const i of items) {
      if (i.granted && i.key) keys.push(i.key);
      if (i.children) keys = keys.concat(collectGranted(i.children));
    }
    return keys;
  };

  const savePermissions = async () => {
    try {
      const permissionKeys = collectGranted(permissions);

      const res = await setRolePermissionsApi(editRole.id, {
        permissionKeys,
        updateUserId: user?.userId || 1
      });

      if (res?.status === 200) {
        toast.success("Permissions saved successfully");
        setPermissionsModalOpen(false);
      } else {
         toast.error("Failed to save permissions");
      }
    } catch (error) {
       console.error(error);
       toast.error("Error saving permissions");
    }
  };

  const handleEditPermissions = async () => {
    setPermissionsModalOpen(true);
  
    const res = await getRolePermissionsApi(editRole.id);
    
    if (res?.status !== 200) {
      toast.error("Failed to fetch existing permissions");
      // Keep modal open but maybe empty? Or close?
      // Better to let them try again.
      return; 
    }

    const grantedKeys = res.data.permissionKeys || [];
  
    const mapPermissions = (items) =>
      items.map(p => ({
        ...p,
        granted: grantedKeys.includes(p.key),
        children: p.children ? mapPermissions(p.children) : []
      }));
  
    setPermissions(mapPermissions(availablePermissions));
  };

  // Filter Permissions Recursive
  const filteredPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return permissions;

    const filterRecursive = (items) => {
      return items.reduce((acc, item) => {
        // Check if current item matches
        const matchesSelf = item.name.toLowerCase().includes(permissionSearch.toLowerCase());

        // Check children
        let matchesChildren = [];
        if (item.children && item.children.length > 0) {
          matchesChildren = filterRecursive(item.children);
        }

        if (matchesSelf || matchesChildren.length > 0) {
          acc.push({
            ...item,
            children: matchesChildren.length > 0 ? matchesChildren : item.children, // Keep structure if parent matches, or show refined children
          });
        }

        return acc;
      }, []);
    };

    return filterRecursive(permissions);
  }, [permissions, permissionSearch]);

  return (
    <>
      {/* =============================
          ADD ROLE MODAL
      ============================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">

            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Role</h2>

              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className="px-5 py-2 border-b border-gray-700 bg-gray-800/50 flex items-center gap-2">
              <button
                onClick={handleAddRole}
                className="flex items-center gap-2 bg-transparent border border-gray-500 text-gray-200 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
              >
                <Save size={16} className="text-blue-400" /> Save
              </button>
              
              {/* <button className="p-1.5 border border-gray-500 rounded text-gray-400 hover:text-white hover:bg-gray-700">
                <CheckCircle2 size={18} className="text-purple-400" />
              </button> */}

              <button
                disabled
                className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 px-3 py-1.5 rounded text-gray-500 cursor-not-allowed"
              >
                <Lock size={16} /> Edit Permissions
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Role Name *</label>

              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Enter role name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* =============================
          EDIT ROLE MODAL
      ============================== */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editRole.isInactive ? "Restore Role" : "Edit Role"} ({editRole.roleName})
              </h2>

              <button onClick={() => setEditModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className="px-5 py-2 border-b border-gray-700 bg-gray-800/50 flex items-center gap-2">
              {hasPermission(PERMISSIONS.ROLE.EDIT) && !editRole.isInactive && (
                <button
                  onClick={handleUpdateRole}
                  className="flex items-center gap-2 bg-transparent border border-gray-500 text-gray-200 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                >
                  <Save size={16} className="text-blue-400" /> Save
                </button>
              )}

              {editRole.isInactive && (
                 <button
                  onClick={handleRestoreRole}
                  className="flex items-center gap-2 bg-green-600/20 border border-green-600 text-green-400 px-3 py-1.5 rounded hover:bg-green-600/30 transition-colors"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              )}
              
              {/* <button className="p-1.5 border border-gray-500 rounded text-gray-400 hover:text-white hover:bg-gray-700">
                <CheckCircle2 size={18} className="text-purple-400" />
              </button> */}

              <button
                onClick={handleEditPermissions}
                disabled={editRole.isInactive}
                className={`flex items-center gap-2 border border-gray-600 px-3 py-1.5 rounded transition-colors ${
                  editRole.isInactive
                    ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                    : "bg-gray-700/50 text-green-300 hover:bg-gray-700 hover:text-grey-500"
                }`}
              >
                <Lock size={16} /> Edit Permissions
              </button>

              {hasPermission(PERMISSIONS.ROLE.DELETE) && !editRole.isInactive && (
                <button
                  onClick={handleDeleteRole}
                  className="ml-auto p-1.5 border border-red-900/50 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40"
                  title="Delete Role"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Role Name *</label>

              <input
                type="text"
                value={editRole.roleName}
                onChange={(e) =>
                  setEditRole((prev) => ({ ...prev, roleName: e.target.value }))
                }
                disabled={editRole.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none ${
                  editRole.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

          </div>
        </div>
      )}

      {/* =============================
          COLUMN PICKER MODAL
      ============================== */}
<ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />


      {/* =============================
          PERMISSIONS MODAL
      ============================== */}
      {permissionsModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[70]">
          <div className="w-[600px] max-h-[85vh] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700 bg-gray-900/50">
              <h3 className="text-lg text-white font-normal">Edit Role Permissions ({editRole.roleName})</h3>
              <button onClick={() => setPermissionsModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/30">
              <div className="flex items-center bg-gray-800/50 rounded px-3 border border-gray-600 focus-within:border-blue-500 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="search..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm p-2 w-full text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Header for List */}
            <div className="flex justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700 text-sm font-semibold text-gray-300">
                <span>Permission</span>
                <span>Grant</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map(item => (
                  <PermissionItem key={item.id} item={item} onToggle={togglePermission} />
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No matching permissions found</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700 bg-gray-900/50">
              <button
                onClick={() => setPermissionsModalOpen(false)}
                className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-800 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm shadow-lg shadow-gray-900/20 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================
              MAIN PAGE
      ============================== */}
      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Roles</h2>

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.roleName && { key: "name", label: "Role Name", sortable: true },
                ].filter(Boolean)}
                data={sortedRoles}
                inactiveData={inactiveRoles}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(r, isInactive) => {
                    setEditRole({
                        id: r.id,
                        roleName: r.name,
                        isInactive: isInactive,
                    });
                    setEditModalOpen(true);
                }}
                // Action Bar
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New Role"
                permissionCreate={hasPermission(PERMISSIONS.ROLE.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    loadRoles();
                }}
                onColumnSelector={() => {
                   setColumnModalOpen(true);
                }}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactive();
                    setShowInactive(!showInactive);
                }}
            />

             {/* PAGINATION */}
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
              />
          </div>
        </div>
      </PageLayout>

    </>
  );
};

export default Roles;