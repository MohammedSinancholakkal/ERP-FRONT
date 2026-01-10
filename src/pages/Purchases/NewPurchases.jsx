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
import Swal from "sweetalert2";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";

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
  getTaxTypesApi
} from "../../services/allAPI";
import { useParams, useLocation } from "react-router-dom";

const NewPurchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // Get ID from URL
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
        setInvoiceNo(purchase.InvoiceNo);
        setDate(purchase.Date.split('T')[0]);
        setGlobalDiscount(purchase.Discount);
        setShippingCost(purchase.ShippingCost);
        setPaidAmount(purchase.PaidAmount);
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
          total: d.Total
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
                            // Ensure we keep the previous modal state if valuable, but overwrite product details
                            productId: found.id,
                            productName: found.ProductName,
                            unitId: found.UnitId,
                            unitName: found.unitName || found.UnitName, // API might return different casing
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
        unitPrice: product.UnitPrice, // Capitalized
        quantity: 1, 
        // description: product.ProductDetails || "", // REMOVED as per request
        brandId: product.BrandId || prev.brandId, // Capitalized
        brandName: product.brandName || prev.brandName // Aliased
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
          const res = await addProductApi(payload);
          if(res.status === 200) {
              toast.success("Product added");
              
              const updatedProducts = await getProductsApi(1, 1000);
              if(updatedProducts.status === 200) {
                  setProductsList(updatedProducts.data.records);
                  // Find the new product. Might be tricky if names are duplicate, but assuming unique or last added.
                  // Ideally backend returns ID.
                  // We'll try to find by name and brand.
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

  // 7️⃣ Set states (single source of truth)
  setGrandTotal(subTotal);                     // purely informational
  setNetTotal(netPayable);                     // FINAL amount
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
    if (!noTax && !taxTypeId) return toast.error("Tax Type is required");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      supplierId: supplier,
      invoiceNo,
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
      const res = await addPurchaseApi(payload);
      if (res.status === 200) {
        toast.success("Purchase added successfully");
        navigate("/app/purchasing/purchases"); 
      } else {
        toast.error("Failed to add purchase");
      }
    } catch (error) {
      console.error("SAVE ERROR", error);
      toast.error("Error saving purchase");
    }
  };

  // --- UPDATE PURCHASE ---
  const handleUpdatePurchase = async () => {
    if (!supplier) return toast.error("Please select a supplier");
    if (!paymentAccount) return toast.error("Please select a payment account");
    if (!noTax && !taxTypeId) return toast.error("Tax Type is required");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      supplierId: supplier,
      invoiceNo,
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
      const res = await updatePurchaseApi(id, payload);
      if (res.status === 200) {
        toast.success("Purchase updated successfully");
        navigate("/app/purchasing/purchases");
      } else {
        toast.error("Failed to update purchase");
      }
    } catch (error) {
      console.error("UPDATE ERROR", error);
      toast.error("Error updating purchase");
    }
  };

  // --- DELETE PURCHASE ---
  // --- DELETE PURCHASE ---
  const handleDeletePurchase = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this purchase?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
  
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
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Purchase deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/app/purchasing/purchases");
      } else {
        Swal.fire("Failed", "Failed to delete purchase", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("DELETE INVOICE ERROR", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting purchase",
      });
    }
  };

  const handleRestorePurchase = async () => {
    const result = await Swal.fire({
      title: "Restore purchase?",
      text: "Do you want to restore this purchase?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", 
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });
  
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
        await Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "Purchase restored successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/app/purchasing/purchases");
      } else {
        Swal.fire("Failed", "Failed to restore purchase", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("RESTORE ERROR", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error restoring purchase",
      });
    }
  };

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => {
            if (location.state?.returnTo) {
                navigate(location.state.returnTo);
            } else {
                navigate("/app/purchasing/purchases");
            }
          }} className="text-white-500 hover:text-white-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl text-white-500 font-medium">
            {id ? (inactiveView ? "View Inactive Purchase" : "Edit Purchase") : "New Purchase"}
          </h2>
        </div>

        {/* ACTIONS BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              {!inactiveView && hasPermission(PERMISSIONS.PURCHASING.EDIT) && (
              <button onClick={handleUpdatePurchase}  className="flex items-center gap-2 bg-gray-700 border border-gray-800 px-4 py-2 rounded text-blue-300 hover:bg-gray-600">
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
            <button onClick={handleSavePurchase} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-white hover:bg-gray-600">
              <Save size={18} /> Save
            </button>
            )
          )}
          
          {/* <button className="flex items-center justify-center bg-gray-700 border border-gray-600 w-10 h-10 rounded text-white hover:bg-gray-600">
            <Check size={18} />
          </button> */}
        </div>

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* LEFT COL */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center">
              <label className="w-32 text-sm text-gray-300">
                <span className="text-red-400">*</span> Supplier
              </label>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    options={suppliersList.map(s => ({ id: s.id, name: s.companyName }))}
                    value={supplier}
                    onChange={(val) => setSupplier(val)}
                    placeholder="--select--"
                    disabled={inactiveView} 
                  />
                </div>
                {hasPermission(PERMISSIONS.SUPPLIERS.CREATE) && !inactiveView && (
                <Star size={20} className="text-white cursor-pointer hover:text-yellow-400" onClick={() => navigate("/app/businesspartners/newsupplier", { state: { returnTo: location.pathname } })} />
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-300 block mb-1">
                  <span className="text-red-400">*</span> Payment Account
                </label>
                <select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
                  disabled={inactiveView}
                >
                  <option value="">--select--</option>
                  <option value="Cash at Hand">Cash at Hand</option>
                  <option value="Cash at Bank">Cash at Bank</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="text-sm text-gray-300 block mb-1">
                  <span className="text-red-400">*</span> Tax Type
                </label>
                  <SearchableSelect
                    options={taxTypesList}
                    value={taxTypeId}
                    onChange={(val) => setTaxTypeId(val)}
                    placeholder="--select--"
                    disabled={inactiveView || noTax}
                  />
              </div>
            </div>
          </div>

          {/* MIDDLE COL */}
          <div className="lg:col-span-4">
            <div className="flex items-center">
              <label className="w-24 text-sm text-gray-300">Invoice No</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
                disabled={inactiveView}
              />
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-end">
              <label className="mr-3 text-sm text-gray-300">
                <span className="text-red-400">*</span> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-48 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
                disabled={inactiveView}
              />
            </div>
          </div>
        </div>

        {/* LINE ITEMS SECTION */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-300">Line Items</label>
            {!inactiveView && (
            <button
              onClick={openItemModal}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
            >
              <Plus size={16} /> Add
            </button>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded overflow-hidden min-w-[800px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700 text-gray-300 font-medium">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Unit Name</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Discount (%)</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-750">
                    <td className="p-3">{row.productName}</td>
                    <td className="p-3">{row.description}</td>
                    <td className="p-3">{row.unitName}</td>
                    <td className="p-3">{row.quantity}</td>
                    <td className="p-3">{row.unitPrice}</td>
                    <td className="p-3">{row.discount}</td>
                    <td className="p-3 text-gray-300">{parseFloat(row.total).toFixed(2)}</td>
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
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Grand Total</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 font-bold">
                {grandTotal.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Paid Amount</label>
           <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
              className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
              disabled={inactiveView} 
            />

            </div>
            <div className="pt-2">
              <label className="text-sm text-gray-300 block mb-1">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full h-24 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none resize-none disabled:opacity-50"
                disabled={inactiveView}
              ></textarea>
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Discount</label>
              <input
                type="number"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
                disabled={inactiveView}
              />
            </div>
            {/* TAX FIELDS */}
            {!noTax && taxTypeId && (() => {
               const selectedTax = taxTypesList.find(t => String(t.id) === String(taxTypeId));
               if(!selectedTax) return null;
               
               if(selectedTax.isInterState) {
                   return (
                     <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">IGST ({igstRate}%)</label>
                       <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                         {taxAmount.toFixed(2)}
                       </div>
                     </div>
                   );
               } else {
                   return (
                     <>
                      <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">CGST ({cgstRate}%)</label>
                       <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                         {(taxAmount / 2).toFixed(2)}
                       </div>
                      </div>
                      <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">SGST ({sgstRate}%)</label>
                       <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                         {(taxAmount / 2).toFixed(2)}
                       </div>
                      </div>
                     </>
                   );
               }
            })()}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Due</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {dueAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Total Discount</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {totalDiscount.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Shipping Cost</label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
                disabled={inactiveView}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Change</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {changeAmount.toFixed(2)}
              </div>
            </div>
             <div className="flex items-center justify-end gap-2 py-1">
              <label className="text-sm text-gray-300">No Tax</label>
              <input
                type="checkbox"
                checked={noTax}
                onChange={(e) => setNoTax(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 disabled:opacity-50"
                disabled={inactiveView}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="text-sm text-gray-300 font-semibold">Net Total</label>
              <div className="w-32 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-right text-white font-bold text-lg">
                {netTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

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
            <label className="block text-sm text-gray-300 mb-1">Brand</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelect
                  options={brandsList.map(b => ({ id: b.id, name: b.name }))}
                  value={newItem.brandId}
                  onChange={(val) => setNewItem({ ...newItem, brandId: val, productId: "", productName: "" })}
                  placeholder="--select--"
                />
              </div>
              {hasPermission(PERMISSIONS.INVENTORY.BRANDS.CREATE) && (
              <Star
                size={20}
                className="text-yellow-500 cursor-pointer hover:scale-110"
                onClick={() => setIsBrandModalOpen(true)}
              />
              )}
            </div>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelect
                  options={productsList
                    .filter(p => String(p.BrandId) === String(newItem.brandId) || String(p.brandId) === String(newItem.brandId))
                    .map(p => ({ id: p.id, name: p.ProductName }))
                  }
                  value={newItem.productId}
                  onChange={(val) => handleProductSelect(val)}
                  disabled={!newItem.brandId}
                  placeholder="--select--"
                  className={!newItem.brandId ? 'opacity-50 pointer-events-none' : ''}
                />
              </div>
              {hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE) && (
              <button 
                className={`flex items-center justify-center p-1 rounded-full transition-colors ${!newItem.brandId ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-400 hover:text-yellow-400'}`}
                onClick={handleGoToNewProduct}
                disabled={!newItem.brandId}
                title="Create New Product"
              >
                  <Star size={20} className={!newItem.brandId ? "" : "text-yellow-500"} />
              </button>
              )}
            </div>
          </div>


          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Quantity</label>
            <input
              type="number"
              value={newItem.quantity}
             onChange={(e) =>
                setNewItem({ ...newItem, quantity: Number(e.target.value) || 0 })
              }
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Unit Price</label>
            <input
              type="number"
              value={newItem.unitPrice}
             onChange={(e) =>
  setNewItem({ ...newItem, unitPrice: Number(e.target.value) || 0 })
}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Discount (%)</label>
            <input
              type="number"
              value={newItem.discount}
              onChange={(e) =>
  setNewItem({ ...newItem, discount: Number(e.target.value) || 0 })
}

              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>

          {/* Unit (Read Only) */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Unit</label>
            <input
              type="text"
              value={newItem.unitName}
              readOnly
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 outline-none cursor-not-allowed"
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
        <label className="block text-sm text-gray-300 mb-1">Brand Name *</label>
        <input
          type="text"
          placeholder="Brand Name"
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none mb-4"
        />

        <label className="block text-sm text-gray-300 mb-1">Description</label>
        <textarea
            rows={3}
            placeholder="Description"
            value={newBrandDescription}
            onChange={(e) => setNewBrandDescription(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none mb-4 resize-none"
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
        <input
          type="text"
          placeholder="Company Name"
          value={newSupplierName}
          onChange={(e) => setNewSupplierName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none mb-4"
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
                <label className="block text-sm text-gray-300 mb-1">Product Code</label>
                <input
                    type="text"
                    value={newProductData.productCode}
                    onChange={(e) => setNewProductData({...newProductData, productCode: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                />

                <label className="block text-sm text-gray-300 mb-1"><span className="text-red-400">*</span> Product Name</label>
                <input
                    type="text"
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                />

                <label className="block text-sm text-gray-300 mb-1">SN</label>
                <input
                    type="text"
                    value={newProductData.SN}
                    disabled
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-2 text-gray-400 outline-none cursor-not-allowed"
                />

                <label className="block text-sm text-gray-300 mb-1">Model</label>
                <input
                    type="text"
                    value={newProductData.Model}
                    onChange={(e) => setNewProductData({...newProductData, Model: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                />

                <label className="block text-sm text-gray-300 mb-1"><span className="text-red-400">*</span> Unit Price</label>
                <input
                    type="number"
                    step="0.01"
                    value={newProductData.price}
                    onChange={(e) => setNewProductData({...newProductData, price: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                />

                <label className="block text-sm text-gray-300 mb-1"><span className="text-red-400">*</span> Reorder Level</label>
                <input
                    type="number"
                    step="0.01"
                    value={newProductData.ReorderLevel}
                    onChange={(e) => setNewProductData({...newProductData, ReorderLevel: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                />
            </div>
            
            {/* RIGHT COLUMN */}
            <div>
                <label className="block text-sm text-gray-300 mb-1"><span className="text-red-400">*</span> Category</label>
                <select
                    value={newProductData.CategoryId}
                    onChange={(e) => setNewProductData({...newProductData, CategoryId: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                >
                    <option value="">--select--</option>
                    {categoriesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <label className="block text-sm text-gray-300 mb-1"><span className="text-red-400">*</span> Unit</label>
                <select
                    value={newProductData.unitId}
                    onChange={(e) => setNewProductData({...newProductData, unitId: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                >
                    <option value="">--select--</option>
                    {unitsList.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>

                <label className="block text-sm text-gray-300 mb-1"><span className="text-red-400">*</span> Brand</label>
                <select
                    value={newProductData.brandId}
                    onChange={(e) => setNewProductData({...newProductData, brandId: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                >
                    <option value="">--select--</option>
                    {brandsList.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                <label className="block text-sm text-gray-300 mb-1">Image</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2 text-white outline-none"
                />
                    {newProductData.Image && (
                    <img src={newProductData.Image} alt="Preview" className="w-20 h-20 object-cover mt-2 rounded border border-gray-600" />
                    )}
            </div>

            <div className="col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                    value={newProductData.description}
                    onChange={(e) => setNewProductData({...newProductData, description: e.target.value})}
                    className="w-full h-20 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none resize-none"
                />
            </div>
        </div>
      </AddModal>

    </PageLayout>
  );
};

export default NewPurchase;
