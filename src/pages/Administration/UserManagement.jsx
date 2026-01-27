import { useEffect, useState, useRef } from "react";
import {
  Users,
  Lock,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Check,
  Ban,
  X,
  Save,
  Trash2,
  Search,
  ArchiveRestore
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

import {
  getUsersApi,
  addUserApi,
  updateUserApi,
  deleteUserApi,
  searchUserApi,
  getInactiveUsersApi,
  restoreUserApi,
  getRolesApi,
  getUserRolesApi,
  getUserPermissionsApi,
  setUserPermissionsApi,
  getAllPermissionsApi, // Added 
  setUserRolesApi
} from "../../services/allAPI"; 
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions"; 

// buildPermissionTree moved to backend to satisfy "logic in backend" requirement


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
 

import { serverURL } from "../../services/serverURL";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";

// file -> base64 preview utility (same pattern as Banks)
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const UserManagement = () => {
  const { theme } = useTheme();
  
  // Refs for modals
  const addModalRef = useRef(null);
  const editModalRef = useRef(null);


  // Modals & UI
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // Data lists
  const [users, setUsers] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // Search
  const [searchText, setSearchText] = useState("");

  // Current User
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // New User Form
  const [newUser, setNewUser] = useState({
    username: "",
    displayName: "",
    email: "",
    source: "site",
    userImage: null,
    userImagePreview: "",
    password: "",
    confirmPassword: "",
  });

  // Edit User Form
  const [editData, setEditData] = useState({
    userId: null,
    username: "",
    displayName: "",
    email: "",
    source: "site",
    userImage: "",
    userImagePreview: "",
    isInactive: false,
  });

  const [loading, setLoading] = useState(false);

  // Roles Modal
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleSearch, setRoleSearch] = useState("");

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
      // Ensure we are not clicking a button, but submitting form
      handleAdd();
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (document.activeElement.tagName === 'TEXTAREA') return;
      // edit permission check
      if (!editData.isInactive && hasPermission(PERMISSIONS.USER.EDIT)) {
        e.preventDefault();
        handleUpdate();
      }
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await getRolesApi(1, 100); 
      if (response.status === 200) {
        // Assuming response.data.roles or response.data.records based on other APIs
        setRolesList(response.data.records || []); 
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    }
  };



