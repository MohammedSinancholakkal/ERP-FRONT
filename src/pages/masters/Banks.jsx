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
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

// API
import {
  getBanksApi,
  addBankApi,
  updateBankApi,
  deleteBankApi,
  searchBankApi,
  getInactiveBanksApi,
  restoreBankApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
import { serverURL } from "../../services/serverURL";

// Convert image to Base64 (preview only)
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Banks = () => {
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // Data lists
  const [banks, setBanks] = useState([]);
  const [inactiveBanks, setInactiveBanks] = useState([]);
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

  // New Bank Form
  const [newBank, setNewBank] = useState({
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null,
    SignaturePreview: "",
  });

  // Edit Bank Form
  const [editData, setEditData] = useState({
    id: null,
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: "",
    SignaturePreview: "",
    isInactive: false,
  });

  // Column Picker
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

  // Sorting
  const [sortOrder, setSortOrder] = useState("asc");
  const sortedBanks = [...banks];

  if (sortOrder === "asc") {
    sortedBanks.sort((a, b) => {
      const idA = a.id ?? a.Id;
      const idB = b.id ?? b.Id;
      return idA - idB;
    });
  }

  // --- ASSETS BASE: derive host WITHOUT /api so /uploads resolves correctly ---
  const assetsBase = (() => {
    try {
      if (!serverURL) return window.location.origin;
      // Remove trailing /api or /api/ if present
      return serverURL.replace(/\/api\/?$/, "") || window.location.origin;
    } catch {
      return window.location.origin;
    }
  })();

  // Convert DB image path to full URL (robust)
  const fullImageURL = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    // If already a full URL, return as-is
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // Ensure leading slash
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${assetsBase}${normalized}`;
  };

  // Load Banks (Active)
  const loadBanks = async () => {
    try {
      if (searchText?.trim()) {
        const res = await searchBankApi(searchText.trim());
        // normalize whether res.data is array or { records: [...] }
        const raw = Array.isArray(res.data) ? res.data : res.data?.records || [];
        const items = raw.map((item) => ({
          ...item,
          SignaturePicture: item.SignaturePicture
            ? fullImageURL(item.SignaturePicture)
            : "",
        }));
        setBanks(items);
        setTotalRecords(items.length);
        return;
      }

      const res = await getBanksApi(page, limit);
      if (res?.status === 200) {
        const normalized = (res.data.records || []).map((item) => ({
          ...item,
          SignaturePicture: item.SignaturePicture
            ? fullImageURL(item.SignaturePicture)
            : "",
        }));

        setBanks(normalized);
        setTotalRecords(res.data.total);
      }
    } catch (err) {
      toast.error("Error loading banks");
    }
  };

  useEffect(() => {
    loadBanks();
  }, [page, limit]);

  // Load Inactive Banks
  const loadInactiveBanks = async () => {
    try {
      const res = await getInactiveBanksApi();
      if (res?.status === 200) {
        const normalized = (res.data.records || []).map((item) => ({
          ...item,
          SignaturePicture: item.SignaturePicture
            ? fullImageURL(item.SignaturePicture)
            : "",
        }));

        setInactiveBanks(normalized);
      }
    } catch (err) {
      toast.error("Error loading inactive banks");
    }
  };

  // Search Banks
  const handleSearch = async (v) => {
    setSearchText(v);

    if (!v.trim()) {
      setPage(1);
      loadBanks();
      return;
    }

    try {
      const res = await searchBankApi(v.trim());
      const raw = Array.isArray(res.data) ? res.data : res.data?.records || [];
      // normalize signature path -> full URL
      const items = raw.map((item) => ({
        ...item,
        SignaturePicture: item.SignaturePicture
          ? fullImageURL(item.SignaturePicture)
          : "",
      }));
      setBanks(items);
      setTotalRecords(items.length);
    } catch {
      toast.error("Search failed");
    }
  };

  // Add Bank
  const handleAdd = async () => {
    try {
      if (!newBank.BankName.trim() || !newBank.ACName.trim() || !newBank.ACNumber.trim()) {
        return toast.error("Missing required fields");
      }

      const payload = {
        ...newBank,
        userId: currentUserId,

        // send file correctly
        SignaturePicture:
          newBank.SignaturePicture instanceof File
            ? newBank.SignaturePicture
            : null,
      };

      const res = await addBankApi(payload);

      if (res.status === 200 || res.status === 201) {
        toast.success("Bank Added");
        setModalOpen(false);

        setNewBank({
          BankName: "",
          ACName: "",
          ACNumber: "",
          Branch: "",
          SignaturePicture: null,
          SignaturePreview: "",
        });

        loadBanks();
      }
    } catch {
      toast.error("Add failed");
    }
  };

  // OPEN EDIT MODAL (FIXED IMAGE) — updated so inactive (restore) shows image (read-only)
  const openEditModal = (item, isInactive = false) => {
    // item.SignaturePicture may already be full URL or a DB path
    const imageURL = item.SignaturePicture ? fullImageURL(item.SignaturePicture) : "";

    setEditData({
      id: item.id ?? item.Id,
      BankName: item.BankName,
      ACName: item.ACName,
      ACNumber: item.ACNumber,
      Branch: item.Branch,

      // For active: this is the preview URL (or will be replaced by a File if user selects a new image)
      // For inactive: we put the URL into SignaturePreview too, so the preview shows and remains read-only
      SignaturePicture: imageURL,
      SignaturePreview: imageURL,
      isInactive,
    });

    setEditModalOpen(true);
  };

  // Remove image from edit form (empty string signals removal to backend)
  const removeEditImage = () => {
    setEditData((p) => ({ ...p, SignaturePicture: "", SignaturePreview: "" }));
  };

  // Update Bank
  const handleUpdate = async () => {
    try {
      if (!editData.BankName.trim() || !editData.ACName.trim() || !editData.ACNumber.trim()) {
        return toast.error("Missing required fields");
      }

      let signatureToSend = "";

      if (editData.SignaturePicture instanceof File) {
        signatureToSend = editData.SignaturePicture;
      } else if (editData.SignaturePicture === "") {
        signatureToSend = ""; // remove image
      } else {
        signatureToSend = null; // keep old
      }

      const payload = {
        BankName: editData.BankName,
        ACName: editData.ACName,
        ACNumber: editData.ACNumber,
        Branch: editData.Branch,
        SignaturePicture: signatureToSend,
        userId: currentUserId,
      };

      const res = await updateBankApi(editData.id, payload);

      if (res.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadBanks();
        if (showInactive) loadInactiveBanks();
      }
    } catch {
      toast.error("Update failed");
    }
  };

  // Delete Bank
  const handleDelete = async () => {
    try {
      const res = await deleteBankApi(editData.id, { userId: currentUserId });
      if (res.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadBanks();
        if (showInactive) loadInactiveBanks();
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  // Restore Bank
  const handleRestore = async () => {
    try {
      const res = await restoreBankApi(editData.id, { userId: currentUserId });
      if (res.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);

        // Refresh both lists so restored item appears in active list with image
        loadBanks();
        loadInactiveBanks();
      }
    } catch {
      toast.error("Restore failed");
    }
  };

  const previewImage = editData.SignaturePreview || editData.SignaturePicture;

  const removeNewImage = () => {
    setNewBank((p) => ({ ...p, SignaturePicture: null, SignaturePreview: "" }));
  };

  // Handle NEW file
  const handleNewFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = await fileToBase64(file);

    setNewBank((p) => ({
      ...p,
      SignaturePicture: file,
      SignaturePreview: preview,
    }));
  };

  // Handle EDIT file
  const handleEditFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = await fileToBase64(file);

    setEditData((p) => ({
      ...p,
      SignaturePicture: file,
      SignaturePreview: preview,
    }));
  };

  // -------------- RENDER -----------------
  return (
    <>
      {/* -------------------------------- ADD MODAL -------------------------------- */}
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

              {/* Signature Picture - NEW */}
              <div>
                <label className="block text-sm mb-1">Signature Picture</label>

                <input
                  id="signatureUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleNewFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => document.getElementById("signatureUpload").click()}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded hover:bg-gray-700 text-sm sm:text-base"
                >
                  Select Image
                </button>

                {newBank.SignaturePreview && (
                  <div className="mt-3">
                    <img
                      src={newBank.SignaturePreview}
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

      {/* -------------------------------- EDIT MODAL -------------------------------- */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[95%] sm:w-[600px] md:w-[650px] max-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between px-4 sm:px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-base sm:text-lg font-semibold">
                {editData.isInactive ? "Restore Bank" : `Edit Bank (${editData.BankName || ""})`}
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
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
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
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
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
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
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
                  disabled={editData.isInactive}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm sm:text-base ${
                    editData.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Signature Picture - EDIT */}
              <div>
                <label className="block text-sm mb-1">Signature Picture</label>

                <input
                  id="editSignatureUpload"
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
                    document.getElementById("editSignatureUpload").click()
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
                      alt="signature"
                      className="h-24 w-24 sm:h-32 sm:w-auto border border-gray-700 rounded object-cover"
                    />

                    {/* only allow removal when not inactive */}
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

      {/* ------------------------------ COLUMN PICKER -------------------------------- */}
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
              {/* Visible Columns */}
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

              {/* Hidden Columns */}
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

      {/* ------------------------------ MAIN PAGE -------------------------------- */}
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
                if (showInactive) loadInactiveBanks();
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
                if (!showInactive) await loadInactiveBanks();
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
              <table className="w-[800px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10 text-center">
                  <tr className="text-white">
                    {visibleColumns.id && (
                      <SortableHeader
                        label="ID"
                        sortOrder={sortOrder}
                        onClick={() =>
                          setSortOrder((prev) => (prev === "asc" ? null : "asc"))
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
                  {sortedBanks.length === 0 && !showInactive && (
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
                        onClick={() => openEditModal(item, false)}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                      >
                        {visibleColumns.id && <td className="px-2 py-2">{id}</td>}
                        {visibleColumns.BankName && (
                          <td className="px-2 py-2">{item.BankName}</td>
                        )}
                        {visibleColumns.ACName && (
                          <td className="px-2 py-2">{item.ACName}</td>
                        )}
                        {visibleColumns.ACNumber && (
                          <td className="px-2 py-2">{item.ACNumber}</td>
                        )}
                        {visibleColumns.Branch && (
                          <td className="px-2 py-2">{item.Branch}</td>
                        )}
                      </tr>
                    );
                  })}

                  {showInactive &&
                    inactiveBanks.map((item) => {
                      const id = item.id ?? item.Id;
                      return (
                        <tr
                          key={`inactive-${id}`}
                          onClick={() => openEditModal(item, true)}
                          className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                        >
                          {visibleColumns.id && <td className="px-2 py-2">{id}</td>}
                          {visibleColumns.BankName && (
                            <td className="px-2 py-2">{item.BankName}</td>
                          )}
                          {visibleColumns.ACName && (
                            <td className="px-2 py-2">{item.ACName}</td>
                          )}
                          {visibleColumns.ACNumber && (
                            <td className="px-2 py-2">{item.ACNumber}</td>
                          )}
                          {visibleColumns.Branch && (
                            <td className="px-2 py-2">{item.Branch}</td>
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
                  loadBanks();
                  if (showInactive) loadInactiveBanks();
                }}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <RefreshCw size={16} />
              </button>

              <span>
                Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b>{" "}
                of <b>{totalRecords}</b> records
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Banks;
