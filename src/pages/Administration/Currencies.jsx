import React, { useState, useEffect } from "react";
import {
  Search, // Keeping for modals if needed, or remove if unused. Most seem unused in MasterTable, but Modals might use them.
  X,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";


import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

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
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";

const Currencies = () => {
  const { theme } = useTheme();
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
  const [columnModalOpen, setColumnModalOpen] = useState(false);

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

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Load active records
  const loadCurrencies = async () => {
    setSearchText("");
    const res = await getCurrenciesApi(page, limit, sortConfig.key, sortConfig.direction);
    if (res?.status === 200) {
      setCurrencies(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      toast.error("Failed to load currencies");
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, [page, limit, sortConfig]);

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

  const handleRefresh = async () => {
    setSearchText("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    setShowInactive(false);
    
    try {
        const res = await getCurrenciesApi(1, limit, null, 'asc');
        if (res?.status === 200) {
          setCurrencies(res.data.records);
          setTotalRecords(res.data.total);
          // showSuccessToast("Refreshed");
        }
    } catch (err) {
        toast.error("Error refreshing currencies");
    }
  };

  // ADD
  const handleAddCurrency = async () => {
    const { currencyName, currencySymbol } = newCurrency;

    if (!currencyName.trim() || !currencySymbol.trim()) {
      return toast.error("Both fields are required");
    }

    // Check duplicates (Name)
    try {
        const searchRes = await searchCurrencyApi(currencyName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.CurrencyName || r.currencyName).toLowerCase() === currencyName.trim().toLowerCase()
            );
            if (existing) return toast.error("Currency name already exists");
        }
    } catch(err) {
        console.error(err);
    }

    // Check duplicates (Symbol)
    try {
        const searchRes = await searchCurrencyApi(currencySymbol.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.CurrencySymbol || r.currencySymbol).toLowerCase() === currencySymbol.trim().toLowerCase()
            );
            if (existing) return toast.error("Currency symbol already exists");
        }
    } catch(err) {
        console.error(err);
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

    // Check duplicates (Name)
    try {
        const searchRes = await searchCurrencyApi(currencyName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.CurrencyName || r.currencyName).toLowerCase() === currencyName.trim().toLowerCase() &&
                (r.Id || r.id) !== editCurrency.id
            );
            if (existing) return toast.error("Currency name already exists");
        }
    } catch(err) {
        console.error(err);
    }

    // Check duplicates (Symbol)
    try {
        const searchRes = await searchCurrencyApi(currencySymbol.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.CurrencySymbol || r.currencySymbol).toLowerCase() === currencySymbol.trim().toLowerCase() &&
                (r.Id || r.id) !== editCurrency.id
            );
            if (existing) return toast.error("Currency symbol already exists");
        }
    } catch(err) {
        console.error(err);
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
    const result = await showDeleteConfirm("this currency");

    if (!result.isConfirmed) return;

    try {
      const res = await deleteCurrencyApi(editCurrency.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        showSuccessToast("Currency deleted successfully.");
        setEditModalOpen(false);
        loadCurrencies();
        if (showInactive) loadInactive();
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      showErrorToast("Failed to delete currency.");
    }
  };

  // RESTORE
  // RESTORE
  const handleRestoreCurrency = async () => {
    const result = await showRestoreConfirm("this currency");

    if (!result.isConfirmed) return;

    try {
      const res = await restoreCurrencyApi(editCurrency.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        showSuccessToast("Currency restored successfully.");
        setEditModalOpen(false);
        loadCurrencies();
        loadInactive();
      } else {
        throw new Error("Restore failed");
      }
    } catch {
      showErrorToast("Failed to restore currency.");
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
            <InputField
              label="Currency Name"
              value={newCurrency.currencyName}
              onChange={(e) =>
                setNewCurrency((prev) => ({ ...prev, currencyName: e.target.value }))
              }
              placeholder="e.g. US Dollar"
              required
            />
          </div>

          <div>
            <InputField
              label="Currency Symbol"
              value={newCurrency.currencySymbol}
              onChange={(e) =>
                setNewCurrency((prev) => ({ ...prev, currencySymbol: e.target.value }))
              }
              placeholder="e.g. $"
              required
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
            <InputField
              label="Currency Name"
              value={editCurrency.currencyName}
              onChange={(e) =>
                setEditCurrency((prev) => ({
                  ...prev,
                  currencyName: e.target.value,
                }))
              }
              disabled={editCurrency.isInactive}
              required
            />
          </div>

          <div>
            <InputField
              label="Currency Symbol"
              value={editCurrency.currencySymbol}
              onChange={(e) =>
                setEditCurrency((prev) => ({
                  ...prev,
                  currencySymbol: e.target.value,
                }))
              }
              disabled={editCurrency.isInactive}
              required
            />
          </div>
        </div>
      </EditModal>

      <ColumnPickerModal
        isOpen={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        defaultColumns={defaultColumns}
      />

      {/* =============================
              MAIN PAGE
      ============================== */}
      {/* =============================
              MAIN PAGE
      ============================== */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Currencies</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.currencyName && { key: "currencyName", label: "Currency Name", sortable: true },
                    visibleColumns.currencySymbol && { key: "currencySymbol", label: "Symbol", sortable: true },
                ].filter(Boolean)}
                data={currencies}
                inactiveData={inactiveCurrencies}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(c, isInactive) => {
                     setEditCurrency({
                          id: c.id,
                          currencyName: c.currencyName,
                          currencySymbol: c.currencySymbol,
                          isInactive: isInactive,
                        });
                        setEditModalOpen(true);
                }}
                // Action Bar
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New Currency"
                permissionCreate={hasPermission(PERMISSIONS.CURRENCIES.CREATE)}
                onRefresh={handleRefresh}
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactive();
                    setShowInactive(!showInactive);
                }}
            />

             {/* PAGINATION */}
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                onRefresh={() => {
                    setSearchText("");
                    setSortConfig({ key: null, direction: 'asc' });
                    setPage(1);
                    setShowInactive(false);
                    loadCurrencies();
                }}
              />
          </div>
          </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default Currencies;
