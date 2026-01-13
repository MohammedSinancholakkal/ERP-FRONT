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
  Check,
  ArchiveRestore
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ReactDOM from "react-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";

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
  getTaxTypesApi
} from "../../services/allAPI";

const NewSaleQuotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [inactiveView, setInactiveView] = useState(false);

  useEffect(() => {
    if (location.state?.isInactive) {
      setInactiveView(true);
    }
  }, [location.state]);

  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  // --- TOP SECTION STATE ---
  const [customer, setCustomer] = useState("");
  const [vehicleNo, setVehicleNo] = useState(""); // ADDED
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
        // remove: payment account and invoice handling (not used)
        // setInvoiceNo(sale.VNo || "");
        if (quotation.Date) setDate(String(quotation.Date).split("T")[0]);
        setVehicleNo(quotation.VehicleNo || quotation.vehicleNo || ""); // ADDED
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
          brandId: d.brandId || d.BrandId
        }));
        setRows(mappedRows);
      }
    } catch (error) {
      console.error("Error fetching sale details", error);
      toast.error("Failed to load quotation details");
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
      const res = await addBrandApi({ name: newBrandName, description: "", userId });
      if (res.status === 200) {
        toast.success("Brand added");

        const updatedBrands = await getBrandsApi(1, 1000);
        if (updatedBrands.status === 200) {
          setBrandsList(updatedBrands.data.records);
          const newBrand = updatedBrands.data.records.find(b => b.name === newBrandName);
          if (newBrand) {
            setNewItem(prev => ({ ...prev, brandId: newBrand.id, productId: "", productName: "" }));
          }
        }

        setIsBrandModalOpen(false);
        setNewBrandName("");
      }
    } catch (error) {
      toast.error("Failed to add brand");
    }
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
      const res = await addProductApi(payload);
      if (res.status === 200) {
        toast.success("Product added");

        const updatedProducts = await getProductsApi(1, 1000);
        if (updatedProducts.status === 200) {
          setProductsList(updatedProducts.data.records);
          const newProduct = updatedProducts.data.records.find(p => (p.ProductName === newProductData.name || p.ProductName === newProductData.name) && String(p.BrandId) === String(newProductData.brandId));
          if (newProduct) {
            handleProductSelect(newProduct.id);
          }
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

  if (!customer) return toast.error("Please select a customer");
  if (!expiryDate) return toast.error("Please select expiry date");
  if (!noTax && !taxTypeId) return toast.error("Tax Type is required");
  if (rows.length === 0) return toast.error("Please add at least one item");

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
    toast.error("Error saving quotation");
  }
};

/* ================= UPDATE QUOTATION ================= */
const handleUpdateQuotation = async () => {
  if (!customer) return toast.error("Please select a customer");
  if (!expiryDate) return toast.error("Please select expiry date");
  if (!noTax && !taxTypeId) return toast.error("Tax Type is required");
  if (rows.length === 0) return toast.error("Please add at least one item");

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
    toast.error("Error updating quotation");
  }
};

/* ================= DELETE QUOTATION ================= */
const handleDeleteQuotation = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this quotation?",
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
    const res = await deleteQuotationApi(id, { userId });
    Swal.close();

    if (res.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Quotation deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      navigate("/app/sales/salesquotations");
    } else {
        Swal.fire("Failed", "Failed to delete quotation", "error");
    }
  } catch (error) {
    Swal.close();
    console.error("DELETE QUOTATION ERROR:", error);
    Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting quotation",
      });
  }
};

