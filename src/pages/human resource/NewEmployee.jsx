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
import { showDeleteConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
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
  addDepartmentApi,
  addDesignationApi,
 addEmployeeApi,
updateEmployeeApi,
getEmployeeByIdApi,
deleteEmployeeApi,
searchEmployeeApi,

} from "../../services/allAPI";
import { serverURL } from "../../services/serverURL";
import SearchableSelect from "../../components/SearchableSelect";

import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import AddModal from "../../components/modals/AddModal";
import ContentCard from "../../components/ContentCard";

// 1. Update EmpSearchableSelect Star and Asterisk
const EmpSearchableSelect = ({
  label,
  value,
  options,
  onChange,
  required = false,
  onAdd,
  placeholder = "Select...",
  disabled = false,
  ...props
}) => {
  const { theme } = useTheme();
  return (
    <div className="w-full">
      <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
        {label} 
        {required && <span className="text-dark"> *</span>}
      </label>
      <div className="flex gap-2 items-start">
        <div className="flex-grow">
          <SearchableSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            {...props}
          />
        </div>
        
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            disabled={disabled}
            className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
            title="Add"
          >
            <Star size={16}/>
          </button>
        ) : (
           <div className="flex-shrink-0 w-[38px] h-[38px]"></div>
        )}
      </div>
    </div>
  );
};

