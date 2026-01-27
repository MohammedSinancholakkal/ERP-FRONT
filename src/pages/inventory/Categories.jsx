import React, { useState, useEffect, useRef } from "react";
import Pagination from "../../components/Pagination";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";
import SearchableSelect from "../../components/SearchableSelect";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
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

import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";


const Categories = () => {
    const { theme } = useTheme();
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

  // SORT
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    loadCategories(page, limit, newConfig);
  };

  // Client-side sorting removed
  // const sortedCategories = ...



  // =============================
  // LOADERS
  // =============================
  const loadCategories = async (p = page, l = limit, currentSort = sortConfig) => {
    const { key, direction } = currentSort;
    const res = await getCategoriesApi(p, l, key, direction); // Pass sort params
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
    const nameLen = newCategory.name.trim().length;
    if (nameLen < 2 || nameLen > 50) return showErrorToast("Category Name must be between 2 and 50 characters");

    const descLen = newCategory.description?.trim().length || 0;
    if (newCategory.description && (descLen < 2 || descLen > 300)) return showErrorToast("Description must be between 2 and 300 characters");

    // Parent category name validation is tricky as we only have the ID here usually, but if we're creating new ones we might need it.
    // However, the input is a select box for existing parent categories. The user probably meant "if searching/selecting".
    // Or if creating a sub-category?
    // Wait, the prompt says "parent category min 2 max 50". This usually implies the Name of the parent category if it's being created or displayed?
    // In this form, it's a dropdown. We can't validate "length" of a dropdown selection ID.
    // BUT! Since it's a "SearchableSelect", maybe they type in it?
    // If it's just selecting an ID, validation is n/a on length, just existence.
    // I will assume the prompt means "If I were to type a new parent category name" OR they want to ensure the selected parent's name meets this?
    // No, standard validation usually applies to INPUT fields.
    // Let's stick to Name and Description for now. If "Parent Category" implies a free-text input, I'd validate it, but it's a select.
    // Re-reading: "parent category min 2 max 50" -> Maybe they mean the name of the parent category?
    // If I select a parent, I am selecting an ID.
    // I will just validate Name and Description.
    // Wait, if the requirement is strict, maybe I should check the selected parent name length?
    // "parent category min 2 max 50" -> This is likely ensuring the Parent Category Name (if displayed or filtered) is within limits? 
    // Or maybe they mistakenly think it's a text box.
    // I'll stick to validating Name and Description. Validating ID length is nonsense.
    // Actually, looking at NewProduct validation, I should probably check NewProduct too.

    if (!newCategory.name.trim()) return showErrorToast("Name required");

    try {
      // DUPLICATE CHECK
      const searchRes = await searchCategoryApi(newCategory.name.trim());
      if (searchRes?.status === 200) {
         const rows = searchRes.data.records || searchRes.data || [];
         const existing = rows.find(c => c.name.toLowerCase() === newCategory.name.trim().toLowerCase());
         if (existing) return showErrorToast("Category with this name already exists");
      }
    } catch (err) {
      console.error("Duplicate check error", err);
    }

    const res = await addCategoryApi({
      ...newCategory,
      userId: currentUserId
    });

    if (res.status === 200) { 
      showSuccessToast("Category added");
      setNewCategory({ name: "", description: "", parentCategoryId: null });
      setModalOpen(false);
      loadCategories();
    }
  };

  // =============================
  // UPDATE
  // =============================
  const handleUpdate = async () => {
    const nameLen = editCategory.name.trim().length;
    if (nameLen < 2 || nameLen > 50) return showErrorToast("Category Name must be between 2 and 50 characters");

    const descLen = editCategory.description?.trim().length || 0;
    if (editCategory.description && (descLen < 2 || descLen > 300)) return showErrorToast("Description must be between 2 and 300 characters");

    if (!editCategory.name.trim()) return showErrorToast("Name required");

    try {
      // DUPLICATE CHECK
      const searchRes = await searchCategoryApi(editCategory.name.trim());
      if (searchRes?.status === 200) {
         const rows = searchRes.data.records || searchRes.data || [];
         const existing = rows.find(c => 
           c.name.toLowerCase() === editCategory.name.trim().toLowerCase() && 
           String(c.id) !== String(editCategory.id)
         );
         if (existing) return showErrorToast("Category with this name already exists");
      }
    } catch (err) {
      console.error("Duplicate check error", err);
    }

    const payload = {
      name: editCategory.name,
      description: editCategory.description,
      parentCategoryId: editCategory.parentCategoryId || null,
      userId: currentUserId
    };

    const res = await updateCategoryApi(editCategory.id, payload);

    if (res.status === 200) {
      showSuccessToast("Updated");
      setEditModalOpen(false);
      loadCategories();
    }
  };

  // =============================
  // DELETE
  // =============================
