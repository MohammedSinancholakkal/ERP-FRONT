// src/pages/purchases/NewPurchase.jsx
import React, { useEffect, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Star,
  Check,
  X,
  Edit
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";

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
  deletePurchaseApi
} from "../../services/allAPI";
import { useParams } from "react-router-dom";

const NewPurchase = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL
  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  // --- TOP SECTION STATE ---
  const [supplier, setSupplier] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // --- DROPDOWN DATA ---
  const [suppliersList, setSuppliersList] = useState([]);
  const [banksList, setBanksList] = useState([]);
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
    fetchSuppliers();
    fetchBanks();
    fetchBrands();
    fetchProducts();
  }, []);

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
        setNoTax(purchase.NoTax === 1);
        setDetails(purchase.Details);

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

  // --- MODAL HANDLERS ---
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

  // --- QUICK CREATE BRAND ---
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return toast.error("Brand name required");
    try {
      const res = await addBrandApi({ name: newBrandName, description: "", userId });
      if (res.status === 200) {
        toast.success("Brand added");
        await fetchBrands(); // Refresh list
        
        // Auto-select the new brand
        // We need to find the new brand. Since API might not return the full object or ID directly in a standard way,
        // we rely on fetching and finding the one with the name we just added. 
        // Ideally API returns the ID. Assuming res.data.id or similar if available, but for now we fetch.
        // A safer bet is to fetch and find by name if ID isn't returned.
        // Let's assume we can find it by name for now or just refresh.
        // To strictly follow "added one should be displayed", we try to find it.
        
        // Re-fetching is async. After await fetchBrands(), brandsList state might not be updated immediately in this closure.
        // So we might need to call a separate function or use the response if it contains ID.
        // For this codebase, let's try to find it in the fresh list if possible, or just rely on user selecting it if we can't.
        // BUT user explicitly asked "added one should be displayed".
        
        // Hack: Fetch and set.
        const updatedBrands = await getBrandsApi(1, 1000);
        if(updatedBrands.status === 200) {
            setBrandsList(updatedBrands.data.records);
            const newBrand = updatedBrands.data.records.find(b => b.name === newBrandName);
            if(newBrand) {
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


  // --- MAIN CALCULATION EFFECT ---
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
  const handleDeletePurchase = async () => {
    if (!window.confirm("Are you sure you want to delete this purchase?")) return;
    try {
      const res = await deletePurchaseApi(id, { userId });
      if (res.status === 200) {
        toast.success("Purchase deleted successfully");
        navigate("/app/purchasing/purchases");
      } else {
        toast.error("Failed to delete purchase");
      }
    } catch (error) {
      console.error("DELETE ERROR", error);
      toast.error("Error deleting purchase");
    }
  };

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-[calc(100vh-80px)] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-white-500 hover:text-yellow-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl text-white-500 font-medium">{id ? "Edit Purchase" : "New Purchase"}</h2>
        </div>

        {/* ACTIONS BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              <button onClick={handleUpdatePurchase}  className="flex items-center gap-2 bg-gray-700 border border-gray-800 px-4 py-2 rounded text-blue-300 hover:bg-gray-600">
                <Save size={18} /> Update
              </button>
              <button onClick={handleDeletePurchase} className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500">
                <Trash2 size={18} /> Delete
              </button>
            </>
          ) : (
            <button onClick={handleSavePurchase} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-white hover:bg-gray-600">
              <Save size={18} /> Save
            </button>
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
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none"
                >
                  <option value="">--select--</option>
                  {suppliersList.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
                <Star size={20} className="text-white cursor-pointer hover:text-yellow-400" onClick={() => navigate("/app/businesspartners/newsupplier")} />
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
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none"
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
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none"
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
                className="w-48 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* LINE ITEMS SECTION */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-300">Line Items</label>
            <button
              onClick={openItemModal}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
            >
              <Plus size={16} /> Add
            </button>
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
              <label className="text-sm text-gray-300">Vat (10%)</label>
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
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none"
              />
            </div>
            <div className="pt-2">
              <label className="text-sm text-gray-300 block mb-1">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full h-24 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none resize-none"
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
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Total Tax</label>
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
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none"
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
                className="w-5 h-5 rounded border-gray-600 bg-gray-800"
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
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl p-6 relative">
            <button 
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl text-white font-semibold mb-6">{editingIndex !== null ? "Edit Line Item" : "Add Line Item"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Brand</label>
                <div className="flex items-center gap-2">
                  <select
                    value={newItem.brandId}
                    onChange={(e) => setNewItem({ ...newItem, brandId: e.target.value, productId: "", productName: "" })}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
                  >
                    <option value="">--select--</option>
                    {brandsList.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
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
                  <select
                    value={newItem.productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    disabled={!newItem.brandId}
                    className={`flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none ${!newItem.brandId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">--select--</option>
                    {productsList
                      .filter(p => String(p.BrandId) === String(newItem.brandId) || String(p.brandId) === String(newItem.brandId))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.ProductName}</option>
                      ))
                    }
                  </select>
                  <Star 
                    size={20} 
                    className="text-yellow-500 cursor-pointer hover:scale-110"
                    onClick={() => {
                        setNewProductData(prev => ({ ...prev, brandId: newItem.brandId }));
                        openProductModal();
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

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={addItemToTable}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD BRAND MODAL --- */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-96 p-6 relative">
             <button 
              onClick={() => setIsBrandModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg text-white font-semibold mb-4">Add New Brand</h3>
            <input
              type="text"
              placeholder="Brand Name"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsBrandModalOpen(false)}
                className="px-3 py-1.5 rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateBrand}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD SUPPLIER MODAL --- */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-96 p-6 relative">
             <button 
              onClick={() => setIsSupplierModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg text-white font-semibold mb-4">Add New Supplier</h3>
            <input
              type="text"
              placeholder="Company Name"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="px-3 py-1.5 rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateSupplier}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD PRODUCT MODAL --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-[60] pt-12">
          <div className="w-[820px] max-h-[86vh] overflow-auto bg-gray-900 text-white rounded-lg border border-gray-700 relative">
             <div className="flex justify-between px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-20">
               <h3 className="text-lg">New Product</h3>
               <button onClick={() => setIsProductModalOpen(false)}><X size={20} /></button>
             </div>
            
            <div className="p-6 grid grid-cols-2 gap-4">
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

            <div className="flex justify-end gap-2 p-5 border-t border-gray-700 bg-gray-900 sticky bottom-5">
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProduct}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  );
};

export default NewPurchase;

