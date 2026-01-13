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
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import { useTheme } from "../../context/ThemeContext";

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
  getTaxPercentagesApi
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
    TaxPercentageId: ""      
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
      toast.error("Failed to load form data");
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
          toast.error("Failed to load product details");
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
    if (!product.ProductName?.trim()) return toast.error("Product Name required");
    if (product.UnitPrice === "" || isNaN(Number(product.UnitPrice))) return toast.error("Unit Price required");
    if (product.ReorderLevel === "" || isNaN(Number(product.ReorderLevel))) return toast.error("Reorder Level required");
    if (!product.CategoryId) return toast.error("Category required");
    if (!product.UnitId) return toast.error("Unit required");
    if (!product.BrandId) return toast.error("Brand required");
    if (!product.TaxPercentageId) return toast.error("Tax Percentage required");

    const payload = {
      Barcode: product.productCode || null,
      SN: product.SN,
      ProductName: product.ProductName,
      Model: product.Model,
      UnitPrice: parseFloat(product.UnitPrice),
      UnitsInStock: 0,
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
        toast.success(id ? "Product updated successfully" : "Product added successfully");
        
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
        toast.error(res.message || "Operation failed");
      }
    } catch (error) {
      console.error("Save Error", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    try {
        const res = await deleteProductApi(id, { userId: currentUserId });
        if (res.status === 200) {
            toast.success("Product deleted successfully");
            navigate("/app/inventory/products");
        } else {
            toast.error(res.message || "Failed to delete product");
        }
    } catch (error) {
        console.error("Delete Error", error);
        toast.error("Server error during deletion");
    } finally {
        setLoading(false);
    }
  };

  // --- QUICK ADD HANDLERS ---
  
  // Category
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return toast.error("Category Name required");

    try {
        const res = await addCategoryApi({
            ...newCategory,
            userId: currentUserId
        });
        if (res.status === 200) {
            toast.success("Category added successfully");
            setCategoryModalOpen(false);
            setNewCategory({ name: "", description: "", parentCategoryId: null });
            loadDropdowns(); 
        } else {
            toast.error(res.message || "Failed to add category");
        }
    } catch (error) {
        console.error("Add category error", error);
        toast.error("Server error adding category");
    }
  };

  // Unit
  const handleAddUnit = async () => {
    if (!newUnit.name.trim()) return toast.error("Unit Name required");
    try {
      const res = await addUnitApi({ ...newUnit, userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Unit added");
        setNewUnit({ name: "", description: "" });
        setUnitModalOpen(false);
        loadDropdowns();
      } else {
        toast.error("Failed to add unit");
      }
    } catch (error) {
      console.error("Add unit error", error);
      toast.error("Server error adding unit");
    }
  };

  // Brand
  const handleAddBrand = async () => {
    if (!newBrand.name.trim()) return toast.error("Brand Name required");
    try {
      const res = await addBrandApi({ ...newBrand, userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Brand added");
        setNewBrand({ name: "", description: "" });
        setBrandModalOpen(false);
        loadDropdowns();
      } else if (res?.status === 409) {
        toast.error(res.data.message || "Brand Name already exists");
      } else {
        toast.error("Failed to add brand");
      }
    } catch (error) {
      console.error("Add brand error", error);
      toast.error("Server error adding brand");
    }
  };


  // --- RENDER HELPERS ---
  const inputClass = `w-full px-3 py-2 rounded border bg-transparent outline-none transition-colors ${
    theme === 'emerald' 
      ? 'border-gray-300 focus:border-emerald-500' 
      : 'border-gray-600 focus:border-white bg-gray-800'
  }`;

  const labelClass = "block text-sm font-medium mb-1.5 text-gray-400";
  const requiredStar = <span className="text-red-500">*</span>;

  return (
    <PageLayout>
      <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : 'bg-gray-900 text-white'}`}>
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-6">
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
                className={`p-2 rounded-full ${theme === 'emerald' ? 'hover:bg-emerald-200' : 'hover:bg-gray-700'}`}
                >
                <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold">{id ? "Edit Product" : "New Product"}</h2>
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
                        : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 text-blue-300'
                    }`}
                >
                    <Save size={18} />
                    {loading ? (id ? "Updating..." : "Saving...") : (id ? "Update" : "Save")}
                </button>
            </div>
        </div>


        {/* MAIN FORM CONTAINER */}
        <div className={`p-8 rounded-xl shadow-lg border ${theme === 'emerald' ? 'bg-white border-emerald-100' : 'bg-gray-800/50 border-gray-700'}`}>
            
            <div className="grid grid-cols-12 gap-x-6 gap-y-6">

                {/* ROW 1: Code (2), Name (8), SN (2) */}
                <div className="col-span-12 md:col-span-2">
                    <label className={labelClass}>Product Code</label>
                    <input
                        type="text"
                        value={product.productCode}
                        onChange={(e) => setProduct({...product, productCode: e.target.value})}
                        className={inputClass}
                        placeholder=""
                    />
                </div>
                <div className="col-span-12 md:col-span-8">
                    <label className={labelClass}>Product Name {requiredStar}</label>
                    <input
                        type="text"
                        value={product.ProductName}
                        onChange={(e) => setProduct({...product, ProductName: e.target.value})}
                        className={inputClass}
                        placeholder=""
                    />
                </div>
                <div className="col-span-12 md:col-span-2">
                    <label className={labelClass}>Sn</label>
                    <input
                        type="text"
                        value={product.SN}
                        readOnly
                        className={`${inputClass} opacity-60 cursor-not-allowed`}
                    />
                </div>


                {/* ROW 2: Model (6), Price (3), Reorder (3) */}
                <div className="col-span-12 md:col-span-6">
                    <label className={labelClass}>Model</label>
                    <input
                        type="text"
                        value={product.Model}
                        onChange={(e) => setProduct({...product, Model: e.target.value})}
                        className={inputClass}
                    />
                </div>
                <div className="col-span-12 md:col-span-3">
                    <label className={labelClass}>Unit Price {requiredStar}</label>
                    <input
                        type="number"
                        step="0.01"
                        value={product.UnitPrice}
                        onChange={(e) => setProduct({...product, UnitPrice: e.target.value})}
                        className={inputClass}
                    />
                </div>
                <div className="col-span-12 md:col-span-3">
                    <label className={labelClass}>Reorder Level {requiredStar}</label>
                    <input
                        type="number"
                        step="0.01"
                        value={product.ReorderLevel}
                        onChange={(e) => setProduct({...product, ReorderLevel: e.target.value})}
                        className={inputClass}
                    />
                </div>


                {/* ROW 3: Category (6), Unit (3), HSN (3) */}
                <div className="col-span-12 md:col-span-6">
                    <label className={labelClass}>Category {requiredStar}</label>
                     <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <SearchableSelect
                                options={categories.map(c => ({ id: c.id, name: c.name || c.CategoryName }))}
                                value={product.CategoryId}
                                onChange={(val) => setProduct({...product, CategoryId: val})}
                                placeholder="--select--"
                                className={theme === 'emerald' ? 'bg-white' : 'bg-gray-800'}
                            />
                        </div>
                        <button 
                            onClick={() => setCategoryModalOpen(true)}
                            className="text-gray-400 hover:text-yellow-400 transition-colors"
                        >
                            <Star size={18} />
                        </button>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <label className={labelClass}>Unit {requiredStar}</label>
                     <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <SearchableSelect
                                options={units.map(u => ({ id: u.id, name: u.name || u.UnitName }))}
                                value={product.UnitId}
                                onChange={(val) => setProduct({...product, UnitId: val})}
                                placeholder="--select--"
                            />
                        </div>
                        {/* Star / Quick Add Unit */}
                        <button 
                             onClick={() => setUnitModalOpen(true)}
                             className="text-gray-400 hover:text-yellow-400 transition-colors"
                        >
                            <Star size={18} />
                        </button>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <label className={labelClass}>HSN Code</label>
                    <input
                        type="text"
                        value={product.HSNCode}
                        onChange={(e) => setProduct({...product, HSNCode: e.target.value})}
                        className={inputClass}
                    />
                </div>


                {/* ROW 4: Brand (6), Supplier (6) */}
                <div className="col-span-12 md:col-span-6">
                    <label className={labelClass}>Company / Brand {requiredStar}</label>
                     <div className="flex items-center gap-2">
                        <div className="flex-1">
                             <SearchableSelect
                                options={brands.map(b => ({ id: b.id, name: b.name || b.BrandName }))}
                                value={product.BrandId}
                                onChange={(val) => setProduct({...product, BrandId: val})}
                                placeholder="--select--"
                            />
                        </div>
                         <button 
                            onClick={() => setBrandModalOpen(true)}
                            className="text-gray-400 hover:text-yellow-400 transition-colors"
                         >
                            <Star size={18} />
                        </button>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-6">
                    <label className={labelClass}>Supplier</label>
                     <div className="flex-1">
                          <SearchableSelect
                            options={suppliers.map(s => ({ id: s.id, name: s.companyName || s.name }))}
                            value={product.SupplierId}
                            onChange={(val) => setProduct({...product, SupplierId: val})}
                            placeholder="--select--"
                        />
                    </div>
                </div>


                {/* ROW 5: Colour (4), Grade (4), Tax Percentage (4) */}
                <div className="col-span-12 md:col-span-4">
                    <label className={labelClass}>Colour</label>
                    <input
                        type="text"
                        value={product.Colour}
                        onChange={(e) => setProduct({...product, Colour: e.target.value})}
                        className={inputClass}
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <label className={labelClass}>Grade</label>
                    <input
                        type="text"
                        value={product.Grade}
                        onChange={(e) => setProduct({...product, Grade: e.target.value})}
                        className={inputClass}
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <label className={labelClass}>Tax Percentage {requiredStar}</label>
                     <div className="flex-1">
                          <SearchableSelect
                            options={taxPercentages.map(t => ({ id: t.id, name: `${t.percentage}%` }))}
                            value={product.TaxPercentageId}
                            onChange={(val) => setProduct({...product, TaxPercentageId: val})}
                            placeholder="--select--"
                        />
                    </div>
                </div>


                {/* ROW 5: Image (File Picker) */}
                <div className="col-span-12 flex items-start gap-4 mt-2">
                    <div className="w-24 pt-2 text-right">
                        <label className="text-sm text-gray-400">Image</label>
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
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border ${
                                theme === 'emerald' 
                                ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' 
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                         >
                            <Paperclip size={16} />
                            <span className="text-sm">Select File</span>
                         </button>

                         {product.Image && (
                             <button 
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


                {/* ROW 6: Details */}
                <div className="col-span-12 mt-4">
                    <div className="flex">
                         <div className="w-32 pt-2">
                             <label className={labelClass}>Product Details</label>
                         </div>
                         <div className="flex-1">
                             <textarea
                                rows={3}
                                value={product.ProductDetails}
                                onChange={(e) => setProduct({...product, ProductDetails: e.target.value})}
                                className={`${inputClass} resize-y`}
                                placeholder=""
                             />
                         </div>
                    </div>
                </div>

            </div>
        </div>

        {/* --- ADD CATEGORY MODAL --- */}
        <AddModal
            isOpen={categoryModalOpen}
            onClose={() => setCategoryModalOpen(false)}
            onSave={handleAddCategory}
            title="New Category"
        >
             {/* NAME */}
            <label className="block text-sm mb-1">Name *</label>
            <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className={inputClass} // Reuse inputClass for consistency
            />

            {/* DESCRIPTION */}
            <label className="block text-sm mb-1 mt-4">Description</label>
            <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className={`${inputClass} h-20`}
            />

            {/* PARENT CATEGORY */}
            <label className="block text-sm mb-1 mt-4">Parent Category</label>
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
            <label className="block text-sm mb-1">Name *</label>
            <input
                type="text"
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                className={inputClass}
            />
            <label className="block text-sm mb-1 mt-4">Description</label>
            <textarea
                value={newUnit.description}
                onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                className={`${inputClass} h-20`}
            />
        </AddModal>

        {/* --- ADD BRAND MODAL --- */}
        <AddModal
            isOpen={brandModalOpen}
            onClose={() => setBrandModalOpen(false)}
            onSave={handleAddBrand}
            title="New Brand"
        >
            <label className="block text-sm mb-1">Name *</label>
            <input
                type="text"
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                className={inputClass}
            />
            <label className="block text-sm mb-1 mt-4">Description</label>
             <textarea
                value={newBrand.description}
                onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                className={`${inputClass} h-20`}
            />
        </AddModal>


      </div>
    </PageLayout>
  );
};

export default NewProduct;
