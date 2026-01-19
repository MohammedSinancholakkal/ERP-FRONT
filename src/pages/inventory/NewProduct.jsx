import React, { useEffect, useState, useRef } from "react";
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X,
  Paperclip,
  Trash2,
  Star // Added for visual match, functional if we add logic
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import SearchableSelect from "../../components/SearchableSelect";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";

import {
  addProductApi,
  updateProductApi,
  getCategoriesApi,
  getUnitsApi,
  getBrandsApi,
  getCountriesApi,
  getProductsApi,
  addCategoryApi,
  addUnitApi,
  addBrandApi,
  getSuppliersApi,
  deleteProductApi,
  getTaxPercentagesApi,
  searchProductApi,
  searchCategoryApi,
  searchUnitsApi,
  searchBrandApi
} from "../../services/allAPI";
import AddModal from "../../components/modals/AddModal";

const NewProduct = () => {
  const { theme } = useTheme();    
  const navigate = useNavigate();
  const { id } = useParams(); 
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || user?.id || 1;

  // --- STATE ---
  const [product, setProduct] = useState({
    productCode: "",
    ProductName: "",
    SN: "",
    Model: "",
    UnitPrice: "0.00",
    ReorderLevel: "10.00",
    CategoryId: "",
    UnitId: "",
    BrandId: "",
    SupplierId: "",
    CountryId: "",
    Image: "",
    ProductDetails: "",
    HSNCode: "",
    Colour: "",

    Grade: "",

    TaxPercentageId: "",
    OpeningStock: "0"      
  });

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [taxPercentages, setTaxPercentages] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- QUICK ADD STATES ---
  // Category
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentCategoryId: null
  });

  // Unit
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: "", description: "" });

  // Brand
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", description: "" });


  // --- INITIAL LOAD ---
  useEffect(() => {
    loadDropdowns();
    if (id) {
      loadProductDetails(id);
    } else {
      generateNextSN();
    }
    
    // Check for pre-fill data (e.g. Brand) from navigation
    if (location.state?.brandId) {
        setProduct(prev => ({ ...prev, BrandId: location.state.brandId }));
    }
  }, [id, location.state]);

  const loadDropdowns = async () => {
    try {
      const [cRes, uRes, bRes, coRes, sRes, tRes] = await Promise.all([
        getCategoriesApi(1, 1000),
        getUnitsApi(),
        getBrandsApi(),
        getCountriesApi(1, 1000),
        getSuppliersApi(1, 1000),
        getTaxPercentagesApi(1, 1000)
      ]);

      if (cRes.status === 200) setCategories(cRes.data.records || []);
      if (uRes.status === 200) setUnits(uRes.data.records || []);
      if (bRes.status === 200) setBrands(bRes.data.records || []);
      if (coRes.status === 200) setCountries(coRes.data.records || []);
      if (sRes.status === 200) setSuppliers(sRes.data.records || []);
      if (tRes.status === 200) setTaxPercentages(tRes.data.records || []);

    } catch (error) {
      console.error("Error loading dropdowns", error);
      showErrorToast("Failed to load form data");
    }
  };

  const generateNextSN = async () => {
    try {
      const res = await getProductsApi(1, 10000); 
      if (res.status === 200) {
        const allProducts = res.data.records || [];
        let max = 0;
        allProducts.forEach((p) => {
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
        setProduct(prev => ({ ...prev, SN: `P${String(next).padStart(6, "0")}` }));
      }
    } catch (error) {
      console.error("Error generating SN", error);
    }
  };

  const loadProductDetails = async (productId) => {
      setLoading(true);
      try {
           const res = await getProductsApi(1, 10000);
           if (res.status === 200) {
               const found = res.data.records.find(p => String(p.id) === String(productId));
               if (found) {
                   setProduct({
                       productCode: found.Barcode || "",
                       ProductName: found.ProductName || "",
                       SN: found.SN || "",
                       Model: found.Model || "",
                       UnitPrice: found.UnitPrice != null ? String(found.UnitPrice) : "0.00",
                       ReorderLevel: found.ReorderLevel != null ? String(found.ReorderLevel) : "10.00",
                       CategoryId: found.CategoryId || "",
                       UnitId: found.UnitId || "",
                        BrandId: found.BrandId || "",
                        SupplierId: found.SupplierId || "",
                        CountryId: found.CountryId || "",
                       Image: found.Image || "",
                       ProductDetails: found.ProductDetails || "",
                       HSNCode: found.HSNCode || "",
                       Colour: found.Colour || "",
                       Grade: found.Grade || "",
                       TaxPercentageId: found.TaxPercentageId || ""
                   });
               } else {
                   toast.error("Product not found");
                   navigate("/app/inventory/products");
               }
           }
      } catch (error) {
          console.error("Error loading product", error);
          showErrorToast("Failed to load product details");
      } finally {
          setLoading(false);
      }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProduct((p) => ({ ...p, Image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const nameLen = product.ProductName?.trim().length || 0;
    if (nameLen < 2 || nameLen > 100) return showErrorToast("Product Name must be between 2 and 100 characters");
    
    if (product.Model && product.Model.trim().length < 2) return showErrorToast("Model must be at least 2 characters");
    if (product.HSNCode && product.HSNCode.trim().length < 3) return showErrorToast("HSN Code must be at least 3 characters");
    
    const colorLen = product.Colour?.trim().length || 0;
    if (product.Colour && (colorLen < 2 || colorLen > 10)) return showErrorToast("Colour must be between 2 and 10 characters");

    if (product.Grade && product.Grade.trim().length > 10) return showErrorToast("Grade must be at most 10 characters");

    const detailsLen = product.ProductDetails?.trim().length || 0;
    if (product.ProductDetails && (detailsLen < 2 || detailsLen > 300)) return showErrorToast("Product Details must be between 2 and 300 characters");

    if (product.UnitPrice === "" || isNaN(Number(product.UnitPrice))) return showErrorToast("Unit Price required");
    if (product.ReorderLevel === "" || isNaN(Number(product.ReorderLevel))) return showErrorToast("Reorder Level required");
    if (!product.CategoryId) return showErrorToast("Category required");
    if (!product.UnitId) return showErrorToast("Unit required");
    if (!product.BrandId) return showErrorToast("Brand required");
    if (!product.TaxPercentageId) return showErrorToast("Tax Percentage required");

    const payload = {
      Barcode: product.productCode || null,
      SN: product.SN,
      ProductName: product.ProductName,
      Model: product.Model,
      UnitPrice: parseFloat(product.UnitPrice),

      UnitsInStock: id ? 0 : parseFloat(product.OpeningStock || 0),
      UnitsOnOrder: 0,

      ReorderLevel: parseFloat(product.ReorderLevel),
      CategoryId: product.CategoryId || null,
      UnitId: product.UnitId || null,
      BrandId: product.BrandId || null,
      SupplierId: product.SupplierId || null,
      CountryId: product.CountryId || null,
      Image: product.Image,
      ProductDetails: product.ProductDetails,
      HSNCode: product.HSNCode,
      Colour: product.Colour,
      Grade: product.Grade,
      TaxPercentageId: product.TaxPercentageId,
      userId: currentUserId
    };

    // DUPLICATE CHECK
    try {
        const searchRes = await searchProductApi(product.ProductName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data.records || searchRes.data || [];
            // Check Name
            const existingName = rows.find(p => 
                (p.ProductName || "").toLowerCase() === product.ProductName.trim().toLowerCase() && 
                (id ? String(p.id) !== String(id) : true)
            );
            if (existingName) return showErrorToast("Product with this Name already exists");
        }

        // Check Product Code (Barcode) if provided
        if (product.productCode?.trim()) {
           const codeRes = await searchProductApi(product.productCode.trim());
           if (codeRes?.status === 200) {
              const rows = codeRes.data.records || codeRes.data || [];
              const existingCode = rows.find(p => 
                  (p.Barcode || "").toLowerCase() === product.productCode.trim().toLowerCase() && 
                  (id ? String(p.id) !== String(id) : true)
              );
              if (existingCode) return showErrorToast("Product with this Code already exists");
           }
        }

    } catch (e) {
        console.error("Duplicate Check Error", e);
    }

    setLoading(true);
    // ... rest of handleSave

    try {
      let res;
      if (id) {
          // Update
           res = await updateProductApi(id, payload);
      } else {
          // Create
           res = await addProductApi(payload);
      }

      if (res.status === 200) {
        showSuccessToast(id ? "Product updated successfully" : "Product added successfully");
        
        // --- NAVIGATION LOGIC ---
        if (location.state?.returnTo) {
             const createdId = id || res.data?.id; 
             navigate(location.state.returnTo, { 
                 state: { 
                     preserveState: location.state.preserveState,
                     createdProductId: createdId,
                     createdProductName: product.ProductName
                 } 
             });
        } else {
             navigate("/app/inventory/products");
        }
      } else {
        showErrorToast(res.message || "Operation failed");
      }
    } catch (error) {
      console.error("Save Error", error);
      showErrorToast("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    const result = await showDeleteConfirm();

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
        const res = await deleteProductApi(id, { userId: currentUserId });
        if (res.status === 200) {
            showSuccessToast("Product deleted successfully");
            navigate("/app/inventory/products");
        } else {
            showErrorToast(res.message || "Failed to delete product");
        }
    } catch (error) {
        console.error("Delete Error", error);
        showErrorToast("Server error during deletion");
    } finally {
        setLoading(false);
    }
  };

  // --- QUICK ADD HANDLERS ---
  
  // Category
  const handleAddCategory = async () => {
    const nameLen = newCategory.name.trim().length;
    if (nameLen < 2 || nameLen > 50) return showErrorToast("Category Name must be between 2 and 50 characters");

    const descLen = newCategory.description?.trim().length || 0;
    if (newCategory.description && (descLen < 2 || descLen > 300)) return showErrorToast("Category Description must be between 2 and 300 characters");

    if (!newCategory.name.trim()) return showErrorToast("Category Name required");

    try {
        // DUPLICATE CHECK
        const searchRes = await searchCategoryApi(newCategory.name.trim());
        if (searchRes?.status === 200) {
           const rows = searchRes.data.records || searchRes.data || [];
           const existing = rows.find(c => c.name.toLowerCase() === newCategory.name.trim().toLowerCase());
           if (existing) return showErrorToast("Category with this name already exists");
        }

        const res = await addCategoryApi({
            ...newCategory,
            userId: currentUserId
        });
        if (res.status === 200) {
            showSuccessToast("Category added successfully");
            setCategoryModalOpen(false);
            setNewCategory({ name: "", description: "", parentCategoryId: null });
            loadDropdowns(); 
        } else {
            showErrorToast(res.message || "Failed to add category");
        }
    } catch (error) {
        console.error("Add category error", error);
        showErrorToast("Server error adding category");
    }
  };

  // Unit
  const handleAddUnit = async () => {
    const nameLen = newUnit.name.trim().length;
    if (nameLen < 2 || nameLen > 50) return showErrorToast("Unit Name must be between 2 and 50 characters");

    // Unit description isn't in the object provided in the state def: { name: "", description: "" }
    // but the modal usually has name/description.
    const descLen = newUnit.description?.trim().length || 0;
    if (newUnit.description && (descLen < 2 || descLen > 300)) return showErrorToast("Unit Description must be between 2 and 300 characters");

    if (!newUnit.name.trim()) return showErrorToast("Unit Name required");
    try {
      // DUPLICATE CHECK
      const searchRes = await searchUnitsApi(newUnit.name.trim());
      if (searchRes?.status === 200) {
         const rows = searchRes.data.records || searchRes.data || [];
         const existing = rows.find(u => (u.name || "").toLowerCase() === newUnit.name.trim().toLowerCase());
         if (existing) return showErrorToast("Unit Name already exists");
      }

      const res = await addUnitApi({ ...newUnit, userId: currentUserId });
      if (res?.status === 200) {
        showSuccessToast("Unit added");
        setNewUnit({ name: "", description: "" });
        setUnitModalOpen(false);
        loadDropdowns();
      } else {
        showErrorToast("Failed to add unit");
      }
    } catch (error) {
      console.error("Add unit error", error);
      showErrorToast("Server error adding unit");
    }
  };

  // Brand
  const handleAddBrand = async () => {
    const nameLen = newBrand.name.trim().length;
    if (nameLen < 2 || nameLen > 50) return showErrorToast("Brand Name must be between 2 and 50 characters");

    const descLen = newBrand.description?.trim().length || 0;
    if (newBrand.description && (descLen < 2 || descLen > 300)) return showErrorToast("Brand Description must be between 2 and 300 characters");

    if (!newBrand.name.trim()) return showErrorToast("Brand Name required");
    try {
      // DUPLICATE CHECK
      const searchRes = await searchBrandApi(newBrand.name.trim());
      if (searchRes?.status === 200) {
          const rows = searchRes.data.records || searchRes.data || [];
          const existing = rows.find(b => (b.name || "").toLowerCase() === newBrand.name.trim().toLowerCase());
          if (existing) return showErrorToast("Brand Name already exists");
      }

      const res = await addBrandApi({ ...newBrand, userId: currentUserId });
      if (res?.status === 200) {
        showSuccessToast("Brand added");
        setNewBrand({ name: "", description: "" });
        setBrandModalOpen(false);
        loadDropdowns();
      } else if (res?.status === 409) {
        showErrorToast(res.data.message || "Brand Name already exists");
      } else {
        showErrorToast("Failed to add brand");
      }
    } catch (error) {
      console.error("Add brand error", error);
      showErrorToast("Server error adding brand");
    }
  };


  // --- RENDER HELPERS ---
  const inputClass = `w-full px-3 py-2 rounded border bg-transparent outline-none transition-colors ${
    theme === 'emerald' 
      ? 'border-gray-300 focus:border-emerald-500' 
      : theme === 'purple'
      ? 'border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 bg-white text-gray-900'
      : 'border-gray-600 focus:border-white bg-gray-800'
  }`;

  const labelClass = "block text-sm font-medium mb-1.5 text-black";
  const requiredStar = <span className="text-red-500">*</span>;

  return (
    <PageLayout>
      <div className={`p-6 min-h-full ${theme === 'emerald' ? 'bg-white text-gray-900' : theme === 'purple' ? 'bg-gray-150 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        
        <ContentCard className="!h-auto !overflow-visible">
        <div className="flex flex-col">
        
        {/* TOP BAR */}
        <div className="px-6 py-4 shrink-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <button 
                    onClick={() => {
                        if (location.state?.returnTo) {
                            navigate(location.state.returnTo, {
                                    state: { preserveState: location.state.preserveState }
                            });
                        } else {
                            navigate("/app/inventory/products");
                        }
                    }}
                    className={`p-2 rounded-full ${theme === 'emerald' ? 'hover:bg-emerald-200' : theme === 'purple' ? 'hover:bg-purple-200 text-purple-900' : 'hover:bg-gray-700'}`}
                    >
                    <ArrowLeft size={24} />
                    </button>
                    <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>{id ? "Edit Product" : "New Product"}</h2>
                </div>
                {/* Save Button */}

                <div className="flex items-center gap-2">
                    {id && (
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium ${
                            theme === 'emerald'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : theme === 'purple'
                            ? 'bg-[var(--theme-color)] hover:bg-[#8066a3] text-white'
                            : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 text-blue-300'
                        }`}
                        style={theme === 'purple' ? { backgroundColor: '#6448AE' } : {}}
                    >
                        <Save size={18} />
                        {loading ? (id ? "Updating..." : "Saving...") : (id ? "Update" : "Save")}
                    </button>
                </div>
            </div>
            <hr className="mb-4 border-gray-300" />
        </div>


        {/* MAIN FORM CONTAINER */}
        <div className={`p-6   ${theme === 'emerald' ? 'bg-white text-gray-900' : theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
             
             <div className="grid grid-cols-12 gap-x-6 gap-y-4">

                {/* ROW 1: Code (left), Name (right) */}
                <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                           label="Product Code"
                           value={product.productCode}
                           onChange={(e) => setProduct({...product, productCode: e.target.value})}
                           placeholder=""
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                          label="Product Name"
                          required
                          value={product.ProductName}
                          onChange={(e) => setProduct({...product, ProductName: e.target.value})}
                          placeholder=""
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>

                {/* ROW 2: Model (Left), SN (Right) */}
                 <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                          label="Model"
                          value={product.Model}
                          onChange={(e) => setProduct({...product, Model: e.target.value})}
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>

                 <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                          label="Sn"
                          value={product.SN}
                          readOnly
                          disabled
                          className="opacity-60 cursor-not-allowed"
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>


                {/* ROW 3: Unit Price (Left), Reorder Level (Right) */}
                 <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                          label="Unit Price"
                          required
                          type="number"
                          step="0.01"
                          value={product.UnitPrice}
                          onChange={(e) => setProduct({...product, UnitPrice: e.target.value})}
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>

                 <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                          label="Reorder Level"
                          required
                          type="number"
                          step="0.01"
                          value={product.ReorderLevel}
                          onChange={(e) => setProduct({...product, ReorderLevel: e.target.value})}
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>

                 {/* ROW 4: Category (Left), Unit (Right) */}
                 <div className="col-span-12 md:col-span-6">
                    <div className="flex items-center gap-2">
                         <div className="flex-1 font-medium">
                            <SearchableSelect
                                label="Category"
                                required
                                options={categories.map(c => ({ id: c.id, name: c.name || c.CategoryName }))}
                                value={product.CategoryId}
                                onChange={(val) => setProduct({...product, CategoryId: val})}
                                placeholder="--select--"
                                className={theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={() => setCategoryModalOpen(true)}
                            className={`p-2 mt-6  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        >
                            <Star size={16} />
                        </button>
                    </div>
                </div>

                 <div className="col-span-12 md:col-span-6">
                     <div className="flex items-center gap-2">
                         <div className="flex-1 font-medium">
                            <SearchableSelect
                                label="Unit"
                                required
                                options={units.map(u => ({ id: u.id, name: u.name || u.UnitName }))}
                                value={product.UnitId}
                                onChange={(val) => setProduct({...product, UnitId: val})}
                                placeholder="--select--"
                            />
                        </div>
                        <button 
                             type="button"
                             onClick={() => setUnitModalOpen(true)}
                             className={`p-2 mt-6  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                        >
                            <Star size={16} />
                        </button>
                    </div>
                </div>

                {/* ROW 5: HSN Code (Left), Company/Brand (Right) */}
                 <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                          label="HSN Code"
                          value={product.HSNCode}
                          onChange={(e) => setProduct({...product, HSNCode: e.target.value})}
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>

                 <div className="col-span-12 md:col-span-6">
                     <div className="flex items-center gap-2">
                         <div className="flex-1 font-medium">
                             <SearchableSelect
                                label="Company / Brand"
                                required
                                options={brands.map(b => ({ id: b.id, name: b.name || b.BrandName }))}
                                value={product.BrandId}
                                onChange={(val) => setProduct({...product, BrandId: val})}
                                placeholder="--select--"
                            />
                        </div>
                         <button 
                            type="button"
                            onClick={() => setBrandModalOpen(true)}
                            className={`p-2 mt-6  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                         >
                            <Star size={16} />
                        </button>
                    </div>
                </div>

                {/* ROW 6: Supplier (Left), Tax Percentage (Right) */}
                 <div className="col-span-12 md:col-span-6">
                     <div className="flex items-center gap-2">
                      <div className="flex-1 font-medium">
                          <SearchableSelect
                            label="Supplier"
                            options={suppliers.map(s => ({ id: s.id, name: s.companyName || s.name }))}
                            value={product.SupplierId}
                            onChange={(val) => setProduct({...product, SupplierId: val})}
                            placeholder="--select--"
                        />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                    </div>
                </div>

                 <div className="col-span-12 md:col-span-6">
                     <div className="flex items-center gap-2">
                      <div className="flex-1 font-medium">
                          <SearchableSelect
                            label="Tax Percentage"
                            required
                            options={taxPercentages.map(t => ({ id: t.id, name: `${t.percentage}%` }))}
                            value={product.TaxPercentageId}
                            onChange={(val) => setProduct({...product, TaxPercentageId: val})}
                            placeholder="--select--"
                        />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                    </div>
                </div>


                {/* ROW 7: Colour (Left), Grade (Right) */}
                 <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                      <InputField
                          label="Colour"
                          value={product.Colour}
                          onChange={(e) => setProduct({...product, Colour: e.target.value})}
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>

                 <div className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-2">
                     <div className="flex-1 font-medium">
                       <InputField
                          label="Grade"
                          value={product.Grade}
                          onChange={(e) => setProduct({...product, Grade: e.target.value})}
                      />
                    </div>
                     {/* Spacer */}
                    <div className="w-[38px]"></div>
                  </div>
                </div>


                {/* ROW 8: Image (File Picker) - centered or full width? Full width looks fine */}
                <div className="col-span-12 flex items-start gap-4 mt-2">
                    <div className="w-24 pt-2 text-right">
                        <label className="text-sm font-medium text-black">Image</label>
                    </div>
                    <div className="flex items-center gap-2">
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            className="hidden" 
                            accept="image/*"
                         />
                         
                         <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border ${
                                theme === 'emerald' 
                                ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' :
                                theme === 'purple' ? 'bg-[#6448AE] text-white': 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                         >
                            <Paperclip size={16} />
                            <span className="text-sm">Select File</span>
                         </button>

                         {product.Image && (
                             <button 
                                type="button"
                                onClick={() => setProduct({...product, Image: ""})}
                                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                title="Remove Image"
                             >
                                <Trash2 size={18} />
                             </button>
                         )}

                         {/* Mini Preview */}
                         {product.Image && (
                             <div className="h-20 w-20 rounded overflow-hidden border border-gray-600 bg-gray-900">
                                 <img src={product.Image} alt="preview" className="h-full w-full object-cover" />
                             </div>
                         )}
                    </div>
                </div>


                {/* ROW 9: Details */}
                <div className="col-span-12 mt-4">
                    <InputField
                        label="Product Details"
                        value={product.ProductDetails}
                        onChange={(e) => setProduct({...product, ProductDetails: e.target.value})}
                        textarea
                        rows={3}
                        className="resize-y"
                    />
                </div>

            </div>
        </div>
        </div>
        </ContentCard>
      </div>


        {/* --- ADD CATEGORY MODAL --- */}
        <AddModal
            isOpen={categoryModalOpen}
            onClose={() => setCategoryModalOpen(false)}
            onSave={handleAddCategory}
            title="New Category"
        >
             {/* NAME */}
            <InputField
                label="Name"
                required
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />

            {/* DESCRIPTION */}
            <div className="mt-4">
                 <InputField
                    label="Description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    textarea
                    rows={3}
                />
            </div>

            {/* PARENT CATEGORY */}
            <label className="block text-sm mb-1 mt-4 text-black">Parent Category</label>
             <div className="mt-1">
                <SearchableSelect
                    options={categories.map(c => ({ id: c.id, name: c.name || c.CategoryName }))}
                    value={newCategory.parentCategoryId}
                    onChange={(v) => setNewCategory({ ...newCategory, parentCategoryId: v })}
                    placeholder="Search parent category..."
                    direction="up"
                />
            </div>
        </AddModal>

        {/* --- ADD UNIT MODAL --- */}
        <AddModal
            isOpen={unitModalOpen}
            onClose={() => setUnitModalOpen(false)}
            onSave={handleAddUnit}
            title="New Unit"
        >
             <InputField
                label="Name"
                required
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
            />
            <div className="mt-4">
                 <InputField
                    label="Description"
                    value={newUnit.description}
                    onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                    textarea
                    rows={3}
                />
            </div>
        </AddModal>

        {/* --- ADD BRAND MODAL --- */}
        <AddModal
            isOpen={brandModalOpen}
            onClose={() => setBrandModalOpen(false)}
            onSave={handleAddBrand}
            title="New Brand"
        >
            <InputField
                label="Name"
                required
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
            />
            <div className="mt-4">
                <InputField
                    label="Description"
                    value={newBrand.description}
                    onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                    textarea
                    rows={3}
                />
            </div>
        </AddModal>



    </PageLayout>
  );
};

export default NewProduct;
