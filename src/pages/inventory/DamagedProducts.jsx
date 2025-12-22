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

/* ============================
   SearchableDropdown (safe)
   - closes on document 'click' (not mousedown)
   - defers query update on focus
   ============================ */
const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder,
  fullWidth,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const selectedName =
    options.find((o) => String(o.id) === String(value))?.name || "";

  useEffect(() => {
    if (!open) setQuery(selectedName);
  }, [selectedName, open]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const filtered = !query
    ? options
    : options.filter((c) =>
        (c.name || "").toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className={`relative ${fullWidth ? "w-full" : "w-56"}`} ref={ref}>
      <input
        value={open ? query : selectedName}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          if (!query) setTimeout(() => setQuery(selectedName), 0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm w-full"
      />

      {open && (
        <div className="absolute w-full bg-gray-800 border border-gray-700 rounded mt-1 max-h-56 overflow-auto z-40">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  onChange(o.id);
                  setQuery(o.name);
                  setOpen(false);
                }}
              >
                {o.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

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

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  const defaultColumns = {
    id: true,
    code: true,
    name: true,
    category: true,
    warehouse: true,
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
            .includes(q) ||
          String(r.WarehouseName ?? r.warehouseName ?? "")
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

  const clearFilters = () => {
    setSearchText("");
    setFilterCategory("");
    setDisplayed(computeDisplayed());
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
      Warehouse: r.WarehouseName ?? r.warehouseName ?? "",
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
      r.Warehouse,
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
          "Warehouse",
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
          <SearchableDropdown
            options={products.map((p) => ({
              id: p.Id ?? p.id,
              name: `${p.ProductName ?? p.productName ?? p.name ?? ""} (${
                p.Barcode ?? p.barcode ?? ""
              })`,
            }))}
            value={newDP.ProductId}
            onChange={(v) => handleSelectProduct(v, "add")}
            placeholder="Search / select product"
            fullWidth
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
            <SearchableDropdown
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
              fullWidth
            />
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

        <div>
          <label className="font-semibold">Warehouse</label>
          <div className="h-[50px]">
            <SearchableDropdown
              options={warehouses.map((w) => ({
                id: w.Id ?? w.id,
                name: w.Name ?? w.name ?? String(w.Id ?? w.id),
              }))}
              value={newDP.WarehouseId}
              onChange={(v) =>
                setNewDP((prev) => ({ ...prev, WarehouseId: v }))
              }
              placeholder="Select warehouse (optional)"
              fullWidth
            />
          </div>
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
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
        >
          <Save size={16} /> Save
        </button>
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
          <SearchableDropdown
            options={products.map((p) => ({
              id: p.Id ?? p.id,
              name: `${p.ProductName ?? p.productName ?? p.name ?? ""} (${
                p.Barcode ?? p.barcode ?? ""
              })`,
            }))}
            value={editDP.ProductId}
            onChange={(v) => handleSelectProduct(v, "edit")}
            placeholder="Search / select product"
            fullWidth
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
          <SearchableDropdown
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
            fullWidth
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

        <div>
          <label className="font-semibold">Warehouse</label>
          <div className="h-[50px]">
            <SearchableDropdown
              options={warehouses.map((w) => ({
                id: w.Id ?? w.id,
                name: w.Name ?? w.name ?? String(w.Id ?? w.id),
              }))}
              value={editDP.WarehouseId}
              onChange={(v) =>
                setEditDP((prev) => ({ ...prev, WarehouseId: v }))
              }
              placeholder="Select warehouse (optional)"
              fullWidth
            />
          </div>
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

      <div className="px-5 py-3 border-t border-gray-700 sticky bottom-5 bg-gray-900 flex justify-between">
        {editDP.isInactive ? (
          <button
            onClick={handleRestore}
            className="px-4 py-2 bg-green-700 border border-green-900 rounded flex items-center gap-2"
          >
            <ArchiveRestore size={16} /> Restore
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-700 border border-red-900 rounded flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}

        {!editDP.isInactive && (
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
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
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

            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <Plus size={16} /> New
            </button>

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
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
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

          {/* FILTERS */}
          <div className="flex items-center gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
            <SearchableDropdown
              options={categories.map((c) => ({
                id: c.Id ?? c.id,
                name:
                  c.Name ?? c.name ?? c.CategoryName ?? String(c.Id ?? c.id),
              }))}
              value={filterCategory}
              onChange={setFilterCategory}
              placeholder="Filter by Category"
            />
            <button
              onClick={() => setDisplayed(computeDisplayed())}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              Clear
            </button>
          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <table className="min-w-[990px] text-left border-separate border-spacing-y-1 text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr>
                  {visibleColumns.id && (
                    <th className="border-b border-white pb-1 text-center">
                      ID
                    </th>
                  )}
                  {visibleColumns.code && (
                    <th className="border-b border-white pb-1 text-center">
                      Code
                    </th>
                  )}
                  {visibleColumns.name && (
                    <th className="border-b border-white pb-1 text-center">
                      Name
                    </th>
                  )}
                  {visibleColumns.category && (
                    <th className="border-b border-white pb-1 text-center">
                      Category
                    </th>
                  )}
                  {visibleColumns.warehouse && (
                    <th className="border-b border-white pb-1 text-center">
                      Warehouse
                    </th>
                  )}
                  {visibleColumns.purchasePrice && (
                    <th className="border-b border-white pb-1 text-center">
                      Purchase Price
                    </th>
                  )}
                  {visibleColumns.quantity && (
                    <th className="border-b border-white pb-1 text-center">
                      Qty
                    </th>
                  )}
                  {visibleColumns.date && (
                    <th className="border-b border-white pb-1 text-center">
                      Date
                    </th>
                  )}
                  {visibleColumns.note && (
                    <th className="border-b border-white pb-1 text-center">
                      Note
                    </th>
                  )}
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
                {!loading && displayed.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-6 text-gray-400">
                      No Records
                    </td>
                  </tr>
                )}

                {!loading &&
                  displayed.map((r) => (
                    <tr
                      key={r.Id ?? r.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => openEditModalFn(r, false)}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-2 text-center">
                          {r.Id ?? r.id}
                        </td>
                      )}
                      {visibleColumns.code && (
                        <td className="px-2 py-2 text-center">
                          {r.Code ?? r.code}
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="px-2 py-2 text-center">
                          {r.Name ?? r.name}
                        </td>
                      )}
                      {visibleColumns.category && (
                        <td className="px-2 py-2 text-center">
                          {(r.CategoryName ?? r.categoryName) || "-"}
                        </td>
                      )}
                      {visibleColumns.warehouse && (
                        <td className="px-2 py-2 text-center">
                          {(r.WarehouseName ?? r.warehouseName) || "-"}
                        </td>
                      )}
                      {visibleColumns.purchasePrice && (
                        <td className="px-2 py-2 text-center">
                          {r.PurchasePrice ?? r.purchasePrice}
                        </td>
                      )}
                      {visibleColumns.quantity && (
                        <td className="px-2 py-2 text-center">
                          {r.Quantity ?? r.quantity}
                        </td>
                      )}
                      {visibleColumns.date && (
                        <td className="px-2 py-2 text-center">
                          {String((r.Date ?? r.date) || "").split("T")[0]}
                        </td>
                      )}
                      {visibleColumns.note && (
                        <td className="px-2 py-2 text-center">
                          {(r.Note ?? r.note) || "-"}
                        </td>
                      )}
                    </tr>
                  ))}

                {showInactive &&
                  inactive.map((r) => (
                    <tr
                      key={`inactive-${r.Id ?? r.id}`}
                      className="bg-gray-900 opacity-40 line-through hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => openEditModalFn(r, true)}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-2 text-center">
                          {r.Id ?? r.id}
                        </td>
                      )}
                      {visibleColumns.code && (
                        <td className="px-2 py-2 text-center">
                          {r.Code ?? r.code}
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="px-2 py-2 text-center">
                          {r.Name ?? r.name}
                        </td>
                      )}
                      {visibleColumns.category && (
                        <td className="px-2 py-2 text-center">
                          {r.CategoryName ?? r.categoryName}
                        </td>
                      )}
                      {visibleColumns.warehouse && (
                        <td className="px-2 py-2 text-center">
                          {r.WarehouseName ?? r.warehouseName}
                        </td>
                      )}
                      {visibleColumns.purchasePrice && (
                        <td className="px-2 py-2 text-center">
                          {r.PurchasePrice ?? r.purchasePrice}
                        </td>
                      )}
                      {visibleColumns.quantity && (
                        <td className="px-2 py-2 text-center">
                          {r.Quantity ?? r.quantity}
                        </td>
                      )}
                      {visibleColumns.date && (
                        <td className="px-2 py-2 text-center">
                          {String((r.Date ?? r.date) || "").split("T")[0]}
                        </td>
                      )}
                      {visibleColumns.note && (
                        <td className="px-2 py-2 text-center">
                          {(r.Note ?? r.note) || "-"}
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
            <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
         
         <div className="flex flex-wrap items-center gap-3 text-sm">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>
              <input
                type="number"
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
                value={page}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= totalPages) setPage(v);
                }}
              />
              <span>/ {totalPages}</span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsRight size={16} />
              </button>

              <button
                onClick={() => loadDamaged(1, limit)}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <RefreshCw size={16} />
              </button>

              <span>
                Showing <b>{start}</b> to <b>{end}</b> of <b>{total}</b>
              </span>
            </div>
          </div>
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default DamagedProducts;



