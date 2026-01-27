// src/pages/sales/NewSale.jsx
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
  Check,
  ArchiveRestore
} from "lucide-react";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from "../../utils/notificationUtils";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  addSaleApi,
  addBrandApi,
  addCustomerApi,
  addProductApi,
  getUnitsApi,
  getCategoriesApi,
  getSaleByIdApi,
  updateSaleApi,
  deleteSaleApi,
  restoreSaleApi,
  getTaxTypesApi,
  searchSaleApi,
  searchBrandApi,
  updateBrandApi, // Added
  searchProductApi,
  getNextInvoiceNoApi
} from "../../services/allAPI";
import { useDashboard } from "../../context/DashboardContext";
import { useTheme } from "../../context/ThemeContext";

const NewSale = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { invalidateDashboard } = useDashboard();
  
  const [inactiveView, setInactiveView] = useState(false);

  useEffect(() => {
    if (location.state?.isInactive) {
      setInactiveView(true);
    }
  }, [location.state]);
  
  useEffect(() => {
    if (!id) {
       getNextInvoiceNoApi().then(res => {
           if(res.status === 200 && res.data?.nextNo) {
               setInvoiceNo(res.data.nextNo);
           }
       }).catch(err => console.error(err));
    }
  }, [id]);

  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  // --- TOP SECTION STATE ---
  const [customer, setCustomer] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [taxTypeId, setTaxTypeId] = useState("");

  // --- DROPDOWN DATA ---
  const [customersList, setCustomersList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [taxTypesList, setTaxTypesList] = useState([]);

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
    total: 0,
    purchasePrice: 0 // Added for backend validation
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


const [openCustomer, setOpenCustomer] = useState(false);
const [customerSearch, setCustomerSearch] = useState("");
const customerRef = useRef(null);


useEffect(() => {
  const handler = (e) => {
    if (customerRef.current && !customerRef.current.contains(e.target)) {
      setOpenCustomer(false);
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);


const [openBrand, setOpenBrand] = useState(false);
const [brandSearch, setBrandSearch] = useState("");

const [openProduct, setOpenProduct] = useState(false);
const [productSearch, setProductSearch] = useState("");

const brandRef = useRef(null);
const productRef = useRef(null);


useEffect(() => {
  const h = (e) => {
    if (brandRef.current && !brandRef.current.contains(e.target)) setOpenBrand(false);
    if (productRef.current && !productRef.current.contains(e.target)) setOpenProduct(false);
  };
  document.addEventListener("mousedown", h);
  return () => document.removeEventListener("mousedown", h);
}, []);


/* ================= PRODUCT MODAL DROPDOWNS ================= */

// CATEGORY
const [openCategory, setOpenCategory] = useState(false);
const [categorySearch, setCategorySearch] = useState("");
const categoryRef = useRef(null);

// UNIT
const [openUnit, setOpenUnit] = useState(false);
const [unitSearch, setUnitSearch] = useState("");
const unitRef = useRef(null);

// BRAND (inside product modal)
const [openBrandProduct, setOpenBrandProduct] = useState(false);
const [brandProductSearch, setBrandProductSearch] = useState("");
const brandProductRef = useRef(null);


useEffect(() => {
  const handler = (e) => {
    if (categoryRef.current && !categoryRef.current.contains(e.target)) {
      setOpenCategory(false);
    }
    if (unitRef.current && !unitRef.current.contains(e.target)) {
      setOpenUnit(false);
    }
    if (brandProductRef.current && !brandProductRef.current.contains(e.target)) {
      setOpenBrandProduct(false);
    }
  };

  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);




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
  const [unitsList, setUnitsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  // --- BOTTOM SECTION STATE ---
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [noTax, setNoTax] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState("");

  // --- CALCULATED VALUES ---
  const [netTotal, setNetTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  
  // --- TAX RATES ---
  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);
  const [igstRate, setIgstRate] = useState(0);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    fetchCustomers();
    fetchBrands();
    fetchProducts();
    fetchUnits();
    fetchProducts();
    fetchUnits();
    fetchCategories();
    fetchTaxTypes();
  }, []);

  // --- AUTO SET RATES ---
  useEffect(() => {
    if (!taxTypeId) {
        setCgstRate(0);
        setSgstRate(0);
        setIgstRate(0);
        return;
    }
    const selected = taxTypesList.find(t => String(t.id) === String(taxTypeId));
    if (selected) {
        const pct = parseFloat(selected.percentage) || 0;
        if (selected.isInterState) {
            setIgstRate(pct);
            setCgstRate(0);
            setSgstRate(0);
        } else {
            const half = pct / 2;
            setCgstRate(half);
            setSgstRate(half);
            setIgstRate(0);
        }
    }
  }, [taxTypeId, taxTypesList]);

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
      const res = await getSaleByIdApi(saleId);
      if (res.status === 200) {
        const { sale, details } = res.data;
        
        // Check inactive status (handling DB bit/boolean/number types)
        const isInactiveDB = sale.IsActive == 0 || sale.isActive == 0 || sale.IsActive === false || sale.isActive === false;
        
        if (isInactiveDB || location.state?.isInactive) {
          setInactiveView(true);
        }

        setCustomer(sale.CustomerId);

        // Patch customersList if inactive customer is missing
        const cName = sale.CustomerName || sale.customerName || sale.companyName || sale.CompanyName;
        if (sale.CustomerId && cName) {
             setCustomersList(prev => {
                 if (!prev.find(c => String(c.id) === String(sale.CustomerId))) {
                     return [...prev, { id: sale.CustomerId, companyName: cName }];
                 }
                 return prev;
             });
        }

        setPaymentAccount(sale.PaymentAccount);
        setInvoiceNo(sale.VNo || "");
        setVehicleNo(sale.VehicleNo || "");
        setDate(sale.Date.split('T')[0]);
        setGlobalDiscount(sale.Discount);
        setShippingCost(sale.ShippingCost);
        setPaidAmount(sale.PaidAmount);
        setNoTax(sale.NoTax === 1);
        setDetails(sale.Details);

        setTaxTypeId(sale.TaxTypeId);
        setCgstRate(sale.CGSTRate || 0);
        setSgstRate(sale.SGSTRate || 0);
        setIgstRate(sale.IGSTRate || 0);

        // Map details to rows
        const mappedRows = details.map(d => ({
          productId: d.productId,
          productName: d.productName,
          description: d.Description,
          unitId: d.unitId ?? d.UnitId,
          unitName: d.unitName ?? d.UnitName,
          quantity: d.Quantity ?? d.quantity ?? 0,
          unitPrice: d.UnitPrice ?? d.unitPrice ?? 0,
          discount: d.Discount ?? d.discount ?? 0,
          total: d.Total ?? d.total ?? 0,
          brandId: d.brandId || d.BrandId,
          orderBookerId: d.OrderBookerId || d.orderBookerId,
          taxPercentage: d.TaxPercentage ?? d.taxPercentage ?? 0
        }));
        setRows(mappedRows);
      }
    } catch (error) {
      console.error("Error fetching sale details", error);
      
      // FALLBACK for inactive records if API fails
      if (location.state?.sale) {
          const s = location.state.sale;
          const raw = s.raw || {};
          
          setInactiveView(true);
          
          const cId = s.customerId || raw.CustomerId;
          setCustomer(cId);
          
          if (cId && s.customerName) {
              setCustomersList(prev => {
                 if (!prev.find(c => String(c.id) === String(cId))) {
                     return [...prev, { id: cId, companyName: s.customerName }];
                 }
                 return prev;
              });
          }
          
          setPaymentAccount(s.paymentAccount || raw.PaymentAccount || "");
          setInvoiceNo(s.invoiceNo || raw.VNo || "");
          setVehicleNo(s.vehicleNo || raw.VehicleNo || "");
          if (s.date) setDate(s.date.split("T")[0]);
          
          setGlobalDiscount(s.discount || raw.Discount || 0);
          setShippingCost(s.shippingCost || raw.ShippingCost || 0);
          setPaidAmount(s.paidAmount || raw.PaidAmount || 0);
          
          // s.details is typically a string remark in the list view
          setDetails(typeof s.details === 'string' ? s.details : (raw.Details || ""));

          setTaxTypeId(raw.TaxTypeId || "");
          setCgstRate(s.cgstRate || raw.CGSTRate || 0);
          setSgstRate(s.sgstRate || raw.SGSTRate || 0);
          setIgstRate(s.igstRate || raw.IGSTRate || 0);
          
          // Try to recover items from raw if present
          const fallbackItems = raw.details || raw.items || raw.SaleItems || [];
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
          toast.error("Failed to load sale details");
      }
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await getCustomersApi(1, 1000);
      console.log(res);
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
      const res = await getTaxTypesApi(1, 1000);
      if (res.status === 200) {
         // Normalize if needed, but the backend sends typed fields
         const list = res.data.records.map(t => ({
             id: t.typeId,
             name: `${t.isInterState ? "IGST" : "CGST/SGST"} - ${t.percentage}%`,
             isInterState: t.isInterState,
             percentage: t.percentage
         }));
         setTaxTypesList(list);
      }
    } catch (error) {
      console.error("Error fetching tax types", error);
    }
  };

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

               // Update Product Name if changed in master
               if (fresh.ProductName && fresh.ProductName !== row.productName) {
                   updatedRow.productName = fresh.ProductName;
                   rowChanged = true;
               }

               // Update Tax Percentage if missing in row (0) but exists in master
               // This handles "Edit" scenario where backend didn't return text percentage
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
        productName: product.ProductName,
        unitId: product.UnitId ?? product.unitId,
        unitName: product.unitName ?? product.UnitName,
        unitPrice: product.UnitPrice ?? product.unitPrice ?? product.price ?? 0,
        quantity: "", 
        brandId: product.BrandId || product.brandId || prev.brandId,
        brandName: product.brandName || product.BrandName || prev.brandName,
        taxPercentage: product.taxPercentageValue ?? 0,
        unitsInStock: product.UnitsInStock ?? 0,
        purchasePrice: product.PurchasePrice ?? product.purchasePrice ?? 0 // Capture Purchase Price
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
           
           // If we are in Product Create Modal, also select it there
           if (isProductModalOpen) {
               setNewProductData(prev => ({ ...prev, brandId: normalized.id }));
           }
        }

        setIsBrandModalOpen(false);
        setNewBrandName("");
      }
    } catch (error) {
      console.error(error);
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

  // reset dropdowns
  setOpenCategory(false);
  setOpenUnit(false);
  setOpenBrandProduct(false);
  setCategorySearch("");
  setUnitSearch("");
  setBrandProductSearch("");

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
               // Normalize other fields if needed for handleProductSelect
               UnitId: created.UnitId || created.unitId,
               unitName: created.unitName || created.UnitName, // might be missing if API doesn't populate
               UnitPrice: created.UnitPrice || created.unitPrice,
               BrandId: created.BrandId || created.brandId,
               UnitsInStock: created.UnitsInStock || 0
           };
           
           // Note: handleProductSelect expects the product to be in productsList to find unitName/brandName if not on object
           // So we might need to manually ensure those names are present if the API doesn't return joined data.
           // However, let's look at getProductsApi... it probably returns joined data.
           // addProductApi likely returns just the table record.
           // We can try to patch the names from our local lists (unitsList, brandsList)
           
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
      console.error(error);
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
    const paid = parseFloat(paidAmount) || 0;

    let taxableAmount = subTotal - gDiscount;
    if (taxableAmount < 0) taxableAmount = 0;

    let tax = 0;
    if (!noTax) {
       // Check selected tax type
       const selectedTax = taxTypesList.find(t => String(t.id) === String(taxTypeId));
       if (selectedTax) {
           if (selectedTax.isInterState) {
               tax = (taxableAmount * (parseFloat(igstRate) || 0)) / 100;
           } else {
               const c = parseFloat(cgstRate) || 0;
               const s = parseFloat(sgstRate) || 0;
               tax = (taxableAmount * (c + s)) / 100;
           }
       } else {
           // Fallback or No Tax Type selected -> maybe use 10% default? 
           // For now, if no tax type, we assume 0 or keep old logic? 
           // User requirement: Tax Type picklist. If selected... 
           // Let's stick to the new logic. If nothing selected, tax is 0.
           tax = 0; 
       }
    }

    const finalTotal = taxableAmount + tax + shipping;

    setNetTotal(subTotal);
    setGrandTotal(finalTotal);
    setTaxAmount(tax);
    setTotalDiscount(sumLineDiscounts + gDiscount);

    // Update Due and Change
    if (paid >= finalTotal) {
      setChangeAmount(paid - finalTotal);
      setDueAmount(0);
    } else {
      setChangeAmount(0);
      setDueAmount(finalTotal - paid);
    }

  }, [rows, globalDiscount, shippingCost, paidAmount, noTax, taxTypeId, cgstRate, sgstRate, igstRate, taxTypesList]);

  /* ================= SAVE / UPDATE SALE ================= */
  const handleSaveSale = async () => {
    if (loading) return;

    const currentUserId = userData?.userId || userData?.id || userData?.Id;
    
    if (!currentUserId) {
      console.error("User ID missing from session data:", userData);
      return toast.error("User session invalid. Please re-login.");
    }

    if (!customer) return toast.error("Please select a customer");
    if (!paymentAccount) return toast.error("Please select a payment account");
    if (!noTax && !taxTypeId) return toast.error("Tax Type is required");
    if (rows.length === 0) return toast.error("Please add at least one item");

    if (vehicleNo && vehicleNo.length > 20) return showErrorToast("Vehicle No must be max 20 characters");

    const detailsLen = details?.trim().length || 0;
    if (details && (detailsLen < 2 || detailsLen > 300)) return showErrorToast("Details must be between 2 and 300 characters");

    setLoading(true);

    // DUPLICATE CHECK FOR INVOICE NO
    if (invoiceNo && invoiceNo.trim() !== "") {
        try {
            const searchRes = await searchSaleApi(invoiceNo.trim());
            if (searchRes?.status === 200) {
                const rows = searchRes.data.records || searchRes.data || [];
                const existing = rows.find(s => 
                    (s.VNo || s.invoiceNo || "").toLowerCase() === invoiceNo.trim().toLowerCase()
                );
                if (existing) {
                  setLoading(false);
                  return toast.error("Invoice No already exists");
                }
            }
        } catch (e) {
            console.error("Duplicate Invoice Check Error", e);
        }
    }

    const payload = {
      customerId: customer,
      invoiceNo,
      vehicleNo,
      date,
      discount: parseFloat(globalDiscount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      shippingCost: parseFloat(shippingCost) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      netTotal: parseFloat(netTotal) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      due: parseFloat(dueAmount) || 0,
      change: parseFloat(changeAmount) || 0,
      details,
      paymentAccount,
      employeeId: null,
      vno: invoiceNo || "",
      vat: parseFloat(taxAmount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      vatPercentage: 0,
      noTax: noTax ? 1 : 0,
      vatType: "Percentage",
      taxTypeId,
      cgstRate,
      sgstRate,
      igstRate,
      items: rows.map(r => ({
        productId: r.productId,
        productName: r.productName,
        description: r.description,
        unitId: r.unitId,
        unitName: r.unitName,
        quantity: parseFloat(r.quantity) || 0,
        unitPrice: parseFloat(r.unitPrice) || 0,
        discount: parseFloat(r.discount) || 0,
        total: parseFloat(r.total) || 0,
        purchasePrice: parseFloat(r.purchasePrice) || 0
      })),
      userId: currentUserId
    };

    try {
      const res = await addSaleApi(payload);
      if (res.status === 200) {
        toast.success("Sale added successfully");
        invalidateDashboard();
        navigate("/app/sales/sales"); 
      } else {
        toast.error("Failed to add sale or Out of Stock");
      }
    } catch (error) {
      console.error("SAVE ERROR", error);
      if (error.response && error.response.data && error.response.data.message) {
        const msg = error.response.data.message.toLowerCase();
        if (msg.includes("insufficient stock") || msg.includes("out of stock") || msg.includes("not enough stock")) {
            toast.error("Out of Stock");
        } else {
            toast.error(error.response.data.message);
        }
      } else {
        toast.error("Error saving sale");
      }
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateSale = async () => {
    setLoading(true); // Added loading state
    if (!customer) { setLoading(false); return toast.error("Please select a customer"); }
    if (!paymentAccount) { setLoading(false); return toast.error("Please select a payment account"); }
    if (!noTax && !taxTypeId) { setLoading(false); return toast.error("Tax Type is required"); }
    if (rows.length === 0) { setLoading(false); return toast.error("Please add at least one item"); }

    if (vehicleNo && vehicleNo.length > 20) { setLoading(false); return showErrorToast("Vehicle No must be max 20 characters"); }

    const detailsLen = details?.trim().length || 0;
    if (details && (detailsLen < 2 || detailsLen > 300)) { setLoading(false); return showErrorToast("Details must be between 2 and 300 characters"); }

    // DUPLICATE CHECK FOR INVOICE NO
    if (invoiceNo && invoiceNo.trim() !== "") {
        try {
            const searchRes = await searchSaleApi(invoiceNo.trim());
            if (searchRes?.status === 200) {
                const rows = searchRes.data.records || searchRes.data || [];
                const existing = rows.find(s => 
                    (s.VNo || s.invoiceNo || "").toLowerCase() === invoiceNo.trim().toLowerCase() && 
                    (id ? String(s.id || s.Id || s.SaleId) !== String(id) : true)
                );
                if (existing) return toast.error("Invoice No already exists");
            }
        } catch (e) {
            console.error("Duplicate Invoice Check Error", e);
        }
    }

    const payload = {
      customerId: customer,
      invoiceNo,
      vehicleNo,
      date,
      discount: parseFloat(globalDiscount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      shippingCost: parseFloat(shippingCost) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      netTotal: parseFloat(netTotal) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      due: parseFloat(dueAmount) || 0,
      change: parseFloat(changeAmount) || 0,
      details,
      paymentAccount,
      employeeId: null,
      vno: invoiceNo || "",
      vat: parseFloat(taxAmount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      vatPercentage: 0,
      noTax: noTax ? 1 : 0,
      vatType: "Percentage",
      taxTypeId,
      cgstRate,
      sgstRate,
      igstRate,
      items: rows.map(r => ({
        productId: r.productId,
        productName: r.productName,
        description: r.description,
        unitId: r.unitId,
        unitName: r.unitName,
        quantity: parseFloat(r.quantity) || 0,
        unitPrice: parseFloat(r.unitPrice) || 0,
        discount: parseFloat(r.discount) || 0,
        total: parseFloat(r.total) || 0,
        purchasePrice: parseFloat(r.purchasePrice) || 0
      })),
      userId: userId
    };

    try {
      const res = await updateSaleApi(id, payload);
      if (res.status === 200) {
        toast.success("Sale updated successfully");
        invalidateDashboard();
        navigate("/app/sales/sales");
      } else {
        toast.error("Failed to update sale");
      }
    } catch (error) {
      console.error("UPDATE ERROR", error);
      if (error.response && error.response.data && error.response.data.message) {
        if (error.response.data.message.includes("Insufficient stock")) {
            toast.error("Out of Stock");
        } else {
            toast.error(error.response.data.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async () => {
    const result = await showDeleteConfirm('sale');

    if (!result.isConfirmed) return;

    const toastId = showLoadingToast("Deleting...");
    setLoading(true);

    try {
      const res = await deleteSaleApi(id, { userId });
      dismissToast(toastId);

      if (res.status === 200) {
        showSuccessToast("Sale deleted successfully.");
        navigate("/app/sales/sales");
      } else {
        showErrorToast("Failed to delete sale");
      }
    } catch (error) {
      dismissToast(toastId);
      console.error("DELETE SALE ERROR", error);
      showErrorToast("Error deleting sale");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSale = async () => {
    const result = await showRestoreConfirm('sale');

    if (!result.isConfirmed) return;

    const toastId = showLoadingToast("Restoring...");
    setLoading(true);

    try {
      const res = await restoreSaleApi(id, { userId });
      dismissToast(toastId);
      if (res.status === 200) {
        showSuccessToast("Sale restored successfully.");
        navigate("/app/sales/sales");
      } else {
        showErrorToast("Failed to restore sale");
      }
    } catch (error) {
      dismissToast(toastId);
      console.error("RESTORE ERROR", error);
      showErrorToast("Error restoring sale");
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
      unitsInStock: 0,
      purchasePrice: 0
    });
    setIsItemModalOpen(true);
  };

  /* ================= UI ================= */
  return (
    <PageLayout>
      <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        
        <ContentCard className="!h-auto !overflow-visible">
        {/* HEADER */}
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate("/app/sales/sales")} className={`${theme === 'emerald' ? 'hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50  hover:bg-purple-100 text-purple-800' : 'hover:bg-gray-700'} p-2 rounded-full`}>
                    <ArrowLeft size={24} />
                </button>

                <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE] bg-clip-text text-transparent bg-gradient-to-r from-[#6448AE] to-[#8066a3]' : theme === 'emerald' ? 'text-gray-800' : 'text-white'}`}>
                    {inactiveView ? "View Inactive Sale" : (id ? "Edit Sale" : "New Sale")}
                </h2>
            </div>

            {/* ACTIONS BAR */}
            <div className="flex items-center gap-3">
                {id ? (
                    <>
                    {!inactiveView && hasPermission(PERMISSIONS.SALES.EDIT) && (
                    <button 
                        onClick={handleUpdateSale} 
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
                    <button onClick={handleDeleteSale} disabled={loading} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-500'}`}>
                        <Trash2 size={18} /> Delete
                    </button>
                    )}
                    {inactiveView && (
                        <button onClick={handleRestoreSale} disabled={loading} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-green-600 text-white hover:bg-green-500'}`}>
                            <ArchiveRestore size={18} /> Restore
                        </button>
                    )}
                    </>
                ) : (
                    hasPermission(PERMISSIONS.SALES.CREATE) && (
                    <button 
                    onClick={handleSaveSale} 
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

        {/* TOP SECTION - 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LEFT COL */}
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

            {/* Payment Account */}
            <div className="flex items-center">
              <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                Payment Account <span className="text-dark">*</span>
              </label>
              <div className="flex-1 flex items-center gap-2">
                <select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className={`flex-1 border-2 rounded px-3 py-1.5 outline-none font-medium disabled:opacity-50 text-sm ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400' : theme === 'purple' ? 'bg-white border-gray-300 text-purple-800 focus:border-gray-500' : 'bg-gray-900 border-gray-700 text-white focus:border-gray-500'}`}
                  disabled={inactiveView}
                >
                  <option className="text-purple-800" value="">--select--</option>
                  <option className="text-purple-800" value="Cash at Hand">Cash at Hand</option>
                  <option className="text-purple-800" value="Cash at Bank">Cash at Bank</option>
                </select>
                {!inactiveView && (
                  <div className="p-2 border border-transparent rounded invisible">
                      <Star size={16} />
                  </div>
                )}
              </div>
            </div>

            {/* Tax Type */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                  Tax Type <span className="text-dark">*</span>
               </label>
               <div className="flex-1 flex items-center gap-2">
                 <div className="flex-1 font-medium">
                 <SearchableSelect
                    options={taxTypesList}
                    value={taxTypeId}
                    onChange={setTaxTypeId}
                    placeholder="Select Tax Type..."
                    className={`flex-1 ${theme === 'emerald' ? 'bg-white text-emerald-900' : theme === 'purple' ? 'bg-white text-purple-800' : 'bg-gray-800'}`}
                    disabled={inactiveView || noTax}
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

          {/* RIGHT COL */}
          <div className="space-y-4">
             {/* Invoice No */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Invoice No</label>
               <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 font-medium">
                       <InputField
                         value={invoiceNo}
                         onChange={(e) => setInvoiceNo(e.target.value)}
                         placeholder="Auto-generated"
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

             {/* Vehicle No */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Vehicle No</label>
               <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 font-medium">
                       <InputField
                         value={vehicleNo}
                         onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                         placeholder="Vehicle/Transport No"
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

             {/* Date */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Date</label>
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

          <div className={`border rounded overflow-hidden min-w-[900px] ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <table className="w-full text-sm text-left">
              <thead className={`${theme === 'emerald' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-100' : theme === 'purple' ? 'bg-purple-50 text-purple-900 border-b border-purple-100' : 'bg-gray-700 text-gray-300'} font-medium`}>
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
                  <tr key={i} className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-200 hover:bg-gray-750'}`}>
                    <td className="p-3">{row.productName}</td>
                    <td className="p-3">{row.description}</td>
                    <td className="p-3">{row.unitName}</td>
                    <td className="p-3">{row.quantity}</td>
                    <td className="p-3">{row.unitPrice}</td>
                    <td className="p-3">{row.discount}</td>
                    <td className={`p-3 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900 font-semibold' : 'text-gray-300'}`}>{parseFloat(row.total).toFixed(2)}</td>
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

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN - DETAILS (Span 4) */}
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

          {/* RIGHT COLUMN - TOTALS (Span 8) -> 2-Col Grid */}
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Taxable Amount */}
                <div>
                  <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Taxable Amount</label>
                  <div className={`w-full border rounded px-3 py-2 text-right font-bold ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
                    {netTotal.toFixed(2)}
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

                {/* Paid Amount */}
                <div>
                    <InputField
                        type="number"
                        label="Paid Amount"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                        disabled={inactiveView}
                        className="text-right w-full"
                    />
                </div>

                {/* Change */}
                <div>
                  <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Change</label>
                  <div className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
                    {changeAmount.toFixed(2)}
                  </div>
                </div>

                {/* Due */}
                <div>
                  <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Due</label>
                  <div className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
                    {dueAmount.toFixed(2)}
                  </div>
                </div>
                
                {/* Tax Breakdown */}
                {!noTax && taxTypeId && (() => {
                   const selectedTax = taxTypesList.find(t => String(t.id) === String(taxTypeId));
                   if(!selectedTax) return null;
                   
                   if(selectedTax.isInterState) {
                       return (
                         <div className="md:col-span-2">
                           <label className="block text-sm mb-1 text-gray-500">IGST %</label>
                           <input
                              type="number"
                              value={igstRate}
                              readOnly
                              className={`w-full border rounded px-3 py-2 text-right outline-none cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                           />
                         </div>
                       );
                   } else {
                       return (
                         <>
                           <div>
                           <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>CGST %</label>
                           <input
                              type="number"
                              value={cgstRate}
                              readOnly
                              className={`w-full border rounded px-3 py-2 text-right outline-none cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                           />
                          </div>
                          <div>
                           <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>SGST %</label>
                           <input
                              type="number"
                              value={sgstRate}
                              readOnly
                              className={`w-full border rounded px-3 py-2 text-right outline-none cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                           />
                          </div>
                         </>
                       );
                   }
                })()}

                {/* Net Total (Full Width) */}
                {/* Taxable Amount (Formerly Grand Total, Moved to Bottom) */}
                <div className="md:col-span-2 mt-2">
                  <label className={`block text-sm font-bold mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-gray-300'}`}>Grand Total</label>
                  <div className={`w-full border rounded px-4 py-3 text-right font-bold text-2xl ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-600 text-white'}`}>
                    {grandTotal.toFixed(2)}
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
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}> Brand *</label>
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
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}> Product *</label>
            <div className="flex items-center gap-2">
              <SearchableSelect
                options={productsList
                  .filter(p => String(p.BrandId) === String(newItem.brandId) || String(p.brandId) === String(newItem.brandId))
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
            <InputField
               label="Unit"
                className="font-medium"
               value={newItem.unitName}
               disabled={true} // Read only style
            />
          </div>

          {/* Tax Percentage (Read Only) */}
          <div>
            <InputField
               label="Tax Percentage (%)"
               value={newItem.taxPercentage}
                className="font-medium"
               disabled={true}
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


      {/* --- ADD PRODUCT MODAL --- */}
      <AddModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleCreateProduct}
        title="Add New Product"
        width="800px"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Code */}
          <InputField
            label="Product Code"
            value={newProductData.productCode}
            onChange={(e) => setNewProductData({ ...newProductData, productCode: e.target.value })}
            placeholder="Product Code"
          />

          {/* Product Name */}
          <InputField
             label="Product Name *"
             value={newProductData.name}
             onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
             placeholder="Product Name"
          />

          {/* SN */}
          <InputField
             label="SN"
             readOnly
             value={newProductData.SN}
             disabled
          />

          {/* Model */}
          <InputField
             label="Model"
             value={newProductData.Model}
             onChange={(e) => setNewProductData({ ...newProductData, Model: e.target.value })}
             placeholder="Model"
          />

          {/* CATEGORY DROPDOWN */}
          <div className="relative">
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Category</label>
             <SearchableSelect
                options={categoriesList.map(c => ({ id: c.id, name: c.name }))}
                value={newProductData.CategoryId}
                onChange={(val) => setNewProductData({ ...newProductData, CategoryId: val })}
                placeholder="Select Category"
                className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
             />
          </div>

          {/* UNIT DROPDOWN */}
          <div className="relative">
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Unit</label>
             <SearchableSelect
                options={unitsList.map(u => ({ id: u.id, name: u.name }))}
                value={newProductData.unitId}
                onChange={(val) => setNewProductData({ ...newProductData, unitId: val })}
                placeholder="--select--"
                className={`${theme === 'emerald' ? 'bg-white text-emerald-900' : theme === 'purple' ? 'bg-white text-purple-800' : 'bg-gray-800'}`}
             />
          </div>

          {/* BRAND DROPDOWN */}
          <div className="relative">
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Brand</label>
             <SearchableSelect
                options={brandsList.map(b => ({ id: b.id, name: b.name }))}
                value={newProductData.brandId}
                onChange={(val) => setNewProductData({ ...newProductData, brandId: val })}
                placeholder="Select Brand"
                className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
             />
          </div>

          {/* Unit Price */}
          <InputField
             type="number"
             label="Unit Price *"
             value={newProductData.price}
             onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
          />

          {/* Reorder Level */}
           <InputField
             type="number"
             label="Reorder Level"
             value={newProductData.ReorderLevel}
             onChange={(e) => setNewProductData({ ...newProductData, ReorderLevel: e.target.value })}
          />

           {/* Description */}
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

export default NewSale;
