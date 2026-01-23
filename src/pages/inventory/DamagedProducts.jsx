// src/pages/masters/DamagedProducts.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileSpreadsheet,
  FileText,
  Calendar
} from "lucide-react";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";

import {
  addDamagedProductApi,
  updateDamagedProductApi,
  deleteDamagedProductApi,
  restoreDamagedProductApi,
  getDamagedProductsApi,
  getInactiveDamagedProductsApi,
  getProductsApi,
  getCategoriesApi,
  getWarehousesApi,
  getLastPurchasePriceApi,
  searchDamagedProductsApi, // ADDED
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
import InputField from "../../components/InputField";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import MasterTable from "../../components/MasterTable"; // ADDED
import { useTheme } from "../../context/ThemeContext"; // ADDED

const ExportButtons = ({ onExcel, onPDF }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onExcel}
      title="Export to Excel"
      className="p-1.5 bg-green-700/10 border border-green-700 rounded hover:bg-green-700/20 flex items-center gap-2"
    >
      <FileSpreadsheet size={16} className="text-green-300" />
      <span className="hidden sm:inline text-sm">Excel</span>
    </button>

    <button
      onClick={onPDF}
      title="Export to PDF"
      className="p-1.5 bg-red-700/10 border border-red-700 rounded hover:bg-red-700/20 flex items-center gap-2"
    >
      <FileText size={16} className="text-red-300" />
      <span className="hidden sm:inline text-sm">PDF</span>
    </button>
  </div>
);






/* =========================================================
   MAIN COMPONENT
   ========================================================= */
import ContentCard from "../../components/ContentCard";

