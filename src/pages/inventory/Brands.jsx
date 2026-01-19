import React, { useState, useEffect } from "react";
import {
  Plus,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";

import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import Pagination from "../../components/Pagination";

// API
import {
  getBrandsApi,
  addBrandApi,
  updateBrandApi, 
  deleteBrandApi,
  searchBrandApi,
  restoreBrandApi,
  getInactiveBrandsApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";

const Brands = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [brands, setBrands] = useState([]);

  const [newBrand, setNewBrand] = useState({ name: "", description: "" });

  // EDIT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBrand, setEditBrand] = useState({
    id: null,
    name: "",
    description: "",
    isInactive: false
  });

  const [inactiveBrands, setInactiveBrands] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // search
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
    description: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedBrands = [...brands].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = String(a[sortConfig.key] || "").toLowerCase();
    const valB = String(b[sortConfig.key] || "").toLowerCase();
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // LOAD BRANDS
  const loadBrands = async () => {
    setSearchText("");

    const res = await getBrandsApi(page, limit);
    if (res?.status === 200) {
      setBrands(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      showErrorToast("Failed to load brands");
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveBrandsApi();
    if (res?.status === 200) {
      setInactiveBrands(res.data.records || res.data || []);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [page, limit]);

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);

    if (text.trim() === "") return loadBrands();

    const res = await searchBrandApi(text);
    if (res?.status === 200) {
      setBrands(res.data);
    }
  };

  // ADD
  const handleAddBrand = async () => {
    if (!newBrand.name.trim())
      return showErrorToast("Brand name required");

    // DUPLICATE CHECK
    try {
      const searchRes = await searchBrandApi(newBrand.name.trim());
      if (searchRes?.status === 200) {
         const existing = searchRes.data.find(b => b.name.toLowerCase() === newBrand.name.trim().toLowerCase());
         if (existing) return toast.error("Brand Name already exists");
      }
    } catch(err) {
      console.error("Duplicate check error", err);
    }

    const res = await addBrandApi({
      name: newBrand.name,
      description: newBrand.description,
      userId: user?.userId || 1
    });

    if (res?.status === 200) {
      showSuccessToast("Brand added");
      setNewBrand({ name: "", description: "" });
      setModalOpen(false);
      loadBrands();
    } else if (res?.status === 409) {
      showErrorToast(res.data.message || "Brand Name already exists");
    } else {
      showErrorToast("Failed to add");
    }
  };

  // UPDATE
  const handleUpdateBrand = async () => {
    if (!editBrand.name.trim())
      return showErrorToast("Brand name required");

    // DUPLICATE CHECK
    try {
    const searchRes = await searchBrandApi(editBrand.name.trim());
    if (searchRes?.status === 200) {
        const existing = searchRes.data.find(b => 
            b.name.toLowerCase() === editBrand.name.trim().toLowerCase() && 
            String(b.id) !== String(editBrand.id)
        );
        if (existing) return showErrorToast("Brand Name already exists");
    }
    } catch(err) {
    console.error("Duplicate check error", err);
    }

    const res = await updateBrandApi(editBrand.id, {
      name: editBrand.name,
      description: editBrand.description,
      userId: user?.userId || 1
    });

    if (res?.status === 200) {
      showSuccessToast("Brand updated");
      setEditModalOpen(false);
      loadBrands();
    } else if (res?.status === 409) {
      showErrorToast(res.data.message || "Brand Name already exists");
    } else {
      showErrorToast("Update failed");
    }
  };

  // DELETE BRAND
  const handleDeleteBrand = async () => {
    const result = await showDeleteConfirm();
  
      if (!result.isConfirmed) return;
  
      try {
        const res = await deleteBrandApi(editBrand.id, {
          userId: user?.userId || 1
        });
  
        if (res?.status === 200) {
          showSuccessToast("Brand deleted");
          setEditModalOpen(false);
          loadBrands();
          if (showInactive) loadInactive();
        } else {
          showErrorToast("Delete failed");
        }
      } catch(err) {
        console.error("Delete failed", err);
        showErrorToast("Delete failed");
      }
  };

  // RESTORE BRAND
  const handleRestoreBrand = async () => {
    const result = await showRestoreConfirm();
  
      if (!result.isConfirmed) return;
  
      try {
        const res = await restoreBrandApi(editBrand.id, { userId: user?.userId || 1 });
        if (res?.status === 200) {
          showSuccessToast("Brand restored");
          setEditModalOpen(false);
          loadBrands();
          loadInactive();
        } else {
          showErrorToast("Restore failed");
        }
      } catch(err) {
        console.error("Restore failed", err);
        showErrorToast("Restore failed");
      }
  };

  /* ======================================================
     RENDER
  ====================================================== */
  const { theme } = useTheme();

  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.name && { key: "name", label: "Name", sortable: true },
    visibleColumns.description && { key: "description", label: "Description", sortable: true },
  ].filter(Boolean);

  return (
    <>
      {/* ======================================================
          ADD BRAND MODAL
      ======================================================= */}
      {/* ======================================================
          ADD BRAND MODAL
      ======================================================= */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddBrand}
        title="New Brand"
      >
        {/* NAME */}
        <InputField
          label="Name"
          value={newBrand.name}
          onChange={(e) =>
            setNewBrand((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter brand name"
          required
          className="mb-4"
        />

        {/* DESCRIPTION */}
        <InputField
          label="Description"
          textarea
          value={newBrand.description}
          onChange={(e) =>
            setNewBrand((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter description"
          className="h-24"
        />
      </AddModal>

      {/* ======================================================
          EDIT BRAND MODAL
      ======================================================= */}
      {/* ======================================================
          EDIT BRAND MODAL
      ======================================================= */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateBrand}
        onDelete={handleDeleteBrand}
        onRestore={handleRestoreBrand}
        isInactive={editBrand.isInactive}
        title={`${editBrand.isInactive ? "Restore Brand" : "Edit Brand"} (${editBrand.name})`}
        permissionDelete={hasPermission(PERMISSIONS.INVENTORY.BRANDS.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.INVENTORY.BRANDS.EDIT)}
      >
        {/* NAME */}
        <InputField
          label="Name"
          value={editBrand.name}
          onChange={(e) =>
            setEditBrand((prev) => ({ ...prev, name: e.target.value }))
          }
          className="mb-4"
          disabled={editBrand.isInactive}
          required
        />

        {/* DESCRIPTION */}
        <InputField
          label="Description"
          textarea
          value={editBrand.description}
          onChange={(e) =>
            setEditBrand((prev) => ({ ...prev, description: e.target.value }))
          }
          className="h-24"
          disabled={editBrand.isInactive}
        />
      </EditModal>

      {/* ======================================================
          COLUMN PICKER
      ======================================================= */}
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* ======================================================
          MAIN PAGE
      ======================================================= */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Brands</h2>
            <hr className="mb-4 border-gray-300" />

            {/* TABLE SECTION - Action Bar is now inside MasterTable */}
            <MasterTable
              columns={tableColumns}
              data={sortedBrands}
              inactiveData={inactiveBrands}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(item, isInactive) => {
                setEditBrand({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    isInactive: isInactive
                  });
                  setEditModalOpen(true);
              }}
              // Action Bar Props
              search={searchText}
              onSearch={handleSearch}
              onCreate={() => setModalOpen(true)}
              createLabel="New Brand"
              permissionCreate={hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE)}
              onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadBrands();
              }}
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
                setPage(1);
                loadBrands();
              }}
            />

          </div>
          </ContentCard>
        </div>
      </PageLayout>

    </>
  );
};

export default Brands;