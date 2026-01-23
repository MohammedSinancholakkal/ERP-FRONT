import React, { useEffect, useRef, useState } from "react";
import { Save, Star, X, ArrowLeft, Trash2, ArchiveRestore } from "lucide-react";
import toast from "react-hot-toast";

import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import SearchableSelect from "../../components/SearchableSelect";
import InputField from "../../components/InputField";
import { useTheme } from "../../context/ThemeContext";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import {
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  getEmployeesApi,
  getRegionsApi,
  getSupplierGroupsApi,
  addSupplierGroupApi,
  addRegionApi,
  addCountryApi,
  addStateApi,
  addCityApi,
  addSupplierApi,
  updateSupplierApi,
  getSupplierByIdApi,
  deleteSupplierApi,
  restoreSupplierApi,
  searchCountryApi,
  searchStateApi,
  searchCityApi,
  searchRegionApi,
  searchSupplierGroupApi,
  searchSupplierApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";
import ContentCard from "../../components/ContentCard";
import { useDashboard } from "../../context/DashboardContext";
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


// ----------------- Main Component -----------------
const NewSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);
  const { invalidateDashboard } = useDashboard();
  const { theme } = useTheme();

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
    pan: "",
    gstin: "",
    addressLine1: "",
    addressLine2: "",
  });
  const update = (k, v) => {
    if (k === "phone") {
        // Numbers only, strictly max 10 chars
      const val = v.replace(/\D/g, "").slice(0, 10);
      setForm((p) => ({ ...p, [k]: val }));
    } else if (k === "postalCode") {
      // Numbers only, strictly max 6 chars
      const val = v.replace(/\D/g, "").slice(0, 6);
      setForm((p) => ({ ...p, [k]: val }));
    } else {
      setForm((p) => ({ ...p, [k]: v }));
    }
  };

  useEffect(() => {
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle return from NewEmployee with new ID
  useEffect(() => {
    if (location.state?.newEmployeeId && location.state?.field) {
        const { newEmployeeId, field, preservedState } = location.state;
        
        // Restore preserved form data if available
        if (preservedState) {
             setForm(prev => ({ ...prev, ...preservedState }));
             
             // Restore Cascading Lists if IDs exist
             if (preservedState.countryId) {
                 loadStatesForCountry(preservedState.countryId, { 
                     preserve: true, 
                     presetStateId: preservedState.stateId,
                     presetCityId: preservedState.cityId 
                 });
             }
             if (preservedState.stateId) {
                 loadCitiesForState(preservedState.stateId, {
                     preserve: true,
                     presetCityId: preservedState.cityId
                 });
             }
        }

        // Reload employees to ensure the new one is in the list
        getEmployeesApi(1, 5000).then(res => {
             const arr = parseArrayFromResponse(res).map((e) => ({
                id: e.Id ?? e.id,
                name: `${e.FirstName || e.firstName || ''} ${e.LastName || e.lastName || ''}`,
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
      setEmployees(parseArrayFromResponse(emp).map((e) => ({ id: e.Id ?? e.id, name: `${e.FirstName || e.firstName || ''} ${e.LastName || e.lastName || ''}` })));

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
  s.supplierGroupId ??
  s.SupplierGroupId ??
  null,
          address: s.Address || s.address || "",
          addressLine1: s.AddressLine1 || s.addressLine1 || s.Address || s.address || "",
          addressLine2: s.AddressLine2 || s.addressLine2 || "",
          regionId: s.RegionId ?? s.regionId ?? null,
          postalCode: s.PostalCode || s.postalCode || "",
          phone: s.Phone || s.phone || "",
          website: s.Website || s.website || "",
          fax: s.Fax || s.fax || "",
          email: s.Email || s.email || "",
          emailAddress: s.EmailAddress || s.emailAddress || "",
          previousCredit: s.PreviousCreditBalance ?? s.PreviousCredit ?? s.previousCreditBalance ?? s.previousCredit ?? "",

          orderBookerId:
            s.orderBooker ??
            s.OrderBooker ??
            s.OrderBookerId ?? 
            s.orderBookerId ??
            null,
          pan: s.PAN ?? s.pan ?? "",
          gstin: s.GSTIN ?? s.gstin ?? s.GSTTIN ?? "",

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

      // Check duplicates
      try {
        const searchRes = await searchCountryApi(newCountryName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data.records || searchRes.data || [];
            const existing = rows.find(r => (r.Name || r.name || "").toLowerCase() === newCountryName.trim().toLowerCase());
            if (existing) return toast.error("Country with this name already exists");
        }
      } catch (err) {
        console.error(err);
        return toast.error("Error checking duplicates");
      }

      try {
          let created = null;
          if (typeof addCountryApi === "function") {
              const res = await addCountryApi({ name: newCountryName.trim(), userId: 1 });
              created = res?.data?.record || res?.data || null;
          }
           if (!created || (!created.id && !created.Id && !created.CountryId && !created.countryId)) {
               created = { ...created, id: `t_${Date.now()}`, CountryName: newCountryName.trim() };
           }
           
           created = { ...created, CountryName: created.CountryName ?? created.name ?? newCountryName.trim(), name: created.name ?? created.CountryName ?? newCountryName.trim() };
           setCountries(prev => [created, ...prev]);
           update("countryId", created.Id ?? created.id);
           update("stateId", null);
           update("cityId", null);
           loadStatesForCountry(created.Id ?? created.id); 
           setNewCountryName("");
           setAddCountryModalOpen(false);
           toast.success("Country added successfully");
      } catch (error) {
          if (error.response?.status === 409) {
              toast.error("Country with this name already exists");
          } else {
              console.error("Failed to add country", error);
              toast.error("Failed to add country");
          }
      }
  };

  const handleSaveState = async () => {
    if (!newState.name.trim()) return toast.error("State name is required");
    if (!newState.countryId && newState.countryId !== 0) return toast.error("Country is required");

    try {
        const searchRes = await searchStateApi(newState.name.trim());
        if (searchRes?.status === 200) {
             const rows = searchRes.data || []; 
             const items = Array.isArray(rows) ? rows : rows.records || [];
             const existing = items.find(r => 
                (r.Name || r.name || "").toLowerCase() === newState.name.trim().toLowerCase() && 
                String(r.CountryId || r.countryId) === String(newState.countryId)
             );
             if (existing) return toast.error("State with this name already exists in selected country");
        }
    } catch(err) {
         console.error(err);
         return toast.error("Error checking duplicates");
    }

    try {
        let created = null;
        if (typeof addStateApi === "function") {
            const res = await addStateApi({ name: newState.name.trim(), countryId: Number(newState.countryId), userId: 1 });
            created = res?.data?.record || res?.data || null;
        }
        if (!created || (!created.id && !created.Id && !created.StateId && !created.stateId)) {
            created = { ...created, id: `t_${Date.now()}`, StateName: newState.name.trim(), CountryId: newState.countryId };
        }

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
        if (error.response?.status === 409) {
            toast.error("State with this name already exists in selected country");
        } else {
            console.error("Failed to add state", error);
            toast.error("Failed to add state");
        }
    }
  };

  const handleSaveCity = async () => {
    if (!newCity.name.trim()) return toast.error("City name is required");
    if (!newCity.countryId && newCity.countryId !== 0) return toast.error("Country is required");
    if (!newCity.stateId && newCity.stateId !== 0) return toast.error("State is required");

    try {
        const searchRes = await searchCityApi(newCity.name.trim());
        if (searchRes?.status === 200) {
             const rows = searchRes.data.records || searchRes.data || []; 
             const items = Array.isArray(rows) ? rows : []; 
             const existing = items.find(r => 
                (r.Name || r.name || "").toLowerCase() === newCity.name.trim().toLowerCase() && 
                String(r.StateId || r.stateId) === String(newCity.stateId)
             );
             if (existing) return toast.error("City with this name already exists in selected state");
        }
    } catch(err) {
         console.error(err);
         return toast.error("Error checking duplicates");
    }

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

        if(!created || (!created.id && !created.Id && !created.StateId && !created.stateId && !created.CityId && !created.cityId)) {
             created = { ...created, id: `t_${Date.now()}`, CityName: newCity.name.trim(), CountryId: newCity.countryId, StateId: newCity.stateId };
        }

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
        if (error.response?.status === 409) {
            toast.error("City with this name already exists in selected state");
        } else {
            console.error("Failed to update city", error);
            toast.error("Failed to add city");
        }
    }
  };



  const handleSaveSupplierGroup = async () => {
      if(!newGroupName.trim()) return toast.error("Group name required");

      try {
        const searchRes = await searchSupplierGroupApi(newGroupName.trim());
        if (searchRes?.status === 200) {
             const rows = searchRes.data.records || searchRes.data || [];
             const existing = rows.find(r => (r.Name || r.name || r.GroupName || r.groupName || "").toLowerCase() === newGroupName.trim().toLowerCase());
             if (existing) return toast.error("Supplier group with this name already exists");
        }
      } catch(err) {
          console.error(err);
          return toast.error("Error checking duplicates");
      }

      try {
           const res = await addSupplierGroupApi({ name: newGroupName.trim() });
           const created = res.data?.record || res.data || { id: res.data?.id, name: newGroupName.trim() }; // basic fallback
           
           // Normalize
           const normalized = { ...created, GroupName: created.GroupName ?? created.name ?? newGroupName.trim(), name: created.name ?? created.GroupName ?? newGroupName.trim() };
           
           setSupplierGroups(prev => [normalized, ...prev]);
           update("supplierGroupId", normalized.Id ?? normalized.id);
           
           setNewGroupName("");
           setAddSupplierGroupModalOpen(false);
           toast.success("Group added");
      } catch (error) {
           if (error.response?.status === 409) {
               toast.error("Supplier group with this name already exists");
           } else {
               console.error("Failed to add group", error);
               toast.error("Failed to add group");
           }
      }
  };

  const handleSaveRegion = async () => {
      if(!newRegionName.trim()) return toast.error("Region name required");

      try {
        const searchRes = await searchRegionApi(newRegionName.trim());
        if (searchRes?.status === 200) {
             const rows = searchRes.data.records || searchRes.data || [];
             const existing = rows.find(r => (r.Name || r.name || r.RegionName || r.regionName || "").toLowerCase() === newRegionName.trim().toLowerCase());
             if (existing) return toast.error("Region with this name already exists");
        }
      } catch(err) {
          console.error(err);
          return toast.error("Error checking duplicates");
      }

      try {
           const res = await addRegionApi({ name: newRegionName.trim() });
           const created = res.data?.record || res.data || { id: res.data?.id, name: newRegionName.trim() };

           // Normalize
           const normalized = { ...created, RegionName: created.RegionName ?? created.name ?? newRegionName.trim(), name: created.name ?? created.RegionName ?? newRegionName.trim() };

           setRegions(prev => [normalized, ...prev]);
           update("regionId", normalized.Id ?? normalized.id);

           setNewRegionName("");
           setAddRegionModalOpen(false);
           toast.success("Region added");
      } catch (error) {
           if (error.response?.status === 409) {
               toast.error("Region with this name already exists");
           } else {
               console.error("Failed to add region", error);
               toast.error("Failed to add region");
           }
      }
  };

  const validate = () => {
    // 1. Company Name
    if (!form.companyName?.trim()) return "Company Name required";
    if (form.companyName.trim().length < 2) return "Company Name must be at least 2 characters";
    if (form.companyName.length > 150) return "Company Name cannot exceed 150 characters";
    
    // 2. Location
    if (!form.countryId) return "Country required";
    if (!form.stateId) return "State required";
    if (!form.cityId) return "City required";
    
    // 3. Contact Name
    if (form.contactName) {
        if (form.contactName.trim().length < 2) return "Contact Name must be at least 2 characters";
        if (form.contactName.length > 50) return "Contact Name cannot exceed 50 characters";
    }

    // 4. Address
    if (form.addressLine1) {
        if (form.addressLine1.trim().length < 2) return "Address Line 1 must be at least 2 characters";
        if (form.addressLine1.length > 150) return "Address Line 1 cannot exceed 150 characters";
    }
    if (form.addressLine2) {
        if (form.addressLine2.trim().length < 2) return "Address Line 2 must be at least 2 characters";
        if (form.addressLine2.length > 150) return "Address Line 2 cannot exceed 150 characters";
    }

    // 5. Credit
    if (!String(form.previousCredit ?? "").trim()) return "Previous Credit Balance required";
    if (Number.isNaN(Number(form.previousCredit))) return "Previous Credit must be a number";

    // 6. Regex Validations
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Phone: Must be exactly 10 digits if provided
    if (form.phone) {
         if (form.phone.length !== 10) return "Phone number must be exactly 10 digits";
         if (!/^\d+$/.test(form.phone)) return "Phone number can only contain digits";
    }
    
    // Zip Code: Must be exactly 6 digits if provided (since max is 6 in input)
    if (form.postalCode && form.postalCode.length < 6) return "Zip Code must be 6 digits";

    const urlRegex = /^(https?:\/\/)/;

    if (form.email && !emailRegex.test(form.email)) return "Email is not valid (must contain @ and . domain)";
    if (form.website && !urlRegex.test(form.website)) return "Website must start with http:// or https://";

    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) return toast.error(err);

    try {
      setIsSaving(true);

      // --- DUPLICATE CHECKS START ---
      // Check Name
      if (form.companyName?.trim()) {
         const searchRes = await searchSupplierApi(form.companyName.trim());
         if (searchRes?.status === 200) {
              const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
              const existing = rows.find(
                  (r) => (r.Name || r.name || r.CompanyName || r.companyName || "").toLowerCase() === form.companyName.trim().toLowerCase() && 
                  (isEditMode ? String(r.Id || r.id) !== String(id) : true)
              );
              if (existing) {
                  setIsSaving(false);
                  return toast.error("Supplier with this Company Name already exists");
              }
         }
      }

      // Check Phone
      if (form.phone?.trim()) {
         try {
             const searchRes = await searchSupplierApi(form.phone.trim());
              if (searchRes?.status === 200) {
                  const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
                  const existing = rows.find(
                      (r) => (r.Phone || r.phone) === form.phone.trim() &&
                      (isEditMode ? String(r.Id || r.id) !== String(id) : true)
                  );
                  if (existing) {
                      setIsSaving(false);
                      return toast.error("Supplier with this Phone Number already exists");
                  }
              }
         } catch(e) { console.error(e); }
      }

       // Check Email
      if (form.email?.trim()) {
         try {
             const searchRes = await searchSupplierApi(form.email.trim());
              if (searchRes?.status === 200) {
                  const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
                  const existing = rows.find(
                      (r) => (r.Email || r.email || "").toLowerCase() === form.email.trim().toLowerCase() &&
                      (isEditMode ? String(r.Id || r.id) !== String(id) : true)
                  );
                  if (existing) {
                      setIsSaving(false);
                      return toast.error("Supplier with this Email already exists");
                  }
              }
         } catch(e) { console.error(e); }
      }

       // Check PAN
      if (form.pan?.trim()) {
         try {
             const searchRes = await searchSupplierApi(form.pan.trim());
              if (searchRes?.status === 200) {
                  const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
                  const existing = rows.find(
                      (r) => (r.PAN || r.pan || "").toLowerCase() === form.pan.trim().toLowerCase() &&
                      (isEditMode ? String(r.Id || r.id) !== String(id) : true)
                  );
                  if (existing) {
                      setIsSaving(false);
                      return toast.error("Supplier with this PAN already exists");
                  }
              }
         } catch(e) { console.error(e); }
      }

       // Check GSTIN
      if (form.gstin?.trim()) {
         try {
             const searchRes = await searchSupplierApi(form.gstin.trim());
              if (searchRes?.status === 200) {
                  const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
                  const existing = rows.find(
                      (r) => (r.GSTIN || r.gstin || "").toLowerCase() === form.gstin.trim().toLowerCase() &&
                      (isEditMode ? String(r.Id || r.id) !== String(id) : true)
                  );
                  if (existing) {
                      setIsSaving(false);
                      return toast.error("Supplier with this GSTIN already exists");
                  }
              }
         } catch(e) { console.error(e); }
      }
      // --- DUPLICATE CHECKS END ---

      const payload = {
        companyName: form.companyName?.trim(),
        countryId: form.countryId ? Number(form.countryId) : null,
        stateId: form.stateId ? Number(form.stateId) : null,
        cityId: form.cityId ? Number(form.cityId) : null,
        contactName: form.contactName?.trim() || null,
        contactTitle: form.contactTitle?.trim() || null,
        address: `${form.addressLine1 || ""} ${form.addressLine2 || ""}`.trim() || null,
        addressLine1: form.addressLine1?.trim() || null,
        addressLine2: form.addressLine2?.trim() || null,
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
        pan: form.pan?.trim() || null,
        gstin: form.gstin?.trim() || null,

        userId: 1,
      };

      // call API if present
      if (isEditMode && typeof updateSupplierApi === "function") {
        const res = await updateSupplierApi(id, payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Supplier updated");
          invalidateDashboard();
          if (location.state?.returnTo) {
             navigate(location.state.returnTo, { state: { newSupplierId: id } }); 
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
          invalidateDashboard();
          const createdId = res.data.record?.id || res.data?.id; 
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
      showErrorToast("Save failed");
    } finally {
      setIsSaving(false);
    }
  };
const handleDelete = async () => {
  if (!isEditMode) return;

  const result = await showDeleteConfirm();

  if (!result.isConfirmed) return;

  try {
    if (typeof deleteSupplierApi === "function") {
      await deleteSupplierApi(id, { userId: 1 });

      showSuccessToast("Supplier deleted successfully.");

      invalidateDashboard();
      navigate("/app/businesspartners/suppliers");
      return;
    }

    // fallback
    showSuccessToast("Supplier (pretend) deleted.");

    navigate("/app/businesspartners/suppliers");

  } catch (err) {
    console.error("delete supplier failed", err);

    showErrorToast("Delete failed: Something went wrong while deleting the supplier.");
  }
};

const handleRestore = async () => {
  const result = await showRestoreConfirm();

  if (!result.isConfirmed) return;

  try {
    if (typeof restoreSupplierApi === "function") {
      await restoreSupplierApi(id, { userId: 1 });
      showSuccessToast("Supplier restored successfully");
      invalidateDashboard();
      navigate("/app/businesspartners/suppliers");
    } else {
      showErrorToast("Restore API not available");
    }
  } catch (err) {
    console.error("restore supplier failed", err);
    showErrorToast("Restore failed");
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
      <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard className="!h-auto !overflow-visible">
        
          {/* HEADER */}
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-2">
             <button 
               onClick={() => {
                   if (location.state?.from) {
                       navigate(location.state.from);
                   } else if (location.state?.returnTo) {
                       navigate(location.state.returnTo);
                   } else {
                       navigate("/app/businesspartners/suppliers");
                   }
               }}
                className={`p-2 rounded border transition-colors ${theme === 'emerald' ? 'bg-white border-gray-200 hover:bg-emerald-50 text-gray-600' : theme === 'purple' ? 'bg-[#6448AE] text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
             >
                <ArrowLeft size={24} />
             </button>
             <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE] bg-clip-text text-transparent bg-gradient-to-r from-[#6448AE] to-[#8066a3]' : theme === 'emerald' ? 'text-gray-800' : 'text-white'}`}>{isEditMode ? (isInactive ? "Restore Supplier" : "Edit Supplier") : "New Supplier"}</h2>
        </div>

        {/* ACTIONS BAR */}
        <div className="flex items-center gap-3 mb-6">
             {!isInactive && (isEditMode ? hasPermission(PERMISSIONS.SUPPLIERS.EDIT) : hasPermission(PERMISSIONS.SUPPLIERS.CREATE)) && (
                <button
                onClick={submit}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                    theme === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : theme === 'purple'
                    ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md'
                    : 'bg-gray-800 border border-gray-600 text-blue-300'
                }`}
                >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save"}
                </button>
             )}

             {isEditMode && isInactive && hasPermission(PERMISSIONS.SUPPLIERS.DELETE) && (
                <button 
                  onClick={handleRestore} 
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium hover:bg-emerald-800 ${
                      theme === 'emerald' ? 'bg-emerald-700 text-white' : theme === 'purple' ? 'bg-purple-700 text-white' : 'bg-emerald-900 border border-emerald-600 text-emerald-200'
                  }`}
                >
                  <ArchiveRestore size={18} /> Restore
                </button>
              )}

             {isEditMode && !isInactive && hasPermission(PERMISSIONS.SUPPLIERS.DELETE) && (
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg">
                    <Trash2 size={18} />
                    Delete
                </button>
             )}
        </div>
        <hr className="mb-4 border-gray-300" />

          <div className="grid grid-cols-12 gap-x-6 gap-y-4 mx-2">
            {/* 1. Name */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Company Name"
                    required
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    disabled={isInactive}
                    placeholder="e.g. Acme Corp"
                    maxLength={150}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 2. Country */}
            <div className="col-span-12 md:col-span-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-medium">
                   <SearchableSelect
                      label="Country"
                      required
                      options={countries.map((c) => ({ id: c.Id ?? c.id, name: c.CountryName ?? c.name }))}
                      value={form.countryId}
                      onChange={(val) => {
                          update("countryId", val);
                          update("stateId", null);
                          update("cityId", null);
                          loadStatesForCountry(val);
                      }}
                      placeholder="--select country--"
                      disabled={isInactive}
                   />
                 </div>
                 {(!isEditMode && hasPermission(PERMISSIONS.COUNTRIES.CREATE)) && (
                   <button
                      type="button"
                      className={`p-2 mt-6 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                      disabled={isInactive}
                      onClick={() => setAddCountryModalOpen(true)}
                   >
                      <Star size={16} />
                   </button>
                 )}
               </div>
            </div>

            {/* 3. State */}
            <div className="col-span-12 md:col-span-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-medium">
                   <SearchableSelect
                      label="State"
                      required
                      options={states.map((s) => ({ id: s.Id ?? s.id, name: s.StateName ?? s.name }))}
                      value={form.stateId}
                      onChange={(val) => {
                          update("stateId", val);
                          update("cityId", null);
                          loadCitiesForState(val);
                      }}
                      placeholder="--select state--"
                      disabled={isInactive}
                   />
                 </div>
                 {(!isEditMode && hasPermission(PERMISSIONS.STATES.CREATE)) && (
                   <button
                      type="button"
                      className={`p-2 mt-6 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                      disabled={isInactive}
                      onClick={() => {
                          setNewState(prev => ({ ...prev, countryId: form.countryId }));
                          setAddStateModalOpen(true);
                      }}
                   >
                      <Star size={16} />
                   </button>
                 )}
               </div>
            </div>

            {/* 4. City */}
            <div className="col-span-12 md:col-span-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-medium">
                   <SearchableSelect
                      label="City"
                      required
                      options={cities.map((c) => ({ id: c.Id ?? c.id, name: c.CityName ?? c.name }))}
                      value={form.cityId}
                      onChange={(val) => update("cityId", val)}
                      placeholder="--select city--"
                      disabled={isInactive}
                   />
                 </div>
                 {(!isEditMode && hasPermission(PERMISSIONS.CITIES.CREATE)) && (
                   <button
                      type="button"
                      className={`p-2 mt-6 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                      disabled={isInactive}
                      onClick={() => {
                          setNewCity(prev => ({ ...prev, countryId: form.countryId, stateId: form.stateId }));
                          setAddCityModalOpen(true);
                      }}
                   >
                      <Star size={16} />
                   </button>
                 )}
               </div>
            </div>

            {/* 5. Address Line 1 */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    text
                    label="Address Line 1"
                    value={form.addressLine1}
                    onChange={(e) => update("addressLine1", e.target.value)}
                    disabled={isInactive}
                    placeholder="Street address, P.O. box..."
                    className="min-h-[70px]"
                    maxLength={150}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 6. Address Line 2 */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    text
                    label="Address Line 2"
                    value={form.addressLine2}
                    onChange={(e) => update("addressLine2", e.target.value)}
                    disabled={isInactive}
                    placeholder="Apartment, suite, unit, etc."
                    className="min-h-[70px]"
                    maxLength={150}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 7. Region */}
            <div className="col-span-12 md:col-span-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-medium">
                   <SearchableSelect
                      label="Region"
                      options={regions.map((r) => ({
                          id: r.regionId ?? r.Id ?? r.id,
                          name: r.regionName ?? r.RegionName ?? r.name ?? ""
                      }))}
                      value={form.regionId}
                      onChange={(val) => update("regionId", val)}
                      placeholder="--select region--"
                      disabled={isInactive}
                   />
                 </div>
                 {(!isEditMode && hasPermission(PERMISSIONS.REGIONS.CREATE)) && (
                   <button
                      type="button"
                      className={`p-2 mt-6  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                      disabled={isInactive}
                      onClick={() => setAddRegionModalOpen(true)}
                   >
                      <Star size={16} />
                   </button>
                 )}
               </div>
            </div>

            {/* 8. Postal Code */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => update("postalCode", e.target.value)}
                    disabled={isInactive}
                    placeholder="Zip Code"
                     maxLength={6}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 9. Contact Name */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Contact Name"
                    value={form.contactName}
                    onChange={(e) => update("contactName", e.target.value)}
                    disabled={isInactive}
                    placeholder="e.g. John Doe"
                    maxLength={50}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 10. Contact Title */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Contact Title"
                    value={form.contactTitle}
                    onChange={(e) => update("contactTitle", e.target.value)}
                    disabled={isInactive}
                    placeholder="e.g. Manager"
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 11. Phone */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    disabled={isInactive}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 12. Fax */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Fax"
                    value={form.fax}
                    onChange={(e) => update("fax", e.target.value)}
                    disabled={isInactive}
                    placeholder="Fax Number"
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 13. Email Address */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Email Address"
                    type="email"
                    value={form.emailAddress}
                    onChange={(e) => update("emailAddress", e.target.value)}
                    disabled={isInactive}
                    placeholder="admin@example.com"
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 14. Email */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    disabled={isInactive}
                    placeholder="info@example.com"
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 15. Website */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Website"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    disabled={isInactive}
                    placeholder="https://example.com"
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 16. Supplier Group */}
            <div className="col-span-12 md:col-span-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-medium">
                   <SearchableSelect
                      label="Supplier Group"
                      options={supplierGroups.map((g) => ({
                          id: g.Id ?? g.id,
                          name: g.GroupName ?? g.groupName ?? g.name ?? ""
                      }))}
                      value={form.supplierGroupId}
                      onChange={(val) => update("supplierGroupId", val)}
                      placeholder="--select group--"
                      disabled={isInactive}
                   />
                 </div>
                 {(!isEditMode && hasPermission(PERMISSIONS.SUPPLIER_GROUPS.CREATE)) && (
                   <button
                      type="button"
                      className={`p-2 mt-6  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                      disabled={isInactive}
                      onClick={() => setAddSupplierGroupModalOpen(true)}
                   >
                      <Star size={16} />
                   </button>
                 )}
               </div>
            </div>

             {/* 17. PAN (Left) */}
             <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                      label="PAN"
                      value={form.pan}
                      onChange={(e) => update("pan", e.target.value.toUpperCase())}
                      disabled={isInactive}
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 18. Previous Credit Balance (Right) */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                    label="Previous Credit Balance"
                    type="number"
                    required
                    value={form.previousCredit}
                    onChange={(e) => update("previousCredit", e.target.value)}
                    disabled={isInactive}
                    placeholder="0.00"
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 19. GSTIN (Left) */}
            <div className="col-span-12 md:col-span-6">
               <div className="flex items-center gap-2">
                 <div className="flex-1 font-medium">
                  <InputField
                      label="GSTIN"
                      value={form.gstin}
                      onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                      disabled={isInactive}
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      maxLength={15}
                  />
                </div>
                 {/* Spacer */}
                <div className="w-[38px]"></div>
              </div>
            </div>

            {/* 20. Order Booker (Right) */}
            <div className="col-span-12 mb-5 md:col-span-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-medium">
                   <SearchableSelect
                      label="Order Booker"
                      options={employees}
                      value={form.orderBookerId}
                      onChange={(val) => update("orderBookerId", val)}
                      placeholder="--select order booker--"
                      direction="up"
                      disabled={isInactive}
                   />
                 </div>
                 {(!isEditMode && hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE)) && (
                   <button
                      type="button"
                      className={`p-2 mt-6 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                      disabled={isInactive}
                      onClick={() => navigate("/app/hr/newemployee", { state: { returnTo: location.pathname, field: "orderBooker", from: location.pathname, preservedState: form } })}
                   >
                      <Star size={16} />
                   </button>
                 )}
               </div>
            </div>

          </div>
          </ContentCard>

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
                  <InputField
                      label="Country Name"
                      required
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
                  <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-800' : theme === 'purple' ? 'text-purple-900' : 'text-gray-300'}`}>Country *</label>
                  <SearchableSelect
                      options={countries.map(c => ({ id: c.Id ?? c.id ?? c.CountryId ?? c.countryId, name: c.CountryName || c.name || c.countryName }))}
                      value={newState.countryId}
                      onChange={(val) => setNewState({ ...newState, countryId: val })}
                      placeholder="Select Country"
                  />
              </div>
              <div>
                  <InputField
                      label="State Name"
                      required
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
                      <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-800' : theme === 'purple' ? 'text-purple-900' : 'text-gray-300'}`}>Country *</label>
                      <SearchableSelect
                          options={countries.map(c => ({ id: c.Id ?? c.id ?? c.CountryId ?? c.countryId, name: c.CountryName || c.name || c.countryName }))}
                          value={newCity.countryId}
                          onChange={(val) => setNewCity(prev => ({ ...prev, countryId: val, stateId: "" }))}
                          placeholder="Select Country"
                      />
                  </div>
                  <div>
                      <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-800' : theme === 'purple' ? 'text-purple-900' : 'text-gray-300'}`}>State *</label>
                      <SearchableSelect
                           options={(statesMaster || [])
                              .filter(s => !newCity.countryId || String(s.CountryId ?? s.countryId) === String(newCity.countryId))
                              .map(s => ({ id: s.Id ?? s.id ?? s.StateId ?? s.stateId, name: s.StateName || s.name || s.stateName }))}
                          value={newCity.stateId}
                          onChange={(val) => setNewCity(prev => ({ ...prev, stateId: val }))}
                          placeholder="Select State"
                      />
                  </div>
              </div>
              <div>
                  <InputField
                      label="City Name"
                      required
                      value={newCity.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCity(prev => ({ ...prev, name: val }));
                      }}
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
                  <InputField
                      label="Group Name"
                      required
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
                  <InputField
                      label="Region Name"
                      required
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      placeholder="Enter Region Name"
                  />
              </div>
          </div>
        </AddModal>

    </PageLayout>
  );
};

export default NewSupplier;