const handleDelete = async () => {
  const result = await showDeleteConfirm();

  if (!result.isConfirmed) return;

  try {
    const res = await deleteCategoryApi(editCategory.id, {
      userId: currentUserId,
    });

    if (res.status === 200) {
      showSuccessToast("Category deleted successfully.");

      setEditModalOpen(false);
      loadCategories();
      if (showInactive) loadInactive();
    }
  } catch (error) {
    console.error("Delete category failed:", error);

    showErrorToast("Failed to delete category. Please try again.");
  }
};


  // =============================
  // RESTORE
  // =============================
const handleRestore = async () => {
  const result = await showRestoreConfirm();

  if (!result.isConfirmed) return;

  try {
    const res = await restoreCategoryApi(editCategory.id, {
      userId: currentUserId,
    });

    if (res.status === 200) {
      showSuccessToast("Category restored successfully.");

      setEditModalOpen(false);
      loadCategories();
      loadInactive();
    }
  } catch (error) {
    console.error("Restore category failed:", error);

    showErrorToast("Failed to restore category. Please try again.");
  }
};


  return (
    <>
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
        <InputField
          label="Name"
          value={newCategory.name}
          onChange={(e) =>
            setNewCategory((p) => ({ ...p, name: e.target.value }))
          }
          className="mb-4"
          required
        />

        {/* DESCRIPTION */}
        <InputField
          label="Description"
          textarea
          value={newCategory.description}
          onChange={(e) =>
            setNewCategory((p) => ({ ...p, description: e.target.value }))
          }
          className="h-20 mb-4"
        />

        {/* PARENT CATEGORY */}
        <label className="block text-sm mb-1 font-medium">Parent Category</label>
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
        saveText="Update"
      >
        {/* NAME */}
        <InputField
          label="Name"
          value={editCategory.name}
          onChange={(e) =>
            setEditCategory((p) => ({ ...p, name: e.target.value }))
          }
          disabled={editCategory.isInactive}
          className="mb-4"
          required
        />

        {/* DESCRIPTION */}
        <InputField
          label="Description"
          textarea
          value={editCategory.description}
          onChange={(e) =>
            setEditCategory((p) => ({ ...p, description: e.target.value }))
          }
          disabled={editCategory.isInactive}
          className="h-20 mb-4"
        />

        {/* PARENT CATEGORY */}
        <label className="block text-sm mb-1 font-medium">Parent Category</label>
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
  <div className="flex flex-col h-full overflow-hidden gap-2">
          <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Categories</h2>
          <hr className="mb-4 border-gray-300" />

            <MasterTable
              columns={[
                  visibleColumns.id && { key: "id", label: "ID", sortable: true },
                  visibleColumns.name && { key: "name", label: "Name", sortable: true },
                  visibleColumns.description && { key: "description", label: "Description", sortable: true },
                  visibleColumns.parentName && { key: "parentName", label: "Parent Category", sortable: true, render: (r) => r.parentName || "-" },
              ].filter(Boolean)}
              data={categories} // Server sorted
            inactiveData={inactiveCategories}
            showInactive={showInactive}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowClick={(c, isInactive) => {
                setEditCategory({
                    id: c.id, 
                    name: c.name, 
                    description: c.description, 
                    parentCategoryId: c.parentCategoryId, 
                    parentName: c.parentName, 
                    isInactive 
                });
                setEditModalOpen(true);
            }}
            // Action Bar Props
            search={searchText}
            onSearch={handleSearch}
            onCreate={() => setModalOpen(true)}
            createLabel="New Category"
            permissionCreate={hasPermission(PERMISSIONS.INVENTORY.CATEGORIES.CREATE)}
            onRefresh={() => {
                setSearchText("");
                setSortConfig({ key: "id", direction: "asc" });
                setPage(1);
                setShowInactive(false);
                loadCategories(1, limit, { key: "id", direction: "asc" });
            }}
            onColumnSelector={() => setColumnModalOpen(true)}
            onToggleInactive={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
            }}
          />

          {/* PAGINATION */}
          <div className="mt-4">
         <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            total={totalRecords}
              onRefresh={() => {
                setSearchText("");
                setSortConfig({ key: "id", direction: "asc" });
                setPage(1);
                setShowInactive(false);
                loadCategories(1, limit, { key: "id", direction: "asc" });
              }}
          />
          </div>       
          </div>
          </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default Categories;



