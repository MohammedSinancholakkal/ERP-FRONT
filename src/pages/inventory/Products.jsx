import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSpreadsheet, 
  FileText,        
} from "lucide-react";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import FilterBar from "../../components/FilterBar";

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
  addUnitApi,
  getCountriesApi,
  addCountryApi,
  updateCountryApi,
  deleteCountryApi,
  restoreCountryApi,
  searchCountryApi
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";
import MasterTable from "../../components/MasterTable";
import Pagination from "../../components/Pagination";

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



/* ------------------------------
   Main Products component
   ------------------------------ */

const Products = () => {
  const { theme } = useTheme(); // ADDED
  const navigate = useNavigate(); // ADDED - Need to import hook
  // UI state
  // UI state
  const [brandModalOpen, setBrandModalOpen] = useState(false); 
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

  // Country Management
  const [countries, setCountries] = useState([]);
  const [countryAddModal, setCountryAddModal] = useState(false);
  const [countryEditModal, setCountryEditModal] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [editCountryData, setEditCountryData] = useState({ id: null, name: "", isInactive: false });

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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setPage(1); // Reset to page 1 on sort
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
    quantityIn: true,    // NEW
    quantityOut: true,   // NEW
    reorderLevel: true,
    categoryName: true,
    unitName: true,
    brandName: true,
    supplierName: true, // NEW
    hsnCode: true,
    colour: true,
    grade: true
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
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

    CountryId: "",

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
    CountryId: "",
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
      // setLoading(true); // Clean load
      const res = await getInactiveProductsApi();
      if (res.status === 200) setInactiveProducts(res.data.records || res.data || []);
    } catch (err) {
      console.error("LOAD INACTIVE ERR", err);
      showErrorToast("Failed to load inactive products");
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
    try {
      const co = await getCountriesApi(1, 1000);
      if (co.status === 200) setCountries(co.data.records || co.data || []);
    } catch (err) {
      console.error("LOAD COUNTRIES ERR", err);
      setCountries([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    if (showInactive) {
      loadInactive();
    }
  }, [showInactive]);

  /* --------------------
     SN generation: P000001
     -------------------- */
  const generateNextSNLocal = () => {
    const all = [...products, ...inactiveProducts];
    let max = 0;
    all.forEach((p) => {
      if (p && p.SN) {
        const m = p.SN.match(/^P0*(\d+)$/);
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
      CountryId: "",
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
    // Country not strictly required? Assuming optional or add check if needed.

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
      CountryId: newProduct.CountryId || null,
      Image: newProduct.Image,
      ProductDetails: newProduct.ProductDetails,
      userId: currentUserId
    };

    try {
      const res = await addProductApi(payload);
      if (res.status === 200) {
        showSuccessToast("Product added");
        setModalOpen(false);
        loadProducts(1, limit);
        loadDropdowns();
      } else {
        showErrorToast(res.message || "Add failed");
      }
    } catch (err) {
      console.error("ADD ERR", err);
      showErrorToast("Server error");
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
      CountryId: p.CountryId || "",
      Image: p.Image || "",
      ProductDetails: p.ProductDetails || "",
      isInactive: inactive
    });
    loadDropdowns();
    setEditModalOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editProduct.ProductName?.trim()) return showErrorToast("Product Name required");
    if (editProduct.UnitPrice === "" || isNaN(Number(editProduct.UnitPrice))) return showErrorToast("Unit Price required");
    if (editProduct.ReorderLevel === "" || isNaN(Number(editProduct.ReorderLevel))) return showErrorToast("Reorder Level required");

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
      CountryId: editProduct.CountryId || null,
      Image: editProduct.Image,
      ProductDetails: editProduct.ProductDetails,
      userId: currentUserId
    };

    try {
      const res = await updateProductApi(editProduct.id, payload);
      if (res.status === 200) {
        showSuccessToast("Updated");
        setEditModalOpen(false);
        loadProducts();
        if (showInactive) loadInactive();
      } else {
        showErrorToast("Update failed");
      }
    } catch (err) {
      console.error("UPDATE ERR", err);
      showErrorToast("Server error");
    }
  };

  const handleDeleteProduct = async () => {
    const result = await showDeleteConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await deleteProductApi(editProduct.id, { userId: currentUserId });
      if (res.status === 200) {
        showSuccessToast("Deleted");
        setEditModalOpen(false);
        loadProducts();
        if (showInactive) loadInactive();
      }
    } catch (err) {
      console.error("DELETE ERR", err);
      showErrorToast("Server error");
    }
  };

  const handleRestoreProduct = async () => {
    const result = await showRestoreConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await restoreProductApi(editProduct.id, { userId: currentUserId });
      if (res.status === 200) {
        showSuccessToast("Restored");
        setEditModalOpen(false); // Close if open
        loadProducts();
        if(showInactive) loadInactive();
      }
    } catch (err) {
      console.error("RESTORE ERR", err);
      showErrorToast("Server error");
    }
  };

  /* --------------------
     Quick-add Brand / Unit
     Rendered inside Add/Edit modal so they appear over that modal.
     -------------------- */
  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return showErrorToast("Brand name required");
    try {
      const res = await addBrandApi({ name: newBrandName, userId: currentUserId });
      if (res.status === 200) {
        showSuccessToast("Brand added");
        setNewBrandName("");
        setBrandModalOpen(false);
        const b = await getBrandsApi();
        if (b.status === 200) setBrands(b.data.records || b.data || []);
      }
    } catch (err) {
      console.error("ADD BRAND ERR", err);
      showErrorToast("Server error");
    }
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return showErrorToast("Unit name required");
    try {
      const res = await addUnitApi({ name: newUnitName, userId: currentUserId });
      if (res.status === 200) {
        showSuccessToast("Unit added");
        setNewUnitName("");
        setUnitModalOpen(false);
        const u = await getUnitsApi();
        if (u.status === 200) setUnits(u.data.records || u.data || []);
      }
    } catch (err) {
      console.error("ADD UNIT ERR", err);
      showErrorToast("Server error");
    }
  };

  /* --------------------
     Country Handlers (Adapted from Countries.jsx)
     -------------------- */
  const handleAddCountry = async () => {
    if (!newCountry.trim()) return showErrorToast("Country name required");
    try {
      // Check duplicate
      const searchRes = await searchCountryApi(newCountry);
      if (searchRes?.status === 200) {
        const existing = (searchRes.data.records || searchRes.data || []).find(
          c => c.name.toLowerCase() === newCountry.trim().toLowerCase()
        );
        if (existing) return showErrorToast("Country already exists");
      }

      const res = await addCountryApi({ name: newCountry, userId: currentUserId });
      if (res?.status === 200) {
        showSuccessToast("Country added");
        setNewCountry("");
        setCountryAddModal(false);
        // Reload global countries
        const c = await getCountriesApi(1, 1000);
        if (c.status === 200) setCountries(c.data.records || c.data || []);
      } else {
        showErrorToast("Failed to add");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Error adding country");
    }
  };

  const handleUpdateCountry = async () => {
    if (!editCountryData.name.trim()) return showErrorToast("Name cannot be empty");
    try {
      // Check duplicate
      const searchRes = await searchCountryApi(editCountryData.name);
      if (searchRes?.status === 200) {
        const existing = (searchRes.data.records || searchRes.data || []).find(
          c => c.name.toLowerCase() === editCountryData.name.trim().toLowerCase() && c.id !== editCountryData.id
        );
        if (existing) return showErrorToast("Name already exists");
      }
      
      const res = await updateCountryApi(editCountryData.id, {
        name: editCountryData.name,
        userId: currentUserId
      });
      if (res?.status === 200) {
        showSuccessToast("Country updated");
        setCountryEditModal(false);
        const c = await getCountriesApi(1, 1000);
        if (c.status === 200) setCountries(c.data.records || c.data || []);
      } else {
        showErrorToast("Update failed");
      }
    } catch(err) {
      console.error(err);
      showErrorToast("Error updating country");
    }
  };

  const handleDeleteCountry = async () => {
    const result = await showDeleteConfirm('country');

    if (result.isConfirmed) {
      try {
        const res = await deleteCountryApi(editCountryData.id, { userId: currentUserId });
        if (res?.status === 200) {
          showSuccessToast("Country deleted");
          setCountryEditModal(false);
          const c = await getCountriesApi(1, 1000);
          if (c.status === 200) setCountries(c.data.records || c.data || []);
        } else {
             showErrorToast("Delete failed");
        }
      } catch(err) {
         showErrorToast("Error deleting");
      }
    }
  };

  const handleRestoreCountry = async () => {
     try {
        const res = await restoreCountryApi(editCountryData.id, { userId: currentUserId });
        if (res?.status === 200) {
           showSuccessToast("Country restored");
           setCountryEditModal(false);
           const c = await getCountriesApi(1, 1000);
           if (c.status === 200) setCountries(c.data.records || c.data || []);
        } else {
           showErrorToast("Restore failed");
        }
     } catch(err) {
        showErrorToast("Error restoring");
     }
  };

  const openCountryEditModal = (countryId) => {
    const c = countries.find(x => x.id === countryId);
    if (!c) return;
    setEditCountryData({
      id: c.id,
      name: c.name,
      isInactive: c.status === 'Inactive' || c.isInactive // Check your API response for status field
    });
    setCountryEditModal(true);
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
      QuantityIn: r.QuantityIn, 
      QuantityOut: r.QuantityOut, 
      ReorderLevel: r.ReorderLevel,
      Category: r.categoryName || "-",
      Unit: r.unitName || "-",
      Brand: r.brandName || "-",
      Supplier: r.supplierName || "-"
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
      r.QuantityIn,
      r.QuantityOut,
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
        "In Stock", "Qty In", "Qty Out", "Reorder Level", "Category", "Unit", "Brand"
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
  }, [products, searchText, filterCategory, filterUnit, filterBrand, products.length]);

  // --- SORTING LOGIC ---
  const sortedList = React.useMemo(() => {
    let sortableItems = [...displayedProducts];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        if (['unitPrice', 'unitsInStock', 'reorderLevel', 'id'].includes(sortConfig.key)) {
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
  }, [displayedProducts, sortConfig]);

  // --- FILTER BAR CONFIG ---
  const filters = [
      {
          type: 'select',
          value: filterCategory,
          onChange: setFilterCategory,
          options: categories,
          placeholder: "All Categories"
      },
      {
           type: 'select',
           value: filterBrand,
           onChange: setFilterBrand,
           options: brands,
           placeholder: "All Brands"
      },
      {
           type: 'select',
           value: filterUnit,
           onChange: setFilterUnit,
           options: units,
           placeholder: "All Units"
      }
  ];

  const handleClearFilters = () => {
      setFilterCategory("");
      setFilterBrand("");
      setFilterUnit("");
  };



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
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    loadProducts(1, limit);
  };

  /* --------------------
     Render
     -------------------- */
  return (
    <>
    
{/* Product Modals Removed - Handled by NewProduct Page */}

      {/* COUNTRY ADD MODAL */}
      <AddModal
        isOpen={countryAddModal}
        onClose={() => setCountryAddModal(false)}
        onSave={handleAddCountry}
        title="New Country"
        zIndex={60}
      >
        <label className="block text-sm mb-1">Name *</label>
        <input
          type="text"
          value={newCountry}
          onChange={(e) => setNewCountry(e.target.value)}
          placeholder="Enter country name"
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
        />
      </AddModal>

      {/* COUNTRY EDIT MODAL */}
      <EditModal
        isOpen={countryEditModal}
        onClose={() => setCountryEditModal(false)}
        onSave={handleUpdateCountry}
        onDelete={handleDeleteCountry}
        onRestore={handleRestoreCountry}
        isInactive={editCountryData.isInactive}
        title={`${editCountryData.isInactive ? "Restore Country" : "Edit Country"} (${editCountryData.name})`}
        permissionDelete={hasPermission(PERMISSIONS.COUNTRIES.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.COUNTRIES.EDIT)}
        zIndex={60}
      >
        <label className="block text-sm mb-1">Name *</label>
        <input
          type="text"
          value={editCountryData.name}
          onChange={(e) =>
            setEditCountryData((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          disabled={editCountryData.isInactive}
          className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none ${
            editCountryData.isInactive ? "opacity-60 cursor-not-allowed" : ""
          }`}
        />
      </EditModal>

      {/* -------------------------
         COLUMN PICKER (scrollable)
         ------------------------- */}
        <ColumnPickerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />
      {/* -------------------------
         MAIN PAGE
         ------------------------- */}

      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
             
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Products</h2>
            </div>
            <hr className="mb-4 border-gray-300" />
            {/* TABLE */}
            <MasterTable
              columns={[
                visibleColumns.id && { key: "id", label: "ID", sortable: true },
                visibleColumns.barcode && { key: "Barcode", label: "Barcode", sortable: true },
                visibleColumns.sn && { key: "SN", label: "SN", sortable: true },
                visibleColumns.productName && { key: "ProductName", label: "Product Name", sortable: true },
                visibleColumns.model && { key: "Model", label: "Model", sortable: true },
                visibleColumns.unitPrice && { key: "UnitPrice", label: "Unit Price", sortable: true },
                visibleColumns.unitsInStock && { key: "UnitsInStock", label: "In Stock", sortable: true },
                visibleColumns.quantityIn && { key: "QuantityIn", label: "Qty In", sortable: true },
                visibleColumns.quantityOut && { key: "QuantityOut", label: "Qty Out", sortable: true },
                visibleColumns.reorderLevel && { key: "ReorderLevel", label: "Reorder", sortable: true },
                visibleColumns.categoryName && { key: "categoryName", label: "Category", sortable: true },
                visibleColumns.unitName && { key: "unitName", label: "Unit", sortable: true },
                visibleColumns.brandName && { key: "brandName", label: "Brand", sortable: true },
                visibleColumns.supplierName && { key: "supplierName", label: "Supplier", sortable: true },
                visibleColumns.hsnCode && { key: "hsnCode", label: "HSN", sortable: true }, // NEW
                visibleColumns.colour && { key: "colour", label: "Colour", sortable: true }, // NEW
                visibleColumns.grade && { key: "grade", label: "Grade", sortable: true }, // NEW
              ].filter(Boolean)}
              data={sortedList} // Use sortedList
              inactiveData={inactiveProducts}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(p, inactive) => openEditModal(p, inactive)}
              // Action Bar
              search={searchText}
              onSearch={setSearchText}
              onCreate={openAddModal}
              createLabel="New Product"
              permissionCreate={hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE)}
              onRefresh={() => {
                setSearchText("");
                setFilterCategory("");
                setFilterUnit("");
                setFilterBrand("");
                setSortConfig({ key: null, direction: 'asc' });
                setPage(1);
                setShowInactive(false);
                loadProducts(1, limit);
                // No toast here, MasterTable/Pagination handles it
              }}
              onColumnSelector={() => setColumnModal(true)}
              onToggleInactive={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
              }}
              customActions={
                <ExportButtons 
                  onExcel={exportToExcel} 
                  onPDF={exportToPDF} 
                />
              }
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
                setFilterCategory("");
                setFilterUnit("");
                setFilterBrand("");
                setSortConfig({ key: null, direction: 'asc' });
                setPage(1);
                setShowInactive(false);
                loadProducts(1, limit);
              }}
            />
        </div>
        </ContentCard>
      </div>
      </PageLayout>
    </>
  );
};

export default Products;



