import React, { useState, useEffect, useRef } from "react";
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
  ArchiveRestore
} from "lucide-react";

import toast from "react-hot-toast";

import {
  addDepartmentApi,
  getDepartmentsApi,
  updateDepartmentApi,
  deleteDepartmentApi,
  searchDepartmentApi,
  getInactiveDepartmentsApi,
  restoreDepartmentApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";

const Departments = () => {
  // =============================
  // STATES
  // =============================
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [inactiveDepartments, setInactiveDepartments] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newDepartment, setNewDepartment] = useState({
    department: "",
    description: "",
    parentDepartmentId: null
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState({
    id: null,
    department: "",
    description: "",
    parentDepartmentId: null,
    parentName: "",
    isInactive: false
  });

 // pagination
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(25);
 const [totalRecords, setTotalRecords] = useState(0);

 // REQUIRED VALUES
 const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
 const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
 const end = Math.min(page * limit, totalRecords);


  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    department: true,
    description: true,
    parentName: true
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // SORT
  const [sortOrder, setSortOrder] = useState("asc");
  const sortedDepartments = [...departments];
  if (sortOrder === "asc") sortedDepartments.sort((a, b) => a.id - b.id);

  // =============================
  // SEARCHABLE DROPDOWN STATES
  // =============================
  const [parentSearchAdd, setParentSearchAdd] = useState("");
  const [parentSearchEdit, setParentSearchEdit] = useState("");
  const [parentDropdownAddOpen, setParentDropdownAddOpen] = useState(false);
  const [parentDropdownEditOpen, setParentDropdownEditOpen] = useState(false);

  const addDropdownRef = useRef(null);
  const editDropdownRef = useRef(null);

  // close dropdown if clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
        setParentDropdownAddOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target)) {
        setParentDropdownEditOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // =============================
  // LOADERS
  // =============================
  const loadDepartments = async () => {
    const res = await getDepartmentsApi(page, limit);
    if (res.status === 200) {
      setDepartments(res.data.records);
      setTotalRecords(res.data.total);
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveDepartmentsApi();
    if (res.status === 200) {
      setInactiveDepartments(res.data.records || res.data);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [page, limit]);

  // =============================
  // SEARCH HANDLER
  // =============================
  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) return loadDepartments();

    const res = await searchDepartmentApi(text.trim());
    if (res.status === 200) {
      setDepartments(res.data);
    }
  };

  // =============================
  // ADD DEPARTMENT
  // =============================
  const handleAdd = async () => {
    if (!newDepartment.department.trim()) return toast.error("Department required");

    const res = await addDepartmentApi({
      ...newDepartment,
      userId: currentUserId
    });

    if (res.status === 200) {
      toast.success("Department added");
      setNewDepartment({ department: "", description: "", parentDepartmentId: null });
      setParentSearchAdd("");
      setModalOpen(false);
      loadDepartments();
    }
  };

  // =============================
  // UPDATE
  // =============================
  const handleUpdate = async () => {
    if (!editDepartment.department.trim()) return toast.error("Department required");

    const payload = {
      department: editDepartment.department,
      description: editDepartment.description,
      parentDepartmentId: editDepartment.parentDepartmentId || null,
      userId: currentUserId
    };

    const res = await updateDepartmentApi(editDepartment.id, payload);

    if (res.status === 200) {
      toast.success("Updated");
      setParentSearchEdit("");
      setEditModalOpen(false);
      loadDepartments();
    }
  };

  // =============================
  // DELETE
  // =============================
  const handleDelete = async () => {
    const res = await deleteDepartmentApi(editDepartment.id, { userId: currentUserId });

    if (res.status === 200) {
      toast.success("Deleted");
      setEditModalOpen(false);
      loadDepartments();
      if (showInactive) loadInactive();
    }
  };

  // =============================
  // RESTORE
  // =============================
  const handleRestore = async () => {
    const res = await restoreDepartmentApi(editDepartment.id, { userId: currentUserId });

    if (res.status === 200) {
      toast.success("Restored");
      setEditModalOpen(false);
      loadDepartments();
      loadInactive();
    }
  };

  // =============================
  // FILTER FOR DROPDOWN
  // =============================
  const filteredAddParents = departments.filter((c) =>
    c.department.toLowerCase().includes(parentSearchAdd.toLowerCase())
  );

  const filteredEditParents = departments.filter((c) =>
    c.department.toLowerCase().includes(parentSearchEdit.toLowerCase())
  );

  // DROP-DOWN LABEL GETTER
  const getParentName = (id) => {
    const c = departments.find((x) => String(x.id) === String(id));
    return c ? c.department : "";
  };

  return (
    <>
{/* =============================
    ADD DEPARTMENT MODAL
============================= */}
{modalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
      
      {/* HEADER */}
      <div className="flex justify-between px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg">New Department</h2>
        <button onClick={() => setModalOpen(false)}>
          <X size={20} className="text-gray-300" />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6">
        {/* DEPARTMENT */}
        <label>Department *</label>
        <input
          type="text"
          value={newDepartment.department}
          onChange={(e) =>
            setNewDepartment((p) => ({ ...p, department: e.target.value }))
          }
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-4"
        />

        {/* DESCRIPTION */}
        <label>Description</label>
        <textarea
          value={newDepartment.description}
          onChange={(e) =>
            setNewDepartment((p) => ({ ...p, description: e.target.value }))
          }
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 mb-4"
        />

        {/* PARENT DEPARTMENT */}
        <label>Parent Department</label>

        <div className="relative mt-1" ref={addDropdownRef}>
          <input
            type="text"
            placeholder="Search parent department..."
            value={
              parentSearchAdd ||
              newDepartment.parentName ||
              getParentName(newDepartment.parentDepartmentId)
            }
            onChange={(e) => {
              setParentSearchAdd(e.target.value);
              setParentDropdownAddOpen(true);
            }}
            onFocus={() => setParentDropdownAddOpen(true)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
          />

          {parentDropdownAddOpen && (
            <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded mt-1 max-h-56 overflow-auto z-50">
              {filteredAddParents.length > 0 ? (
                filteredAddParents.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setNewDepartment((p) => ({
                        ...p,
                        parentDepartmentId: c.id,
                        parentName: c.department
                      }));
                      setParentSearchAdd("");
                      setParentDropdownAddOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                  >
                    {c.department}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-400">No matches</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300"
        >
          <Save size={16} /> Save
        </button>
      </div>
    </div>
  </div>
)}

{/* =============================
    EDIT DEPARTMENT MODAL
============================= */}
{editModalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
      
      {/* HEADER */}
      <div className="flex justify-between px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg">
          {editDepartment.isInactive ? "Restore Department" : "Edit Department"}
        </h2>
        <button onClick={() => setEditModalOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6">
        {/* DEPARTMENT */}
        <label>Department *</label>
        <input
          value={editDepartment.department}
          onChange={(e) =>
            setEditDepartment((p) => ({ ...p, department: e.target.value }))
          }
          disabled={editDepartment.isInactive}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-4"
        />

        {/* DESCRIPTION */}
        <label>Description</label>
        <textarea
          value={editDepartment.description}
          onChange={(e) =>
            setEditDepartment((p) => ({ ...p, description: e.target.value }))
          }
          disabled={editDepartment.isInactive}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 mb-4"
        />

        {/* PARENT DEPARTMENT */}
        <label>Parent Department</label>

        <div className="relative mt-1" ref={editDropdownRef}>
          <input
            type="text"
            placeholder="Search parent department..."
            value={
              parentSearchEdit ||
              editDepartment.parentName ||
              getParentName(editDepartment.parentDepartmentId)
            }
            onChange={(e) => {
              setParentSearchEdit(e.target.value);
              setParentDropdownEditOpen(true);
            }}
            onFocus={() => setParentDropdownEditOpen(true)}
            disabled={editDepartment.isInactive}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
          />

          {parentDropdownEditOpen && (
            <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded mt-1 max-h-56 overflow-auto z-50">
              {filteredEditParents.length > 0 ? (
                filteredEditParents.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setEditDepartment((p) => ({
                        ...p,
                        parentDepartmentId: c.id,
                        parentName: c.department
                      }));
                      setParentSearchEdit("");
                      setParentDropdownEditOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                  >
                    {c.department}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-400">No matches</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
        {editDepartment.isInactive ? (
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
          >
            <ArchiveRestore size={16} /> Restore
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}

        {!editDepartment.isInactive && (
          <button
            onClick={handleUpdate}
            className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
          >
            <Save size={16} /> Save
          </button>
        )}
      </div>
    </div>
  </div>
)}


      {/* =============================
          COLUMN PICKER
      ============================= */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
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
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 px-5 pb-5">
              {/* VISIBLE */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        className="text-red-400"
                        onClick={() =>
                          setVisibleColumns((p) => ({
                            ...p,
                            [col]: false
                          }))
                        }
                      >
                        ✖
                      </button>
                    </div>
                  ))}
              </div>

              {/* HIDDEN */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">Hidden Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        className="text-green-400"
                        onClick={() =>
                          setVisibleColumns((p) => ({
                            ...p,
                            [col]: true
                          }))
                        }
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setVisibleColumns(defaultColumns)}
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

      {/* ===================================
              MAIN PAGE
      =================================== */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Departments</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
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
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600">
              <Plus size={16} /> New Department
            </button>

            {/* REFRESH */}
            <button onClick={() => { setSearchText(""); setPage(1); loadDepartments(); }} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600">
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* COLUMN PICKER */}
            <button onClick={() => setColumnModal(true)} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600">
              <List size={16} className="text-blue-300" />
            </button>

            {/* INACTIVE TOGGLE */}
            <button onClick={async () => { if (!showInactive) await loadInactive(); setShowInactive(!showInactive); }} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1">
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
            </button>
          </div>

          {/* ==========================
                TABLE
          =========================== */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="w-[800px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">
                    {visibleColumns.id && (
                      <th className="pb-1 border-b border-white text-center cursor-pointer select-none" onClick={() => setSortOrder((prev) => (prev === "asc" ? null : "asc"))}>
                        <div className="flex items-center justify-center gap-1">
                          {sortOrder === "asc" && <span>▲</span>}
                          {sortOrder === null && <span className="opacity-40">⬍</span>}
                          <span>ID</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.department && <th className="pb-1 border-b border-white text-center">Department</th>}
                    {visibleColumns.description && <th className="pb-1 border-b border-white text-center">Description</th>}
                    {visibleColumns.parentName && <th className="pb-1 border-b border-white text-center">Parent Department</th>}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE */}
                  {sortedDepartments.map((c) => (
                    <tr key={c.id} className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm" onClick={() => { setEditDepartment({ id: c.id, department: c.department, description: c.description, parentDepartmentId: c.parentDepartmentId, parentName: c.parentName, isInactive: false }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.department && <td className="px-2 py-1 text-center">{c.department}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
                    </tr>
                  ))}

                  {/* INACTIVE */}
                  {showInactive && inactiveDepartments.map((c) => (
                    <tr key={`inactive-${c.id}`} className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm" onClick={() => { setEditDepartment({ id: c.id, department: c.department, description: c.description, parentDepartmentId: c.parentDepartmentId, parentName: c.parentName, isInactive: true }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.department && <td className="px-2 py-1 text-center">{c.department}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
                 <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-gray-800 border border-gray-600 rounded px-2 py-1">
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <button disabled={page === 1} onClick={() => setPage(1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronsLeft size={16} /></button>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronLeft size={16} /></button>

              <span>Page</span>

              <input type="number" className="w-12 bg-gray-800 border border-gray-600 rounded text-center" value={page} onChange={(e) => { const value = Number(e.target.value); if (value >= 1 && value <= totalPages) setPage(value); }} />
              <span>/ {totalPages}</span>

              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronRight size={16} /></button>
              <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"><ChevronsRight size={16} /></button>

              <button onClick={() => { setSearchText(""); setPage(1); loadDepartments(); }} className="p-1 bg-gray-800 border border-gray-700 rounded"><RefreshCw size={16} /></button>

              <span>Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b> of <b>{totalRecords}</b> records</span>
            </div>
          </div>
        </div>
      </div>
      </PageLayout>
      
    </>
  );
};

export default Departments;
