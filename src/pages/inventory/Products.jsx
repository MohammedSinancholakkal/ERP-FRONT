import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ArchiveRestore,
  Star,
  FileSpreadsheet, // Keep for ExportButtons
  FileText,        // Keep for ExportButtons
  Pencil
} from "lucide-react";
import Swal from "sweetalert2";
import MasterTable from "../../components/MasterTable"; // ADDED
import { useTheme } from "../../context/ThemeContext"; // ADDED
// Removed SortableHeader
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";   

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
      toast.error("Failed to load inactive products");
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
      CountryId: p.CountryId || "",
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
      CountryId: editProduct.CountryId || null,
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
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This product will be restored!",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await restoreProductApi(editProduct.id, { userId: currentUserId });
      if (res.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false); // Close if open
        loadProducts();
        if(showInactive) loadInactive();
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
     Country Handlers (Adapted from Countries.jsx)
     -------------------- */
  const handleAddCountry = async () => {
    if (!newCountry.trim()) return toast.error("Country name required");
    try {
      // Check duplicate
      const searchRes = await searchCountryApi(newCountry);
      if (searchRes?.status === 200) {
        const existing = (searchRes.data.records || searchRes.data || []).find(
          c => c.name.toLowerCase() === newCountry.trim().toLowerCase()
        );
        if (existing) return toast.error("Country already exists");
      }

      const res = await addCountryApi({ name: newCountry, userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Country added");
        setNewCountry("");
        setCountryAddModal(false);
        // Reload global countries
        const c = await getCountriesApi(1, 1000);
        if (c.status === 200) setCountries(c.data.records || c.data || []);
      } else {
        toast.error("Failed to add");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding country");
    }
  };

  const handleUpdateCountry = async () => {
    if (!editCountryData.name.trim()) return toast.error("Name cannot be empty");
    try {
      // Check duplicate
      const searchRes = await searchCountryApi(editCountryData.name);
      if (searchRes?.status === 200) {
        const existing = (searchRes.data.records || searchRes.data || []).find(
          c => c.name.toLowerCase() === editCountryData.name.trim().toLowerCase() && c.id !== editCountryData.id
        );
        if (existing) return toast.error("Name already exists");
      }
      
      const res = await updateCountryApi(editCountryData.id, {
        name: editCountryData.name,
        userId: currentUserId
      });
      if (res?.status === 200) {
        toast.success("Country updated");
        setCountryEditModal(false);
        const c = await getCountriesApi(1, 1000);
        if (c.status === 200) setCountries(c.data.records || c.data || []);
      } else {
        toast.error("Update failed");
      }
    } catch(err) {
      console.error(err);
      toast.error("Error updating country");
    }
  };

  const handleDeleteCountry = async () => {
    Swal.fire({
      title: "Delete Country?",
      text: "Irreversible action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteCountryApi(editCountryData.id, { userId: currentUserId });
          if (res?.status === 200) {
            toast.success("Country deleted");
            setCountryEditModal(false);
            const c = await getCountriesApi(1, 1000);
            if (c.status === 200) setCountries(c.data.records || c.data || []);
          } else {
             toast.error("Delete failed");
          }
        } catch(err) {
           toast.error("Error deleting");
        }
      }
    });
  };

  const handleRestoreCountry = async () => {
     try {
        const res = await restoreCountryApi(editCountryData.id, { userId: currentUserId });
        if (res?.status === 200) {
           toast.success("Country restored");
           setCountryEditModal(false);
           const c = await getCountriesApi(1, 1000);
           if (c.status === 200) setCountries(c.data.records || c.data || []);
        } else {
           toast.error("Restore failed");
        }
     } catch(err) {
        toast.error("Error restoring");
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
                <SearchableSelect
                  options={categories}
                  value={newProduct.CategoryId}
                  onChange={(v) => setNewProduct((p) => ({ ...p, CategoryId: v }))}
                  placeholder="Search / select category"
                  className="w-full"
                />

                <div className="flex gap-2 items-end mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Unit</label>
                    <SearchableSelect
                      options={units}
                      value={newProduct.UnitId}
                      onChange={(v) => setNewProduct((p) => ({ ...p, UnitId: v }))}
                      placeholder="Search / select unit"
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    title="Add Unit"
                    onClick={() => setUnitModalOpen(true)}
                    className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm"
                  >
                    {hasPermission(PERMISSIONS.INVENTORY.UNITS.CREATE) && <Star size={16} />}
                  </button>
                </div>

                <div className="flex gap-2 items-end mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Company / Brand</label>
                    <SearchableSelect
                      options={brands}
                      value={newProduct.BrandId}
                      onChange={(v) => setNewProduct((p) => ({ ...p, BrandId: v }))}
                      placeholder="Search / select brand"
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    title="Add Brand"
                    onClick={() => setBrandModalOpen(true)}
                    className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm"
                  >
                   {hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE) && <Star size={16} />}
                  </button>
                </div>

                <div className="flex gap-2 items-end mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">Country</label>
                    <SearchableSelect
                      options={countries}
                      value={newProduct.CountryId}
                      onChange={(v) => setNewProduct((p) => ({ ...p, CountryId: v }))}
                      placeholder="Search / select country"
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    title="Add Country"
                    onClick={() => setCountryAddModal(true)}
                    className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm"
                  >
                    {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && <Plus size={16} />}
                  </button>
                  {/* Edit Selected Country */}
                  {newProduct.CountryId && (
                    <button
                      type="button"
                      title="Edit Country"
                      onClick={() => openCountryEditModal(newProduct.CountryId)}
                      className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm"
                    >
                      {hasPermission(PERMISSIONS.COUNTRIES.EDIT) && <Pencil size={16} />}
                    </button>
                  )}
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
              <div className="fixed inset-0 flex justify-center items-center z-[60] bg-black/50 backdrop-blur-sm">
                <div className="w-[700px] bg-gray-900 text-white  rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Brand</h3>
                    <button onClick={() => setBrandModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Brand name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setBrandModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    {hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE) && (
                    <button onClick={handleAddBrand} className="px-3 py-1.5 bg-gray-800 text-blue-300 rounded border border-gray-700">Add</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {unitModalOpen && (
              <div className="fixed inset-0 flex justify-center items-center z-[60] bg-black/50 backdrop-blur-sm">
                <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Unit</h3>
                    <button onClick={() => setUnitModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Unit name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setUnitModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    {hasPermission(PERMISSIONS.INVENTORY.UNITS.CREATE) && (
                    <button onClick={handleAddUnit} className="px-3 py-1.5 bg-gray-800 rounded border text-blue-300 border-gray-700">Add</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* footer */}
            <div className="px-5 py-3 border-t border-gray-700 flex justify-end gap-2 sticky bottom-5 bg-gray-900 z-30">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded">Cancel</button>
              {hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE) && (
              <button onClick={handleAddProduct} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"><Save size={16} /> Save</button>
              )}
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
                <SearchableSelect options={categories} value={editProduct.CategoryId} onChange={(v) => setEditProduct((p) => ({ ...p, CategoryId: v }))} disabled={editProduct.isInactive} placeholder="Search / select category" className="w-full" />

                <div className="flex gap-2 items-end mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Unit</label>
                    <SearchableSelect options={units} value={editProduct.UnitId} onChange={(v) => setEditProduct((p) => ({ ...p, UnitId: v }))} disabled={editProduct.isInactive} placeholder="Search / select unit" className="w-full" />
                  </div>
                  <button type="button" title="Add Unit" disabled={editProduct.isInactive} onClick={() => setUnitModalOpen(true)} className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {hasPermission(PERMISSIONS.INVENTORY.UNITS.CREATE) && <Star size={16} />}
                  </button>
                </div>

                <div className="flex gap-2 items-end mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">* Company / Brand</label>
                    <SearchableSelect options={brands} value={editProduct.BrandId} onChange={(v) => setEditProduct((p) => ({ ...p, BrandId: v }))} disabled={editProduct.isInactive} placeholder="Search / select brand" className="w-full" />
                  </div>
                  <button type="button" title="Add Brand" disabled={editProduct.isInactive} onClick={() => setBrandModalOpen(true)} className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                     {hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE) && <Star size={16} />}
                  </button>
                </div>

                <div className="flex gap-2 items-end mt-3">
                  <div className="flex-1">
                    <label className="font-semibold">Country</label>
                    <SearchableSelect
                      options={countries}
                      value={editProduct.CountryId}
                      onChange={(v) => setEditProduct((p) => ({ ...p, CountryId: v }))}
                      placeholder="Search / select country"
                      className="w-full"
                      disabled={editProduct.isInactive}
                    />
                  </div>
                   <button
                    type="button"
                    title="Add Country"
                    disabled={editProduct.isInactive}
                    onClick={() => setCountryAddModal(true)}
                    className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && <Plus size={16} />}
                  </button>
                   {editProduct.CountryId && (
                    <button
                      type="button"
                      title="Edit Country"
                      disabled={editProduct.isInactive}
                      onClick={() => openCountryEditModal(editProduct.CountryId)}
                      className="p-2 bg-gray-800 border border-gray-700 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasPermission(PERMISSIONS.COUNTRIES.EDIT) && <Pencil size={16} />}
                    </button>
                  )}
                </div>

                <label className="mt-3">Image</label>

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
              <div className="fixed inset-0 flex justify-center items-center z-[60] bg-black/50 backdrop-blur-sm">
                <div className="w-[420px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Brand</h3>
                    <button onClick={() => setBrandModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Brand name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setBrandModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    {hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE) && (
                    <button onClick={handleAddBrand} className="px-3 py-1.5 bg-green-600 rounded border border-green-900">Add</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {unitModalOpen && (
              <div className="fixed inset-0 flex justify-center items-center z-[60] bg-black/50 backdrop-blur-sm">
                <div className="w-[420px] bg-gray-900 text-white rounded-lg border border-gray-700 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3>Add Unit</h3>
                    <button onClick={() => setUnitModalOpen(false)}><X /></button>
                  </div>
                  <input placeholder="Unit name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-3" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setUnitModalOpen(false)} className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700">Cancel</button>
                    {hasPermission(PERMISSIONS.INVENTORY.UNITS.CREATE) && (
                    <button onClick={handleAddUnit} className="px-3 py-1.5 bg-green-600 rounded border border-green-900">Add</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between sticky bottom-5 bg-gray-900 z-30">
              {editProduct.isInactive ? (
                hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.DELETE) && (
                  <button onClick={handleRestoreProduct} className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"><ArchiveRestore size={16} /> Restore</button>
                )
              ) : (
                hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.DELETE) && (
                  <button onClick={handleDeleteProduct} className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"><Trash2 size={16} /> Delete</button>
                )
              )}

              {!editProduct.isInactive && hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.EDIT) && (
                <button onClick={handleUpdateProduct} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"><Save size={16} /> Save</button>
              )}
            </div>
          </div>
        </div>
      )}

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
      {/* -------------------------
         MAIN PAGE
         ------------------------- */}
      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden">
             
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Products</h2>
            </div>

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.barcode && { key: "Barcode", label: "Code", sortable: true },
                    visibleColumns.sn && { key: "SN", label: "SN", sortable: true },
                    visibleColumns.productName && { key: "ProductName", label: "Product", sortable: true },
                    visibleColumns.model && { key: "Model", label: "Model", sortable: true },
                    visibleColumns.unitPrice && { key: "UnitPrice", label: "Price", sortable: true },
                    visibleColumns.unitsInStock && { key: "UnitsInStock", label: "Stock", sortable: true },
                    visibleColumns.reorderLevel && { key: "ReorderLevel", label: "Reorder", sortable: true },
                    visibleColumns.categoryName && { key: "categoryName", label: "Category", sortable: true, render: (r) => r.categoryName || "-" },
                    visibleColumns.unitName && { key: "unitName", label: "Unit", sortable: true, render: (r) => r.unitName || "-" },
                    visibleColumns.brandName && { key: "brandName", label: "Brand", sortable: true, render: (r) => r.brandName || "-" },
                ].filter(Boolean)}
                data={sortedList} // Use sortedList which is computed from displayedProducts (filtered)
                inactiveData={inactiveProducts} // MasterTable might not need this if we handle displaying mixed content or handled via showInactive prop logic in MasterTable depending on implementation. 
                // Wait, original Products.jsx appends inactive rows to displayed list if showInactive is true.
                // MasterTable usually handles displaying active vs inactive. 
                // But here Products.jsx has specific client-side filtering logic `computeDisplayed`.
                // If we pass `sortedList` as `data`, it contains CURRENTLY VISIBLE items (filtered & sorted).
                // If `showInactive` is true, `sortedList` SHOULD contain both?
                // `computeDisplayed` filters `products`. `products` usually only has active ones loaded via `loadProducts`.
                // `loadInactive` loads into `inactiveProducts`.
                // `getExportRows` manually concats them.
                // Original render (lines 1497) manually maps `inactiveProducts` if `showInactive` is true.
                // So `sortedList` ONLY contains active products (based on `products` state).
                // So we need to pass `inactiveData={inactiveProducts}` to MasterTable.
                
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(p, isInactive) => openEditModal(p, isInactive)}
                
                // Action Bar
                search={searchText}
                onSearch={(val) => setSearchText(val)} // MasterTable usually debounces or handles this. Current Products.jsx uses local state `searchText`.
                
                onCreate={() => openAddModal()}
                createLabel="New Product"
                permissionCreate={hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE)}
                
                onRefresh={refreshAll}
                
                onColumnSelector={() => setColumnModalOpen(true)}
                
                onToggleInactive={async () => { 
                    // if (!showInactive) await loadInactive(); // Handled by useEffect in original code
                    setShowInactive((s) => !s); 
                }}
                customActions={<ExportButtons onExcel={exportToExcel} onPDF={exportToPDF} />}
            >
               {/* FILTER BAR - Replaced custom manual filters with FilterBar */}
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



