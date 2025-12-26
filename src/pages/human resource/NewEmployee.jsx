// src/pages/human-resource/NewEmployee.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  Search,
  Plus,
  X,
  Save,
  Trash2,
  Pencil,
  Star,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import {
  getDesignationsApi,
  getDepartmentsApi,
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  getRegionsApi,
  getTerritoriesApi,
  getBanksApi,
  searchBankApi,
  getIncomesApi,
  getDeductionsApi,
  getUsersApi,
  addCountryApi,
  addStateApi,
  addCityApi,
  addRegionApi,
  addTerritoryApi,
 addEmployeeApi,
updateEmployeeApi,
getEmployeeByIdApi,
deleteEmployeeApi,

} from "../../services/allAPI";
import { serverURL } from "../../services/serverURL";
import SearchableSelect from "../../components/SearchableSelect";

const EmpSearchableSelect = ({
  label,
  value,
  options,
  onChange,
  required = false,
  onAdd,
  placeholder = "Select...",
  disabled = false
}) => {
  return (
    <div className="w-full">
      <label className="text-sm text-gray-300 block mb-1">
        {label} 
        {required && <span className="text-red-400"> *</span>}
      </label>
      <div className="flex gap-2 items-start">
        <div className="flex-grow">
          <SearchableSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
        
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            disabled={disabled}
            className={`flex-shrink-0 h-[38px] w-[38px] flex items-center justify-center rounded bg-gray-800 border border-gray-600 transition ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
            title="Add"
          >
            <Star size={20} className="text-yellow-400" />
          </button>
        )}
      </div>
    </div>
  );
};


const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
 
const parseArrayFromResponse = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.records) return res.data.records;
  if (res.records) return res.records;
  const maybeArray = Object.values(res).find((v) => Array.isArray(v));
  return Array.isArray(maybeArray) ? maybeArray : [];
};

const fullImageURL = (path) => {
  if (!path) return "";
  const raw = String(path).trim().replace(/\\\\/g, "/").replace(/\\/g, "/");
  if (raw.startsWith("blob:")) return raw; 
  if (/^https?:\/\//i.test(raw)) return raw; 
  if (raw.startsWith("//")) return window.location.protocol + raw; 

  const host = serverURL.replace(/\/api\/?$/i, "").replace(/\/$/, "");
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${host}${normalizedPath}`;
};
const NewEmployee = () => {

  const { id } = useParams();        
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);


  // âœ… LOAD EMPLOYEE ON EDIT PAGE LOAD
useEffect(() => {
  if (!isEditMode || !id) return;

  loadEmployeeForEdit();
}, [id, isEditMode]);


const [isEditLoading, setIsEditLoading] = useState(false);


const loadEmployeeForEdit = async () => {
  try {
    setIsEditLoading(true);

    const res = await getEmployeeByIdApi(id);
    const emp = res.data;

    // âœ… Load EVERYTHING needed for dropdown labels BEFORE setting form
    await Promise.all([
      loadStates(emp.CountryId),
      loadCities(emp.StateId),
      loadRegions(emp.StateId),
      loadTerritories(emp.RegionId),
      loadUsers(),
      loadBanks(),
    ]);

    // âœ… SINGLE form update (no flicker)
    console.debug("loadEmployeeForEdit - emp.Picture:", emp.Picture);
    console.debug("loadEmployeeForEdit - fullImageURL(emp.Picture):", fullImageURL(emp.Picture));

    setForm({
      firstName: emp.FirstName || "",
      lastName: emp.LastName || "",
      designationId: emp.DesignationId || "",
      departmentId: emp.DepartmentId || "",
      rateType: emp.RateType || "",
      hourlyRate: emp.HoureRateSalary ?? emp.HourlyRateSalary ?? "",
      salary: emp.BasicSalary ?? emp.salary ?? "",
      bloodGroup: emp.BloodGroup || "",
      phone: emp.Phone || "",
      email: emp.Email || "",
      countryId: emp.CountryId || "",
      stateId: emp.StateId || "",
      cityId: emp.CityId || "",
      regionId: emp.RegionId || "",
      territoryId: emp.TerritoryId || "",
      zipCode: emp.ZipCode || "",
      address: emp.Address || "",
      payrollBankId: emp.PayrollBankId || "",
      payrollBankAccount: emp.BankAccountForPayroll || "",
      userId: emp.UserId || 1,
      picturePreview: emp.Picture ? fullImageURL(emp.Picture) : null,
      pictureFile: null,
    });

    setIncomes((emp.incomes || []).map(inc => ({
      ...inc,
      id: inc.Id || `i_${Date.now()}_${Math.random()}`,
      typeId: inc.IncomeId,
      typeName: inc.IncomeName,
      amount: inc.Amount,
      description: inc.Description
    })));
    setDeductions((emp.deductions || []).map(ded => ({
      ...ded,
      id: ded.Id || `d_${Date.now()}_${Math.random()}`,
      typeId: ded.DeductionId,
      typeName: ded.DeductionName,
      amount: ded.Amount,
      description: ded.Description
    })));
  } catch (err) {
    console.error("Edit load failed:", err);
    toast.error("Failed to load employee");
  } finally {
    setIsEditLoading(false);
  }
};



  // ----- tabs + form -----
  const [basicTab, setBasicTab] = useState(true);
  const [form, setForm] = useState({
    
    firstName: "",
    lastName: "",
    designationId: "",
    departmentId: "",
    rateType: "",
    hourlyRate: "",
    salary: "",
    bloodGroup: "",
    phone: "",
    email: "",
    pictureFile: null,
    picturePreview: null,
    countryId: "",
    stateId: "",
    cityId: "",
    regionId: "",
    territoryId: "",
    address: "",
    zipCode: "",
    payrollBankId: "",
    payrollBankAccount: "",
    userId: (JSON.parse(localStorage.getItem("user")) || {}).userId || 1,
  });

  // ----- lookups -----
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [banks, setBanks] = useState([]);
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [users, setUsers] = useState([]);

  // incomes/deductions rows
  const [incomes, setIncomes] = useState([]);
  const [deductions, setDeductions] = useState([]);

  // generic search text used for banks/table pagination


  // INCOME MODAL STATES
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ typeId: null, amount: "", description: "" });
  const [editingIncomeId, setEditingIncomeId] = useState(null);

  // DEDUCTION MODAL STATES
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [deductionForm, setDeductionForm] = useState({ typeId: null, amount: "", description: "" });
  const [editingDeductionId, setEditingDeductionId] = useState(null);

  // LOOKUP MODAL STATE
  const [showLookupCreateModal, setShowLookupCreateModal] = useState(false);
  const [lookupCreateContext, setLookupCreateContext] = useState({
    key: "",
    callback: null,
    item: null,
    mode: "add",
    typedName: ""
  });
  
  const lookupSetters = {
      setCountries, setStates, setCities, setRegions, setTerritories,
      setDesignations, setDepartments, setIncomeTypes, setDeductionTypes, setBanks
  };

  // load initial lookups
  useEffect(() => {
    const load = async () => {
      try {
        const dsg = await getDesignationsApi(1, 5000);
        setDesignations(parseArrayFromResponse(dsg));

        const dep = await getDepartmentsApi(1, 5000);
        setDepartments(parseArrayFromResponse(dep));

        await loadCountries();
        await loadStates();
        await loadCities();
        await loadRegions();
        await loadBanks();
        await loadIncomeTypes();
        await loadDeductionTypes();
        await loadUsers();
      } catch (err) {
        console.error("lookup load error", err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- loaders (using your parseArrayFromResponse patterns) ----------
  const loadCountries = async () => {
    try {
      const res = await getCountriesApi(1, 5000);
      const arr = parseArrayFromResponse(res);
      setCountries(arr);
      return arr;
    } catch (err) {
      console.error("loadCountries error", err);
      toast.error("Failed to load countries");
      setCountries([]);
      return [];
    }
  };

  const loadStates = async (countryId = null) => {
    try {
      let arr = [];
      if (countryId && typeof getStatesByCountryApi === "function") {
        const res = await getStatesByCountryApi(countryId);
        arr = parseArrayFromResponse(res);
      } else {
        const res = await getStatesApi(1, 5000);
        arr = parseArrayFromResponse(res);
        if (countryId) arr = arr.filter((s) => String(s.countryId || s.CountryId) === String(countryId));
      }
      setStates(arr);
      return arr;
    } catch (err) {
      console.error("loadStates error", err);
      toast.error("Failed to load states");
      setStates([]);
      return [];
    }
  };

  const loadCities = async (stateId = null) => {
    try {
      let arr = [];
      if (stateId && typeof getCitiesByStateApi === "function") {
        const res = await getCitiesByStateApi(stateId);
        arr = parseArrayFromResponse(res);
      } else {
        const res = await getCitiesApi(1, 5000);
        arr = parseArrayFromResponse(res);
        if (stateId) arr = arr.filter((c) => String(c.stateId || c.StateId) === String(stateId));
      }
      setCities(arr);
      return arr;
    } catch (err) {
      console.error("loadCities error", err);
      toast.error("Failed to load cities");
      setCities([]);
      return [];
    }
  };

  const loadRegions = async (stateId = null) => {
    try {
      const res = await getRegionsApi(1, 5000);
      let arr = [];
      if (!res) {
        arr = [];
      } else if (Array.isArray(res)) {
        arr = res;
      } else if (Array.isArray(res.data)) {
        arr = res.data;
      } else if (res.data && Array.isArray(res.data.records)) {
        arr = res.data.records;
      } else if (Array.isArray(res.records)) {
        arr = res.records;
      } else {
        const maybeArray = Object.values(res).find((v) => Array.isArray(v));
        arr = Array.isArray(maybeArray) ? maybeArray : [];
      }
      const filtered = stateId ? arr.filter((r) => String(r.stateId || r.StateId) === String(stateId)) : arr;
      setRegions(filtered);
      return filtered;
    } catch (err) {
      console.error("LOAD REGIONS ERROR:", err);
      toast.error("Failed to load regions");
      setRegions([]);
      return [];
    }
  };

  const loadTerritories = async (regionId = null) => {
    try {
      const res = await getTerritoriesApi(1, 5000);
      const arr = parseArrayFromResponse(res);
      const filtered = regionId ? arr.filter((t) => String(t.regionId || t.RegionId) === String(regionId)) : arr;
      setTerritories(filtered);
      return filtered;
    } catch (err) {
      console.error("loadTerritories error", err);
      toast.error("Failed to load territories");
      setTerritories([]);
      return [];
    }
  };

  const loadBanks = async () => {
    try {
      // Use large limit to load all banks for client-side search
      const res = await getBanksApi(1, 5000); 
      if (res?.status === 200) {
        const normalized = (res.data.records || []).map((item) => ({
          ...item,
          SignaturePicture: item.SignaturePicture ? fullImageURL(item.SignaturePicture) : "",
        }));
        setBanks(normalized);
      }
    } catch (err) {
      console.error("loadBanks error", err);
      toast.error("Error loading banks");
    }
  };

const loadIncomeTypes = async () => {
  try {
    const res = await getIncomesApi(1, 9999);

    const items = Array.isArray(res?.data?.records)
      ? res.data.records
      : [];

    // normalize fields EXACTLY for your dropdown
    const normalized = items.map(r => ({
      id: r.Id,                     
      name: r.IncomeName            
    }));

    setIncomeTypes(normalized);
  } catch (err) {
    console.log("Income types load error:", err);
    setIncomeTypes([]);
  }
};


const loadDeductionTypes = async () => {
  try {
    const res = await getDeductionsApi(1, 9999);

    const items = Array.isArray(res?.data?.records)
      ? res.data.records
      : [];

    const normalized = items.map(r => ({
      id: r.Id,
      name: r.DeductionName || r.Name  // Try DeductionName first, fallback to Name
    }));

    setDeductionTypes(normalized);
  } catch (err) {
    console.log("Deduction types load error:", err);
    setDeductionTypes([]);
  }
};

const loadUsers = async () => {
  try {
    const res = await getUsersApi(1, 5000);
    const arr = parseArrayFromResponse(res);
    setUsers(arr);
    return arr;
  } catch (err) {
    console.error("loadUsers error", err);
    toast.error("Failed to load users");
    setUsers([]);
    return [];
  }
};


  // ---------- cascade helpers ----------
  const awaitLoadStatesForCountry = async (countryId) => {
    await loadStates(countryId);
    setForm((p) => ({ ...p, stateId: "", cityId: "", territoryId: "" }));
    setCities([]);
    setTerritories([]);
  };

  const awaitLoadCitiesForState = async (stateId) => {
    await loadCities(stateId);
    setForm((p) => ({ ...p, cityId: "", territoryId: "" }));
    setTerritories([]);
  };

  const awaitLoadTerritoriesForRegion = async (regionId) => {
    await loadTerritories(regionId);
    setForm((p) => ({ ...p, territoryId: "" }));
  };

  // ---------- picture handling ----------
  const handlePictureChange = (file) => {
    if (!file) {
      setForm((p) => ({ ...p, pictureFile: null, picturePreview: null }));
      return;
    }
    setForm((p) => ({ ...p, pictureFile: file, picturePreview: URL.createObjectURL(file) }));
  };
  const removePicture = () => handlePictureChange(null);

  // ---------- submit employee ----------
const submitEmployee = async () => {
  if (!form.firstName.trim()) return toast.error("First name required");
  if (!form.lastName.trim()) return toast.error("Last name required");
  if (!String(form.salary).trim()) return toast.error("Basic Salary required");
  if (!form.payrollBankId) return toast.error("Payroll Bank required");
  if (!form.payrollBankAccount.trim()) return toast.error("Bank Account required");

  try {
    const fd = new FormData();
    fd.append("data", JSON.stringify({ ...form, incomes, deductions }));

    if (form.pictureFile) fd.append("pictureFile", form.pictureFile);

    let res;
    if (isEditMode) {
      res = await updateEmployeeApi(id, fd);
    } else {
      res = await addEmployeeApi(fd);
    }

    if (res?.status === 201 || res?.status === 200) {
      toast.success(isEditMode ? "Employee updated" : "Employee created");
      if (location.state?.returnTo) {
        navigate(location.state.returnTo, { 
          state: { 
            newEmployeeId: res.data?.record?.id || res.data?.id || res.data?.Id,
            field: location.state.field 
          } 
        });
      } else {
        navigate("/app/hr/employees");          // ✅ REDIRECT
      }
    } else {
      toast.error(res?.data?.message || "Save failed");
    }
  } catch (err) {
    console.error("submitEmployee error", err);
    toast.error("Server error");
  }
};



const handleDelete = async () => {
  if (!window.confirm("Are you sure you want to delete this employee?")) return;

  try {
    await deleteEmployeeApi(id, { userId: form.userId });
    toast.success("Employee deleted");
    navigate("/app/hr/employees");
  } catch (err) {
    console.error("Delete failed", err);
    toast.error("Delete failed");
  }
};






  // ================================
  // PART 2: SearchableDropdown + Modal Components
  // ================================

// Inner components moved to end of file



  if (isEditMode && isEditLoading) {
  return (
    <div className="h-[90vh] flex items-center  bg-gray-900 justify-center text-white">
      <div className="flex flex-col items-center  gap-3">
        <div className="w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-300">Loading employee data...</span>
      </div>
    </div>
  );
}

  // PART 3 â€” Final JSX UI (main page)
  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full overflow-y-auto">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/app/hr/employees")} 
                className="text-white hover:text-white-400"
              >
            <ArrowLeft size={24} />
          </button>
           <h2 className="text-2xl font-semibold">
            {isEditMode ? "Edit Employee" : "New Employee"}
          </h2>
           </div>

            <div className="flex gap-3">
            <button onClick={submitEmployee} className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded text-blue-300">
              <Save size={16} /> {isEditMode ? "Update" : "Save"}
            </button>

            {isEditMode && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-800 border border-red-600 px-3 py-2 rounded text-red-200"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}

          </div>

          </div>

          {/* tabs */}
          <div className="mb-3 border-b border-gray-700">
            <div className="flex gap-3">
              <button onClick={() => setBasicTab(true)} className={`px-3 py-1 ${basicTab ? "border-b-2 border-yellow-400 text-yellow-300" : "text-gray-300"}`}>Basic Information</button>
              <button onClick={() => setBasicTab(false)} className={`px-3 py-1 ${!basicTab ? "border-b-2 border-yellow-400 text-yellow-300" : "text-gray-300"}`}>Payroll</button>
            </div>
          </div>

          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              {basicTab ? (
                <div className="p-4">
                  {/* UNIFIED GRID for better Tab Order (Left->Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-full">
                    
                    {/* Row 1: Names */}
                    <div>
      <label className="text-sm text-gray-300 block mb-1">First Name <span className="text-red-400">*</span></label>
                      <input 
                        value={form.firstName} 
                        onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} 
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="John" 
                      />
                    </div>
                    <div>
      <label className="text-sm text-gray-300 block mb-1">Last Name <span className="text-red-400">*</span></label>
                      <input 
                        value={form.lastName} 
                        onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} 
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Doe" 
                      />
                    </div>

                    {/* Row 2: Contact */}
                    <div>
      <label className="text-sm text-gray-300 block mb-1">Phone</label>
                      <input 
                        value={form.phone} 
                        onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} 
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" 
                      />
                    </div>
                    <div>
      <label className="text-sm text-gray-300 block mb-1">Email</label>
                      <input 
                        value={form.email} 
                        onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} 
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" 
                      />
                    </div>

                    {/* Row 3: Role Info */}
                    <div className="z-[50]">
                      <EmpSearchableSelect
                        label="Designation"
                        options={designations.map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.designation ?? x.DesignationName }))}
                        value={form.designationId}
                        onChange={(val) => setForm({ ...form, designationId: val })}
                        required
                        onAdd={isEditMode ? null : () => {
                           setLookupCreateContext({ key: 'designation', callback: (c) => setForm(p=>({...p, designationId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={isEditMode ? () => {
                           const item = designations.find(x => String(x.id??x.Id) === String(form.designationId));
                           setLookupCreateContext({ key: 'designation', item, mode: 'edit', callback: (c) => setForm(p=>({...p, designationId: c.id})) });
                           setShowLookupCreateModal(true);
                        } : null}
                      />
                    </div>
                    <div className="z-[50]">
                      <EmpSearchableSelect
                        label="Department"
                        options={departments.map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.department ?? x.DepartmentName }))}
                        value={form.departmentId}
                        onChange={(val) => setForm({ ...form, departmentId: val })}
                        required
                        onAdd={isEditMode ? null : () => {
                           setLookupCreateContext({ key: 'department', callback: (c) => setForm(p=>({...p, departmentId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={() => {
                           const item = departments.find(x => String(x.id??x.Id) === String(form.departmentId));
                           setLookupCreateContext({ key: 'department', item, mode: 'edit', callback: (c) => setForm(p=>({...p, departmentId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                      />
                    </div>

                    {/* Row 4: Compensation */}
                    <div>
      <label className="text-sm text-gray-300 block mb-1">Rate Type</label>
                      <SearchableSelect
                         options={[{id: 'hourly', name: 'Hourly'}, {id: 'salary', name: 'Salary'}]}
                         value={form.rateType}
                         onChange={(val) => setForm(p => ({ ...p, rateType: val }))}
                         placeholder="Select Rate Type"
                      />
                    </div>
                    <div>
      <label className="text-sm text-gray-300 block mb-1">Hour Rate / Salary</label>
                      <input 
                        value={form.hourlyRate} 
                        onChange={(e) => setForm(p => ({ ...p, hourlyRate: e.target.value }))} 
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm focus:border-blue-500 focus:outline-none" 
                      />
                    </div>

                    {/* Row 5: Details & Picture */}
                    {/* Details: Blood Group & Zip Code */ }
                    <div>
      <label className="text-sm text-gray-300 block mb-1">Blood Group</label>
                      <SearchableSelect
                         options={BLOOD_GROUPS.map(b => ({ id: b, name: b }))}
                         value={form.bloodGroup}
                         onChange={(val) => setForm(p => ({ ...p, bloodGroup: val }))}
                         placeholder="Select Blood Group"
                         dropdownHeight="max-h-36"
                      />
                    </div>
                    
                    <div>
      <label className="text-sm text-gray-300 block mb-1">Zip Code</label>
                      <input 
                        value={form.zipCode} 
                        onChange={(e) => setForm(p => ({ ...p, zipCode: e.target.value }))} 
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm focus:border-blue-500 focus:outline-none" 
                      />
                    </div>

                    {/* DIVIDER */}
                    <div className="col-span-1 md:col-span-2 my-2 border-t border-gray-800"></div>

                    {/* LOCATION SECTION */}
                    <div className="z-[40]">
                      <EmpSearchableSelect
                        label="Country"
                        options={countries.map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.Name }))}
                        value={form.countryId}
                        onChange={(val) => {
                          setForm({ ...form, countryId: val });
                          if(val) awaitLoadStatesForCountry(val);
                        }}
                        required
                        onAdd={isEditMode ? null : () => {
                           setLookupCreateContext({ key: 'country', callback: (c) => {
                             setForm(p=>({...p, countryId: c.id}));
                             awaitLoadStatesForCountry(c.id);
                           }});
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={() => {
                           const item = countries.find(x => String(x.id??x.Id) === String(form.countryId));
                           setLookupCreateContext({ key: 'country', item, mode: 'edit', callback: (c) => setForm(p=>({...p, countryId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                      />
                    </div>
                    <div className="z-[40]">
                      <EmpSearchableSelect
                        label="State"
                        options={states.filter(s => (form.countryId ? String(s.countryId) === String(form.countryId) : true)).map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.Name }))}
                        value={form.stateId}
                        onChange={(val) => {
                          setForm({ ...form, stateId: val });
                          if(val) awaitLoadCitiesForState(val);
                        }}
                        required
                        disabled={!form.countryId}
                        onAdd={isEditMode ? null : () => {
                           setLookupCreateContext({ key: 'state', callback: (c) => {
                             setForm(p=>({...p, stateId: c.id}));
                             awaitLoadCitiesForState(c.id);
                           }});
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={() => {
                           const item = states.find(x => String(x.id??x.Id) === String(form.stateId));
                           setLookupCreateContext({ key: 'state', item, mode: 'edit', callback: (c) => setForm(p=>({...p, stateId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                      />
                    </div>

                    <div className="z-[30]">
                      <EmpSearchableSelect
                        label="City"
                        options={cities.filter(c => (form.stateId ? String(c.stateId) === String(form.stateId) : true)).map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.Name }))}
                        value={form.cityId}
                        onChange={(val) => setForm({ ...form, cityId: val })}
                        required
                        disabled={!form.stateId}
                        onAdd={isEditMode ? null : () => {
                           setLookupCreateContext({ key: 'city', callback: (c) => setForm(p=>({...p, cityId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={() => {
                           const item = cities.find(x => String(x.id??x.Id) === String(form.cityId));
                           setLookupCreateContext({ key: 'city', item, mode: 'edit', callback: (c) => setForm(p=>({...p, cityId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                      />
                    </div>
                    <div className="z-[30]">
                      <EmpSearchableSelect
                        label="Region"
                        options={regions.map(x => ({ id: x.regionId ?? x.id, name: x.regionName ?? x.name }))}
                        value={form.regionId}
                        onChange={(val) => {
                          setForm({ ...form, regionId: val });
                          if(val) awaitLoadTerritoriesForRegion(val);
                        }}
                        onAdd={isEditMode ? null : () => {
                           setLookupCreateContext({ key: 'region', callback: (c) => {
                              setForm(p=>({...p, regionId: c.id}));
                              awaitLoadTerritoriesForRegion(c.id);
                           }});
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={() => {
                           const item = regions.find(x => String(x.regionId??x.id) === String(form.regionId));
                           setLookupCreateContext({ key: 'region', item, mode: 'edit', callback: (c) => setForm(p=>({...p, regionId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                      />
                    </div>

                    <div className="z-[20]">
                       <EmpSearchableSelect
                          label="Territory"
                          options={territories.map(x => ({ id: x.territoryId ?? x.id, name: x.territoryDescription ?? x.name }))}
                          value={form.territoryId}
                          onChange={(val) => setForm({ ...form, territoryId: val })}
                          onAdd={isEditMode ? null : () => {
                             setLookupCreateContext({ key: 'territory', callback: (c) => setForm(p=>({...p, territoryId: c.id})) });
                             setShowLookupCreateModal(true);
                          }}
                          onEdit={() => {
                             const item = territories.find(x => String(x.territoryId??x.id) === String(form.territoryId));
                             setLookupCreateContext({ key: 'territory', item, mode: 'edit', callback: (c) => setForm(p=>({...p, territoryId: c.id})) });
                             setShowLookupCreateModal(true);
                          }}
                       />
                    </div>



                    <div className="z-[20]">
                      <EmpSearchableSelect
                          label="User Mapping (Optional)"
                          options={users.map(x => ({ id: x.userId ?? x.id, name: x.username ?? x.email ?? x.name }))}
                          value={form.userId}
                          onChange={(val) => setForm({ ...form, userId: val })}
                        />
                    </div>
                    
                    {/* Empty div for alignment if needed, or leave blank */}
                    <div className="hidden md:block"></div>

                    {/* ADDRESS & PICTURE BLOCK (Footer) */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        {/* Address */}
                        <div className="flex flex-col h-full">
          <label className="text-sm text-gray-300 block mb-1">Address</label>
                           <div className="flex-grow">
                            <textarea 
                              value={form.address} 
                              onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} 
                              className="w-full h-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm focus:border-blue-500 focus:outline-none resize-none"
                              style={{ minHeight: '120px' }}
                            />
                           </div>
                        </div>

                        {/* Picture */}
                        <div className="flex flex-col h-full">
           <label className="text-sm text-gray-300 block mb-1">Picture</label>
                           <div className="flex-grow flex items-center justify-center bg-gray-800 border border-gray-600 rounded p-4 h-full" style={{ minHeight: '120px' }}>
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border border-gray-600">
                                  {form.picturePreview ? (
                                    <img src={form.picturePreview} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon size={32} className="text-gray-500 m-auto mt-6" />
                                  )}
                                </div>
                                <div className="flex gap-2 text-sm">
                                  <label className="cursor-pointer text-blue-300 hover:text-blue-200">
                                     {form.pictureFile ? "Change" : "Upload"}
                                     <input type="file" accept="image/*" onChange={(e) => handlePictureChange(e.target.files?.[0])} className="hidden" />
                                  </label>
                                  {form.picturePreview && (
                                    <button onClick={removePicture} className="text-red-400 hover:text-red-300">Remove</button>
                                  )}
                                </div>
                              </div>
                           </div>
                        </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* PAYROLL tab */
                <div>
                  <div className="grid grid-cols-3 gap-3 items-end mb-3 ms-3 me-3">
                    <div>
                      <label className="text-sm text-gray-300">Basic Salary *</label>
                      <input value={form.salary} onChange={(e) => setForm(p => ({ ...p, salary: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm  h-[38px]" />
                    </div>

                    {/* Payroll Bank */}
                    <div>
                      <EmpSearchableSelect
                        label="Payroll Bank"
                        options={banks.map(x => ({ id: x.Id ?? x.id, name: x.BankName ?? x.name }))}
                        value={form.payrollBankId}
                        onChange={(val) => setForm({ ...form, payrollBankId: val })}
                        required
                        onAdd={() => {
                           setLookupCreateContext({ key: 'bank', callback: (c) => setForm(p=>({...p, payrollBankId: c.id})) });
                           setShowLookupCreateModal(true);
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-300">Bank Account *</label>
                      <input value={form.payrollBankAccount} onChange={(e) => setForm(p => ({ ...p, payrollBankAccount: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm h-[38px]" />
                    </div>
                  </div>

                  {/* INCOMES card */}
                  <div className="mb-3">
                    <div className="flex items-center gap-5 mb-2">
                      <h3 className="text-lg">Incomes</h3>
                      <button
                        onClick={() => {
                          setEditingIncomeId(null);
                          setIncomeForm({ typeId: null, amount: "", description: "" });
                          setShowIncomeModal(true);
                        }}
                        className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-2 py-1 rounded text-sm"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {/* 50% WIDTH TABLE */}
                    <div className=" border border-gray-700 rounded p-2 overflow-x-auto w-1/2">
                      <table className="w-full text-center text-sm">
                        <thead className="bg-gray-900">
                          <tr className="text-gray-300">
                            <th className="py-2 pr-4">Income</th>
                            <th className="py-2 w-24">Amount</th>
                            <th className="py-2">Description</th>
                            <th className="py-2 w-28">Actions</th>
                          </tr>
                        </thead>

                        <tbody className="bg-gray-800">
                          {incomes.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-white-500">
                                No incomes added
                              </td>
                            </tr>
                          ) : (
                            incomes.map((r) => (
                              <tr key={r.id} className="border-t border-gray-700">
                                <td className="py-2 pr-4">{r.typeName}</td>
                                <td className="py-2 w-24 text-right">{r.amount}</td>
                                <td className="py-2">{r.description || "-"}</td>
                                <td className="py-2 text-right">
                                  <button
                                    className="p-1 mr-2"
                                    onClick={() => {
                                      setEditingIncomeId(r.id);
                                      setIncomeForm({
                                        typeId: r.typeId,
                                        amount: r.amount,
                                        description: r.description,
                                      });
                                      setShowIncomeModal(true);
                                    }}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    className="p-1 text-red-400"
                                    onClick={() =>
                                      setIncomes((prev) => prev.filter((x) => x.id !== r.id))
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DEDUCTIONS card */}
                  <div>
                    <div className="flex items-center gap-5 mb-2">
                      <h3 className="text-lg">Deductions</h3>
                      <button onClick={() => { setEditingDeductionId(null); setDeductionForm({ typeId: null, amount: "", description: "" }); setShowDeductionModal(true); }} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-2 py-1 rounded text-sm"><Plus size={12} /> Add</button>
                    </div>

                    <div className=" border border-gray-700 rounded p-2 overflow-x-auto w-1/2">
                      <table className="w-full text-center text-sm">
                        <thead className="bg-gray-900">
                          <tr className="text-gray-300">
                            <th className="py-2 pr-4">Deduction</th>
                            <th className="py-2 w-24">Amount</th>
                            <th className="py-2">Description</th>
                            <th className="py-2 w-28">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800">
                          {deductions.length === 0 ? (
                            <tr><td colSpan={4} className="py-6 text-center text-white-500">No deductions added</td></tr>
                          ) : deductions.map(r => (
                            <tr key={r.id} className="border-t border-gray-900">
                              <td className="py-2 pr-4">{r.typeName}</td>
                              <td className="py-2 w-24 text-right">{r.amount}</td>
                              <td className="py-2">{r.description || "-"}</td>
                              <td className="py-2 text-right">
                                <button className="p-1 mr-2" onClick={() => { setEditingDeductionId(r.id); setDeductionForm({ typeId: r.typeId, amount: r.amount, description: r.description }); setShowDeductionModal(true); }}><Pencil size={14} /></button>
                                <button className="p-1 text-red-400" onClick={() => setDeductions(prev => prev.filter(x => x.id !== r.id))}><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS rendered via Portal to avoid stacking context issues */}
      {showIncomeModal && <Portal><IncomeModal onClose={() => setShowIncomeModal(false)} initialForm={incomeForm} editingId={editingIncomeId} setEditingId={setEditingIncomeId} setIncomes={setIncomes} types={incomeTypes} /></Portal>}
      {showDeductionModal && <Portal><DeductionModal onClose={() => setShowDeductionModal(false)} initialForm={deductionForm} editingId={editingDeductionId} setEditingId={setEditingDeductionId} setDeductions={setDeductions} types={deductionTypes} /></Portal>}
      {showLookupCreateModal && <Portal><LookupCreateModal context={lookupCreateContext} onClose={() => setShowLookupCreateModal(false)} setters={lookupSetters} form={form} /></Portal>}
    </PageLayout>
  );
};

// ==========================================
// EXTRACTED COMPONENTS (MOVED OUTSIDE)
// ==========================================

const Portal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
};



const LookupCreateModal = ({ context, onClose, setters, form }) => {
  const { key, callback, item, mode, typedName } = context || {};
  const [name, setName] = useState(item?.name || item?.designation || item?.department || typedName || "");
  const [countryIdLocal, setCountryIdLocal] = useState(item?.countryId || form.countryId || "");
  const [stateIdLocal, setStateIdLocal] = useState(item?.stateId || form.stateId || "");

  const countryRefModal = useRef(null);
  const stateRefModal = useRef(null);
  
  const [countrySearchLocal, setCountrySearchLocal] = useState("");
  const [countryOpenLocal, setCountryOpenLocal] = useState(false);
  const [stateSearchLocal, setStateSearchLocal] = useState("");
  const [stateOpenLocal, setStateOpenLocal] = useState(false);

  const {
      setCountries, setStates, setCities, setRegions, setTerritories,
      setDesignations, setDepartments, setIncomeTypes, setDeductionTypes, setBanks
  } = setters;

  const save = async () => {
    if (!name || !name.trim()) return toast.error("Name required");
    try {
      let created = null;
      if (!mode || mode === "add") {
        if (key === "country") {
          const res = await addCountryApi({ name: name.trim(), userId: form.userId || 1 });
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "state") {
          const res = await addStateApi({ name: name.trim(), countryId: Number(countryIdLocal || form.countryId), userId: form.userId || 1 });
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "city") {
          const res = await addCityApi({ name: name.trim(), countryId: Number(countryIdLocal || form.countryId), stateId: Number(stateIdLocal || form.stateId), userId: form.userId || 1 });
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "region") {
          const res = await addRegionApi({ name: name.trim(), userId: form.userId || 1 });
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "territory") {
          const res = await addTerritoryApi({ name: name.trim(), regionId: Number(context.regionId || form.regionId), userId: form.userId || 1 });
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else {
           created = { id: `t_${Date.now()}`, name: name.trim() };
        }
      }

      if (!created) created = { id: `t_${Date.now()}`, name: name.trim() };

      switch (key) {
        case "country": setCountries((p) => [created, ...p]); break;
        case "state": setStates((p) => [created, ...p]); break;
        case "city": setCities((p) => [created, ...p]); break;
        case "region": setRegions((p) => [created, ...p]); break;
        case "territory": setTerritories((p) => [created, ...p]); break;
        case "designation": setDesignations((p) => [created, ...p]); break;
        case "department": setDepartments((p) => [created, ...p]); break;
        case "incomeType": setIncomeTypes((p) => [created, ...p]); break;
        case "deductionType": setDeductionTypes((p) => [created, ...p]); break;
        case "bank": setBanks((p) => [created, ...p]); break;
        default: break;
      }

      if (typeof callback === "function") callback(created);
      onClose();
      toast.success(`${mode === "edit" ? "Updated" : "Added"} ${key}`);
    } catch (err) {
      console.error("lookup create error:", err);
      toast.error("Save failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[11000]">
      <div className="w-[520px] bg-gray-900 text-white rounded-lg border border-gray-700 shadow-xl relative z-[11001]">
        <div className="flex justify-between px-4 py-2 border-b border-gray-700 ">
          <h2 className="text-lg font-semibold">{(mode === "edit" ? "Edit" : "Create")} {key}</h2>
          <button onClick={onClose} className="p-1"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
           <label className="text-sm text-gray-300">Name *</label>
           <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200 text-sm" />
        </div>
        <div className="px-4 py-2 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">Cancel</button>
          <button onClick={save} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-blue-300 text-sm"><Save size={14} /> Save</button>
        </div>
      </div>
    </div>
  );
};

const IncomeModal = ({ 
  onClose, 
  initialForm, // Receive initial data instead of shared state
  editingId, 
  setEditingId, 
  setIncomes,
  types,
}) => {
  // INTERNAL STATE: Prevent parent re-renders on keystroke
  const [localForm, setLocalForm] = React.useState(initialForm || { typeId: "", amount: "", description: "" });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[10400]">
      <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
        <div className="flex justify-between px-4 py-2 border-b border-gray-700">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Income" : "Add Income"}</h2>
          <button onClick={onClose} className="p-1"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm block mb-1 text-gray-300">Income *</label>
            <SearchableSelect
              options={types}
              value={localForm.typeId}
              onChange={(val) => setLocalForm({ ...localForm, typeId: val })}
              placeholder="Select Income Type"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm text-gray-300">Amount *</label>
              <input 
                type="number" 
                value={localForm.amount} 
                onChange={(e) => setLocalForm(p => ({ ...p, amount: e.target.value }))} 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200 text-sm" 
                autoFocus 
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-300">Description</label>
              <input 
                type="text" 
                value={localForm.description} 
                onChange={(e) => setLocalForm(p => ({ ...p, description: e.target.value }))} 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200 text-sm" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
             <button onClick={onClose} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">Cancel</button>
             <button onClick={() => {
                if (!localForm.typeId) return toast.error("Income required");
                if (!localForm.amount) return toast.error("Amount required");
                
                const typeName = types.find(t => String(t.id) === String(localForm.typeId))?.name || "";
                
                if (editingId) {
                  setIncomes(prev => prev.map(r => r.id === editingId ? { ...r, ...localForm, typeName } : r));
                } else {
                  setIncomes(prev => [{ id: `i_${Date.now()}`, ...localForm, typeName }, ...prev]);
                }
                setEditingId(null);
                onClose();
             }} className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300 hover:bg-gray-700 transition-colors"><Save size={16} /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeductionModal = ({ 
  onClose, 
  initialForm, 
  editingId, 
  setEditingId, 
  setDeductions,
  types,
}) => {
  // INTERNAL STATE: Prevent parent re-renders on keystroke
  const [localForm, setLocalForm] = React.useState(initialForm || { typeId: "", amount: "", description: "" });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[10400]">
      <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
        <div className="flex justify-between px-4 py-2 border-b border-gray-700">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Deduction" : "Add Deduction"}</h2>
          <button onClick={onClose} className="p-1"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm block mb-1 text-gray-300">Deduction *</label>
            <SearchableSelect
              options={types}
              value={localForm.typeId}
              onChange={(val) => setLocalForm({ ...localForm, typeId: val })}
              placeholder="Select Deduction Type"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm text-gray-300">Amount *</label>
              <input 
                type="number" 
                value={localForm.amount} 
                onChange={(e) => setLocalForm(p => ({ ...p, amount: e.target.value }))} 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200 text-sm" 
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-300">Description</label>
              <input 
                type="text" 
                value={localForm.description} 
                onChange={(e) => setLocalForm(p => ({ ...p, description: e.target.value }))} 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200 text-sm" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
             <button onClick={onClose} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">Cancel</button>
             <button onClick={() => {
                if (!localForm.typeId) return toast.error("Deduction required");
                if (!localForm.amount) return toast.error("Amount required");
                
                const typeName = types.find(t => String(t.id) === String(localForm.typeId))?.name || "";
                
                if (editingId) {
                  setDeductions(prev => prev.map(r => r.id === editingId ? { ...r, ...localForm, typeName } : r));
                } else {
                  setDeductions(prev => [{ id: `d_${Date.now()}`, ...localForm, typeName }, ...prev]);
                }
                setEditingId(null);
                onClose();
             }} className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300 hover:bg-gray-700 transition-colors"><Save size={16} /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEmployee;
