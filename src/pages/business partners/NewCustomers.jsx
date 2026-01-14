import React, { useEffect, useState } from "react";
import { Save, Star, X, ArrowLeft, Trash2 } from "lucide-react";
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
  addCustomerApi,
  updateCustomerApi,
  getCustomerByIdApi,
  deleteCustomerApi,
  searchCustomerApi,
  searchCountryApi,
  searchStateApi,
  searchCityApi,
  searchCustomerGroupApi,
  searchRegionApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";
import { useDashboard } from "../../context/DashboardContext";

const parseArrayFromResponse = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.records) return res.data.records;
  if (res.records) return res.records;
  const maybeArray = Object.values(res).find((v) => Array.isArray(v));
  return Array.isArray(maybeArray) ? maybeArray : [];
};

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
}) => {
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
               // Explicitly handle clear/empty
               if (!id) {
                 onSelect(null);
                 return;
               }
               // Find original item to pass back
               const originalItem = list.find(x => String(x.id ?? x.Id) === String(id));
               onSelect(originalItem);
             }}
            placeholder="--select--"
            direction={direction}
            className="w-full"
          />
        </div>

        {showStar && (
          <button
            type="button"
            onClick={onAddClick}
            className="p-2 bg-gray-800 border border-gray-600 rounded flex items-center justify-center"
          >
            <Star size={14} className="text-yellow-400" />
          </button>
        )}
      </div>
    </div>
  );
};


