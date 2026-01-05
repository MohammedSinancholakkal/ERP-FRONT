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
  Check,
  ArchiveRestore
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  addSaleApi,
  addBrandApi,
  addCustomerApi,
  addProductApi,
  getUnitsApi,
  getCategoriesApi,
  getSaleByIdApi,
  updateSaleApi,
  deleteSaleApi,
  restoreSaleApi
} from "../../services/allAPI";

const NewSale = () => {
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
  const [paymentAccount, setPaymentAccount] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // --- DROPDOWN DATA ---
  const [customersList, setCustomersList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [productsList, setProductsList] = useState([]);

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
  const [details, setDetails] = useState("");

  // --- CALCULATED VALUES ---
  const [netTotal, setNetTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    fetchCustomers();
    fetchBrands();
    fetchProducts();
    fetchUnits();
    fetchCategories();
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
      const res = await getSaleByIdApi(saleId);
      if (res.status === 200) {
        const { sale, details } = res.data;
        
        // Check inactive status (handling DB bit/boolean/number types)
        const isInactiveDB = sale.IsActive == 0 || sale.isActive == 0 || sale.IsActive === false || sale.isActive === false;
        
        if (isInactiveDB || location.state?.isInactive) {
          setInactiveView(true);
        }

        setCustomer(sale.CustomerId);
        setPaymentAccount(sale.PaymentAccount);
        setInvoiceNo(sale.VNo || "");
        setDate(sale.Date.split('T')[0]);
        setGlobalDiscount(sale.Discount);
        setShippingCost(sale.ShippingCost);
        setPaidAmount(sale.PaidAmount);
        setNoTax(sale.NoTax === 1);
        setDetails(sale.Details);

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
      console.error("Error fetching sale details", error);
      toast.error("Failed to load sale details");
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

  /* ================= LINE ITEM LOGIC ================= */
  const handleProductSelect = (productId) => {
    const product = productsList.find(p => String(p.id) === String(productId));
    if (product) {
      setNewItem(prev => ({
        ...prev,
        productId: product.id,
        productName: product.ProductName,
        unitId: product.UnitId,
        unitName: product.unitName,
        unitPrice: product.UnitPrice,
        quantity: 1, 
        brandId: product.BrandId || prev.brandId,
        brandName: product.brandName || prev.brandName
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
      const res = await addProductApi(payload);
      if (res.status === 200) {
        toast.success("Product added");
        
        const updatedProducts = await getProductsApi(1, 1000);
        if (updatedProducts.status === 200) {
          setProductsList(updatedProducts.data.records);
          const newProduct = updatedProducts.data.records.find(p => p.ProductName === newProductData.name && String(p.BrandId) === String(newProductData.brandId));
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
    const paid = parseFloat(paidAmount) || 0;

    let taxableAmount = subTotal - gDiscount;
    if (taxableAmount < 0) taxableAmount = 0;

    let tax = 0;
    if (!noTax) {
      tax = (taxableAmount * 0.10); // 10% VAT
    }

    const finalTotal = taxableAmount + tax + shipping;

    setNetTotal(finalTotal);
    setGrandTotal(subTotal);
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

  }, [rows, globalDiscount, shippingCost, paidAmount, noTax]);

  /* ================= SAVE / UPDATE SALE ================= */
  const handleSaveSale = async () => {
    const currentUserId = userData?.userId || userData?.id || userData?.Id;
    
    if (!currentUserId) {
      console.error("User ID missing from session data:", userData);
      return toast.error("User session invalid. Please re-login.");
    }

    if (!customer) return toast.error("Please select a customer");
    if (!paymentAccount) return toast.error("Please select a payment account");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      customerId: customer,
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
      vno: invoiceNo || "",
      vat: parseFloat(taxAmount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      vatPercentage: noTax ? 0 : 10,
      noTax: noTax ? 1 : 0,
      vatType: "Percentage",
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
      const res = await addSaleApi(payload);
      if (res.status === 200) {
        toast.success("Sale added successfully");
        navigate("/app/sales/sales"); 
      } else {
        toast.error("Failed to add sale");
      }
    } catch (error) {
      console.error("SAVE ERROR", error);
      toast.error("Error saving sale");
    }
  };

  const handleUpdateSale = async () => {
    if (!customer) return toast.error("Please select a customer");
    if (!paymentAccount) return toast.error("Please select a payment account");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      customerId: customer,
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
      vno: invoiceNo || "",
      vat: parseFloat(taxAmount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      vatPercentage: noTax ? 0 : 10,
      noTax: noTax ? 1 : 0,
      vatType: "Percentage",
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
      const res = await updateSaleApi(id, payload);
      if (res.status === 200) {
        toast.success("Sale updated successfully");
        navigate("/app/sales/sales");
      } else {
        toast.error("Failed to update sale");
      }
    } catch (error) {
      console.error("UPDATE ERROR", error);
      toast.error("Error updating sale");
    }
  };

  const handleDeleteSale = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this sale?",
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
      const res = await deleteSaleApi(id, { userId });
      Swal.close();

      if (res.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Sale deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/app/sales/sales");
      } else {
        Swal.fire("Failed", "Failed to delete sale", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("DELETE SALE ERROR", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting sale",
      });
    }
  };

  const handleRestoreSale = async () => {
    const result = await Swal.fire({
      title: "Restore Sale?",
      text: "Do you want to restore this sale?",
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
      const res = await restoreSaleApi(id, { userId });
      Swal.close();
      if (res.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "Sale restored successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/app/sales/sales");
      } else {
        Swal.fire("Failed", "Failed to restore sale", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("RESTORE ERROR", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error restoring sale",
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
          <button onClick={() => navigate("/app/sales/sales")} className="text-white hover:text-white-400">
            <ArrowLeft size={24} />
          </button>

          <h2 className="text-xl text-white font-medium">
            {inactiveView ? "View Inactive Sale" : (id ? "Edit Sale" : "New Sale")}
          </h2>
        </div>

        {/* ACTIONS BAR */}
        <div className="flex gap-2 mb-6">

          {id ? (
            <>
              {!inactiveView && hasPermission(PERMISSIONS.SALES.EDIT) && (
              <button onClick={handleUpdateSale} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-blue-300 hover:bg-gray-600">
                <Save size={18} /> Update
              </button>
              )}
              {!inactiveView && hasPermission(PERMISSIONS.SALES.DELETE) && (
              <button onClick={handleDeleteSale} className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500">
                <Trash2 size={18} /> Delete
              </button>
              )}
              {inactiveView && (
                  <button onClick={handleRestoreSale} className="flex items-center gap-2 bg-green-600 border border-green-500 px-4 py-2 rounded text-white hover:bg-green-500">
                      <ArchiveRestore size={18} /> Restore
                  </button>
              )}
            </>
          ) : (
            hasPermission(PERMISSIONS.SALES.CREATE) && (
            <button onClick={handleSaveSale} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-white hover:bg-gray-600">
              <Save size={18} /> Save
            </button>
            )
          )}
        </div>

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* LEFT COL */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center">
              <label className="w-32 text-sm text-gray-300">
                <span className="text-red-400">*</span> Customer
              </label>
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

            <div className="flex items-center">
              <label className="w-32 text-sm text-gray-300">
                <span className="text-red-400">*</span> Payment Account
              </label>
              <div className="flex-1">
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
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">{noTax ? "No Tax" : "Vat (10%)"}</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {taxAmount.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
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
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
                disabled={inactiveView}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">{noTax ? "No Tax" : "Total Tax"}</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {taxAmount.toFixed(2)}
              </div>
            </div>
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
                onChange={(e) => setShippingCost(e.target.value)}
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
                  .filter(p => String(p.BrandId) === String(newItem.brandId) || String(p.brandId) === String(newItem.brandId))
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Code */}
          <input
            value={newProductData.productCode}
            onChange={(e) => setNewProductData({ ...newProductData, productCode: e.target.value })}
            placeholder="Product Code"
            className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
          />

          {/* Product Name */}
          <input
            value={newProductData.name}
            onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
            placeholder="Product Name *"
            className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
          />

          {/* SN */}
          <input
            value={newProductData.SN}
            readOnly
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
          />

          {/* Model */}
          <input
            value={newProductData.Model}
            onChange={(e) => setNewProductData({ ...newProductData, Model: e.target.value })}
            placeholder="Model"
            className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
          />

          {/* CATEGORY DROPDOWN */}
          <div ref={categoryRef} className="relative">
            <div
              onClick={() => setOpenCategory(o => !o)}
              className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white cursor-pointer"
            >
              {categoriesList.find(c => c.id === newProductData.CategoryId)?.name || "Select Category"}
            </div>

            {openCategory && (
              <div className="absolute z-50 w-full bg-gray-900 border border-gray-700 rounded mt-1">
                <input
                  autoFocus
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-900 text-white border-b border-gray-700 outline-none"
                />
                <div className="max-h-40 overflow-y-auto">
                  {categoriesList
                    .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setNewProductData({ ...newProductData, CategoryId: c.id });
                          setOpenCategory(false);
                          setCategorySearch("");
                        }}
                        className="px-3 py-2 text-white hover:bg-gray-700 cursor-pointer"
                      >
                        {c.name}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* UNIT DROPDOWN */}
          <div ref={unitRef} className="relative">
            <div
              onClick={() => setOpenUnit(o => !o)}
              className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white cursor-pointer"
            >
              {unitsList.find(u => u.id === newProductData.unitId)?.name || "Select Unit *"}
            </div>

            {openUnit && (
              <div className="absolute z-50 w-full bg-gray-900 border border-gray-700 rounded mt-1">
                <input
                  autoFocus
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-900 text-white border-b border-gray-700 outline-none"
                />
                <div className="max-h-40 overflow-y-auto">
                  {unitsList
                    .filter(u => u.name.toLowerCase().includes(unitSearch.toLowerCase()))
                    .map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setNewProductData({ ...newProductData, unitId: u.id });
                          setOpenUnit(false);
                          setUnitSearch("");
                        }}
                        className="px-3 py-2 text-white hover:bg-gray-700 cursor-pointer"
                      >
                        {u.name}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* BRAND DROPDOWN */}
          <div ref={brandProductRef} className="relative">
            <div
              onClick={() => setOpenBrandProduct(o => !o)}
              className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white cursor-pointer"
            >
              {brandsList.find(b => b.id === newProductData.brandId)?.name || "Select Brand *"}
            </div>

            {openBrandProduct && (
              <div className="absolute z-50 w-full bg-gray-900 border border-gray-700 rounded mt-1">
                <input
                  autoFocus
                  value={brandProductSearch}
                  onChange={(e) => setBrandProductSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-900 text-white border-b border-gray-700 outline-none"
                />
                <div className="max-h-40 overflow-y-auto">
                  {brandsList
                    .filter(b => b.name.toLowerCase().includes(brandProductSearch.toLowerCase()))
                    .map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setNewProductData({ ...newProductData, brandId: b.id });
                          setOpenBrandProduct(false);
                          setBrandProductSearch("");
                        }}
                        className="px-3 py-2 text-white hover:bg-gray-700 cursor-pointer"
                      >
                        {b.name}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Unit Price */}
          <input
            type="number"
            value={newProductData.price}
            onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
            placeholder="Unit Price"
            className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
          />

          {/* Reorder Level */}
          <input
            type="number"
            value={newProductData.ReorderLevel}
            onChange={(e) => setNewProductData({ ...newProductData, ReorderLevel: e.target.value })}
            placeholder="Reorder Level"
            className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
          />

          {/* Model */}
            {/* Added twice in original, but keeping structure clean here. Already added above. */}

           {/* DESCRIPTION */}
           <div className="md:col-span-2">
            <textarea
              value={newProductData.description}
              onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
              placeholder="Description"
              className="w-full h-20 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none resize-none"
            />
           </div>

        </div>
      </AddModal>


    </PageLayout>
  );
};

export default NewSale;
