// src/pages/masters/Banks.jsx
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

// API
import {
  getBanksApi,
  addBankApi,
  updateBankApi,
  deleteBankApi,
  searchBankApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

// Convert image to Base64 (for preview only)
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Banks = () => {
  // ---------- UI modals ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // ---------- data ----------
  const [banks, setBanks] = useState([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // Search
  const [searchText, setSearchText] = useState("");

  // current user
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ---------- NEW BANK FORM ----------
  const [newBank, setNewBank] = useState({
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null, // FILE object sent to backend
    SignaturePreview: "", // base64 preview for UI
  });

  // ---------- EDIT BANK FORM ----------
  const [editData, setEditData] = useState({
    id: null,
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null, // FILE object
    SignaturePreview: "", // base64 or existing URL
  });

  // Column picker defaults (preserve your original columns)
  const defaultColumns = {
    id: true,
    BankName: true,
    ACName: true,
    ACNumber: true,
    Branch: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) =>
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  const [sortOrder, setSortOrder] = useState("asc"); // smallest ID first
  const sortedBanks = [...banks];

  if (sortOrder === "asc") {
    sortedBanks.sort((a, b) => {
      const idA = a.id ?? a.Id;
      const idB = b.id ?? b.Id;
      return idA - idB;
    });
  }

  // ---------- LOAD BANKS ----------
  const loadBanks = async () => {
    try {
      if (searchText?.trim()) {
        const res = await searchBankApi(searchText.trim());
        const items = Array.isArray(res.data)
          ? res.data
          : res.data?.records || [];
        setBanks(items);
        setTotalRecords(items.length);
        return;
      }

      const res = await getBanksApi(page, limit);
      if (res?.status === 200) {
        const { records = [], total = 0 } = res.data || {};
        setBanks(records || []);
        setTotalRecords(total || 0);
      }
    } catch (err) {
      console.error("LOAD BANKS ERROR:", err);
      toast.error("Server error");
    }
  };

  useEffect(() => {
    loadBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // ---------- SEARCH ----------
  const handleSearch = async (v) => {
    setSearchText(v);

    if (!v.trim()) {
      setPage(1);
      loadBanks();
      return;
    }

    try {
      const res = await searchBankApi(v.trim());
      const items = Array.isArray(res.data)
        ? res.data
        : res.data?.records || [];
      setBanks(items);
      setTotalRecords(items.length);
    } catch (err) {
      console.error("SEARCH BANKS ERROR:", err);
      toast.error("Search failed");
    }
  };

  // ---------- ADD ----------
  const handleAdd = async () => {
    const { BankName, ACName, ACNumber } = newBank;

    if (!BankName.trim() || !ACName.trim() || !ACNumber.trim()) {
      return toast.error("Required fields missing");
    }

    try {
      const payload = {
        BankName: newBank.BankName,
        ACName: newBank.ACName,
        ACNumber: newBank.ACNumber,
        Branch: newBank.Branch,
        userId: currentUserId,
        SignaturePicture: newBank.SignaturePicture, // FILE object
      };

      console.log("SENDING PAYLOAD:", payload);

      const res = await addBankApi(payload);

      if (res?.status === 200 || res?.status === 201) {
        toast.success("Bank added successfully");
        setModalOpen(false);

        setNewBank({
          BankName: "",
          ACName: "",
          ACNumber: "",
          Branch: "",
          SignaturePicture: null,
          SignaturePreview: "",
        });

        setPage(1);
        loadBanks();
      } else {
        toast.error(res?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("ADD BANK ERROR:", err);
      toast.error("Server error");
    }
  };

  // ---------- OPEN EDIT ----------
  const openEditModal = (item) => {
    let preview = "";

    if (item.SignaturePicture) {
      preview = item.SignaturePicture.startsWith("/")
        ? item.SignaturePicture
        : "/" + item.SignaturePicture;
    }

    setEditData({
      id: item.id ?? item.Id,
      BankName: item.BankName ?? "",
      ACName: item.ACName ?? "",
      ACNumber: item.ACNumber ?? "",
      Branch: item.Branch ?? "",
      SignaturePicture: null,
      SignaturePreview: preview,
    });

    setEditModalOpen(true);
  };

  // ---------- UPDATE ----------
  const handleUpdate = async () => {
    const { id, BankName, ACName, ACNumber } = editData;

    if (!BankName.trim() || !ACName.trim() || !ACNumber.trim()) {
      return toast.error("Required fields missing");
    }

    try {
      const payload = {
        BankName: editData.BankName,
        ACName: editData.ACName,
        ACNumber: editData.ACNumber,
        Branch: editData.Branch,
        userId: currentUserId,
        SignaturePicture: editData.SignaturePicture, // FILE
      };

      const res = await updateBankApi(id, payload);

      if (res?.status === 200) {
        toast.success("Updated successfully");
        setEditModalOpen(false);
        loadBanks();
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("UPDATE BANK ERROR:", err);
      toast.error("Server error");
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async () => {
    try {
      const res = await deleteBankApi(editData.id, { userId: currentUserId });

      if (res?.status === 200) {
        toast.success("Deleted successfully");
        setEditModalOpen(false);

        const newTotal = Math.max(0, totalRecords - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / limit));
        if (page > newTotalPages) setPage(newTotalPages);

        loadBanks();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("DELETE BANK ERROR:", err);
      toast.error("Server error");
    }
  };

  // ---------- MAIN RENDER (start) ----------
  return (
    <>
      {/* ---------------- ADD MODAL ---------------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[600px] md:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-base sm:text-lg font-semibold">New Bank</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={newBank.BankName}
                  onChange={(e) =>
                    setNewBank((p) => ({ ...p, BankName: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">AC Name *</label>
                <input
                  type="text"
                  value={newBank.ACName}
                  onChange={(e) =>
                    setNewBank((p) => ({ ...p, ACName: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">AC Number *</label>
                <input
                  type="text"
                  value={newBank.ACNumber}
                  onChange={(e) =>
                    setNewBank((p) => ({ ...p, ACNumber: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Branch</label>
                <input
                  type="text"
                  value={newBank.Branch}
                  onChange={(e) =>
                    setNewBank((p) => ({ ...p, Branch: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Signature Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const preview = await fileToBase64(file);
                    setNewBank((p) => ({
                      ...p,
                      SignaturePicture: file,
                      SignaturePreview: preview,
                    }));
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />

                {newBank.SignaturePreview && (
                  <div className="mt-3">
                    <img
                      src={newBank.SignaturePreview}
                      alt="preview"
                      className="h-24 w-24 sm:h-32 sm:w-auto border border-gray-700 rounded object-cover"
                    />
                    <button
                      onClick={() =>
                        setNewBank((p) => ({
                          ...p,
                          SignaturePicture: null,
                          SignaturePreview: "",
                        }))
                      }
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

      {/* ---------------- EDIT MODAL ---------------- */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[600px] md:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between px-4 sm:px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-base sm:text-lg font-semibold">
                Edit Bank ({editData.BankName})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X size={20} className="text-gray-300" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editData.BankName}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, BankName: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">AC Name</label>
                <input
                  type="text"
                  value={editData.ACName}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, ACName: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">AC Number</label>
                <input
                  type="text"
                  value={editData.ACNumber}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, ACNumber: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Branch</label>
                <input
                  type="text"
                  value={editData.Branch}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, Branch: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Signature Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const preview = await fileToBase64(file);
                    setEditData((p) => ({
                      ...p,
                      SignaturePicture: file,
                      SignaturePreview: preview,
                    }));
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                />

                {editData.SignaturePreview && (
                  <div className="mt-3">
                    <img
                      src={editData.SignaturePreview}
                      alt="signature"
                      className="h-24 w-24 sm:h-32 sm:w-auto border border-gray-700 rounded object-cover"
                    />
                    <button
                      onClick={() =>
                        setEditData((p) => ({
                          ...p,
                          SignaturePicture: null,
                          SignaturePreview: "",
                        }))
                      }
                      className="mt-2 bg-red-600 px-3 py-1 rounded text-xs"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 px-3 sm:px-4 py-2 rounded border border-red-900 text-sm sm:text-base"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 bg-gray-800 px-3 sm:px-4 py-2 rounded border border-gray-600 text-blue-300 text-sm sm:text-base"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- COLUMN PICKER ---------------- */}
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
                  .filter((c) => c.includes(searchColumn))
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
                  .filter((c) => c.includes(searchColumn))
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

      {/* ---------------- MAIN PAGE ---------------- */}
      <div className="p-4 sm:p-6 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-112px)] overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Banks</h2>

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
              <Plus size={16} /> New Bank
            </button>

            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadBanks();
              }}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
              aria-label="Refresh"
            >
              <RefreshCw className="text-blue-400" size={16} />
            </button>

            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
              aria-label="Columns"
            >
              <List className="text-blue-300" size={16} />
            </button>
          </div>

          {/* TABLE (scrollable area) */}
          <div className="flex-grow overflow-auto min-h-0">
            <div className="w-full overflow-auto">
              <table className="w-[800px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10 text-center">
                  <tr className="text-white">
                    {visibleColumns.id && (
                      <SortableHeader
                        label="ID"
                        sortOrder={sortOrder}
                        onClick={() =>
                          setSortOrder((prev) =>
                            prev === "asc" ? null : "asc"
                          )
                        }
                      />
                    )}

                    {visibleColumns.BankName && (
                      <th className="pb-1 border-b border-white text-center">
                        Bank Name
                      </th>
                    )}

                    {visibleColumns.ACName && (
                      <th className="pb-1 border-b border-white text-center">
                        AC Name
                      </th>
                    )}

                    {visibleColumns.ACNumber && (
                      <th className="pb-1 border-b border-white text-center">
                        AC Number
                      </th>
                    )}

                    {visibleColumns.Branch && (
                      <th className="pb-1 border-b border-white text-center">
                        Branch
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="text-center">
                  {sortedBanks.length === 0 && (
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

                  {sortedBanks.map((item) => {
                    const id = item.id ?? item.Id;

                    return (
                      <tr
                        key={id}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-center"
                        onClick={() => openEditModal(item)}
                      >
                        {visibleColumns.id && (
                          <td className="px-2 py-2 text-center">{id}</td>
                        )}

                        {visibleColumns.BankName && (
                          <td className="px-2 py-2 text-center">
                            {item.BankName ?? item.Bank ?? item.bankName ?? ""}
                          </td>
                        )}

                        {visibleColumns.ACName && (
                          <td className="px-2 py-2 text-center">
                            {item.ACName ?? item.acName ?? ""}
                          </td>
                        )}

                        {visibleColumns.ACNumber && (
                          <td className="px-2 py-2 text-center">
                            {item.ACNumber ?? item.acNumber ?? ""}
                          </td>
                        )}

                        {visibleColumns.Branch && (
                          <td className="px-2 py-2 text-center">
                            {item.Branch ?? item.branch ?? ""}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------------- STICKY PAGINATION ---------------- */}
          <div className="mt-5 sticky bottom-0 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
            <div className="flex flex-wrap items-center gap-3 bg-transparent rounded text-sm">
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
                  loadBanks();
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
          {/* end sticky pagination */}
        </div>
      </div>
    </>
  );
};

export default Banks;