const DamagedProducts = () => {
  const { theme } = useTheme(); // ADDED
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [damaged, setDamaged] = useState([]);
  const [inactive, setInactive] = useState([]); 

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  
  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    loadDamaged(page, limit, newConfig);
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  const defaultColumns = {
    id: true,
    code: true,
    name: true,
    category: true,
    purchasePrice: true,
    quantity: true,
    date: true,
    supplier: true, // NEW
    purchaseId: true, // NEW
    note: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [searchColumn, setSearchColumn] = useState("");

  /* =========================================================
                     FORM STATES
   ========================================================= */
  const [newDP, setNewDP] = useState({
    ProductId: "",
    Code: "",
    Name: "",
    CategoryId: "",
    PurchasePrice: "",
    Quantity: "",
    Date: "",
    Note: "",
    WarehouseId: "",
    PurchaseId: "", // NEW
  });

  const [editDP, setEditDP] = useState({
    id: null,
    ProductId: "",
    Code: "",
    Name: "",
    CategoryId: "",
    PurchasePrice: "",
    Quantity: "",
    Date: "",
    Note: "",
    WarehouseId: "",
    PurchaseId: "", // NEW
    isInactive: false,
  });

  /* =========================================================
                     LOADERS
   ========================================================= */
  const loadProducts = async () => {
    try {
      const res = await getProductsApi(1, 10000);
      setProducts(res.data.records || []);
    } catch (err) {
      console.error("PRODUCT LOAD ERR:", err);
      setProducts([]);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getCategoriesApi(1, 10000);
      setCategories(res.data.records || []);
    } catch (err) {
      console.error("CATEGORY LOAD ERR:", err);
      setCategories([]);
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await getWarehousesApi(1, 10000);
      setWarehouses(res.data.records || []);
    } catch (err) {
      console.error("WAREHOUSE LOAD ERR:", err);
      setWarehouses([]);
    }
  };

  const loadDamaged = async (p = page, l = limit, currentSort = sortConfig, query = searchText) => {
    setLoading(true);
    try {
      const { key, direction } = currentSort;
      let res;
      if (query && query.trim().length > 0) {
           res = await searchDamagedProductsApi(query);
           const data = res.data.records || res.data || [];
           setDamaged(data);
           // For search, we set total later dynamically based on filtered list length or here if no other filters
           // But since we have category filter, we'll let computeDisplayed handle 'total' for pagination? 
           // No, usually 'total' drives pagination. 
           // If search returns ALL, 'total' is just length.
           // However, we also have 'filterCategory'. 
           // If we assume search returns EVERYTHING matching text, we can filter by category on client.
      } else {
           res = await getDamagedProductsApi(p, l, key, direction); // Pass sort params
           setDamaged(res.data.records || []);
           setTotal(res.data.total || 0);
      }
    } catch (err) {
      setDamaged([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadInactive = async () => {
    try {
      const res = await getInactiveDamagedProductsApi();
      setInactive(res.data || []);
    } catch {
      setInactive([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pagination / Sort Effect (Only if NO search text)
  useEffect(() => {
     if (!searchText.trim()) {
        loadDamaged(page, limit);
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // Debounced Search Effect
  useEffect(() => {
      const timer = setTimeout(() => {
          if (searchText.trim()) {
            setPage(1);
            loadDamaged(1, limit, sortConfig, searchText);
          } else {
            // If cleared, reload normal paginated
             loadDamaged(1, limit, sortConfig, "");
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [searchText]);


  /* =========================================================
      PRODUCT SELECTION AUTO-FILL — robust
   ========================================================= */
  const handleSelectProduct = async (productId, mode) => {
    const prod =
      products.find(
        (p) =>
          String(p.Id) === String(productId) ||
          String(p.id) === String(productId)
      ) || {};

    if (mode === "add") {
      setNewDP((prev) => ({
        ...prev,
        ProductId: productId,
        Code: prod.Barcode ?? prod.barcode ?? "",
        Name: prod.ProductName ?? prod.productName ?? prod.name ?? "",
        CategoryId: prod.CategoryId ?? prod.categoryId ?? prev.CategoryId,
        Quantity: "1.00",
      }));

      // Fetch Last Purchase Price for add mode
      try {
        const res = await getLastPurchasePriceApi(productId);
        if (res.status === 200) {
          setNewDP((prev) => ({
            ...prev,
            PurchasePrice: res.data.price || 0,
            PurchaseId: res.data.purchaseId || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching last purchase price", err);
      }
    } else {
      setEditDP((prev) => ({
        ...prev,
        ProductId: productId,
        Code: prod.Barcode ?? prod.barcode ?? "",
        Name: prod.ProductName ?? prod.productName ?? prod.name ?? "",
        CategoryId: prod.CategoryId ?? prod.categoryId ?? prev.CategoryId,
      }));
    }
  };

  /* =========================================================
                      ADD / UPDATE / DELETE / RESTORE
     ========================================================= */
  const openAdd = () => {
    setNewDP({
      ProductId: "",
      Code: "",
      Name: "",
      CategoryId: "",
      PurchasePrice: "",
      Quantity: "",
      Date: "",
      Note: "",
      WarehouseId: "",
      PurchaseId: "",
    });
    setModalOpen(true);
  };

  const handleAdd = async () => {
    const noteLen = newDP.Note?.trim().length || 0;
    if (newDP.Note && (noteLen < 2 || noteLen > 300)) return showErrorToast("Note must be between 2 and 300 characters");
    if (!newDP.ProductId) return showErrorToast("Product is required");
    if (!newDP.Code) return showErrorToast("Code is required");
    if (!newDP.Name) return showErrorToast("Name is required");
    if (!newDP.CategoryId) return showErrorToast("Category is required");
    if (newDP.PurchasePrice === "" || newDP.PurchasePrice === null)
      return showErrorToast("Purchase Price is required");
    if (newDP.Quantity === "" || newDP.Quantity === null)
      return showErrorToast("Quantity is required");
    if (!newDP.Date) return showErrorToast("Date is required");
    if (!newDP.Note?.trim()) return showErrorToast("Note is required");

    const payload = {
      productId: newDP.ProductId,
      code: newDP.Code,
      name: newDP.Name,
      categoryId: newDP.CategoryId,
      purchasePrice: parseFloat(newDP.PurchasePrice || 0),
      quantity: parseFloat(newDP.Quantity || 0),
      date: newDP.Date || null,
      note: newDP.Note || null,
      warehouseId: newDP.WarehouseId || null,
      userId: currentUserId,
      purchaseId: newDP.PurchaseId || null
    };

    try {
      const res = await addDamagedProductApi(payload);
      if (res?.status === 201 || res?.status === 200) {
        showSuccessToast("Added");
        setModalOpen(false);
        setPage(1);
        await loadDamaged(1, limit);
      } else {
        showErrorToast("Add failed");
      }
    } catch (err) {
      console.error("ADD ERR:", err);
      showErrorToast("Server error");
    }
  };

  const openEditModalFn = (record, inactive = false) => {
    setEditDP({
      id: record.Id ?? record.id ?? null,
      ProductId: record.ProductId ?? record.productId ?? "",
      Code: record.Code ?? record.code ?? "",
      Name: record.Name ?? record.name ?? "",
      CategoryId: record.CategoryId ?? record.categoryId ?? "",
      PurchasePrice: record.PurchasePrice ?? record.purchasePrice ?? "",
      Quantity: record.Quantity ?? record.quantity ?? "",
      Date: record.Date ? String(record.Date).split("T")[0] : "",
      Note: record.Note ?? record.note ?? "",
      WarehouseId: record.WarehouseId ?? record.warehouseId ?? "",
      PurchaseId: record.PurchaseId ?? record.purchaseId ?? "",
      isInactive: inactive,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    const noteLen = editDP.Note?.trim().length || 0;
    if (editDP.Note && (noteLen < 2 || noteLen > 300)) return showErrorToast("Note must be between 2 and 300 characters");
    if (!editDP.ProductId) return showErrorToast("Product is required");
    if (!editDP.Code) return showErrorToast("Code is required");
    if (!editDP.Name) return showErrorToast("Name is required");
    if (!editDP.CategoryId) return showErrorToast("Category is required");
    if (editDP.PurchasePrice === "" || editDP.PurchasePrice === null)
      return showErrorToast("Purchase Price is required");
    if (editDP.Quantity === "" || editDP.Quantity === null)
      return showErrorToast("Quantity is required");
    if (!editDP.Date) return showErrorToast("Date is required");
    if (!editDP.Note?.trim()) return showErrorToast("Note is required");

    const payload = {
      productId: editDP.ProductId,
      code: editDP.Code,
      name: editDP.Name,
      categoryId: editDP.CategoryId,
      purchasePrice: parseFloat(editDP.PurchasePrice || 0),
      quantity: parseFloat(editDP.Quantity || 0),
      date: editDP.Date || null,
      note: editDP.Note || null,
      warehouseId: editDP.WarehouseId || null,
      userId: currentUserId,
    };

    try {
      const res = await updateDamagedProductApi(editDP.id, payload);
      if (res?.status === 200) {
        showSuccessToast("Updated");
        setEditModalOpen(false);
        await loadDamaged(page, limit);
        if (showInactive) await loadInactive();
      } else {
        showErrorToast("Update failed");
      }
    } catch (err) {
      console.error("UPDATE ERR:", err);
      showErrorToast("Update failed");
    }
  };

  const handleDelete = async () => {
    const result = await showDeleteConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await deleteDamagedProductApi(editDP.id, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        showSuccessToast("Deleted");
        setEditModalOpen(false);
        await loadDamaged(page, limit);
        if (showInactive) await loadInactive();
      } else {
        showErrorToast("Delete failed");
      }
    } catch (err) {
      console.error("DELETE ERR:", err);
      showErrorToast("Delete failed");
    }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await restoreDamagedProductApi(editDP.id, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        showSuccessToast("Restored");
        setEditModalOpen(false);
        await loadDamaged(page, limit);
        await loadInactive();
      } else {
        showErrorToast("Restore failed");
      }
    } catch (err) {
      console.error("RESTORE ERR:", err);
      showErrorToast("Restore failed");
    }
  };

  /* =========================================================
                   FILTER, SEARCH, DISPLAY LOGIC
     ========================================================= */
  const computeDisplayed = () => {
    let list = Array.isArray(damaged) ? [...damaged] : [];

    // REMOVED CLIENT SIDE TEXT FILTERING as we now use backend search
    
    if (filterCategory) {
      list = list.filter(
        (r) => String(r.CategoryId ?? r.categoryId) === String(filterCategory)
      );
    }

    return list;
  };

  const [displayed, setDisplayed] = useState([]);

  useEffect(() => {
    const filtered = computeDisplayed();
    
    // If we are searching, we likely got ALL results, so we should filter down 'total' for pagination
    if (searchText.trim()) {
       setTotal(filtered.length);
       // Now slice for client-side pagination of search results
       const startIdx = (page - 1) * limit;
       setDisplayed(filtered.slice(startIdx, startIdx + limit));
    } else {
       // Normal pagination mode, 'damaged' is already sliced
       setDisplayed(filtered);
       // Total is already set in loadDamaged
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damaged, searchText, filterCategory, page, limit]);

  // --- SORTING LOGIC ---
  // Client side sorting removed
  // const sortedList = ...

  // --- FILTER BAR CONFIG ---
  const filters = [
      {
          type: 'select',
          value: filterCategory,
          onChange: setFilterCategory,
          options: categories.map(c => ({ id: c.Id ?? c.id, name: c.Name ?? c.name ?? c.CategoryName ?? c.categoryName })),
          placeholder: "All Categories"
      }
  ];

  const handleClearFilters = () => {
    setSearchText("");
    setFilterCategory("");
    setSortConfig({ key: "id", direction: 'asc' });
    loadDamaged(1, limit, { key: "id", direction: 'asc' });
  };

  /* =========================================================
                      EXPORT HELPERS (Excel / PDF)
     ========================================================= */
  const promptFileName = (defaultName) => {
    const name = window.prompt("Enter filename", defaultName);
    if (!name) return null;
    return name;
  };

  const getExportRows = () =>
    displayed.map((r) => ({
      Id: r.Id ?? r.id,
      Code: r.Code ?? r.code,
      Name: r.Name ?? r.name,
      Category: r.CategoryName ?? r.categoryName ?? "",
      Supplier: r.SupplierName ?? r.supplierName ?? "",
      PurchasePrice: r.PurchasePrice ?? r.purchasePrice,
      Quantity: r.Quantity ?? r.quantity,
      Date: r.Date ?? r.date ? String(r.Date ?? r.date).split("T")[0] : "",
      Note: (r.Note ?? r.note) || "",
    }));

  const exportToExcel = () => {
    const f = promptFileName("damaged_export");
    if (!f) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(getExportRows());
    XLSX.utils.book_append_sheet(wb, ws, "DamagedProducts");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout]), `${f}.xlsx`);
  };

  const exportToPDF = () => {
    const f = promptFileName("damaged_export");
    if (!f) return;
    const rows = getExportRows().map((r) => [
      r.Id,
      r.Code,
      r.Name,
      r.Category,
      r.Supplier,
      r.PurchasePrice,
      r.Quantity,
      r.Date,
      r.Note,
    ]);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Damaged Products Export", 14, 16);
    doc.autoTable({
      head: [
        [
          "Id",
          "Code",
          "Name",
          "Category",
          "Supplier",
          "Price",
          "Qty",
          "Date",
          "Note",
        ],
      ],
      body: rows,
      startY: 22,
    });
    doc.save(`${f}.pdf`);
  };



  /* =========================================================
                          MAIN PAGE RENDER
     ========================================================= */
  const inputClass = `w-full px-3 py-2 rounded border outline-none transition-colors text-sm mb-2 ${
    theme === 'emerald'
      ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
      : theme === 'purple'
      ? 'bg-white border-purple-300 text-gray-900 focus:border-purple-500'
      : 'bg-gray-800 border-gray-700 text-white focus:border-gray-500'
  }`;

  const labelClass = `block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`;
  return (
    <>
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Damaged Product"
        width="760px"
      >
        <div className="space-y-4">
           {/* Top 2 Columns */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-4">
                  <SearchableSelect
                    label="Select Product"
                    required
                    options={products.map((p) => ({
                      id: p.Id ?? p.id,
                      name: `${p.ProductName ?? p.productName ?? p.name ?? ""} (${
                        p.Barcode ?? p.barcode ?? ""
                      })`,
                    }))}
                    value={newDP.ProductId}
                    onChange={(v) => handleSelectProduct(v, "add")}
                    placeholder="Search / select product"
                  />
                  
                  <InputField
                     label="Code"
                     value={newDP.Code ?? ""}
                     disabled
                     className="opacity-60 cursor-not-allowed"
                  />
                  
                  <InputField
                     label="Name"
                     value={newDP.Name ?? ""}
                     disabled
                     className="opacity-60 cursor-not-allowed"
                  />

                  <SearchableSelect
                    label="Category"
                    required
                    options={categories.map((c) => ({
                      id: c.Id ?? c.id,
                      name: c.Name ?? c.name ?? c.CategoryName ?? c.categoryName ?? String(c.Id ?? c.id),
                    }))}
                    value={newDP.CategoryId}
                    onChange={(v) => setNewDP((prev) => ({ ...prev, CategoryId: v }))}
                    placeholder="Select category"
                  />
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-4">
                  <InputField
                     label="Date"
                     required
                     type="date"
                     value={newDP.Date ?? ""}
                     onChange={(e) => setNewDP((prev) => ({ ...prev, Date: e.target.value }))}
                  />

                  <InputField
                     label="Purchase ID"
                     type="number"
                     value={newDP.PurchaseId ?? ""}
                     onChange={(e) => setNewDP((prev) => ({ ...prev, PurchaseId: e.target.value }))}
                     placeholder="Auto-filled or Manual"
                  />

                  <InputField
                     label="Purchase Price"
                     required
                     type="number"
                     step="0.01"
                     value={newDP.PurchasePrice ?? ""}
                     onChange={(e) => setNewDP((prev) => ({ ...prev, PurchasePrice: e.target.value }))}
                  />

                  <InputField
                     label="Quantity"
                     required
                     type="number"
                     value={newDP.Quantity ?? ""}
                     onChange={(e) => setNewDP((prev) => ({ ...prev, Quantity: e.target.value }))}
                  />
              </div>
           </div>

           {/* Full Width Note */}
           <div>
              <InputField
                 label="Note"
                 required
                 textarea
                 value={newDP.Note ?? ""}
                 onChange={(e) => setNewDP((prev) => ({ ...prev, Note: e.target.value }))}
                 className="h-24 resize-none"
              />
           </div>
        </div>
      </AddModal>

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        isInactive={editDP.isInactive}
        title={`${
          editDP.isInactive ? "Restore Damaged Product" : "Edit Damaged Product"
        }`}
        permissionDelete={hasPermission(
          PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.DELETE
        )}
        permissionEdit={hasPermission(
          PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.EDIT
        )}
        width="760px"
      >
        <div className="space-y-4">
           {/* Top 2 Columns */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-4">
                  <SearchableSelect
                    label="Select Product"
                    required
                    options={products.map((p) => ({
                      id: p.Id ?? p.id,
                      name: `${p.ProductName ?? p.productName ?? p.name ?? ""} (${
                        p.Barcode ?? p.barcode ?? ""
                      })`,
                    }))}
                    value={editDP.ProductId}
                    onChange={(v) => handleSelectProduct(v, "edit")}
                    placeholder="Search / select product"
                    disabled={editDP.isInactive}
                  />
                  
                  <InputField
                     label="Code"
                     value={editDP.Code ?? ""}
                     disabled
                     className="opacity-60 cursor-not-allowed"
                  />
                  
                  <InputField
                     label="Name"
                     value={editDP.Name ?? ""}
                     disabled
                     className="opacity-60 cursor-not-allowed"
                  />

                  <SearchableSelect
                    label="Category"
                    required
                    options={categories.map((c) => ({
                      id: c.Id ?? c.id,
                      name: c.Name ?? c.name ?? c.CategoryName ?? c.categoryName ?? String(c.Id ?? c.id),
                    }))}
                    value={editDP.CategoryId}
                    onChange={(v) => setEditDP((prev) => ({ ...prev, CategoryId: v }))}
                    placeholder="Select category"
                    disabled={editDP.isInactive}
                  />
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-4">
                  <InputField
                     label="Date"
                     required
                     type="date"
                     value={editDP.Date ?? ""}
                     onChange={(e) => setEditDP((prev) => ({ ...prev, Date: e.target.value }))}
                     disabled={editDP.isInactive}
                  />

                  <InputField
                     label="Purchase ID"
                     type="number"
                     value={editDP.PurchaseId ?? ""}
                     onChange={(e) => setEditDP((prev) => ({ ...prev, PurchaseId: e.target.value }))}
                     placeholder="Auto-filled or Manual"
                     disabled={editDP.isInactive}
                  />

                  <InputField
                     label="Purchase Price"
                     required
                     type="number"
                     step="0.01"
                     value={editDP.PurchasePrice ?? ""}
                     onChange={(e) => setEditDP((prev) => ({ ...prev, PurchasePrice: e.target.value }))}
                     disabled={editDP.isInactive}
                  />

                  <InputField
                     label="Quantity"
                     required
                     type="number"
                     value={editDP.Quantity ?? ""}
                     onChange={(e) => setEditDP((prev) => ({ ...prev, Quantity: e.target.value }))}
                     disabled={editDP.isInactive}
                  />
              </div>
           </div>

           {/* Full Width Note */}
           <div>
              <InputField
                 label="Note"
                 required
                 textarea
                 value={editDP.Note ?? ""}
                 onChange={(e) => setEditDP((prev) => ({ ...prev, Note: e.target.value }))}
                 className="h-24 resize-none"
                 disabled={editDP.isInactive}
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

      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Damaged Products</h2>
            </div>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "Id", label: "ID", sortable: true },
                    visibleColumns.code && { key: "Code", label: "Code", sortable: true },
                    visibleColumns.name && { key: "Name", label: "Name", sortable: true },
                    visibleColumns.category && { key: "CategoryName", label: "Category", sortable: true, render: (r) => r.CategoryName || r.categoryName || "-" },
                    visibleColumns.supplier && { key: "SupplierName", label: "Supplier", sortable: true, render: (r) => r.SupplierName || r.supplierName || "-" },
                    visibleColumns.purchaseId && { key: "PurchaseId", label: "Pur. ID", sortable: true }, // NEW
                    visibleColumns.purchasePrice && { key: "PurchasePrice", label: "Price", sortable: true },
                    visibleColumns.quantity && { key: "Quantity", label: "Qty", sortable: true },
                    visibleColumns.date && { key: "Date", label: "Date", sortable: true, render: (r) => r.Date ? String(r.Date).split("T")[0] : "" },
                    visibleColumns.note && { key: "Note", label: "Note", sortable: true },
                ].filter(Boolean)}
                data={damaged}
                inactiveData={inactive}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(r, isInactive) => openEditModalFn(r, isInactive)}
                
                // Action Barprops
                search={searchText}
                onSearch={(val) => setSearchText(val)}
                
                onCreate={() => openAdd()}
                createLabel="New Entry"
                permissionCreate={hasPermission(PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.CREATE)}
                
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    setShowInactive(false); // Reset inactive
                    loadDamaged(1, limit);
                }}
                
                onColumnSelector={() => setColumnModalOpen(true)}
                
                onToggleInactive={async () => {
                   if (!showInactive) await loadInactive();
                   setShowInactive(!showInactive);
                }}
                
                customActions={<ExportButtons onExcel={exportToExcel} onPDF={exportToPDF} />}
            >
               {/* FILTER BAR - as child */}
               <div className="">
                  <FilterBar filters={filters} onClear={handleClearFilters} />
               </div>
            </MasterTable>

          {/* pagination */}
          <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            total={total}
            onRefresh={() => {
               setSearchText("");
               setPage(1);
               loadDamaged(1, limit);
            }}
          />
        </div>
        </ContentCard>
      </div>
      </PageLayout>
    </>
  );
};
export default DamagedProducts;



