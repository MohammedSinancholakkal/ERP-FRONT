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
  getShippersApi,
  addShipperApi,
  updateShipperApi,
  deleteShipperApi,
  searchShipperApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const Shippers = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [shippers, setShippers] = useState([]);
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // -------------------------
  // ADD FORM
  // -------------------------
  const [newData, setNewData] = useState({
    companyName: "",
    phone: "",
  });

  // -------------------------
  // EDIT FORM
  // -------------------------
  const [editData, setEditData] = useState({
    id: null,
    companyName: "",
    phone: "",
  });

  // -------------------------
  // COLUMN PICKER
  // -------------------------
  const defaultCols = { id: true, companyName: true, phone: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultCols);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) =>
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));

  const restoreDefaults = () => setVisibleColumns(defaultCols);

  // -------------------------
  // PAGINATION
  // -------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.ceil(totalRecords / limit);

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // ---------------------------------
  // FORMAT PHONE (Auto-format)
  // ---------------------------------
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const [sortOrder, setSortOrder] = useState("asc");

const sortedShippers = [...shippers];

if (sortOrder === "asc") {
  sortedShippers.sort((a, b) => a.id - b.id);
}


  // ---------------------------------
  // LOAD SHIPPERS
  // ---------------------------------
  const loadShippers = async () => {
    try {
      const res = await getShippersApi(page, limit);

      if (res?.status === 200) {
        const rows = Array.isArray(res.data) ? res.data : res.data.records;

        setShippers(
          rows.map((r) => ({
            id: r.Id,
            companyName: r.CompanyName,
            phone: r.Phone,
          }))
        );

        setTotalRecords(rows.length);
      }
    } catch (err) {
      toast.error("Failed to load shippers");
    }
  };

  useEffect(() => {
    loadShippers();
  }, [page, limit]);

  // ---------------------------------
  // SEARCH
  // ---------------------------------
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      loadShippers();
      return;
    }

    try {
      const res = await searchShipperApi(value);
      if (res?.status === 200) {
        setShippers(
          res.data.map((r) => ({
            id: r.Id,
            companyName: r.CompanyName,
            phone: r.Phone,
          }))
        );
        setTotalRecords(res.data.length);
      }
    } catch (err) {}
  };

  // ---------------------------------
  // ADD
  // ---------------------------------
  const handleAdd = async () => {
    if (!newData.companyName.trim())
      return toast.error("Company name is required");

    const digits = newData.phone.replace(/\D/g, "");

    if (digits.length < 10)
      return toast.error("Phone must be at least 10 digits");

    try {
      const res = await addShipperApi({
        companyName: newData.companyName,
        phone: digits,
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Shipper added");
        setModalOpen(false);
        setNewData({ companyName: "", phone: "" });
        loadShippers();
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // ---------------------------------
  // OPEN EDIT MODAL
  // ---------------------------------
  const openEdit = (row) => {
    setEditData({
      id: row.id,
      companyName: row.companyName,
      phone: row.phone,
    });
    setEditModalOpen(true);
  };

  // ---------------------------------
  // UPDATE
  // ---------------------------------
  const handleUpdate = async () => {
    if (!editData.companyName.trim())
      return toast.error("Company name is required");

    const digits = editData.phone.replace(/\D/g, "");
    if (digits.length < 10)
      return toast.error("Phone must be at least 10 digits");

    try {
      const res = await updateShipperApi(editData.id, {
        companyName: editData.companyName,
        phone: digits,
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadShippers();
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // ---------------------------------
  // DELETE
  // ---------------------------------
  const handleDelete = async () => {
    try {
      const res = await deleteShipperApi(editData.id, {
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadShippers();
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // =============================================================
  // UI START
  // =============================================================
  return (
    <>
      {/* ================= ADD MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Shipper</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Company Name */}
              <div>
                <label className="text-sm text-gray-300">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newData.companyName}
                  onChange={(e) =>
                    setNewData((p) => ({ ...p, companyName: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-gray-300">Phone</label>
                <input
                  type="text"
                  maxLength={12}
                  value={newData.phone}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 10) v = v.slice(0, 10);
                    setNewData((p) => ({ ...p, phone: formatPhone(v) }));
                  }}
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

      {/* ================= EDIT MODAL ================= */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                Edit Shipper ({editData.companyName})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-300">Company Name</label>
                <input
                  type="text"
                  value={editData.companyName}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, companyName: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Phone</label>
                <input
                  type="text"
                  maxLength={12}
                  value={editData.phone}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 10) v = v.slice(0, 10);
                    setEditData((p) => ({ ...p, phone: formatPhone(v) }));
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
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
      


      {/* ================= COLUMN PICKER MODAL ================= */}
{columnModal && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
    <div className="w-[700px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
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
          onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-5 px-5 pb-5">
        {/* Visible Columns */}
        <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
          <h3 className="font-semibold mb-2">Visible Columns</h3>

          {Object.keys(visibleColumns)
            .filter((c) => visibleColumns[c])
            .filter((c) => c.includes(searchColumn))
            .map((col) => (
              <div
                key={col}
                className="bg-gray-800 px-3 py-2 rounded mb-2 flex justify-between"
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

        {/* Hidden Columns */}
        <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
          <h3 className="font-semibold mb-2">Hidden Columns</h3>

          {Object.keys(visibleColumns)
            .filter((c) => !visibleColumns[c])
            .filter((c) => c.includes(searchColumn))
            .map((col) => (
              <div
                key={col}
                className="bg-gray-800 px-3 py-2 rounded mb-2 flex justify-between"
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

      {/* FOOTER BUTTONS */}
      <div className="px-5 py-3 border-t border-gray-700 flex justify-end gap-3">
        <button
          onClick={restoreDefaults}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
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




      {/* ================= MAIN LIST TABLE ================= */}
      <div className="p-4 sm:p-6 text-white min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Shippers</h2>

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
            <Plus size={16} /> New Shipper
          </button>

          <button
            onClick={() => loadShippers()}
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
  <table className="w-[500px] border-separate border-spacing-y-1 text-sm">
    
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

        {visibleColumns.companyName && (
          <th className="pb-1 border-b border-white">Company Name</th>
        )}

        {visibleColumns.phone && (
          <th className="pb-1 border-b border-white">Phone</th>
        )}

      </tr>
    </thead>

    {/* BODY */}
    <tbody className="text-center">
      {sortedShippers.length === 0 && (
        <tr>
          <td
            colSpan={Object.values(visibleColumns).filter(Boolean).length}
            className="text-center py-4 text-gray-400"
          >
            No records found
          </td>
        </tr>
      )}

      {sortedShippers.map((row) => (
        <tr
          key={row.id}
          className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
          onClick={() => openEdit(row)}
        >
          {visibleColumns.id && (
            <td className="px-2 py-1 align-middle">{row.id}</td>
          )}

          {visibleColumns.companyName && (
            <td className="px-2 py-1 align-middle">{row.companyName}</td>
          )}

          {visibleColumns.phone && (
            <td className="px-2 py-1 align-middle">
              {formatPhone(row.phone)}
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
            onClick={() => loadShippers()}
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

export default Shippers;
