import React, { useEffect, useState, useRef } from "react";
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
  Star,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";   

import {
  addProductApi,
  getProductsApi,
  updateProductApi,
  deleteProductApi,
  searchProductApi,
  getInactiveProductsApi,
  restoreProductApi,
  getCategoriesApi,
  getUnitsApi,
  getBrandsApi,
  addBrandApi,
  addUnitApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";

/* ------------------------------
   Small components
   ------------------------------ */

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

/* Searchable dropdown: accepts fullWidth to match other inputs */
const SearchableDropdown = ({ options = [], value, onChange, placeholder = "Search...", fullWidth = false }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const filtered =
    !query.trim()
      ? options
      : options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  const selectedName = options.find((o) => String(o.id) === String(value))?.name || "";

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`} ref={ref}>
      <input
        type="text"
        value={open ? query : (selectedName || query)}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className={`bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm ${fullWidth ? "w-full" : "w-56"}`}
      />
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-gray-800 border border-gray-700 rounded max-h-56 overflow-auto">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  setQuery("");
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

/* ------------------------------
   Main Products component
   ------------------------------ */

const Products = () => {
  // UI state
  const [modalOpen, setModalOpen] = useState(false); // add modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false); // quick-add brand (rendered inside add/edit modal)
  const [unitModalOpen, setUnitModalOpen] = useState(false); // quick-add unit
  const [columnModal, setColumnModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // data
  const [products, setProducts] = useState([]);
  const [inactiveProducts, setInactiveProducts] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [brands, setBrands] = useState([]);

  // quick-add brand/unit names
  const [newBrandName, setNewBrandName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // user
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // sort/search/filters
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  // columns
  const defaultColumns = {
    id: true,
    barcode: true,
    sn: true,
    productName: true,
    model: true,
    unitPrice: true,
    unitsInStock: true,
    reorderLevel: true,
    categoryName: true,
    unitName: true,
    brandName: true
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // form states
  const [newProduct, setNewProduct] = useState({
    productCode: "",
    ProductName: "",
    SN: "",
    Model: "",
    UnitPrice: "0.00",
    ReorderLevel: "10.00",
    CategoryId: "",
    UnitId: "",
    BrandId: "",
    Image: "",
    ProductDetails: ""
  });

  const [editProduct, setEditProduct] = useState({
    id: null,
    productCode: "",
    ProductName: "",
    SN: "",
    Model: "",
    UnitPrice: "0.00",
    ReorderLevel: "10.00",
    CategoryId: "",
    UnitId: "",
    BrandId: "",
    Image: "",
    ProductDetails: "",
    isInactive: false
  });

  const fileInputRef = useRef(null);

  /* --------------------
     Loaders
     -------------------- */
  const loadProducts = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const res = await getProductsApi(p, l);
      if (res.status === 200) {
        setProducts(res.data.records || []);
        setTotalRecords(res.data.total || 0);
      } else {
        setProducts([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("LOAD PRODUCTS ERR", err);
      setProducts([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const loadInactive = async () => {
    try {
      const res = await getInactiveProductsApi();
      if (res.status === 200) setInactiveProducts(res.data.records || res.data || []);
    } catch (err) {
      console.error("LOAD INACTIVE ERR", err);
      setInactiveProducts([]);
    }
  };

  const loadDropdowns = async () => {
    try {
      const c = await getCategoriesApi(1, 1000);
      if (c.status === 200) setCategories(c.data.records || c.data || []);
    } catch (err) {
      console.error("LOAD CATEGORIES ERR", err);
      setCategories([]);
    }
    try {
      const u = await getUnitsApi();
      if (u.status === 200) setUnits(u.data.records || u.data || []);
    } catch (err) {
      console.error("LOAD UNITS ERR", err);
      setUnits([]);
    }
    try {
      const b = await getBrandsApi();
      if (b.status === 200) setBrands(b.data.records || b.data || []);
    } catch (err) {
      console.error("LOAD BRANDS ERR", err);
      setBrands([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  /* --------------------
     SN generation: P000001
     -------------------- */
  const generateNextSNLocal = () => {
    const all = [...products, ...inactiveProducts];
    let max = 0;
    all.forEach((p) => {
      if (p && p.SN) {
        // accept SN like P000001 or other numeric-contained SNs
        const m = p.SN.match(/^P0*(\d+)$/); // matches P000001
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > max) max = n;
        } else {
          const digits = p.SN.replace(/\D/g, "");
          if (digits) {
            const n2 = parseInt(digits, 10);
            if (!isNaN(n2) && n2 > max) max = n2;
          }
        }
      }
    });
    const next = max + 1;
    return `P${String(next).padStart(6, "0")}`;
  };

  /* --------------------
     Open Add Modal (instant); dropdowns load in background
     -------------------- */
  const openAddModal = () => {
    const sn = generateNextSNLocal();
    setNewProduct({
      productCode: "",
      ProductName: "",
      SN: sn,
      Model: "",
      UnitPrice: "0.00",
      ReorderLevel: "10.00",
      CategoryId: "",
      UnitId: "",
      BrandId: "",
      Image: "",
      ProductDetails: ""
    });
    setModalOpen(true);
    // load dropdowns in background
    loadDropdowns();
  };

  /* --------------------
     Image handling (base64)
     -------------------- */
  const handleImageChange = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setter((p) => ({ ...p, Image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  /* --------------------
     Add product
     -------------------- */
  const handleAddProduct = async () => {
    if (!newProduct.ProductName?.trim()) return toast.error("Product Name required");
    if (newProduct.UnitPrice === "" || isNaN(Number(newProduct.UnitPrice))) return toast.error("Unit Price required");
    if (newProduct.ReorderLevel === "" || isNaN(Number(newProduct.ReorderLevel))) return toast.error("Reorder Level required");
    if (!newProduct.CategoryId) return toast.error("Category required");
    if (!newProduct.UnitId) return toast.error("Unit required");
    if (!newProduct.BrandId) return toast.error("Brand required");

    const payload = {
      Barcode: newProduct.productCode || null,
      SN: newProduct.SN,
      ProductName: newProduct.ProductName,
      Model: newProduct.Model,
      UnitPrice: parseFloat(newProduct.UnitPrice),
      UnitsInStock: newProduct.UnitsInStock || 0,
      UnitsOnOrder: newProduct.UnitsOnOrder || 0,
      ReorderLevel: parseFloat(newProduct.ReorderLevel),
      CategoryId: newProduct.CategoryId || null,
      UnitId: newProduct.UnitId || null,
      BrandId: newProduct.BrandId || null,
      Image: newProduct.Image,
      ProductDetails: newProduct.ProductDetails,
      userId: currentUserId
    };

    try {
      const res = await addProductApi(payload);
      if (res.status === 200) {
        toast.success("Product added");
        setModalOpen(false);
        loadProducts(1, limit);
        loadDropdowns();
      } else {
        toast.error(res.message || "Add failed");
      }
    } catch (err) {
      console.error("ADD ERR", err);
      toast.error("Server error");
    }
  };

  /* --------------------
     Open Edit modal
     -------------------- */
  const openEditModal = (p, inactive = false) => {
    setEditProduct({
      id: p.id,
      productCode: p.Barcode || "",
      ProductName: p.ProductName || "",
      SN: p.SN || "",
      Model: p.Model || "",
      UnitPrice: p.UnitPrice != null ? String(p.UnitPrice) : "0.00",
      ReorderLevel: p.ReorderLevel != null ? String(p.ReorderLevel) : "10.00",
      CategoryId: p.CategoryId || "",
      UnitId: p.UnitId || "",
      BrandId: p.BrandId || "",
      Image: p.Image || "",
      ProductDetails: p.ProductDetails || "",
      isInactive: inactive
    });
    loadDropdowns();
    setEditModalOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editProduct.ProductName?.trim()) return toast.error("Product Name required");
    if (editProduct.UnitPrice === "" || isNaN(Number(editProduct.UnitPrice))) return toast.error("Unit Price required");
    if (editProduct.ReorderLevel === "" || isNaN(Number(editProduct.ReorderLevel))) return toast.error("Reorder Level required");

    const payload = {
      Barcode: editProduct.productCode || null,
      SN: editProduct.SN,
      ProductName: editProduct.ProductName,
      Model: editProduct.Model,
      UnitPrice: parseFloat(editProduct.UnitPrice),
      UnitsInStock: editProduct.UnitsInStock || 0,
      UnitsOnOrder: editProduct.UnitsOnOrder || 0,
      ReorderLevel: parseFloat(editProduct.ReorderLevel),
      CategoryId: editProduct.CategoryId || null,
      UnitId: editProduct.UnitId || null,
      BrandId: editProduct.BrandId || null,
      Image: editProduct.Image,
      ProductDetails: editProduct.ProductDetails,
      userId: currentUserId
    };

    try {
      const res = await updateProductApi(editProduct.id, payload);
      if (res.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadProducts();
        if (showInactive) loadInactive();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error("UPDATE ERR", err);
      toast.error("Server error");
    }
  };

  const handleDeleteProduct = async () => {
    try {
      const res = await deleteProductApi(editProduct.id, { userId: currentUserId });
      if (res.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadProducts();
        if (showInactive) loadInactive();
      }
    } catch (err) {
      console.error("DELETE ERR", err);
      toast.error("Server error");
    }
  };

  const handleRestoreProduct = async () => {
    try {
      const res = await restoreProductApi(editProduct.id, { userId: currentUserId });
      if (res.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        loadProducts();
        loadInactive();
      }
    } catch (err) {
      console.error("RESTORE ERR", err);
      toast.error("Server error");
    }
  };

  /* --------------------
     Quick-add Brand / Unit
     Rendered inside Add/Edit modal so they appear over that modal.
     -------------------- */
  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return toast.error("Brand name required");
    try {
      const res = await addBrandApi({ name: newBrandName, userId: currentUserId });
      if (res.status === 200) {
        toast.success("Brand added");
        setNewBrandName("");
        setBrandModalOpen(false);
        const b = await getBrandsApi();
        if (b.status === 200) setBrands(b.data.records || b.data || []);
      }
    } catch (err) {
      console.error("ADD BRAND ERR", err);
      toast.error("Server error");
    }
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return toast.error("Unit name required");
    try {
      const res = await addUnitApi({ name: newUnitName, userId: currentUserId });
      if (res.status === 200) {
        toast.success("Unit added");
        setNewUnitName("");
        setUnitModalOpen(false);
        const u = await getUnitsApi();
        if (u.status === 200) setUnits(u.data.records || u.data || []);
      }
    } catch (err) {
      console.error("ADD UNIT ERR", err);
      toast.error("Server error");
    }
  };

  /* --------------------
     Exports
     -------------------- */
  const promptFileName = (defaultName) => {
    const name = window.prompt("Enter filename (without extension)", defaultName);
    if (!name) return null;
    return name;
  };

  const getExportRows = () => {
    const activeRows = products
      .filter((p) => {
        // apply quick client-side filters for export as user sees table
        if (filterCategory && String(p.CategoryId) !== String(filterCategory)) return false;
        if (filterUnit && String(p.UnitId) !== String(filterUnit)) return false;
        if (filterBrand && String(p.BrandId) !== String(filterBrand)) return false;
        if (searchText?.trim()) {
          const q = searchText.toLowerCase();
          if (
            !String(p.ProductName || "").toLowerCase().includes(q) &&
            !String(p.Barcode || "").toLowerCase().includes(q) &&
            !String(p.SN || "").toLowerCase().includes(q) &&
            !String(p.Model || "").toLowerCase().includes(q) &&
            !String(p.categoryName || "").toLowerCase().includes(q) &&
            !String(p.brandName || "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      });

    const rows = activeRows.map((r) => ({
      Id: r.id,
      Barcode: r.Barcode,
      SN: r.SN,
      ProductName: r.ProductName,
      Model: r.Model,
      UnitPrice: r.UnitPrice,
      UnitsInStock: r.UnitsInStock,
      ReorderLevel: r.ReorderLevel,
      Category: r.categoryName || "-",
      Unit: r.unitName || "-",
      Brand: r.brandName || "-"
    }));

    if (showInactive) {
      const inactiveFiltered = inactiveProducts.map((r) => ({
        Id: r.id,
        Barcode: r.Barcode,
        SN: r.SN,
        ProductName: r.ProductName,
        Model: r.Model,
        UnitPrice: r.UnitPrice,
        UnitsInStock: r.UnitsInStock,
        ReorderLevel: r.ReorderLevel,
        Category: r.categoryName || "-",
        Unit: r.unitName || "-",
        Brand: r.brandName || "-"
      }));
      return rows.concat(inactiveFiltered);
    }

    return rows;
  };

  const exportToExcel = () => {
    const filename = promptFileName("products_export");
    if (!filename) return;

    const rows = getExportRows();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${filename}.xlsx`);
  };

  const exportToPDF = () => {
    const filename = promptFileName("products_export");
    if (!filename) return;
  
    const rows = getExportRows().map(r => [
      r.Id,
      r.Barcode,
      r.SN,
      r.ProductName,
      r.Model,
      r.UnitPrice,
      r.UnitsInStock,
      r.ReorderLevel,
      r.Category,
      r.Unit,
      r.Brand
    ]);
  
    const doc = new jsPDF({ orientation: "landscape" });
  
    doc.text("Products Export", 14, 16);
  
    doc.autoTable({
      head: [[
        "Id", "Barcode", "SN", "Product Name", "Model", "Unit Price",
        "In Stock", "Reorder Level", "Category", "Unit", "Brand"
      ]],
      body: rows,
      startY: 22,
      theme: "grid",
      styles: { fontSize: 8 }
    });
  
    doc.save(`${filename}.pdf`);
  };

  /* --------------------
     Search & filter helpers
     -------------------- */
  const computeDisplayed = () => {
    let list = [...products];

    if (searchText?.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.ProductName || "").toLowerCase().includes(q) ||
          String(p.Barcode || "").toLowerCase().includes(q) ||
          String(p.SN || "").toLowerCase().includes(q) ||
          String(p.Model || "").toLowerCase().includes(q) ||
          String(p.categoryName || "").toLowerCase().includes(q) ||
          String(p.brandName || "").toLowerCase().includes(q)
      );
    }

    if (filterCategory) list = list.filter((p) => String(p.CategoryId) === String(filterCategory));
    if (filterUnit) list = list.filter((p) => String(p.UnitId) === String(filterUnit));
    if (filterBrand) list = list.filter((p) => String(p.BrandId) === String(filterBrand));

    if (filterBrand) list = list.filter((p) => String(p.BrandId) === String(filterBrand));

    // Sorting
    if (sortConfig.key) {
      list.sort((a, b) => {
        const valA = String(a[sortConfig.key] || "").toLowerCase();
        const valB = String(b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  };

  const [displayedProducts, setDisplayedProducts] = useState([]);

  useEffect(() => {
    setDisplayedProducts(computeDisplayed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchText, filterCategory, filterUnit, filterBrand, sortConfig, products.length]);

  const applyFilters = () => {
    setDisplayedProducts(computeDisplayed());
  };

  const clearFilters = () => {
    setFilterCategory("");
    setFilterUnit("");
    setFilterBrand("");
    setDisplayedProducts(computeDisplayed());
  };

  const refreshAll = () => {
    setSearchText("");
    setFilterCategory("");
    setFilterUnit("");
    setFilterBrand("");
    setPage(1);
    loadProducts(1, limit);
  };

  /* --------------------
     Render
     -------------------- */
  return (
    <>
    
      {/* =========================
          ADD PRODUCT MODAL
         ========================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-50 pt-12">
          <div className="w-[820px] max-h-[86vh] overflow-auto bg-gray-900 text-white rounded-lg border border-gray-700 relative">
            {/* header */}
            <div className="flex justify-between px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2 className="text-lg">New Product</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            {/* body */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label>Product Code</label>
                <input
                  type="text"
                  value={newProduct.productCode}
                  onChange={(e) => setNewProduct((p) => ({ ...p, productCode: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2"
                />

                <label className="font-semibold">* Product Name</label>
                <input
                  type="text"
                  value={newProduct.ProductName}
                  onChange={(e) => setNewProduct((p) => ({ ...p, ProductName: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2"
                />

                <label>SN</label>
                <input type="text" value={newProduct.SN} disabled className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label>Model</label>
                <input type="text" value={newProduct.Model} onChange={(e) => setNewProduct((p) => ({ ...p, Model: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label className="font-semibold">* Unit Price</label>
                <input type="number" step="0.01" value={newProduct.UnitPrice} onChange={(e) => setNewProduct((p) => ({ ...p, UnitPrice: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label className="font-semibold">* Reorder Level</label>
                <input type="number" step="0.01" value={newProduct.ReorderLevel} onChange={(e) => setNewProduct((p) => ({ ...p, ReorderLevel: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />
              </div>

              <div>
                <label className="font-semibold">* Category</label>
                <SearchableDropdown
                  options={categories}
                  value={newProduct.CategoryId}
                  onChange={(v) => setNewProduct((p) => ({ ...p, CategoryId: v }))}
                  placeholder="Search / select category"
                  fullWidth
                />

                <div className="flex gap-2 items-start mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Unit</label>
                    <SearchableDropdown
                      options={units}
                      value={newProduct.UnitId}
                      onChange={(v) => setNewProduct((p) => ({ ...p, UnitId: v }))}
                      placeholder="Search / select unit"
                      fullWidth
                    />
                  </div>
                  <button
                    title="Add Unit"
                    onClick={() => setUnitModalOpen(true)}
                    className="mt-6 p-2 bg-gray-800 border border-gray-700 rounded"
                  >
                    <Star size={16} />
                  </button>
                </div>

                <div className="flex gap-2 items-start mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Company / Brand</label>
                    <SearchableDropdown
                      options={brands}
                      value={newProduct.BrandId}
                      onChange={(v) => setNewProduct((p) => ({ ...p, BrandId: v }))}
                      placeholder="Search / select brand"
                      fullWidth
                    />
                  </div>
                  <button
                    title="Add Brand"
                    onClick={() => setBrandModalOpen(true)}
                    className="mt-6 p-2 bg-gray-800 border border-gray-700 rounded"
                  >
                    <Star size={16} />
                  </button>
                </div>

              <label className="mt-3">Image</label>

              {/* HIDDEN INPUT */}
              <label className="mt-3">Image</label>

{/* HIDDEN INPUT */}
<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  onChange={(e) => handleImageChange(e, setNewProduct)}
  className="hidden"
/>

{/* SELECT BUTTON */}
<button
  type="button"
  onClick={() => fileInputRef.current.click()}
  className="w-full bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded hover:bg-gray-700 mb-2"
>
  Select Image
</button>

{/* PREVIEW + REMOVE BUTTON */}
{newProduct.Image && (
  <div className="mt-2">
    <img
      src={newProduct.Image}
      alt="preview"
      className="h-24 object-contain rounded border border-gray-700 p-1 mb-2"
    />

    <button
      type="button"
      onClick={() =>
        setNewProduct((p) => ({
          ...p,
          Image: "",
        }))
      }
      className="bg-red-600 px-3 py-1 rounded text-xs"
    >
      Remove Image
    </button>
  </div>
)}



                <label>Product Details</label>
                <textarea value={newProduct.ProductDetails} onChange={(e) => setNewProduct((p) => ({ ...p, ProductDetails: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-24" />
              </div>
            </div>

            {/* Nested quick-add modals (rendered inside this add modal) */}
            {brandModalOpen && (
              <div className="absolute inset-0 flex justify-center items-center z-40">
                <div className="w-[420px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Brand</h3>
                    <button onClick={() => setBrandModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Brand name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setBrandModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    <button onClick={handleAddBrand} className="px-3 py-1.5 bg-green-600 rounded border border-green-900">Add</button>
                  </div>
                </div>
              </div>
            )}

            {unitModalOpen && (
              <div className="absolute inset-0 flex justify-center items-center z-40">
                <div className="w-[420px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Unit</h3>
                    <button onClick={() => setUnitModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Unit name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setUnitModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    <button onClick={handleAddUnit} className="px-3 py-1.5 bg-green-600 rounded border border-green-900">Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* footer */}
            <div className="px-5 py-3 border-t border-gray-700 flex justify-end gap-2 sticky bottom-5 bg-gray-900 z-30">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">Cancel</button>
              <button onClick={handleAddProduct} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"><Save size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          EDIT PRODUCT MODAL
         ========================= */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-50 pt-12">
          <div className="w-[820px] max-h-[86vh] overflow-auto bg-gray-900 text-white rounded-lg border border-gray-700 relative">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
              <h2>{editProduct.isInactive ? "Restore Product" : "Edit Product"}</h2>
              <button onClick={() => setEditModalOpen(false)}><X size={20} /></button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label>Product Code</label>
                <input type="text" value={editProduct.productCode} onChange={(e) => setEditProduct((p) => ({ ...p, productCode: e.target.value }))} disabled={editProduct.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label className="font-semibold">* Product Name</label>
                <input type="text" value={editProduct.ProductName} onChange={(e) => setEditProduct((p) => ({ ...p, ProductName: e.target.value }))} disabled={editProduct.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label>SN</label>
                <input type="text" value={editProduct.SN} disabled className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label>Model</label>
                <input type="text" value={editProduct.Model} onChange={(e) => setEditProduct((p) => ({ ...p, Model: e.target.value }))} disabled={editProduct.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label className="font-semibold">* Unit Price</label>
                <input type="number" step="0.01" value={editProduct.UnitPrice} onChange={(e) => setEditProduct((p) => ({ ...p, UnitPrice: e.target.value }))} disabled={editProduct.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />

                <label className="font-semibold">* Reorder Level</label>
                <input type="number" step="0.01" value={editProduct.ReorderLevel} onChange={(e) => setEditProduct((p) => ({ ...p, ReorderLevel: e.target.value }))} disabled={editProduct.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2" />
              </div>

              <div>
                <label className="font-semibold">* Category</label>
                <SearchableDropdown options={categories} value={editProduct.CategoryId} onChange={(v) => setEditProduct((p) => ({ ...p, CategoryId: v }))} placeholder="Search / select category" fullWidth />

                <div className="flex gap-2 items-start mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Unit</label>
                    <SearchableDropdown options={units} value={editProduct.UnitId} onChange={(v) => setEditProduct((p) => ({ ...p, UnitId: v }))} placeholder="Search / select unit" fullWidth />
                  </div>
                  <button title="Add Unit" onClick={() => setUnitModalOpen(true)} className="mt-6 p-2 bg-gray-800 border border-gray-700 rounded"><Star size={16} /></button>
                </div>

                <div className="flex gap-2 items-start mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Company / Brand</label>
                    <SearchableDropdown options={brands} value={editProduct.BrandId} onChange={(v) => setEditProduct((p) => ({ ...p, BrandId: v }))} placeholder="Search / select brand" fullWidth />
                  </div>
                  <button title="Add Brand" onClick={() => setBrandModalOpen(true)} className="mt-6 p-2 bg-gray-800 border border-gray-700 rounded"><Star size={16} /></button>
                </div>

                <label className="mt-3">Image</label>

                {/* HIDDEN INPUT */}
{/* HIDDEN INPUT */}
<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  onChange={(e) => handleImageChange(e, setEditProduct)}
  disabled={editProduct.isInactive}
  className="hidden"
/>

{/* CUSTOM BUTTON */}
<button
  type="button"
  onClick={() => !editProduct.isInactive && fileInputRef.current.click()}
  disabled={editProduct.isInactive}
  className={`w-full px-3 py-2 rounded border mb-2
    ${
      editProduct.isInactive
        ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
        : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
    }`}
>
  Select Image
</button>

{/* PREVIEW + REMOVE BUTTON */}
{editProduct.Image && (
  <div className="mt-2">
    <img
      src={editProduct.Image}
      alt="preview"
      className="h-24 object-contain mb-2 rounded border border-gray-700 p-1"
    />

    {/* REMOVE button only if active */}
    {!editProduct.isInactive && (
      <button
        type="button"
        onClick={() =>
          setEditProduct((p) => ({
            ...p,
            Image: "",
          }))
        }
        className="bg-red-600 px-3 py-1 rounded text-xs"
      >
        Remove Image
      </button>
    )}
  </div>
)}



                <label>Product Details</label>
                <textarea value={editProduct.ProductDetails} onChange={(e) => setEditProduct((p) => ({ ...p, ProductDetails: e.target.value }))} disabled={editProduct.isInactive} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-24" />
              </div>
            </div>

            {/* Nested quick-add modals inside edit modal too */}
            {brandModalOpen && (
              <div className="absolute inset-0 flex justify-center items-center z-40">
                <div className="w-[420px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Brand</h3>
                    <button onClick={() => setBrandModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Brand name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setBrandModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    <button onClick={handleAddBrand} className="px-3 py-1.5 bg-green-600 rounded border border-green-900">Add</button>
                  </div>
                </div>
              </div>
            )}

            {unitModalOpen && (
              <div className="absolute inset-0 flex justify-center items-center z-40">
                <div className="w-[420px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Unit</h3>
                    <button onClick={() => setUnitModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Unit name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setUnitModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    <button onClick={handleAddUnit} className="px-3 py-1.5 bg-green-600 rounded border border-green-900">Add</button>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between sticky bottom-5 bg-gray-900 z-30">
              {editProduct.isInactive ? (
                <button onClick={handleRestoreProduct} className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"><ArchiveRestore size={16} /> Restore</button>
              ) : (
                <button onClick={handleDeleteProduct} className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"><Trash2 size={16} /> Delete</button>
              )}

              {!editProduct.isInactive && (
                <button onClick={handleUpdateProduct} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"><Save size={16} /> Save</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------
         COLUMN PICKER (scrollable)
         ------------------------- */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}><X size={20} /></button>
            </div>

            <div className="px-5 py-3">
              <input type="text" placeholder="search columns..." value={searchColumn} onChange={(e) => setSearchColumn(e.target.value.toLowerCase())} className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm" />
            </div>

            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-4 max-h-64 overflow-auto">
                <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                  <h3 className="font-semibold mb-3">Visible Columns</h3>
                  {Object.keys(visibleColumns).filter((col) => visibleColumns[col]).filter((col) => col.includes(searchColumn)).map((col) => (
                    <div key={col} className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2">
                      <span>{col.toUpperCase()}</span>
                      <button className="text-red-400" onClick={() => setVisibleColumns((p) => ({ ...p, [col]: false }))}>✖</button>
                    </div>
                  ))}
                </div>

                <div className="border border-gray-700 rounded p-3 bg-gray-800/40">
                  <h3 className="font-semibold mb-3">Hidden Columns</h3>
                  {Object.keys(visibleColumns).filter((col) => !visibleColumns[col]).filter((col) => col.includes(searchColumn)).map((col) => (
                    <div key={col} className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2">
                      <span>{col.toUpperCase()}</span>
                      <button className="text-green-400" onClick={() => setVisibleColumns((p) => ({ ...p, [col]: true }))}>➕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={() => setVisibleColumns(defaultColumns)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">Restore Defaults</button>
              <button onClick={() => setColumnModal(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------
         MAIN PAGE
         ------------------------- */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Products</h2>

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


            <button onClick={openAddModal} className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"><Plus size={16} /> New Product</button>

            <button onClick={refreshAll} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"><RefreshCw size={16} className="text-blue-400" /></button>

            <button onClick={() => setColumnModal(true)} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"><List size={16} className="text-blue-300" /></button>

            <button onClick={async () => { if (!showInactive) await loadInactive(); setShowInactive((s) => !s); }} className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1"><ArchiveRestore size={16} className="text-yellow-300" /><span className="text-xs opacity-80">Inactive</span></button>

            <ExportButtons onExcel={exportToExcel} onPDF={exportToPDF} />
          </div>

          {/* FILTER ROW */}
          <div className="flex items-center gap-3  bg-gray-900 p-3 border border-gray-700 rounded mb-4">
            <SearchableDropdown options={categories} value={filterCategory} onChange={setFilterCategory} placeholder="Filter by Category" />
            <SearchableDropdown options={units} value={filterUnit} onChange={setFilterUnit} placeholder="Filter by Unit" />
            <SearchableDropdown options={brands} value={filterBrand} onChange={setFilterBrand} placeholder="Filter by Brand" />

            <button onClick={applyFilters} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm">Apply</button>
            <button onClick={clearFilters} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm">Clear</button>
          </div>

          {/* TABLE (increased height, wider) */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              <table className="min-w-[1400px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">
                    {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                    {visibleColumns.barcode && <SortableHeader label="Product Code" sortOrder={sortConfig.key === "Barcode" ? sortConfig.direction : null} onClick={() => handleSort("Barcode")} />}
                    {visibleColumns.sn && <SortableHeader label="SN" sortOrder={sortConfig.key === "SN" ? sortConfig.direction : null} onClick={() => handleSort("SN")} />}
                    {visibleColumns.productName && <SortableHeader label="Name" sortOrder={sortConfig.key === "ProductName" ? sortConfig.direction : null} onClick={() => handleSort("ProductName")} />}
                    {visibleColumns.model && <SortableHeader label="Model" sortOrder={sortConfig.key === "Model" ? sortConfig.direction : null} onClick={() => handleSort("Model")} />}
                    {visibleColumns.unitPrice && <SortableHeader label="Unit Price" sortOrder={sortConfig.key === "UnitPrice" ? sortConfig.direction : null} onClick={() => handleSort("UnitPrice")} />}
                    {visibleColumns.unitsInStock && <SortableHeader label="In Stock" sortOrder={sortConfig.key === "UnitsInStock" ? sortConfig.direction : null} onClick={() => handleSort("UnitsInStock")} />}
                    {visibleColumns.reorderLevel && <SortableHeader label="Reorder Level" sortOrder={sortConfig.key === "ReorderLevel" ? sortConfig.direction : null} onClick={() => handleSort("ReorderLevel")} />}
                    {visibleColumns.categoryName && <SortableHeader label="Category" sortOrder={sortConfig.key === "categoryName" ? sortConfig.direction : null} onClick={() => handleSort("categoryName")} />}
                    {visibleColumns.unitName && <SortableHeader label="Unit" sortOrder={sortConfig.key === "unitName" ? sortConfig.direction : null} onClick={() => handleSort("unitName")} />}
                    {visibleColumns.brandName && <SortableHeader label="Brand" sortOrder={sortConfig.key === "brandName" ? sortConfig.direction : null} onClick={() => handleSort("brandName")} />}
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={12} className="text-center py-6 text-gray-400">Loading...</td>
                    </tr>
                  )}

                  {!loading && displayedProducts.length === 0 && (
                    <tr>
                      <td colSpan={12} className="text-center py-6 text-gray-400">No records found</td>
                    </tr>
                  )}

                  {!loading && displayedProducts.map((p) => (
                    <tr key={p.id} className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm" onClick={() => openEditModal(p, false)}>
                      {visibleColumns.id && <td className="px-2 py-2 text-center">{p.id}</td>}
                      {visibleColumns.barcode && <td className="px-2 py-2 text-center">{p.Barcode}</td>}
                      {visibleColumns.sn && <td className="px-2 py-2 text-center">{p.SN}</td>}
                      {visibleColumns.productName && <td className="px-2 py-2 text-center">{p.ProductName}</td>}
                      {visibleColumns.model && <td className="px-2 py-2 text-center">{p.Model}</td>}
                      {visibleColumns.unitPrice && <td className="px-2 py-2 text-center">{p.UnitPrice}</td>}
                      {visibleColumns.unitsInStock && <td className="px-2 py-2 text-center">{p.UnitsInStock}</td>}
                      {visibleColumns.reorderLevel && <td className="px-2 py-2 text-center">{p.ReorderLevel}</td>}
                      {visibleColumns.categoryName && <td className="px-2 py-2 text-center">{p.categoryName || "-"}</td>}
                      {visibleColumns.unitName && <td className="px-2 py-2 text-center">{p.unitName || "-"}</td>}
                      {visibleColumns.brandName && <td className="px-2 py-2 text-center">{p.brandName || "-"}</td>}
                    </tr>
                  ))}

                  {showInactive && inactiveProducts.map((p) => (
                    <tr key={`inactive-${p.id}`} className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm" onClick={() => openEditModal(p, true)}>
                      {visibleColumns.id && <td className="px-2 py-2 text-center">{p.id}</td>}
                      {visibleColumns.barcode && <td className="px-2 py-2 text-center">{p.Barcode}</td>}
                      {visibleColumns.sn && <td className="px-2 py-2 text-center">{p.SN}</td>}
                      {visibleColumns.productName && <td className="px-2 py-2 text-center">{p.ProductName}</td>}
                      {visibleColumns.model && <td className="px-2 py-2 text-center">{p.Model}</td>}
                      {visibleColumns.unitPrice && <td className="px-2 py-2 text-center">{p.UnitPrice}</td>}
                      {visibleColumns.unitsInStock && <td className="px-2 py-2 text-center">{p.UnitsInStock}</td>}
                      {visibleColumns.reorderLevel && <td className="px-2 py-2 text-center">{p.ReorderLevel}</td>}
                      {visibleColumns.categoryName && <td className="px-2 py-2 text-center">{p.categoryName || "-"}</td>}
                      {visibleColumns.unitName && <td className="px-2 py-2 text-center">{p.unitName || "-"}</td>}
                      {visibleColumns.brandName && <td className="px-2 py-2 text-center">{p.brandName || "-"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* pagination */}
          {/* pagination */}
          <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            total={totalRecords}
            onRefresh={() => {
              refreshAll();
            }}
          />
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default Products;



