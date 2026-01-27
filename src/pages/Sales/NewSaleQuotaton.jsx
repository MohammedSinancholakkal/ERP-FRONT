// src/pages/sales/NewSaleQuotation.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Star,
  X,
  Edit,
  Pencil, // Added
  ArchiveRestore
} from "lucide-react";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from "../../utils/notificationUtils";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ReactDOM from "react-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";

// APIs
import {
  getCustomersApi,
  getBrandsApi,
  getProductsApi,
  addQuotationApi,
  addBrandApi,
  addCustomerApi,
  addProductApi,
  getUnitsApi,
  getCategoriesApi,
  getQuotationByIdApi,
  updateQuotationApi,
  deleteQuotationApi,
  restoreQuotationApi,
  getTaxTypesApi,
  searchBrandApi,
  updateBrandApi, // Added
  searchProductApi,
  getNextQuotationNoApi
} from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";

const NewSaleQuotation = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [inactiveView, setInactiveView] = useState(false);

  useEffect(() => {
    if (location.state?.isInactive) {
      setInactiveView(true);
    }
    // Fetch next quotation no if new
    if (!id) {
         getNextQuotationNoApi().then(res => {
             if(res.status === 200 && res.data?.nextNo) {
                 setQuotationNo(res.data.nextNo);
             }
         }).catch(err => console.error(err));
    }
  }, [location.state, id]);

  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  // --- TOP SECTION STATE ---
  const [customer, setCustomer] = useState("");
  const [vehicleNo, setVehicleNo] = useState(""); // ADDED
  const [quotationNo, setQuotationNo] = useState(""); // ADDED
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");


  // --- DROPDOWN DATA ---
  const [customersList, setCustomersList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  const [openCustomer, setOpenCustomer] = useState(false);
const [customerSearch, setCustomerSearch] = useState("");
const customerRef = useRef(null);

useEffect(() => {
  const handleOutside = (e) => {
    if (customerRef.current && !customerRef.current.contains(e.target)) {
      setOpenCustomer(false);
    }
  };

  document.addEventListener("mousedown", handleOutside);
  return () => document.removeEventListener("mousedown", handleOutside);
}, []);




  // --- LINE ITEMS STATE ---
  const [rows, setRows] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // --- MODAL ITEM STATE ---
  const [newItem, setNewItem] = useState({
    brandId: "",
    brandName: "",
    productId: "",
    productName: "",
    description: "",
    unitId: "",
    unitName: "",
    quantity: 0,
    unitPrice: 0,
    discount: 0,
    taxPercentage: 0,
    total: 0
  });

  // --- QUICK CREATE BRAND MODAL STATE ---
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  // --- EDIT BRAND STATE ---
  const [editBrandModalOpen, setEditBrandModalOpen] = useState(false);
  const [brandEditData, setBrandEditData] = useState({ id: null, name: "" });

  // --- QUICK CREATE CUSTOMER MODAL STATE (Removed in favor of navigation) ---
  // const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  // const [newCustomerName, setNewCustomerName] = useState("");

  // --- QUICK CREATE PRODUCT MODAL STATE ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({
    productCode: "",
    name: "",
    SN: "",
    Model: "",
    price: "0.00",
    ReorderLevel: "10.00",
    CategoryId: "",
    unitId: "",
    brandId: "",
    Image: "",
    description: ""
  });

  const [openCategory, setOpenCategory] = useState(false);
const [openUnit, setOpenUnit] = useState(false);
const [openBrand, setOpenBrand] = useState(false);

const [searchCategory, setSearchCategory] = useState("");
const [searchUnit, setSearchUnit] = useState("");
const [searchBrand, setSearchBrand] = useState("");


const categoryRef = useRef(null);
const unitRef = useRef(null);
const brandRef = useRef(null);


useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      categoryRef.current &&
      !categoryRef.current.contains(e.target)
    ) {
      setOpenCategory(false);
    }

    if (
      unitRef.current &&
      !unitRef.current.contains(e.target)
    ) {
      setOpenUnit(false);
    }

    if (
      brandRef.current &&
      !brandRef.current.contains(e.target)
    ) {
      setOpenBrand(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);



  const [unitsList, setUnitsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  // --- BOTTOM SECTION STATE ---
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [noTax, setNoTax] = useState(false);
  const [details, setDetails] = useState("");

  // --- CALCULATED VALUES ---
  const [netTotal, setNetTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  
  // --- GST STATE ---
  const [taxTypesList, setTaxTypesList] = useState([]);
  const [taxTypeId, setTaxTypeId] = useState("");
  const [igstRate, setIgstRate] = useState(0);
  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    fetchCustomers();
    fetchBrands();
    fetchProducts();
    fetchUnits();
    fetchUnits();
    fetchCategories();
    fetchTaxTypes();
  }, []);

  // --- HANDLE RETURN FROM NEW CUSTOMER ---
  useEffect(() => {
    if (location.state?.newCustomerId) {
      const newId = location.state.newCustomerId;
      getCustomersApi(1, 1000).then(res => {
         if(res.status === 200) {
             const list = (res.data.records || []).map(r => ({
                id: r.id ?? r.Id ?? r.customerId ?? r.CustomerId ?? null,
                companyName: r.companyName ?? r.CompanyName ?? r.name ?? r.Name ?? "",
             }));
             setCustomersList(list);
             if(list.find(c => String(c.id) === String(newId))) {
                 setCustomer(newId);
             }
         }
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- FETCH SALE FOR EDIT ---
  useEffect(() => {
    if (id) {
      fetchSaleDetails(id);
    }
  }, [id]);

  const fetchSaleDetails = async (saleId) => {
    try {
      const res = await getQuotationByIdApi(saleId);
      if (res.status === 200) {
        // server may return { quotation, details } or res.data.quotation
        const quotation = res.data?.quotation || res.data?.data || res.data?.records?.[0] || res.data;
        const details = res.data?.details || res.data?.items || quotation?.details || [];

        const isInactiveDB = quotation.IsActive == 0 || quotation.isActive == 0 || quotation.IsActive === false || quotation.isActive === false;
        if (isInactiveDB || location.state?.isInactive) {
          setInactiveView(true);
        }

        setCustomer(quotation.CustomerId ?? quotation.customerId ?? quotation.Customer ?? "");
        
        // Patch customersList if inactive customer is missing
        const cId = quotation.CustomerId ?? quotation.customerId ?? quotation.Customer;
        const cName = quotation.CustomerName || quotation.customerName || quotation.companyName || quotation.CompanyName;
        
        if (cId && cName) {
             setCustomersList(prev => {
                 if (!prev.find(c => String(c.id) === String(cId))) {
                     return [...prev, { id: cId, companyName: cName }];
                 }
                 return prev;
             });
        }

        // remove: payment account and invoice handling (not used)
        // setInvoiceNo(sale.VNo || "");
        if (quotation.Date) setDate(String(quotation.Date).split("T")[0]);
        setVehicleNo(quotation.VehicleNo || quotation.vehicleNo || ""); // ADDED
        setQuotationNo(quotation.QuotationNo || quotation.quotationNo || "");
        const expiryRaw = quotation.ExpiryDate || quotation.Expiry || quotation.expiryDate || quotation.Expiry_Date || null;
        if (expiryRaw) {
          try {
            setExpiryDate(String(expiryRaw).split("T")[0]);
          } catch {
            setExpiryDate(expiryRaw);
          }
        } else setExpiryDate("");

        setGlobalDiscount(quotation.Discount ?? quotation.discount ?? 0);
        setShippingCost(quotation.ShippingCost ?? quotation.shippingCost ?? 0);
        setNoTax((quotation.NoTax ?? quotation.noTax) === 1 || (quotation.NoTax ?? quotation.noTax) === true);
        setNoTax((quotation.NoTax ?? quotation.noTax) === 1 || (quotation.NoTax ?? quotation.noTax) === true);
        setDetails(quotation.Details ?? quotation.details ?? "");

        setTaxTypeId(quotation.TaxTypeId ?? quotation.taxTypeId ?? "");
        setIgstRate(quotation.IGSTRate ?? quotation.igstRate ?? 0);
        setCgstRate(quotation.CGSTRate ?? quotation.cgstRate ?? 0);
        setSgstRate(quotation.SGSTRate ?? quotation.sgstRate ?? 0);

        const mappedRows = (details || []).map(d => ({
          productId: d.productId ?? d.ProductId ?? d.ProductID ?? null,
          productName: d.productName ?? d.ProductName ?? d.Product_Name ?? d.Name ?? "",
          description: d.Description ?? d.description ?? d.descriptionText ?? "",
          unitId: d.unitId ?? d.UnitId ?? null,
          unitName: d.unitName ?? d.UnitName ?? d.unitName ?? "",
          quantity: d.Quantity ?? d.quantity ?? d.qty ?? 0,
          unitPrice: d.UnitPrice ?? d.unitPrice ?? d.Price ?? 0,
          discount: d.Discount ?? d.discount ?? 0,
          total: d.Total ?? d.total ?? 0,
          brandId: d.brandId || d.BrandId,
          taxPercentage: d.TaxPercentage ?? d.taxPercentage ?? 0
        }));
        setRows(mappedRows);
      }
    } catch (error) {
      console.error("Error fetching sale details", error);
      
      // FALLBACK
      if (location.state?.quotation) {
          const q = location.state.quotation;
          const raw = q.raw || {};
          
          setInactiveView(true);
          
          const cId = q.customerId || q.CustomerId || q.customer;
          setCustomer(cId);
          if (cId && q.customerName) {
              setCustomersList(prev => {
                 if (!prev.find(c => String(c.id) === String(cId))) {
                     return [...prev, { id: cId, companyName: q.customerName }];
                 }
                 return prev;
              });
          }
          
          if (q.date) setDate(q.date.split("T")[0]);
          if (q.expiryDate) setExpiryDate(q.expiryDate.split("T")[0]);
          
          setGlobalDiscount(q.discount || q.Discount || 0);
          setShippingCost(q.shippingCost || q.ShippingCost || 0);
          setDetails(typeof q.details === 'string' ? q.details : (raw.Details || ""));
          
          setCgstRate(q.cgstRate || 0);
          setSgstRate(q.sgstRate || 0);
          setIgstRate(q.igstRate || 0);
          
          const fallbackItems = raw.items || raw.details || [];
          if (Array.isArray(fallbackItems) && fallbackItems.length > 0) {
              const mappedRows = fallbackItems.map(d => ({
                  productId: d.productId || d.ProductId,
                  productName: d.productName || d.ProductName,
                  description: d.description || d.Description,
                  unitId: d.unitId || d.UnitId,
                  unitName: d.unitName || d.UnitName,
                  quantity: d.quantity || d.Quantity || 0,
                  unitPrice: d.unitPrice || d.UnitPrice || 0,
                  discount: d.discount || d.Discount || 0,
                  total: d.total || d.Total || 0,
                  brandId: d.brandId || d.BrandId,
                  taxPercentage: d.taxPercentage || d.TaxPercentage || 0
              }));
              setRows(mappedRows);
          } else {
              toast("Loaded Info (Items missing in inactive view)");
          }

      } else {
        toast.error("Failed to load quotation details");
      }
    }
  };
  const fetchCustomers = async () => {
    try {
      const res = await getCustomersApi(1, 1000);
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : [];
        const normalized = records.map((r) => ({
          id: r.id ?? r.Id ?? r.customerId ?? r.CustomerId ?? null,
          companyName: r.companyName ?? r.CompanyName ?? r.name ?? r.Name ?? "",
        }));
        setCustomersList(normalized);
      }
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await getBrandsApi(1, 1000);
      if (res.status === 200) setBrandsList(res.data.records || []);
    } catch (error) {
      console.error("Error fetching brands", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getProductsApi(1, 1000);
      if (res.status === 200) setProductsList(res.data.records || []);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await getUnitsApi(1, 1000);
      if (res.status === 200) setUnitsList(res.data.records || []);
    } catch (error) {
      console.error("Error fetching units", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategoriesApi(1, 1000);
      if (res.status === 200) setCategoriesList(res.data.records || []);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchTaxTypes = async () => {
      try {
          const res = await getTaxTypesApi();
          if (res.status === 200) {
              // Normalize to match NewSales logic
              const list = (res.data.records || []).map(t => ({
                  id: t.typeId,
                  name: `${t.isInterState ? "IGST" : "CGST/SGST"} - ${t.percentage}%`,
                  isInterState: t.isInterState,
                  percentage: t.percentage
              }));
              setTaxTypesList(list);
          }
      } catch(error) {
          console.error("Error fetching tax types", error);
      }
  };

   // --- AUTO POPULATE TAX RATES ---
  useEffect(() => {
    if (!taxTypeId) {
        setIgstRate(0);
        setCgstRate(0);
        setSgstRate(0);
        return;
    }
    const selected = taxTypesList.find(t => String(t.id || t.typeId) === String(taxTypeId));
    if (selected) {
        const pct = parseFloat(selected.percentage || selected.Percentage) || 0;
        const isInter = selected.isInterState || selected.IsInterState;
        
        if (isInter) {
            setIgstRate(pct);
            setCgstRate(0);
            setSgstRate(0);
        } else {
            setIgstRate(0);
            setCgstRate(pct / 2);
            setSgstRate(pct / 2);
        }
    }
  }, [taxTypeId, taxTypesList]);

  /* ================= ROW SYNC LOGIC ================= */
  // Sync existing rows with latest product master data when products load
  // Sync existing rows with latest product master data when products load
  useEffect(() => {
    if (productsList.length > 0 && rows.length > 0) {
       let changed = false;
       const newRows = rows.map(row => {
           const fresh = productsList.find(p => String(p.id) === String(row.productId));
           if (fresh) {
               let updatedRow = { ...row };
               let rowChanged = false;
               
               const freshName = fresh.ProductName ?? fresh.productName ?? fresh.name ?? "";
               // Update Product Name if changed in master
               if (freshName && freshName !== row.productName) {
                   updatedRow.productName = freshName;
                   rowChanged = true;
               }

               // Update Tax Percentage if missing in row (0) but exists in master
               const masterTax = fresh.taxPercentageValue ?? 0;
               const currentTax = parseFloat(row.taxPercentage) || 0;
               if (currentTax === 0 && masterTax > 0) {
                   updatedRow.taxPercentage = masterTax;
                   rowChanged = true;
               }

               if (rowChanged) {
                   changed = true;
                   return updatedRow;
               }
           }
           return row;
       });

       if (changed) {
           setRows(newRows);
       }
    }
  }, [productsList, rows]);

  /* ================= LINE ITEM LOGIC ================= */
  const handleProductSelect = (productId) => {
    const product = productsList.find(p => String(p.id) === String(productId));
    if (product) {
      setNewItem(prev => ({
        ...prev,
        productId: product.id,
        productName: product.ProductName ?? product.productName ?? product.name ?? "",
        unitId: product.UnitId ?? product.unitId ?? prev.unitId,
        unitName: product.unitName ?? product.unitName ?? prev.unitName,
        unitPrice: product.UnitPrice ?? product.unitPrice ?? prev.unitPrice,
        quantity: "",
        brandId: product.BrandId ?? product.brandId ?? prev.brandId,
        brandName: prev.brandName ?? "",
        taxPercentage: product.taxPercentageValue ?? 0,
        unitsInStock: product.UnitsInStock ?? 0
      }));
    } else {
      setNewItem(prev => ({ ...prev, productId }));
    }
  };

  const calculateItemTotal = () => {
    const qty = parseFloat(newItem.quantity) || 0;
    const price = parseFloat(newItem.unitPrice) || 0;
    const disc = parseFloat(newItem.discount) || 0;
    const total = (qty * price) - ((qty * price * disc) / 100);
    return total;
  };

  useEffect(() => {
    setNewItem(prev => ({ ...prev, total: calculateItemTotal() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newItem.quantity, newItem.unitPrice, newItem.discount]);

  const addItemToTable = () => {
    if (!newItem.productId) {
      toast.error("Please select a product");
      return;
    }
    if (newItem.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const descLen = newItem.description?.trim().length || 0;
    if (newItem.description && (descLen < 2 || descLen > 300)) return showErrorToast("Description must be between 2 and 300 characters");
    
    // STOCK CHECK
    if (Number(newItem.quantity) > Number(newItem.unitsInStock)) {
        if (Number(newItem.unitsInStock) <= 0) {
            toast.error("Out of Stock");
        } else {
            toast.error(`Insufficient stock. Available: ${newItem.unitsInStock}`);
        }
        return;
    }

    if (editingIndex !== null) {
      const updatedRows = [...rows];
      updatedRows[editingIndex] = newItem;
      setRows(updatedRows);
      setEditingIndex(null);
    } else {
      setRows([...rows, newItem]);
    }
    setIsItemModalOpen(false);
  };

  const editRow = (index) => {
    setEditingIndex(index);
    setNewItem(rows[index]);
    setIsItemModalOpen(true);
  };

  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  // --- QUICK CREATE BRAND ---
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return toast.error("Brand name required");
    try {
      // DUPLICATE CHECK
      const searchRes = await searchBrandApi(newBrandName.trim());
      if (searchRes?.status === 200) {
          const rows = searchRes.data.records || searchRes.data || [];
          const existing = rows.find(b => (b.name || "").toLowerCase() === newBrandName.trim().toLowerCase());
          if (existing) return toast.error("Brand Name already exists");
      }

      const res = await addBrandApi({ name: newBrandName, description: "", userId });
      if (res.status === 200) {
        toast.success("Brand added");

        // Optimistic update
        const created = res.data.record || res.data;
        if (created) {
           const normalized = {
               ...created,
               id: created.id || created.Id,
               name: created.name || created.Name 
           };
           setBrandsList(prev => [normalized, ...prev]);
           
           // Select it
           setNewItem(prev => ({ ...prev, brandId: normalized.id, productId: "", productName: "" }));
           
           if (isProductModalOpen) {
               setNewProductData(prev => ({ ...prev, brandId: normalized.id }));
           }
        }

        setIsBrandModalOpen(false);
        setNewBrandName("");
      }
    } catch (error) {
      toast.error("Failed to add brand");
    }
  };

  const handleEditBrandSave = async () => {
    if (!brandEditData.name?.trim()) return toast.error("Brand name required");
    try {
        const res = await updateBrandApi(brandEditData.id, { 
            name: brandEditData.name.trim(),
            BrandName: brandEditData.name.trim(),
            userId
        });
        if (res?.status === 200) {
             toast.success("Brand updated");
             setEditBrandModalOpen(false);
             fetchBrands();
        } else toast.error("Update failed");
    } catch(err) { console.error(err); toast.error("Server error"); }
  };

  // --- QUICK CREATE CUSTOMER REMOVED (Replaced by Navigation) ---
  // const handleCreateCustomer = async () => { ... }

  // --- QUICK CREATE PRODUCT ---
  const generateNextSNLocal = () => {
    const all = productsList;
    let max = 0;
    all.forEach((p) => {
      if (p && p.SN) {
        const m = p.SN.match(/^P0*(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > max) max = n;
        }
      }
    });
    const next = max + 1;
    return `P${String(next).padStart(6, "0")}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProductData((p) => ({ ...p, Image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const openProductModal = () => {
    const sn = generateNextSNLocal();
    setNewProductData({
      productCode: "",
      name: "",
      SN: sn,
      Model: "",
      price: "0.00",
      ReorderLevel: "10.00",
      CategoryId: "",
      unitId: "",
      brandId: newItem.brandId || "",
      Image: "",
      description: ""
    });
    setIsProductModalOpen(true);
  };

  const handleCreateProduct = async () => {
    if (!newProductData.name) return toast.error("Product name required");
    if (!newProductData.brandId) return toast.error("Brand required");
    if (!newProductData.unitId) return toast.error("Unit required");

    const payload = {
      Barcode: newProductData.productCode || null,
      SN: newProductData.SN,
      ProductName: newProductData.name,
      Model: newProductData.Model,
      UnitPrice: parseFloat(newProductData.price),
      UnitsInStock: 0,
      UnitsOnOrder: 0,
      ReorderLevel: parseFloat(newProductData.ReorderLevel),
      CategoryId: newProductData.CategoryId,
      UnitId: newProductData.unitId,
      BrandId: newProductData.brandId,
      Image: newProductData.Image,
      ProductDetails: newProductData.description,
      userId
    };

    try {
      // DUPLICATE CHECK
      const searchRes = await searchProductApi(newProductData.name.trim());
      if (searchRes?.status === 200) {
          const rows = searchRes.data.records || searchRes.data || [];
          const existingName = rows.find(p => (p.ProductName || "").toLowerCase() === newProductData.name.trim().toLowerCase());
          if (existingName) return toast.error("Product with this Name already exists");
      }

      if (newProductData.productCode?.trim()) {
           const codeRes = await searchProductApi(newProductData.productCode.trim());
           if (codeRes?.status === 200) {
              const rows = codeRes.data.records || codeRes.data || [];
              const existingCode = rows.find(p => (p.Barcode || "").toLowerCase() === newProductData.productCode.trim().toLowerCase());
              if (existingCode) return toast.error("Product with this Code already exists");
           }
      }

      const res = await addProductApi(payload);
      if (res.status === 200) {
        toast.success("Product added");
        
        const created = res.data.record || res.data;
        if (created) {
           const normalized = {
               ...created,
               id: created.id || created.Id,
               ProductName: created.ProductName || created.name,
               // Normalize other fields if needed
               UnitId: created.UnitId || created.unitId,
               unitName: created.unitName || created.UnitName,
               UnitPrice: created.UnitPrice || created.unitPrice,
               BrandId: created.BrandId || created.brandId,
               UnitsInStock: created.UnitsInStock || 0
           };
           
           // Try to fix unitName/BrandName if missing (as addProductApi might only return IDs)
           const unitObj = unitsList.find(u => String(u.id) === String(normalized.UnitId));
           if (unitObj) normalized.unitName = unitObj.name || unitObj.UnitName;
           
           const brandObj = brandsList.find(b => String(b.id) === String(normalized.BrandId));
           if (brandObj) normalized.brandName = brandObj.name || brandObj.BrandName;

           setProductsList(prev => [normalized, ...prev]);
           handleProductSelect(normalized.id);
        }
        
        setIsProductModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to add product");
    }
  };
  /* ================= TOTAL CALC ================= */
  useEffect(() => {
    let sumLineTotals = 0;
    let sumLineDiscounts = 0;

    rows.forEach((row) => {
      const qty = parseFloat(row.quantity) || 0;
      const price = parseFloat(row.unitPrice) || 0;
      const discPercent = parseFloat(row.discount) || 0;

      const lineBase = qty * price;
      const lineDisc = (lineBase * discPercent) / 100;
      const lineTotal = lineBase - lineDisc;

      sumLineTotals += lineTotal;
      sumLineDiscounts += lineDisc;
    });

    const subTotal = sumLineTotals;
    const gDiscount = parseFloat(globalDiscount) || 0;
    const shipping = parseFloat(shippingCost) || 0;

    let taxableAmount = subTotal - gDiscount;
    if (taxableAmount < 0) taxableAmount = 0;

    let tax = 0;
    if (!noTax) {
      // tax = (taxableAmount * 0.10); // 10% VAT
      const igst = (taxableAmount * igstRate) / 100;
      const cgst = (taxableAmount * cgstRate) / 100;
      const sgst = (taxableAmount * sgstRate) / 100;
      tax = igst + cgst + sgst;
    }

    const finalTotal = taxableAmount + tax + shipping;

    setNetTotal(finalTotal);
    setGrandTotal(subTotal);
    setTaxAmount(tax);
    setTotalDiscount(sumLineDiscounts + gDiscount);

    // removed paid/due/change update logic
  }, [rows, globalDiscount, shippingCost, noTax, igstRate, cgstRate, sgstRate]);

  /* ================= SAVE / UPDATE SALE (Quotation) ================= */

const handleSaveQuotation = async () => {
  const currentUserId = userData?.userId || userData?.id || userData?.Id;

  if (!currentUserId) {
    console.error("User ID missing from session data:", userData);
    return toast.error("User session invalid. Please re-login.");
  }

  if (loading) return;

  if (!customer) return toast.error("Please select a customer");
  if (!expiryDate) return toast.error("Please select expiry date");
  if (!noTax && !taxTypeId) return toast.error("Tax Type is required");
  if (rows.length === 0) return toast.error("Please add at least one item");

  if (vehicleNo && vehicleNo.length > 20) return showErrorToast("Vehicle No must be max 20 characters");

  const detailsLen = details?.trim().length || 0;
  if (details && (detailsLen < 2 || detailsLen > 300)) return showErrorToast("Details must be between 2 and 300 characters");

  setLoading(true);

  const payload = {
    customerId: customer,
    quotationNo,
    vehicleNo, // ADDED
    date,
    expiryDate,

    discount: parseFloat(globalDiscount) || 0,
    totalDiscount: parseFloat(totalDiscount) || 0,

    vat: parseFloat(taxAmount) || 0,
    totalTax: parseFloat(taxAmount) || 0,
    vatPercentage: 0,
    noTax: noTax ? 1 : 0,
    vatType: "GST",

    taxTypeId: taxTypeId || null,
    igstRate: parseFloat(igstRate) || 0,
    cgstRate: parseFloat(cgstRate) || 0,
    sgstRate: parseFloat(sgstRate) || 0,

    shippingCost: parseFloat(shippingCost) || 0,
    grandTotal: parseFloat(grandTotal) || 0,
    netTotal: parseFloat(netTotal) || 0,

    details,

    items: rows.map(r => ({
      productId: r.productId,
      productName: r.productName,
      description: r.description,
      unitId: r.unitId,
      unitName: r.unitName,
      quantity: parseFloat(r.quantity) || 0,
      unitPrice: parseFloat(r.unitPrice) || 0,
      discount: parseFloat(r.discount) || 0,
      total: parseFloat(r.total) || 0
    })),

    userId: currentUserId
  };

  try {
    const res = await addQuotationApi(payload);
    if (res.status === 200) {
      toast.success("Quotation added successfully");
      navigate("/app/sales/salesquotations");
    } else {
      toast.error("Failed to add quotation");
    }
  } catch (error) {
    console.error("SAVE QUOTATION ERROR:", error);
    if (error.response && error.response.data && error.response.data.message) {
        const msg = error.response.data.message.toLowerCase();
        if (msg.includes("insufficient stock") || msg.includes("out of stock") || msg.includes("not enough stock")) {
            toast.error("Out of Stock");
        } else {
            toast.error(error.response.data.message);
        }
    } else {
        toast.error("Error saving quotation");
    }
  } finally {
    setLoading(false);
  }
};

/* ================= UPDATE QUOTATION ================= */
const handleUpdateQuotation = async () => {
  if (loading) return;
  if (!customer) return toast.error("Please select a customer");
  if (!expiryDate) return toast.error("Please select expiry date");
  if (!noTax && !taxTypeId) return toast.error("Tax Type is required");
  if (rows.length === 0) return toast.error("Please add at least one item");

  if (vehicleNo && vehicleNo.length > 15) return showErrorToast("Vehicle No must be max 15 characters");

  const detailsLen = details?.trim().length || 0;
  if (details && (detailsLen < 2 || detailsLen > 300)) return showErrorToast("Details must be between 2 and 300 characters");

  setLoading(true);

  const payload = {
    customerId: customer,
    vehicleNo, // ADDED
    date,
    expiryDate,

    discount: parseFloat(globalDiscount) || 0,
    totalDiscount: parseFloat(totalDiscount) || 0,

    vat: parseFloat(taxAmount) || 0,
    totalTax: parseFloat(taxAmount) || 0,
    vatPercentage: 0,
    noTax: noTax ? 1 : 0,
    vatType: "GST",

    taxTypeId: taxTypeId || null,
    igstRate: parseFloat(igstRate) || 0,
    cgstRate: parseFloat(cgstRate) || 0,
    sgstRate: parseFloat(sgstRate) || 0,

    shippingCost: parseFloat(shippingCost) || 0,
    grandTotal: parseFloat(grandTotal) || 0,
    netTotal: parseFloat(netTotal) || 0,

    details,

    items: rows.map(r => ({
      productId: r.productId,
      productName: r.productName,
      description: r.description,
      unitId: r.unitId,
      unitName: r.unitName,
      quantity: parseFloat(r.quantity) || 0,
      unitPrice: parseFloat(r.unitPrice) || 0,
      discount: parseFloat(r.discount) || 0,
      total: parseFloat(r.total) || 0
    })),

    userId
  };

  try {
    const res = await updateQuotationApi(id, payload);
    if (res.status === 200) {
      toast.success("Quotation updated successfully");
      navigate("/app/sales/salesquotations");
    } else {
      toast.error("Failed to update quotation");
    }
  } catch (error) {
    console.error("UPDATE QUOTATION ERROR:", error);
    if (error.response && error.response.data && error.response.data.message) {
        const msg = error.response.data.message.toLowerCase();
        if (msg.includes("insufficient stock") || msg.includes("out of stock") || msg.includes("not enough stock")) {
            toast.error("Out of Stock");
        } else {
            toast.error(error.response.data.message);
        }
    } else {
        toast.error("Error updating quotation");
    }
  } finally {
    setLoading(false);
  }
};

/* ================= DELETE QUOTATION ================= */
const handleDeleteQuotation = async () => {
    const result = await showDeleteConfirm('quotation');

    if (!result.isConfirmed) return;

    const toastId = showLoadingToast("Deleting...");
    setLoading(true);

  try {
    const res = await deleteQuotationApi(id, { userId });
    dismissToast(toastId);

    if (res.status === 200) {
        showSuccessToast("Quotation deleted successfully.");
      navigate("/app/sales/salesquotations");
    } else {
        showErrorToast("Failed to delete quotation");
    }
  } catch (error) {
    dismissToast(toastId);
    console.error("DELETE QUOTATION ERROR:", error);
    showErrorToast("Error deleting quotation");
  } finally {
      setLoading(false);
  }
};

const handleRestoreQuotation = async () => {
    const result = await showRestoreConfirm('quotation');

    if (!result.isConfirmed) return;

    const toastId = showLoadingToast("Restoring...");
    setLoading(true);

    try {
      const res = await restoreQuotationApi(id, { userId });
      dismissToast(toastId);
      if (res.status === 200) {
        showSuccessToast("Quotation restored successfully.");
        navigate("/app/sales/salesquotations");
      } else {
        showErrorToast("Failed to restore quotation");
      }
    } catch (error) {
      dismissToast(toastId);
      console.error("RESTORE ERROR", error);
      showErrorToast("Error restoring quotation");
    } finally {
        setLoading(false);
    }
};



  const openItemModal = () => {
    setEditingIndex(null);
    setNewItem({
      brandId: "",
      brandName: "",
      productId: "",
      productName: "",
      description: "",
      unitId: "",
      unitName: "",
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      taxPercentage: taxTypeId ? (igstRate + cgstRate + sgstRate) : 0,
      total: 0,
      unitsInStock: 0
    });
    setIsItemModalOpen(true);
  };


  /* ================= UI ================= */
  return (
    <PageLayout>
      <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>

        <ContentCard className="!h-auto !overflow-visible">
        {/* HEADER & ACTIONS */}
        <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate("/app/sales/salesquotations")} className={`${theme === 'emerald' ? 'hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50  hover:bg-purple-100 text-purple-800' : 'hover:bg-gray-700'} p-2 rounded-full`}>
                    <ArrowLeft size={24} />
                </button>
                <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE] bg-clip-text text-transparent bg-gradient-to-r from-[#6448AE] to-[#8066a3]' : theme === 'emerald' ? 'text-gray-800' : 'text-white'}`}>
                    {inactiveView ? "View Inactive Quotation" : (id ? "Edit Quotation" : "New Quotation")}
                </h2>
            </div>
            
            {/* ACTIONS BAR */}
            <div className="flex items-center gap-3">
                {id ? (
                    <>
                    {!inactiveView && hasPermission(PERMISSIONS.SALES.EDIT) && (
                    <button 
                        onClick={handleUpdateQuotation} 
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                            theme === 'emerald'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : theme === 'purple'
                            ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md'
                            : 'bg-gray-800 border border-gray-600 text-blue-300'
                        }`}
                    >
                        {loading ? (
                            <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...
                            </>
                        ) : (
                            <>
                            <Save size={18} /> Update
                            </>
                        )}
                    </button>
                    )}
                    {!inactiveView && hasPermission(PERMISSIONS.SALES.DELETE) && (
                    <button onClick={handleDeleteQuotation} disabled={loading} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-500'}`}>
                        <Trash2 size={18} /> Delete
                    </button>
                    )}
                    {inactiveView && (
                        <button onClick={handleRestoreQuotation} disabled={loading} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-green-600 text-white hover:bg-green-500'}`}>
                            <ArchiveRestore size={18} /> Restore
                        </button>
                    )}
                    </>
                ) : (
                    hasPermission(PERMISSIONS.SALES.CREATE) && (
                    <button 
                    onClick={handleSaveQuotation} 
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                        theme === 'emerald'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : theme === 'purple'
                        ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md'
                        : 'bg-gray-800 border border-gray-600 text-blue-300'
                    }`}
                    >
                        {loading ? (
                            <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                            <Save size={18} /> Save
                            </>
                        )}
                    </button>
                    )
                )}
            </div>
        </div>
        <hr className="mb-4 border-gray-300" />


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LEFT COL - Customer & Tax Type */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="flex items-center">
              <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                Customer <span className="text-dark">*</span>
              </label>
                 <div className="flex-1 flex items-center gap-2">
                <SearchableSelect
                  options={customersList.map(c => ({ id: c.id, name: c.companyName }))}
                  value={customer}
                  onChange={setCustomer}
                  placeholder="Select customer..."
                  className={`flex-1 font-medium ${theme === 'emerald' ? 'bg-white text-emerald-900' : theme === 'purple' ? 'bg-white text-purple-800' : 'bg-gray-800'}`}
                  disabled={inactiveView}
                />
                {!inactiveView && (
                    <>
                    {customer ? (
                        <button
                            type="button"
                            className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                            onClick={() => navigate(`/app/businesspartners/newcustomer/${customer}`, { state: { returnTo: location.pathname } })}
                        >
                            <Pencil size={16} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                            onClick={() => navigate("/app/businesspartners/newcustomer", { state: { returnTo: location.pathname } })}
                        >
                            <Star size={16} />
                        </button>
                    )}
                    </>
                )}
              </div>
            </div>

            {/* Tax Type */}
            <div className="flex items-center">
              <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                 Tax Type <span className="text-dark">*</span> 
              </label>
              <div className="flex-1 flex items-center gap-2">
                  <SearchableSelect
                    options={taxTypesList.map(t => ({ id: t.id || t.typeId, name: `${t.name || t.typeName} (${t.percentage}%)` }))}
                    value={taxTypeId}
                    onChange={(val) => setTaxTypeId(val)}
                    placeholder="--Select--"
                    disabled={inactiveView || noTax}
                    className={`flex-1 font-medium ${theme === 'emerald' ? 'bg-white text-emerald-900' : theme === 'purple' ? 'bg-white text-purple-800' : 'bg-gray-800'}`}
                  />
                  {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible">
                        <Star size={16} />
                    </div>
                  )}
              </div>
            </div>

            {/* Vehicle No - Moved to Left */}
            <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Vehicle No</label>
               <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 font-medium">
                       <InputField
                         value={vehicleNo}
                         onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                         placeholder="Enter Vehicle No"
                         disabled={inactiveView}
                       />
                   </div>
                   {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible">
                        <Star size={16} />
                    </div>
                   )}
               </div>
            </div>
          </div>

          {/* RIGHT COL - Dates */}
          <div className="space-y-4">
            {/* Quotation No */}
            <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Quotation No</label>
               <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 font-medium">
                       <InputField
                         value={quotationNo}
                         onChange={(e) => setQuotationNo(e.target.value)}
                         readOnly={true}
                         className="bg-gray-100 text-gray-500 cursor-not-allowed" // Make it look read-only
                       />
                   </div>
                   {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible">
                        <Star size={16} />
                    </div>
                   )}
               </div>
            </div>

            {/* Quotation Date */}
            <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Quotation Date</label>
               <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 font-medium">
                       <InputField
                         type="date"
                         value={date}
                         onChange={(e) => setDate(e.target.value)}
                         disabled={inactiveView}
                       />
                   </div>
                   {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible">
                        <Star size={16} />
                    </div>
                   )}
               </div>
            </div>

            {/* Valid Until */}
            <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                Valid Until <span className="text-dark">*</span>
               </label>
               <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 font-medium">
                       <InputField
                         type="date"
                         value={expiryDate}
                         onChange={(e) => setExpiryDate(e.target.value)}
                         disabled={inactiveView}
                       />
                   </div>
                   {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible">
                        <Star size={16} />
                    </div>
                   )}
               </div>
            </div>
          </div>
        </div>

        {/* LINE ITEMS SECTION */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <label className={`text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Line Items</label>
            {!inactiveView && (
            <button
              onClick={openItemModal}
              className={`flex items-center gap-2 px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md' : 'bg-gray-800 border-gray-600 text-blue-300 hover:bg-gray-700'}`}
            >
              <Plus size={16} /> Add
            </button>
            )}
          </div>

          <div className={`border rounded overflow-hidden min-w-[900px] ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-800 border-gray-700'}`}>
            <table className="w-full text-sm text-left">
              <thead className={`${theme === 'emerald' ? 'bg-emerald-50 text-emerald-700' : theme === 'purple' ? 'bg-purple-50 text-purple-700' : 'bg-gray-700 text-gray-300'} font-medium border-b ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-600'}`}>
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Unit Name</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Discount (%)</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'emerald' || theme === 'purple' ? 'divide-gray-100' : 'divide-gray-700'}`}>
                {rows.map((row, i) => (
                  <tr key={i} className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-gray-750'}`}>
                    <td className="p-3">{row.productName}</td>
                    <td className="p-3">{row.description}</td>
                    <td className="p-3">{row.unitName}</td>
                    <td className="p-3">{row.quantity}</td>
                    <td className="p-3">{row.unitPrice}</td>
                    <td className="p-3">{row.discount}</td>
                    <td className={`p-3 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>{parseFloat(row.total).toFixed(2)}</td>
                    <td className="p-3 text-center flex items-center justify-center gap-2">
                        {!inactiveView && (
                          <>
                        <Edit
                            size={18}
                            className="text-blue-400 cursor-pointer hover:text-blue-300"
                            onClick={() => editRow(i)}
                        />
                        <Trash2
                            size={18}
                            className="text-red-400 cursor-pointer hover:text-red-300"
                            onClick={() => deleteRow(i)}
                        />
                        </>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No items added. Click "+ Add" to start.
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION - MATCHING NEWSALE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: DETAILS (Spans 4) */}
          <div className="lg:col-span-4 flex flex-col">
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
               Details
             </label>
              <div className="flex-1 font-medium">
                <InputField
                    textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full h-full min-h-[440px] resize-none"
                    disabled={inactiveView}
                />
             </div>
          </div>

          {/* RIGHT: TOTALS (Spans 8) */}
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Grand Total */}
                {/* Net Total (Moved to Top) */}
                <div>
                   <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Taxable Amount</label>
                   <div className={`w-full border rounded px-3 py-2 text-right font-bold ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
                      {grandTotal.toFixed(2)}
                   </div>
                </div>

                {/* Total Tax */}
                <div>
                   <div className="flex justify-between mb-1">
                      <label className={`block text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Tax</label>
                      <div className="flex items-center gap-2">
                          <label className={`text-xs ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`}>No Tax</label>
                          <input
                            type="checkbox"
                            checked={noTax}
                            onChange={(e) => setNoTax(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 disabled:opacity-50"
                            disabled={inactiveView}
                          />
                      </div>
                   </div>
                   <div className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
                      {noTax ? "0.00" : taxAmount.toFixed(2)}
                   </div>
                </div>

                {/* Discount (Input) */}
                <div>
                    <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Discount</label>
                    <InputField
                        type="number"
                        value={globalDiscount}
                        onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
                        disabled={inactiveView}
                        className="text-right w-full"
                    />
                </div>

                {/* Total Discount (ReadOnly) */}
                <div>
                   <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Discount</label>
                   <div className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
                      {totalDiscount.toFixed(2)}
                   </div>
                </div>

                {/* Shipping Cost */}
                <div>
                    <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Shipping Cost</label>
                    <InputField
                        type="number"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                        disabled={inactiveView}
                        className="text-right w-full"
                    />
                </div>

                {/* Empty Placeholder or Tax Breakdown Start? */}
                 {/* Tax Logic */}
                 {!noTax && taxTypeId && (() => {
                     const selectedTax = taxTypesList.find(t => String(t.id) === String(taxTypeId) || String(t.typeId) === String(taxTypeId));
                     if(!selectedTax) return null;
                     
                     if(selectedTax.isInterState) {
                       return (
                         <div className="md:col-span-1"> {/* Or col-span-2 if needed */}
                           <label className="block text-sm mb-1 text-gray-500">IGST ({igstRate}%)</label>
                           <div className={`w-full border rounded px-3 py-2 text-right cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                              {((grandTotal - globalDiscount) * igstRate / 100).toFixed(2)}
                           </div>
                         </div>
                       );
                     } else {
                       return (
                         <>
                           <div>
                              <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>CGST ({cgstRate}%)</label>
                              <div className={`w-full border rounded px-3 py-2 text-right cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                                 {((grandTotal - globalDiscount) * cgstRate / 100).toFixed(2)}
                              </div>
                           </div>
                           <div>
                              <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>SGST ({sgstRate}%)</label>
                              <div className={`w-full border rounded px-3 py-2 text-right cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                                 {((grandTotal - globalDiscount) * sgstRate / 100).toFixed(2)}
                              </div>
                           </div>
                         </>
                       );
                     }
                 })()}

                {/* Net Total (Full Width) */}
                {/* Taxable Amount (Formerly Grand Total, Moved to Bottom) */}
                <div className="md:col-span-2 mt-2">
                    <label className={`block text-sm font-bold mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>Grand Total</label>
                    <div className={`w-full border rounded px-4 py-3 text-right font-bold text-2xl ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-600 text-white'}`}>
                      {netTotal.toFixed(2)}
                    </div>
                </div>

             </div>
          </div>
        </div>

       </ContentCard>
      </div>

      {/* --- ADD ITEM MODAL --- */}
      <AddModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={addItemToTable}
        title={editingIndex !== null ? "Edit Line Item" : "Add Line Item"}
        saveText={editingIndex !== null ? "Update" : "Save"}
        width="700px"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand */}
          <div>
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}> Brand *</label>
            <div className="flex items-center gap-2">
              <SearchableSelect
                options={brandsList.map(b => ({ id: b.id, name: b.name }))}
                value={newItem.brandId}
                onChange={(val) => setNewItem({ ...newItem, brandId: val, productId: "", productName: "" })}
                placeholder="--select brand--"
                className={`flex-1 font-medium ${theme === 'emerald' ? 'bg-white text-emerald-900' : theme === 'purple' ? 'bg-white text-purple-800' : 'bg-gray-800'}`}
              />
              <button
                 type="button"
                 className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                 onClick={() => {
                     if (newItem.brandId) {
                         const b = brandsList.find(x => String(x.id) === String(newItem.brandId));
                         setBrandEditData({ id: newItem.brandId, name: b?.name || "" });
                         setEditBrandModalOpen(true);
                     } else {
                         setIsBrandModalOpen(true);
                     }
                 }}
              >
                  {newItem.brandId ? <Pencil size={16} /> : <Star size={16} />}
              </button>
            </div>
          </div>

          {/* Product */}
          <div>
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Product *</label>
            <div className="flex items-center gap-2">
              <SearchableSelect
                options={productsList
                  .filter(p => String(p.BrandId ?? p.brandId) === String(newItem.brandId))
                  .map(p => ({ id: p.id, name: p.ProductName }))
                }
                value={newItem.productId}
                onChange={handleProductSelect}
                placeholder="--select product--"
                disabled={!newItem.brandId}
                required
                className={`flex-1 font-medium ${!newItem.brandId ? 'opacity-50 pointer-events-none' : ''} ${theme === 'emerald' ? 'bg-white text-emerald-900' : theme === 'purple' ? 'bg-white text-purple-800' : 'bg-gray-800'}`}
              />
               <button
                  type="button"
                  disabled={!newItem.brandId && !newItem.productId} // Allow if brand selected (for add) OR product selected (for edit)
                  className={`p-2 border rounded flex items-center justify-center ${
                      (!newItem.brandId && !newItem.productId)
                       ? 'opacity-50 cursor-not-allowed ' + (theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-800 border-gray-600 text-gray-500')
                       : (theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400')
                  }`}
                  onClick={() => {
                    if (newItem.productId) {
                         // EDIT PRODUCT NAV
                         navigate(`/app/inventory/newproduct/${newItem.productId}`, { state: { returnTo: location.pathname, preserveState: true } });
                    } else if (newItem.brandId) {
                         // ADD PRODUCT
                         setNewProductData(prev => ({ ...prev, brandId: newItem.brandId }));
                         openProductModal();
                    }
                  }}
               >
                   {newItem.productId ? <Pencil size={16} /> : <Star size={16} />}
               </button>
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <InputField
              textarea
              label="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
          </div>

          {/* Quantity */}
          <div>
            <InputField
              type="number"
              label="Quantity *"
               className="font-medium"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
          </div>

          {/* Unit Price */}
          <div>
            <InputField
              type="number"
              label="Unit Price"
               className="font-medium"
              value={newItem.unitPrice}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
            />
          </div>

          {/* Discount */}
          <div>
            <InputField
              type="number"
              label="Discount (%)"
               className="font-medium"
              value={newItem.discount}
              onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
            />
          </div>

          {/* Unit (Read Only) */}
          <div>
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Unit</label>
            <InputField
              type="text"
              value={newItem.unitName}
              readOnly
              className="font-medium"
            />
          </div>

          {/* Tax Percentage (Read Only) */}
          <div>
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Tax Percentage (%)</label>
            <InputField
              type="text"
              value={newItem.taxPercentage}
              readOnly
              className="font-medium"
            />
          </div>
        </div>
      </AddModal>

      {/* --- ADD BRAND MODAL --- */}
      <AddModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSave={handleCreateBrand}
        title="Add New Brand"
        width="400px"
      >
        <InputField
            label="Brand Name"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="Brand Name"
            className="mb-4"
        />
      </AddModal>

      {/* --- ADD CUSTOMER MODAL REMOVED (Replaced by navigation) --- */}

      {/* --- ADD PRODUCT MODAL --- */}
      <AddModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleCreateProduct}
        title="Add New Product"
        width="800px"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
              label="Product Code"
              value={newProductData.productCode}
              onChange={(e) => setNewProductData({ ...newProductData, productCode: e.target.value })}
              placeholder="Product Code"
          />

          <InputField
              label="Product Name"
              required
              value={newProductData.name}
              onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
              placeholder="Product Name"
          />

          <InputField
            label="SN"
            readOnly
            value={newProductData.SN}
            disabled
            className="cursor-not-allowed"
          />

          <InputField
            label="Model"
            value={newProductData.Model}
            onChange={(e) => setNewProductData({ ...newProductData, Model: e.target.value })}
            placeholder="Model"
          />

          <InputField
            type="number"
            label="Unit Price *"
            value={newProductData.price}
            onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
          />

          <InputField
            type="number"
            label="Reorder Level"
            value={newProductData.ReorderLevel}
            onChange={(e) => setNewProductData({ ...newProductData, ReorderLevel: e.target.value })}
          />

          {/* CATEGORY */}
          <div className="relative">
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Category *</label>
             <SearchableSelect
                options={categoriesList.map(c => ({ id: c.id, name: c.name }))}
                value={newProductData.CategoryId}
                onChange={(val) => setNewProductData({ ...newProductData, CategoryId: val })}
                placeholder="--select--"
                className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
             />
          </div>

          {/* UNIT */}
          <div className="relative">
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Unit *</label>
             <SearchableSelect
                options={unitsList.map(u => ({ id: u.id, name: u.name }))}
                value={newProductData.unitId}
                onChange={(val) => setNewProductData({ ...newProductData, unitId: val })}
                placeholder="--select--"
                className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
             />
          </div>

          {/* BRAND */}
          <div className="relative">
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Brand *</label>
             <SearchableSelect
                options={brandsList.map(b => ({ id: b.id, name: b.name }))}
                value={newProductData.brandId}
                onChange={(val) => setNewProductData({ ...newProductData, brandId: val })}
                placeholder="--select--"
                className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
             />
          </div>

          <div className="md:col-span-2">
            <InputField
               label="Description"
               value={newProductData.description}
               onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
            />
          </div>
        </div>
      </AddModal>

      {/* --- EDIT BRAND MODAL --- */}
      <AddModal
            isOpen={editBrandModalOpen}
            onClose={() => setEditBrandModalOpen(false)}
            onSave={handleEditBrandSave}
            title={`Edit Brand (${brandEditData.name})`}
            saveText="Save"
            width="400px"
        >
            <InputField value={brandEditData.name} onChange={e => setBrandEditData(p => ({...p, name: e.target.value}))} autoFocus required />
        </AddModal>
    </PageLayout>
  );
};

export default NewSaleQuotation;