const FormInput = ({ label, value, onChange, placeholder, required, type = "text", disabled, autoFocus }) => {
  const { theme } = useTheme();
  return (
    <div className="w-full">
      <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
        {label} 
        {required && <span className="text-dark"> *</span>}
      </label>
      <div className="flex gap-2 items-start">
        <div className="flex-grow">
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`w-full border rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-200'}`}
          />
        </div>
        {/* Spacer to match EmpSearchableSelect button width */}
        <div className="flex-shrink-0 w-[38px] h-[38px]"></div>
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
  const { theme } = useTheme();

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
    showErrorToast("Failed to load employee");
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
  
  const [lookupName, setLookupName] = useState("");

  const lookupSetters = {
      setCountries, setStates, setCities, setRegions, setTerritories,
      setDesignations, setDepartments, setIncomeTypes, setDeductionTypes, setBanks
  };

  // Lifted Logic for Lookup Save
  const handleLookupSave = async () => {
    const { key, callback, mode } = lookupCreateContext;
    if (!lookupName || !lookupName.trim()) return showErrorToast("Name required");

    try {
      let created = null;
      let wasDuplicate = false;

      if (!mode || mode === "add") {
        const userId = form.userId || 1;
        
         if (key === "country") {
          const res = await addCountryApi({ name: lookupName.trim(), userId });
          if (res?.data?.message?.includes("already exists")) {
             showSuccessToast("Country already exists, selected existing.");
             wasDuplicate = true;
          }
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "state") {
          const res = await addStateApi({ name: lookupName.trim(), countryId: Number(form.countryId), userId });
          if (res?.data?.message?.includes("already exists")) {
             showSuccessToast("State already exists, selected existing.");
             wasDuplicate = true;
          }
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "city") {
           const res = await addCityApi({ name: lookupName.trim(), countryId: Number(form.countryId), stateId: Number(form.stateId), userId });
           if (res?.data?.message?.includes("already exists")) {
             showSuccessToast("City already exists, selected existing.");
             wasDuplicate = true;
           }
           created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "region") {
          const res = await addRegionApi({ regionName: lookupName.trim(), userId });
          if (res?.data?.message?.includes("already exists")) {
            showSuccessToast("Region already exists, selected existing.");
            wasDuplicate = true;
          }
          created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "territory") {
           const res = await addTerritoryApi({ territoryDescription: lookupName.trim(), regionId: Number(form.regionId), userId });
           if (res?.data?.message?.includes("already exists")) {
            showSuccessToast("Territory already exists, selected existing.");
            wasDuplicate = true;
          }
           created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "department") {
           const res = await addDepartmentApi({ department: lookupName.trim(), userId });
           if (res?.data?.message?.includes("already exists")) {
            showSuccessToast("Department already exists, selected existing.");
            wasDuplicate = true;
          }
           created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else if (key === "designation") {
           const res = await addDesignationApi({ designation: lookupName.trim(), userId });
           if (res?.data?.message?.includes("already exists")) {
            showSuccessToast("Designation already exists, selected existing.");
            wasDuplicate = true;
          }
           created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
        } else {
           created = { id: `t_${Date.now()}`, name: lookupName.trim() };
        }
      }

      if (!created) created = { id: `t_${Date.now()}`, name: lookupName.trim() };

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
      setShowLookupCreateModal(false);
      setLookupName("");
      
      if (!wasDuplicate) {
        showSuccessToast(`${mode === "edit" ? "Updated" : "Added"} ${key}`);
      }
    } catch (err) {
      console.error("lookup create error:", err);
      showErrorToast("Save failed");
    }
  };

  // Lifted Logic for Income Save
  const handleIncomeSave = () => {
      if (!incomeForm.typeId) return showErrorToast("Income required");
      if (!incomeForm.amount) return showErrorToast("Amount required");

      const typeName = incomeTypes.find(t => String(t.id) === String(incomeForm.typeId))?.name || "";

      if (editingIncomeId) {
        setIncomes(prev => prev.map(r => r.id === editingIncomeId ? { ...r, ...incomeForm, typeName } : r));
      } else {
        setIncomes(prev => [{ id: `i_${Date.now()}`, ...incomeForm, typeName }, ...prev]);
      }
      setEditingIncomeId(null);
      setIncomeForm({ typeId: null, amount: "", description: "" });
      setShowIncomeModal(false);
  };

  // Lifted Logic for Deduction Save
   const handleDeductionSave = () => {
      if (!deductionForm.typeId) return showErrorToast("Deduction required");
      if (!deductionForm.amount) return showErrorToast("Amount required");

      const typeName = deductionTypes.find(t => String(t.id) === String(deductionForm.typeId))?.name || "";

      if (editingDeductionId) {
        setDeductions(prev => prev.map(r => r.id === editingDeductionId ? { ...r, ...deductionForm, typeName } : r));
      } else {
        setDeductions(prev => [{ id: `d_${Date.now()}`, ...deductionForm, typeName }, ...prev]);
      }
      setEditingDeductionId(null);
      setDeductionForm({ typeId: null, amount: "", description: "" });
      setShowDeductionModal(false);
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
      showErrorToast("Failed to load countries");
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
      showErrorToast("Failed to load states");
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
      showErrorToast("Failed to load cities");
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
      showErrorToast("Failed to load regions");
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
      showErrorToast("Failed to load territories");
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
      showErrorToast("Error loading banks");
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
    showErrorToast("Failed to load users");
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
  if (!form.firstName.trim()) return showErrorToast("First name required");
  // Last Name is not required anymore
  if (!String(form.salary).trim()) return showErrorToast("Basic Salary required");
  if (!form.payrollBankId) return showErrorToast("Payroll Bank required");
  if (!form.payrollBankAccount.trim()) return showErrorToast("Bank Account required");
  const bankAccLen = form.payrollBankAccount.trim().length;
  if (bankAccLen < 10 || bankAccLen > 18) return showErrorToast("Bank Account must be between 10 and 18 digits");
  
  if (form.phone && form.phone.length !== 10) return showErrorToast("Phone number must be exactly 10 digits");

  // DUPLICATE VALIDATION
  try {
      // 1. Phone Check
      if (form.phone.trim()) {
        const phoneRes = await searchEmployeeApi(form.phone.trim());
        if (phoneRes?.status === 200) {
            const rows = Array.isArray(phoneRes.data) ? phoneRes.data : [];
            const existing = rows.find(e => 
                e.Phone === form.phone.trim() && 
                (!isEditMode || String(e.Id) !== String(id))
            );
            if (existing) return showErrorToast("Phone number already exists");
        }
      }

      // 2. Name Check (First + Last)
      const nameRes = await searchEmployeeApi(form.firstName.trim());
      if (nameRes?.status === 200) {
          const rows = Array.isArray(nameRes.data) ? nameRes.data : [];
          const existing = rows.find(e => 
              e.FirstName.toLowerCase() === form.firstName.trim().toLowerCase() &&
              e.LastName.toLowerCase() === form.lastName.trim().toLowerCase() &&
              (!isEditMode || String(e.Id) !== String(id))
          );
          if (existing) return showErrorToast("Employee with this Name already exists");
      }

      // 3. Account Number Check
      if (form.payrollBankAccount.trim()) {
        const accRes = await searchEmployeeApi(form.payrollBankAccount.trim());
        if (accRes?.status === 200) {
            const rows = Array.isArray(accRes.data) ? accRes.data : [];
            const existing = rows.find(e => 
                e.BankAccountForPayroll === form.payrollBankAccount.trim() &&
                (!isEditMode || String(e.Id) !== String(id))
            );
            if (existing) return showErrorToast("Account number already exists");
        }
      }

      // 4. Email Check
      if (form.email.trim()) {
        const emailRes = await searchEmployeeApi(form.email.trim());
        if (emailRes?.status === 200) {
            const rows = Array.isArray(emailRes.data) ? emailRes.data : [];
            const existing = rows.find(e => 
                e.Email?.toLowerCase() === form.email.trim().toLowerCase() &&
                (!isEditMode || String(e.Id) !== String(id))
            );
            if (existing) return showErrorToast("Email already exists");
        }
      }

  } catch(err) {
      console.error("Duplicate Check Error:", err);
  }

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
      showSuccessToast(isEditMode ? "Employee updated" : "Employee created");
      if (location.state?.returnTo) {
        navigate(location.state.returnTo, { 
          state: { 
            newEmployeeId: res.data?.record?.id || res.data?.id || res.data?.Id,
            field: location.state.field,
            preservedState: location.state.preservedState // Pass back state
          } 
        });
      } else {
        navigate("/app/hr/employees");          // ✅ REDIRECT
      }
    } else {
      showErrorToast(res?.data?.message || "Save failed");
    }
  } catch (err) {
    console.error("submitEmployee error", err);
    showErrorToast("Server error");
  }
};



