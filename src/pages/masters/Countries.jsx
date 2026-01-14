import React, { useState, useEffect } from "react";
// Icons removed as they are now in MasterTable
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
// import SortableHeader from "../../components/SortableHeader"; // Unused?

// API
import {
  addCountryApi,
  getCountriesApi, 
  updateCountryApi,
  deleteCountryApi,
  restoreCountryApi,
//   getInactiveCountriesApi,
  searchCountryApi,
} from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";

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

  // SEARCH
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
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
          <div className="flex flex-col h-full overflow-hidden gap-2 ">
            <h2 className="text-2xl font-semibold mb-4">Countries</h2>

            {/* TABLE SECTION - Action Bar is now inside MasterTable */}
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
              // Action Bar Props
              search={searchText}
              onSearch={handleSearch}
              onCreate={() => setModalOpen(true)}
              createLabel="New Country"
              permissionCreate={hasPermission(PERMISSIONS.COUNTRIES.CREATE)}
              onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadCountries();
              }}
              onColumnSelector={() => setColumnModal(true)}
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
