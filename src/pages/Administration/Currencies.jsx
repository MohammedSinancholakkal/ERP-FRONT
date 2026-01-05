import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  X,
  Save,
  Trash2,
  ArchiveRestore,
} from "lucide-react";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";


import toast from "react-hot-toast";
import Swal from "sweetalert2";

// API
import {
  addCurrencyApi,
  getCurrenciesApi,
  updateCurrencyApi,
  deleteCurrencyApi,
  searchCurrencyApi,
  getInactiveCurrenciesApi,
  restoreCurrencyApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";

const Currencies = () => {
  if (!hasPermission(PERMISSIONS.CURRENCIES.VIEW)) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [currencies, setCurrencies] = useState([]);
  const [inactiveCurrencies, setInactiveCurrencies] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newCurrency, setNewCurrency] = useState({
    currencyName: "",
    currencySymbol: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCurrency, setEditCurrency] = useState({
    id: null,
    currencyName: "",
    currencySymbol: "",
    isInactive: false,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // Search
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // Column Picker
  const defaultColumns = {
    id: true,
    currencyName: true,
    currencySymbol: true,
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

  // Sorted rows
  const sortedCurrencies = [...currencies];
  if (sortOrder === "asc") {
    sortedCurrencies.sort((a, b) => a.id - b.id);
  }

  // Load active records
  const loadCurrencies = async () => {
    setSearchText("");
    const res = await getCurrenciesApi(page, limit);
    if (res?.status === 200) {
      setCurrencies(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      toast.error("Failed to load currencies");
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, [page, limit]);

  // Load inactive
  const loadInactive = async () => {
    const res = await getInactiveCurrenciesApi();
    if (res?.status === 200) {
      setInactiveCurrencies(res.data.records);
    } else {
      toast.error("Failed to load inactive currencies");
    }
  };

  // Search
  const handleSearch = async (text) => {
    setSearchText(text);
    if (text.trim() === "") return loadCurrencies();

    const res = await searchCurrencyApi(text);
    if (res?.status === 200) {
      setCurrencies(res.data);
    }
  };

  // ADD
  const handleAddCurrency = async () => {
    const { currencyName, currencySymbol } = newCurrency;

    if (!currencyName.trim() || !currencySymbol.trim()) {
      return toast.error("Both fields are required");
    }

    const res = await addCurrencyApi({
      currencyName,
      currencySymbol,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Currency added");
      setNewCurrency({ currencyName: "", currencySymbol: "" });
      setModalOpen(false);
      loadCurrencies();
    } else {
      toast.error("Failed to add currency");
    }
  };

  // UPDATE
  const handleUpdateCurrency = async () => {
    const { currencyName, currencySymbol } = editCurrency;

    if (!currencyName.trim() || !currencySymbol.trim()) {
      return toast.error("Both fields required");
    }

    const res = await updateCurrencyApi(editCurrency.id, {
      currencyName,
      currencySymbol,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Currency updated");
      setEditModalOpen(false);
      loadCurrencies();
      if (showInactive) loadInactive();
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE
  // DELETE
  const handleDeleteCurrency = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This currency will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteCurrencyApi(editCurrency.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Currency deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadCurrencies();
        if (showInactive) loadInactive();
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Failed to delete currency. Please try again.",
      });
    }
  };

  // RESTORE
  // RESTORE
  const handleRestoreCurrency = async () => {
    const result = await Swal.fire({
      title: "Restore currency?",
      text: "This currency will be restored and made active again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await restoreCurrencyApi(editCurrency.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "Currency restored successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setEditModalOpen(false);
        loadCurrencies();
        loadInactive();
      } else {
        throw new Error("Restore failed");
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Restore failed",
        text: "Failed to restore currency. Please try again.",
      });
    }
  };

  return (
    <>
      {/* =============================
          ADD CURRENCY MODAL
      ============================== */}
      {/* =============================
          ADD CURRENCY MODAL
      ============================== */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddCurrency}
        title="New Currency"
        width="700px"
        permission={hasPermission(PERMISSIONS.CURRENCIES.CREATE)}
      >
        <div className="p-0 space-y-4">
          <div>
            <label className="block text-sm mb-1">Currency Name *</label>
            <input
              type="text"
              value={newCurrency.currencyName}
              onChange={(e) =>
                setNewCurrency((prev) => ({ ...prev, currencyName: e.target.value }))
              }
              placeholder="e.g. US Dollar"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Currency Symbol *</label>
            <input
              type="text"
              value={newCurrency.currencySymbol}
              onChange={(e) =>
                setNewCurrency((prev) => ({ ...prev, currencySymbol: e.target.value }))
              }
              placeholder="e.g. $"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
            />
          </div>
        </div>
      </AddModal>

      {/* =============================
          EDIT CURRENCY MODAL
      ============================== */}
      {/* =============================
          EDIT CURRENCY MODAL
      ============================== */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateCurrency}
        onDelete={handleDeleteCurrency}
        onRestore={handleRestoreCurrency}
        isInactive={editCurrency.isInactive}
        title={`${
          editCurrency.isInactive ? "Restore Currency" : "Edit Currency"
        } (${editCurrency.currencyName})`}
        permissionDelete={hasPermission(PERMISSIONS.CURRENCIES.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.CURRENCIES.EDIT)}
        width="700px"
      >
        <div className="p-0 space-y-4">
          <div>
            <label className="block text-sm mb-1">Currency Name *</label>
            <input
              type="text"
              value={editCurrency.currencyName}
              onChange={(e) =>
                setEditCurrency((prev) => ({
                  ...prev,
                  currencyName: e.target.value,
                }))
              }
              disabled={editCurrency.isInactive}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Currency Symbol *</label>
            <input
              type="text"
              value={editCurrency.currencySymbol}
              onChange={(e) =>
                setEditCurrency((prev) => ({
                  ...prev,
                  currencySymbol: e.target.value,
                }))
              }
              disabled={editCurrency.isInactive}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
            />
          </div>
        </div>
      </EditModal>

      {/* =============================
              MAIN PAGE
      ============================== */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden"> 


          <h2 className="text-2xl font-semibold mb-4">Currencies</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-1 mb-4">

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
            {hasPermission(PERMISSIONS.CURRENCIES.CREATE) && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"
            >
              <Plus size={16} /> New Currency
            </button>
            )}

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadCurrencies();
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw size={16} className="text-blue-400" />
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
              <table className="w-[600px] text-left border-separate border-spacing-y-1 text-sm">
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

                    {visibleColumns.currencyName && (
                      <th className="pb-1 border-b border-white text-center">
                        Currency Name
                      </th>
                    )}

                    {visibleColumns.currencySymbol && (
                      <th className="pb-1 border-b border-white text-center">
                        Symbol
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>

                  {/* ACTIVE */}
                  {sortedCurrencies.map((c) => (
                    <tr
                      key={c.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => {
                        setEditCurrency({
                          id: c.id,
                          currencyName: c.currencyName,
                          currencySymbol: c.currencySymbol,
                          isInactive: false,
                        });
                        setEditModalOpen(true);
                      }}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center">{c.id}</td>
                      )}

                      {visibleColumns.currencyName && (
                        <td className="px-2 py-1 text-center">{c.currencyName}</td>
                      )}

                      {visibleColumns.currencySymbol && (
                        <td className="px-2 py-1 text-center">{c.currencySymbol}</td>
                      )}
                    </tr>
                  ))}

                  {/* INACTIVE */}
                  {showInactive &&
                    inactiveCurrencies.map((c) => (
                      <tr
                        key={`inactive-${c.id}`}
                        className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                        onClick={() => {
                          setEditCurrency({
                            id: c.id,
                            currencyName: c.currencyName,
                            currencySymbol: c.currencySymbol,
                            isInactive: true,
                          });
                          setEditModalOpen(true);
                        }}
                      >
                        {visibleColumns.id && (
                          <td className="px-2 py-1 text-center">{c.id}</td>
                        )}

                        {visibleColumns.currencyName && (
                          <td className="px-2 py-1 text-center">{c.currencyName}</td>
                        )}

                        {visibleColumns.currencySymbol && (
                          <td className="px-2 py-1 text-center">{c.currencySymbol}</td>
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

export default Currencies;
