import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ArchiveRestore,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getBanksApi,
  addBankApi,
  updateBankApi,
  deleteBankApi,
  searchBankApi,
  getInactiveBanksApi,
  restoreBankApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import { serverURL } from "../../services/serverURL";

const Banks = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // Data
  const [banks, setBanks] = useState([]);
  const [inactiveBanks, setInactiveBanks] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // ADD FORM
  const [newData, setNewData] = useState({
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null,
  });

  // EDIT FORM
  const [editData, setEditData] = useState({
    id: null,
    BankName: "",
    ACName: "",
    ACNumber: "",
    Branch: "",
    SignaturePicture: null,
    existingSignature: "",
    isInactive: false,
  });

  // File Preview
  const [preview, setPreview] = useState("");

  // COLUMN PICKER
  const defaultCols = {
    id: true,
    bankName: true,
    acName: true,
    acNumber: true,
    branch: true,
    signature: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultCols);
  const [tempCols, setTempCols] = useState(defaultCols);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumnTemp = (col) =>
    setTempCols((prev) => ({ ...prev, [col]: !prev[col] }));

  const restoreDefaults = () => setTempCols(defaultCols);

  const applyColumnChanges = () => {
    setVisibleColumns(tempCols);
    setColumnModal(false);
  };

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  // Sorting Logic
  const sortedBanks = [...banks];
  if (sortConfig.key) {
    sortedBanks.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Load Banks
  const loadBanks = async () => {
    try {
      const res = await getBanksApi(page, limit);
      if (res?.status === 200) {
        const rows = Array.isArray(res.data) ? res.data : res.data.records || res.data || [];
        // Normalization
        const normalized = rows.map((r) => ({
          id: r.Id || r.id,
          bankName: r.BankName || r.bankName,
          acName: r.ACName || r.acName,
          acNumber: r.ACNumber || r.acNumber,
          branch: r.Branch || r.branch,
          signature: r.SignaturePicture || r.signaturePicture,
        }));
        setBanks(normalized);

        const total = res.data?.total || res.data?.totalRecords || normalized.length;
        setTotalRecords(total);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load banks");
    }
  };

  useEffect(() => {
    loadBanks();
  }, [page, limit]);

  // Load Inactive
  const loadInactive = async () => {
    try {
      const res = await getInactiveBanksApi();
      if (res?.status === 200) {
         const rows = Array.isArray(res.data) ? res.data : res.data.records || res.data || [];
         const normalized = rows.map((r) => ({
          id: r.Id || r.id,
          bankName: r.BankName || r.bankName,
          acName: r.ACName || r.acName,
          acNumber: r.ACNumber || r.acNumber,
          branch: r.Branch || r.branch,
          signature: r.SignaturePicture || r.signaturePicture,
        }));
        setInactiveBanks(normalized);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inactive banks");
    }
  };

  // Search
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      setPage(1);
      loadBanks();
      return;
    }
    try {
      const res = await searchBankApi(value);
      if (res?.status === 200) {
        const rows = res.data || [];
        const normalized = rows.map((r) => ({
          id: r.Id || r.id,
          bankName: r.BankName || r.bankName,
          acName: r.ACName || r.acName,
          acNumber: r.ACNumber || r.acNumber,
          branch: r.Branch || r.branch,
          signature: r.SignaturePicture || r.signaturePicture,
        }));
        setBanks(normalized);
        setTotalRecords(rows.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add
  const handleAdd = async () => {
    if (!newData.BankName || !newData.ACNumber) {
      return toast.error("Bank Name and Account Number are required");
    }

    const reqData = {
      ...newData,
      userId: currentUserId,
    };

    try {
      const res = await addBankApi(reqData);
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Bank Added");
        setModalOpen(false);
        setNewData({
          BankName: "",
          ACName: "",
          ACNumber: "",
          Branch: "",
          SignaturePicture: null,
        });
        setPreview("");
        setPage(1);
        loadBanks();
      } else {
        toast.error("Add failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // Update
  const handleUpdate = async () => {
    if (!editData.BankName || !editData.ACNumber) {
      return toast.error("Bank Name and Account Number are required");
    }

    const reqData = {
      BankName: editData.BankName,
      ACName: editData.ACName,
      ACNumber: editData.ACNumber,
      Branch: editData.Branch,
      userId: currentUserId,
      SignaturePicture: editData.SignaturePicture, // File or null
    };

    try {
      const res = await updateBankApi(editData.id, reqData);
      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadBanks();
        if (showInactive) loadInactive();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      const res = await deleteBankApi(editData.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadBanks();
        if (showInactive) loadInactive();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // Restore
  const handleRestore = async () => {
    try {
      const res = await restoreBankApi(editData.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadBanks();
        loadInactive();
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const openEdit = (row, inactive = false) => {
    setEditData({
      id: row.id,
      BankName: row.bankName,
      ACName: row.acName,
      ACNumber: row.acNumber,
      Branch: row.branch,
      existingSignature: row.signature,
      SignaturePicture: null,
      isInactive: inactive,
    });
    setPreview(row.signature ? `${serverURL}/uploads/${row.signature}` : "");
    setEditModalOpen(true);
  };

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditData((p) => ({ ...p, SignaturePicture: file }));
      } else {
        setNewData((p) => ({ ...p, SignaturePicture: file }));
      }
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Bank</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300">Bank Name *</label>
                <input
                  value={newData.BankName}
                  onChange={(e) => setNewData({ ...newData, BankName: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">A/C Number *</label>
                <input
                  value={newData.ACNumber}
                  onChange={(e) => setNewData({ ...newData, ACNumber: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">A/C Name</label>
                <input
                  value={newData.ACName}
                  onChange={(e) => setNewData({ ...newData, ACName: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Branch</label>
                <input
                  value={newData.Branch}
                  onChange={(e) => setNewData({ ...newData, Branch: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-300">Signature</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-700 px-3 py-2 rounded hover:bg-gray-600">
                    <Upload size={16} /> Upload
                    <input type="file" hidden onChange={(e) => handleFileChange(e)} />
                  </label>
                  {preview && (
                    <img src={preview} alt="Prev" className="h-10 border border-gray-600 rounded" />
                  )}
                </div>
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
          <div className="w-[600px] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editData.isInactive ? "Restore Bank" : "Edit Bank"}
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="text-gray-300 hover:text-white" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300">Bank Name *</label>
                <input
                  value={editData.BankName}
                  onChange={(e) => setEditData({ ...editData, BankName: e.target.value })}
                  disabled={editData.isInactive}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">A/C Number *</label>
                <input
                  value={editData.ACNumber}
                  onChange={(e) => setEditData({ ...editData, ACNumber: e.target.value })}
                  disabled={editData.isInactive}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">A/C Name</label>
                <input
                  value={editData.ACName}
                  onChange={(e) => setEditData({ ...editData, ACName: e.target.value })}
                  disabled={editData.isInactive}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Branch</label>
                <input
                  value={editData.Branch}
                  onChange={(e) => setEditData({ ...editData, Branch: e.target.value })}
                  disabled={editData.isInactive}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 disabled:opacity-50"
                />
              </div>
              {!editData.isInactive && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-300">Signature</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-700 px-3 py-2 rounded hover:bg-gray-600">
                      <Upload size={16} /> Change
                      <input type="file" hidden onChange={(e) => handleFileChange(e, true)} />
                    </label>
                    {preview && (
                      <img src={preview} alt="Prev" className="h-10 border border-gray-600 rounded" />
                    )}
                  </div>
                </div>
              )}
            </div>
             <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {editData.isInactive ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded border border-red-900"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {!editData.isInactive && (
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded"
                >
                  <Save size={16} /> Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER MODAL */}
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
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                {Object.keys(tempCols)
                  .filter((col) => tempCols[col] && col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button onClick={() => toggleColumnTemp(col)} className="text-red-400">
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                {Object.keys(tempCols)
                  .filter((col) => !tempCols[col] && col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button onClick={() => toggleColumnTemp(col)} className="text-green-400">
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={restoreDefaults} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                Restore Defaults
              </button>
              <div className="flex gap-3">
                <button onClick={applyColumnChanges} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                  OK
                </button>
                <button onClick={() => setColumnModal(false)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Banks</h2>

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
                <Plus size={16} /> New Bank
              </button>
              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadBanks();
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <RefreshCw size={16} className="text-blue-400" />
              </button>
              <button
                onClick={() => {
                   setTempCols(visibleColumns);
                   setColumnModal(true);
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <List size={16} className="text-blue-300" />
              </button>
              <button
                onClick={async () => {
                  if (!showInactive) await loadInactive();
                  setShowInactive((s) => !s);
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1"
              >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
              </button>
            </div>

            <div className="flex-grow overflow-auto min-h-0">
              <table className="w-full border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">
                    {visibleColumns.id && (
                       <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />
                    )}
                     {visibleColumns.bankName && (
                       <SortableHeader label="Bank Name" sortOrder={sortConfig.key === "bankName" ? sortConfig.direction : null} onClick={() => handleSort("bankName")} />
                    )}
                    {visibleColumns.acNumber && (
                       <SortableHeader label="A/C Number" sortOrder={sortConfig.key === "acNumber" ? sortConfig.direction : null} onClick={() => handleSort("acNumber")} />
                    )}
                    {visibleColumns.acName && (
                       <SortableHeader label="A/C Name" sortOrder={sortConfig.key === "acName" ? sortConfig.direction : null} onClick={() => handleSort("acName")} />
                    )}
                     {visibleColumns.branch && (
                       <SortableHeader label="Branch" sortOrder={sortConfig.key === "branch" ? sortConfig.direction : null} onClick={() => handleSort("branch")} />
                    )}
                    {visibleColumns.signature && (
                      <th className="pb-1 border-b border-white text-center">Signature</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                    {sortedBanks.length === 0 && !showInactive && (
                         <tr>
                          <td colSpan="10" className="text-center py-4 text-gray-400">
                             No records found
                          </td>
                        </tr>
                    )}
                  {!showInactive &&
                    sortedBanks.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => openEdit(r, false)}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-center"
                      >
                         {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                         {visibleColumns.bankName && <td className="px-2 py-1">{r.bankName}</td>}
                         {visibleColumns.acNumber && <td className="px-2 py-1">{r.acNumber}</td>}
                         {visibleColumns.acName && <td className="px-2 py-1">{r.acName}</td>}
                         {visibleColumns.branch && <td className="px-2 py-1">{r.branch}</td>}
                         {visibleColumns.signature && (
                             <td className="px-2 py-1">
                                {r.signature ? (
                                    <img src={`${serverURL}/uploads/${r.signature}`} alt="Sig" className="h-6 mx-auto" />
                                ) : '-'}
                             </td>
                         )}
                      </tr>
                    ))}

                     {showInactive &&
                    inactiveBanks.map((r) => (
                      <tr
                        key={`inactive-${r.id}`}
                        onClick={() => openEdit(r, true)}
                        className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer text-center"
                      >
                         {visibleColumns.id && <td className="px-2 py-1">{r.id}</td>}
                         {visibleColumns.bankName && <td className="px-2 py-1">{r.bankName}</td>}
                         {visibleColumns.acNumber && <td className="px-2 py-1">{r.acNumber}</td>}
                         {visibleColumns.acName && <td className="px-2 py-1">{r.acName}</td>}
                         {visibleColumns.branch && <td className="px-2 py-1">{r.branch}</td>}
                          {visibleColumns.signature && (
                             <td className="px-2 py-1">
                                {r.signature ? (
                                    <img src={`${serverURL}/uploads/${r.signature}`} alt="Sig" className="h-6 mx-auto" />
                                ) : '-'}
                             </td>
                         )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                onRefresh={() => {
                   setSearchText("");
                   setPage(1);
                   loadBanks();
                }}
              />
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Banks;