const handleRestoreQuotation = async () => {
    const result = await Swal.fire({
      title: "Restore Quotation?",
      text: "Do you want to restore this quotation?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // green-500
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
      const res = await restoreQuotationApi(id, { userId });
      Swal.close();
      if (res.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "Quotation restored successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/app/sales/salesquotations");
      } else {
        Swal.fire("Failed", "Failed to restore quotation", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("RESTORE ERROR", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error restoring quotation",
      });
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
      total: 0
    });
    setIsItemModalOpen(true);
  };


  /* ================= UI ================= */
  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate("/app/sales/salesquotations")} className="text-white hover:text-white-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl text-white font-medium">
            {inactiveView ? "View Inactive Quotation" : (id ? "Edit Quotation" : "New Quotation")}
          </h2>
        </div>

        {/* ACTIONS BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              {!inactiveView && hasPermission(PERMISSIONS.SALES.EDIT) && (
              <button onClick={handleUpdateQuotation} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-blue-300 hover:bg-gray-600">
                <Save size={18} /> Update
              </button>
              )}
              {!inactiveView && hasPermission(PERMISSIONS.SALES.DELETE) && (
              <button onClick={handleDeleteQuotation} className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500">
                <Trash2 size={18} /> Delete
              </button>
              )}
              {inactiveView && (
                  <button onClick={handleRestoreQuotation} className="flex items-center gap-2 bg-green-600 border border-green-500 px-4 py-2 rounded text-white hover:bg-green-500">
                      <ArchiveRestore size={18} /> Restore
                  </button>
              )}
            </>
          ) : (
            hasPermission(PERMISSIONS.SALES.CREATE) && (
            <button onClick={handleSaveQuotation} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-white hover:bg-gray-600">
              <Save size={18} /> Save
            </button>
            )
          )}
        </div>

        {/* TOP SECTION - 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LEFT COL - Customer & Tax Type */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="flex items-center">
              <label className="w-32 text-sm text-gray-300">
                <span className="text-red-400">*</span> Customer
              </label>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <SearchableSelect
                    options={customersList.map(c => ({ id: c.id, name: c.companyName }))}
                    value={customer}
                    onChange={setCustomer}
                    placeholder="Select customer..."
                    className="w-full"
                    disabled={inactiveView}
                  />
                  {!inactiveView && (
                  <Star
                    size={20}
                    className="text-white cursor-pointer hover:text-yellow-400"
                    onClick={() => navigate("/app/businesspartners/newcustomer", { state: { returnTo: location.pathname } })}
                  />
                  )}
                </div>
              </div>
            </div>

            {/* Tax Type (Moved from bottom) */}
            <div className="flex items-center">
              <label className="w-32 text-sm text-gray-300">
                  <span className="text-red-400">*</span> Tax Type
              </label>
              <select
                value={taxTypeId}
                onChange={(e) => setTaxTypeId(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
                disabled={inactiveView || noTax}
              >
                  <option value="">--Select--</option>
                  {taxTypesList.map(t => (
                      <option key={t.id || t.typeId} value={t.id || t.typeId}>
                          {t.name || t.typeName} ({t.percentage}%)
                      </option>
                  ))}
              </select>
            </div>
          </div>

          {/* RIGHT COL - Dates */}
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-center">
               <label className="w-32 text-sm text-gray-300">
                 <span className="text-red-400">*</span> Date
               </label>
               <input
                 type="date"
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
                 disabled={inactiveView}
               />
            </div>

            {/* Expiry Date */}
            <div className="flex items-center">
               <label className="w-32 text-sm text-gray-300">Expiry Date</label>
               <input
                 type="date"
                 value={expiryDate}
                 onChange={(e) => setExpiryDate(e.target.value)}
                 className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
                 disabled={inactiveView}
               />
            </div>

            {/* Vehicle No */}
            <div className="flex items-center">
               <label className="w-32 text-sm text-gray-300">Vehicle No</label>
               <input
                 type="text"
                 value={vehicleNo}
                 onChange={(e) => setVehicleNo(e.target.value)}
                 className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
                 disabled={inactiveView}
                 placeholder="Enter Vehicle No"
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
              className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700"
            >
              <Plus size={16} /> Add
            </button>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded overflow-hidden min-w-[900px]">
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
                  <th className="p-3 w-20"></th>
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
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
                disabled={inactiveView}
              />
            </div>
            
            {/* CONDITIONAL TAX INPUTS */}
            {!noTax && taxTypeId && (() => {
               const selectedTax = taxTypesList.find(t => String(t.id) === String(taxTypeId) || String(t.typeId) === String(taxTypeId));
               if(!selectedTax) return null;
               
               if(selectedTax.isInterState) {
                   return (
                     <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">IGST %</label>
                       <input
                          type="text"
                          value={`${igstRate}%`}
                          readOnly
                          className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 outline-none cursor-not-allowed"
                       />
                     </div>
                   );
               } else {
                   return (
                     <>
                      <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">CGST %</label>
                       <input
                          type="text"
                          value={`${cgstRate}%`}
                          readOnly
                          className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 outline-none cursor-not-allowed"
                       />
                      </div>
                      <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">SGST %</label>
                       <input
                          type="text"
                          value={`${sgstRate}%`}
                          readOnly
                          className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 outline-none cursor-not-allowed"
                       />
                      </div>
                     </>
                   );
               }
            })()}

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">{noTax ? "No Tax" : "Total Tax"}</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {taxAmount.toFixed(2)}
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
                onChange={(e) => setShippingCost(e.target.value)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
                disabled={inactiveView}
              />
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
            <label className="block text-sm text-gray-300 mb-1"> * Brand</label>
            <div className="flex items-center gap-2">
              <SearchableSelect
                options={brandsList.map(b => ({ id: b.id, name: b.name }))}
                value={newItem.brandId}
                onChange={(val) => setNewItem({ ...newItem, brandId: val, productId: "", productName: "" })}
                placeholder="--select brand--"
                className="flex-1"
              />
              <Star
                size={20}
                className="text-yellow-500 cursor-pointer hover:scale-110"
                onClick={() => setIsBrandModalOpen(true)}
              />
            </div>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product</label>
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
                className={`flex-1 ${!newItem.brandId ? 'opacity-50 pointer-events-none' : ''}`}
              />
              <Star
                size={20}
                className={`cursor-pointer hover:scale-110 ${newItem.brandId ? 'text-yellow-500' : 'text-gray-500'}`}
                onClick={() => {
                  if (newItem.brandId) {
                    setNewProductData(prev => ({ ...prev, brandId: newItem.brandId }));
                    openProductModal();
                  }
                }}
              />
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
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Unit Price</label>
            <input
              type="number"
              value={newItem.unitPrice}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Discount (%)</label>
            <input
              type="number"
              value={newItem.discount}
              onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
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

          {/* Tax Percentage (Read Only) */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Tax Percentage (%)</label>
            <input
              type="text"
              value={newItem.taxPercentage}
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
        <input
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          placeholder="Brand Name"
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none mb-4"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product Code</label>
            <input
              type="text"
              value={newProductData.productCode}
              onChange={(e) => setNewProductData({ ...newProductData, productCode: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product Name *</label>
            <input
              type="text"
              value={newProductData.name}
              onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">SN</label>
            <input
              type="text"
              value={newProductData.SN}
              readOnly
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Model</label>
            <input
              type="text"
              value={newProductData.Model}
              onChange={(e) => setNewProductData({ ...newProductData, Model: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Unit Price</label>
            <input
              type="number"
              value={newProductData.price}
              onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Reorder Level</label>
            <input
              type="number"
              value={newProductData.ReorderLevel}
              onChange={(e) => setNewProductData({ ...newProductData, ReorderLevel: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>
          {/* CATEGORY */}
          <div className="relative" ref={categoryRef}>
            <label className="block text-sm text-gray-300 mb-1">Category</label>

            <div
              onClick={() => setOpenCategory(o => !o)}
              className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white cursor-pointer flex justify-between items-center"
            >
              <span className={newProductData.CategoryId ? "text-white" : "text-gray-500"}>
                {categoriesList.find(c => String(c.id) === String(newProductData.CategoryId))?.name || "--select--"}
              </span>
              <span className="text-gray-400">▾</span>
            </div>

            {openCategory && (
              <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded max-h-40 overflow-y-auto">
                <input
                  autoFocus
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-900 text-white border-b border-gray-700 text-sm outline-none"
                />

                {categoriesList
                  .filter(c => c.name.toLowerCase().includes(searchCategory.toLowerCase()))
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setNewProductData({ ...newProductData, CategoryId: c.id });
                        setOpenCategory(false);
                        setSearchCategory("");
                      }}
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-white"
                    >
                      {c.name}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* UNIT */}
          <div className="relative" ref={unitRef}>
            <label className="block text-sm text-gray-300 mb-1">Unit *</label>

            <div
              onClick={() => setOpenUnit(o => !o)}
              className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white cursor-pointer flex justify-between items-center"
            >
              <span className={newProductData.unitId ? "text-white" : "text-gray-500"}>
                {unitsList.find(u => String(u.id) === String(newProductData.unitId))?.name || "--select--"}
              </span>
              <span className="text-gray-400">▾</span>
            </div>

            {openUnit && (
              <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded max-h-40 overflow-y-auto">
                <input
                  autoFocus
                  value={searchUnit}
                  onChange={(e) => setSearchUnit(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-900 border-b border-gray-700 text-sm outline-none"
                />

                {unitsList
                  .filter(u => u.name.toLowerCase().includes(searchUnit.toLowerCase()))
                  .map(u => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setNewProductData({ ...newProductData, unitId: u.id });
                        setOpenUnit(false);
                        setSearchUnit("");
                      }}
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {u.name}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* BRAND */}
          <div className="relative" ref={brandRef}>
            <label className="block text-sm text-gray-300 mb-1">Brand *</label>

            <div
              onClick={() => setOpenBrand(o => !o)}
              className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white cursor-pointer flex justify-between items-center"
            >
              <span className={newProductData.brandId ? "text-white" : "text-gray-500"}>
                {brandsList.find(b => String(b.id) === String(newProductData.brandId))?.name || "--select--"}
              </span>
              <span className="text-gray-400">▾</span>
            </div>

            {openBrand && (
              <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded max-h-40 overflow-y-auto">
                <input
                  autoFocus
                  value={searchBrand}
                  onChange={(e) => setSearchBrand(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-900 border-b border-gray-700 text-sm outline-none"
                />

                {brandsList
                  .filter(b => b.name.toLowerCase().includes(searchBrand.toLowerCase()))
                  .map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setNewProductData({ ...newProductData, brandId: b.id });
                        setOpenBrand(false);
                        setSearchBrand("");
                      }}
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {b.name}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={newProductData.description}
              onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
            />
          </div>
        </div>
      </AddModal>

    </PageLayout>
  );
};

export default NewSaleQuotation;
