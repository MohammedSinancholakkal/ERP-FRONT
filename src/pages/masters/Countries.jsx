import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
// import SortableHeader from "../../components/SortableHeader"; // Unused?
import toast from "react-hot-toast";

// API
import {
  addCountryApi,
//   getCountriesApi, // Unused?
  updateCountryApi,
  deleteCountryApi,
  restoreCountryApi,
//   getInactiveCountriesApi, // Unused?
  searchCountryApi,
} from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";
import Swal from "sweetalert2";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";


const Countries = () => {
  const { theme } = useTheme();
  const { 
    loadCountries: loadCountriesCtx, 
    // refreshCountries, 
    loadInactiveCountries: loadInactiveCtx,
    refreshInactiveCountries
  } = useMasters();

  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [countries, setCountries] = useState([]);
  const [inactiveCountries, setInactiveCountries] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newCountry, setNewCountry] = useState("");

  // EDIT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCountry, setEditCountry] = useState({
    id: null,
    name: "",
    isInactive: false,
  });

  //pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

//   const totalPages = Math.max(1, Math.ceil(totalRecords / limit)); // Unused?
//   const start = (page - 1) * limit + 1; // Unused?
//   const end = Math.min(page * limit, totalRecords); // Unused?

  // SEARCH
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  // const [searchColumn, setSearchColumn] = useState(""); // Moved to Modal

  // const toggleColumn = (col) => { ... } // Moved to Modal
  // const restoreDefaultColumns = () => { ... } // Moved to Modal

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

  const sortedCountries = [...countries];
  if (sortConfig.key) {
    sortedCountries.sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // LOAD ACTIVE COUNTRIES
  const loadCountries = async (forceRefresh = false) => {
    const { data, total } = await loadCountriesCtx(page, limit, searchText, forceRefresh);
    setCountries(data || []);
    setTotalRecords(total || 0);
  };

  useEffect(() => {
    loadCountries();
  }, [page, limit]); 

  // LOAD INACTIVE
  const loadInactive = async () => {
    const data = await loadInactiveCtx();
    setInactiveCountries(data || []);
  };

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);
    if (text.trim() === "") {
        const { data, total } = await loadCountriesCtx(1, limit, "");
        setCountries(data || []);
        setTotalRecords(total || 0);
        return;
    }

    const { data, total } = await loadCountriesCtx(1, limit, text);
    setCountries(data || []);
    setTotalRecords(total || 0); 
  };

  // ADD
  const handleAddCountry = async () => {
    if (!newCountry.trim()) return toast.error("Country name required");

    // Check for duplicates
    try {
      const searchRes = await searchCountryApi(newCountry);
      if (searchRes?.status === 200) {
        const existing = (searchRes.data.records || searchRes.data || []).find(
          c => c.name.toLowerCase() === newCountry.trim().toLowerCase()
        );
        if (existing) {
          return toast.error("Country with this name already exists");
        }
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking for duplicates");
    }

    const res = await addCountryApi({
      name: newCountry,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Country added");
      setNewCountry("");
      setModalOpen(false);
      loadCountries(true); // Force Reload
    } else {
      toast.error("Failed to add");
    }
  };

  // UPDATE
  const handleUpdateCountry = async () => {
    if (!editCountry.name.trim()) return toast.error("Name cannot be empty");

    // Check for duplicates
    try {
      const searchRes = await searchCountryApi(editCountry.name);
      if (searchRes?.status === 200) {
         const existing = (searchRes.data.records || searchRes.data || []).find(
          c => c.name.toLowerCase() === editCountry.name.trim().toLowerCase() && c.id !== editCountry.id
        );
        if (existing) {
          return toast.error("Country with this name already exists");
        }
      }
    } catch (err) {
       return toast.error("Error checking for duplicates");
    }

    const res = await updateCountryApi(editCountry.id, {
      name: editCountry.name,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Country updated");
      setEditModalOpen(false);
      loadCountries(true);
      if (showInactive) {
          refreshInactiveCountries();
          loadInactive();
      }
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE
  const handleDeleteCountry = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteCountryApi(editCountry.id, {
          userId: user?.userId || 1,
        });

        if (res?.status === 200) {
          toast.success("Country deleted");
          setEditModalOpen(false);
          loadCountries(true);
          if (showInactive) {
            refreshInactiveCountries();
            loadInactive();
          }
        } else {
          toast.error("Delete failed");
        }
      }
    });
  };

  // RESTORE
  const handleRestoreCountry = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to restore this country?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restore it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await restoreCountryApi(editCountry.id, {
          userId: user?.userId || 1,
        });

        if (res?.status === 200) {
          toast.success("Country restored");
          setEditModalOpen(false);
          loadCountries(true);
          refreshInactiveCountries();
          loadInactive();
        } else {
          toast.error("Failed to restore");
        }
      }
    });
  };

  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.name && { key: "name", label: "Name", sortable: true },
  ].filter(Boolean);

  return (
    <PageLayout>
      <>
        {/* ADD COUNTRY MODAL */}
        <AddModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAddCountry}
          title="New Country"
        >
          <label className="block text-sm mb-1">Name *</label>
          <input
            type="text"
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value)}
            placeholder="Enter country name"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
          />
        </AddModal>

        {/* EDIT COUNTRY MODAL */}
        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdateCountry}
          onDelete={handleDeleteCountry}
          onRestore={handleRestoreCountry}
          isInactive={editCountry.isInactive}
          title={`${editCountry.isInactive ? "Restore Country" : "Edit Country"} (${editCountry.name})`}
          permissionDelete={hasPermission(PERMISSIONS.COUNTRIES.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.COUNTRIES.EDIT)}
        >
           <label className="block text-sm mb-1">Name *</label>
            <input
              type="text"
              value={editCountry.name}
              onChange={(e) =>
                setEditCountry((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              disabled={editCountry.isInactive}
              className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none ${
                editCountry.isInactive
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
            />
        </EditModal>

        {/* COLUMN PICKER MODAL */}
        <ColumnPickerModal
          isOpen={columnModal}
          onClose={() => setColumnModal(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
        />



        {/* MAIN PAGE */}
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Countries</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-1 mb-4">
              <div className={`flex items-center px-2 py-1.5 rounded-md border w-full sm:w-60 ${theme === 'emerald' ? 'bg-gray-100 border-emerald-500' : 'bg-gray-700 border-gray-600'}`}>
                <Search size={16} className={theme === 'emerald' ? 'text-gray-500' : 'text-gray-300'} />
                <input
                  type="text"
                  placeholder="search..."
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`bg-transparent outline-none pl-2 w-full text-sm ${theme === 'emerald' ? 'text-gray-900 placeholder-gray-500' : 'text-gray-200 placeholder-gray-500'}`}
                />
              </div>

              {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (
              <button
                onClick={() => setModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
              >
                <Plus size={16} /> New Country
              </button>
              )}

              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadCountries();
                }}
                className={`p-1.5 rounded-md border ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <RefreshCw size={16} className={theme === 'emerald' ? 'text-white' : 'text-blue-400'} />
              </button>

              <button
                onClick={() => setColumnModal(true)}
                className={`p-1.5 rounded-md border ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <List size={16} className={theme === 'emerald' ? 'text-white' : 'text-blue-300'} />
              </button>

              <button
                onClick={async () => {
                  if (!showInactive) await loadInactive();
                  setShowInactive(!showInactive);
                }}
                className={`p-1.5 rounded-md border flex items-center gap-1 ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <ArchiveRestore size={16} className={theme === 'emerald' ? 'text-white' : 'text-yellow-300'} />
                <span className={`text-xs opacity-80 ${theme === 'emerald' ? 'text-white' : ''}`}>Inactive</span>
              </button>
            </div>

            {/* TABLE SECTION */}
            <MasterTable
              columns={tableColumns}
              data={sortedCountries}
              inactiveData={inactiveCountries}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(item, isInactive) => {
                setEditCountry({
                  id: item.id,
                  name: item.name,
                  isInactive,
                });
                setEditModalOpen(true);
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
                setPage(1);
                loadCountries();
              }}
            />
          </div>
        </div>
      </>
    </PageLayout>
  );
};

export default Countries;
