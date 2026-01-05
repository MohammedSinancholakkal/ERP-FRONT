import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ArchiveRestore,
  Users,
  Lock,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Check,
  Ban
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

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
 

import SortableHeader from "../../components/SortableHeader";
import { serverURL } from "../../services/serverURL";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

// file -> base64 preview utility (same pattern as Banks)
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const UserManagement = () => {
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

  // Roles Modal
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleSearch, setRoleSearch] = useState("");

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
  const [sortOrder, setSortOrder] = useState("desc");
  const sortedUsers = [...users];
  if (sortOrder === "asc") {
    sortedUsers.sort((a, b) => (a.userId ?? a.UserId) - (b.userId ?? b.UserId));
  } else {
    sortedUsers.sort((a, b) => (b.userId ?? b.UserId) - (a.userId ?? a.UserId));
  }

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

      const res = await getUsersApi(page, limit);
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
  }, [page, limit]);

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

  // Add user
  const handleAdd = async () => {
    try {
      if (
        !newUser.username.trim() ||
        !newUser.displayName.trim() ||
        !newUser.password.trim()
      ) {
        return toast.error("Missing required fields");
      }
      if (newUser.password !== newUser.confirmPassword) {
        return toast.error("Passwords do not match");
      }

      // Check duplicates (Username)
      try {
        const searchRes = await searchUserApi(newUser.username.trim());
        const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
        const existing = rows.find(u => u.username?.toLowerCase() === newUser.username.trim().toLowerCase());
        if (existing) return toast.error("Username already exists");
      } catch (err) {
        console.error(err);
      }

      // Check duplicates (Email) - only if provided
      if (newUser.email.trim()) {
        try {
            const searchRes = await searchUserApi(newUser.email.trim());
            const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
            const existing = rows.find(u => u.email?.toLowerCase() === newUser.email.trim().toLowerCase());
            if (existing) return toast.error("Email already exists");
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
    try {
      if (!editData.username.trim() || !editData.displayName.trim()) {
        return toast.error("Missing required fields");
      }

      // Check duplicates (Username)
      try {
        const searchRes = await searchUserApi(editData.username.trim());
        const rows = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data?.records || []);
        const existing = rows.find(u => 
            u.username?.toLowerCase() === editData.username.trim().toLowerCase() && 
            (u.userId || u.UserId) !== editData.userId
        );
        if (existing) return toast.error("Username already exists");
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
            if (existing) return toast.error("Email already exists");
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
    }
  };

  // Delete user (soft)
  const handleDelete = async () => {
    if (!editData.userId) {
      return toast.error("Invalid User ID");
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteUserApi(editData.userId, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "User deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadUsers();
        if (showInactive) loadInactiveUsers();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Failed to delete user. Please try again.",
      });
    }
  };

  // Restore user
  const handleRestore = async () => {
    if (!editData.userId) {
       return toast.error("Invalid User ID");
    }

    const result = await Swal.fire({
      title: "Restore user?",
      text: "This user will be restored and made active again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await restoreUserApi(editData.userId, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "User restored successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadUsers();
        loadInactiveUsers();
      } else {
        throw new Error("Restore failed");
      }
    } catch (error) {
      console.error("Restore user error:", error);
      Swal.fire({
        icon: "error",
        title: "Restore failed",
        text: "Failed to restore user. Please try again.",
      });
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            {/* HEADER */}
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-gray-700 bg-gray-900/50">
              <h2 className="text-lg text-white-500 font-normal">New User</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className="px-4 sm:px-5 py-2 border-b border-gray-700 bg-gray-800/50 flex items-center gap-2">
              {hasPermission(PERMISSIONS.USER.CREATE) && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-transparent border border-gray-500 text-gray-200 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                disabled={!hasPermission(PERMISSIONS.USER.CREATE)}
              >
                <Save size={16} className="text-blue-400" /> Save
              </button>
              )}
              {/* <button className="p-1.5 border border-gray-500 rounded text-gray-400 hover:text-white hover:bg-gray-700">
                <CheckCircle2 size={18} className="text-purple-400" />
              </button> */}
              <button disabled className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 text-gray-500 px-3 py-1.5 rounded cursor-not-allowed">
                <Users size={16} /> Edit Roles
              </button>
              <button disabled className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 text-gray-500 px-3 py-1.5 rounded cursor-not-allowed">
                <Lock size={16} /> Edit Permissions
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              
              {/* Username */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">
                  <span className="text-red-500">*</span> Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none"
                />
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">
                  <span className="text-red-500">*</span> Display Name
                </label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none"
                />
              </div>

              {/* Email */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">Email</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                    className="flex-1 bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none"
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
                <label className="text-right text-gray-300 text-sm pt-2">User Image</label>
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
                      className="flex items-center gap-2 bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      <Paperclip size={16} /> Select File
                    </button>
                    {newUser.userImagePreview && (
                      <button
                        onClick={removeNewImage}
                        className="p-2 bg-gray-800 border border-gray-700 rounded text-red-400 hover:bg-gray-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Preview Area (Placeholder or Image) */}
                  <div className="w-full h-32 bg-gray-800/30 border border-gray-700 rounded flex items-center justify-center overflow-hidden">
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
                <label className="text-right text-gray-300 text-sm">
                  <span className="text-red-500">*</span> Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none"
                />
              </div>

              {/* Confirm Password */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">
                  <span className="text-red-500">*</span> Confirm Password
                </label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none"
                />
              </div>

              {/* Source */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">Source</label>
                <div className="w-full bg-gray-800/30 border border-gray-700 rounded px-3 py-2 text-sm text-gray-400">
                  site
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            {/* HEADER */}
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-gray-700 bg-gray-900/50">
              <h2 className="text-lg text-white-500 font-normal">
                {editData.isInactive
                  ? "Restore User"
                  : `Edit User (${editData.displayName || ""})`}
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" size={20} />
              </button>
            </div>

            {/* TOOLBAR */}
            <div className="px-4 sm:px-5 py-2 border-b border-gray-700 bg-gray-800/50 flex items-center gap-2">
              {hasPermission(PERMISSIONS.USER.EDIT) && !editData.isInactive && (
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 bg-transparent border border-gray-500 text-gray-200 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                >
                  <Save size={16} className="text-blue-400" /> Save
                </button>
              )}
              {editData.isInactive && (
                 <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-600/20 border border-green-600 text-green-400 px-3 py-1.5 rounded hover:bg-green-600/30 transition-colors"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              )}
              
              {/* <button className="p-1.5 border border-gray-500 rounded text-gray-400 hover:text-white hover:bg-gray-700">
                <CheckCircle2 size={18} className="text-purple-400" />
              </button> */}
              
              <button 
                onClick={handleEditRoles}
                disabled={editData.isInactive}
                className={`flex items-center gap-2 border border-gray-600 px-3 py-1.5 rounded transition-colors ${
                  editData.isInactive 
                    ? "bg-gray-800/50 text-gray-500 cursor-not-allowed" 
                    : "bg-gray-700/50 text-blue-300 hover:bg-gray-700 hover:text-grey-500"
                }`}
              >
                <Users size={16} /> Edit Roles
              </button>
              
              <button 
                onClick={handleEditPermissions}
                disabled={editData.isInactive}
                className={`flex items-center gap-2 border border-gray-600 px-3 py-1.5 rounded transition-colors ${
                  editData.isInactive 
                    ? "bg-gray-800/50 text-gray-500 cursor-not-allowed" 
                    : "bg-gray-700/50 text-green-300 hover:bg-gray-700 hover:text-grey-500"
                }`}
              >
                <Lock size={16} /> Edit Permissions
              </button>

              {hasPermission(PERMISSIONS.USER.DELETE) && !editData.isInactive && (
                <button
                  onClick={handleDelete}
                  className="ml-auto p-1.5 border border-red-900/50 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40"
                  title="Delete User"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* BODY */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              
              {/* Username */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">
                  <span className="text-red-500">*</span> Username
                </label>
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData((p) => ({ ...p, username: e.target.value }))}
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">
                  <span className="text-red-500">*</span> Display Name
                </label>
                <input
                  type="text"
                  value={editData.displayName}
                  onChange={(e) => setEditData((p) => ({ ...p, displayName: e.target.value }))}
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Email */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-right text-gray-300 text-sm">Email</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))}
                    disabled={editData.isInactive}
                    className={`flex-1 bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-white-500 outline-none ${
                      editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                    }`}
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
                <label className="text-right text-gray-300 text-sm pt-2">User Image</label>
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
                      className={`flex items-center gap-2 border border-gray-600 text-white px-4 py-2 rounded text-sm ${
                        editData.isInactive 
                          ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                          : "bg-gray-700 hover:bg-gray-600"
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
                  <div className="w-full h-32 bg-gray-800/30 border border-gray-700 rounded flex items-center justify-center overflow-hidden">
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
                <label className="text-right text-gray-300 text-sm">Source</label>
                <div className="w-full bg-gray-800/30 border border-gray-700 rounded px-3 py-2 text-sm text-gray-400">
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
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden"> 

          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            User Management
          </h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-1 mb-4">
            <div className="flex items-center bg-gray-700 px-2 py-1.5 w-full sm:w-60 rounded border border-gray-600">
              <Search size={16} className="text-gray-300" />
              <input
                className="bg-transparent pl-2 w-full text-sm text-gray-200 outline-none"
                placeholder="search..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 border border-gray-600 rounded text-sm"
            >
              <Plus size={16} /> New User
            </button>

            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadUsers();
                if (showInactive) loadInactiveUsers();
              }}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
            >
              <RefreshCw className="text-blue-400" size={16} />
            </button>

            <button
              onClick={() => setColumnModalOpen(true)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
            >
              <List className="text-blue-300" size={16} />
            </button>

            <button
              onClick={async () => {
                if (!showInactive) await loadInactiveUsers();
                setShowInactive((s) => !s);
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
            </button>
          </div>

          {/* TABLE */}
        <div className="flex-grow overflow-auto min-h-0">
          <div className="w-full overflow-auto">
            <table className="w-[700px] text-left border-separate border-spacing-y-1 text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10 text-center">
                <tr className="text-white">
                  {visibleColumns.userId && (
                    <SortableHeader
                      label="ID"
                      sortOrder={sortOrder}
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        )
                      }
                    />
                  )}

                  {visibleColumns.username && (
                    <th className="pb-1 border-b border-white text-center">
                      Username
                    </th>
                  )}

                  {visibleColumns.displayName && (
                    <th className="pb-1 border-b border-white text-center">
                      Display Name
                    </th>
                  )}

                  {visibleColumns.email && (
                    <th className="pb-1 border-b border-white text-center">
                      Email
                    </th>
                  )}

                  {visibleColumns.source && (
                    <th className="pb-1 border-b border-white text-center">
                      Source
                    </th>
                  )}
                </tr>
              </thead>

              {/* ✅ BODY NOW ALL CENTERED */}
              <tbody className="text-center">
                {sortedUsers.length === 0 && !showInactive && (
                  <tr>
                    <td
                      colSpan={
                        Object.values(visibleColumns).filter(Boolean).length
                      }
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      No records found
                    </td>
                  </tr>
                )}

                {sortedUsers.map((item) => {
                  const id = item.userId ?? item.UserId;
                  return (
                    <tr
                      key={id}
                      onClick={() => openEditModal(item, false)}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.userId && (
                        <td className="px-2 py-2 text-center">{id}</td>
                      )}

                      {visibleColumns.username && (
                        <td className="px-2 py-2 text-center">
                          {item.username}
                        </td>
                      )}

                      {visibleColumns.displayName && (
                        <td className="px-2 py-2 text-center">
                          {item.displayName}
                        </td>
                      )}

                      {visibleColumns.email && (
                        <td className="px-2 py-2 text-center">
                          {item.email}
                        </td>
                      )}

                      {visibleColumns.source && (
                        <td className="px-2 py-2 text-center">
                          {item.source}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {showInactive &&
                  inactiveUsers.map((item) => {
                    const id = item.userId ?? item.UserId;
                    return (
                      <tr
                        key={`inactive-${id}`}
                        onClick={() => openEditModal(item, true)}
                        className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                      >
                        {visibleColumns.userId && (
                          <td className="px-2 py-2 text-center">{id}</td>
                        )}

                        {visibleColumns.username && (
                          <td className="px-2 py-2 text-center">
                            {item.username}
                          </td>
                        )}

                        {visibleColumns.displayName && (
                          <td className="px-2 py-2 text-center">
                            {item.displayName}
                          </td>
                        )}

                        {visibleColumns.email && (
                          <td className="px-2 py-2 text-center">
                            {item.email}
                          </td>
                        )}

                        {visibleColumns.source && (
                          <td className="px-2 py-2 text-center">
                            {item.source}
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

           
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                // onRefresh={handleRefresh}
              />
        </div>
      </div>
      {/* ROLES MODAL */}
      {rolesModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
          <div className="w-[95%] sm:w-[600px] md:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-gray-700 bg-gray-900/50">
              <h3 className="text-lg text-white-500 font-normal">Edit User Roles ({editData.displayName || editData.username})</h3>
              <button onClick={() => setRolesModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 sm:px-5 border-b border-gray-700 bg-gray-800/30">
              <div className="flex items-center bg-gray-800/50 rounded px-3 border border-gray-600 focus-within:border-white-500 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm p-2.5 w-full text-white placeholder-gray-500"
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
  className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-800"
>
<input
  type="checkbox"
  checked={selectedRoles.includes(role.id)}
  onChange={() => toggleRole(role.id)}
  className="
    w-4 h-4
    accent-emerald-500
    bg-gray-800
    border-gray-500
    rounded
    cursor-pointer
  "
/>


  <span className="text-sm cursor-pointer"
        onClick={() => toggleRole(role.id)}>
    {role.roleName}
  </span>
</div>

              ))}

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 sm:px-5 border-t border-gray-700 bg-gray-900/50">
              <button
                onClick={() => setRolesModalOpen(false)}
                className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-800 hover:text-white text-sm transition-colors"
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
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Save Roles
              </button>

            </div>
          </div>
        </div>
      )}
    </PageLayout>
      {/* PERMISSIONS MODAL (MATCHING ROLES STYLE) */}
      {permissionsModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[70]">
          <div className="w-[600px] max-h-[85vh] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700 bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Lock size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg text-white font-normal">Edit User Permissions</h3>
                  <p className="text-sm text-gray-400">Override permissions for {editData.displayName}</p>
                </div>
              </div>
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
                    />
                  ))
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
    </>
  );
};

export default UserManagement;



