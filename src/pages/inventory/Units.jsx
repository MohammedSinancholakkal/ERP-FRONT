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
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";

import toast from "react-hot-toast";

// API
import {
  getUnitsApi,
  addUnitApi,
  updateUnitApi,
  deleteUnitApi,
  searchUnitsApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";

const Units = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [units, setUnits] = useState([]);

  const [newUnit, setNewUnit] = useState({ name: "", description: "" });

  // EDIT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUnit, setEditUnit] = useState({
    id: null,
    name: "",
    description: ""
  });

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // search
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
    description: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

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
    }
    setSortConfig({ key, direction });
  };

  const sortedUnits = [...units].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = String(a[sortConfig.key] || "").toLowerCase();
    const valB = String(b[sortConfig.key] || "").toLowerCase();
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // LOAD UNITS
  const loadUnits = async () => {
    setSearchText("");

    const res = await getUnitsApi(page, limit);

    if (res?.status === 200) {
      setUnits(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      toast.error("Failed to load units");
    }
  };

  useEffect(() => {
    loadUnits();
  }, [page, limit]);

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);

    if (text.trim() === "") return loadUnits();

    const res = await searchUnitsApi(text);
    if (res?.status === 200) {
      setUnits(res.data);
    }
  };

  // ADD UNIT
  const handleAddUnit = async () => {
    if (!newUnit.name.trim())
      return toast.error("Unit name required");

    const res = await addUnitApi({
      name: newUnit.name,
      description: newUnit.description,
      userId: user?.userId || 1
    });

    if (res?.status === 200) {
      toast.success("Unit added");
      setNewUnit({ name: "", description: "" });
      setModalOpen(false);
      loadUnits();
    } else {
      toast.error("Failed to add");
    }
  };

  // UPDATE UNIT
  const handleUpdateUnit = async () => {
    if (!editUnit.name.trim())
      return toast.error("Unit name required");

    const res = await updateUnitApi(editUnit.id, {
      name: editUnit.name,
      description: editUnit.description,
      userId: user?.userId || 1
    });

    if (res?.status === 200) {
      toast.success("Unit updated");
      setEditModalOpen(false);
      loadUnits();
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE UNIT
  const handleDeleteUnit = async () => {
    const res = await deleteUnitApi(editUnit.id, {
      userId: user?.userId || 1
    });

    if (res?.status === 200) {
      toast.success("Unit deleted");
      setEditModalOpen(false);
      loadUnits();
    } else {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      {/* ======================================================
          ADD UNIT MODAL
      ======================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Unit</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* NAME */}
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={newUnit.name}
                onChange={(e) =>
                  setNewUnit((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter unit name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mb-4"
              />

              {/* DESCRIPTION */}
              <label className="block text-sm mb-1">Description</label>
              <textarea
                value={newUnit.description}
                onChange={(e) =>
                  setNewUnit((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter description"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-24"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddUnit}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================
          EDIT UNIT MODAL
      ======================================================= */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Unit ({editUnit.name})</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* NAME */}
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                value={editUnit.name}
                onChange={(e) =>
                  setEditUnit((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mb-4"
              />

              {/* DESCRIPTION */}
              <label className="block text-sm mb-1">Description</label>
              <textarea
                value={editUnit.description}
                onChange={(e) =>
                  setEditUnit((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-24"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              
              {/* DELETE */}
              <button
                onClick={handleDeleteUnit}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
              >
                <Trash2 size={16} /> Delete
              </button>

              {/* UPDATE */}
              <button
                onClick={handleUpdateUnit}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          COLUMN PICKER
      ======================================================= */}
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

            {/* COLUMNS */}
            <div className="grid grid-cols-2 gap-4 px-5 pb-5">

              {/* VISIBLE */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">👁 Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
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

              {/* HIDDEN */}
              <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                <h3 className="font-semibold mb-3">📋 Hidden Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
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

      {/* ======================================================
          MAIN PAGE
      ======================================================= */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Units</h2>

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
              <Plus size={16} /> New Unit
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadUnits();
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

          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="w-[500px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">

                    {visibleColumns.id && (
                      <SortableHeader
                        label="ID"
                        sortOrder={sortConfig.key === "id" ? sortConfig.direction : null}
                        onClick={() => handleSort("id")}
                      />
                    )}

                    {visibleColumns.name && (
                      <SortableHeader
                        label="Name"
                        sortOrder={sortConfig.key === "name" ? sortConfig.direction : null}
                        onClick={() => handleSort("name")}
                      />
                    )}

                    {visibleColumns.description && (
                      <SortableHeader
                        label="Description"
                        sortOrder={sortConfig.key === "description" ? sortConfig.direction : null}
                        onClick={() => handleSort("description")}
                      />
                    )}

                  </tr>
                </thead>

                <tbody>
                  {sortedUnits.map((u) => (
                    <tr
                      key={u.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => {
                        setEditUnit({
                          id: u.id,
                          name: u.name,
                          description: u.description,
                        });
                        setEditModalOpen(true);
                      }}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center">{u.id}</td>
                      )}
                      {visibleColumns.name && (
                        <td className="px-2 py-1 text-center">{u.name}</td>
                      )}
                      {visibleColumns.description && (
                        <td className="px-2 py-1 text-center">{u.description}</td>
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
            onRefresh={() => {
              setSearchText("");
              setPage(1);
              loadUnits();
            }}
          />

        </div>
      </div>
      </PageLayout>

    </>
  );
};

export default Units;



