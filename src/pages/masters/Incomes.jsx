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
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getIncomesApi,
  addIncomeApi,
  updateIncomeApi,
  deleteIncomeApi,
  searchIncomeApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const Incomes = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // ====================
  // DATA
  // ====================
  const [incomes, setIncomes] = useState([]);
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ====================
  // ADD FORM
  // ====================
  const [newIncome, setNewIncome] = useState({
    name: "",
    description: "",
  });

  // ====================
  // EDIT FORM
  // ====================
  const [editIncome, setEditIncome] = useState({
    id: null,
    name: "",
    description: "",
  });

  // ====================
  // COLUMN PICKER
  // ====================
  const defaultCols = { id: true, name: true, description: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultCols);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) =>
    setVisibleColumns((p) => ({ ...p, [col]: !p[col] }));

  const restoreDefaults = () => setVisibleColumns(defaultCols);

  // ====================
  // PAGINATION
  // ====================
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.ceil(totalRecords / limit);

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);
  const [sortOrder, setSortOrder] = useState("asc");

const sortedRows = [...incomes];

if (sortOrder === "asc") {
  sortedRows.sort((a, b) => Number(a.id) - Number(b.id));
}


  // ====================
  // LOAD INCOMES
  // ====================
  const loadIncomes = async () => {
    try {
      const res = await getIncomesApi(page, limit);
  
      if (res?.status === 200) {
        const data = res.data;
  
        let rows = [];
  
        if (Array.isArray(data.records)) {
          rows = data.records;
          setTotalRecords(data.total || data.records.length);
        } else if (Array.isArray(data)) {
          rows = data;
          setTotalRecords(data.length);
        }
  
        // Normalize
        const normalized = rows.map((i) => ({
          id: i.Id,
          incomeName: i.IncomeName,
          description: i.Description,
        }));
        
  
        setIncomes(normalized);
      } else {
        toast.error("Failed to load incomes");
      }
    } catch (err) {
      toast.error("Failed to load incomes");
    }
  };
  

  useEffect(() => {
    loadIncomes();
  }, [page, limit]);

  // ====================
  // SEARCH
  // ====================
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      loadIncomes();
      return;
    }

    try {
      const res = await searchIncomeApi(value);
      if (res?.status === 200) {
        setIncomes(res.data);
        setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.log("Search error:", err);
    }
  };

  // ====================
  // ADD
  // ====================
  const handleAdd = async () => {
    if (!newIncome.name.trim())
      return toast.error("Name is required");

    try {
      const res = await addIncomeApi({
        incomeName: newIncome.name, 
        description: newIncome.description,
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Income added");
        setModalOpen(false);
        setNewIncome({ name: "", description: "" });
        loadIncomes();
      } else toast.error("Add failed");
    } catch (err) {
      toast.error("Server error");
    }
  };

  // ====================
  // OPEN EDIT MODAL
  // ====================
  const openEdit = (row) => {
    setEditIncome({
      id: row.id,
      name: row.incomeName || row.name, // FIXED
      description: row.description,
    });
    setEditModalOpen(true);
  };

  // ====================
  // UPDATE
  // ====================
  const handleUpdate = async () => {
    if (!editIncome.name.trim())
      return toast.error("Name is required");

    try {
      const res = await updateIncomeApi(editIncome.id, {
        incomeName: editIncome.name, // FIXED
        description: editIncome.description,
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadIncomes();
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // ====================
  // DELETE
  // ====================
  const handleDelete = async () => {
    try {
      const res = await deleteIncomeApi(editIncome.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadIncomes();
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // ====================================================
  // UI START
  // ====================================================
  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Income</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm text-gray-300">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newIncome.name}
                  onChange={(e) =>
                    setNewIncome((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  value={newIncome.description}
                  onChange={(e) =>
                    setNewIncome((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded"
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
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                Edit Income ({editIncome.name})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300">Name</label>
                <input
                  type="text"
                  value={editIncome.name}
                  onChange={(e) =>
                    setEditIncome((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  value={editIncome.description}
                  onChange={(e) =>
                    setEditIncome((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                ></textarea>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded border border-red-900"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={searchColumn}
                onChange={(e) =>
                  setSearchColumn(e.target.value.toLowerCase())
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible columns */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Visible Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        className="text-red-400"
                        onClick={() => toggleColumn(col)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden columns */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>

                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        className="text-green-400"
                        onClick={() => toggleColumn(col)}
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={restoreDefaults}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <button
                onClick={() => setColumnModal(false)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Close
              </button>
            </div>
          </div> 
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 sm:p-6 text-white min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Incomes</h2>

        {/* ACTION BAR */}
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

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded"
          >
            <Plus size={16} /> New Income
          </button>

          <button
            onClick={() => loadIncomes()}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <button
            onClick={() => setColumnModal(true)}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto">
  <table className="w-[450px] border-separate border-spacing-y-1 text-sm">

    {/* HEADER */}
    <thead className="sticky top-0 bg-gray-900 z-10">
      <tr className="text-white text-center">

        {visibleColumns.id && (
          <SortableHeader
            label="ID"
            sortOrder={sortOrder}
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? null : "asc"))
            }
          />
        )}

        {visibleColumns.name && (
          <th className="pb-1 border-b border-white text-center">
            Name
          </th>
        )}

        {visibleColumns.description && (
          <th className="pb-1 border-b border-white text-center">
            Description
          </th>
        )}

      </tr>
    </thead>

    {/* BODY */}
    <tbody className="text-center">

      {sortedRows.length === 0 && (
        <tr>
          <td
            colSpan={Object.values(visibleColumns).filter(Boolean).length}
            className="px-4 py-6 text-center text-gray-400"
          >
            No records found
          </td>
        </tr>
      )}

      {sortedRows.map((row) => (
        <tr
          key={row.id}
          className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
          onClick={() => openEdit(row)}
        >
          {visibleColumns.id && (
            <td className="px-2 py-1 align-middle">{row.id}</td>
          )}

          {visibleColumns.name && (
            <td className="px-2 py-1 align-middle">
              {row.incomeName || row.name}
            </td>
          )}

          {visibleColumns.description && (
            <td className="px-2 py-1 align-middle">
              {row.description}
            </td>
          )}
        </tr>
      ))}

    </tbody>

  </table>
</div>



        {/* PAGINATION */}
        <div className="mt-5 flex flex-wrap items-center gap-3 bg-gray-900/50 px-4 py-2 border border-gray-700 rounded text-sm">
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
            onClick={() => loadIncomes()}
            className="p-1 bg-gray-800 border border-gray-700 rounded"
          >
            <RefreshCw size={16} />
          </button>

          <span>
            Showing <b>{start}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
          </span>
        </div>
      </div>
    </>
  );
};

export default Incomes;