const handleEditRoles = async () => {
  try {
    setRolesModalOpen(true);
    await fetchRoles(); // loads all roles

    const res = await getUserRolesApi(editData.userId);

    if (res.status === 200) {
      const roleIds = res.data.records.map(r => r.RoleId);
      setSelectedRoles(roleIds);
    } else {
      setSelectedRoles([]);
    }
  } catch (error) {
    console.error(error);
    toast.error("Failed to load user roles");
    setSelectedRoles([]);
  }
};


  const toggleRole = (roleId) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };


  // --- PERMISSIONS MODAL STATE ---
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissions, setPermissions] = useState([]); // Master Tree (with granted status)
  const [displayedPermissions, setDisplayedPermissions] = useState([]); // Filtered Tree for Display
  const [permissionSearch, setPermissionSearch] = useState("");

  // Fetch Logic
  const handleEditPermissions = async () => {
    setPermissionsModalOpen(true);
    setPermissionSearch("");

    try {
      // 1. Get All System Permissions (Backend now returns Tree)
      const allRes = await getAllPermissionsApi();
      if (allRes.status !== 200) throw new Error("Failed to load system permissions");
      
      const tree = Array.isArray(allRes.data) ? allRes.data : (allRes.data.records || []);

      // 2. Get User's Existing Overrides
      const userRes = await getUserPermissionsApi(editData.userId);
      const userOverrides = userRes.data?.permissions || []; 

      // 3. Apply Overrides
      const grantedKeys = userOverrides.filter(u => u.granted).map(u => u.key);
      
      const mapPermissions = (items) =>
        items.map(p => ({
          ...p,
          granted: grantedKeys.includes(p.key),
          children: p.children ? mapPermissions(p.children) : []
        }));

      const finalTree = mapPermissions(tree);
      setPermissions(finalTree);
      setDisplayedPermissions(finalTree);

    } catch (error) {
       console.error("Permission Load Error:", error);
       toast.error("Failed to load permissions");
    }
  };

  // Search Effect
  useEffect(() => {
    if (!permissions.length) return;

    if (!permissionSearch.trim()) {
      setDisplayedPermissions(permissions);
      return;
    }

    const lowerSearch = permissionSearch.toLowerCase();

    // Recursive Filter
    const filterTree = (nodes) => {
      return nodes.reduce((acc, node) => {
        const matchesSelf = node.name.toLowerCase().includes(lowerSearch);
        const filteredChildren = node.children ? filterTree(node.children) : [];
        
        if (matchesSelf || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
        return acc;
      }, []);
    };

    setDisplayedPermissions(filterTree(permissions));
  }, [permissionSearch, permissions]);


  // Toggle Logic
  const togglePermission = (id) => {
    // Recursive update on Master Tree
    const updateNodes = (nodes) => {
      return nodes.map(node => {
        if (node.id === id) {
          const newStatus = !node.granted;
          return {
            ...node,
            granted: newStatus,
            children: node.children ? setAllChildren(node.children, newStatus) : node.children
          };
        }
        return { ...node, children: updateNodes(node.children) };
      });
    };

    const setAllChildren = (items, status) => {
      return items.map(item => ({
        ...item,
        granted: status,
        children: item.children ? setAllChildren(item.children, status) : item.children
      }));
    };

    // Update parents based on children
    const evaluateParents = (items) => {
      return items.map(item => {
        if (item.children && item.children.length > 0) {
          const updatedChildren = evaluateParents(item.children); 
          const allChildrenGranted = updatedChildren.every(c => c.granted);
          return {
            ...item,
            children: updatedChildren,
            granted: allChildrenGranted 
          };
        }
        return item;
      });
    };

    setPermissions(prev => {
      const step1 = updateNodes(prev);
      const step2 = evaluateParents(step1);
      return step2;
    });
  };


  // Collect Granted Keys
  const collectGranted = (items) => {
    let keys = [];
    for (const i of items) {
      if (i.granted && i.key) keys.push({ key: i.key, granted: true });
      if (i.children) keys = keys.concat(collectGranted(i.children));
    }
    return keys;
  };

  // Save Permissions
  const savePermissions = async () => {
    try {
      const payload = collectGranted(permissions);
      
      const res = await setUserPermissionsApi(editData.userId, {
        permissions: payload, 
        updateUserId: currentUserId
      });

      if (res.status === 200) {
        toast.success("User permissions updated");
        setPermissionsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save permissions");
    }
  };


  // Column Picker
  const defaultColumns = {
    userId: true,
    username: true,
    displayName: true,
    email: true,
    source: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const toggleColumn = (col) =>
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));

  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  // Sorting (simple by userId asc/desc)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Assets base for image URLs (same logic as Banks)
  const assetsBase = (() => {
    try {
      if (!serverURL) return window.location.origin;
      return serverURL.replace(/\/api\/?$/, "") || window.location.origin;
    } catch {
      return window.location.origin;
    }
  })();

  const fullImageURL = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${assetsBase}${normalized}`;
  };

  // Load users (active) with pagination and optional search
  const loadUsers = async () => {
    try {
      if (searchText?.trim()) {
        const res = await searchUserApi(searchText.trim());
        const raw = Array.isArray(res.data)
          ? res.data
          : res.data?.records || [];
        const items = raw.map((i) => ({
          ...i,
          userImage: i.userImage ? fullImageURL(i.userImage) : "",
        }));
        setUsers(items);
        setTotalRecords(items.length);
        return;
      }

      const res = await getUsersApi(page, limit, sortConfig.key, sortConfig.direction);
      if (res?.status === 200) {
        const normalized = (res.data.records || []).map((item) => ({
          ...item,
          userImage: item.userImage ? fullImageURL(item.userImage) : "",
        }));
        setUsers(normalized);
        setTotalRecords(res.data.total);
      }
    } catch (err) {
      toast.error("Error loading users");
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortConfig]);

  // Load inactive users
  const loadInactiveUsers = async () => {
    try {
      const res = await getInactiveUsersApi();
      if (res?.status === 200) {
        const normalized = (res.data.records || []).map((item) => ({
          ...item,
          userImage: item.userImage ? fullImageURL(item.userImage) : "",
        }));
        setInactiveUsers(normalized);
      }
    } catch (err) {
      toast.error("Error loading inactive users");
    }
  };

  // Search users (the action in the action bar)
  const handleSearch = async (v) => {
    setSearchText(v);

    if (!v.trim()) {
      setPage(1);
      // We don't call loadUsers here immediately, let the debounce/effect or user action handle it, 
      // but usually search input triggers on change. 
      // If this is passed to MasterTable as onSearch, it might be debounced there? 
      // Actually checking MasterTable usage... it seems it's passed as onSearch.
      // For now, keeping existing logic but cleaner if possible.
      loadUsers();
      return;
    }

    try {
      const res = await searchUserApi(v.trim());
      const raw = Array.isArray(res.data) ? res.data : res.data?.records || [];
      const items = raw.map((i) => ({
        ...i,
        userImage: i.userImage ? fullImageURL(i.userImage) : "",
      }));
      setUsers(items);
      setTotalRecords(items.length);
    } catch {
      toast.error("Search failed");
    }
  };

  const handleRefresh = async () => {
    setSearchText("");
    setPage(1);
    setSortConfig({ key: null, direction: 'asc' });
    setShowInactive(false);
    
    // Explicit fetch to reset view immediately
    try {
        const res = await getUsersApi(1, limit, null, 'asc');
        if (res?.status === 200) {
            const normalized = (res.data.records || []).map((item) => ({
              ...item,
              userImage: item.userImage ? fullImageURL(item.userImage) : "",
            }));
            setUsers(normalized);
            setTotalRecords(res.data.total);
            // showSuccessToast("Refreshed");
        }
    } catch (err) {
        toast.error("Error refreshing users");
    }
  };

  // Add user
  const handleAdd = async () => {
    if (loading) return;
    try {
      if (!newUser.username.trim() || !newUser.displayName.trim() || !newUser.password.trim()) {
        return toast.error("Missing required fields");
      }
      if (newUser.username.trim().length < 2 || newUser.username.trim().length > 50) return toast.error("Username must be 2-50 characters");
      if (newUser.displayName.trim().length < 2 || newUser.displayName.trim().length > 50) return toast.error("Display Name must be 2-50 characters");

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (newUser.email && !emailRegex.test(newUser.email.trim())) return toast.error("Invalid email format");
  
      // Password validation
      if (newUser.password.length < 6 || newUser.password.length > 20) return toast.error("Password must be 6-20 characters");
      const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[a-zA-Z]).{6,20}$/;
      if (!pwdRegex.test(newUser.password)) return toast.error("Password must contain at least one uppercase letter and one number");

      if (newUser.password !== newUser.confirmPassword) {
        return toast.error("Passwords do not match");
      }

      setLoading(true);

      // Check duplicates (Username)
      try {
        const searchRes = await searchUserApi(newUser.username.trim());
        const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
        const existing = rows.find(u => u.username?.toLowerCase() === newUser.username.trim().toLowerCase());
        if (existing) {
          setLoading(false);
          return toast.error("Username already exists");
        }
      } catch (err) {
        console.error(err);
      }

      // Check duplicates (Email) - only if provided
      if (newUser.email.trim()) {
        try {
            const searchRes = await searchUserApi(newUser.email.trim());
            const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
            const existing = rows.find(u => u.email?.toLowerCase() === newUser.email.trim().toLowerCase());
            if (existing) {
              setLoading(false);
              return toast.error("Email already exists");
            }
        } catch (err) {
            console.error(err);
        }
      }

      const payload = new FormData();
      payload.append("username", newUser.username.trim());
      payload.append("displayName", newUser.displayName.trim());
      payload.append("email", newUser.email.trim());
      payload.append("source", newUser.source || "site");
      payload.append("password", newUser.password);
      payload.append("userId", currentUserId);

      if (newUser.userImage instanceof File) {
        payload.append("userImage", newUser.userImage);
      }

      const res = await addUserApi(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success("User added");
        setModalOpen(false);
        setNewUser({
          username: "",
          displayName: "",
          email: "",
          source: "site",
          userImage: null,
          userImagePreview: "",
          password: "",
          confirmPassword: "",
        });
        loadUsers();
      }
    } catch (err) {
      toast.error("Add failed");
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal (show preview image)
  const openEditModal = (item, isInactive = false) => {
    const imageURL = item.userImage ? fullImageURL(item.userImage) : "";

    setEditData({
      userId: item.userId ?? item.UserId,
      username: item.username,
      displayName: item.displayName,
      email: item.email,
      source: item.source || "site",
      userImage: imageURL,
      userImagePreview: imageURL,
      isInactive,
    });

    setEditModalOpen(true);
  };

  // Remove image in edit form
  const removeEditImage = () => {
    setEditData((p) => ({ ...p, userImage: "", userImagePreview: "" }));
  };

  // Update user
  const handleUpdate = async () => {
    if (loading) return;
    try {
      if (!editData.username.trim() || !editData.displayName.trim()) {
        return toast.error("Missing required fields");
      }
      
      if (editData.username.trim().length < 2 || editData.username.trim().length > 50) return toast.error("Username must be 2-50 characters");
      if (editData.displayName.trim().length < 2 || editData.displayName.trim().length > 50) return toast.error("Display Name must be 2-50 characters");

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (editData.email && !emailRegex.test(editData.email.trim())) return toast.error("Invalid email format");

      setLoading(true);

      // Check duplicates (Username)
      try {
        const searchRes = await searchUserApi(editData.username.trim());
        const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
        const existing = rows.find(u => 
            u.username?.toLowerCase() === editData.username.trim().toLowerCase() && 
            (u.userId || u.UserId) !== editData.userId
        );
        if (existing) {
          setLoading(false);
          return toast.error("Username already exists");
        }
      } catch (err) {
        console.error(err);
      }

      // Check duplicates (Email)
      if (editData.email?.trim()) {
        try {
            const searchRes = await searchUserApi(editData.email.trim());
            const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
            const existing = rows.find(u => 
                u.email?.toLowerCase() === editData.email.trim().toLowerCase() && 
                (u.userId || u.UserId) !== editData.userId
            );
            if (existing) {
              setLoading(false);
              return toast.error("Email already exists");
            }
        } catch (err) {
            console.error(err);
        }
      }

      // Build payload as FormData to support file upload
      const payload = new FormData();
      payload.append("username", editData.username.trim());
      payload.append("displayName", editData.displayName.trim());
      payload.append("email", editData.email?.trim() || "");
      payload.append("source", editData.source || "site");
      payload.append("userId", currentUserId);

      if (editData.userImage instanceof File) {
        payload.append("userImage", editData.userImage);
      } else if (editData.userImage === "") {
        payload.append("userImage", ""); 
      }

      const res = await updateUserApi(editData.userId, payload);
      if (res.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadUsers();
        if (showInactive) loadInactiveUsers();
      }
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  // Delete user (soft)
  const handleDelete = async () => {
    if (!editData.userId) {
      return toast.error("Invalid User ID");
    }

    const result = await showDeleteConfirm("this user");

    if (!result.isConfirmed) return;

    try {
      const res = await deleteUserApi(editData.userId, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        // Success message
        showSuccessToast("User deleted successfully.");
        setEditModalOpen(false);
        loadUsers();
        if (showInactive) loadInactiveUsers();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      showErrorToast("Failed to delete user. Please try again.");
    }
  };

  // Restore user
  const handleRestore = async () => {
    if (!editData.userId) {
       return toast.error("Invalid User ID");
    }

    const result = await showRestoreConfirm("this user");

    if (!result.isConfirmed) return;

    try {
      const res = await restoreUserApi(editData.userId, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        showSuccessToast("User restored successfully.");
        setEditModalOpen(false);
        loadUsers();
        loadInactiveUsers();
      } else {
        throw new Error("Restore failed");
      }
    } catch (error) {
      console.error("Restore user error:", error);
      showErrorToast("Failed to restore user. Please try again.");
    }
  };

  const previewImage = editData.userImagePreview || editData.userImage;

  // Remove new user image
  const removeNewImage = () => {
    setNewUser((p) => ({ ...p, userImage: null, userImagePreview: "" }));
  };

  // Handle new file selection
  const handleNewFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = await fileToBase64(file);
    setNewUser((p) => ({ ...p, userImage: file, userImagePreview: preview }));
  };

  // Handle edit file select
  const handleEditFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = await fileToBase64(file);
    setEditData((p) => ({ ...p, userImage: file, userImagePreview: preview }));
  };

  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div ref={addModalRef} onKeyDown={handleAddKeyDown} 
               className={`w-[700px] max-h-[90vh] overflow-hidden rounded-lg shadow-xl border ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 text-white'}`}
          >
            {/* HEADER */}
            <div className={`flex justify-between items-center px-4 sm:px-5 py-3 border-b ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 text-white' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] text-white' : 'bg-gray-900/50 border-gray-700'}`}>
              <h2 className="text-lg font-normal">New User</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className={`${theme === 'emerald' || theme === 'purple' ? 'text-white/80 hover:text-white' : 'text-gray-300 hover:text-white'}`} size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className={`px-4 sm:px-5 py-2 border-b flex items-center gap-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'}`}>
              {hasPermission(PERMISSIONS.USER.CREATE) && (
              <button
                onClick={handleAdd}
                disabled={loading || !hasPermission(PERMISSIONS.USER.CREATE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-transparent border border-gray-500 text-gray-200 hover:bg-gray-700'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                    <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
                    </>
                ) : (
                    <>
                    <Save size={16} className={`${theme === 'emerald' || theme === 'purple' ? 'text-white' : 'text-blue-400'}`} /> Save
                    </>
                )}
              </button>
              )}
              
              <button disabled className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-200 text-purple-800 border border-gray-300' : 'bg-gray-800/50 border border-gray-700 text-gray-500'}`}>
                <Users size={16} /> Edit Roles
              </button>
              <button disabled className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-200 text-purple-800 border border-gray-300' : 'bg-gray-800/50 border border-gray-700 text-gray-500'}`}>
                <Lock size={16} /> Edit Permissions
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              
              {/* Username */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">
                   Username
                </label>
                <InputField
                  value={newUser.username}
                  onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                  required
                />
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">
                   Display Name
                </label>
                <InputField
                  value={newUser.displayName}
                  onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))}
                  required
                />
              </div>

              {/* Email */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">Email</label>
                <div className="flex items-center gap-2">
                  <InputField
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  />
                  {/* <span className="text-gray-400">@</span>
                  <input
                    disabled
                    className="w-24 bg-gray-800/30 border border-gray-700 rounded px-3 py-2 text-sm cursor-not-allowed"
                  /> */}
                </div>
              </div>

              {/* User Image */}
              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-right  text-dark font-medium pt-2">User Image</label>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      id="userImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleNewFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("userImageUpload").click()}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600'}`}
                    >
                      <Paperclip size={16} /> Select File
                    </button>
                    {newUser.userImagePreview && (
                      <button
                        onClick={removeNewImage}
                        className="p-2 bg-red-800 border rounded text-red-400 hover:bg-red-700 transition-colors text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Preview Area (Placeholder or Image) */}
                  <div className="w-full h-32 bg-white border border-gray-700 rounded flex items-center justify-center overflow-hidden">
                    {newUser.userImagePreview ? (
                      <img
                        src={newUser.userImagePreview}
                        alt="preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">No image selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">
                   Password
                </label>
                <InputField
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">
                   Confirm Password
                </label>
                <InputField
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              {/* Source */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-dark font-medium">Source</label>
                <div className="w-full bg-white border border-gray-700 rounded px-3 py-2 text-sm text-gray-400">
                  site
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div ref={editModalRef} onKeyDown={handleEditKeyDown} 
               className={`w-[700px] max-h-[90vh] overflow-hidden rounded-lg shadow-xl border ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 text-white'}`}
          >
            {/* HEADER */}
            <div className={`flex justify-between items-center px-4 sm:px-5 py-3 border-b ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 text-white' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] text-white' : 'bg-gray-900/50 border-gray-700'}`}>
              <h2 className="text-lg font-normal">
                {editData.isInactive
                  ? "Restore User"
                  : `Edit User (${editData.displayName || ""})`}
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className={`${theme === 'emerald' || theme === 'purple' ? 'text-white/80 hover:text-white' : 'text-gray-300 hover:text-white'}`} size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className={`px-4 sm:px-5 py-2 border-b flex items-center gap-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'}`}>
              {hasPermission(PERMISSIONS.USER.EDIT) && !editData.isInactive && (
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-transparent border border-gray-500 text-gray-200 hover:bg-gray-700'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                      <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...
                      </>
                  ) : (
                      <>
                      <Save size={16} className={`${theme === 'emerald' || theme === 'purple' ? 'text-white' : 'text-blue-400'}`} /> Update
                      </>
                  )}
                </button>
              )}
              {editData.isInactive && (
                 <button
                  onClick={handleRestore}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-transparent border border-gray-500 text-gray-200 hover:bg-gray-700'}`}
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              )}

              
              
              <button 
                onClick={handleEditRoles}
                disabled={editData.isInactive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                  editData.isInactive 
                    ? (theme === 'emerald' || theme === 'purple' ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed" : "bg-gray-800/50 text-gray-500 cursor-not-allowed")
                    : (theme === 'emerald' || theme === 'purple' ? "bg-white border border-purple-300 text-purple-600 hover:bg-purple-50" : "bg-gray-700/50 text-blue-300 hover:bg-gray-700 border border-gray-600")
                }`}
              >
                <Users size={16} /> Edit Roles
              </button>
              
              <button 
                onClick={handleEditPermissions}
                disabled={editData.isInactive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                  editData.isInactive 
                   ? (theme === 'emerald' || theme === 'purple' ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed" : "bg-gray-800/50 text-gray-500 cursor-not-allowed")
                    : (theme === 'emerald' || theme === 'purple' ? "bg-white border border-purple-300 text-purple-600 hover:bg-purple-50" : "bg-gray-700/50 text-green-300 hover:bg-gray-700 border border-gray-600")
                }`}
              >
                <Lock size={16} /> Edit Permissions
              </button>

              {hasPermission(PERMISSIONS.USER.DELETE) && !editData.isInactive && (
                <button
                  onClick={handleDelete}
                   className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-1.5 rounded text-white hover:bg-red-500 ms-auto"
                  title="Delete User"
                >
                Delete
                </button>
              )}
            </div>

            {/* BODY */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              
              {/* Username */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-dark font-medium">
                   Username
                </label>
                <InputField
                  value={editData.username}
                  onChange={(e) => setEditData((p) => ({ ...p, username: e.target.value }))}
                  disabled={editData.isInactive}
                  required
                />
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">
                   Display Name
                </label>
                <InputField
                  value={editData.displayName}
                  onChange={(e) => setEditData((p) => ({ ...p, displayName: e.target.value }))}
                  disabled={editData.isInactive}
                  required
                />
              </div>

              {/* Email */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">Email</label>
                <div className="flex items-center gap-2">
                  <InputField
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))}
                    disabled={editData.isInactive}
                  />
                  {/* <span className="text-gray-400">@</span>
                  <input
                    disabled
                    className="w-24 bg-gray-800/30 border border-gray-700 rounded px-3 py-2 text-sm cursor-not-allowed"
                  /> */}
                </div>
              </div>

              {/* User Image */}
              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-right text-dark font-medium pt-2">User Image</label>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      id="editUserImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      disabled={editData.isInactive}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => !editData.isInactive && document.getElementById("editUserImageUpload").click()}
                      disabled={editData.isInactive}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                        editData.isInactive 
                          ? (theme === 'emerald' || theme === 'purple' ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed" : "bg-gray-800 text-gray-500 cursor-not-allowed border-gray-600 border") 
                          : (theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600')
                      }`}
                    >
                      <Paperclip size={16} /> Select File
                    </button>
                    {previewImage && !editData.isInactive && (
                      <button
                        onClick={removeEditImage}
                        className="p-2 bg-gray-800 border border-gray-700 rounded text-red-400 hover:bg-gray-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Preview Area */}
                  <div className="w-full h-32 bg-white border border-gray-700 rounded flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">No image selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Source */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right  text-dark font-medium">Source</label>
                <div className="w-full bg-white border border-gray-700 rounded px-3 py-2 text-sm text-gray-400">
                  {editData.source || "site"}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER */}
      
       <ColumnPickerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
        />

      {/* MAIN PAGE */}
         <PageLayout>
        <div className={`p-6 h-full  ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>
            User Management
            </h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.userId && { key: "userId", label: "ID", sortable: true, render: (r) => r.userId ?? r.UserId },
                    visibleColumns.username && { key: "username", label: "Username", sortable: true },
                    visibleColumns.displayName && { key: "displayName", label: "Display Name", sortable: true },
                    visibleColumns.email && { key: "email", label: "Email", sortable: true },
                    visibleColumns.source && { key: "source", label: "Source", sortable: true },
                ].filter(Boolean)}
                data={users}
                inactiveData={inactiveUsers}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(r, isInactive) => openEditModal(r, isInactive)}
                // Action Bar
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New User"
                permissionCreate={hasPermission(PERMISSIONS.USER.CREATE)}
                onRefresh={handleRefresh}
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactiveUsers();
                    setShowInactive((s) => !s);
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
      {/* ROLES MODAL */}
      {rolesModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[120]">
          <div className={`w-[95%] sm:w-[600px] md:w-[650px] max-h-[90vh] overflow-hidden rounded-lg shadow-xl border ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 text-white'}`}>
            {/* Header */}
            <div className={`flex justify-between items-center px-4 sm:px-5 py-3 border-b ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 text-white' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] text-white' : 'bg-gray-900/50 border-gray-700'}`}>
              <h3 className="text-lg font-normal">Edit User Roles ({editData.displayName || editData.username})</h3>
              <button onClick={() => setRolesModalOpen(false)}>
                <X size={20} className={`${theme === 'emerald' || theme === 'purple' ? 'text-white/80 hover:text-white' : 'text-gray-300 hover:text-white'}`} />
              </button>
            </div>

            {/* Search */}
            <div className={`p-4 sm:px-5 border-b ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/30 border-gray-700'}`}>
              <div className={`flex items-center rounded px-3 border transition-colors ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 focus-within:border-purple-500' : 'bg-gray-800/50 border-gray-600 focus-within:border-white-500'}`}>
                <Search size={16} className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className={`bg-transparent border-none outline-none text-sm p-2.5 w-full ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-gray-500'}`}
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto p-4 sm:px-5 space-y-1">
              {rolesList
                .filter(r =>
                  r.roleName.toLowerCase().includes(roleSearch.toLowerCase())
                )
                .map(role => (
           <div
  key={role.id}
  className={`flex items-center gap-3 px-3 py-2.5 rounded ${theme === 'emerald' || theme === 'purple' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
>
<input
  type="checkbox"
  checked={selectedRoles.includes(role.id)}
  onChange={() => toggleRole(role.id)}
  className={`
    w-4 h-4
    rounded
    cursor-pointer
    ${theme === 'emerald' ? 'accent-emerald-500 bg-white border-gray-300' : theme === 'purple' ? 'accent-purple-600 bg-white border-gray-300' : 'accent-emerald-500 bg-gray-800 border-gray-500'}
  `}
/>


  <span className={`text-sm cursor-pointer ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-200'}`}
        onClick={() => toggleRole(role.id)}>
    {role.roleName}
  </span>
</div>

              ))}

            </div>

            {/* Footer */}
            <div className={`flex justify-end gap-3 p-4 sm:px-5 border-t ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-700'}`}>
              <button
                onClick={() => setRolesModalOpen(false)}
                className={`px-4 py-2 bg-transparent border rounded text-sm transition-colors ${theme === 'emerald' || theme === 'purple' ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                Cancel
              </button>
             <button
                onClick={async () => {
                  try {
                    await setUserRolesApi(editData.userId, {
                      roleIds: selectedRoles,
                      updateUserId: currentUserId
                    });
                    toast.success("Roles saved");
                    setRolesModalOpen(false);
                  } catch {
                    toast.error("Failed to save roles");
                  }
                }}
                className={`px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-gray-800 border border-gray-600'}`}
              >
                Save Roles
              </button>

            </div>
          </div>
        </div>
      )}
      {/* PERMISSIONS MODAL (MATCHING ROLES STYLE) */}
      {permissionsModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[130]">
          <div className={`w-[600px] max-h-[85vh] rounded-lg shadow-xl overflow-hidden flex flex-col border ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 text-white'}`}>
            {/* Header */}
            <div className={`flex justify-between items-center px-4 py-3 border-b ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 text-white' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] text-white' : 'bg-gray-900/50 border-gray-700'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme === 'emerald' || theme === 'purple' ? 'bg-white/20' : 'bg-purple-500/10'}`}>
                  <Lock size={20} className={`${theme === 'emerald' || theme === 'purple' ? 'text-white' : 'text-purple-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-normal">Edit User Permissions</h3>
                  <p className={`text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-white/80' : 'text-gray-400'}`}>Override permissions for {editData.displayName}</p>
                </div>
              </div>
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
               {displayedPermissions.length === 0 ? (
                 <div className="text-center py-10 text-gray-500">
                    {permissions.length === 0 ? "Loading permissions..." : "No matches found"}
                 </div>
               ) : (
                  displayedPermissions.map(p => (
                    <PermissionItem 
                      key={p.id || p.key} 
                      item={p} 
                      onToggle={togglePermission} 
                      theme={theme}
                    />
                  ))
               )}
            </div>

            {/* Footer */}
            <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-700'}`}>
              <button
                onClick={() => setPermissionsModalOpen(false)}
                className={`px-4 py-2 bg-transparent border rounded text-sm transition-colors ${theme === 'emerald' || theme === 'purple' ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className={`px-6 py-2 rounded text-sm shadow-lg shadow-gray-900/20 transition-colors ${theme === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : theme === 'purple' ? 'bg-[#6448AE] text-white hover:bg-[#8066a3]' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;



