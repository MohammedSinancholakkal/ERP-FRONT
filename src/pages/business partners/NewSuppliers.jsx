import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Save, Star, X, ArrowLeft, Trash2, Pencil, ArchiveRestore } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import SearchableSelect from "../../components/SearchableSelect";
import Swal from "sweetalert2";
import {
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  getEmployeesApi,
  getRegionsApi,
  getSupplierGroupsApi,
  addCountryApi,
  addStateApi,
  addCityApi,
  addSupplierApi,
  updateSupplierApi,
  getSupplierByIdApi,
  deleteSupplierApi,
  restoreSupplierApi,
 
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

// ----------------- Utilities -----------------
const parseArrayFromResponse = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.records) return res.data.records;
  if (res.records) return res.records;
  const maybeArray = Object.values(res).find((v) => Array.isArray(v));
  return Array.isArray(maybeArray) ? maybeArray : [];
};

// ----------------- Reusable Dropdown -----------------
const CustomDropdown = ({
  label,
  list = [],
  valueId,
  required = false,
  onSelect = () => {},
  showStar = true,
  showPencil = true,
  onAddClick,
  direction = "down", // "down" | "up"
  disabled = false,
}) => {
  // Map list items to { id, name } for SearchableSelect
  const options = list.map(item => ({
    id: item.id ?? item.Id,
    name: item.label ||
          item.name ||
          item.CountryName ||
          item.StateName ||
          item.CityName ||
          item.RegionName ||
          item.regionName ||
          item.GroupName ||
          item.groupName ||
          item.SupplierGroupName ||
          ""
  }));

  return (
    <div className="relative w-full">
      <label className="text-sm text-gray-300 mb-1 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="flex gap-2">
        <div className="flex-1">
          <SearchableSelect
            options={options}
            value={valueId}
            onChange={(id) => {
              // Find original item to pass back
              const originalItem = list.find(x => String(x.id ?? x.Id) === String(id));
              onSelect(originalItem);
            }}
            placeholder="--select--"
            direction={direction}
            className="w-full"
            disabled={disabled}
          />
        </div>

        {showStar && (
          <button
            type="button"
            onClick={onAddClick}
            disabled={disabled}
            className={`p-2 bg-gray-800 border border-gray-600 rounded flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Star size={14} className="text-yellow-400" />
          </button>
        )}
      </div>
    </div>
  );
};

// ----------------- Lookup Create Modal -----------------




const LookupCreateModal = ({
  open,
  onClose,
  contexts = {},
  onCreated,
  initialMode = "country",
  initialCountryId = "",
  initialStateId = "",
}) => {
  const { countries = [], states = [], cities = [] } = contexts;
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState(initialCountryId || "");
  const [stateId, setStateId] = useState(initialStateId || "");

  useEffect(() => {
    if (!open) {
      setName("");
      setCountryId(initialCountryId || "");
      setStateId(initialStateId || "");
      setMode(initialMode || "country");
    }
  }, [open, initialCountryId, initialStateId, initialMode]);

  const save = async () => {
    if (!name || !name.trim()) return toast.error("Name required");
    try {
      let created = null;
      if (mode === "country") {
        if (typeof addCountryApi === "function") {
          const res = await addCountryApi({ name: name.trim(), userId: 1 });
          created = res?.data?.record || res?.data || null;
        }
      } else if (mode === "state") {
        if (typeof addStateApi === "function") {
          const res = await addStateApi({ name: name.trim(), countryId: Number(countryId || 0), userId: 1 });
          created = res?.data?.record || res?.data || null;
        }
      } else if (mode === "city") {
        if (typeof addCityApi === "function") {
          const res = await addCityApi({ name: name.trim(), countryId: Number(countryId || 0), stateId: Number(stateId || 0), userId: 1 });
          created = res?.data?.record || res?.data || null;
        }
      }

      if (!created) created = { id: `t_${Date.now()}`, name: name.trim() };

      onCreated && onCreated({ mode, created });
      toast.success(`${mode} created`);
      onClose();
    } catch (err) {
      console.error("lookup create error", err);
      toast.error("Save failed");
    }
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[11000]">
      <div className="w-[520px] bg-gray-900 text-white rounded-lg border border-gray-700 shadow-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg">Create lookup</h3>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm mb-1 block">Type</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm">
              <option value="country">Country</option>
              <option value="state">State</option>
              <option value="city">City</option>
            </select>
          </div>

          {mode !== "country" && (
            <div>
              <label className="text-sm mb-1 block">Country</label>
              <select value={countryId} onChange={(e) => setCountryId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm">
                <option value="">--select--</option>
                {countries.map((c) => (
                  <option key={c.Id ?? c.id} value={c.Id ?? c.id}>{c.CountryName || c.name || c.label}</option>
                ))}
              </select>
            </div>
          )}

          {mode === "city" && (
            <div>
              <label className="text-sm mb-1 block">State</label>
              <select value={stateId} onChange={(e) => setStateId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm">
                <option value="">--select--</option>
                {states.map((s) => (
                  <option key={s.Id ?? s.id} value={s.Id ?? s.id}>{s.StateName || s.name || s.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2" />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded">Cancel</button>
            <button onClick={save}                
             className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300 disabled:opacity-60 disabled:cursor-not-allowed">
              <Save size={14} /> Save</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ----------------- Main Component -----------------
const NewSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupMode, setLookupMode] = useState("country");
  const [lookupDefaults, setLookupDefaults] = useState({ countryId: "", stateId: "" });
  const [lookupContexts, setLookupContexts] = useState({});
  const [isInactive, setIsInactive] = useState(false);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddKey, setQuickAddKey] = useState("");
  const [quickAddLabel, setQuickAddLabel] = useState("");
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddCountryId, setQuickAddCountryId] = useState("");
  const [quickAddStateId, setQuickAddStateId] = useState("");

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [statesMaster, setStatesMaster] = useState([]);
  const [citiesMaster, setCitiesMaster] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [regions, setRegions] = useState([]);
  const [supplierGroups, setSupplierGroups] = useState([]);

  const [form, setForm] = useState({
    companyName: "",
    countryId: null,
    stateId: null,
    cityId: null,
    contactName: "",
    contactTitle: "",
    supplierGroupId: null,
    regionId: null,
    address: "",
    region: "",
    postalCode: "",
    phone: "",
    website: "",
    fax: "",
    email: "",
    emailAddress: "",
    previousCredit: "",
    cnic: "",
    ntn: "",
    strn: "",
    orderBookerId: null,
    vat: "",
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle return from NewEmployee with new ID
  useEffect(() => {
    if (location.state?.newEmployeeId && location.state?.field) {
        const { newEmployeeId, field } = location.state;
        // Reload employees to ensure the new one is in the list
        getEmployeesApi(1, 5000).then(res => {
             const arr = parseArrayFromResponse(res).map((e) => ({
                id: e.Id ?? e.id,
                label: `${e.FirstName || e.firstName || ''} ${e.LastName || e.lastName || ''}`,
            }));
            setEmployees(arr);
            
            if (field === 'orderBooker') {
                update("orderBookerId", newEmployeeId);
            }
        });
    }
  }, [location.state]);

  useEffect(() => {
    if (isEditMode) loadSupplierForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadLookups = async () => {
    try {
      setIsLoading(true);
      const c = await getCountriesApi(1, 5000);
      const countriesArr = parseArrayFromResponse(c);
      setCountries(countriesArr);

      const s = await getStatesApi(1, 5000);
      const statesArr = parseArrayFromResponse(s);
      setStates(statesArr);
      setStatesMaster(statesArr);

      const ct = await getCitiesApi(1, 5000);
      const citiesArr = parseArrayFromResponse(ct);
      setCities(citiesArr);
      setCitiesMaster(citiesArr);

      const emp = await getEmployeesApi(1, 5000);
      setEmployees(parseArrayFromResponse(emp).map((e) => ({ id: e.Id ?? e.id, label: `${e.FirstName || e.firstName || ''} ${e.LastName || e.lastName || ''}` })));

      const reg = await getRegionsApi(1, 5000);
      const regArr = parseArrayFromResponse(reg);
      setRegions(regArr);

      const sg = await getSupplierGroupsApi(1, 5000);
      const sgArr = parseArrayFromResponse(sg);
      setSupplierGroups(sgArr);

      setLookupContexts({ countries: countriesArr, states: statesArr, cities: citiesArr });
    } catch (err) {
      console.error("lookup load error", err);
      toast.error("Failed to load lookups");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatesForCountry = (countryId, { preserve = false, presetStateId, presetCityId } = {}) => {
    const filteredStates = (statesMaster || []).filter((s) => String(s.CountryId ?? s.countryId ?? s.countryId) === String(countryId));
    setStates(filteredStates);

    const filteredCities = (citiesMaster || []).filter((c) => String(c.CountryId ?? c.countryId) === String(countryId));
    setCities(filteredCities);

    if (!preserve) {
      setForm((p) => ({ ...p, stateId: null, cityId: null }));
    } else {
      setForm((p) => ({
        ...p,
        stateId: presetStateId ?? p.stateId,
        cityId: presetCityId ?? p.cityId,
      }));
    }
  };

  const loadCitiesForState = (stateId, { preserve = false, presetCityId } = {}) => {
    const filteredCities = (citiesMaster || []).filter((c) => String(c.StateId ?? c.stateId) === String(stateId));
    setCities(filteredCities);
    if (!preserve) {
      setForm((p) => ({ ...p, cityId: null }));
    } else {
      setForm((p) => ({ ...p, cityId: presetCityId ?? p.cityId }));
    }
  };

  const loadSupplierForEdit = async () => {
    try {
      setIsLoading(true);

      const stateSupplier = location.state?.supplier;
      const stateIsInactive = location.state?.isInactive;

      const populate = (s) => {
        if (!s) return;
        setIsInactive(s.IsActive === 0 || s.DeleteDate != null || stateIsInactive === true);
        const presetStateId = s.StateId ?? s.stateId ?? null;
        const presetCityId = s.CityId ?? s.cityId ?? null;

        setForm((p) => ({
          ...p,
          companyName: s.CompanyName || s.companyName || "",
          countryId: s.CountryId ?? s.countryId ?? null,
          stateId: presetStateId,
          cityId: presetCityId,
          contactName: s.ContactName || s.contactName || "",
          contactTitle: s.ContactTitle || s.contactTitle || "",
          supplierGroupId:
            s.SupplierGroupId ??
            s.supplierGroupId ??
            s.SupplierGroup ??
            s.supplierGroup ??
            null,
          address: s.Address || s.address || "",
          regionId: s.RegionId ?? s.regionId ?? null,
          postalCode: s.PostalCode || s.postalCode || "",
          phone: s.Phone || s.phone || "",
          website: s.Website || s.website || "",
          fax: s.Fax || s.fax || "",
          email: s.Email || s.email || "",
          emailAddress: s.EmailAddress || s.emailAddress || "",
          previousCredit: s.PreviousCreditBalance ?? s.PreviousCredit ?? s.previousCreditBalance ?? s.previousCredit ?? "",
          cnic: s.CNIC || s.cnic || "",
          ntn: s.NTN || s.ntn || "",
          strn: s.STRN || s.strn || "",
          orderBookerId:
            s.OrderBookerId ??
            s.orderBookerId ??
            s.OrderBooker ??
            s.orderBooker ??
            null,
          vat: s.VAT ?? s.vat ?? "",
        }));

        if (s.CountryId ?? s.countryId) {
          loadStatesForCountry(s.CountryId ?? s.countryId, {
            preserve: true,
            presetStateId,
            presetCityId,
          });
        }
        if (s.StateId ?? s.stateId) {
          loadCitiesForState(s.StateId ?? s.stateId, {
            preserve: true,
            presetCityId,
          });
        }
      };

      // Prefer data passed from the list to avoid 404s on missing endpoints
      if (stateSupplier) {
        populate(stateSupplier);
        return;
      }

      // Fallback to API if available
      if (typeof getSupplierByIdApi === "function") {
        try {
          const res = await getSupplierByIdApi(id);
          const s = res?.data || res;
          populate(s);
        } catch (apiErr) {
          const status = apiErr?.response?.status;
          if (status === 404) {
            console.warn("Supplier detail endpoint not available (404)");
            toast.error("Supplier details not available on server (404).");
          } else {
            console.error("load supplier failed", apiErr);
            toast.error("Failed to load supplier");
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookupCreated = ({ mode, created }) => {
    // merge new item into local arrays so dropdowns see them immediately
    if (mode === "country") {
      setCountries((p) => [created, ...p]);
      setLookupContexts((p) => ({ ...p, countries: [created, ...(p.countries || [])] }));
    } else if (mode === "state") {
      setStates((p) => [created, ...p]);
      setStatesMaster((p) => [created, ...p]);
      setLookupContexts((p) => ({ ...p, states: [created, ...(p.states || [])] }));
    } else if (mode === "city") {
      setCities((p) => [created, ...p]);
      setCitiesMaster((p) => [created, ...p]);
      setLookupContexts((p) => ({ ...p, cities: [created, ...(p.cities || [])] }));
    }
  };

  const openQuickAdd = (key, label) => {
    setQuickAddKey(key);
    setQuickAddLabel(label);
    setQuickAddName("");
    setQuickAddLoading(false);
    // seed parent selection for state/city
    setLookupDefaults({
      countryId: form.countryId || "",
      stateId: form.stateId || "",
    });
    setQuickAddCountryId(form.countryId || "");
    setQuickAddStateId(form.stateId || "");
    setShowQuickAdd(true);
  };

  const saveQuickAdd = async () => {
    const name = quickAddName?.trim();
    if (!name) return toast.error("Name required");
    setQuickAddLoading(true);
    try {
      let created = null;
      if (quickAddKey === "country") {
        if (typeof addCountryApi === "function") {
          const res = await addCountryApi({ name, userId: 1 });
          created = res?.data?.record || res?.data || null;
        }
        if (!created) created = { id: `t_${Date.now()}`, CountryName: name };
        created = {
          ...created,
          CountryName: created.CountryName ?? created.name ?? name,
          name: created.name ?? created.CountryName ?? name,
        };
        setCountries((p) => [created, ...p]);
        setLookupContexts((p) => ({ ...p, countries: [created, ...(p.countries || [])] }));
        const newCountryId = created.Id ?? created.id;
        update("countryId", newCountryId);
        setQuickAddCountryId(newCountryId);
        loadStatesForCountry(newCountryId);
      } else if (quickAddKey === "state") {
        const countryId = quickAddCountryId || form.countryId;
        if (!countryId) {
          toast.error("Select country first");
          setQuickAddLoading(false);
          return;
        }
        if (typeof addStateApi === "function") {
          const res = await addStateApi({ name, countryId: Number(countryId), userId: 1 });
          created = res?.data?.record || res?.data || null;
        }
        if (!created) created = { id: `t_${Date.now()}`, StateName: name, CountryId: countryId };
        created = {
          ...created,
          StateName: created.StateName ?? created.name ?? name,
          name: created.name ?? created.StateName ?? name,
          CountryId: created.CountryId ?? countryId,
        };
        setStates((p) => [created, ...p]);
        setStatesMaster((p) => [created, ...p]);
        setLookupContexts((p) => ({ ...p, states: [created, ...(p.states || [])] }));
        const newStateId = created.Id ?? created.id;
        update("countryId", countryId);
        update("stateId", newStateId);
        setQuickAddStateId(newStateId);
      } else if (quickAddKey === "city") {
        const countryId = quickAddCountryId || form.countryId;
        const stateId = quickAddStateId || form.stateId;
        if (!countryId || !stateId) {
          toast.error("Select country and state first");
          setQuickAddLoading(false);
          return;
        }
        if (typeof addCityApi === "function") {
          const res = await addCityApi({
            name,
            countryId: Number(countryId),
            stateId: Number(stateId),
            userId: 1,
          });
          created = res?.data?.record || res?.data || null;
        }
        if (!created)
          created = {
            id: `t_${Date.now()}`,
            CityName: name,
            CountryId: countryId,
            StateId: stateId,
          };
        created = {
          ...created,
          CityName: created.CityName ?? created.name ?? name,
          name: created.name ?? created.CityName ?? name,
          CountryId: created.CountryId ?? countryId,
          StateId: created.StateId ?? stateId,
        };
        setCities((p) => [created, ...p]);
        setCitiesMaster((p) => [created, ...p]);
        setLookupContexts((p) => ({ ...p, cities: [created, ...(p.cities || [])] }));
        const newCityId = created.Id ?? created.id;
        update("countryId", countryId);
        update("stateId", stateId);
        update("cityId", newCityId);
      } else if (quickAddKey === "supplierGroup") {
        const createdLocal = { id: `t_${Date.now()}`, GroupName: name, name };
        setSupplierGroups((p) => [createdLocal, ...p]);
        update("supplierGroupId", createdLocal.id);
      } else if (quickAddKey === "region") {
        const createdLocal = { id: `t_${Date.now()}`, regionName: name, name };
        setRegions((p) => [createdLocal, ...p]);
        update("regionId", createdLocal.id);
      } else if (quickAddKey === "orderBooker") {
        const createdLocal = { id: `t_${Date.now()}`, label: name, name };
        setEmployees((p) => [createdLocal, ...p]);
        update("orderBookerId", createdLocal.id);
      }
      setShowQuickAdd(false);
      toast.success("Added");
    } catch (err) {
      console.error("quick add error", err);
      toast.error("Save failed");
    } finally {
      setQuickAddLoading(false);
    }
  };

  const validate = () => {
    if (!form.companyName?.trim()) return "Company Name required";
    if (!form.countryId) return "Country required";
    if (!form.stateId) return "State required";
    if (!form.cityId) return "City required";
    if (!String(form.previousCredit ?? "").trim()) return "Previous Credit Balance required";
    if (Number.isNaN(Number(form.previousCredit))) return "Previous Credit must be a number";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{7,20}$/;
    const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
    if (form.email && !emailRegex.test(form.email)) return "Email is not valid";
    // if (form.emailAddress && !emailRegex.test(form.emailAddress)) return "Email Address is not valid";
    if (form.phone && !phoneRegex.test(form.phone)) return "Phone is not valid";
    // if (form.fax && !phoneRegex.test(form.fax)) return "Fax is not valid";
    // if (form.website && !urlRegex.test(form.website)) return "Website is not valid";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) return toast.error(err);

    try {
      setIsSaving(true);
      const payload = {
        companyName: form.companyName?.trim(),
        countryId: form.countryId ? Number(form.countryId) : null,
        stateId: form.stateId ? Number(form.stateId) : null,
        cityId: form.cityId ? Number(form.cityId) : null,
        contactName: form.contactName?.trim() || null,
        contactTitle: form.contactTitle?.trim() || null,
        address: form.address?.trim() || null,
        regionId: form.regionId ? Number(form.regionId) : null,
        postalCode: form.postalCode?.trim() || null,
        phone: form.phone?.trim() || null,
        fax: form.fax?.trim() || null,
        website: form.website?.trim() || null,
        email: form.email?.trim() || null,
        emailAddress: form.emailAddress?.trim() || null,
        previousCreditBalance: Number(form.previousCredit || 0),
        supplierGroupId: form.supplierGroupId ? Number(form.supplierGroupId) : null,
        cnic: form.cnic?.trim() || null,
        ntn: form.ntn?.trim() || null,
        strn: form.strn?.trim() || null,
        orderBooker: form.orderBookerId ? Number(form.orderBookerId) : null,
        vat: form.vat ? Number(form.vat) : 0,
        userId: 1,
      };

      // call API if present
      if (isEditMode && typeof updateSupplierApi === "function") {
        const res = await updateSupplierApi(id, payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Supplier updated");
          if (location.state?.returnTo) {
             navigate(location.state.returnTo, { state: { newSupplierId: id } }); // pass ID back if needed, though for edit might not be strictly necessary, but consistant
          } else {
             navigate("/app/businesspartners/suppliers");
          }
          return;
        }
      }

      if (!isEditMode && typeof addSupplierApi === "function") {
        const res = await addSupplierApi(payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Supplier created");
          const createdId = res.data.record?.id || res.data?.id; // Access logic might vary, ensuring we get ID
          if (location.state?.returnTo) {
             navigate(location.state.returnTo, { state: { newSupplierId: createdId } });
          } else {
             navigate("/app/businesspartners/suppliers");
          }
          return;
        }
      }

      // fallback (no APIs available)
      console.log("Supplier payload:", payload);
      toast.success(isEditMode ? "Supplier (pretend) updated" : "Supplier (pretend) created");
      navigate("/app/businesspartners/suppliers");
    } catch (err) {
      console.error("submit supplier error", err);
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };
const handleDelete = async () => {
  if (!isEditMode) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This supplier will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    if (typeof deleteSupplierApi === "function") {
      await deleteSupplierApi(id, { userId: 1 });

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Supplier deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/app/businesspartners/suppliers");
      return;
    }

    // fallback
    await Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Supplier (pretend) deleted.",
      timer: 1500,
      showConfirmButton: false,
    });

    navigate("/app/businesspartners/suppliers");

  } catch (err) {
    console.error("delete supplier failed", err);

    Swal.fire({
      icon: "error",
      title: "Delete failed",
      text: "Something went wrong while deleting the supplier.",
    });
  }
};

const handleRestore = async () => {
  const result = await Swal.fire({
    title: "Restore this supplier?",
    text: "The supplier will be active again.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, restore",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#10b981", // green
  });

  if (!result.isConfirmed) return;

  try {
    if (typeof restoreSupplierApi === "function") {
      await restoreSupplierApi(id, { userId: 1 });
      toast.success("Supplier restored successfully");
      navigate("/app/businesspartners/suppliers");
    } else {
      toast.error("Restore API not available");
    }
  } catch (err) {
    console.error("restore supplier failed", err);
    toast.error("Restore failed");
  }
};


  if (isEditMode && isLoading) {
    return (
      <div className="h-[90vh] flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading supplier...</span>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full overflow-hidden">
        <div className="h-full overflow-y-auto pr-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => {
                  if (location.state?.returnTo) {
                      navigate(location.state.returnTo);
                  } else {
                      navigate("/app/businesspartners/suppliers");
                  }
              }} className="p-1"><ArrowLeft /></button>
              <h2 className="text-2xl font-semibold">
                {isEditMode ? (isInactive ? "Restore Supplier" : "Edit Supplier") : "New Supplier"}
              </h2>
            </div>

            <div className="flex gap-3">
              {!isInactive && (isEditMode ? hasPermission(PERMISSIONS.SUPPLIERS.EDIT) : hasPermission(PERMISSIONS.SUPPLIERS.CREATE)) && (
                <button
                  onClick={submit}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save size={16} /> {isSaving ? "Saving..." : "Save"}
                </button>
              )}
              
              {isEditMode && isInactive && hasPermission(PERMISSIONS.SUPPLIERS.DELETE) && (
                <button 
                  onClick={handleRestore} 
                  className="flex items-center gap-2 bg-emerald-900 border border-emerald-600 px-4 py-2 rounded text-emerald-200 hover:bg-emerald-800"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              )}

              {isEditMode && !isInactive && hasPermission(PERMISSIONS.SUPPLIERS.DELETE) && (
                <button onClick={handleDelete} className="flex items-center gap-2 bg-red-800 border border-red-600 px-4 py-2 rounded text-red-200"><Trash2 size={16} /> Delete</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mx-2">
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">* Company Name</label>
              <input 
                value={form.companyName} 
                onChange={(e) => update("companyName", e.target.value)} 
                disabled={isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`} 
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <CustomDropdown
                label="Country"
                list={countries.map((c) => ({ id: c.Id ?? c.id, label: c.CountryName ?? c.name }))}
                valueId={form.countryId}
                required
                onSelect={(item) => {
                  update("countryId", item?.id ?? null);
                  update("stateId", null);
                  update("cityId", null);
                  loadStatesForCountry(item?.id ?? null);
                }}
              showStar={!isEditMode && hasPermission(PERMISSIONS.COUNTRIES.CREATE)}
              showPencil={isEditMode}
              onAddClick={() => openQuickAdd("country", "Country")}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <CustomDropdown
                label="State"
                list={states.map((s) => ({ id: s.Id ?? s.id, label: s.StateName ?? s.name }))}
                valueId={form.stateId}
                onSelect={(item) => {
                  update("stateId", item?.id ?? null);
                  update("cityId", null);
                  loadCitiesForState(item?.id ?? null);
                }}
                showStar={!isEditMode && hasPermission(PERMISSIONS.STATES.CREATE)}
                showPencil={isEditMode}
              onAddClick={() => openQuickAdd("state", "State")}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <CustomDropdown
                label="City"
                list={cities.map((c) => ({ id: c.Id ?? c.id, label: c.CityName ?? c.name }))}
                valueId={form.cityId}
                onSelect={(item) => update("cityId", item?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.CITIES.CREATE)}
                showPencil={isEditMode}
              onAddClick={() => openQuickAdd("city", "City")}
              />
            </div>

            <div className="col-span-12 md:col-span-4">
              <label className="text-sm">Contact Name</label>
              <input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2" />
            </div>
            <div className="col-span-12 md:col-span-4">
              <label className="text-sm">Contact Title</label>
              <input value={form.contactTitle} onChange={(e) => update("contactTitle", e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2" />
            </div>

            <div className="col-span-12 md:col-span-4">
              <CustomDropdown
                label="Supplier Group"
                list={supplierGroups.map((g) => ({ id: g.Id ?? g.id, label: g.GroupName ?? g.groupName ?? g.SupplierGroupName ?? g.name ?? "" }))}
                valueId={form.supplierGroupId}
                onSelect={(it) => update("supplierGroupId", it?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.SUPPLIER_GROUPS.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => openQuickAdd("supplierGroup", "Supplier Group")}
                disabled={isInactive}
              />
            </div>

            <div className="col-span-12">
              <label className="text-sm">Address</label>
              <textarea 
                 value={form.address} 
                 onChange={(e) => update("address", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 min-h-[70px] ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <CustomDropdown
                label="Region"
                list={regions.map((r) => ({ id: r.regionId ?? r.Id ?? r.id, label: r.regionName ?? r.RegionName ?? r.name ?? "" }))}
                valueId={form.regionId}
                onSelect={(it) => update("regionId", it?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.REGIONS.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => openQuickAdd("region", "Region")}
                disabled={isInactive}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="text-sm">Postal Code</label>
              <input 
                 value={form.postalCode} 
                 onChange={(e) => update("postalCode", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="text-sm">Phone</label>
              <input 
                 value={form.phone} 
                 onChange={(e) => update("phone", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Website</label>
              <input 
                 value={form.website} 
                 onChange={(e) => update("website", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Fax</label>
              <input 
                 value={form.fax} 
                 onChange={(e) => update("fax", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Email Address</label>
              <input 
                 value={form.emailAddress} 
                 onChange={(e) => update("emailAddress", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Email</label>
              <input 
                 value={form.email} 
                 onChange={(e) => update("email", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">* Previous Credit Balance</label>
              <input 
                 value={form.previousCredit} 
                 onChange={(e) => update("previousCredit", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">CNIC</label>
              <input 
                 value={form.cnic} 
                 onChange={(e) => update("cnic", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">NTN</label>
              <input 
                 value={form.ntn} 
                 onChange={(e) => update("ntn", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">STRN</label>
              <input 
                 value={form.strn} 
                 onChange={(e) => update("strn", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Vat</label>
              <input 
                 value={form.vat} 
                 onChange={(e) => update("vat", e.target.value)} 
                 disabled={isInactive}
                 className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="col-span-12 mb-5 md:col-span-6">
              <CustomDropdown
                label="Order Booker"
                list={employees}
                valueId={form.orderBookerId}
                onSelect={(item) => update("orderBookerId", item?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => navigate("/app/hr/newemployee", { state: { returnTo: location.pathname, field: "orderBooker" } })}
                direction="up"
                disabled={isInactive}
              />
            </div>
          </div>
        </div>

        {showLookup && (
          <LookupCreateModal
            open={showLookup}
            contexts={lookupContexts}
            onClose={() => setShowLookup(false)}
            onCreated={handleLookupCreated}
            initialMode={lookupMode}
            initialCountryId={lookupDefaults.countryId}
            initialStateId={lookupDefaults.stateId}
          />
        )}
{showQuickAdd &&
  ReactDOM.createPortal(
    <div className="fixed inset-0 z-[12000] flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowQuickAdd(false)}
      />

      {/* MODAL */}
      <div className="relative  w-[700px] mx-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white border border-gray-700 rounded-lg shadow-xl">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold">
            Add new {quickAddLabel}
          </h3>
          <button
            onClick={() => setShowQuickAdd(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">

          {/* STATE → COUNTRY */}
          {quickAddKey === "state" && (
            <CustomDropdown
              label="Country"
              list={countries.map(c => ({
                id: c.Id ?? c.id,
                label: c.CountryName || c.name || c.label,
              }))}
              valueId={quickAddCountryId}
              onSelect={(item) => {
                setQuickAddCountryId(item?.id ?? "");
                setQuickAddStateId("");
              }}
              showStar={false}
              showPencil={false}
            />
          )}

          {/* CITY → COUNTRY + STATE */}
          {quickAddKey === "city" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomDropdown
                label="Country"
                list={countries.map(c => ({
                  id: c.Id ?? c.id,
                  label: c.CountryName || c.name || c.label,
                }))}
                valueId={quickAddCountryId}
                onSelect={(item) => {
                  setQuickAddCountryId(item?.id ?? "");
                  setQuickAddStateId("");
                }}
                showStar={false}
                showPencil={false}
              />

              <CustomDropdown
                label="State"
                list={(statesMaster || [])
                  .filter(
                    s =>
                      !quickAddCountryId ||
                      String(s.CountryId ?? s.countryId) ===
                        String(quickAddCountryId)
                  )
                  .map(s => ({
                    id: s.Id ?? s.id,
                    label: s.StateName || s.name || s.label,
                  }))
                }
                valueId={quickAddStateId}
                onSelect={(item) =>
                  setQuickAddStateId(item?.id ?? "")
                }
                showStar={false}
                showPencil={false}
              />
            </div>
          )}

          {/* NAME */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">
              Name
            </label>
            <input
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              placeholder={`Enter ${quickAddLabel} name`}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-700">
          <button
            onClick={() => setShowQuickAdd(false)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
            disabled={quickAddLoading}
          >
            Cancel
          </button>

          {/* SAME SAVE BUTTON THEME */}
          <button
            onClick={saveQuickAdd}
            disabled={quickAddLoading}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded
                       text-blue-200 hover:bg-gray-700
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {quickAddLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
  

      </div>
    </PageLayout>
  );
};

export default NewSupplier;


