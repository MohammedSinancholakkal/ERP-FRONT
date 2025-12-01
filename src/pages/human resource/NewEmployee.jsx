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
  addCountryApi,
  addStateApi,
  addCityApi,
  addRegionApi,
  addTerritoryApi,
  addEmployeeApi,
} from "../../services/allAPI";

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

const fullImageURL = (path) => (path ? `${path}` : "");

const NewEmployee = () => {
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

        const inc = await getIncomesApi(1, 5000);
        setIncomeTypes(parseArrayFromResponse(inc));

        const ded = await getDeductionsApi(1, 5000);
        setDeductionTypes(parseArrayFromResponse(ded));
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
      name: r.Name           // API key → dropdown key
    }));

    setDeductionTypes(normalized);
  } catch (err) {
    console.log("Deduction types load error:", err);
    setDeductionTypes([]);
  }
};


  // ---------- cascade helpers ----------
  const awaitLoadStatesForCountry = async (countryId) => {
    await loadStates(countryId);
    setForm((p) => ({ ...p, stateId: "", cityId: "", regionId: "", territoryId: "" }));
    setCities([]);
    setRegions([]);
    setTerritories([]);
  };

  const awaitLoadCitiesForState = async (stateId) => {
    await loadCities(stateId);
    await loadRegions(stateId);
    setForm((p) => ({ ...p, cityId: "", regionId: "", territoryId: "" }));
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

      const res = await addEmployeeApi(fd);

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Employee saved");
      } else {
        toast.error(res?.data?.message || "Save failed");
      }
    } catch (err) {
      console.error("submitEmployee error", err);
      toast.error("Server error");
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
    };
    const list = map[key] || [];
    const f = list.find((x) => {
      const candidateId = x.id ?? x.Id ?? x.regionId ?? x.territoryId ?? x.countryId ?? x.stateId;
      return String(candidateId) === String(id);
    });
    if (key === "bank" && f) {
      return f.BankName || f.name || "";
    }
    return f ? (f.name || f.designation || f.department || f.regionName || f.territoryDescription) : "";
  };
  // ================================
  // PART 2: SearchableDropdown + Modal Components
  // ================================

  // ---------------- SearchableDropdown (matches Locations pattern) ----------------
  const SearchableDropdown = ({ label, keyName, list = [], valueId, required = false, onSelect, showStar = true, showPencil = true }) => {
    const [inputValue, setInputValue] = useState("");
    const [localSearch, setLocalSearch] = useState("");
    const inputRef = useRef(null);
    const isOpen = !!open[keyName];

    useEffect(() => {
      if (isOpen) {
        setInputValue(localSearch || "");
      } else {
        const labelText = findLabel(keyName, valueId);
        setInputValue(labelText || "");
        if (localSearch) setLocalSearch("");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, valueId, keyName]);

    const filtered = (list || []).filter((x) => {
      let labelText = "";
      if (keyName === "bank") {
        labelText = (x.BankName || x.name || "").toString().toLowerCase();
      } else {
        labelText = (x.name || x.designation || x.department || x.regionName || x.territoryDescription || "").toString().toLowerCase();
      }
      return labelText.includes((localSearch || inputValue || "").toLowerCase());
    });

    return (
      <div className="w-full">
        <label className="text-sm block mb-1">
          {label} {required && <span className="text-red-400"> *</span>}
        </label>

        <div className="flex items-start gap-2">
          <div
            className="relative w-full"
            ref={refs[keyName]}
            onClick={() => {
              setOpen((o) => ({ ...o, [keyName]: true }));
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <input
              type="text"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setLocalSearch(e.target.value);
                setOpen((o) => ({ ...o, [keyName]: true }));
              }}
              onFocus={() => setOpen((o) => ({ ...o, [keyName]: true }))}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />

            {open[keyName] && (
              <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto bg-gray-800 border border-gray-700 rounded z-50 text-sm">
                {filtered.length > 0 ? (
                  filtered.map((opt) => {
                    const optId = opt.id ?? opt.Id ?? opt.regionId ?? opt.territoryId ?? opt.countryId ?? opt.stateId;
                    let labelText = "";
                    if (keyName === "bank") {
                      labelText = opt.BankName ?? opt.name ?? opt.designation ?? opt.department ?? opt.regionName ?? opt.territoryDescription;
                    } else {
                      labelText = opt.name ?? opt.designation ?? opt.department ?? opt.regionName ?? opt.territoryDescription;
                    }
                    return (
                      <div
                        key={String(optId) + (labelText || "")}
                        onClick={() => {
                          onSelect(opt);
                          setOpen((o) => ({ ...o, [keyName]: false }));
                          setInputValue(labelText || "");
                          setLocalSearch("");
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                      >
                        {labelText}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm">
                    <div className="mb-1 text-gray-300">No matches</div>
                    {showStar && (
                      <div className="text-xs text-gray-400">No results. (creation allowed via star)</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {showStar && (
              <button
                type="button"
                onClick={() => {
                  setLookupCreateContext({
                    key: keyName,
                    typedName: "",
                    callback: (created) => {
                      if (!created) return;
                      onSelect(created);
                      setInputValue(created.name || created.designation || "");
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
                      setInputValue(updated.name || updated.designation || updated.BankName || "");
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
        </div>
      </div>
    );
  };

  // ---------------- Income modal ----------------
  const IncomeModal = () => {
    const [incomeDDOpen, setIncomeDDOpen] = useState(false);
    const [incomeDDSearch, setIncomeDDSearch] = useState("");
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    // Dropdown position state (fixed)
    const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0, width: 0 });

    // compute and set dropdown position based on inputRef
    const computeDropdownPos = () => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownPos({
        left: Math.max(8, rect.left), // keep small margin from viewport edge
        top: rect.bottom + 6,
        width: rect.width,
      });
    };

    // Open dropdown and compute position
    const openIncomeDropdown = () => {
      setIncomeDDOpen(true);
      // compute after next paint
      requestAnimationFrame(() => computeDropdownPos());
    };

    // close on outside click (detect clicks outside the modal or outside the dropdown)
    useEffect(() => {
      const handler = (e) => {
        // if click inside modalRef => do nothing (we want clicks in modal to keep it open)
        if (modalRef.current && modalRef.current.contains(e.target)) return;
        // clicked outside modal => close dropdown
        setIncomeDDOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    // reposition on scroll/resize
    useEffect(() => {
      const onScroll = () => {
        if (!incomeDDOpen) return;
        computeDropdownPos();
      };
      const onResize = () => {
        if (!incomeDDOpen) return;
        computeDropdownPos();
      };
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onResize);
      };
    }, [incomeDDOpen]);

    // close dropdown when LookupCreateModal opens
    useEffect(() => {
      if (showLookupCreateModal) {
        setIncomeDDOpen(false);
      }
    }, [showLookupCreateModal]);

    // close dropdown on Escape
    useEffect(() => {
      const onKey = (e) => {
        if (e.key === "Escape") {
          setIncomeDDOpen(false);
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[10400]">
        <div ref={modalRef} className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
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
              <label className="text-sm">Income *</label>

              <div className="flex items-center gap-2 mt-1">
                <div className="relative w-full">

                  {/* Input field */}
                  <input
                    id="income-dropdown-input"
                    ref={inputRef}
                    type="text"
                    placeholder="Search income type..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                    value={incomeDDOpen ? incomeDDSearch : findLabel("incomeType", incomeForm.typeId) || ""}
                    onChange={(e) => {
                      setIncomeDDSearch(e.target.value);
                      openIncomeDropdown();
                    }}
                    onFocus={openIncomeDropdown}
                    autoComplete="off"
                  />

                  {/* Fixed-position dropdown so it doesn't affect modal/layout */}
                  {incomeDDOpen && (
                    <div
                      className="fixed bg-gray-800 border border-gray-700 rounded max-h-48 overflow-auto z-[12000] text-sm shadow-lg"
                      style={{
                        left: dropdownPos.left,
                        top: dropdownPos.top,
                        width: dropdownPos.width,
                      }}
                    >
                      {incomeTypes
                        .filter((i) =>
                          (i.name || "").toLowerCase().includes(incomeDDSearch.toLowerCase())
                        )
                        .map((i) => (
                          <div
                            key={i.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                            onClick={() => {
                              setIncomeForm((p) => ({ ...p, typeId: i.id }));
                              setIncomeDDSearch("");
                              setIncomeDDOpen(false);
                              // return focus to input so label shows correctly if needed
                              inputRef.current?.focus();
                            }}
                          >
                            {i.name}
                          </div>
                        ))}

                      {incomeTypes.filter((i) =>
                        (i.name || "").toLowerCase().includes(incomeDDSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-300">No matches</div>
                      )}
                    </div>
                  )}
                </div>

                {/* STAR BUTTON */}
                <button
                  type="button"
                  className="flex-shrink-0 p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                  onClick={() => {
                    setLookupCreateContext({
                      key: "incomeType",
                      typedName: incomeDDSearch,
                      callback: (created) => {
                        if (!created) return;
                        setIncomeForm((p) => ({ ...p, typeId: created.id }));
                        setIncomeDDSearch("");
                      },
                    });
                    setShowLookupCreateModal(true);
                  }}
                  title="Create new income type"
                >
                  <Star size={18} className="text-yellow-400" />
                </button>
              </div>
            </div>

            {/* AMOUNT + DESCRIPTION */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm">Amount *</label>
                <input
                  type="number"
                  value={incomeForm.amount}
                  onChange={(e) =>
                    setIncomeForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm">Description</label>
                <input
                  type="text"
                  value={incomeForm.description}
                  onChange={(e) =>
                    setIncomeForm((p) => ({ ...p, description: e.target.value }))
                  }
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
              <label className="text-sm">Deduction *</label>

              <div className="flex items-center gap-2 mt-1">
                <div className="relative w-full">

                  <input
                    type="text"
                    placeholder="Search deduction type..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                    value={
                      deductionDDOpen
                        ? deductionDDSearch
                        : findLabel("deductionType", deductionForm.typeId) || ""
                    }
                    onChange={(e) => {
                      setDeductionDDSearch(e.target.value);
                      setDeductionDDOpen(true);
                    }}
                    onFocus={() => setDeductionDDOpen(true)}
                  />

                  {deductionDDOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-gray-800 border border-gray-700 rounded z-50 text-sm">
                      {deductionTypes
                        .filter((i) =>
                          (i.name || "")
                            .toLowerCase()
                            .includes(deductionDDSearch.toLowerCase())
                        )
                        .map((i) => (
                          <div
                            key={i.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-700"
                            onClick={() => {
                              setDeductionForm((p) => ({ ...p, typeId: i.id }));
                              setDeductionDDSearch("");
                              setDeductionDDOpen(false);
                            }}
                          >
                            {i.name}
                          </div>
                        ))}

                      {deductionTypes.filter((i) =>
                        (i.name || "")
                          .toLowerCase()
                          .includes(deductionDDSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-300">No matches</div>
                      )}
                    </div>
                  )}
                </div>

                {/* STAR BUTTON */}
                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                  onClick={() => {
                    setLookupCreateContext({
                      key: "deductionType",
                      typedName: deductionDDSearch,
                      callback: (created) => {
                        if (!created) return;
                        setDeductionForm((p) => ({ ...p, typeId: created.id }));
                        setDeductionDDSearch("");
                      },
                    });
                    setShowLookupCreateModal(true);
                  }}
                  title="Create new deduction type"
                >
                  <Star size={18} className="text-yellow-400" />
                </button>
              </div>
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
  // PART 3 — Final JSX UI (main page)
  return (
    <>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-110px)] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-semibold">New Employee</h2>
            <div>
              <button onClick={submitEmployee} className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded text-blue-300">
                <Save size={16} /> Save
              </button>
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
                      <label className="text-sm">Designation *</label>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-full" ref={refs.designation}>
                          <input
                            type="text"
                            value={search.designation || findLabel("designation", form.designationId) || ""}
                            onChange={(e) => {
                              setSearch((s) => ({ ...s, designation: e.target.value }));
                              setOpen((o) => ({ ...o, designation: true }));
                            }}
                            onFocus={() => setOpen((o) => ({ ...o, designation: true }))}
                            placeholder="Search designation..."
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                          />

                          {open.designation && (
                            <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                              {designations
                                .filter((d) =>
                                  String(d.designation ?? d.name ?? "")
                                    .toLowerCase()
                                    .includes((search.designation || "").toLowerCase())
                                )
                                .map((d) => (
                                  <div
                                    key={d.id}
                                    onClick={() => {
                                      setForm((p) => ({ ...p, designationId: d.id }));
                                      setSearch((s) => ({ ...s, designation: "" }));
                                      setOpen((o) => ({ ...o, designation: false }));
                                    }}
                                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                                  >
                                    {d.designation ?? d.name}
                                  </div>
                                ))}

                              {designations.filter((d) =>
                                String(d.designation ?? d.name ?? "")
                                  .toLowerCase()
                                  .includes((search.designation || "").toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-gray-400">No matches</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
                      <label className="text-sm">Department *</label>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-full" ref={refs.department}>
                          <input
                            type="text"
                            value={search.department || findLabel("department", form.departmentId) || ""}
                            onChange={(e) => {
                              setSearch((s) => ({ ...s, department: e.target.value }));
                              setOpen((o) => ({ ...o, department: true }));
                            }}
                            onFocus={() => setOpen((o) => ({ ...o, department: true }))}
                            placeholder="Search department..."
                            className="w-full bg-gray-900 border border-gray-100 rounded px-3 py-2 text-sm"
                          />

                          {open.department && (
                            <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                              {departments
                                .filter((d) =>
                                  String(d.department ?? d.name ?? "")
                                    .toLowerCase()
                                    .includes((search.department || "").toLowerCase())
                                )
                                .map((d) => (
                                  <div
                                    key={d.id}
                                    onClick={() => {
                                      setForm((p) => ({ ...p, departmentId: d.id }));
                                      setSearch((s) => ({ ...s, department: "" }));
                                      setOpen((o) => ({ ...o, department: false }));
                                    }}
                                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                                  >
                                    {d.department ?? d.name}
                                  </div>
                                ))}

                              {departments.filter((d) =>
                                String(d.department ?? d.name ?? "")
                                  .toLowerCase()
                                  .includes((search.department || "").toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-gray-400">No matches</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
                            {form.picturePreview ? <img src={form.picturePreview} alt="preview" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-400" />}
                          </div>

                          <div className="flex-1">
                            <div className="text-sm text-gray-300 mb-1">{form.pictureFile ? form.pictureFile.name : "No image selected"}</div>
                            <div className="flex gap-2">
                              <label className="px-3 py-1 bg-gray-800 border border-gray-700 rounded cursor-pointer text-sm">
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
                        <label className="text-sm">Country *</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative w-full" ref={refs.country}>
                            <input
                              type="text"
                              value={search.country || findLabel("country", form.countryId) || search.country}
                              onChange={(e) => { setSearch((s) => ({ ...s, country: e.target.value })); setOpen((o) => ({ ...o, country: true })); }}
                              onFocus={() => setOpen((o) => ({ ...o, country: true }))}
                              placeholder="Search or type to create..."
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                            />

                            {open.country && (
                              <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                                {countries.filter(c => String(c.name ?? "").toLowerCase().includes((search.country || "").toLowerCase())).length > 0 ? (
                                  countries.filter(c => String(c.name ?? "").toLowerCase().includes((search.country || "").toLowerCase())).map((c) => (
                                    <div
                                      key={c.id}
                                      onClick={() => {
                                        setForm((p) => ({ ...p, countryId: c.id }));
                                        setOpen((o) => ({ ...o, country: false }));
                                        setSearch((s) => ({ ...s, country: "" }));
                                        awaitLoadStatesForCountry(c.id);
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
                                        setLookupCreateContext({
                                          key: "country",
                                          typedName: search.country || "",
                                          callback: (created) => {
                                            if (!created) return;
                                            setForm((p) => ({ ...p, countryId: created.id }));
                                            setOpen((o) => ({ ...o, country: false }));
                                            setSearch((s) => ({ ...s, country: "" }));
                                            awaitLoadStatesForCountry(created.id);
                                          },
                                        });
                                        setShowLookupCreateModal(true);
                                      }}
                                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                                    >
                                      Create new "{search.country}" (open modal)
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                            onClick={() => {
                              setLookupCreateContext({
                                key: "country",
                                typedName: "",
                                callback: (created) => {
                                  if (!created) return;
                                  setForm((p) => ({ ...p, countryId: created.id }));
                                  setSearch((s) => ({ ...s, country: "" }));
                                  awaitLoadStatesForCountry(created.id);
                                },
                              });
                              setShowLookupCreateModal(true);
                            }}
                          >
                            <Star size={18} className="text-yellow-400" />
                          </button>
                        </div>
                      </div>

                      {/* State */}
                      <div>
                        <label className="text-sm">State *</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative w-full" ref={refs.state}>
                            <input
                              type="text"
                              value={search.state || findLabel("state", form.stateId) || search.state}
                              onChange={(e) => { setSearch((s) => ({ ...s, state: e.target.value })); setOpen((o) => ({ ...o, state: true })); }}
                              onFocus={() => setOpen((o) => ({ ...o, state: true }))}
                              placeholder="Search or type to create..."
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                            />

                            {open.state && (
                              <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                                {states.filter(s => (form.countryId ? String(s.countryId) === String(form.countryId) : true)).filter(s => String(s.name ?? "").toLowerCase().includes((search.state || "").toLowerCase())).length > 0 ? (
                                  states.filter(s => (form.countryId ? String(s.countryId) === String(form.countryId) : true)).filter(s => String(s.name ?? "").toLowerCase().includes((search.state || "").toLowerCase())).map((s) => (
                                    <div
                                      key={s.id}
                                      onClick={() => {
                                        setForm((p) => ({ ...p, stateId: s.id }));
                                        setOpen((o) => ({ ...o, state: false }));
                                        setSearch((s) => ({ ...s, state: "" }));
                                        awaitLoadCitiesForState(s.id);
                                      }}
                                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                                    >
                                      {s.name}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm">
                                    <div className="mb-2 text-gray-300">No matches</div>
                                    <button
                                      onClick={() => {
                                        setLookupCreateContext({
                                          key: "state",
                                          typedName: search.state || "",
                                          callback: (created) => {
                                            if (!created) return;
                                            setForm((p) => ({ ...p, stateId: created.id }));
                                            setOpen((o) => ({ ...o, state: false }));
                                            setSearch((s) => ({ ...s, state: "" }));
                                            awaitLoadCitiesForState(created.id);
                                          },
                                        });
                                        setShowLookupCreateModal(true);
                                      }}
                                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                                    >
                                      Create new "{search.state}" (open modal)
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                            onClick={() => {
                              setLookupCreateContext({
                                key: "state",
                                typedName: "",
                                callback: (created) => {
                                  if (!created) return;
                                  setForm((p) => ({ ...p, stateId: created.id }));
                                  setSearch((s) => ({ ...s, state: "" }));
                                  awaitLoadCitiesForState(created.id);
                                },
                              });
                              setShowLookupCreateModal(true);
                            }}
                          >
                            <Star size={18} className="text-yellow-400" />
                          </button>
                        </div>
                      </div>

                      {/* City */}
                      <div>
                        <label className="text-sm">City *</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative w-full" ref={refs.city}>
                            <input
                              type="text"
                              value={search.city || findLabel("city", form.cityId) || search.city}
                              onChange={(e) => { setSearch((s) => ({ ...s, city: e.target.value })); setOpen((o) => ({ ...o, city: true })); }}
                              onFocus={() => setOpen((o) => ({ ...o, city: true }))}
                              placeholder="Search or type to create..."
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                            />

                            {open.city && (
                              <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                                {cities.filter(c => (form.stateId ? String(c.stateId) === String(form.stateId) : true)).filter(c => String(c.name ?? "").toLowerCase().includes((search.city || "").toLowerCase())).length > 0 ? (
                                  cities.filter(c => (form.stateId ? String(c.stateId) === String(form.stateId) : true)).filter(c => String(c.name ?? "").toLowerCase().includes((search.city || "").toLowerCase())).map((c) => (
                                    <div
                                      key={c.id}
                                      onClick={() => {
                                        setForm((p) => ({ ...p, cityId: c.id }));
                                        setOpen((o) => ({ ...o, city: false }));
                                        setSearch((s) => ({ ...s, city: "" }));
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
                                        setLookupCreateContext({
                                          key: "city",
                                          typedName: search.city || "",
                                          callback: (created) => {
                                            if (!created) return;
                                            setForm((p) => ({ ...p, cityId: created.id }));
                                            setOpen((o) => ({ ...o, city: false }));
                                            setSearch((s) => ({ ...s, city: "" }));
                                          },
                                        });
                                        setShowLookupCreateModal(true);
                                      }}
                                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                                    >
                                      Create new "{search.city}" (open modal)
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                            onClick={() => {
                              setLookupCreateContext({
                                key: "city",
                                typedName: "",
                                callback: (created) => {
                                  if (!created) return;
                                  setForm((p) => ({ ...p, cityId: created.id }));
                                  setSearch((s) => ({ ...s, city: "" }));
                                },
                              });
                              setShowLookupCreateModal(true);
                            }}
                          >
                            <Star size={18} className="text-yellow-400" />
                          </button>
                        </div>
                      </div>

                      {/* Region */}
                      <div>
                        <label className="text-sm">Region</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative w-full" ref={refs.region}>
                            <input
                              type="text"
                              value={search.region || findLabel("region", form.regionId) || search.region}
                              onChange={(e) => { setSearch((s) => ({ ...s, region: e.target.value })); setOpen((o) => ({ ...o, region: true })); }}
                              onFocus={() => setOpen((o) => ({ ...o, region: true }))}
                              placeholder="Search or type to create..."
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                            />

                            {open.region && (
                              <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                                {regions.filter(r => String(r.regionName ?? r.name ?? "").toLowerCase().includes((search.region || "").toLowerCase())).length > 0 ? (
                                  regions.filter(r => String(r.regionName ?? r.name ?? "").toLowerCase().includes((search.region || "").toLowerCase())).map((r) => (
                                    <div
                                      key={r.regionId ?? r.id}
                                      onClick={() => {
                                        setForm((p) => ({ ...p, regionId: r.regionId ?? r.id }));
                                        setOpen((o) => ({ ...o, region: false }));
                                        setSearch((s) => ({ ...s, region: "" }));
                                        awaitLoadTerritoriesForRegion(r.regionId ?? r.id);
                                      }}
                                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                                    >
                                      {r.regionName ?? r.name}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm">
                                    <div className="mb-2 text-gray-300">No matches</div>
                                    <button
                                      onClick={() => {
                                        setLookupCreateContext({
                                          key: "region",
                                          typedName: search.region || "",
                                          callback: (created) => {
                                            if (!created) return;
                                            setForm((p) => ({ ...p, regionId: created.regionId ?? created.id }));
                                            setOpen((o) => ({ ...o, region: false }));
                                            setSearch((s) => ({ ...s, region: "" }));
                                            awaitLoadTerritoriesForRegion(created.regionId ?? created.id);
                                          },
                                        });
                                        setShowLookupCreateModal(true);
                                      }}
                                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                                    >
                                      Create new "{search.region}" (open modal)
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                            onClick={() => {
                              setLookupCreateContext({
                                key: "region",
                                typedName: "",
                                callback: (created) => {
                                  if (!created) return;
                                  setForm((p) => ({ ...p, regionId: created.regionId ?? created.id }));
                                  setSearch((s) => ({ ...s, region: "" }));
                                  awaitLoadTerritoriesForRegion(created.regionId ?? created.id);
                                },
                              });
                              setShowLookupCreateModal(true);
                            }}
                          >
                            <Star size={18} className="text-yellow-400" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="text-sm">Zip Code</label>
                        <input value={form.zipCode} onChange={(e) => setForm(p => ({ ...p, zipCode: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
                      </div>

                      {/* Territory */}
                      <div>
                        <label className="text-sm">Territory</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative w-full" ref={refs.territory}>
                            <input
                              type="text"
                              value={search.territory || findLabel("territory", form.territoryId) || search.territory}
                              onChange={(e) => { setSearch((s) => ({ ...s, territory: e.target.value })); setOpen((o) => ({ ...o, territory: true })); }}
                              onFocus={() => setOpen((o) => ({ ...o, territory: true }))}
                              placeholder="Search or type to create..."
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                            />

                            {open.territory && (
                              <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                                {territories.filter(t => String(t.territoryDescription ?? t.name ?? "").toLowerCase().includes((search.territory || "").toLowerCase())).length > 0 ? (
                                  territories.filter(t => String(t.territoryDescription ?? t.name ?? "").toLowerCase().includes((search.territory || "").toLowerCase())).map((t) => (
                                    <div
                                      key={t.id}
                                      onClick={() => {
                                        setForm((p) => ({ ...p, territoryId: t.id }));
                                        setOpen((o) => ({ ...o, territory: false }));
                                        setSearch((s) => ({ ...s, territory: "" }));
                                      }}
                                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                                    >
                                      {t.territoryDescription ?? t.name}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm">
                                    <div className="mb-2 text-gray-300">No matches</div>
                                    <button
                                      onClick={() => {
                                        setLookupCreateContext({
                                          key: "territory",
                                          typedName: search.territory || "",
                                          callback: (created) => {
                                            if (!created) return;
                                            setForm((p) => ({ ...p, territoryId: created.id }));
                                            setOpen((o) => ({ ...o, territory: false }));
                                            setSearch((s) => ({ ...s, territory: "" }));
                                          },
                                        });
                                        setShowLookupCreateModal(true);
                                      }}
                                      className="w-full text-left px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                                    >
                                      Create new "{search.territory}" (open modal)
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
                            onClick={() => {
                              setLookupCreateContext({
                                key: "territory",
                                typedName: "",
                                callback: (created) => {
                                  if (!created) return;
                                  setForm((p) => ({ ...p, territoryId: created.id }));
                                  setSearch((s) => ({ ...s, territory: "" }));
                                },
                              });
                              setShowLookupCreateModal(true);
                            }}
                          >
                            <Star size={18} className="text-yellow-400" />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="text-sm">Address</label>
                        <input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm" />
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
                      <label className="text-sm">Payroll Bank *</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-full" ref={refs.bank}>
                          <input
                            type="text"
                            value={search.bank || findLabel("bank", form.payrollBankId) || search.bank}
                            onChange={(e) => { setSearch((s) => ({ ...s, bank: e.target.value })); setOpen((o) => ({ ...o, bank: true })); }}
                            onFocus={() => setOpen((o) => ({ ...o, bank: true }))}
                            placeholder="Search bank..."
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                          />

                          {open.bank && (
                            <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                              {banks.filter(b => String(b.BankName ?? b.name ?? "").toLowerCase().includes((search.bank || "").toLowerCase())).length > 0 ? (
                                banks.filter(b => String(b.BankName ?? b.name ?? "").toLowerCase().includes((search.bank || "").toLowerCase())).map((b) => (
                                  <div
                                    key={b.id ?? b.Id}
                                    onClick={() => {
                                      setForm((p) => ({ ...p, payrollBankId: b.id ?? b.Id }));
                                      setOpen((o) => ({ ...o, bank: false }));
                                      setSearch((s) => ({ ...s, bank: "" }));
                                    }}
                                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                                  >
                                    {b.BankName ?? b.name}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm">
                                  <div className="mb-2 text-gray-300">No matches</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
