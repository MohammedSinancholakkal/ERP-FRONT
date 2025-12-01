// src/pages/administration/Users.jsx
import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getUsersApi,
  addUserApi,
  updateUserApi,
  deleteUserApi,
  searchUserApi,
  getInactiveUsersApi,
  restoreUserApi,
} from "../../services/allAPI"; // make sure these exist and map to backend routes

import SortableHeader from "../../components/SortableHeader";
import { serverURL } from "../../services/serverURL";

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

  // Column Picker
  const defaultColumns = {
    userId: true,
    username: true,
    displayName: true,
    email: true,
    source: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

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

      // Build payload as FormData to support file upload
      const payload = new FormData();
      payload.append("username", editData.username.trim());
      payload.append("displayName", editData.displayName.trim());
      payload.append("email", editData.email?.trim() || "");
      payload.append("source", editData.source || "site");
      payload.append("userId", currentUserId);

      // Determine what to send for image:
      // - if editData.userImage is a File -> new image uploaded
      // - if editData.userImage === "" -> user removed image (send userImage empty string)
      // - else (keep old): don't send any file or userImage signal
      if (editData.userImage instanceof File) {
        payload.append("userImage", editData.userImage);
      } else if (editData.userImage === "") {
        payload.append("userImage", ""); // signal removal
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
    try {
      const res = await deleteUserApi(editData.userId, {
        userId: currentUserId,
      });
      if (res.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadUsers();
        if (showInactive) loadInactiveUsers();
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  // Restore user
  const handleRestore = async () => {
    try {
      const res = await restoreUserApi(editData.userId, {
        userId: currentUserId,
      });
      if (res.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadUsers();
        loadInactiveUsers();
      }
    } catch {
      toast.error("Restore failed");
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

  // JSX render (structure + style same as Banks.jsx)
  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[600px] md:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-base sm:text-lg font-semibold">New User</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm mb-1">Username *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, username: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Display Name *</label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, displayName: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, password: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) =>
                    setNewUser((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">User Image</label>

                <input
                  id="userImageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleNewFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("userImageUpload").click()
                  }
                  className="w-full bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded hover:bg-gray-700 text-sm sm:text-base"
                >
                  Select Image
                </button>

                {newUser.userImagePreview && (
                  <div className="mt-3">
                    <img
                      src={newUser.userImagePreview}
                      alt="preview"
                      className="h-24 w-24 sm:h-32 sm:w-auto border border-gray-700 rounded object-cover"
                    />
                    <button
                      onClick={removeNewImage}
                      className="mt-2 bg-red-600 px-3 py-1 rounded text-xs"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-gray-700">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gray-800 px-3 sm:px-4 py-2 rounded border border-gray-600 text-sm sm:text-base"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[600px] md:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between px-4 sm:px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-base sm:text-lg font-semibold">
                {editData.isInactive
                  ? "Restore User"
                  : `Edit User (${editData.displayName || ""})`}
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X size={20} className="text-gray-300" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm mb-1">Username</label>
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, username: e.target.value }))
                  }
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Display Name</label>
                <input
                  type="text"
                  value={editData.displayName}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, displayName: e.target.value }))
                  }
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, email: e.target.value }))
                  }
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Image upload (read-only for inactive) */}
              <div>
                <label className="block text-sm mb-1">User Image</label>

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
                  onClick={() =>
                    !editData.isInactive &&
                    document.getElementById("editUserImageUpload").click()
                  }
                  disabled={editData.isInactive}
                  className={`w-full px-3 py-2 rounded border text-sm sm:text-base mb-2 ${
                    editData.isInactive
                      ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Select Image
                </button>

                {previewImage ? (
                  <div className="mt-3">
                    <img
                      src={previewImage}
                      alt="user"
                      className="h-24 w-24 sm:h-32 sm:w-auto border border-gray-700 rounded object-cover"
                    />
                    {!editData.isInactive && (
                      <button
                        onClick={removeEditImage}
                        className="mt-2 bg-red-600 px-3 py-1 rounded text-xs"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
              {editData.isInactive ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-600 px-3 sm:px-4 py-2 rounded border border-green-900 text-sm sm:text-base"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 px-3 sm:px-4 py-2 rounded border border-red-900 text-sm sm:text-base"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {!editData.isInactive && (
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 bg-gray-800 px-3 sm:px-4 py-2 rounded border border-gray-600 text-blue-300 text-sm sm:text-base"
                >
                  <Save size={16} /> Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[750px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold">
                Column Picker
              </h2>
              <button onClick={() => setColumnModal(false)}>
                <X size={22} className="text-gray-300" />
              </button>
            </div>

            <div className="px-4 sm:px-5 py-3">
              <input
                type="text"
                placeholder="Search columns…"
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-5 pb-5">
              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <h3 className="text-sm font-medium mb-3">Visible Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((c) => visibleColumns[c])
                  .filter((c) => c.toLowerCase().includes(searchColumn))
                  .map((c) => (
                    <div
                      key={c}
                      className="flex justify-between bg-gray-700 p-2 rounded mb-2"
                    >
                      <span>{c}</span>
                      <button
                        onClick={() => toggleColumn(c)}
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <h3 className="text-sm font-medium mb-3">Hidden Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((c) => !visibleColumns[c])
                  .filter((c) => c.toLowerCase().includes(searchColumn))
                  .map((c) => (
                    <div
                      key={c}
                      className="flex justify-between bg-gray-700 p-2 rounded mb-2"
                    >
                      <span>{c}</span>
                      <button
                        onClick={() => toggleColumn(c)}
                        className="text-green-400"
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 px-4 sm:px-5 py-3 border-t border-gray-700">
              <button
                onClick={restoreDefaultColumns}
                className="px-3 sm:px-4 py-2 bg-gray-800 border border-gray-600 rounded text-sm sm:text-base"
              >
                Restore Defaults
              </button>
              <button
                onClick={() => setColumnModal(false)}
                className="px-3 sm:px-4 py-2 bg-gray-800 border border-gray-600 rounded text-sm sm:text-base"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 sm:p-6 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-112px)] overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            User Management
          </h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
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
              onClick={() => setColumnModal(true)}
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
              <table className="w-[900px] text-left border-separate border-spacing-y-1 text-sm">
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
                          <td className="px-2 py-2">{id}</td>
                        )}
                        {visibleColumns.username && (
                          <td className="px-2 py-2 text-left">
                            {item.username}
                          </td>
                        )}
                        {visibleColumns.displayName && (
                          <td className="px-2 py-2 text-left">
                            {item.displayName}
                          </td>
                        )}
                        {visibleColumns.email && (
                          <td className="px-2 py-2">{item.email}</td>
                        )}
                        {visibleColumns.source && (
                          <td className="px-2 py-2">{item.source}</td>
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
                            <td className="px-2 py-2">{id}</td>
                          )}
                          {visibleColumns.username && (
                            <td className="px-2 py-2 text-left">
                              {item.username}
                            </td>
                          )}
                          {visibleColumns.displayName && (
                            <td className="px-2 py-2 text-left">
                              {item.displayName}
                            </td>
                          )}
                          {visibleColumns.email && (
                            <td className="px-2 py-2">{item.email}</td>
                          )}
                          {visibleColumns.source && (
                            <td className="px-2 py-2">{item.source}</td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="mt-5 sticky bottom-0 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
                value={page}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= totalPages) setPage(value);
                }}
              />

              <span>/ {totalPages}</span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsRight size={16} />
              </button>

              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadUsers();
                  if (showInactive) loadInactiveUsers();
                }}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <RefreshCw size={16} />
              </button>

              <span>
                Showing <b>{start <= totalRecords ? start : 0}</b> to{" "}
                <b>{end}</b> of <b>{totalRecords}</b> records
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserManagement;
