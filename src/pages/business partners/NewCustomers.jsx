import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Save, Star, X, ArrowLeft, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
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
} from "../../services/allAPI";

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
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const ref = useRef(null);
  const searchInputRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ✅ auto focus search
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 0);
    }
  }, [open]);

  const selected = list.find(
    (x) => String(x.id ?? x.Id) === String(valueId)
  );

  const display =
    selected?.label ||
    selected?.name ||
    selected?.CountryName ||
    selected?.StateName ||
    selected?.CityName ||
    selected?.RegionName ||
    selected?.regionName ||
    selected?.GroupName ||
    selected?.groupName ||
    selected?.SupplierGroupName ||
    "";

  const filtered = list.filter((x) => {
    const txt =
      x.label ||
      x.name ||
      x.CountryName ||
      x.StateName ||
      x.CityName ||
      x.RegionName ||
      x.regionName ||
      x.GroupName ||
      x.groupName ||
      x.SupplierGroupName ||
      "";
    return txt.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={ref} className="relative w-full">
      <label className="text-sm text-gray-300 mb-1 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="flex gap-2">
        <div
          onClick={() => setOpen((o) => !o)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm flex justify-between items-center cursor-pointer"
        >
          <span className={display ? "text-white" : "text-gray-500"}>
            {display || "--select--"}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" className="text-gray-400">
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {showStar && (
          <button
            type="button"
            onClick={onAddClick}
            className="p-2 bg-gray-800 border border-gray-600 rounded"
          >
            <Star size={14} className="text-yellow-400" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow">
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-gray-900 px-3 py-2 text-sm border-b border-gray-700 outline-none"
          />

          {/* ✅ FIXED HEIGHT */}
          <div className="max-h-[160px] overflow-y-auto">
            {filtered.length ? (
              filtered.map((item) => (
                <div
                  key={item.id ?? item.Id}
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                >
                  {item.label || item.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400 text-sm">
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const NewCustomers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const [customerGroups, setCustomerGroups] = useState([]);

  const [form, setForm] = useState({
    companyName: "",
    countryId: null,
    stateId: null,
    cityId: null,
    contactName: "",
    contactTitle: "",
    customerGroupId: null,
    regionId: null,
    address: "",
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
    vat: "",
    salesManId: null,
    orderBookerId: null,
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    if (isEditMode) loadCustomerForEdit();
  }, [id]); // eslint-disable-line

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
      setEmployees(
        parseArrayFromResponse(emp).map((e) => ({
          id: e.Id ?? e.id,
          label: `${e.FirstName || e.firstName || ""} ${e.LastName || e.lastName || ""}`,
        }))
      );

      const reg = await getRegionsApi(1, 5000);
      const regArr = parseArrayFromResponse(reg);
      setRegions(regArr);

      const sg = await getSupplierGroupsApi(1, 5000);
      const sgArr = parseArrayFromResponse(sg);
      setCustomerGroups(sgArr);
    } catch (err) {
      console.error("lookup load error", err);
      toast.error("Failed to load lookups");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatesForCountry = (countryId, { preserve = false } = {}) => {
    const filteredStates = (statesMaster || []).filter(
      (s) => String(s.CountryId ?? s.countryId ?? s.countryId) === String(countryId)
    );
    setStates(filteredStates);

    const filteredCities = (citiesMaster || []).filter(
      (c) => String(c.CountryId ?? c.countryId) === String(countryId)
    );
    setCities(filteredCities);

    if (!preserve) {
      setForm((p) => ({ ...p, stateId: null, cityId: null }));
    }
  };

  const loadCitiesForState = (stateId, { preserve = false } = {}) => {
    const filteredCities = (citiesMaster || []).filter(
      (c) => String(c.StateId ?? c.stateId) === String(stateId)
    );
    setCities(filteredCities);
    if (!preserve) {
      setForm((p) => ({ ...p, cityId: null }));
    }
  };

  const loadCustomerForEdit = async () => {
    try {
      setIsLoading(true);

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
          vat: s.VAT ?? s.vat ?? "",
          salesManId: s.SalesManId ?? s.salesManId ?? null,
          orderBookerId: s.OrderBooker ?? s.OrderBookerId ?? s.orderBooker ?? s.orderBookerId ?? null,
        }));

        if (s.CountryId) loadStatesForCountry(s.CountryId, { preserve: true });
        if (s.StateId) loadCitiesForState(s.StateId, { preserve: true });
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

  const openQuickAdd = (key, label) => {
    setQuickAddKey(key);
    setQuickAddLabel(label);
    setQuickAddName("");
    setQuickAddLoading(false);
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
        setCountries((p) => [created, ...p]);
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
        setStates((p) => [created, ...p]);
        setStatesMaster((p) => [created, ...p]);
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
        setCities((p) => [created, ...p]);
        setCitiesMaster((p) => [created, ...p]);
        const newCityId = created.Id ?? created.id;
        update("countryId", countryId);
        update("stateId", stateId);
        update("cityId", newCityId);
      } else if (quickAddKey === "customerGroup") {
        const createdLocal = { id: `t_${Date.now()}`, GroupName: name, name };
        setCustomerGroups((p) => [createdLocal, ...p]);
        update("customerGroupId", createdLocal.id);
      } else if (quickAddKey === "region") {
        const createdLocal = { id: `t_${Date.now()}`, regionName: name, name };
        setRegions((p) => [createdLocal, ...p]);
        update("regionId", createdLocal.id);
      } else if (quickAddKey === "salesMan") {
        const createdLocal = { id: `t_${Date.now()}`, label: name, name };
        setEmployees((p) => [createdLocal, ...p]);
        update("salesManId", createdLocal.id);
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
      const payload = {
        name: nameValue, // backend expects 'Name' column
        companyName: nameValue, // keep alias for consistency
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
        customerGroupId: form.customerGroupId ? Number(form.customerGroupId) : null,
        cnic: form.cnic?.trim() || null,
        ntn: form.ntn?.trim() || null,
        strn: form.strn?.trim() || null,
        salesMan: form.salesManId ? Number(form.salesManId) : null,
        orderBooker: form.orderBookerId ? Number(form.orderBookerId) : null,
        vat: form.vat ? Number(form.vat) : 0,
        userId: 1,
      };

      // call API if present
      if (isEditMode && typeof updateCustomerApi === "function") {
        const res = await updateCustomerApi(id, payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Customer updated");
          navigate("/app/businesspartners/customers");
          return;
        }
      }

      if (!isEditMode && typeof addCustomerApi === "function") {
        const res = await addCustomerApi(payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Customer created");
          navigate("/app/businesspartners/customers");
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
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      if (typeof deleteCustomerApi === "function") {
        await deleteCustomerApi(id, { userId: 1 });
        toast.success("Customer deleted");
        navigate("/app/businesspartners/customers");
        return;
      }
      // fallback
      toast.success("Customer (pretend) deleted");
      navigate("/app/businesspartners/customers");
    } catch (err) {
      console.error("delete customer failed", err);
      toast.error("Delete failed");
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
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-[calc(100vh-80px)] overflow-hidden">
        <div className="h-full overflow-y-auto pr-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/app/businesspartners/customers")} className="p-1">
                <ArrowLeft />
              </button>
              <h2 className="text-2xl font-semibold">
                {isEditMode ? "Edit Customer" : "New Customer"}
              </h2>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={16} /> {isSaving ? "Saving..." : "Save"}
              </button>
              {isEditMode && (
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
                  update("stateId", null);
                  update("cityId", null);
                  loadStatesForCountry(item?.id ?? null);
                }}
                showStar={!isEditMode}
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
                showStar={!isEditMode}
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
                showStar={!isEditMode}
                showPencil={isEditMode}
                onAddClick={() => openQuickAdd("city", "City")}
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
                showStar={!isEditMode}
                showPencil={isEditMode}
                onAddClick={() => openQuickAdd("customerGroup", "Customer Group")}
              />
            </div>

            <div className="col-span-12">
              <label className="text-sm">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
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
                showStar={!isEditMode}
                showPencil={isEditMode}
                onAddClick={() => openQuickAdd("region", "Region")}
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
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">CNIC</label>
              <input
                value={form.cnic}
                onChange={(e) => update("cnic", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">NTN</label>
              <input
                value={form.ntn}
                onChange={(e) => update("ntn", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">STRN</label>
              <input
                value={form.strn}
                onChange={(e) => update("strn", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm">Vat</label>
              <input
                value={form.vat}
                onChange={(e) => update("vat", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="col-span-12 mb-5 md:col-span-6">
              <CustomDropdown
                label="Sales Man"
                list={employees}
                valueId={form.salesManId}
                onSelect={(item) => update("salesManId", item?.id ?? null)}
                showStar={!isEditMode}
                showPencil={isEditMode}
                onAddClick={() => openQuickAdd("salesMan", "Sales Man")}
              />
            </div>

            <div className="col-span-12 mb-5 md:col-span-6">
              <CustomDropdown
                label="Order Booker"
                list={employees}
                valueId={form.orderBookerId}
                onSelect={(item) => update("orderBookerId", item?.id ?? null)}
                showStar={!isEditMode}
                showPencil={isEditMode}
                onAddClick={() => openQuickAdd("orderBooker", "Order Booker")}
              />
            </div>
          </div>
        </div>

{showQuickAdd &&
  ReactDOM.createPortal(
    <div className="fixed inset-0 z-[12000] flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowQuickAdd(false)}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white border border-gray-700 rounded-lg shadow-xl">
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
          {quickAddKey === "state" && (
            <CustomDropdown
              label="Country"
              list={countries.map(c => ({
                id: c.Id ?? c.id,
                label: c.CountryName || c.name,
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

          {quickAddKey === "city" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomDropdown
                label="Country"
                list={countries.map(c => ({
                  id: c.Id ?? c.id,
                  label: c.CountryName || c.name,
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
                list={statesMaster
                  .filter(
                    s =>
                      !quickAddCountryId ||
                      String(s.CountryId) === String(quickAddCountryId)
                  )
                  .map(s => ({
                    id: s.Id ?? s.id,
                    label: s.StateName || s.name,
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
          >
            Cancel
          </button>

          <button
            onClick={saveQuickAdd}
            disabled={quickAddLoading}
            className="px-4 py-2 bg-blue-900/60 border border-blue-700 rounded
                       text-blue-200 hover:bg-blue-900
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

export default NewCustomers;
