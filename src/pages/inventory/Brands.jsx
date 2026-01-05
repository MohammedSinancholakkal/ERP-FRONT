import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
} from "lucide-react";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";

import toast from "react-hot-toast";
import { ArchiveRestore } from "lucide-react";
import Swal from "sweetalert2";

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
          <div className="flex flex-col h-full overflow-hidden">

            <h2 className="text-2xl font-semibold mb-4">Brands</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-1 mb-4">

              {/* SEARCH */}
              <div className={`flex items-center px-2 py-1.5 rounded-md border w-full sm:w-60 ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600' : 'bg-gray-700 border-gray-600'}`}>
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
              {hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE) && (
              <button
                onClick={() => setModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <Plus size={16} /> New Brand
              </button>
              )}

              {/* REFRESH */}
              <button
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                  loadBrands();
                }}
                className={`p-1.5 rounded-md border ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <RefreshCw size={16} className="text-blue-400" />
              </button>

              {/* COLUMN PICKER */}
              <button
                onClick={() => setColumnModalOpen(true)}
                className={`p-1.5 rounded-md border ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <List size={16} className="text-blue-300" />
              </button>

              {/* INACTIVE TOGGLE */}
              <button
                onClick={async () => {
                  if (!showInactive) await loadInactive();
                  setShowInactive(!showInactive);
                }}
                className={`p-2 border rounded flex items-center gap-2 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-600 hover:bg-emerald-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <ArchiveRestore size={16} className="text-yellow-400" />
                <span className="text-xs text-gray-300">
                 Inactive
                </span>
              </button>

            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-auto">
                <table className="w-[500px] text-left border-separate border-spacing-y-1 text-sm">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white">

                      {visibleColumns.id && (
                        <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
                      )}

                      {visibleColumns.name && (
                        <SortableHeader label="Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                      )}

                      {visibleColumns.description && (
                        <SortableHeader label="Description" sortKey="description" currentSort={sortConfig} onSort={handleSort} />
                      )}

                    </tr>
                  </thead>

                  <tbody>
                    {sortedBrands.map((b) => (
                      <tr
                        key={b.id}
                        className={`${theme === 'emerald' ? 'bg-emerald-800 hover:bg-emerald-700' : 'bg-gray-900 hover:bg-gray-700'} cursor-pointer rounded shadow-sm`}
                        onClick={() => {
                          setEditBrand({
                            id: b.id,
                            name: b.name,
                            description: b.description,
                            isInactive: false
                          });
                          setEditModalOpen(true);
                        }}
                      >
                        {visibleColumns.id && (
                          <td className="px-2 py-1 text-center">{b.id}</td>
                        )}
                        {visibleColumns.name && (
                          <td className="px-2 py-1 text-center">{b.name}</td>
                        )}
                        {visibleColumns.description && (
                          <td className="px-2 py-1 text-center">{b.description}</td>
                        )}
                      </tr>
                    ))}

                    {/* INACTIVE BRANDS */}
                    {showInactive && inactiveBrands.map((b) => (
                      <tr
                        key={`inactive-${b.id}`}
                        className={`${theme === 'emerald' ? 'bg-emerald-900 hover:bg-emerald-800' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer opacity-50 line-through rounded shadow-sm`}
                        onClick={() => {
                          setEditBrand({
                            id: b.id,
                            name: b.name,
                            description: b.description,
                            isInactive: true
                          });
                          setEditModalOpen(true);
                        }}
                      >
                         {visibleColumns.id && (
                          <td className="px-2 py-1 text-center">{b.id}</td>
                        )}
                        {visibleColumns.name && (
                          <td className="px-2 py-1 text-center">{b.name}</td>
                        )}
                        {visibleColumns.description && (
                          <td className="px-2 py-1 text-center">{b.description}</td>
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



