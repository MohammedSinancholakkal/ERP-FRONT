import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,

  ArchiveRestore
} from "lucide-react";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";

import toast from "react-hot-toast";

import {
  addCategoryApi,
  getCategoriesApi,
  updateCategoryApi,
  deleteCategoryApi,
  searchCategoryApi,
  restoreCategoryApi,
  getInactiveCategoriesApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import Swal from "sweetalert2";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";

const Categories = () => {
  // =============================
  // STATES
  // =============================
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [inactiveCategories, setInactiveCategories] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentCategoryId: null
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState({
    id: null,
    name: "",
    description: "",
    parentCategoryId: null,
    parentName: "",
    isInactive: false
  });

 // pagination
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(25);
const [totalRecords, setTotalRecords] = useState(0);

// REQUIRED VALUES
const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
const end = Math.min(page * limit, totalRecords);


  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
    name: true,
    description: true,
    parentName: true
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // SORT
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedCategories = [...categories].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = String(a[sortConfig.key] || "").toLowerCase();
    const valB = String(b[sortConfig.key] || "").toLowerCase();
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });



  // =============================
  // LOADERS
  // =============================
  const loadCategories = async () => {
    const res = await getCategoriesApi(page, limit);
    if (res.status === 200) {
      setCategories(res.data.records);
      setTotalRecords(res.data.total);
    }
  };

  const loadInactive = async () => {
    const res = await getInactiveCategoriesApi();
    if (res.status === 200) {
      setInactiveCategories(res.data.records || res.data);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [page, limit]);

  // =============================
  // SEARCH HANDLER
  // =============================
  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) return loadCategories();

    const res = await searchCategoryApi(text.trim());
    if (res.status === 200) {
      setCategories(res.data);
    }
  };

  // =============================
  // ADD CATEGORY
  // =============================
  const handleAdd = async () => {
    if (!newCategory.name.trim()) return toast.error("Name required");

    const res = await addCategoryApi({
      ...newCategory,
      userId: currentUserId
    });

    if (res.status === 200) {
      toast.success("Category added");
      setNewCategory({ name: "", description: "", parentCategoryId: null });
      setModalOpen(false);
      loadCategories();
    }
  };

  // =============================
  // UPDATE
  // =============================
  const handleUpdate = async () => {
    if (!editCategory.name.trim()) return toast.error("Name required");

    const payload = {
      name: editCategory.name,
      description: editCategory.description,
      parentCategoryId: editCategory.parentCategoryId || null,
      userId: currentUserId
    };

    const res = await updateCategoryApi(editCategory.id, payload);

    if (res.status === 200) {
      toast.success("Updated");
      setParentSearchEdit("");
      setEditModalOpen(false);
      loadCategories();
    }
  };

  // =============================
  // DELETE
  // =============================
const handleDelete = async () => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This category will be deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await deleteCategoryApi(editCategory.id, {
      userId: currentUserId,
    });

    if (res.status === 200) {
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Category deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      setEditModalOpen(false);
      loadCategories();
      if (showInactive) loadInactive();
    }
  } catch (error) {
    console.error("Delete category failed:", error);

    Swal.fire({
      icon: "error",
      title: "Delete failed",
      text: "Failed to delete category. Please try again.",
    });
  }
};


  // =============================
  // RESTORE
  // =============================
