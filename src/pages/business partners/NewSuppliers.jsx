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
import AddModal from "../../components/modals/AddModal";
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



// ----------------- Main Component -----------------
const NewSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInactive, setIsInactive] = useState(false);

  // New Modal States
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [addSupplierGroupModalOpen, setAddSupplierGroupModalOpen] = useState(false);
  const [addRegionModalOpen, setAddRegionModalOpen] = useState(false);

  // New Item States
  const [newCountryName, setNewCountryName] = useState("");
  const [newState, setNewState] = useState({ name: "", countryId: "" });
  const [newCity, setNewCity] = useState({ name: "", countryId: "", stateId: "" });
  const [newGroupName, setNewGroupName] = useState("");
  const [newRegionName, setNewRegionName] = useState("");

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

    orderBookerId: null,

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

      setSupplierGroups(sgArr);
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

          orderBookerId:
            s.OrderBookerId ??
            s.orderBookerId ??
            s.OrderBooker ??
            s.orderBooker ??
            null,

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

  // --- SAVE HANDLERS FOR NEW MODALS ---

  const handleSaveCountry = async () => {
      if (!newCountryName.trim()) return toast.error("Country name is required");
      try {
          let created = null;
          if (typeof addCountryApi === "function") {
              const res = await addCountryApi({ name: newCountryName.trim(), userId: 1 });
              created = res?.data?.record || res?.data || null;
          }
           if (!created) created = { id: `t_${Date.now()}`, CountryName: newCountryName.trim() };
           
           // Normalize
           created = { ...created, CountryName: created.CountryName ?? created.name ?? newCountryName.trim(), name: created.name ?? created.CountryName ?? newCountryName.trim() };

           setCountries(prev => [created, ...prev]);
           update("countryId", created.Id ?? created.id);
           // Reset subordinate
           update("stateId", null);
           update("cityId", null);
           loadStatesForCountry(created.Id ?? created.id); // Load (empty) states for new country

           setNewCountryName("");
           setAddCountryModalOpen(false);
           toast.success("Country added successfully");
      } catch (error) {
          console.error("Failed to add country", error);
          toast.error("Failed to add country");
      }
  };

  const handleSaveState = async () => {
    if (!newState.name.trim()) return toast.error("State name is required");
    if (!newState.countryId) return toast.error("Country is required");

    try {
        let created = null;
        if (typeof addStateApi === "function") {
            const res = await addStateApi({ name: newState.name.trim(), countryId: Number(newState.countryId), userId: 1 });
            created = res?.data?.record || res?.data || null;
        }
        if (!created) created = { id: `t_${Date.now()}`, StateName: newState.name.trim(), CountryId: newState.countryId };

        // Normalize
        created = { ...created, StateName: created.StateName ?? created.name ?? newState.name.trim(), name: created.name ?? created.StateName ?? newState.name.trim(), CountryId: created.CountryId ?? newState.countryId };

        setStates(prev => [created, ...prev]);
        setStatesMaster(prev => [created, ...prev]);
        
        // If the added state belongs to the currently selected country, select it
        if(String(created.CountryId) === String(form.countryId)) {
             update("stateId", created.Id ?? created.id);
             update("cityId", null);
             loadCitiesForState(created.Id ?? created.id);
        } else {
             // If added for a different country, maybe warn or switch? For now just add to master list.
        }

        setNewState({ name: "", countryId: "" });
        setAddStateModalOpen(false);
        toast.success("State added successfully");
    } catch (error) {
        console.error("Failed to add state", error);
        toast.error("Failed to add state");
    }
  };

  const handleSaveCity = async () => {
    if (!newCity.name.trim()) return toast.error("City name is required");
    if (!newCity.countryId) return toast.error("Country is required");
    if (!newCity.stateId) return toast.error("State is required");

    try {
        let created = null;
        if (typeof addCityApi === "function") {
             const res = await addCityApi({
                name: newCity.name.trim(),
                countryId: Number(newCity.countryId),
                stateId: Number(newCity.stateId),
                userId: 1,
              });
              created = res?.data?.record || res?.data || null;
        }

        if(!created) created = { id: `t_${Date.now()}`, CityName: newCity.name.trim(), CountryId: newCity.countryId, StateId: newCity.stateId };

        // Normalize
        created = {
          ...created,
          CityName: created.CityName ?? created.name ?? newCity.name.trim(),
          name: created.name ?? created.CityName ?? newCity.name.trim(),
          CountryId: created.CountryId ?? newCity.countryId,
          StateId: created.StateId ?? newCity.stateId,
        };

        setCities(prev => [created, ...prev]);
        setCitiesMaster(prev => [created, ...prev]);

        if (String(created.StateId) === String(form.stateId)) {
            update("cityId", created.Id ?? created.id);
        }

        setNewCity({ name: "", countryId: "", stateId: "" });
        setAddCityModalOpen(false);
        toast.success("City added successfully");
    } catch (error) {
        console.error("Failed to add city", error);
        toast.error("Failed to add city");
    }
  };

  const handleSaveSupplierGroup = () => {
      if(!newGroupName.trim()) return toast.error("Group name required");
      // Mock API call or Real API if available (not imported but pattern suggests it exists or we mock)
      // The original code mocked it:
      const createdLocal = { id: `t_${Date.now()}`, GroupName: newGroupName.trim(), name: newGroupName.trim() };
      setSupplierGroups(prev => [createdLocal, ...prev]);
      update("supplierGroupId", createdLocal.id);
      
      setNewGroupName("");
      setAddSupplierGroupModalOpen(false);
      toast.success("Group added");
  };

  const handleSaveRegion = () => {
      if(!newRegionName.trim()) return toast.error("Region name required");
      // Mock
      const createdLocal = { id: `t_${Date.now()}`, regionName: newRegionName.trim(), name: newRegionName.trim() };
      setRegions(prev => [createdLocal, ...prev]);
      update("regionId", createdLocal.id);

      setNewRegionName("");
      setAddRegionModalOpen(false);
      toast.success("Region added");
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

        orderBooker: form.orderBookerId ? Number(form.orderBookerId) : null,

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
                  if (location.state?.from) {
                      navigate(location.state.from);
                  } else if (location.state?.returnTo) {
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
              onAddClick={() => setAddCountryModalOpen(true)}
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
              onAddClick={() => setAddStateModalOpen(true)}
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
              onAddClick={() => setAddCityModalOpen(true)}
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
                onAddClick={() => setAddSupplierGroupModalOpen(true)}
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
                onAddClick={() => setAddRegionModalOpen(true)}
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


            <div className="col-span-12 mb-5 md:col-span-6">
              <CustomDropdown
                label="Order Booker"
                list={employees}
                valueId={form.orderBookerId}
                onSelect={(item) => update("orderBookerId", item?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => navigate("/app/hr/newemployee", { state: { returnTo: location.pathname, field: "orderBooker", from: location.pathname } })}
                direction="up"
                disabled={isInactive}
              />
            </div>
          </div>
        </div>

        {/* =============================
            ADD COUNTRY MODAL 
        ============================== */}
        <AddModal
          isOpen={addCountryModalOpen}
          onClose={() => setAddCountryModalOpen(false)}
          onSave={handleSaveCountry}
          title="Add Country"
          width="600px"
        >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300 mb-1 block">Country Name *</label>
                  <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      value={newCountryName}
                      onChange={(e) => setNewCountryName(e.target.value)}
                      placeholder="Enter Country Name"
                  />
              </div>
          </div>
        </AddModal>

        {/* =============================
            ADD STATE MODAL 
        ============================== */}
        <AddModal
          isOpen={addStateModalOpen}
          onClose={() => setAddStateModalOpen(false)}
          onSave={handleSaveState}
          title="Add State"
          width="600px"
        >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300 mb-1 block">Country *</label>
                  <SearchableSelect
                      options={countries.map(c => ({ id: c.Id ?? c.id, name: c.CountryName || c.name }))}
                      value={newState.countryId}
                      onChange={(val) => setNewState({ ...newState, countryId: val })}
                      placeholder="Select Country"
                  />
              </div>
              <div>
                  <label className="text-sm text-gray-300 mb-1 block">State Name *</label>
                  <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      value={newState.name}
                      onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                      placeholder="Enter State Name"
                  />
              </div>
          </div>
        </AddModal>

        {/* =============================
            ADD CITY MODAL 
        ============================== */}
        <AddModal
          isOpen={addCityModalOpen}
          onClose={() => setAddCityModalOpen(false)}
          onSave={handleSaveCity}
          title="Add City"
          width="600px"
        >
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-sm text-gray-300 mb-1 block">Country *</label>
                      <SearchableSelect
                          options={countries.map(c => ({ id: c.Id ?? c.id, name: c.CountryName || c.name }))}
                          value={newCity.countryId}
                          onChange={(val) => setNewCity({ ...newCity, countryId: val, stateId: "" })}
                          placeholder="Select Country"
                      />
                  </div>
                  <div>
                      <label className="text-sm text-gray-300 mb-1 block">State *</label>
                      <SearchableSelect
                           options={(statesMaster || [])
                              .filter(s => !newCity.countryId || String(s.CountryId ?? s.countryId) === String(newCity.countryId))
                              .map(s => ({ id: s.Id ?? s.id, name: s.StateName || s.name }))}
                          value={newCity.stateId}
                          onChange={(val) => setNewCity({ ...newCity, stateId: val })}
                          placeholder="Select State"
                      />
                  </div>
              </div>
              <div>
                  <label className="text-sm text-gray-300 mb-1 block">City Name *</label>
                  <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      value={newCity.name}
                      onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                      placeholder="Enter City Name"
                  />
              </div>
          </div>
        </AddModal>

        {/* =============================
            ADD SUPPLIER GROUP MODAL 
        ============================== */}
        <AddModal
          isOpen={addSupplierGroupModalOpen}
          onClose={() => setAddSupplierGroupModalOpen(false)}
          onSave={handleSaveSupplierGroup}
          title="Add Supplier Group"
          width="600px"
        >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300 mb-1 block">Group Name *</label>
                  <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter Group Name"
                  />
              </div>
          </div>
        </AddModal>

        {/* =============================
            ADD REGION MODAL 
        ============================== */}
        <AddModal
          isOpen={addRegionModalOpen}
          onClose={() => setAddRegionModalOpen(false)}
          onSave={handleSaveRegion}
          title="Add Region"
          width="600px"
        >
          <div className="space-y-4">
              <div>
                  <label className="text-sm text-gray-300 mb-1 block">Region Name *</label>
                  <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      placeholder="Enter Region Name"
                  />
              </div>
          </div>
        </AddModal>
  

      </div>
    </PageLayout>
  );
};

export default NewSupplier;