const NewCustomers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);
  const { invalidateDashboard } = useDashboard();

  // PRE-LOAD DATA FROM NAVIGATION STATE
  const initialCustomer = location.state?.customer;
  
  // Helper to extract initial lists for dropdowns (so they don't show empty ID)
  const initialCountries = initialCustomer?.CountryId ? [{ Id: initialCustomer.CountryId, CountryName: initialCustomer.CountryName || initialCustomer.countryName }] : [];
  const initialStates = initialCustomer?.StateId ? [{ Id: initialCustomer.StateId, StateName: initialCustomer.StateName || initialCustomer.stateName, CountryId: initialCustomer.CountryId }] : [];
  const initialCities = initialCustomer?.CityId ? [{ Id: initialCustomer.CityId, CityName: initialCustomer.CityName || initialCustomer.cityName, StateId: initialCustomer.StateId }] : [];
  const initialRegions = initialCustomer?.RegionId ? [{ regionId: initialCustomer.RegionId, regionName: initialCustomer.RegionName || initialCustomer.regionName }] : [];
  const initialGroups = initialCustomer?.CustomerGroupId ? [{ Id: initialCustomer.CustomerGroupId, GroupName: initialCustomer.CustomerGroupName || initialCustomer.customerGroupName }] : [];
  
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New Modal States
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [addCustomerGroupModalOpen, setAddCustomerGroupModalOpen] = useState(false);
  const [addRegionModalOpen, setAddRegionModalOpen] = useState(false);

  // New Item States
  const [newCountryName, setNewCountryName] = useState("");
  const [newState, setNewState] = useState({ name: "", countryId: "" });
  const [newCity, setNewCity] = useState({ name: "", countryId: "", stateId: "" });
  const [newGroupName, setNewGroupName] = useState("");
  const [newRegionName, setNewRegionName] = useState("");

  // Initialize with placeholders if available
  const [countries, setCountries] = useState(initialCountries);
  const [states, setStates] = useState(initialStates);
  const [cities, setCities] = useState(initialCities);
  const [statesMaster, setStatesMaster] = useState(initialStates); 
  const [citiesMaster, setCitiesMaster] = useState(initialCities); 
  const [employees, setEmployees] = useState([]);
  const [regions, setRegions] = useState(initialRegions);
  const [customerGroups, setCustomerGroups] = useState(initialGroups);

  const [form, setForm] = useState(() => {
    if (isEditMode && initialCustomer) {
       const s = initialCustomer;
       return {
          companyName: s.Name || s.name || s.CompanyName || s.companyName || "",
          countryId: s.CountryId ?? s.countryId ?? null,
          stateId: s.StateId ?? s.stateId ?? null,
          cityId: s.CityId ?? s.cityId ?? null,
          contactName: s.ContactName || s.contactName || "",
          contactTitle: s.ContactTitle || s.contactTitle || "",
          customerGroupId: s.CustomerGroupId ?? s.customerGroupId ?? null,
          regionId: s.RegionId ?? s.regionId ?? null,
          addressLine1: s.AddressLine1 || s.addressLine1 || "",
          addressLine2: s.AddressLine2 || s.addressLine2 || "",
          postalCode: s.PostalCode || s.postalCode || "",
          phone: s.Phone || s.phone || "",
          website: s.Website || s.website || "",
          fax: s.Fax || s.fax || "",
          email: s.Email || s.email || "",
          emailAddress: s.EmailAddress || s.emailAddress || "",
          previousCredit: s.PreviousCreditBalance ?? s.PreviousCredit ?? s.previousCreditBalance ?? s.previousCredit ?? "",

          salesManId: s.SalesMan ?? s.SalesManId ?? s.salesMan ?? s.salesManId ?? null,
          orderBookerId: s.OrderBooker ?? s.OrderBookerId ?? s.orderBooker ?? s.orderBookerId ?? null,
          pan: s.PAN ?? s.pan ?? "",
          gstin: s.GSTTIN ?? s.gstin ?? "",
       };
    }
    return {
      companyName: "",
      countryId: null,
      stateId: null,
      cityId: null,
      contactName: "",
      contactTitle: "",
      customerGroupId: null,
      regionId: null,
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      phone: "",
      website: "",
      fax: "",
      email: "",
      emailAddress: "",
      previousCredit: "",
      pan: "",
      gstin: "",
      salesManId: null,
      orderBookerId: null,
    };
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    loadLookups();
  }, []);

  // Handle return from NewEmployee with new ID
  useEffect(() => {
    if (location.state?.newEmployeeId && location.state?.field) {
        const { newEmployeeId, field } = location.state;
        // Reload employees to ensure the new one is in the list
        getEmployeesApi(1, 5000).then(res => {
            const arr = parseArrayFromResponse(res).map((e) => ({
                id: e.Id ?? e.id,
                label: `${e.FirstName || e.firstName || ""} ${e.LastName || e.lastName || ""}`,
            }));
            setEmployees(arr);
            
            if (field === 'salesMan') {
                update("salesManId", newEmployeeId);
            } else if (field === 'orderBooker') {
                update("orderBookerId", newEmployeeId);
            }
        });
    }
  }, [location.state]);

  useEffect(() => {
    if (isEditMode) loadCustomerForEdit();
  }, [id]); // eslint-disable-line

  const loadLookups = async () => {
    try {
      setIsLoading(true);
      
      const [cRes, sRes, ctRes, empRes, regRes, sgRes] = await Promise.all([
          getCountriesApi(1, 5000),
          getStatesApi(1, 5000),
          getCitiesApi(1, 5000),
          getEmployeesApi(1, 5000),
          getRegionsApi(1, 5000),
          getSupplierGroupsApi(1, 5000)
      ]);

      const countriesArr = parseArrayFromResponse(cRes);
      setCountries(countriesArr);

      const statesArr = parseArrayFromResponse(sRes);
      setStates(statesArr);
      setStatesMaster(statesArr);

      const citiesArr = parseArrayFromResponse(ctRes);
      setCities(citiesArr);
      setCitiesMaster(citiesArr);

      setEmployees(
        parseArrayFromResponse(empRes).map((e) => ({
          id: e.Id ?? e.id,
          label: `${e.FirstName || e.firstName || ""} ${e.LastName || e.lastName || ""}`,
        }))
      );

      setRegions(parseArrayFromResponse(regRes));
      setCustomerGroups(parseArrayFromResponse(sgRes));

    } catch (err) {
      console.error("lookup load error", err);
      toast.error("Failed to load lookups");
    } finally {
      setIsLoading(false);
    }
  };

  // REACTIVE LIST FILTERING
  useEffect(() => {
    if (!form.countryId) {
       setStates([]);
       return;
    }
    const filtered = (statesMaster || []).filter(
      (s) => String(s.CountryId ?? s.countryId ?? s.countryId) === String(form.countryId)
    );
    setStates(filtered);
  }, [form.countryId, statesMaster]);

  useEffect(() => {
    if (!form.stateId) {
        setCities([]);
        return;
    }
    const filtered = (citiesMaster || []).filter(
      (c) => String(c.StateId ?? c.stateId) === String(form.stateId)
    );
    setCities(filtered);
  }, [form.stateId, citiesMaster]);

  const loadCustomerForEdit = async () => {
    try {
      // setIsLoading(true);

      const stateCustomer = location.state?.customer;
      const populate = (s) => {
        if (!s) return;
        const presetStateId = s.StateId ?? s.stateId ?? null;
        const presetCityId = s.CityId ?? s.cityId ?? null;

        setForm((p) => ({
          ...p,
          companyName: s.Name || s.name || s.CompanyName || s.companyName || "",
          countryId: s.CountryId ?? s.countryId ?? null,
          stateId: presetStateId,
          cityId: presetCityId,
          contactName: s.ContactName || s.contactName || "",
          contactTitle: s.ContactTitle || s.contactTitle || "",
          customerGroupId: s.CustomerGroupId ?? s.customerGroupId ?? null,
          addressLine1: s.AddressLine1 || s.addressLine1 || "",
          addressLine2: s.AddressLine2 || s.addressLine2 || "",
          regionId: s.RegionId ?? s.regionId ?? null,
          postalCode: s.PostalCode || s.postalCode || "",
          phone: s.Phone || s.phone || "",
          website: s.Website || s.website || "",
          fax: s.Fax || s.fax || "",
          email: s.Email || s.email || "",
          emailAddress: s.EmailAddress || s.emailAddress || "",
          previousCredit: s.PreviousCreditBalance ?? s.PreviousCredit ?? s.previousCreditBalance ?? s.previousCredit ?? "",

          salesManId: s.SalesMan ?? s.SalesManId ?? s.salesMan ?? s.salesManId ?? null,
          orderBookerId: s.OrderBooker ?? s.OrderBookerId ?? s.orderBooker ?? s.orderBookerId ?? null,
          pan: s.PAN ?? s.pan ?? "",
          gstin: s.GSTTIN ?? s.gstin ?? "",
        }));


      };

      // Prefer data passed from the list to avoid 404s on missing endpoints
      if (stateCustomer) {
        populate(stateCustomer);
        return;
      }

      // Fallback to API if available
      if (typeof getCustomerByIdApi === "function") {
        try {
          const res = await getCustomerByIdApi(id);
          const s = res?.data || res;
          populate(s);
        } catch (apiErr) {
          const status = apiErr?.response?.status;
          if (status === 404) {
            console.warn("Customer detail endpoint not available (404)");
            toast.error("Customer details not available on server (404).");
          } else {
            console.error("load customer failed", apiErr);
            toast.error("Failed to load customer");
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
          // DUPLICATE CHECK
          const duplicateRes = await searchCountryApi(newCountryName.trim());
          const duplicates = parseArrayFromResponse(duplicateRes);
          const isDuplicate = duplicates.some(
            (c) => (c.name || c.CountryName || "").toLowerCase() === newCountryName.trim().toLowerCase()
          );

          if (isDuplicate) {
            toast.error("Country with this name already exists.");
            return;
          }

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
        // DUPLICATE CHECK
        const duplicateRes = await searchStateApi(newState.name.trim());
        const duplicates = parseArrayFromResponse(duplicateRes);
        const isDuplicate = duplicates.some(
          (s) =>
            (s.name || s.StateName || "").toLowerCase() === newState.name.trim().toLowerCase() &&
            Number(s.countryId ?? s.CountryId) === Number(newState.countryId)
        );

        if (isDuplicate) {
          toast.error("State with this name already exists in selected country.");
          return;
        }

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
        
        if (String(created.CountryId) === String(form.countryId)) {
             update("stateId", created.Id ?? created.id);
             update("cityId", null);
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
        // DUPLICATE CHECK
        const duplicateRes = await searchCityApi(newCity.name.trim());
        const duplicates = parseArrayFromResponse(duplicateRes);
        const isDuplicate = duplicates.some(
          (c) =>
            (c.name || c.CityName || "").toLowerCase() === newCity.name.trim().toLowerCase() &&
            Number(c.stateId ?? c.StateId) === Number(newCity.stateId)
        );

        if (isDuplicate) {
          toast.error("City with this name already exists in selected state.");
          return;
        }

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
        console.error("Failed to update city", error);
        toast.error("Failed to add city");
    }
  };

  const handleSaveCustomerGroup = async () => {
      if(!newGroupName.trim()) return toast.error("Group name required");
      
      try {
        // Duplicate check
        const duplicateRes = await searchCustomerGroupApi(newGroupName.trim());
        const duplicates = parseArrayFromResponse(duplicateRes);
        const isDuplicate = duplicates.some(
          (g) => (g.name || g.GroupName || "").toLowerCase() === newGroupName.trim().toLowerCase()
        );
        if (isDuplicate) {
          toast.error("Customer Group with this name already exists.");
          return;
        }

        // Mock API call or Real API if available
        // Note: In a real app we would call addCustomerGroupApi here if available to persist it
        const createdLocal = { id: `t_${Date.now()}`, GroupName: newGroupName.trim(), name: newGroupName.trim() };
        setCustomerGroups(prev => [createdLocal, ...prev]);
        update("customerGroupId", createdLocal.id);
        
        setNewGroupName("");
        setAddCustomerGroupModalOpen(false);
        toast.success("Group added");
      } catch (err) {
        console.error("Failed to add group", err);
        toast.error("Failed to add group");
      }
  };

  const handleSaveRegion = async () => {
      if(!newRegionName.trim()) return toast.error("Region name required");
      try {
        // Duplicate check
        const duplicateRes = await searchRegionApi(newRegionName.trim());
        const duplicates = parseArrayFromResponse(duplicateRes);
        const isDuplicate = duplicates.some(
            (r) => (r.name || r.regionName || r.RegionName || "").toLowerCase() === newRegionName.trim().toLowerCase()
        );

        if (isDuplicate) {
            toast.error("Region with this name already exists.");
            return;
        }

        // Mock
        const createdLocal = { id: `t_${Date.now()}`, regionName: newRegionName.trim(), name: newRegionName.trim() };
        setRegions(prev => [createdLocal, ...prev]);
        update("regionId", createdLocal.id);

        setNewRegionName("");
        setAddRegionModalOpen(false);
        toast.success("Region added");
      } catch (err) {
        console.error("Failed to add region", err);
        toast.error("Failed to add region");
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
    if (form.email && !emailRegex.test(form.email)) return "Email is not valid";
    if (form.phone && !phoneRegex.test(form.phone)) return "Phone is not valid";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) return toast.error(err);

    try {
      setIsSaving(true);
      const nameValue = form.companyName?.trim() || null;

      // --- DUPLICATE CHECKS START ---
      const [nameRes, phoneRes, emailRes, panRes, gstinRes] = await Promise.all([
        searchCustomerApi(nameValue),
        form.phone ? searchCustomerApi(form.phone) : Promise.resolve({ data: [] }),
        form.email ? searchCustomerApi(form.email) : Promise.resolve({ data: [] }),
        form.pan ? searchCustomerApi(form.pan) : Promise.resolve({ data: [] }),
        form.gstin ? searchCustomerApi(form.gstin) : Promise.resolve({ data: [] }),
      ]);

      const nameDuplicates = parseArrayFromResponse(nameRes);
      const phoneDuplicates = parseArrayFromResponse(phoneRes);
      const emailDuplicates = parseArrayFromResponse(emailRes);
      const panDuplicates = parseArrayFromResponse(panRes);
      const gstinDuplicates = parseArrayFromResponse(gstinRes);

      const isDuplicateName = nameDuplicates.some(
        (i) =>
            (i.Name || i.name || i.CompanyName || i.companyName || "").toLowerCase() === nameValue.toLowerCase() &&
            (!isEditMode || String(i.Id ?? i.id) !== String(id))
      );
      if (isDuplicateName) {
        setIsSaving(false);
        return toast.error("Customer with this Name already exists.");
      }

      if (form.phone) {
        const isDuplicatePhone = phoneDuplicates.some(
            (i) =>
            (i.Phone || i.phone || "") === form.phone &&
            (!isEditMode || String(i.Id ?? i.id) !== String(id))
        );
        if (isDuplicatePhone) {
            setIsSaving(false); // Stop loading!
            return toast.error("Customer with this Phone already exists.");
        }
      }

      if (form.email) {
        const isDuplicateEmail = emailDuplicates.some(
            (i) =>
            (i.Email || i.email || "").toLowerCase() === form.email.toLowerCase() &&
            (!isEditMode || String(i.Id ?? i.id) !== String(id))
        );
        if (isDuplicateEmail) {
            setIsSaving(false);
            return toast.error("Customer with this Email already exists.");
        }
      }

      if (form.pan) {
        const isDuplicatePan = panDuplicates.some(
            (i) =>
            (i.PAN || i.pan || "").toLowerCase() === form.pan.toLowerCase() &&
            (!isEditMode || String(i.Id ?? i.id) !== String(id))
        );
        if (isDuplicatePan) {
            setIsSaving(false);
            return toast.error("Customer with this PAN already exists.");
        }
      }

      if (form.gstin) {
        const isDuplicateGstin = gstinDuplicates.some(
            (i) =>
            (i.GSTTIN || i.gstin || "").toLowerCase() === form.gstin.toLowerCase() &&
            (!isEditMode || String(i.Id ?? i.id) !== String(id))
        );
        if (isDuplicateGstin) {
            setIsSaving(false);
            return toast.error("Customer with this GSTIN already exists.");
        }
      }
      // --- DUPLICATE CHECKS END ---

      const payload = {
        name: nameValue, // backend expects 'Name' column
        companyName: nameValue, // keep alias for consistency
        countryId: form.countryId ? Number(form.countryId) : null,
        stateId: form.stateId ? Number(form.stateId) : null,
        cityId: form.cityId ? Number(form.cityId) : null,
        contactName: form.contactName?.trim() || null,
        contactTitle: form.contactTitle?.trim() || null,
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
        customerGroupId: form.customerGroupId ? Number(form.customerGroupId) : null,
        salesMan: form.salesManId ? Number(form.salesManId) : null,
        orderBooker: form.orderBookerId ? Number(form.orderBookerId) : null,
        pan: form.pan?.trim() || null,
        gstin: form.gstin?.trim() || null,
        userId: 1,
      };

      // call API if present
      if (isEditMode && typeof updateCustomerApi === "function") {
        const res = await updateCustomerApi(id, payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Customer updated");
          invalidateDashboard();
          navigate("/app/businesspartners/customers");
          return;
        }
      }

      if (!isEditMode && typeof addCustomerApi === "function") {
        const res = await addCustomerApi(payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Customer created");
          invalidateDashboard();
          if (location.state?.returnTo) {
             navigate(location.state.returnTo, { state: { newCustomerId: res.data?.record?.id || res.data?.id }});
          } else {
             navigate("/app/businesspartners/customers");
          }
          return;
        }
      }

      // fallback (no APIs available)
      console.log("Customer payload:", payload);
      toast.success(isEditMode ? "Customer (pretend) updated" : "Customer (pretend) created");
      navigate("/app/businesspartners/customers");
    } catch (err) {
      console.error("submit customer error", err);
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

const handleDelete = async () => {
  if (!isEditMode) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This customer will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: "Deleting...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    await deleteCustomerApi(id, { userId: 1 });
    Swal.close();

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      timer: 1500,
      showConfirmButton: false,
    });
    
    invalidateDashboard();
    navigate("/app/businesspartners/customers");
  } catch (err) {
    Swal.close();
    Swal.fire({
      icon: "error",
      title: "Delete failed",
      text: "Please try again.",
    });
  }
};


  if (isEditMode && isLoading) {
    return (
      <div className="h-[90vh] flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading customer...</span>
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
                } else if(location.state?.returnTo) {
                   navigate(location.state.returnTo);
                } else {
                   navigate("/app/businesspartners/customers");
                }
              }} className="p-1">
                <ArrowLeft />
              </button>
              <h2 className="text-2xl font-semibold">
                {isEditMode ? "Edit Customer" : "New Customer"}
              </h2>
            </div>

            <div className="flex gap-3">
              {(isEditMode ? hasPermission(PERMISSIONS.CUSTOMERS.EDIT) : hasPermission(PERMISSIONS.CUSTOMERS.CREATE)) && (
              <button
                onClick={submit}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={16} /> {isSaving ? "Saving..." : "Save"}
              </button>
              )}
              {isEditMode && hasPermission(PERMISSIONS.CUSTOMERS.DELETE) && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-800 border border-red-600 px-4 py-2 rounded text-red-200"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mx-2">
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">* Name</label>
              <input
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <CustomDropdown
                label="Country"
                list={countries.map((c) => ({
                  id: c.Id ?? c.id,
                  label: c.CountryName ?? c.name,
                }))}
                valueId={form.countryId}
                required
                onSelect={(item) => {
                  update("countryId", item?.id ?? null);
                  // Reset dependent fields only on manual change
                  update("stateId", null);
                  update("cityId", null);
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
                  // Reset dependent fields only on manual change
                  update("cityId", null);
                }}
                showStar={!isEditMode && hasPermission(PERMISSIONS.STATES.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => {
                  setNewState(prev => ({ ...prev, countryId: form.countryId }));
                  setAddStateModalOpen(true);
                }}
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
                onAddClick={() => {
                  setNewCity(prev => ({ ...prev, countryId: form.countryId, stateId: form.stateId }));
                  setAddCityModalOpen(true);
                }}
              />
            </div>

            <div className="col-span-12 md:col-span-4">
              <label className="text-sm">Contact Name</label>
              <input
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <label className="text-sm">Contact Title</label>
              <input
                value={form.contactTitle}
                onChange={(e) => update("contactTitle", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <CustomDropdown
                label="Customer Group"
                list={customerGroups.map((g) => ({
                  id: g.Id ?? g.id,
                  label: g.GroupName ?? g.groupName ?? g.name ?? "",
                }))}
                valueId={form.customerGroupId}
                onSelect={(it) => update("customerGroupId", it?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.CUSTOMER_GROUPS.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => setAddCustomerGroupModalOpen(true)}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Address Line 1</label>
              <textarea
                value={form.addressLine1}
                onChange={(e) => update("addressLine1", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 min-h-[70px]"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Address Line 2</label>
              <textarea
                value={form.addressLine2}
                onChange={(e) => update("addressLine2", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 min-h-[70px]"
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <CustomDropdown
                label="Region"
                list={regions.map((r) => ({
                  id: r.regionId ?? r.Id ?? r.id,
                  label: r.regionName ?? r.RegionName ?? r.name ?? "",
                }))}
                valueId={form.regionId}
                onSelect={(it) => update("regionId", it?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.REGIONS.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => setAddRegionModalOpen(true)}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="text-sm">Postal Code</label>
              <input
                value={form.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="text-sm">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">PAN</label>
                  <input
                    value={form.pan}
                    onChange={(e) => update("pan", e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm">GSTIN</label>
                  <input
                    value={form.gstin}
                    onChange={(e) => update("gstin", e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Website</label>
              <input
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Fax</label>
              <input
                value={form.fax}
                onChange={(e) => update("fax", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Email Address</label>
              <input
                value={form.emailAddress}
                onChange={(e) => update("emailAddress", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Email</label>
              <input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">* Previous Credit Balance</label>
              <input
                value={form.previousCredit}
                onChange={(e) => update("previousCredit", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>


            <div className="col-span-12 mb-5 md:col-span-6">
              <CustomDropdown
                label="Sales Man"
                list={employees}
                valueId={form.salesManId}
                onSelect={(item) => update("salesManId", item?.id ?? null)}
                showStar={!isEditMode && hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE)}
                showPencil={isEditMode}
                onAddClick={() => navigate("/app/hr/newemployee", { state: { returnTo: location.pathname, field: "salesMan", from: location.pathname } })}
                direction="up"
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
                          onChange={(val) => setNewCity(prev => ({ ...prev, countryId: val, stateId: "" }))}
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
                          onChange={(val) => setNewCity(prev => ({ ...prev, stateId: val }))}
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
            ADD CUSTOMER GROUP MODAL 
        ============================== */}
        <AddModal
          isOpen={addCustomerGroupModalOpen}
          onClose={() => setAddCustomerGroupModalOpen(false)}
          onSave={handleSaveCustomerGroup}
          title="Add Customer Group"
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

export default NewCustomers;
