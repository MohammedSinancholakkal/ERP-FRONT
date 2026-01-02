// src/pages/masters/DamagedProducts.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
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
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";




/* ============================
   Simple Portal Modal wrapper
   - backdrop closes on click
   - inner stops propagation
   - prevents body scroll while open
   ============================ */
const PortalModal = ({ open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-50 pt-12"
      onClick={onClose}
    >
      <div
        className="w-[760px] max-h-[90vh] overflow-auto bg-gray-900 text-white rounded-lg border border-gray-700 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
const DamagedProducts = () => {
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
    note: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModal, setColumnModal] = useState(false);
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
  const handleSelectProduct = (productId, mode) => {
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
        if (['PurchasePrice', 'Quantity', 'Id'].includes(sortConfig.key)) {
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
                        ADD MODAL (using PortalModal)
     ========================================================= */
  const AddModalContent = (
    <>
      <div className="flex justify-between px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-50">
        <h2 className="text-lg">New Damaged Product</h2>
        <button onClick={() => setModalOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="font-semibold">* Select Product</label>
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
            className="w-full"
          />
        </div>

        <div>
          <label>* Code</label>
          <input
            disabled
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2"
            value={newDP.Code ?? ""}
            autoFocus
          />

          <label>* Name</label>
          <input
            disabled
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2"
            value={newDP.Name ?? ""}
          />

          <label>* Date</label>
          <div className="relative">
  <input
    type="date"
    className="
      w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2
      text-white appearance-none pr-10
    "
    value={newDP.Date ?? ""}
    onChange={(e) => setNewDP((prev) => ({ ...prev, Date: e.target.value }))}
  />

  <Calendar
    size={18}
    className="text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
  />
</div>


        </div>

        <div>
          <label className="font-semibold">* Category</label>
          <div className="h-[50px]">
          <div className="h-[50px]">
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
              onChange={(v) => setNewDP((prev) => ({ ...prev, CategoryId: v }))}
              placeholder="Select category"
              className="w-full"
            />
          </div>
          </div>

          <label className="mt-3">* Purchase Price</label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2"
            value={newDP.PurchasePrice ?? ""}
            onChange={(e) =>
              setNewDP((prev) => ({ ...prev, PurchasePrice: e.target.value }))
            }
          />

          <label>* Quantity</label>
          <input
            type="number"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2"
            value={newDP.Quantity ?? ""}
            onChange={(e) =>
              setNewDP((prev) => ({ ...prev, Quantity: e.target.value }))
            }
          />
        </div>



        <div className="col-span-2">
          <label>Note</label>
          <textarea
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-24"
            value={newDP.Note ?? ""}
            onChange={(e) =>
              setNewDP((prev) => ({ ...prev, Note: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-gray-700 sticky bottom-5 bg-gray-900 flex justify-end gap-2">
        <button
          onClick={() => setModalOpen(false)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
        >
          Cancel
        </button>
        {hasPermission(PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.CREATE) && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
        >
          <Save size={16} /> Save
        </button>
        )}
      </div>
    </>
  );

  /* =========================================================
                        EDIT MODAL (using PortalModal)
     ========================================================= */
  const EditModalContent = (
    <>
      <div className="flex justify-between px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-50">
        <h2 className="text-lg">
          {editDP.isInactive
            ? "Restore Damaged Product"
            : "Edit Damaged Product"}
        </h2>
        <button onClick={() => setEditModalOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="font-semibold">* Select Product</label>
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
            className="w-full"
          />
        </div>

        <div>
          <label>* Code</label>
          <input
            disabled
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2"
            value={editDP.Code ?? ""}
          />

          <label>* Name</label>
          <input
            disabled
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2"
            value={editDP.Name ?? ""}
          />

          <label>* Date</label>
          <div className="relative">
  <input
    type="date"
    disabled={editDP.isInactive}
    className="
      w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2
      text-white appearance-none pr-10
    "
    value={editDP.Date ?? ""}
    onChange={(e) => setEditDP((prev) => ({ ...prev, Date: e.target.value }))}
  />

  <Calendar
    size={18}
    className="text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
  />
</div>

        </div>

        <div className="h-[100px]">
          <label className="font-semibold">* Category</label>
          <label className="font-semibold">* Category</label>
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
            onChange={(v) => setEditDP((prev) => ({ ...prev, CategoryId: v }))}
            placeholder="Select category"
            className="w-full"
          />

          <label className="mt-3">* Purchase Price</label>
          <input
            type="number"
            disabled={editDP.isInactive}
            step="0.01"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2"
            value={editDP.PurchasePrice ?? ""}
            onChange={(e) =>
              setEditDP((prev) => ({ ...prev, PurchasePrice: e.target.value }))
            }
          />

          <label>* Quantity</label>
          <input
            type="number"
            disabled={editDP.isInactive}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2"
            value={editDP.Quantity ?? ""}
            onChange={(e) =>
              setEditDP((prev) => ({ ...prev, Quantity: e.target.value }))
            }
          />
        </div>



        <div className="col-span-2">
          <label>Note</label>
          <textarea
            disabled={editDP.isInactive}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-24"
            value={editDP.Note ?? ""}
            onChange={(e) =>
              setEditDP((prev) => ({ ...prev, Note: e.target.value }))
            }
          />
        </div>
      </div>
      {/* FOOTER */}
      <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
        {editDP.isInactive ? (
          hasPermission(PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.DELETE) && (
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
          >
            <ArchiveRestore size={16} /> Restore
          </button>
          )
        ) : (
          hasPermission(PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.DELETE) && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
          >
            <Trash2 size={16} /> Delete
          </button>
          )
        )}

        {!editDP.isInactive && hasPermission(PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.EDIT) && (
          <button
            onClick={handleUpdate}
            className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
          >
            <Save size={16} /> Save
          </button>
        )}
      </div>
    </>
  );

  /* =========================================================
                          MAIN PAGE RENDER
     ========================================================= */
  return (
    <>
      <PortalModal open={modalOpen} onClose={() => setModalOpen(false)}>
        {AddModalContent}
      </PortalModal>

      <PortalModal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        {EditModalContent}
      </PortalModal>

      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">
            {/* column picker content (kept as in previous file) */}
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="search columns..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-4 max-h-64 overflow-auto">
                <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                  <h3 className="font-semibold mb-3">Visible Columns</h3>
                  {Object.keys(visibleColumns)
                    .filter(
                      (c) => visibleColumns[c] && c.includes(searchColumn)
                    )
                    .map((col) => (
                      <div
                        key={col}
                        className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                      >
                        <span>{col.toUpperCase()}</span>
                        <button
                          className="text-red-400"
                          onClick={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [col]: false,
                            }))
                          }
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                </div>
                <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                  <h3 className="font-semibold mb-3">Hidden Columns</h3>
                  {Object.keys(visibleColumns)
                    .filter(
                      (c) => !visibleColumns[c] && c.includes(searchColumn)
                    )
                    .map((col) => (
                      <div
                        key={col}
                        className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
                      >
                        <span>{col.toUpperCase()}</span>
                        <button
                          className="text-green-400"
                          onClick={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [col]: true,
                            }))
                          }
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setVisibleColumns(defaultColumns)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>
              <button
                onClick={() => setColumnModal(false)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Damaged Products</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-52">
              <Search size={16} className="text-gray-300" />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-transparent outline-none pl-2 text-gray-200 w-full text-sm"
              />
            </div>
            {/* ADD */}
            {hasPermission(PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.CREATE) && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"
            >
              <Plus size={16} /> New Entry
            </button>
            )}

            {/* REFRESH */}
            <button
               onClick={() => {
                setSearchText("");
                loadDamaged(1, limit);
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <List size={16} className="text-blue-300" />
            </button>

            <button
              onClick={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
              }}
              className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-2 hover:bg-gray-600"
            >
              <ArchiveRestore size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-300">
               Inactive
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="p-1.5 bg-green-700/10 border border-green-700 rounded hover:bg-green-700/20 flex items-center gap-2"
              >
                <FileSpreadsheet size={16} className="text-green-300" />
                <span className="hidden sm:inline text-sm">Excel</span>
              </button>
              <button
                onClick={exportToPDF}
                className="p-1.5 bg-red-700/10 border border-red-700 rounded hover:bg-red-700/20 flex items-center gap-2"
              >
                <FileText size={16} className="text-red-300" />
                <span className="hidden sm:inline text-sm">PDF</span>
              </button>
            </div>
          </div>

            {/* FILTER BAR - Replaced custom manual filters with FilterBar */}
            <div className="mb-4">
               <FilterBar filters={filters} onClear={handleClearFilters} />
            </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <table className="min-w-[1300px] text-left border-separate border-spacing-y-1 text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr>
                  {visibleColumns.id && <SortableHeader label="ID" sortKey="Id" currentSort={sortConfig} onSort={handleSort} />}
                  {visibleColumns.code && <SortableHeader label="Code" sortKey="Code" currentSort={sortConfig} onSort={handleSort} />}
                  {visibleColumns.name && <SortableHeader label="Name" sortKey="Name" currentSort={sortConfig} onSort={handleSort} />}
                  {visibleColumns.category && <SortableHeader label="Category" sortKey="CategoryName" currentSort={sortConfig} onSort={handleSort} />}
                  {visibleColumns.purchasePrice && <SortableHeader label="Purchase Price" sortKey="PurchasePrice" currentSort={sortConfig} onSort={handleSort} />}
                  {visibleColumns.quantity && <SortableHeader label="Qty" sortKey="Quantity" currentSort={sortConfig} onSort={handleSort} />}
                  {visibleColumns.date && <SortableHeader label="Date" sortKey="Date" currentSort={sortConfig} onSort={handleSort} />}
                  {visibleColumns.note && <th className="border-b border-white pb-1 text-center">Note</th>}
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="9" className="text-center py-6 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading &&
                  sortedList.map((r) => (
                    <tr
                      key={r.Id ?? r.id}
                      className={`bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm ${r.isInactive ? 'opacity-40 line-through' : ''}`}
                      onClick={() => openEditModalFn(r, r.isInactive)}
                    >
                      {visibleColumns.id && (<td className="px-2 py-2 text-center">{r.Id ?? r.id}</td>)}
                      {visibleColumns.code && (<td className="px-2 py-2 text-center">{r.Code ?? r.code}</td>)}
                      {visibleColumns.name && (<td className="px-2 py-2 text-center">{r.Name ?? r.name}</td>)}
                      {visibleColumns.category && (<td className="px-2 py-2 text-center">{(r.CategoryName ?? r.categoryName) || "-"}</td>)}
                      {visibleColumns.purchasePrice && (<td className="px-2 py-2 text-center">{r.PurchasePrice ?? r.purchasePrice}</td>)}
                      {visibleColumns.quantity && (<td className="px-2 py-2 text-center">{r.Quantity ?? r.quantity}</td>)}
                      {visibleColumns.date && (<td className="px-2 py-2 text-center">{String((r.Date ?? r.date) || "").split("T")[0]}</td>)}
                      {visibleColumns.note && (<td className="px-2 py-2 text-center">{(r.Note ?? r.note) || "-"}</td>)}
                    </tr>
                  ))}
                  
                   {!loading && sortedList.length === 0 && !showInactive && (
                     <tr>
                        <td colSpan={9} className="text-center py-6 text-gray-400">No records found</td>
                     </tr>
                   )}

                   {/* INACTIVE ROWS APPENDED */}
                   {showInactive && inactive.map((r) => (
                     <tr
                       key={`inactive-${r.Id ?? r.id}`}
                       className="bg-gray-900 cursor-pointer opacity-50 line-through hover:bg-gray-800"
                       onClick={() => openEditModalFn(r, true)}
                     >
                       {visibleColumns.id && (<td className="px-2 py-2 text-center">{r.Id ?? r.id}</td>)}
                       {visibleColumns.code && (<td className="px-2 py-2 text-center">{r.Code ?? r.code}</td>)}
                       {visibleColumns.name && (<td className="px-2 py-2 text-center">{r.Name ?? r.name}</td>)}
                       {visibleColumns.category && (<td className="px-2 py-2 text-center">{(r.CategoryName ?? r.categoryName) || "-"}</td>)}
                       {visibleColumns.purchasePrice && (<td className="px-2 py-2 text-center">{r.PurchasePrice ?? r.purchasePrice}</td>)}
                       {visibleColumns.quantity && (<td className="px-2 py-2 text-center">{r.Quantity ?? r.quantity}</td>)}
                       {visibleColumns.date && (<td className="px-2 py-2 text-center">{String((r.Date ?? r.date) || "").split("T")[0]}</td>)}
                       {visibleColumns.note && (<td className="px-2 py-2 text-center">{(r.Note ?? r.note) || "-"}</td>)}
                     </tr>
                   ))}
                </tbody>
            </table>
          </div>

          <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={total}
                onRefresh={() => loadDamaged(1, limit)}
              />
            
        </div>
      </div>
      </PageLayout>
    </>
  );
};
export default DamagedProducts;



