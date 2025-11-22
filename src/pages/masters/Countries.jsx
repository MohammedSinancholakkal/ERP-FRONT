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
} from "lucide-react";

import toast from "react-hot-toast";

// API
import {
  addCountryApi,
  getCountriesApi,
  updateCountryApi,
  deleteCountryApi,
  searchCountryApi,
} from "../../services/allAPI";

const Countries = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [countries, setCountries] = useState([]);
  const [newCountry, setNewCountry] = useState("");

  // EDIT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCountry, setEditCountry] = useState({ id: null, name: "" });


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

  // =============================
  // COLUMN PICKER STATE
  // =============================
  const defaultColumns = {
    id: true,
    name: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };


  const [sortOrder, setSortOrder] = useState("asc");


  // MUST BE HERE — inside component, before return
  const sortedCountries = [...countries];
  if (sortOrder === "asc") {
    sortedCountries.sort((a, b) => a.id - b.id);
  } 

  // =============================
  // LOAD COUNTRIES
  // =============================
  const loadCountries = async () => {
    setSearchText(""); 
    const res = await getCountriesApi(page, limit);
    if (res?.status === 200) {
      setCountries(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      toast.error("Failed to load countries");
    }
  };



  useEffect(() => {
    loadCountries();
}, [page, limit]);



  // =============================
  // BACKEND SEARCH
  // =============================
  const handleSearch = async (text) => {
    setSearchText(text);

    if (text.trim() === "") {
      loadCountries();
      return;
    }

    const res = await searchCountryApi(text);
    if (res?.status === 200) {
      setCountries(res.data);
    }
  };

  // =============================
  // ADD COUNTRY
  // =============================
  const handleAddCountry = async () => {
    if (!newCountry.trim()) return toast.error("Country name required");

    const res = await addCountryApi({
      name: newCountry,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Country added");
      setNewCountry("");
      setModalOpen(false);
      loadCountries();
    } else {
      toast.error("Failed to add");
    }
  };

  // =============================
  // UPDATE COUNTRY
  // =============================
  const handleUpdateCountry = async () => {
    if (!editCountry.name.trim()) {
      return toast.error("Name cannot be empty");
    }

    const res = await updateCountryApi(editCountry.id, {
      name: editCountry.name,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Country updated");
      setEditModalOpen(false);
      loadCountries();
    } else {
      toast.error("Update failed");
    }
  };

  // =============================
  // DELETE COUNTRY
  // =============================
  const handleDeleteCountry = async () => {
    const res = await deleteCountryApi(editCountry.id, {
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Country deleted");
      setEditModalOpen(false);
      loadCountries();
    } else {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      {/* =============================
            ADD COUNTRY MODAL
      ============================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">

            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Country</h2>

              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>

              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="Enter country name"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddCountry}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================
            EDIT COUNTRY MODAL
      ============================== */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Country ({editCountry.name})</h2>

              <button onClick={() => setEditModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm mb-1">Name *</label>

              <input
                type="text"
                value={editCountry.name}
                onChange={(e) =>
                  setEditCountry((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleDeleteCountry}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                onClick={handleUpdateCountry}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
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

            {/* VISIBLE / HIDDEN COLUMNS */}
            <div className="grid grid-cols-2 gap-4 px-5 pb-5">

              {/* Visible */}
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

              {/* Hidden */}
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

                {Object.keys(visibleColumns).filter(
                  (col) => !visibleColumns[col]
                ).length === 0 && (
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
      MAIN PAGE
============================== */}
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">

    <h2 className="text-2xl font-semibold mb-4">Countries</h2>

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
        className="
          flex items-center gap-1.5 
          bg-gray-700 px-3 py-1.5 
          rounded-md border border-gray-600 
          text-sm hover:bg-gray-600
        "
      >
        <Plus size={16} /> New Country
      </button>

      {/* REFRESH */}
      <button
        onClick={() => {
          setSearchText("");
          setPage(1);
          loadCountries();
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

    {/* TABLE AREA */}
    <div className="flex-grow overflow-auto min-h-0 w-full">
    <div className="w-full overflow-auto">
      <table className="w-[400px] text-left border-separate border-spacing-y-1 text-sm">
        <thead className="sticky top-0 bg-gray-900 z-10">
          <tr className="text-white">
            {visibleColumns.id && (
             <th
             className={`pb-1 border-b text-center cursor-pointer select-none transition 
               ${sortOrder ? "border-white" : "border-white"}`}
             onClick={() => {
               setSortOrder((prev) => (prev === "asc" ? null : "asc"));
             }}
           >
             <div className="flex items-center justify-center gap-1">
           
               {/* Sort icon first (LEFT side) */}
               {sortOrder === "asc" && <span>▲</span>}
               {sortOrder === null && <span className="opacity-40">⬍</span>}
           
               {/* Text */}
               <span>ID</span>
             </div>
           </th>
           
            )}

            {visibleColumns.name && (
              <th className="pb-1 border-b border-white text-center">Name</th>
            )}
          </tr>
        </thead>

        <tbody>
          {sortedCountries.map((c) => (
            <tr
              key={c.id}
              className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
              onClick={() => {
                setEditCountry({ id: c.id, name: c.name });
                setEditModalOpen(true);
              }}
            >
              {visibleColumns.id && (
                <td className="px-2 py-1 text-center">{c.id}</td>
              )}
              {visibleColumns.name && (
                <td className="px-2 py-1 text-center">{c.name}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

    {/* STICKY PAGINATION */}
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
            loadCountries();
          }}
          className="p-1 bg-gray-800 border border-gray-700 rounded"
        >
          <RefreshCw size={16} />
        </button>

        <span>
          Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b> of{" "}
          <b>{totalRecords}</b> records
        </span>

      </div>
    </div>

  </div>
</div>


    </>
  );
};

export default Countries;