const handleDelete = async () => {
  const result = await showDeleteConfirm("employee");

  if (!result.isConfirmed) return;

  try {
    await deleteEmployeeApi(id, { userId: form.userId });
    showSuccessToast("Employee deleted successfully.");
    navigate("/app/hr/employees");
  } catch (err) {
    console.error("delete employee error", err);
    showErrorToast("Failed to delete employee");
  }
};







  // ================================
  // PART 2: SearchableDropdown + Modal Components
  // ================================

// Inner components moved to end of file



  if (isEditMode && isEditLoading) {
  return (
    <div className={`h-[90vh] flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>
      <div className="flex flex-col items-center gap-3">
        <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${theme === 'emerald' || theme === 'purple' ? 'border-gray-800' : 'border-gray-400'}`}></div>
        <span className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'}`}>Loading employee data...</span>
      </div>
    </div>
  );
}

  // PART 3 â€” Final JSX UI (main page)

  return (
    <PageLayout>
      <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (location.state?.returnTo) {
                      navigate(location.state.returnTo, {
                          state: { preservedState: location.state.preservedState }
                      });
                  } else if (location.state?.from) {
                      navigate(location.state.from);
                  } else {
                      navigate("/app/hr/employees");
                  }
                }} 
                className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-600 hover:text-gray-900' : 'text-white hover:text-white-400'}`}
              >
            <ArrowLeft size={24} />
          </button>
           <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>
            {isEditMode ? "Edit Employee" : "New Employee"}
          </h2>
           </div>

            <div className="flex gap-3">
            {(isEditMode ? hasPermission(PERMISSIONS.HR.EMPLOYEES.EDIT) : hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE)) && (
            <button onClick={submitEmployee}  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                  theme === 'emerald'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : theme === 'purple'
                  ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md'
                  : 'bg-gray-800 border border-gray-600 text-blue-300'
              }`}>
              <Save size={16} /> {isEditMode ? "Update" : "Save"}
            </button>
            )}

            {isEditMode && hasPermission(PERMISSIONS.HR.EMPLOYEES.DELETE) && (
              <button
                onClick={handleDelete}
                className={`flex items-center gap-2 border px-3 py-2 rounded ${theme === 'emerald' || theme === 'purple' ? 'flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500' : 'bg-red-800 border-red-600 text-red-200'}`}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}

          </div>

          </div>
          <hr className="mb-4 border-gray-300" />

          {/* tabs */}
          <div className={`mb-3 border-b ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
            <div className="flex gap-3 font-medium">
              <button onClick={() => setBasicTab(true)} className={`px-3 py-1 ${basicTab ? (theme === 'purple' ? "border-b-2 border-[#6448AE] text-[#6448AE] font-medium" : theme === 'emerald' ? "border-b-2 border-emerald-500 text-emerald-600 font-medium" : "border-b-2 border-yellow-400 text-yellow-300") : (theme === 'emerald' || theme === 'purple' ? "text-gray-500 hover:text-gray-700" : "text-gray-300")}`}>Basic Information</button>
              <button onClick={() => setBasicTab(false)} className={`px-3 py-1 ${!basicTab ? (theme === 'purple' ? "border-b-2 border-[#6448AE] text-[#6448AE] font-medium" : theme === 'emerald' ? "border-b-2 border-emerald-500 text-emerald-600 font-medium" : "border-b-2 border-yellow-400 text-yellow-300") : (theme === 'emerald' || theme === 'purple' ? "text-gray-500 hover:text-gray-700" : "text-gray-300")}`}>Payroll</button>
            </div>
          </div>

          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">
              {basicTab ? (
                <div className="p-4">
                  {/* UNIFIED GRID for better Tab Order (Left->Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-full font-medium">
                    
                    {/* Row 1: Names */}
                    <div>
                      <FormInput
                        label="First Name"
                        value={form.firstName}
                        onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <FormInput
                        label="Last Name"
                        value={form.lastName}
                        onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))}
                        required={false}
                      />
                    </div>

                    {/* Row 2: Contact */}
                    <div>
                      <FormInput
                        label="Phone"
                        value={form.phone}
                        onChange={(e) => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      />
                    </div>
                    <div>
                      <FormInput
                        label="Email"
                        value={form.email}
                        onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
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
                        onAdd={isEditMode || !hasPermission(PERMISSIONS.HR.DESIGNATIONS.CREATE) ? null : () => {
                           setLookupCreateContext({ key: 'designation', callback: (c) => setForm(p=>({...p, designationId: c.id || c.Id})) });
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={isEditMode && hasPermission(PERMISSIONS.HR.DESIGNATIONS.EDIT) ? () => {
                           const item = designations.find(x => String(x.id??x.Id) === String(form.designationId));
                           setLookupCreateContext({ key: 'designation', item, mode: 'edit', callback: (c) => setForm(p=>({...p, designationId: c.id || c.Id})) });
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
                        onAdd={isEditMode || !hasPermission(PERMISSIONS.HR.DEPARTMENTS.CREATE) ? null : () => {
                           setLookupCreateContext({ key: 'department', callback: (c) => setForm(p=>({...p, departmentId: c.id || c.Id})) });
                           setShowLookupCreateModal(true);
                        }}
                        onEdit={isEditMode && hasPermission(PERMISSIONS.HR.DEPARTMENTS.EDIT) ? () => {
                           const item = departments.find(x => String(x.id??x.Id) === String(form.departmentId));
                           setLookupCreateContext({ key: 'department', item, mode: 'edit', callback: (c) => setForm(p=>({...p, departmentId: c.id || c.Id})) });
                           setShowLookupCreateModal(true);
                        } : null}
                      />
                    </div>

                    {/* Row 4: Compensation */}
                    <div>
                      <EmpSearchableSelect
                         label="Rate Type"
                         options={[{id: 'hourly', name: 'Hourly'}, {id: 'salary', name: 'Salary'}]}
                         value={form.rateType}
                         onChange={(val) => setForm(p => ({ ...p, rateType: val }))}
                         placeholder="Select Rate Type"
                      />
                    </div>
                    <div>
                      <FormInput
                        label="Hour Rate / Salary"
                        value={form.hourlyRate}
                        onChange={(e) => setForm(p => ({ ...p, hourlyRate: e.target.value }))}
                      />
                    </div>

                    {/* Row 5: Details & Picture */}
                    {/* Details: Blood Group & Zip Code */ }
                    <div>
                      <EmpSearchableSelect
                         label="Blood Group"
                         options={BLOOD_GROUPS.map(b => ({ id: b, name: b }))}
                         value={form.bloodGroup}
                         onChange={(val) => setForm(p => ({ ...p, bloodGroup: val }))}
                         placeholder="Select Blood Group"
                         dropdownHeight="max-h-36"
                      />
                    </div>
                    
                    <div>
                      <FormInput
                        label="Zip Code"
                        value={form.zipCode}
                        onChange={(e) => setForm(p => ({ ...p, zipCode: e.target.value }))}
                      />
                    </div>

                    {/* DIVIDER */}
                    <div className={`col-span-1 md:col-span-2 my-2 border-t ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-800'}`}></div>

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
                        onAdd={isEditMode || !hasPermission(PERMISSIONS.COUNTRIES.CREATE) ? null : () => {
                           setLookupCreateContext({ key: 'country', callback: (c) => {
                             setForm(p=>({...p, countryId: c.id || c.Id}));
                             awaitLoadStatesForCountry(c.id || c.Id);
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
                        onAdd={isEditMode || !hasPermission(PERMISSIONS.STATES.CREATE) ? null : () => {
                           setLookupCreateContext({ key: 'state', callback: (c) => {
                             setForm(p=>({...p, stateId: c.id || c.Id}));
                             awaitLoadCitiesForState(c.id || c.Id);
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
                        onAdd={isEditMode || !hasPermission(PERMISSIONS.CITIES.CREATE) ? null : () => {
                           setLookupCreateContext({ key: 'city', callback: (c) => setForm(p=>({...p, cityId: c.id || c.Id})) });
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
                        onAdd={isEditMode || !hasPermission(PERMISSIONS.REGIONS.CREATE) ? null : () => {
                           setLookupCreateContext({ key: 'region', callback: (c) => {
                              setForm(p=>({...p, regionId: c.id || c.Id || c.RegionId}));
                              awaitLoadTerritoriesForRegion(c.id || c.Id || c.RegionId);
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
                             setLookupCreateContext({ key: 'territory', callback: (c) => setForm(p=>({...p, territoryId: c.id || c.Id || c.TerritoryId})) });
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
           <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Address</label>
                           <div className="flex-grow">
                            <textarea 
                              value={form.address} 
                              onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} 
                              className={`w-full h-full border rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-gray-200'}`}
                              style={{ minHeight: '120px' }}
                            />
                           </div>
                        </div>

                        {/* Picture */}
                        <div className="flex flex-col h-full">
            <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Picture</label>
                           <div className={`flex-grow flex items-center justify-center border rounded p-4 h-full ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600'}`} style={{ minHeight: '120px' }}>
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-200' : 'bg-gray-700 border-gray-600'}`}>
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
                  <div className="grid grid-cols-3 gap-3 items-end mb-3 ms-3 me-3 font-medium">
                    <div>
                      <FormInput
                        label="Basic Salary"
                        value={form.salary}
                        onChange={(e) => setForm(p => ({ ...p, salary: e.target.value }))}
                        required
                      />
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
                           setLookupCreateContext({ key: 'bank', callback: (c) => setForm(p=>({...p, payrollBankId: c.id || c.Id})) });
                           setShowLookupCreateModal(true);
                        }}
                      />
                    </div>

                    <div>
                      <FormInput
                        label="Bank Account"
                        value={form.payrollBankAccount}
                        onChange={(e) => setForm(p => ({ ...p, payrollBankAccount: e.target.value.replace(/\D/g, "").slice(0, 18) }))}
                        required
                      />
                    </div>
                  </div>

                  {/* INCOMES card */}
                  <div className="mb-3">
                    <div className="flex items-center gap-5 mb-2">
                      <h3 className="text-sm font-medium">Incomes</h3>
                      <button
                        onClick={() => {
                          setEditingIncomeId(null);
                          setIncomeForm({ typeId: null, amount: "", description: "" });
                          setShowIncomeModal(true);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                  theme === 'emerald'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : theme === 'purple'
                  ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md'
                  : 'bg-gray-800 border border-gray-600 text-blue-300'
              }`}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {/* 50% WIDTH TABLE */}
                    <div className=" border border-gray-700 rounded p-2 overflow-x-auto w-1/2">
                      <table className="w-full text-center text-sm">
                        <thead className={`${theme === 'emerald' || theme === 'purple' ? 'bg-purple-50 text-gray-700' : 'bg-gray-900 text-white'}`}>
                          <tr className="text-purple-800">
                            <th className="py-2 pr-4">Income</th>
                            <th className="py-2 w-24">Amount</th>
                            <th className="py-2">Description</th>
                            <th className="py-2 w-28">Actions</th>
                          </tr>
                        </thead>

                        <tbody className={`${theme === 'emerald' || theme === 'purple' ? 'divide-y divide-gray-200' : 'bg-gray-800 divide-y divide-gray-700'}`}>
                          {incomes.length === 0 ? (
                            <tr>
                              <td colSpan={4} className={`py-6 text-center ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-white-500'}`}>
                                No incomes added
                              </td>
                            </tr>
                          ) : (
                            incomes.map((r) => (
                              <tr key={r.id} className={`${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 hover:bg-gray-50' : 'border-t border-gray-700'}`}>
                                <td className="py-2 pr-4">{r.typeName}</td>
                                <td className="py-2 w-24">{r.amount}</td>
                                <td className="py-2">{r.description || "-"}</td>
                                <td className="py-2">
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
                       <h3 className="text-sm font-medium">Deductions</h3>
                       <button onClick={() => { setEditingDeductionId(null); setDeductionForm({ typeId: null, amount: "", description: "" }); setShowDeductionModal(true); }}   className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                  theme === 'emerald'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : theme === 'purple'
                  ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md'
                  : 'bg-gray-800 border border-gray-600 text-blue-300'
              }`}><Plus size={12} /> Add</button>
                    </div>

                    <div className=" border border-gray-700 rounded p-2 overflow-x-auto w-1/2">
                      <table className="w-full text-center text-sm">
                        <thead className={`${theme === 'emerald' || theme === 'purple' ? 'bg-purple-50 text-purple-800' : 'bg-gray-900 text-white'}`}>
                          <tr className="text-purple-800">
                            <th className="py-2 pr-4">Deduction</th>
                            <th className="py-2 w-24">Amount</th>
                            <th className="py-2">Description</th>
                            <th className="py-2 w-28">Actions</th>
                          </tr>
                        </thead>
                        <tbody className={`${theme === 'emerald' || theme === 'purple' ? 'divide-y divide-gray-200' : 'bg-gray-800 divide-y divide-gray-700'}`}>
                          {deductions.length === 0 ? (
                            <tr><td colSpan={4} className={`py-6 text-center ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-white-500'}`}>No deductions added</td></tr>
                          ) : deductions.map(r => (
                            <tr key={r.id} className={`${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 hover:bg-gray-50' : 'border-t border-gray-900'}`}>
                              <td className="py-2 pr-4">{r.typeName}</td>
                              <td className="py-2 w-24">{r.amount}</td>
                              <td className="py-2">{r.description || "-"}</td>
                              <td className="py-2">
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
        </ContentCard>
      </div>


      {/* MODALS rendered via AddModal */}
      
      {/* INCOME MODAL */}
      <AddModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSave={handleIncomeSave}
        title={editingIncomeId ? "Edit Income" : "Add Income"}
        width="500px"
      >
          <div className="space-y-3">
            <div>
                <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Income <span className="text-dark">*</span></label>
              <SearchableSelect
                options={incomeTypes}
                value={incomeForm.typeId}
                onChange={(val) => setIncomeForm({ ...incomeForm, typeId: val })}
                placeholder="Select Income Type"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                 <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Amount <span className="text-dark">*</span></label>
                 <input 
                   type="number" 
                   value={incomeForm.amount} 
                   onChange={(e) => setIncomeForm(p => ({ ...p, amount: e.target.value }))} 
                   className={`w-full border rounded px-2 py-1.5 text-sm ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-600 text-gray-200'}`} 
                   autoFocus 
                 />
              </div>
              <div className="col-span-2">
                 <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Description</label>
                 <input 
                   type="text" 
                   value={incomeForm.description} 
                   onChange={(e) => setIncomeForm(p => ({ ...p, description: e.target.value }))} 
                   className={`w-full border rounded px-2 py-1.5 text-sm ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-600 text-gray-200'}`} 
                 />
              </div>
            </div>
          </div>
      </AddModal>

      {/* DEDUCTION MODAL */}
       <AddModal
        isOpen={showDeductionModal}
        onClose={() => setShowDeductionModal(false)}
        onSave={handleDeductionSave}
        title={editingDeductionId ? "Edit Deduction" : "Add Deduction"}
        width="500px"
      >
         <div className="space-y-3">
            <div>
               <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Deduction <span className="text-dark">*</span></label>
              <SearchableSelect
                options={deductionTypes}
                value={deductionForm.typeId}
                onChange={(val) => setDeductionForm({ ...deductionForm, typeId: val })}
                placeholder="Select Deduction Type"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                 <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Amount <span className="text-dark">*</span></label>
                 <input 
                   type="number" 
                   value={deductionForm.amount} 
                   onChange={(e) => setDeductionForm(p => ({ ...p, amount: e.target.value }))} 
                   className={`w-full border rounded px-2 py-1.5 text-sm ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-600 text-gray-200'}`} 
                   autoFocus
                 />
              </div>
              <div className="col-span-2">
                 <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Description</label>
                 <input 
                   type="text" 
                   value={deductionForm.description} 
                   onChange={(e) => setDeductionForm(p => ({ ...p, description: e.target.value }))} 
                   className={`w-full border rounded px-2 py-1.5 text-sm ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-600 text-gray-200'}`} 
                 />
              </div>
            </div>
         </div>
      </AddModal>

      {/* LOOKUP CREATE MODAL */}
      <AddModal
        isOpen={showLookupCreateModal}
        onClose={() => setShowLookupCreateModal(false)}
        onSave={handleLookupSave}
        title={`${lookupCreateContext.mode === "edit" ? "Edit" : "Create"} ${lookupCreateContext.key}`}
        width="500px"
      >
        <div className="space-y-3">
            <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Name <span className="text-dark">*</span></label>
            <input 
              value={lookupName} 
              onChange={(e) => setLookupName(e.target.value)} 
              className={`w-full border rounded px-2 py-1.5 text-sm ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-600 text-gray-200'}`} 
            />
        </div>
      </AddModal>
    </PageLayout>
  );
};

export default NewEmployee;
