import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { toast } from "react-hot-toast";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";
import Swal from "sweetalert2";
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

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
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";



// buildPermissionTree moved to backend


const PermissionItem = ({ item, level = 0, onToggle, theme }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 rounded px-2 ${level > 0 ? "ml-6" : ""} ${theme === 'emerald' || theme === 'purple' ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-white/5 text-gray-200'}`}
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
        <span className="text-sm flex-1">{item.name}</span>

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
            <PermissionItem key={child.id} item={child} level={level + 1} onToggle={onToggle} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
};



// Functions moved inside component


const Roles = () => {
  const { theme } = useTheme();
  
  // Refs
  const addModalRef = useRef(null);
  const editModalRef = useRef(null);



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

  // Auto-focus and Enter key listeners
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => {
        const input = addModalRef.current?.querySelector('input, textarea, select');
        if (input) input.focus();
      }, 50);
    }
  }, [modalOpen]);

  useEffect(() => {
    if (editModalOpen) {
      setTimeout(() => {
        const input = editModalRef.current?.querySelector('input, textarea, select');
        if (input) input.focus();
      }, 50);
    }
  }, [editModalOpen]);

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (document.activeElement.tagName === 'TEXTAREA') return;
      e.preventDefault();
      handleAddRole();
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (document.activeElement.tagName === 'TEXTAREA') return;
      if (!editRole.isInactive && hasPermission(PERMISSIONS.ROLE.EDIT)) {
        e.preventDefault();
        handleUpdateRole();
      }
    }
  };

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

  // LOAD ACTIVE ROLES
  const loadRoles = async () => {
    setSearchText("");
    const res = await getRolesApi(page, limit, sortConfig.key, sortConfig.direction);
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
  }, [page, limit, sortConfig]);

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

  const handleRefresh = async () => {
    setSearchText("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    setShowInactive(false);
    
    try {
        const res = await getRolesApi(1, limit, null, 'asc');
        if (res?.status === 200) {
          const rawRecords = res.data.records || [];
          const normalized = normalizeRows(rawRecords);
          const visibleRoles = normalized.filter(r => r.id !== 1 && r.name?.toLowerCase() !== 'superadmin');
          setRoles(visibleRoles);
          setTotalRecords(res.data.total);
          // showSuccessToast("Refreshed");
        }
    } catch (err) {
        toast.error("Error refreshing roles");
    }
  };

  // ADD
  const handleAddRole = async () => {
    if (!newRole.trim()) return toast.error("Role name required");
    if (newRole.trim().length < 2 || newRole.trim().length > 20) return toast.error("Role Name must be 2-20 characters");

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
    if (!editRole.roleName.trim()) return toast.error("Name cannot be empty");
    if (editRole.roleName.trim().length < 2 || editRole.roleName.trim().length > 20) return toast.error("Role Name must be 2-20 characters");

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
    const result = await showDeleteConfirm("this role");

    if (!result.isConfirmed) return;

    try {
      const res = await deleteRoleApi(editRole.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        showSuccessToast("Role deleted successfully.");
        setEditModalOpen(false);
        loadRoles();
        if (showInactive) loadInactive();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete role error:", error);
      showErrorToast("Failed to delete role. Please try again.");
    }
  };

  // RESTORE
  // RESTORE
  const handleRestoreRole = async () => {
    const result = await showRestoreConfirm("this role");

    if (!result.isConfirmed) return;

    try {
      const res = await restoreRoleApi(editRole.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        showSuccessToast("Role restored successfully.");
        setEditModalOpen(false);
        loadRoles();
        loadInactive();
      } else {
        throw new Error("Restore failed");
      }
    } catch (error) {
      console.error("Restore role error:", error);
      showErrorToast("Failed to restore role. Please try again.");
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div ref={addModalRef} onKeyDown={handleAddKeyDown}             
            className={`w-[700px] rounded-lg shadow-xl border ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700 text-white'}`}
          >

            <div className={`flex justify-between items-center px-5 py-3 border-b ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 text-white' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] text-white' : 'bg-gray-900 border-gray-700'}`}>
              <h2 className="text-lg font-semibold">New Role</h2>

              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className={`px-5 py-2 border-b flex items-center gap-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'}`}>
              <button
                onClick={handleAddRole}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-transparent border border-gray-500 text-gray-200 hover:bg-gray-700'}`}
              >
                <Save size={16} className={`${theme === 'emerald' || theme === 'purple' ? 'text-white' : 'text-blue-400'}`} /> Save
              </button>
              
              <button
                disabled
                className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-200 text-gray-400 border border-gray-300' : 'bg-gray-800/50 border border-gray-700 text-gray-500'}`}
              >
                <Lock size={16} /> Edit Permissions
              </button>
            </div>

            <div className="p-6">
              <InputField
                label="Role Name"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Enter role name"
                required
                className={`${theme === 'purple' ? 'border-purple-300 focus:border-purple-500' : ''}`}
                labelClassName={`${theme === 'purple' ? 'text-purple-900' : ''}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* =============================
          EDIT ROLE MODAL
      ============================== */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div ref={editModalRef} onKeyDown={handleEditKeyDown} 
               className={`w-[700px] rounded-lg border ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700 text-white'}`}
          >

            <div className={`flex justify-between px-5 py-3 border-b ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 text-white' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] text-white' : 'bg-gray-900 border-gray-700'}`}>
              <h2 className="text-lg font-semibold">
                {editRole.isInactive ? "Restore Role" : "Edit Role"} ({editRole.roleName})
              </h2>

              <button onClick={() => setEditModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className={`px-5 py-2 border-b flex items-center gap-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'}`}>
              {hasPermission(PERMISSIONS.ROLE.EDIT) && !editRole.isInactive && (
                <button
                  onClick={handleUpdateRole}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-transparent border border-gray-500 text-gray-200 hover:bg-gray-700'}`}
                >
                  <Save size={16} className={`${theme === 'emerald' || theme === 'purple' ? 'text-white' : 'text-blue-400'}`} /> Save
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
              
              <button
                onClick={handleEditPermissions}
                disabled={editRole.isInactive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                  editRole.isInactive
                    ? (theme === 'emerald' || theme === 'purple' ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed" : "bg-gray-800/50 text-gray-500 cursor-not-allowed")
                    : (theme === 'emerald' || theme === 'purple' ? "bg-white border border-purple-300 text-purple-600 hover:bg-purple-50" : "bg-gray-700/50 text-green-300 hover:bg-gray-700 border border-gray-600")
                }`}
              >
                <Lock size={16} /> Edit Permissions
              </button>

              {hasPermission(PERMISSIONS.ROLE.DELETE) && !editRole.isInactive && (
                <button
                  onClick={handleDeleteRole}
                  className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-1.5 rounded text-white hover:bg-red-500 ms-auto"
                  title="Delete Role"
                >
                 Delete
                </button>
              )}
            </div>

            <div className="p-6">
              <InputField
                label="Role Name"
                value={editRole.roleName}
                onChange={(e) =>
                  setEditRole((prev) => ({ ...prev, roleName: e.target.value }))
                }
                disabled={editRole.isInactive}
                required
                className={`${theme === 'purple' ? 'border-purple-300 focus:border-purple-500' : ''}`}
                labelClassName={`${theme === 'purple' ? 'text-purple-900' : ''}`}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[120]">
          <div className={`w-[600px] max-h-[85vh] rounded-lg shadow-xl overflow-hidden flex flex-col border ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 text-white'}`}>
            {/* Header */}
            <div className={`flex justify-between items-center px-4 py-3 border-b ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 text-white' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] text-white' : 'bg-gray-900/50 border-gray-700'}`}>
              <h3 className={`text-lg font-normal ${theme === 'emerald' || theme === 'purple' ? 'text-white' : 'text-white'}`}>Edit Role Permissions ({editRole.roleName})</h3>
              <button onClick={() => setPermissionsModalOpen(false)}>
                <X size={20} className={`${theme === 'emerald' || theme === 'purple' ? 'text-white/80 hover:text-white' : 'text-gray-300 hover:text-white'}`} />
              </button>
            </div>

            {/* Search */}
            <div className={`p-4 border-b ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/30 border-gray-700'}`}>
              <div className={`flex items-center rounded px-3 border transition-colors ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 focus-within:border-purple-500' : 'bg-gray-800/50 border-gray-600 focus-within:border-blue-500'}`}>
                <Search size={16} className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="search..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className={`bg-transparent border-none outline-none text-sm p-2 w-full ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-gray-500'}`}
                />
              </div>
            </div>

            {/* Header for List */}
            <div className={`flex justify-between px-4 py-2 border-b text-sm font-semibold ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-200 text-gray-700' : 'bg-gray-800/50 border-gray-700 text-gray-300'}`}>
                <span>Permission</span>
                <span>Grant</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map(item => (
                  <PermissionItem key={item.id} item={item} onToggle={togglePermission} theme={theme} />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No matching permissions found</div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-700'}`}>
              <button
                onClick={() => setPermissionsModalOpen(false)}
                className={`px-4 py-2 bg-transparent border rounded text-sm transition-colors ${theme === 'emerald' || theme === 'purple' ? 'border-[#6448AE] text-dark' : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className="px-6 py-2  bg-[#6448AE] hover:bg-[#6E55B6]  text-white rounded  text-sm shadow-lg transition-colors"
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Roles</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.roleName && { key: "name", label: "Role Name", sortable: true },
                ].filter(Boolean)}
                data={roles}
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
                onRefresh={handleRefresh}
                onColumnSelector={() => {
                   setColumnModalOpen(true);
                }}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactive();
                    setShowInactive(!showInactive);
                }}
            />

              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                onRefresh={handleRefresh}
              />
          </div>
          </ContentCard>
        </div>
      </PageLayout>

    </>
  );
};

export default Roles;