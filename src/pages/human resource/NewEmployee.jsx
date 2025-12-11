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
} from "lucide-react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
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
  // normalize type and slashes
  const raw = String(path).trim().replace(/\\\\/g, "/").replace(/\\/g, "/");
  if (raw.startsWith("blob:")) return raw; // for newly selected files
  if (/^https?:\/\//i.test(raw)) return raw; // already full URL
  if (raw.startsWith("//")) return window.location.protocol + raw; // protocol-less URL

  // Some APIs expose uploads at the server root while `serverURL` may include
  // a `/api` prefix. Remove a trailing `/api` and any trailing slash from serverURL
  // then join with the normalized path.
  const host = serverURL.replace(/\/api\/?$/i, "").replace(/\/$/, "");
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${host}${normalizedPath}`;
};
const NewEmployee = () => {

  const { id } = useParams();        
  const navigate = useNavigate();
  const isEditMode = Boolean(id);


  // ✅ LOAD EMPLOYEE ON EDIT PAGE LOAD
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

    // ✅ Load EVERYTHING needed for dropdown labels BEFORE setting form
    await Promise.all([
      loadStates(emp.CountryId),
      loadCities(emp.StateId),
      loadRegions(emp.StateId),
      loadTerritories(emp.RegionId),
      loadUsers(),
      loadBanks(),
    ]);

    // ✅ SINGLE form update (no flicker)
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

    setIncomes(emp.incomes || []);
    setDeductions(emp.deductions || []);
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

  // generic search text used for banks/table pagination (kept for parity)
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // dropdown search + open flags + refs (territories-style)
  const [search, setSearch] = useState({
    designation: "",
    department: "",
    country: "",
    state: "",
    city: "",
    region: "",
    territory: "",
    bank: "",
    incomeType: "",
    deductionType: "",
    user: "",
  });

  const [open, setOpen] = useState({
    designation: false,
    department: false,
    country: false,
    state: false,
    city: false,
    region: false,
    territory: false,
    bank: false,
    incomeType: false,
    deductionType: false,
    user: false,
  });

  const refs = {
    designation: useRef(null),
    department: useRef(null),
    country: useRef(null),
    state: useRef(null),
    city: useRef(null),
    region: useRef(null),
    territory: useRef(null),
    bank: useRef(null),
    incomeType: useRef(null),
    deductionType: useRef(null),
    user: useRef(null),
  };

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

  // Portal helper to avoid stacking-context issues (render modal into document.body)
  const Portal = ({ children }) => {
    if (typeof document === "undefined") return null;
    return ReactDOM.createPortal(children, document.body);
  };

  // click-outside to close dropdowns (global)
  useEffect(() => {
    const handler = (e) => {
      // Disable global dropdown close when any modal is open
      if (showIncomeModal || showDeductionModal || showLookupCreateModal) return;

      Object.entries(refs).forEach(([key, ref]) => {
        if (ref?.current && !ref.current.contains(e.target)) {
          setOpen((p) => ({ ...p, [key]: false }));
        }
      });
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showIncomeModal, showDeductionModal, showLookupCreateModal]);

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
        if (countryId) arr = arr.filter((s) => String(s.countryId) === String(countryId));
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
        if (stateId) arr = arr.filter((c) => String(c.stateId) === String(stateId));
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
      const filtered = stateId ? arr.filter((r) => String(r.stateId) === String(stateId)) : arr;
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
      const filtered = regionId ? arr.filter((t) => String(t.regionId) === String(regionId)) : arr;
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
      if (searchText?.trim()) {
        const res = await searchBankApi(searchText.trim());
        const raw = Array.isArray(res?.data) ? res.data : res?.data?.records || [];
        const items = raw.map((item) => ({
          ...item,
          SignaturePicture: item.SignaturePicture ? fullImageURL(item.SignaturePicture) : "",
        }));
        setBanks(items);
        setTotalRecords(items.length);
        return;
      }

      const res = await getBanksApi(page, limit);
      if (res?.status === 200) {
        const normalized = (res.data.records || []).map((item) => ({
          ...item,
          SignaturePicture: item.SignaturePicture ? fullImageURL(item.SignaturePicture) : "",
        }));
        setBanks(normalized);
        setTotalRecords(res.data.total);
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
      id: r.Id,                     // dropdown uses .id
      name: r.IncomeName            // dropdown uses .name
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
      res = await updateEmployeeApi(id, fd);   // ✅ UPDATE
    } else {
      res = await addEmployeeApi(fd);          // ✅ CREATE
    }

    if (res?.status === 201 || res?.status === 200) {
      toast.success(isEditMode ? "Employee updated" : "Employee created");
      navigate("/app/hr/employees");          // ✅ REDIRECT
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





  // ---------- helper to find label for selected id ----------
  const findLabel = (key, id) => {
    if (!id) return "";
    const map = {
      designation: designations,
      department: departments,
      country: countries,
      state: states,
      city: cities,
      region: regions,
      territory: territories,
      bank: banks,
      incomeType: incomeTypes,
      deductionType: deductionTypes,
      user: users,
    };
    const list = map[key] || [];
    const f = list.find((x) => {
      const candidateId = x.id ?? x.Id ?? x.regionId ?? x.territoryId ?? x.countryId ?? x.stateId ?? x.userId;
      return String(candidateId) === String(id);
    });
    if (key === "bank" && f) {
      return f.BankName || f.name || "";
    }
    if (key === "user" && f) {
      return f.username || f.name || f.email || "";
    }
    // return f ? (f.name || f.designation || f.department || f.regionName || f.territoryDescription) : "";
    return f
  ? (f.territoryDescription ||
     f.regionName ||
     f.name ||
     f.designation ||
     f.department)
  : "";

  };
  // ================================
  // PART 2: SearchableDropdown + Modal Components
  // ================================

  // ---------------- CustomDropdown (matches Locations pattern) ----------------
  const CustomDropdown = ({ label, keyName, list = [], valueId, required = false, onSelect, showStar = true, showPencil = true }) => {
    // Debug log
    // console.log(`Rendering Dropdown: ${label}, ValueId: ${valueId}`);
    const [inputValue, setInputValue] = useState(""); // Display text for trigger
    const [localSearch, setLocalSearch] = useState(""); // Search input text
    const [openUpward, setOpenUpward] = useState(false); // Track if dropdown should open upward
    const searchInputRef = useRef(null);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const isOpen = !!open[keyName];

    // Sync trigger text with selected value
    useEffect(() => {
      const labelText = findLabel(keyName, valueId);
      setInputValue(labelText || "");
    }, [valueId, keyName, label]);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen) {
        setLocalSearch(""); // Clear search on open
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }, [isOpen]);

    // Click outside to close
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          if (isOpen) setOpen((o) => ({ ...o, [keyName]: false }));
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, keyName]);

    const filtered = (list || []).filter((x) => {
      let labelText = "";
      if (keyName === "bank") {
        labelText = (x.BankName || x.name || "").toString().toLowerCase();
      } else if (keyName === "user") {
        labelText = (x.username || x.email || x.name || "").toString().toLowerCase();
      } else {
        labelText = (x.name || x.designation || x.department || x.regionName || x.territoryDescription || "").toString().toLowerCase();
      }
      return labelText.includes(localSearch.toLowerCase());
    });

    // Toggle dropdown with position calculation
    const toggleOpen = () => {
      const willBeOpen = !open[keyName];
      
      // Calculate position BEFORE opening to prevent flash
      if (willBeOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 192; // max-h-48 = 12rem = 192px
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Set position before opening
        setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
      }
      
      setOpen((o) => ({ ...o, [keyName]: !o[keyName] }));
    };


    return (
      <div className="w-full">
        <label className="text-sm block mb-1 text-gray-300">
          {label} {required && <span className="text-red-400"> *</span>}
        </label>

        <div className="flex items-start gap-2">
          <div className="relative w-full" ref={containerRef}>
            {/* Trigger Field */}
            <div
              onClick={toggleOpen}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm flex justify-between items-center cursor-pointer hover:border-gray-600 transition-colors"
            >
              <span className={inputValue ? "text-white" : "text-gray-500"}>
                {inputValue || "--select--"}
              </span>
              <div className="flex items-center gap-1">
                {/* Clear Button */}
                {inputValue && inputValue !== "--select--" && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(null);
                      setInputValue("");
                      setLocalSearch("");
                    }}
                    className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                    title="Clear"
                  >
                    <X size={14} className="text-gray-400 hover:text-red-400" />
                  </div>
                )}
                 {/* Chevron Icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
              <div 
                ref={dropdownRef}
                className={`absolute left-0 right-0 max-h-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 flex flex-col transition-all duration-150 ease-out ${
                  openUpward ? 'bottom-full mb-1 animate-slideUp' : 'mt-1 animate-slideDown'
                }`}
                style={{
                  animation: openUpward ? 'slideUp 150ms ease-out' : 'slideDown 150ms ease-out'
                }}
              >
                {/* Search Input */}
                <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                  <input
                    type="text"
                    ref={searchInputRef}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                  />
                </div>

                {/* Options List */}
                <div className="overflow-auto flex-1">
                  {filtered.length > 0 ? (
                    filtered.map((opt) => {
                      const optId = opt.id ?? opt.Id ?? opt.regionId ?? opt.territoryId ?? opt.countryId ?? opt.stateId ?? opt.userId;
                      let labelText = "";
                      if (keyName === "bank") {
                        labelText = opt.BankName ?? opt.name ?? opt.designation ?? opt.department ?? opt.regionName ?? opt.territoryDescription;
                      } else if (keyName === "user") {
                        labelText = opt.username ?? opt.email ?? opt.name ?? "";
                      } else {
                        labelText = opt.name ?? opt.designation ?? opt.department ?? opt.regionName ?? opt.territoryDescription;
                      }
                      return (
                        <div
                          key={String(optId) + (labelText || "")}
                          onClick={() => {
                            onSelect(opt);
                            setOpen((o) => ({ ...o, [keyName]: false }));
                            setLocalSearch("");
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-sm text-gray-200"
                        >
                          {labelText}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      <div className="mb-1">No matches found</div>
                      {showStar && (
                        <div className="text-xs text-gray-500">(Use star to create)</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-1">
            {showStar && (
              <button
                type="button"
                onClick={() => {
                  setLookupCreateContext({
                    key: keyName,
                    typedName: localSearch, // Pass current search text if any
                    callback: (created) => {
                      if (!created) return;
                      onSelect(created);
                    },
                  });
                  setShowLookupCreateModal(true);
                }}
                className="p-1 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                title={`Add ${label}`}
              >
                <Star size={16} className="text-yellow-400" />
              </button>
            )}

            {showPencil && valueId && keyName !== "bank" && (
              <button
                type="button"
                onClick={() => {
                  const item = (list || []).find((x) => String(x.id ?? x.Id ?? x.regionId ?? x.territoryId) === String(valueId));
                  setLookupCreateContext({
                    key: keyName,
                    item,
                    mode: "edit",
                    callback: (updated) => {
                      if (!updated) return;
                      onSelect(updated);
                    },
                  });
                  setShowLookupCreateModal(true);
                }}
                className="p-1 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                title={`Edit ${label}`}
              >
                <Pencil size={14} className="text-blue-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------------- LookupCreateModal (star/pencil flows) ----------------
  const LookupCreateModal = () => {
    const { key, callback, item, mode, typedName } = lookupCreateContext || {};
    const [name, setName] = useState(item?.name || item?.designation || item?.department || typedName || "");
    const [countryIdLocal, setCountryIdLocal] = useState(item?.countryId || form.countryId || "");
    const [stateIdLocal, setStateIdLocal] = useState(item?.stateId || form.stateId || "");

    const countryRefModal = useRef(null);
    const stateRefModal = useRef(null);
    const cityRefModal = useRef(null);

    const [countrySearchLocal, setCountrySearchLocal] = useState("");
    const [countryOpenLocal, setCountryOpenLocal] = useState(false);

    const [stateSearchLocal, setStateSearchLocal] = useState("");
    const [stateOpenLocal, setStateOpenLocal] = useState(false);

    const [citySearchLocal, setCitySearchLocal] = useState("");
    const [cityOpenLocal, setCityOpenLocal] = useState(false);

    useEffect(() => {
      if (lookupCreateContext.key) {
        setName(item?.name || item?.designation || item?.department || typedName || "");
        setCountryIdLocal(item?.countryId || form.countryId || "");
        setStateIdLocal(item?.stateId || form.stateId || "");
        setCountrySearchLocal("");
        setStateSearchLocal("");
        setCitySearchLocal("");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lookupCreateContext.key]);

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
           const res = await addRegionApi({
  name: name.trim(),
  userId: form.userId || 1
});
created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;

          } else if (key === "territory") {
            const res = await addTerritoryApi({ name: name.trim(), regionId: Number(lookupCreateContext.regionId || form.regionId), userId: form.userId || 1 });
            created = (res?.status === 200 || res?.status === 201) ? (res.data?.record || res.data) : null;
          } else {
            // fallback created
            created = { id: `t_${Date.now()}`, name: name.trim(), countryId: countryIdLocal || null, stateId: stateIdLocal || null, regionId: lookupCreateContext.regionId || null };
          }
        }

        if (!created) {
          created = { id: `t_${Date.now()}`, name: name.trim(), countryId: countryIdLocal || null, stateId: stateIdLocal || null, regionId: lookupCreateContext.regionId || null };
        }

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
        toast.success(`${mode === "edit" ? "Updated" : "Added"} ${key}`);
      } catch (err) {
        console.error("lookup create error:", err);
        toast.error("Save failed");
      }
    };

    const filteredCountriesModal = (countries || []).filter((c) =>
      String(c.name ?? "").toLowerCase().includes(countrySearchLocal.toLowerCase())
    );

    const filteredStatesModal = (states || [])
      .filter((s) => (countryIdLocal ? String(s.countryId) === String(countryIdLocal) : true))
      .filter((s) => String(s.name ?? "").toLowerCase().includes(stateSearchLocal.toLowerCase()));

    const filteredCitiesModal = (cities || [])
      .filter((c) => (stateIdLocal ? String(c.stateId) === String(stateIdLocal) : true))
      .filter((c) => String(c.name ?? "").toLowerCase().includes(citySearchLocal.toLowerCase()));

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[11000]">
        <div className="w-[520px] bg-gray-900 text-white rounded-lg border border-gray-700 shadow-xl relative z-[11001]">

          <div className="flex justify-between px-4 py-2 border-b border-gray-700 ">
            <h2 className="text-lg font-semibold">{(mode === "edit" ? "Edit" : "Create")} {key}</h2>
            <button onClick={() => setShowLookupCreateModal(false)} className="p-1"><X size={18} /></button>
          </div>

          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            {key === "country" && (
              <>
                <label className="text-sm">Country *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
              </>
            )}

            {key === "state" && (
              <>
                <label className="text-sm">Country *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={countryRefModal}>
                    <input
                      type="text"
                      value={countrySearchLocal || findLabel("country", countryIdLocal) || countrySearchLocal}
                      onChange={(e) => { setCountrySearchLocal(e.target.value); setCountryOpenLocal(true); }}
                      onFocus={() => setCountryOpenLocal(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    />

                    {countryOpenLocal && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredCountriesModal.length > 0 ? (
                          filteredCountriesModal.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setCountryIdLocal(c.id);
                                setCountryOpenLocal(false);
                                setCountrySearchLocal("");
                              }}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                              {c.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm">
                            <div className="mb-2 text-gray-300">No matches</div>
                            <button
                              onClick={() => {
                                setName(countrySearchLocal || "");
                              }}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Use "{countrySearchLocal}" as country name in this create
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <label className="text-sm">State *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
              </>
            )}

            {key === "city" && (
              <>
                <label className="text-sm">Country *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={countryRefModal}>
                    <input
                      type="text"
                      value={countrySearchLocal || findLabel("country", countryIdLocal) || countrySearchLocal}
                      onChange={(e) => { setCountrySearchLocal(e.target.value); setCountryOpenLocal(true); }}
                      onFocus={() => setCountryOpenLocal(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    />

                    {countryOpenLocal && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredCountriesModal.length > 0 ? (
                          filteredCountriesModal.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setCountryIdLocal(c.id);
                                setCountryOpenLocal(false);
                                setCountrySearchLocal("");
                                setStateIdLocal("");
                              }}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                              {c.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm">
                            <div className="mb-2 text-gray-300">No matches</div>
                            <button
                              onClick={() => setName(countrySearchLocal || "")}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Use "{countrySearchLocal}" as country name in this create
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <label className="text-sm">State *</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-full" ref={stateRefModal}>
                    <input
                      type="text"
                      value={stateSearchLocal || findLabel("state", stateIdLocal) || stateSearchLocal}
                      onChange={(e) => { setStateSearchLocal(e.target.value); setStateOpenLocal(true); }}
                      onFocus={() => setStateOpenLocal(true)}
                      placeholder="Search or type to create..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    />

                    {stateOpenLocal && (
                      <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                        {filteredStatesModal.length > 0 ? (
                          filteredStatesModal.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => { setStateIdLocal(s.id); setStateOpenLocal(false); setStateSearchLocal(""); }}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                              {s.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm">
                            <div className="mb-2 text-gray-300">No matches</div>
                            <button
                              onClick={() => setName(stateSearchLocal || "")}
                              className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                            >
                              Use "{stateSearchLocal}" as state name in this create
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <label className="text-sm">City *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
              </>
            )}

              {key === "region" && (
          <>
            <label className="text-sm">Region Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm"
            />
          </>
        )}


            {key === "territory" && (
              <>
                <SearchableDropdown
                  label="Region"
                  keyName="region"
                  list={regions}
                  valueId={lookupCreateContext?.regionId || form.regionId || ""}
                  onSelect={(opt) => setLookupCreateContext((p) => ({ ...p, regionId: opt.regionId ?? opt.id }))}
                />

                <label className="text-sm">Territory *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
              </>
            )}

            {["designation", "department", "incomeType", "deductionType", "bank"].includes(key) && (
              <>
                <label className="text-sm">{key === "incomeType" ? "Income Name" : key === "deductionType" ? "Deduction Name" : (key === "bank" ? "Bank Name" : "Name")} *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
              </>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-700 flex justify-end gap-2">
            <button onClick={() => setShowLookupCreateModal(false)} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">Cancel</button>
            <button onClick={save} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-blue-300 text-sm"><Save size={14} /> Save</button>
          </div>

          {/* <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 rounded text-white"
          >
            {isEditMode ? "Update Employee" : "Save Employee"}
          </button>

          {isEditMode && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 rounded text-white"
            >
              Delete Employee
            </button>
          )}
        </div> */}

        </div>
      </div>
    );
  };

  // ---------------- Income modal ----------------
  const IncomeModal = () => {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[10400]">
        <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
          <div className="flex justify-between px-4 py-2 border-b border-gray-700">
            <h2 className="text-lg font-semibold">
              {editingIncomeId ? "Edit Income" : "Add Income"}
            </h2>
            <button onClick={() => setShowIncomeModal(false)} className="p-1">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* INCOME TYPE DROPDOWN */}
            <div>
              <CustomDropdown
                label="Income"
                keyName="incomeType"
                list={incomeTypes}
                valueId={incomeForm.typeId}
                required={true}
                onSelect={(item) => setIncomeForm({ ...incomeForm, typeId: item?.id || "" })}
              showStar={!isEditMode}
                showPencil={false}
              />
            </div>

            {/* AMOUNT + DESCRIPTION */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm">Amount *</label>
                <input
                  type="number"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm">Description</label>
                <input
                  type="text"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowIncomeModal(false)}
                className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!incomeForm.typeId) return toast.error("Income required");
                  if (!incomeForm.amount || Number.isNaN(Number(incomeForm.amount)))
                    return toast.error("Valid amount required");

                  if (editingIncomeId) {
                    setIncomes((prev) =>
                      prev.map((r) =>
                        r.id === editingIncomeId
                          ? {
                              ...r,
                              ...incomeForm,
                              typeName: findLabel("incomeType", incomeForm.typeId),
                            }
                          : r
                      )
                    );
                    toast.success("Income updated");
                  } else {
                    setIncomes((prev) => [
                      {
                        id: `i_${Date.now()}`,
                        ...incomeForm,
                        typeName: findLabel("incomeType", incomeForm.typeId),
                      },
                      ...prev,
                    ]);
                    toast.success("Income added");
                  }

                  setShowIncomeModal(false);
                  setEditingIncomeId(null);
                }}
                className="w-[100px] h-[40px] gap-2 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-blue-300 text-sm flex items-center justify-center"
              >
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------- Deduction modal (unchanged behavior, kept local dropdown) ----------------
  const DeductionModal = () => {
    const [deductionDDOpen, setDeductionDDOpen] = useState(false);
    const [deductionDDSearch, setDeductionDDSearch] = useState("");
    const deductionRef = useRef(null);

    // Close dropdown ONLY when clicking outside modal
    useEffect(() => {
      const handler = (e) => {
        if (!deductionRef.current) return;
        if (!deductionRef.current.contains(e.target)) {
          setDeductionDDOpen(false);
        }
      };

      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    // close deduction dropdown when lookup modal opens to avoid stacking issues
    useEffect(() => {
      if (showLookupCreateModal) {
        setDeductionDDOpen(false);
      }
    }, [showLookupCreateModal]);






    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[10400]">
        <div ref={deductionRef} className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
          <div className="flex justify-between px-4 py-2 border-b border-gray-700">
            <h2 className="text-lg font-semibold">
              {editingDeductionId ? "Edit Deduction" : "Add Deduction"}
            </h2>
            <button onClick={() => setShowDeductionModal(false)} className="p-1">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-3">

            {/* TYPE DROPDOWN */}
            <div>
              <CustomDropdown
                label="Deduction"
                keyName="deductionType"
                list={deductionTypes}
                valueId={deductionForm.typeId}
                required={true}
                onSelect={(item) => setDeductionForm({ ...deductionForm, typeId: item?.id || "" })}
               showStar={!isEditMode}

                showPencil={false}
              />
            </div>

            {/* AMOUNT & DESCRIPTION */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm">Amount *</label>
                <input
                  type="number"
                  value={deductionForm.amount}
                  onChange={(e) =>
                    setDeductionForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm">Description</label>
                <input
                  type="text"
                  value={deductionForm.description}
                  onChange={(e) =>
                    setDeductionForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeductionModal(false)}
                className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!deductionForm.typeId)
                    return toast.error("Deduction required");
                  if (!deductionForm.amount || Number.isNaN(Number(deductionForm.amount)))
                    return toast.error("Valid amount required");

                  if (editingDeductionId) {
                    setDeductions((prev) =>
                      prev.map((r) =>
                        r.id === editingDeductionId
                          ? {
                              ...r,
                              ...deductionForm,
                              typeName: findLabel("deductionType", deductionForm.typeId),
                            }
                          : r
                      )
                    );
                    toast.success("Deduction updated");
                  } else {
                    setDeductions((prev) => [
                      {
                        id: `d_${Date.now()}`,
                        ...deductionForm,
                        typeName: findLabel("deductionType", deductionForm.typeId),
                      },
                      ...prev,
                    ]);
                    toast.success("Deduction added");
                  }

                  setShowDeductionModal(false);
                  setEditingDeductionId(null);
                }}
                className="w-[100px] h-[40px] gap-2 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-blue-300 text-sm flex items-center justify-center">
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



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

  // PART 3 — Final JSX UI (main page)
  return (
    <>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-110px)] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
           <h2 className="text-2xl font-semibold">
            {isEditMode ? "Edit Employee" : "New Employee"}
          </h2>

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
                <div className="grid grid-cols-2 gap-4">
                  {/* left */}
                  <div className="space-y-3 ms-3">
                    <div>
                      <label className="text-sm">First Name *</label>
                      <input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
                    </div>

                   {/* DESIGNATION */}
                    <div>
                      <CustomDropdown
                        label="Designation"
                        keyName="designation"
                        list={designations}
                        valueId={form.designationId}
                        required={true}
                        onSelect={(item) => setForm({ ...form, designationId: item?.id || "" })}
                       showStar={!isEditMode}

                        showPencil={isEditMode}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Rate Type</label>
                      <select value={form.rateType} onChange={(e) => setForm(p => ({ ...p, rateType: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm">
                        <option value="">--select--</option>
                        <option value="hourly">Hourly</option>
                        <option value="salary">Salary</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm">Hour Rate / Salary</label>
                      <input value={form.hourlyRate} onChange={(e) => setForm(p => ({ ...p, hourlyRate: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
                    </div>

                    <div>
                      <label className="text-sm">Blood Group</label>
                      <select value={form.bloodGroup} onChange={(e) => setForm(p => ({ ...p, bloodGroup: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm">
                        <option value="">--select--</option>
                        {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* right */}
                  <div className="space-y-3 me-3 ">
                    <div>
                      <label className="text-sm">Last Name *</label>
                      <input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
                    </div>

                    {/* DEPARTMENT */}
                    <div>
                      <CustomDropdown
                        label="Department"
                        keyName="department" 
                        list={departments}
                        valueId={form.departmentId}
                        required={true}
                        onSelect={(item) => setForm({ ...form, departmentId: item?.id || "" })}
                      showStar={!isEditMode}

                        showPencil={true}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Phone</label>
                      <input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
                    </div>

                    <div>
                      <label className="text-sm">Email</label>
                      <input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
                    </div>

                    <div>
                      <label className="text-sm">Picture</label>
                      <div className="mt-2">
                        <div className="border-dashed border-2 border-gray-700 rounded p-2 bg-gray-900 flex items-center gap-3">
                 <div className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded overflow-hidden">
                     {form.picturePreview ? (
                    <img
                      src={form.picturePreview}   // ✅ USE DIRECT VALUE
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-gray-400" />
                  )}

                  </div>



                          <div className="flex-1">
                            {/* Hidden file info - shown as tooltip on the Select Image button */}
                            <div className="flex gap-2">
                              <label
                                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded cursor-pointer text-sm"
                                title={form.pictureFile ? form.pictureFile.name : form.picturePreview ? 'Current image' : 'No image selected'}
                              >
                                Select Image
                                <input type="file" accept="image/*" onChange={(e) => handlePictureChange(e.target.files?.[0])} className="hidden" />
                              </label>
                              {form.picturePreview && (
                                <button onClick={removePicture} className="px-3 py-1 bg-gray-800 border border-red-700 rounded text-red-400 text-sm"><Trash2 size={14} /> Remove</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* full width address */}
                  <div className="col-span-2 ms-3 me-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Country */}
                      <div>
                        <CustomDropdown
                          label="Country"
                          keyName="country"
                          list={countries}
                          valueId={form.countryId}
                          required={true}
                          onSelect={(item) => {
                            setForm({ ...form, countryId: item?.id || "" });
                            if (item?.id) awaitLoadStatesForCountry(item.id);
                          }}
                        showStar={!isEditMode}

                          showPencil={true}
                        />
                      </div>

                      {/* State */}
                      <div>
                        <CustomDropdown
                          label="State"
                          keyName="state"
                          list={states.filter(s => (form.countryId ? String(s.countryId) === String(form.countryId) : true))}
                          valueId={form.stateId}
                          required={true}
                          onSelect={(item) => {
                            setForm({ ...form, stateId: item?.id || "" });
                            if (item?.id) awaitLoadCitiesForState(item.id);
                          }}
                         showStar={!isEditMode}

                          showPencil={true}
                        />
                      </div>

                      {/* City */}
                      <div>
                        <CustomDropdown
                          label="City"
                          keyName="city"
                          list={cities.filter(c => (form.stateId ? String(c.stateId) === String(form.stateId) : true))}
                          valueId={form.cityId}
                          required={true}
                          onSelect={(item) => setForm({ ...form, cityId: item?.id || "" })}
                         showStar={!isEditMode}

                          showPencil={true}
                        />
                      </div>

                      {/* Region */}
                      <div>
                        <CustomDropdown
                          label="Region"
                          keyName="region"
                          list={regions}
                          valueId={form.regionId}
                          required={false}
                          onSelect={(item) => {
                            setForm({ ...form, regionId: item?.regionId ?? item?.id ?? "" });
                            if (item) awaitLoadTerritoriesForRegion(item.regionId ?? item.id);
                          }}
                         showStar={!isEditMode}
                          showPencil={true}
                        />
                      </div>
                      
                        <div className="flex-1">
                          <CustomDropdown
                            label="User"
                            keyName="user"
                            list={users}
                            valueId={form.userId}
                            required={false}
                            onSelect={(item) => setForm({ ...form, userId: item?.userId || item?.id || "" })}
                            showStar={false}
                            showPencil={false}
                          />
                        </div>

                      {/* Territory */}
                      <div>
                        <CustomDropdown
                          label="Territory"
                          keyName="territory"
                          list={territories}
                          valueId={form.territoryId}
                          required={false}
                          onSelect={(item) => setForm({ ...form, territoryId: item?.id || "" })}
                         showStar={!isEditMode}

                          showPencil={true}
                        />
                      </div>

                      <div className="col-span-2 flex gap-3">
                        <div className="flex-1">
                          <label className="text-sm">Address</label>
                          <input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
                        </div>

                        <div className="flex-1">
                          <label className="text-sm">Zip Code</label>
                          <input value={form.zipCode} onChange={(e) => setForm(p => ({ ...p, zipCode: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
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
                      <label className="text-sm">Basic Salary *</label>
                      <input value={form.salary} onChange={(e) => setForm(p => ({ ...p, salary: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm  h-[38px]" />
                    </div>

                    {/* Payroll Bank */}
                    <div>
                      <CustomDropdown
                        label="Payroll Bank"
                        keyName="bank"
                        list={banks}
                        valueId={form.payrollBankId}
                        required={true}
                        onSelect={(item) => setForm({ ...form, payrollBankId: item?.id ?? item?.Id ?? "" })}
                        showStar={false}
                        showPencil={false}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Bank Account *</label>
                      <input value={form.payrollBankAccount} onChange={(e) => setForm(p => ({ ...p, payrollBankAccount: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm h-[38px]" />
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
      {showIncomeModal && <Portal><IncomeModal /></Portal>}
      {showDeductionModal && <Portal><DeductionModal /></Portal>}
      {showLookupCreateModal && <Portal><LookupCreateModal /></Portal>}
    </>
  );
};

export default NewEmployee;
