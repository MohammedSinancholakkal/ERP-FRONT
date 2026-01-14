import React, { useState, useEffect } from "react";
import {
  Plus,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";

import toast from "react-hot-toast";
import Swal from "sweetalert2";
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
      toast.error("Failed to load brands");
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
      return toast.error("Brand name required");

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
      toast.success("Brand added");
      setNewBrand({ name: "", description: "" });
      setModalOpen(false);
      loadBrands();
    } else if (res?.status === 409) {
      toast.error(res.data.message || "Brand Name already exists");
    } else {
      toast.error("Failed to add");
    }
  };

  // UPDATE
  const handleUpdateBrand = async () => {
    if (!editBrand.name.trim())
      return toast.error("Brand name required");

    // DUPLICATE CHECK
    try {
    const searchRes = await searchBrandApi(editBrand.name.trim());
    if (searchRes?.status === 200) {
        const existing = searchRes.data.find(b => 
            b.name.toLowerCase() === editBrand.name.trim().toLowerCase() && 
            String(b.id) !== String(editBrand.id)
        );
        if (existing) return toast.error("Brand Name already exists");
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
      toast.success("Brand updated");
      setEditModalOpen(false);
      loadBrands();
    } else if (res?.status === 409) {
      toast.error(res.data.message || "Brand Name already exists");
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE BRAND
  const handleDeleteBrand = async () => {
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "This brand will be deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });
  
      if (!result.isConfirmed) return;
  
      try {
        const res = await deleteBrandApi(editBrand.id, {
          userId: user?.userId || 1
        });
  
        if (res?.status === 200) {
          toast.success("Brand deleted");
          setEditModalOpen(false);
          loadBrands();
          if (showInactive) loadInactive();
        } else {
          toast.error("Delete failed");
        }
      } catch(err) {
        console.error("Delete failed", err);
        toast.error("Delete failed");
      }
  };

  // RESTORE BRAND
  const handleRestoreBrand = async () => {
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "This brand will be restored!",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, restore",
        cancelButtonText: "Cancel",
      });
  
      if (!result.isConfirmed) return;
  
      try {
        const res = await restoreBrandApi(editBrand.id, { userId: user?.userId || 1 });
        if (res?.status === 200) {
          toast.success("Brand restored");
          setEditModalOpen(false);
          loadBrands();
          loadInactive();
        } else {
          toast.error("Restore failed");
        }
      } catch(err) {
        console.error("Restore failed", err);
        toast.error("Restore failed");
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
        <label className="block text-sm mb-1">Name *</label>
        <input
          type="text"
          value={newBrand.name}
          onChange={(e) =>
            setNewBrand((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter brand name"
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mb-4 focus:border-white focus:outline-none"
        />

        {/* DESCRIPTION */}
        <label className="block text-sm mb-1">Description</label>
        <textarea
          value={newBrand.description}
          onChange={(e) =>
            setNewBrand((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter description"
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-24 focus:border-white focus:outline-none"
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
        <label className="block text-sm mb-1">Name *</label>
        <input
          type="text"
          value={editBrand.name}
          onChange={(e) =>
            setEditBrand((prev) => ({ ...prev, name: e.target.value }))
          }
          className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mb-4 focus:border-white focus:outline-none ${
            editBrand.isInactive ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={editBrand.isInactive}
        />

        {/* DESCRIPTION */}
        <label className="block text-sm mb-1">Description</label>
        <textarea
          value={editBrand.description}
          onChange={(e) =>
            setEditBrand((prev) => ({ ...prev, description: e.target.value }))
          }
          className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-24 focus:border-white focus:outline-none ${
            editBrand.isInactive ? "opacity-60 cursor-not-allowed" : ""
          }`}
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
        <div className={`p-4 text-white h-full ${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-900 to-emerald-700' : 'bg-gradient-to-b from-gray-900 to-gray-700'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <h2 className="text-2xl font-semibold mb-4">Brands</h2>

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
        </div>
      </PageLayout>

    </>
  );
};

export default Brands;