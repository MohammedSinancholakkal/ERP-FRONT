import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";

import {
  addCountryApi,
  getCountriesApi,
  updateCountryApi,
  deleteCountryApi,
  searchCountryApi,
  getInactiveCountriesApi,
  restoreCountryApi,
} from "../../services/allAPI";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";

const Countries = () => {
  const { theme } = useTheme();
  const { 
    loadCountries: loadCountriesCtx, 
    loadInactiveCountries: loadInactiveCtx, 
    refreshInactiveCountries 
  } = useMasters();

  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [countries, setCountries] = useState([]);
  const [inactiveCountries, setInactiveCountries] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newData, setNewData] = useState({ name: "" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    name: "",
    isInactive: false,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId || 1;

  // SEARCH
  const [searchText, setSearchText] = useState("");

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };
 
  const sortedCountries = countries; 

  // LOAD COUNTRIES
  const loadCountries = async (forceRefresh = false) => {
    const { data, total } = await loadCountriesCtx(page, limit, searchText, forceRefresh, sortConfig.key, sortConfig.direction);
    setCountries(data || []);
    setTotalRecords(total || 0);
  };

  useEffect(() => {
    loadCountries();
  }, [page, limit, sortConfig]);

  const loadInactive = async () => {
    const data = await loadInactiveCtx();
    setInactiveCountries(data || []);
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
        const { data, total } = await loadCountriesCtx(1, limit, "");
        setCountries(data || []);
        setTotalRecords(total || 0);
        return;
    }
    const { data, total } = await loadCountriesCtx(1, limit, text);
    setCountries(data || []);
    setTotalRecords(total || 0);
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return toast.error("Name required");
    
    // Check duplicates
    try {
        const searchRes = await searchCountryApi(newData.name.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data.records || searchRes.data || [];
            const existing = rows.find(r => (r.Name || r.name || "").toLowerCase() === newData.name.trim().toLowerCase());
            if (existing) return toast.error("Country already exists");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    try {
      const res = await addCountryApi({ ...newData, userId });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Added");
        setNewData({ name: "" });
        setModalOpen(false);
        setPage(1); 
        loadCountries(true);
      } else {
        if (res?.status === 409) {
            toast.error(res?.data?.message || "Country already exists");
        } else {
            toast.error("Failed to add");
        }
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) return toast.error("Name required");

    try {
      const res = await updateCountryApi(editData.id, {
        name: editData.name,
        userId
      });
      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadCountries(true);
        if (showInactive) {
            refreshInactiveCountries();
            loadInactive();
        }
      } else {
        if (res?.status === 409) {
             toast.error(res?.data?.message || "Country already exists");
        } else {
            toast.error("Update failed");
        }
      }
    } catch (err) {
        console.error(err);
        toast.error("Server error");
    }
  };

  const handleDelete = async () => {
    const result = await showDeleteConfirm();

    if (result.isConfirmed) {
      try {
        const res = await deleteCountryApi(editData.id, { userId });
        if (res?.status === 200) {
          showSuccessToast("Deleted");
          setEditModalOpen(false);
          loadCountries(true);
          if (showInactive) {
              refreshInactiveCountries();
              loadInactive();
          }
        } else {
          showErrorToast("Delete failed");
        }
      } catch (err) {
          console.error(err);
          showErrorToast("Server error");
      }
    }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm();

    if (result.isConfirmed) {
      try {
        const res = await restoreCountryApi(editData.id, { userId });
        if (res?.status === 200) {
          showSuccessToast("Restored");
          setEditModalOpen(false);
          loadCountries(true);
          refreshInactiveCountries();
          loadInactive();
        } else {
          showErrorToast("Restore failed");
        }
      } catch (err) {
          console.error(err);
          showErrorToast("Server error");
      }
    }

  };

  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.name && { key: "name", label: "Name", sortable: true },
  ].filter(Boolean);

  return (
    <PageLayout>
      <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Countries</h2>
            <hr className="mb-4 border-gray-300" />

          <MasterTable
            columns={tableColumns}
            data={sortedCountries}
            inactiveData={inactiveCountries}
            showInactive={showInactive}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowClick={(item, isInactive) => {
              setEditData({
                id: item.id,
                name: item.name,
                isInactive: isInactive,
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
              setShowInactive((s) => !s);
            }}
          />

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
        </ContentCard>
      </div>

       {/* ADD COUNTRY MODAL */}
       <AddModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleAdd}
         title="New Country"
       >
          <div className="space-y-4">
              <div>
                  <div className="flex gap-2 items-start">
                    <div className="flex-grow">
                      <InputField
                        label="Name"
                        value={newData.name}
                        onChange={e => setNewData({...newData, name: e.target.value})}
                        className=""
                        required
                        autoFocus
                      />
                    </div>
                  </div>
              </div>
          </div>
       </AddModal>

       {/* EDIT COUNTRY MODAL */}
       <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onRestore={handleRestore}
          isInactive={editData.isInactive}
          title={editData.isInactive ? "Restore Country" : "Edit Country"}
          permissionDelete={hasPermission(PERMISSIONS.COUNTRIES.DELETE)}
          permissionEdit={hasPermission(PERMISSIONS.COUNTRIES.EDIT)}
       >
           <div className="space-y-4">
              <div>
                  <div className="flex gap-2 items-start">
                    <div className="flex-grow">
                      <InputField
                        label="Name"
                        value={editData.name}
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        disabled={editData.isInactive}
                        className=""
                        required
                      />
                    </div>
                  </div>
              </div>
           </div>
       </EditModal>

       {/* COLUMN PICKER MODAL */}
       <ColumnPickerModal
          isOpen={columnModal}
          onClose={() => setColumnModal(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
       />

    </PageLayout>
  );
};

export default Countries;
