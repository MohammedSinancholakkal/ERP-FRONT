// src/pages/masters/DamagedProducts.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileSpreadsheet,
  FileText,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
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
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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

  const loadDamaged = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const res = await getDamagedProductsApi(p, l);
      setDamaged(res.data.records || []);
      setTotal(res.data.total || 0);
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
    loadDamaged(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

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
    if (!newDP.ProductId) return toast.error("Product is required");
    if (!newDP.Code) return toast.error("Code is required");
    if (!newDP.Name) return toast.error("Name is required");
    if (!newDP.CategoryId) return toast.error("Category is required");
    if (newDP.PurchasePrice === "" || newDP.PurchasePrice === null)
      return toast.error("Purchase Price is required");
    if (newDP.Quantity === "" || newDP.Quantity === null)
      return toast.error("Quantity is required");
    if (!newDP.Date) return toast.error("Date is required");
    if (!newDP.Note?.trim()) return toast.error("Note is required");

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
        toast.success("Added");
        setModalOpen(false);
        setPage(1);
        await loadDamaged(1, limit);
      } else {
        toast.error("Add failed");
      }
    } catch (err) {
      console.error("ADD ERR:", err);
      toast.error("Server error");
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
    if (!editDP.ProductId) return toast.error("Product is required");
    if (!editDP.Code) return toast.error("Code is required");
    if (!editDP.Name) return toast.error("Name is required");
    if (!editDP.CategoryId) return toast.error("Category is required");
    if (editDP.PurchasePrice === "" || editDP.PurchasePrice === null)
      return toast.error("Purchase Price is required");
    if (editDP.Quantity === "" || editDP.Quantity === null)
      return toast.error("Quantity is required");
    if (!editDP.Date) return toast.error("Date is required");
    if (!editDP.Note?.trim()) return toast.error("Note is required");

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
        toast.success("Updated");
        setEditModalOpen(false);
        await loadDamaged(page, limit);
        if (showInactive) await loadInactive();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error("UPDATE ERR:", err);
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This damaged product entry will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteDamagedProductApi(editDP.id, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        await loadDamaged(page, limit);
        if (showInactive) await loadInactive();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      console.error("DELETE ERR:", err);
      toast.error("Delete failed");
    }
  };

  const handleRestore = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This damaged product entry will be restored!",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await restoreDamagedProductApi(editDP.id, {
        userId: currentUserId,
      });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        await loadDamaged(page, limit);
        await loadInactive();
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error("RESTORE ERR:", err);
      toast.error("Restore failed");
    }
  };

  /* =========================================================
                   FILTER, SEARCH, DISPLAY LOGIC
     ========================================================= */
  const computeDisplayed = () => {
    let list = Array.isArray(damaged) ? [...damaged] : [];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (r) =>
          String(r.Name ?? r.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.Code ?? r.code ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.CategoryName ?? r.categoryName ?? "")
            .toLowerCase()
            .includes(q)
      );
    }

    if (filterCategory) {
      list = list.filter(
        (r) => String(r.CategoryId ?? r.categoryId) === String(filterCategory)
      );
    }

    list.sort((a, b) => (a.Id ?? a.id ?? 0) - (b.Id ?? b.id ?? 0));

    return list;
  };



  const [displayed, setDisplayed] = useState([]);

  useEffect(() => {
    setDisplayed(computeDisplayed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damaged, searchText, filterCategory]);

  // --- SORTING LOGIC ---
  const sortedList = React.useMemo(() => {
    let sortableItems = [...displayed];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        if (['PurchasePrice', 'Quantity', 'Id', 'id', 'purchasePrice', 'quantity'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else {
             // String comparison
             aValue = String(aValue || "").toLowerCase();
             bValue = String(bValue || "").toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [displayed, sortConfig]);

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
    setSortConfig({ key: null, direction: 'asc' });
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
  return (
    <>
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Damaged Product"
        width="760px"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="font-semibold text-sm">* Select Product</label>
            <SearchableSelect
              options={products.map((p) => ({
                id: p.Id ?? p.id,
                name: `${p.ProductName ?? p.productName ?? p.name ?? ""} (${
                  p.Barcode ?? p.barcode ?? ""
                })`,
              }))}
              value={newDP.ProductId}
              onChange={(v) => handleSelectProduct(v, "add")}
              placeholder="Search / select product"
              className="w-full mt-1"
            />
          </div>

          <div>
            <label className="text-sm">* Code</label>
            <input
              disabled
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2 text-sm"
              value={newDP.Code ?? ""}
            />

            <label className="text-sm">* Name</label>
            <input
              disabled
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2 text-sm"
              value={newDP.Name ?? ""}
            />

            <label className="text-sm">* Date</label>
            <div className="relative">
              <input
                type="date"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-sm text-white appearance-none pr-10"
                value={newDP.Date ?? ""}
                onChange={(e) =>
                  setNewDP((prev) => ({ ...prev, Date: e.target.value }))
                }
              />
              <Calendar
                size={18}
                className="text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-sm">* Category</label>
            <div className="mt-1">
              <SearchableSelect
                options={categories.map((c) => ({
                  id: c.Id ?? c.id,
                  name:
                    c.Name ??
                    c.name ??
                    c.CategoryName ??
                    c.categoryName ??
                    String(c.Id ?? c.id),
                }))}
                value={newDP.CategoryId}
                onChange={(v) =>
                  setNewDP((prev) => ({ ...prev, CategoryId: v }))
                }
                placeholder="Select category"
                className="w-full"
              />
            </div>

            <label className="mt-3 block text-sm">Purchase ID</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-sm"
              value={newDP.PurchaseId ?? ""}
              onChange={(e) =>
                setNewDP((prev) => ({ ...prev, PurchaseId: e.target.value }))
              }
              placeholder="Auto-filled or Manual"
            />

            <label className="mt-3 block text-sm">* Purchase Price</label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-sm"
              value={newDP.PurchasePrice ?? ""}
              onChange={(e) =>
                setNewDP((prev) => ({ ...prev, PurchasePrice: e.target.value }))
              }
            />

            <label className="text-sm">* Quantity</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-sm"
              value={newDP.Quantity ?? ""}
              onChange={(e) =>
                setNewDP((prev) => ({ ...prev, Quantity: e.target.value }))
              }
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm">* Note</label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-24 text-sm"
              value={newDP.Note ?? ""}
              onChange={(e) =>
                setNewDP((prev) => ({ ...prev, Note: e.target.value }))
              }
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
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="font-semibold text-sm">* Select Product</label>
            <SearchableSelect
              options={products.map((p) => ({
                id: p.Id ?? p.id,
                name: `${p.ProductName ?? p.productName ?? p.name ?? ""} (${
                  p.Barcode ?? p.barcode ?? ""
                })`,
              }))}
              value={editDP.ProductId}
              onChange={(v) => handleSelectProduct(v, "edit")}
              placeholder="Search / select product"
              className="w-full mt-1"
              disabled={editDP.isInactive}
            />
          </div>

          <div>
            <label className="text-sm">* Code</label>
            <input
              disabled
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2 text-sm"
              value={editDP.Code ?? ""}
            />

            <label className="text-sm">* Name</label>
            <input
              disabled
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2 text-sm"
              value={editDP.Name ?? ""}
            />

            <label className="text-sm">* Date</label>
            <div className="relative">
              <input
                type="date"
                disabled={editDP.isInactive}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-sm text-white appearance-none pr-10"
                value={editDP.Date ?? ""}
                onChange={(e) =>
                  setEditDP((prev) => ({ ...prev, Date: e.target.value }))
                }
              />
              <Calendar
                size={18}
                className="text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-sm">* Category</label>
            <div className="mt-1">
              <SearchableSelect
                options={categories.map((c) => ({
                  id: c.Id ?? c.id,
                  name:
                    c.Name ??
                    c.name ??
                    c.CategoryName ??
                    c.categoryName ??
                    String(c.Id ?? c.id),
                }))}
                value={editDP.CategoryId}
                onChange={(v) =>
                  setEditDP((prev) => ({ ...prev, CategoryId: v }))
                }
                placeholder="Select category"
                className="w-full"
                disabled={editDP.isInactive}
              />
            </div>

            <label className="mt-3 block text-sm">* Purchase Price</label>
            <input
              type="number"
              step="0.01"
              disabled={editDP.isInactive}
              className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-sm ${
                editDP.isInactive ? "opacity-60 cursor-not-allowed" : ""
              }`}
              value={editDP.PurchasePrice ?? ""}
              onChange={(e) =>
                setEditDP((prev) => ({
                  ...prev,
                  PurchasePrice: e.target.value,
                }))
              }
            />

            <label className="text-sm">* Quantity</label>
            <input
              type="number"
              disabled={editDP.isInactive}
              className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-sm ${
                editDP.isInactive ? "opacity-60 cursor-not-allowed" : ""
              }`}
              value={editDP.Quantity ?? ""}
              onChange={(e) =>
                setEditDP((prev) => ({ ...prev, Quantity: e.target.value }))
              }
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm">Note</label>
            <textarea
              className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-24 text-sm ${
                editDP.isInactive ? "opacity-60 cursor-not-allowed" : ""
              }`}
              value={editDP.Note ?? ""}
              onChange={(e) =>
                setEditDP((prev) => ({ ...prev, Note: e.target.value }))
              }
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
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Damaged Products</h2>
            </div>

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
                data={sortedList}
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
      </div>
      </PageLayout>
    </>
  );
};
export default DamagedProducts;



