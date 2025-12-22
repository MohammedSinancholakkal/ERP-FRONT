import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
  Lock,
  CheckCircle2,
  ChevronDown,
  Check,
  Ban,
} from "lucide-react";

import toast from "react-hot-toast";

// API
import {
  addRoleApi,
  getRolesApi,
  updateRoleApi,
  deleteRoleApi,
  searchRoleApi,
  getInactiveRolesApi,
  restoreRoleApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

const mockPermissions = [
  {
    id: 1,
    name: "Administration",
    granted: false,
    children: [
      { id: 11, name: "Administration:General", granted: true },
      {
        id: 12,
        name: "Currencies",
        granted: false,
        children: [
          { id: 121, name: "Create", granted: false },
          { id: 122, name: "Delete", granted: false },
          { id: 123, name: "Update", granted: false },
          { id: 124, name: "View", granted: false },
        ]
      },
       {
        id: 13,
        name: "Languages and Translations",
        granted: false,
      },
       {
        id: 14,
        name: "Payroll Group",
        granted: false,
      },
       {
        id: 15,
        name: "Settings",
        granted: false,
      },
       {
        id: 16,
        name: "User, Role Management and Permissions",
        granted: false,
      },
    ]
  }
];

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

const Roles = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

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
  const [permissions, setPermissions] = useState(mockPermissions);

  const togglePermission = (id) => {
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

    setPermissions(prev => updateRecursive(prev));
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

  const [sortOrder, setSortOrder] = useState("asc");

  // Sort Active Records
  const sortedRoles = [...roles];
  if (sortOrder === "asc") {
    sortedRoles.sort((a, b) => a.id - b.id);
  }

  // LOAD ACTIVE ROLES
  const loadRoles = async () => {
    setSearchText("");
    const res = await getRolesApi(page, limit);
    if (res?.status === 200) {
      setRoles(res.data.records);
      setTotalRecords(res.data.total);
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
      setInactiveRoles(res.data.records || res.data);
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
      setRoles(res.data);
    }
  };

  // ADD
  const handleAddRole = async () => {
    if (!newRole.trim()) return toast.error("Role name required");

    const res = await addRoleApi({
      name: newRole,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Role added");
      setNewRole("");
      setModalOpen(false);
      loadRoles();
    } else {
      toast.error("Failed to add");
    }
  };

  // UPDATE
  const handleUpdateRole = async () => {
    if (!editRole.roleName.trim())
      return toast.error("Name cannot be empty");

    const res = await updateRoleApi(editRole.id, {
      name: editRole.roleName,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Role updated");
      setEditModalOpen(false);
      loadRoles();
      if (showInactive) loadInactive();
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE
  const handleDeleteRole = async () => {
    const res = await deleteRoleApi(editRole.id, {
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Role deleted");
      setEditModalOpen(false);
      loadRoles();
      if (showInactive) loadInactive();
    } else {
      toast.error("Delete failed");
    }
  };

  // RESTORE
  const handleRestoreRole = async () => {
    const res = await restoreRoleApi(editRole.id, {
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Role restored");
      setEditModalOpen(false);
      loadRoles();
      loadInactive();
    } else {
      toast.error("Failed to restore");
    }
  };

  // PERMISSIONS
  const handleEditPermissions = () => {
    setPermissionsModalOpen(true);
  };

  return (
    <>
      {/* =============================
          ADD ROLE MODAL
      ============================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">

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
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

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
              {!editRole.isInactive && (
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

              {!editRole.isInactive && (
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
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60]">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* SEARCH */}
            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="search columns..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-60 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            {/* COLUMN SELECT */}
            <div className="grid grid-cols-2 gap-4 px-5 pb-5">

              {/* VISIBLE COLUMNS */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">👁 Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                    >
                      <span>☰ {col.toUpperCase()}</span>
                      <button className="text-red-400" onClick={() => toggleColumn(col)}>
                        ✖
                      </button>
                    </div>
                  ))}
              </div>

              {/* HIDDEN COLUMNS */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">📋 Hidden Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                    >
                      <span>☰ {col.toUpperCase()}</span>
                      <button className="text-green-400" onClick={() => toggleColumn(col)}>
                        ➕
                      </button>
                    </div>
                  ))}

                {Object.keys(visibleColumns).filter((col) => !visibleColumns[col]).length === 0 && (
                  <p className="text-gray-400 text-sm">No hidden columns</p>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={restoreDefaultColumns}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>
              <button
                onClick={() => setColumnModal(false)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}


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
              {permissions.map(item => (
                  <PermissionItem key={item.id} item={item} onToggle={togglePermission} />
              ))}
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
                onClick={() => setPermissionsModalOpen(false)}
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
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden"> 

          <h2 className="text-2xl font-semibold mb-4">Roles</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">

            {/* SEARCH */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-60">
              <Search size={16} className="text-gray-300" />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent outline-none pl-2 text-gray-200 w-full text-sm"
              />
            </div>

            {/* ADD */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"
            >
              <Plus size={16} /> New Role
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadRoles();
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* COLUMN PICKER */}
            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <List size={16} className="text-blue-300" />
            </button>

            {/* INACTIVE */}
            <button
              onClick={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
            </button>
          </div>

          {/* ==========================
                  TABLE
          =========================== */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="w-[400px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">

                    {visibleColumns.id && (
                      <th
                        className="pb-1 border-b border-white text-center cursor-pointer select-none"
                        onClick={() => setSortOrder((prev) => (prev === "asc" ? null : "asc"))}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {sortOrder === "asc" && <span>▲</span>}
                          {sortOrder === null && <span className="opacity-40">⬍</span>}
                          <span>ID</span>
                        </div>
                      </th>
                    )}

                    {visibleColumns.roleName && (
                      <th className="pb-1 border-b border-white text-center">
                        Role Name
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>

                  {/* ACTIVE */}
                  {sortedRoles.map((r) => (
                    <tr
                      key={r.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => {
                        setEditRole({ id: r.id, roleName: r.roleName, isInactive: false });
                        setEditModalOpen(true);
                      }}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center">{r.id}</td>
                      )}
                      {visibleColumns.roleName && (
                        <td className="px-2 py-1 text-center">{r.roleName}</td>
                      )}
                    </tr>
                  ))}

                  {/* INACTIVE */}
                  {showInactive &&
                    inactiveRoles.map((r) => (
                      <tr
                        key={`inactive-${r.id}`}
                        className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                        onClick={() => {
                          setEditRole({
                            id: r.id,
                            roleName: r.roleName,
                            isInactive: true,
                          });
                          setEditModalOpen(true);
                        }}
                      >
                        {visibleColumns.id && (
                          <td className="px-2 py-1 text-center">{r.id}</td>
                        )}
                        {visibleColumns.roleName && (
                          <td className="px-2 py-1 text-center">{r.roleName}</td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

 {/* PAGINATION */}
           
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
</PageLayout>
    </>
  );
};

export default Roles;