const handleRestore = async () => {
  const result = await Swal.fire({
    title: "Restore category?",
    text: "This category will be restored and made active again.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#16a34a", // green
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, restore",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await restoreCategoryApi(editCategory.id, {
      userId: currentUserId,
    });

    if (res.status === 200) {
      await Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Category restored successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      setEditModalOpen(false);
      loadCategories();
      loadInactive();
    }
  } catch (error) {
    console.error("Restore category failed:", error);

    Swal.fire({
      icon: "error",
      title: "Restore failed",
      text: "Failed to restore category. Please try again.",
    });
  }
};


  // =============================
  // FILTER FOR DROPDOWN
  // =============================




  return (
    <>
{/* =============================
    ADD CATEGORY MODAL
============================= */}
      {/* =============================
          ADD CATEGORY MODAL
      ============================= */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Category"
      >
        {/* NAME */}
        <label className="block text-sm mb-1">Name *</label>
        <input
          type="text"
          value={newCategory.name}
          onChange={(e) =>
            setNewCategory((p) => ({ ...p, name: e.target.value }))
          }
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mb-4 focus:border-white outline-none"
        />

        {/* DESCRIPTION */}
        <label className="block text-sm mb-1">Description</label>
        <textarea
          value={newCategory.description}
          onChange={(e) =>
            setNewCategory((p) => ({ ...p, description: e.target.value }))
          }
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-20 mb-4 focus:border-white outline-none"
        />

        {/* PARENT CATEGORY */}
        <label className="block text-sm mb-1">Parent Category</label>
        <div className="mt-1">
          <SearchableSelect
            options={categories.map(c => ({ id: c.id, name: c.name }))}
            value={newCategory.parentCategoryId}
            onChange={(v) => {
               const selected = categories.find(c => String(c.id) === String(v));
               setNewCategory(p => ({ ...p, parentCategoryId: v, parentName: selected ? selected.name : "" }));
            }}
            placeholder="Search parent category..."
            className="w-full"
            direction="up"
          />
        </div>
      </AddModal>

{/* =============================
    EDIT CATEGORY MODAL
============================= */}
      {/* =============================
          EDIT CATEGORY MODAL
      ============================= */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        isInactive={editCategory.isInactive}
        title={`${editCategory.isInactive ? "Restore Category" : "Edit Category"}`}
        permissionDelete={hasPermission(PERMISSIONS.INVENTORY.CATEGORIES.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.INVENTORY.CATEGORIES.EDIT)}
      >
        {/* NAME */}
        <label className="block text-sm mb-1">Name *</label>
        <input
          value={editCategory.name}
          onChange={(e) =>
            setEditCategory((p) => ({ ...p, name: e.target.value }))
          }
          disabled={editCategory.isInactive}
          className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-4 text-sm focus:border-white outline-none ${
            editCategory.isInactive ? "opacity-60 cursor-not-allowed" : ""
          }`}
        />

        {/* DESCRIPTION */}
        <label className="block text-sm mb-1">Description</label>
        <textarea
          value={editCategory.description}
          onChange={(e) =>
            setEditCategory((p) => ({ ...p, description: e.target.value }))
          }
          disabled={editCategory.isInactive}
          className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 mb-4 text-sm focus:border-white outline-none ${
            editCategory.isInactive ? "opacity-60 cursor-not-allowed" : ""
          }`}
        />

        {/* PARENT CATEGORY */}
        <label className="block text-sm mb-1">Parent Category</label>
        <div className="mt-1">
          <SearchableSelect
            options={categories.map(c => ({ id: c.id, name: c.name }))}
            value={editCategory.parentCategoryId}
            onChange={(v) => {
               const selected = categories.find(c => String(c.id) === String(v));
               setEditCategory(p => ({ ...p, parentCategoryId: v, parentName: selected ? selected.name : "" }));
            }}
            placeholder="Search parent category..."
            className="w-full"
            direction="up"
            disabled={editCategory.isInactive}
          />
        </div>
      </EditModal>


      {/* =============================
          COLUMN PICKER
      ============================= */}
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* ===================================
              MAIN PAGE
      =================================== */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
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
            {hasPermission(PERMISSIONS.INVENTORY.CATEGORIES.CREATE) && (
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600">
              <Plus size={16} /> New Category
            </button>
            )}

            {/* REFRESH */}
            <button onClick={() => { setSearchText(""); setPage(1); loadCategories(); }} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600">
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* COLUMN PICKER */}
            <button onClick={() => setColumnModalOpen(true)} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600">
              <List size={16} className="text-blue-300" />
            </button>

            {/* INACTIVE TOGGLE */}
            <button onClick={async () => { if (!showInactive) await loadInactive(); setShowInactive(!showInactive); }} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1">
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
            </button>
          </div>

          {/* ==========================
                TABLE
          =========================== */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="w-[800px] text-left border-separate border-spacing-y-1 text-sm">
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
                    {visibleColumns.parentName && (
                      <SortableHeader label="Parent Category" sortKey="parentName" currentSort={sortConfig} onSort={handleSort} />
                    )}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE */}
                  {sortedCategories.map((c) => (
                    <tr key={c.id} className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm" onClick={() => { setEditCategory({ id: c.id, name: c.name, description: c.description, parentCategoryId: c.parentCategoryId, parentName: c.parentName, isInactive: false }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.name && <td className="px-2 py-1 text-center">{c.name}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
                    </tr>
                  ))}

                  {/* INACTIVE */}
                  {showInactive && inactiveCategories.map((c) => (
                    <tr key={`inactive-${c.id}`} className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm" onClick={() => { setEditCategory({ id: c.id, name: c.name, description: c.description, parentCategoryId: c.parentCategoryId, parentName: c.parentName, isInactive: true }); setEditModalOpen(true); }}>
                      {visibleColumns.id && <td className="px-2 py-1 text-center">{c.id}</td>}
                      {visibleColumns.name && <td className="px-2 py-1 text-center">{c.name}</td>}
                      {visibleColumns.description && <td className="px-2 py-1 text-center">{c.description}</td>}
                      {visibleColumns.parentName && <td className="px-2 py-1 text-center">{c.parentName || "-"}</td>}
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
              loadCategories();
            }}
          />
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Categories;



