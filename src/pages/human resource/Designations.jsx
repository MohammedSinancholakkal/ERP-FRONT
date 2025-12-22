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
  addDesignationApi,
  getDesignationsApi,
  updateDesignationApi,
  deleteDesignationApi,
  searchDesignationApi,
  getInactiveDesignationsApi,
  restoreDesignationApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

const Designations = () => {
  // =============================
  // STATES
  // =============================
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [designations, setDesignations] = useState([]);
  const [inactiveDesignations, setInactiveDesignations] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newDesignation, setNewDesignation] = useState({
    designation: "",
    description: "",
    parentDesignationId: null
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDesignation, setEditDesignation] = useState({
    id: null,
    designation: "",
    description: "",
    parentDesignationId: null,
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
    designation: true,
    description: true,
    parentName: true
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // SORT
  const [sortOrder, setSortOrder] = useState("asc");
  const sortedDesignations = [...designations];
  if (sortOrder === "asc") sortedDesignations.sort((a, b) => a.id - b.id);

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
  const loadDesignations = async () => {
    const res = await getDesignationsApi(page, limit);
    if (res.status === 200) {
      setDesignations(res.data.records);
      setTotalRecords(res.data.total);
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveDesignationsApi();
    if (res.status === 200) {
      setInactiveDesignations(res.data.records || res.data);
    }
  };

  useEffect(() => {
    loadDesignations();
  }, [page, limit]);

  // =============================
  // SEARCH HANDLER
  // =============================
  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) return loadDesignations();

    const res = await searchDesignationApi(text.trim());
    if (res.status === 200) {
      setDesignations(res.data);
    }
  };

  // =============================
  // ADD DESIGNATION
  // =============================
  const handleAdd = async () => {
    if (!newDesignation.designation.trim()) return toast.error("Designation required");

    const res = await addDesignationApi({
      ...newDesignation,
      userId: currentUserId
    });

    if (res.status === 200) {
      toast.success("Designation added");
      setNewDesignation({ designation: "", description: "", parentDesignationId: null });
      setParentSearchAdd("");
      setModalOpen(false);
      loadDesignations();
    }
  };

  // =============================
  // UPDATE
  // =============================
  const handleUpdate = async () => {
    if (!editDesignation.designation.trim()) return toast.error("Designation required");

    const payload = {
      designation: editDesignation.designation,
      description: editDesignation.description,
      parentDesignationId: editDesignation.parentDesignationId || null,
      userId: currentUserId
    };

    const res = await updateDesignationApi(editDesignation.id, payload);

    if (res.status === 200) {
      toast.success("Updated");
      setParentSearchEdit("");
      setEditModalOpen(false);
      loadDesignations();
    }
  };

  // =============================
  // DELETE
  // =============================
  const handleDelete = async () => {
    const res = await deleteDesignationApi(editDesignation.id, { userId: currentUserId });

    if (res.status === 200) {
      toast.success("Deleted");
      setEditModalOpen(false);
      loadDesignations();
      if (showInactive) loadInactive();
    }
  };

  // =============================
  // RESTORE
  // =============================
  const handleRestore = async () => {
    const res = await restoreDesignationApi(editDesignation.id, { userId: currentUserId });

    if (res.status === 200) {
      toast.success("Restored");
      setEditModalOpen(false);
      loadDesignations();
      loadInactive();
    }
  };

  // =============================
  // FILTER FOR DROPDOWN
  // =============================
  const filteredAddParents = designations.filter((c) =>
    c.designation.toLowerCase().includes(parentSearchAdd.toLowerCase())
  );

  const filteredEditParents = designations.filter((c) =>
    c.designation.toLowerCase().includes(parentSearchEdit.toLowerCase())
  );

  // DROP-DOWN LABEL GETTER
  const getParentName = (id) => {
    const c = designations.find((x) => String(x.id) === String(id));
    return c ? c.designation : "";
  };

  return (
    <>
{/* =============================
    ADD DESIGNATION MODAL
============================= */}
{modalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
      
      {/* HEADER */}
      <div className="flex justify-between px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg">New Designation</h2>
        <button onClick={() => setModalOpen(false)}>
          <X size={20} className="text-gray-300" />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6">
        {/* DESIGNATION */}
        <label>Designation *</label>
        <input
          type="text"
          value={newDesignation.designation}
          onChange={(e) =>
            setNewDesignation((p) => ({ ...p, designation: e.target.value }))
          }
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-4"
        />

        {/* DESCRIPTION */}
        <label>Description</label>
        <textarea
          value={newDesignation.description}
          onChange={(e) =>
            setNewDesignation((p) => ({ ...p, description: e.target.value }))
          }
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 mb-4"
        />

        {/* PARENT DESIGNATION */}
        <label>Parent Designation</label>

        <div className="relative mt-1" ref={addDropdownRef}>
          <input
            type="text"
            placeholder="Search parent designation..."
            value={
              parentSearchAdd ||
              newDesignation.parentName ||
              getParentName(newDesignation.parentDesignationId)
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
                      setNewDesignation((p) => ({
                        ...p,
                        parentDesignationId: c.id,
                        parentName: c.designation
                      }));
                      setParentSearchAdd("");
                      setParentDropdownAddOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                  >
                    {c.designation}
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
    EDIT DESIGNATION MODAL
============================= */}
{editModalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
      
      {/* HEADER */}
      <div className="flex justify-between px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg">
          {editDesignation.isInactive ? "Restore Designation" : "Edit Designation"}
        </h2>
        <button onClick={() => setEditModalOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6">
        {/* DESIGNATION */}
        <label>Designation *</label>
        <input
          value={editDesignation.designation}
          onChange={(e) =>
            setEditDesignation((p) => ({ ...p, designation: e.target.value }))
          }
          disabled={editDesignation.isInactive}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-4"
        />

        {/* DESCRIPTION */}
        <label>Description</label>
        <textarea
          value={editDesignation.description}
          onChange={(e) =>
            setEditDesignation((p) => ({ ...p, description: e.target.value }))
          }
          disabled={editDesignation.isInactive}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 mb-4"
        />

        {/* PARENT DESIGNATION */}
        <label>Parent Designation</label>

        <div className="relative mt-1" ref={editDropdownRef}>
          <input
            type="text"
            placeholder="Search parent designation..."
            value={
              parentSearchEdit ||
              editDesignation.parentName ||
              getParentName(editDesignation.parentDesignationId)
            }
            onChange={(e) => {
              setParentSearchEdit(e.target.value);
              setParentDropdownEditOpen(true);
            }}
            onFocus={() => setParentDropdownEditOpen(true)}
            disabled={editDesignation.isInactive}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
          />

          {parentDropdownEditOpen && (
            <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded mt-1 max-h-56 overflow-auto z-50">
              {filteredEditParents.length > 0 ? (
                filteredEditParents.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setEditDesignation((p) => ({
                        ...p,
                        parentDesignationId: c.id,
                        parentName: c.designation
                      }));
                      setParentSearchEdit("");
                      setParentDropdownEditOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                  >
                    {c.designation}
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
        {editDesignation.isInactive ? (
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

        {!editDesignation.isInactive && (
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
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Designations</h2>

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
              <Plus size={16} /> New Designation
            </button>

            {/* REFRESH */}
            <button onClick={() => { setSearchText(""); setPage(1); loadDesignations(); }} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600">
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
                    {visibleColumns.designation && <th className="pb-1 border-b border-white text-center">Designation</th>}
                    {visibleColumns.description && <th className="pb-1 border-b border-white text-center">Description</th>}
                    {visibleColumns.parentName && <th className="pb-1 border-b border-white text-center">Parent Designation</th>}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE */}
                  {sortedDesignations.map((c) => (
                    <tr key={c.id} className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm" onClick={() => { setEditDesignation({ id: c.id, designation: c.designation, description: c.description, parentDesignationId: c.parentDesignationId, parentName: c.parentName, isInactive: false }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.designation && <td className="px-2 py-1 text-center">{c.designation}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
                    </tr>
                  ))}

                  {/* INACTIVE */}
                  {showInactive && inactiveDesignations.map((c) => (
                    <tr key={`inactive-${c.id}`} className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm" onClick={() => { setEditDesignation({ id: c.id, designation: c.designation, description: c.description, parentDesignationId: c.parentDesignationId, parentName: c.parentName, isInactive: true }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.designation && <td className="px-2 py-1 text-center">{c.designation}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
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

export default Designations;



