// src/pages/purchases/NewPurchase.jsx
import React, { useEffect, useState } from "react";
import SearchableSelect from "../../components/SearchableSelect";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Star,
  Check,
  X,
  Edit,
  ArchiveRestore
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";

// APIs
import {
  getSuppliersApi,
  getBanksApi, // For Payment Account
  getBrandsApi,
  getProductsApi,
  addPurchaseApi,
  addBrandApi, // Quick create brand
  addSupplierApi,
  addProductApi,
  getUnitsApi,
  getCategoriesApi,
  getPurchaseByIdApi,
  updatePurchaseApi,
  deletePurchaseApi,
  restorePurchaseApi,
  getTaxTypesApi,
  searchPurchaseApi,
  searchSupplierApi,
  searchBrandApi,
  searchProductApi
} from "../../services/allAPI";
import { useDashboard } from "../../context/DashboardContext";
import { useParams, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const NewPurchase = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // Get ID from URL
  const { invalidateDashboard } = useDashboard();
  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  // Inactive View State
  const [inactiveView, setInactiveView] = useState(false);

  useEffect(() => {
    if (location.state && location.state.isInactive) {
      setInactiveView(true);
    }
  }, [location.state]);

  // --- TOP SECTION STATE ---
  const [supplier, setSupplier] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseOrderNo, setPurchaseOrderNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [taxTypeId, setTaxTypeId] = useState("");

  // --- DROPDOWN DATA ---
  const [suppliersList, setSuppliersList] = useState([]);
  const [banksList, setBanksList] = useState([]);
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
    total: 0
  });

  // --- QUICK CREATE BRAND MODAL STATE ---
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDescription, setNewBrandDescription] = useState("");

  // --- BOTTOM SECTION STATE ---
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [noTax, setNoTax] = useState(false);
  const [details, setDetails] = useState("");

  const [igstRate, setIgstRate] = useState(0);
  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);

  // --- CALCULATED VALUES ---
  const [netTotal, setNetTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    fetchSuppliers();
    fetchBanks();
    fetchBrands();
    fetchProducts();
    fetchTaxTypes();
  }, []);

  // --- HANDLE RETURN FROM NEW SUPPLIER ---
  useEffect(() => {
    if (location.state?.newSupplierId) {
      const newId = location.state.newSupplierId;
      getSuppliersApi(1, 1000).then(res => {
         if(res.status === 200) {
             const list = res.data.records || [];
             setSuppliersList(list);
             if(list.find(s => String(s.id) === String(newId))) {
                 setSupplier(newId);
             }
         }
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- FETCH PURCHASE FOR EDIT ---
  useEffect(() => {
    if (id) {
      fetchPurchaseDetails(id);
    }
  }, [id]);



  const fetchPurchaseDetails = async (purchaseId) => {
    try {
      const res = await getPurchaseByIdApi(purchaseId);
      if (res.status === 200) {
        const { purchase, details } = res.data;
        
        setSupplier(purchase.SupplierId);
        setPaymentAccount(purchase.PaymentAccount);
        setPaymentAccount(purchase.PaymentAccount);
        setInvoiceNo(purchase.InvoiceNo);
        setPurchaseOrderNo(purchase.PurchaseOrderNo || "");
        setVehicleNo(purchase.VehicleNo || "");
        setDate(purchase.Date.split('T')[0]);
        setGlobalDiscount(purchase.Discount);
        setShippingCost(purchase.ShippingCost);
        setPaidAmount(purchase.PaidAmount);
        setNoTax(purchase.NoTax === 1);
        setDetails(purchase.Details);

        setTaxTypeId(purchase.TaxTypeId || "");
        setIgstRate(purchase.IGSTRate || 0);
        setCgstRate(purchase.CGSTRate || 0);
        setSgstRate(purchase.SGSTRate || 0);

        // Map details to rows
        const mappedRows = details.map(d => ({
          productId: d.productId,
          productName: d.productName,
          description: d.Description,
          unitId: d.unitId,
          unitName: d.unitName,
          quantity: d.Quantity,
          unitPrice: d.UnitPrice,
          discount: d.Discount,
          total: d.Total,
          brandId: d.brandId || d.BrandId
        }));
        setRows(mappedRows);
      }
    } catch (error) {
      console.error("Error fetching purchase details", error);
      toast.error("Failed to load purchase details");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliersApi(1, 1000);
      if (res.status === 200) setSuppliersList(res.data.records || []);
    } catch (error) {
      console.error("Error fetching suppliers", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await getBanksApi(1, 1000);
      if (res.status === 200) setBanksList(res.data.records || []);
    } catch (error) {
      console.error("Error fetching banks", error);
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

  const fetchTaxTypes = async () => {
    try {
      const res = await getTaxTypesApi(1, 1000);
      if (res.status === 200) {
         // Normalize to match NewSales logic
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

  // --- NAVIGATION & RESTORE STATE ---
  const handleGoToNewProduct = () => {
      if (!newItem.brandId) return toast.error("Please select a brand first");
      
      const currentFormState = {
          supplier,
          paymentAccount,
          invoiceNo,
          purchaseOrderNo,
          vehicleNo,
          date,
          taxTypeId,
          rows,
          globalDiscount,
          shippingCost,
          paidAmount,
          noTax,
          details,
          newItem, // We preserve the modal state too
          isItemModalOpen: true // We want the modal to be open when we return
      };

      navigate("/app/inventory/newproduct", { 
          state: { 
              returnTo: location.pathname, 
              preserveState: currentFormState,
              brandId: newItem.brandId
          } 
      });
  };

  useEffect(() => {
    if (location.state?.preserveState) {
        const ps = location.state.preserveState;
        
        // Restore Form Data
        setSupplier(ps.supplier || "");
        setPaymentAccount(ps.paymentAccount || "");
        setInvoiceNo(ps.invoiceNo || "");
        setPurchaseOrderNo(ps.purchaseOrderNo || "");
        setVehicleNo(ps.vehicleNo || "");
        setDate(ps.date || new Date().toISOString().split("T")[0]);
        setTaxTypeId(ps.taxTypeId || "");
        setRows(ps.rows || []);
        setGlobalDiscount(ps.globalDiscount || 0);
        setShippingCost(ps.shippingCost || 0);
        setPaidAmount(ps.paidAmount || 0);
        setNoTax(ps.noTax || false);
        setDetails(ps.details || "");
        
        // Restore Modal State
        if (ps.isItemModalOpen) {
            setIsItemModalOpen(true);
            setNewItem(ps.newItem || {});
        }

        // Handle Created Product
        if (location.state.createdProductId || location.state.createdProductName) {
             // We need to fetch products to get the full object of the new product
             getProductsApi(1, 1000).then(res => {
                 if (res.status === 200) {
                     setProductsList(res.data.records || []);
                     
                     // Try to find by ID first, then Name
                     let found = null;
                     if (location.state.createdProductId) {
                        found = res.data.records.find(p => String(p.id) === String(location.state.createdProductId));
                     }
                     if (!found && location.state.createdProductName) {
                        found = res.data.records.find(p => p.ProductName === location.state.createdProductName);
                     }
                     
                     if (found) {
                         // Update newItem with the new product
                         setNewItem(prev => ({
                            ...prev,
                            productId: found.id,
                            productName: found.ProductName,
                            unitId: found.UnitId,
                            unitName: found.unitName || found.UnitName,
                            unitPrice: found.UnitPrice,
                            brandId: found.BrandId,
                            brandName: found.brandName || found.BrandName, 
                            quantity: 1
                         }));
                     }
                 }
             });
        }
    }
  }, [location.state]);

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

      const res = await addBrandApi({ 
          name: newBrandName, 
          description: newBrandDescription, 
          userId 
      });

      if (res?.status === 200) {
        toast.success("Brand added");
        
        // Refresh list
        const updatedBrands = await getBrandsApi(1, 1000);
        if(updatedBrands.status === 200) {
            setBrandsList(updatedBrands.data.records);
            const newBrand = updatedBrands.data.records.find(b => b.name === newBrandName);
            if(newBrand) {
                setNewItem(prev => ({ ...prev, brandId: newBrand.id, productId: "", productName: "" })); // Clear product on brand change
            }
        }

        setIsBrandModalOpen(false);
        setNewBrandName("");
        setNewBrandDescription("");
      } else if (res?.status === 409) {
          toast.error(res.data.message || "Brand Name already exists");
      } else {
          toast.error("Failed to add brand");
      }
    } catch (error) {
        console.error("Error adding brand", error);
        toast.error("Server error adding brand");
    }
  };

  // --- MODAL HANDLERS ---
  const openItemModal = () => {
    if (inactiveView) return; // Prevent open in inactive
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
      total: 0
    });
    setIsItemModalOpen(true);
  };

  const handleProductSelect = (productId) => {
    const product = productsList.find(p => String(p.id) === String(productId));
    if (product) {
      setNewItem(prev => ({
        ...prev,
        productId: product.id,
        productName: product.ProductName, // Capitalized
        unitId: product.UnitId, // Capitalized
        unitName: product.unitName, // Aliased in query
        unitPrice: "",
        quantity: "",  
        // description: product.ProductDetails || "", // REMOVED as per request
        brandId: product.BrandId || prev.brandId, // Capitalized
        brandName: product.brandName || prev.brandName, // Aliased
        taxPercentage: product.taxPercentageValue ?? 0
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
    if (!newItem.brandId) {
        toast.error("Please select a brand");
        return;
    }
    if (newItem.quantity <= 0) {
       toast.error("Quantity must be greater than 0");
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



  // --- QUICK CREATE SUPPLIER ---
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  
  const handleCreateSupplier = async () => {
      if(!newSupplierName.trim()) return toast.error("Supplier name required");
      try {
          // DUPLICATE CHECK
          const searchRes = await searchSupplierApi(newSupplierName.trim());
          if (searchRes?.status === 200) {
              const rows = searchRes.data.records || searchRes.data || [];
              const existing = rows.find(s => (s.companyName || "").toLowerCase() === newSupplierName.trim().toLowerCase());
              if (existing) return toast.error("Supplier with this Name already exists");
          }

          const res = await addSupplierApi({ companyName: newSupplierName, userId });
          if(res.status === 200) {
              toast.success("Supplier added");
              
              const updatedSuppliers = await getSuppliersApi(1, 1000);
              if(updatedSuppliers.status === 200) {
                  setSuppliersList(updatedSuppliers.data.records);
                  const newSupplier = updatedSuppliers.data.records.find(s => s.companyName === newSupplierName);
                  if(newSupplier) {
                      setSupplier(newSupplier.id);
                  }
              }
              setIsSupplierModalOpen(false);
              setNewSupplierName("");
          }
      } catch (error) {
          toast.error("Failed to add supplier");
      }
  };

  // --- QUICK CREATE PRODUCT ---
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

  useEffect(() => {
      fetchUnits();
      fetchCategories();
  }, []);

  const fetchUnits = async () => {
      try {
          const res = await getUnitsApi(1, 1000);
          if(res.status === 200) setUnitsList(res.data.records || []);
      } catch (error) {
          console.error("Error fetching units");
      }
  };

  const fetchCategories = async () => {
      try {
          const res = await getCategoriesApi(1, 1000);
          if(res.status === 200) setCategoriesList(res.data.records || []);
      } catch (error) {
          console.error("Error fetching categories");
      }
  };

  const generateNextSNLocal = () => {
    const all = productsList; // Using currently loaded products
    let max = 0;
    all.forEach((p) => {
      if (p && p.SN) {
        const m = p.SN.match(/^P0*(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > max) max = n;
        } else {
            // Fallback for non-standard SNs if needed, or just ignore
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
          brandId: newItem.brandId || "", // Pre-fill if brand selected
          Image: "",
          description: ""
      });
      setIsProductModalOpen(true);
  };

  const handleCreateProduct = async () => {
      if(!newProductData.name) return toast.error("Product name required");
      if(!newProductData.brandId) return toast.error("Brand required");
      if(!newProductData.unitId) return toast.error("Unit required");

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
          if(res.status === 200) {
              toast.success("Product added");
              
              const updatedProducts = await getProductsApi(1, 1000);
              if(updatedProducts.status === 200) {
                  setProductsList(updatedProducts.data.records);
                  // Find the new product
                  const newProduct = updatedProducts.data.records.find(p => p.ProductName === newProductData.name && String(p.BrandId) === String(newProductData.brandId));
                  if(newProduct) {
                      // Auto select in the line item modal
                      handleProductSelect(newProduct.id);
                  }
              }
              setIsProductModalOpen(false);
              setNewProductData({ name: "", brandId: "", unitId: "", price: 0, description: "" });
          }
      } catch (error) {
          toast.error("Failed to add product");
      }
  };





  // --- UPDATE RATES WHEN TAX TYPE CHANGE ---
  // --- UPDATE RATES WHEN TAX TYPE CHANGE ---
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

  useEffect(() => {
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  // 1️⃣ Line calculations
  let subTotal = 0;
  let lineDiscountTotal = 0;

  rows.forEach((row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unitPrice) || 0;
    const discPct = Number(row.discount) || 0;

    const lineBase = qty * price;
    const lineDiscount = (lineBase * discPct) / 100;
    const lineTotal = lineBase - lineDiscount;

    subTotal += lineTotal;
    lineDiscountTotal += lineDiscount;
  });

  subTotal = round2(subTotal);
  lineDiscountTotal = round2(lineDiscountTotal);

  // 2️⃣ Global discount & shipping
  const globalDisc = Number(globalDiscount) || 0;
  const shipping = Number(shippingCost) || 0;
  const paid = Number(paidAmount) || 0;

  // 3️⃣ Taxable amount
  let taxableAmount = subTotal - globalDisc;
  if (taxableAmount < 0) taxableAmount = 0;
  taxableAmount = round2(taxableAmount);

  // 4️⃣ Tax
  let tax = 0;
  if (!noTax) {
      const igst = (taxableAmount * igstRate) / 100;
      const cgst = (taxableAmount * cgstRate) / 100;
      const sgst = (taxableAmount * sgstRate) / 100;
      tax = round2(igst + cgst + sgst);
  }

  // 5️⃣ Final payable (THIS is Net Total)
  const netPayable = round2(taxableAmount + tax + shipping);

  // 6️⃣ Due / Change
  let due = 0;
  let change = 0;

  if (paid >= netPayable) {
    change = round2(paid - netPayable);
  } else {
    due = round2(netPayable - paid);
  }

  setGrandTotal(subTotal);                     
  setNetTotal(netPayable);                     
  setTaxAmount(tax);
  setTotalDiscount(round2(lineDiscountTotal + globalDisc));
  setDueAmount(due);
  setChangeAmount(change);

}, [rows, globalDiscount, shippingCost, paidAmount, noTax, igstRate, cgstRate, sgstRate]);




  // --- SAVE PURCHASE ---
  const handleSavePurchase = async () => {
    // Robust userId check
    const currentUserId = userData?.userId || userData?.id || userData?.Id;
    
    if (!currentUserId) {
        console.error("User ID missing from session data:", userData);
        return toast.error("User session invalid. Please re-login.");
    }

    if (!supplier) return toast.error("Please select a supplier");
    if (!paymentAccount) return toast.error("Please select a payment account");
    // Tax Type is now optional
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      supplierId: supplier,
      invoiceNo,
      purchaseOrderNo,
      vehicleNo,
      date,
      discount: parseFloat(globalDiscount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      shippingCost: parseFloat(shippingCost) || 0,
      grandTotal: parseFloat(grandTotal) || 0, // Subtotal
      netTotal: parseFloat(netTotal) || 0,   // Final Payable
      paidAmount: parseFloat(paidAmount) || 0,
      due: parseFloat(dueAmount) || 0,
      change: parseFloat(changeAmount) || 0,
      details,
      paymentAccount,
      employeeId: null, // Optional
      vno: "", // Optional
      vat: parseFloat(taxAmount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      vatPercentage: 0,
      noTax: noTax ? 1 : 0,
      vatType: "GST",
      
      taxTypeId: taxTypeId || null,
      igstRate: parseFloat(igstRate) || 0,
      cgstRate: parseFloat(cgstRate) || 0,
      sgstRate: parseFloat(sgstRate) || 0,
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
      // DUPLICATE CHECK: Invoice No
      if (invoiceNo && invoiceNo.trim() !== "") {
          const searchRes = await searchPurchaseApi(invoiceNo.trim());
          if (searchRes?.status === 200) {
              const rows = searchRes.data.records || searchRes.data || [];
              const existing = rows.find(p => (p.invoiceNo || p.InvoiceNo || "").toLowerCase() === invoiceNo.trim().toLowerCase());
              if (existing) return toast.error("Invoice No already exists");
          }
      }

      const res = await addPurchaseApi(payload);
      if (res.status === 200) {
        toast.success("Purchase added successfully");
        invalidateDashboard();
        navigate("/app/purchasing/purchases"); 
      } else {
        toast.error("Failed to add purchase");
      }
    } catch (error) {
      console.error("SAVE ERROR", error);
      toast.error("Error saving purchase");
    }
  };

  const handleUpdatePurchase = async () => {
    if (!supplier) return toast.error("Please select a supplier");
    if (!paymentAccount) return toast.error("Please select a payment account");
    // Tax Type is now optional
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      supplierId: supplier,
      invoiceNo,
      purchaseOrderNo,
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
      vno: "",
      vehicleNo, // Added
      vat: parseFloat(taxAmount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      vatPercentage: 0,
      noTax: noTax ? 1 : 0,
      vatType: "GST",
      
      taxTypeId: taxTypeId || null,
      igstRate: parseFloat(igstRate) || 0,
      cgstRate: parseFloat(cgstRate) || 0,
      sgstRate: parseFloat(sgstRate) || 0,
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
      userId: userId
    };

    try {
      // DUPLICATE CHECK: Invoice No
      if (invoiceNo && invoiceNo.trim() !== "") {
          const searchRes = await searchPurchaseApi(invoiceNo.trim());
          if (searchRes?.status === 200) {
              const rows = searchRes.data.records || searchRes.data || [];
              const existing = rows.find(p => (p.invoiceNo || p.InvoiceNo || "").toLowerCase() === invoiceNo.trim().toLowerCase() && String(p.id) !== String(id));
              if (existing) return toast.error("Invoice No already exists");
          }
      }

      const res = await updatePurchaseApi(id, payload);
      if (res.status === 200) {
        toast.success("Purchase updated successfully");
        invalidateDashboard();
        navigate("/app/purchasing/purchases");
      } else {
        toast.error("Failed to update purchase");
      }
    } catch (error) {
      console.error("UPDATE ERROR", error);
      toast.error("Error updating purchase");
    }
  };

  const handleDeletePurchase = async () => {
    const result = await showDeleteConfirm('purchase');
  
    if (!result.isConfirmed) return;
  
    Swal.fire({
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  
    try {
      const res = await deletePurchaseApi(id, { userId });
      Swal.close();
  
      if (res.status === 200) {
        showSuccessToast("Purchase deleted successfully.");
        navigate("/app/purchasing/purchases");
      } else {
        showErrorToast("Failed to delete purchase");
      }
    } catch (error) {
      Swal.close();
      console.error("DELETE INVOICE ERROR", error);
      showErrorToast("Error deleting purchase");
    }
  };

  
  const handleRestorePurchase = async () => {
    const result = await showRestoreConfirm('purchase');
  
    if (!result.isConfirmed) return;
  
    Swal.fire({
      title: "Restoring...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  
    try {
      const res = await restorePurchaseApi(id, { userId });
      Swal.close();
  
      if (res.status === 200) {
        showSuccessToast("Purchase restored successfully.");
        navigate("/app/purchasing/purchases");
      } else {
        showErrorToast("Failed to restore purchase");
      }
    } catch (error) {
      Swal.close();
      console.error("RESTORE ERROR", error);
      showErrorToast("Error restoring purchase");
    }
  };

  return (
    <PageLayout>
      <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        
        <ContentCard className="!h-auto !overflow-visible">
        {/* HEADER & ACTIONS */}
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => {
                if (location.state?.returnTo) {
                    navigate(location.state.returnTo);
                } else {
                    navigate("/app/purchasing/purchases");
                }
            }} className={`${theme === 'emerald' ? 'hover:bg-emerald-200' : theme === 'purple' ? 'hover:bg-gray-200 text-gray-700' : 'hover:bg-gray-700'} p-2 rounded-full`}>
                <ArrowLeft size={24} />
            </button>
            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE] bg-clip-text text-transparent bg-gradient-to-r from-[#6448AE] to-[#8066a3]' : theme === 'emerald' ? 'text-gray-800' : 'text-white-500'}`}>
                {id ? (inactiveView ? "View Inactive Purchase" : "Edit Purchase") : "New Purchase"}
            </h2>
        </div>
            
        {/* ACTIONS BAR */}
        <div className="flex gap-2 mb-6">
            {id ? (
                <>
                {!inactiveView && hasPermission(PERMISSIONS.PURCHASING.EDIT) && (
                <button onClick={handleUpdatePurchase}  className={`flex items-center gap-2 border px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6448AE]  text-white shadow-md hover:bg-purple-300' : 'bg-gray-700 border-gray-800 text-blue-300 hover:bg-gray-600'}`}>
                    <Save size={18} /> Update
                </button>
                )}
                {!inactiveView && hasPermission(PERMISSIONS.PURCHASING.DELETE) && (
                <button onClick={handleDeletePurchase} className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500">
                    <Trash2 size={18} /> Delete
                </button>
                )}
                {inactiveView && (
                    <button onClick={handleRestorePurchase} className="flex items-center gap-2 bg-green-600 border border-green-500 px-4 py-2 rounded text-white hover:bg-green-500">
                        <ArchiveRestore size={18} /> Restore
                    </button>
                )}
                </>
            ) : (
                hasPermission(PERMISSIONS.PURCHASING.CREATE) && (
                <button onClick={handleSavePurchase} className={`flex items-center gap-2 border px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md hover:bg-purple-300' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
                <Save size={18} /> Save
                </button>
                )
            )}
        </div>
        <hr className="mb-4 border-gray-300" />

        {/* TOP SECTION - 2 COLUMNS (Matching NewSale.jsx) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LEFT COL */}
          <div className="space-y-4">
             {/* Supplier */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                  Supplier <span className="text-dark">*</span> 
               </label>
               <div className="flex-1 flex items-center gap-2">
                 <SearchableSelect
                     options={suppliersList.map(s => ({ id: s.id, name: s.companyName }))}
                     value={supplier}
                     onChange={(val) => setSupplier(val)}
                     placeholder="--select--"
                     disabled={inactiveView} 
                     className={`flex-1 ${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                 />
                 {hasPermission(PERMISSIONS.SUPPLIERS.CREATE) && !inactiveView && (
                  <div 
                    className={`p-2 border rounded flex items-center justify-center cursor-pointer ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                    onClick={() => navigate("/app/businesspartners/newsupplier", { state: { returnTo: location.pathname } })}
                  >
                     <Star size={16} />
                  </div>
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
                   className={`flex-1 border-2 rounded px-3 py-1.5 outline-none disabled:opacity-50 text-sm ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400' : theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-gray-500' : 'bg-gray-900 border-gray-700 text-white focus:border-gray-500'}`}
                   disabled={inactiveView}
                 >
                   <option value="">--select--</option>
                   <option value="Cash at Hand">Cash at Hand</option>
                   <option value="Cash at Bank">Cash at Bank</option>
                 </select>
                 {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible"><Star size={16} /></div>
                 )}
                </div>
             </div>

             {/* Tax Type */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                  Tax Type
               </label>
               <div className="flex-1 flex items-center gap-2">
                   <div className="flex-1 font-medium">
                   <SearchableSelect
                     options={taxTypesList}
                     value={taxTypeId}
                     onChange={(val) => setTaxTypeId(val)}
                     placeholder="--select--"
                     disabled={inactiveView || noTax}
                     className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                   />
                  </div>
                  {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible"><Star size={16} /></div>
                  )}
               </div>
             </div>

             {/* Date - Moved here under Tax Type */}
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
                    <div className="p-2 border border-transparent rounded invisible"><Star size={16} /></div>
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
                         disabled={inactiveView}
                       />
                   </div>
                   {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible"><Star size={16} /></div>
                   )}
               </div>
             </div>

             {/* Purchase Order (Below Invoice No) */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Purchase Order</label>
               <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 font-medium">
                       <InputField
                         value={purchaseOrderNo}
                         onChange={(e) => setPurchaseOrderNo(e.target.value)}
                         disabled={inactiveView}
                       />
                   </div>
                   {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible"><Star size={16} /></div>
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
                         onChange={(e) => setVehicleNo(e.target.value)}
                         placeholder="Vehicle Number"
                         disabled={inactiveView}
                       />
                   </div>
                   {!inactiveView && (
                    <div className="p-2 border border-transparent rounded invisible"><Star size={16} /></div>
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
                className={`flex items-center gap-2 px-4 py-2 border rounded ${theme === 'emerald' ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md' : 'bg-gray-800 border-gray-600 text-blue-300'}`}
            >
              <Plus size={16} /> Add
            </button>
            )}
          </div>

          <div className={`border rounded overflow-hidden min-w-[800px] ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-800 border-gray-700'}`}>
            <table className="w-full text-sm text-left">
              <thead className={`${theme === 'emerald' ? 'bg-emerald-50 text-emerald-700' : theme === 'purple' ? 'bg-purple-50 text-purple-700' : 'bg-gray-700 text-gray-300'} font-medium border-b ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-600'}`}>
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Unit Name</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Discount</th>
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
              <div className={`p-8 text-center ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-500'}`}>
                No items added. Click "+ Add" to start.
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION - MATCHING NEWSALE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: DETAILS (Spans 4) */}
          <div className="lg:col-span-4 flex flex-col">
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Details</label>
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
                <div>
                   <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Grand Total</label>
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

                {/* Paid Amount */}
                <div>
                    <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Paid Amount</label>
                    <InputField
                        type="number"
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
                           <label className="block text-sm mb-1 text-gray-500">IGST ({igstRate}%)</label>
                           <div className={`w-full border rounded px-3 py-2 text-right cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                              {taxAmount.toFixed(2)}
                           </div>
                         </div>
                       );
                     } else {
                       return (
                         <>
                           <div>
                              <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>CGST ({cgstRate}%)</label>
                              <div className={`w-full border rounded px-3 py-2 text-right cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                                 {(taxAmount / 2).toFixed(2)}
                              </div>
                           </div>
                           <div>
                              <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>SGST ({sgstRate}%)</label>
                              <div className={`w-full border rounded px-3 py-2 text-right cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                                 {(taxAmount / 2).toFixed(2)}
                              </div>
                           </div>
                         </>
                       );
                     }
                 })()}

                {/* Net Total (Full Width) */}
                <div className="md:col-span-2 mt-2">
                    <label className={`block text-sm font-bold mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>Net Total</label>
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
        width="700px"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
               <div className="flex-1 font-medium">
                <SearchableSelect
                  label="Brand"
                  required
                  options={brandsList.map(b => ({ id: b.id, name: b.name }))}
                  value={newItem.brandId}
                  onChange={(val) => setNewItem({ ...newItem, brandId: val, productId: "", productName: "" })}
                  placeholder="--select--"
                  className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                />
              </div>
              {hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE) && (
              <Star
                size={20}
                className={`cursor-pointer hover:scale-110 mt-6 ${theme === 'emerald' ? 'text-emerald-600' : theme === 'purple' ? 'text-purple-600' : 'text-yellow-500'}`}
                onClick={() => setIsBrandModalOpen(true)}
              />
              )}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="flex items-center gap-2">
               <div className="flex-1 font-medium">
                <SearchableSelect
                  label="Product"
                  required
                  options={productsList
                    .filter(p => String(p.BrandId) === String(newItem.brandId) || String(p.brandId) === String(newItem.brandId))
                    .map(p => ({ id: p.id, name: p.ProductName }))
                  }
                  value={newItem.productId}
                  onChange={handleProductSelect}
                  placeholder="--select product--"
                  disabled={!newItem.brandId}
                  className={`flex-1 ${!newItem.brandId ? 'opacity-50 pointer-events-none' : ''} ${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                />
              </div>
              {hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE) && (
              <Star
                size={20}
                className={`cursor-pointer hover:scale-110 mt-6 ${newItem.brandId ? (theme === 'emerald' ? 'text-emerald-600' : theme === 'purple' ? 'text-purple-600' : 'text-yellow-500') : 'text-gray-500'}`}
                onClick={() => {
                  if (newItem.brandId) {
                    setNewItem(prev => ({ ...prev, brandId: newItem.brandId }));
                    openProductModal();
                  }
                }}
              />
              )}
            </div>
          </div>


          {/* Description */}
          <div className="col-span-2">
            <InputField
              label="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
          </div>

          {/* Quantity */}
          <div>
            <InputField
               type="number"
               label="Quantity"
               value={newItem.quantity}
               onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
          </div>

          {/* Unit Price */}
          <div>
            <InputField
              type="number"
              label="Unit Price"
              value={newItem.unitPrice}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
            />
          </div>

          {/* Discount */}
          <div>
            <InputField
              type="number"
              label="Discount (%)"
              value={newItem.discount}
              onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
            />
          </div>

          {/* Tax Percentage (Read Only) */}
          <div>
            <InputField
               label="Tax Percentage (%)"
               value={newItem.taxPercentage}
               readOnly
               className="cursor-not-allowed text-gray-600"
            />
          </div>

          {/* Unit (Read Only) */}
          <div>
            <InputField
               label="Unit"
               value={newItem.unitName}
               readOnly
               className="cursor-not-allowed text-gray-600"
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
          required
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          placeholder="Brand Name"
          className="mb-4"
        />

        <InputField
            textarea
            label="Description"
            value={newBrandDescription}
            onChange={(e) => setNewBrandDescription(e.target.value)}
            className="w-full h-24 resize-none"
        />
      </AddModal>

      {/* --- ADD SUPPLIER MODAL --- */}
      <AddModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleCreateSupplier}
        title="Add New Supplier"
        width="400px"
      >
        <InputField
          label="Company Name"
          value={newSupplierName}
          onChange={(e) => setNewSupplierName(e.target.value)}
          placeholder="Company Name"
          className="mb-4"
        />
      </AddModal>

      {/* --- ADD PRODUCT MODAL --- */}
      <AddModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleCreateProduct}
        title="New Product"
        width="820px"
      >
        <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            {/* LEFT COLUMN */}
            <div>
                <InputField
                    label="Product Code"
                    value={newProductData.productCode}
                    onChange={(e) => setNewProductData({...newProductData, productCode: e.target.value})}
                    className="mb-2"
                />

                <InputField
                    label="Product Name"
                    required
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                    className="mb-2"
                />

                <InputField
                    label="SN"
                    value={newProductData.SN}
                    disabled
                    className="mb-2 bg-gray-100 cursor-not-allowed"
                />

                <InputField
                    label="Model"
                    value={newProductData.Model}
                    onChange={(e) => setNewProductData({...newProductData, Model: e.target.value})}
                    className="mb-2"
                />

                <InputField
                    type="number"
                    label="Unit Price"
                    required
                    step="0.01"
                    value={newProductData.price}
                    onChange={(e) => setNewProductData({...newProductData, price: e.target.value})}
                    className="mb-2"
                />

                <InputField
                    type="number"
                    label="Reorder Level"
                    required
                    step="0.01"
                    value={newProductData.ReorderLevel}
                    onChange={(e) => setNewProductData({...newProductData, ReorderLevel: e.target.value})}
                    className="mb-2"
                />
            </div>
            
            {/* RIGHT COLUMN */}
            <div className="space-y-2">
                <div>
                   <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Category <span className="text-red-400">*</span></label>
                   <SearchableSelect
                       options={categoriesList.map(c => ({ id: c.id, name: c.name }))}
                       value={newProductData.CategoryId}
                       onChange={(val) => setNewProductData({...newProductData, CategoryId: val})}
                       placeholder="--select--"
                       className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                   />
                </div>

                <div>
                   <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Unit <span className="text-red-400">*</span></label>
                   <SearchableSelect
                       options={unitsList.map(u => ({ id: u.id, name: u.name }))}
                       value={newProductData.unitId}
                       onChange={(val) => setNewProductData({...newProductData, unitId: val})}
                       placeholder="--select--"
                       className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                   />
                </div>

                <div>
                   <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Brand <span className="text-red-400">*</span></label>
                   <SearchableSelect
                       options={brandsList.map(b => ({ id: b.id, name: b.name }))}
                       value={newProductData.brandId}
                       onChange={(val) => setNewProductData({...newProductData, brandId: val})}
                       placeholder="--select--"
                       className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                   />
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Image</label>
                  <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className={`w-full border rounded px-3 py-2 mb-2 outline-none ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-900' : theme === 'purple' ? 'bg-white border-purple-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
                  />
                  {newProductData.Image && (
                    <img src={newProductData.Image} alt="Preview" className="w-20 h-20 object-cover mt-2 rounded border border-gray-600" />
                  )}
                </div>
            </div>

            <div className="col-span-2">
                <InputField
                    textarea
                    label="Description"
                    value={newProductData.description}
                    onChange={(e) => setNewProductData({...newProductData, description: e.target.value})}
                    className="w-full h-20 resize-none"
                />
            </div>
        </div>
      </AddModal>

    </PageLayout>
  );
};

export default NewPurchase;
