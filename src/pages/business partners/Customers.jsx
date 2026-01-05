// src/pages/customers/Customers.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
} from "lucide-react";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import SortableHeader from "../../components/SortableHeader";
import FilterBar from "../../components/FilterBar";
import toast from "react-hot-toast";
import {
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  getRegionsApi,
  getCustomerGroupsApi,
  getCustomersApi,
  searchCustomerApi,
  getInactiveCustomersApi,
  restoreCustomerApi,
} from "../../services/allAPI";
import Swal from "sweetalert2";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const Customers = () => {
  const navigate = useNavigate();

  // -------------------------------
  // Column visibility
  // -------------------------------
  const defaultColumns = {
    id: true,
    companyName: true,
    contactName: true,
    contactTitle: true,
    countryName: true,
    stateName: true,
    cityName: true,
    regionName: true,
    customerGroupName: true,
    postalCode: true,
    phone: true,
    fax: true,
    website: true,
    email: true,
    emailAddress: true,
    previousCreditBalance: true,
    cnic: true,
    ntn: true,
    strn: true,
    salesMan: true,
    orderBooker: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // -------------------------------
  // Filters
  // -------------------------------
  // --------------------------------------
  // Filters
  // --------------------------------------
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  /* Data State */
  const [allCustomers, setAllCustomers] = useState([]); // Stores all active customers
  const [filteredCustomers, setFilteredCustomers] = useState([]); // Stores filtered active customers
  
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [lookupMaps, setLookupMaps] = useState({
    countries: {},
    states: {},
    cities: {},
    regions: {},
    groups: {},
  });
  const [lookupLists, setLookupLists] = useState({
    countries: [],
    states: [],
    cities: [],
    regions: [],
    groups: [],
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // --------------------------------------
  // Search
  // --------------------------------------
  const [searchText, setSearchText] = useState("");

  // --------------------------------------
  // Pagination
  // --------------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* ================================
     CLIENT-SIDE FILTERING LOGIC
  =================================*/
  useEffect(() => {
    let result = Array.isArray(allCustomers) ? allCustomers : [];

    // 1. Text Search
    if (searchText.trim()) {
       const q = searchText.toLowerCase();
       result = result.filter(r => 
         Object.values(r).some(val => String(val).toLowerCase().includes(q))
       );
    }

    // 2. Dropdown Filters
    if (filterCountry) result = result.filter(r => String(r.countryId) === String(filterCountry));
    if (filterState) result = result.filter(r => String(r.stateId) === String(filterState));
    if (filterCity) result = result.filter(r => String(r.cityId) === String(filterCity));
    if (filterRegion) result = result.filter(r => String(r.regionId) === String(filterRegion));
    if (filterGroup) result = result.filter(r => String(r.customerGroupId) === String(filterGroup));

    // 3. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = String(a[sortConfig.key] || "").toLowerCase();
        const valB = String(b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredCustomers(result);
    setPage(1); // Reset to page 1 on filter change
  }, [
    allCustomers,
    searchText,
    filterCountry,
    filterState,
    filterCity,
    filterRegion,
    filterGroup,
    sortConfig
  ]);

  /* Pagination Calculations */
  const totalRecords = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startIdx = (page - 1) * limit;
  const paginatedData = filteredCustomers.slice(startIdx, startIdx + limit);
  const start = totalRecords === 0 ? 0 : startIdx + 1;
  const end = Math.min(startIdx + limit, totalRecords);

  const loadInactiveCustomers = async () => {
    try {
      // Intentionally NOT setting global loading to true to avoid hiding active table
      const res = await getInactiveCustomersApi();
      const records = parseArrayFromResponse(res);
      setInactiveRows(records.map(r => ({ ...normalizeRow(r), isInactive: true })));
    } catch (err) {
      console.error("load inactive customers error", err);
      toast.error("Failed to load inactive customers");
    }
  };

  const handleRestore = async (customer) => {
    const result = await Swal.fire({
      title: "Restore Customer?",
      text: `Are you sure you want to restore ${customer.companyName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      // Show loading (optional, but good UX if api is slow)
      // Swal.showLoading(); 
      // User requested "avoid unusual loadings", so maybe just subtle or no global loader.
      // But we need to know it finished.
      
      await restoreCustomerApi(customer.id, { userId: 1 }); // Assuming userId: 1 as per delete implementation
      
      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Customer has been restored successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      setInactiveRows(prev => prev.filter(r => r.id !== customer.id));
      loadCustomers(); 

    } catch (err) {
      console.error("restore customer error", err);
      Swal.fire({
        icon: "error",
        title: "Restore Failed",
        text: "Could not restore customer. Please try again.",
      });
    }
  };

  const toggleInactive = async () => {
    const newVal = !showInactive;
    setShowInactive(newVal);
    if (newVal && inactiveRows.length === 0) {
      await loadInactiveCustomers();
    }
  };


  // --------------------------------------
  // Helpers
  // --------------------------------------
  const normalizeRow = (r = {}) => ({
    id: r.id ?? r.Id ?? null,
    companyName: r.companyName ?? r.CompanyName ?? r.name ?? r.Name ?? "",
    contactName: r.contactName ?? r.ContactName ?? "",
    contactTitle: r.contactTitle ?? r.ContactTitle ?? "",
    countryName:
      r.countryName ??
      r.CountryName ??
      r.country_name ??  
      r.country?.name ?? 
      r.country ??       
      r.Country ??
      r.country_label ??
      "",
    stateName:
      r.stateName ??
      r.StateName ??
      r.state_name ??
      r.state?.name ??
      r.state ??
      r.State ??
      r.state_label ??
      "",
    cityName:
      r.cityName ??
      r.CityName ??
      r.city_name ??
      r.city?.name ??
      r.city ??
      r.City ??
      r.city_label ??
      "",
    regionName:
      r.regionName ??
      r.RegionName ??
      r.region_name ??
      r.region?.name ??
      r.region ??
      r.Region ??
      r.region_label ??
      "",
    customerGroupName:
      r.customerGroupName ??
      r.CustomerGroupName ??
      r.groupName ??
      r.GroupName ??
      r.group_name ??
      r.group?.name ??
      r.group ??
      r.Group ??
      "",
    countryId: r.countryId ?? r.CountryId ?? r.country_id ?? (typeof r.country === 'object' ? r.country?.id : r.country) ?? "",
    stateId: r.stateId ?? r.StateId ?? r.state_id ?? (typeof r.state === 'object' ? r.state?.id : r.state) ?? "",
    cityId: r.cityId ?? r.CityId ?? r.city_id ?? (typeof r.city === 'object' ? r.city?.id : r.city) ?? "",
    regionId: r.regionId ?? r.RegionId ?? r.region_id ?? (typeof r.region === 'object' ? r.region?.id : r.region) ?? "",
    customerGroupId:
      r.customerGroupId ?? r.CustomerGroupId ?? r.customer_group_id ?? r.groupId ?? r.GroupId ?? r.group_id ?? (typeof r.group === 'object' ? r.group?.id : r.group) ?? "",
    address: r.address ?? r.Address ?? "",
    postalCode: r.postalCode ?? r.PostalCode ?? "",
    phone: r.phone ?? r.Phone ?? "",
    fax: r.fax ?? r.Fax ?? "",
    website: r.website ?? r.Website ?? "",
    email: r.email ?? r.Email ?? "",
    emailAddress: r.emailAddress ?? r.EmailAddress ?? "",
    previousCreditBalance:
      r.previousCreditBalance ??
      r.PreviousCreditBalance ??
      r.previous_credit_balance ??
      r.previousCredit ??
      r.PreviousCredit ??
      "",
    cnic: r.cnic ?? r.CNIC ?? "",
    ntn: r.ntn ?? r.NTN ?? "",
    strn: r.strn ?? r.STRN ?? "",
    salesMan:
      r.salesMan ??
      r.SalesMan ??
      r.salesManId ??
      r.SalesManId ??
      "",
    orderBooker:
      r.orderBooker ??
      r.OrderBooker ??
      r.orderBookerId ??
      r.OrderBookerId ??
      "",
    vat: r.vat ?? r.VAT ?? "",
  });

  const parseArrayFromResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (res?.data?.records) return res.data.records;
    if (res?.records) return res.records;
    return [];
  };

  const toMap = (arr = [], idKeys = [], labelKeys = []) => {
    const map = {};
    arr.forEach((item) => {
      const id =
        idKeys
          .map((k) => item[k])
          .find((v) => v !== undefined && v !== null) ??
        item.Id ??
        item.id;
      const label =
        labelKeys
          .map((k) => item[k])
          .find((v) => v !== undefined && v !== null && v !== "") ??
        item.name ??
        item.label;
      if (id !== undefined && id !== null) {
        map[String(id)] = label ?? "";
      }
    });
    return map;
  };

  const loadLookups = async () => {
    try {
      const [c, s, ci, r, g] = await Promise.all([
        getCountriesApi(1, 5000),
        getStatesApi(1, 5000),
        getCitiesApi(1, 5000),
        getRegionsApi(1, 5000),
        getCustomerGroupsApi(1, 5000),
      ]);

      const countries = parseArrayFromResponse(c);
      const states = parseArrayFromResponse(s);
      const cities = parseArrayFromResponse(ci);
      const regions = parseArrayFromResponse(r);
      const groups = parseArrayFromResponse(g);

      setLookupLists({
        countries,
        states,
        cities,
        regions,
        groups,
      });

      setLookupMaps({
        countries: toMap(countries, ["Id", "id", "CountryId"], ["CountryName", "name", "label"]),
        states: toMap(states, ["Id", "id", "StateId"], ["StateName", "name", "label"]),
        cities: toMap(cities, ["Id", "id", "CityId"], ["CityName", "name", "label"]),
        regions: toMap(regions, ["Id", "id", "regionId", "RegionId"], ["RegionName", "regionName", "name", "label"]),
        groups: toMap(groups, ["Id", "id", "CustomerGroupId", "groupId"], ["GroupName", "groupName", "CustomerGroupName", "name", "label"]),
      });
    } catch (err) {
      console.error("lookup load error", err);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomersApi(1, 5000); // Fetch all for client-side
      const records = parseArrayFromResponse(res);
      setAllCustomers(records.map(normalizeRow));
    } catch (err) {
      console.error("load customers error", err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Deprecated handleSearch - search is now effect-based


  useEffect(() => {
    loadCustomers();
    loadLookups();
  }, []);

  // -------------------------------
  // Filter Config
  // -------------------------------
  const filterFilters = [
    {
      label: "Country",
      options: lookupLists.countries.map(x => ({ id: x.Id ?? x.id, name: x.CountryName ?? x.name })),
      value: filterCountry,
      onChange: (val) => setFilterCountry(val),
      placeholder: "Select Country"
    },
    {
      label: "State",
      options: lookupLists.states.map(x => ({ id: x.Id ?? x.id, name: x.StateName ?? x.name })),
      value: filterState,
      onChange: (val) => setFilterState(val),
      placeholder: "Select State"
    },
    {
      label: "City",
      options: lookupLists.cities.map(x => ({ id: x.Id ?? x.id, name: x.CityName ?? x.name })),
      value: filterCity,
      onChange: (val) => setFilterCity(val),
      placeholder: "Select City"
    },
    {
      label: "Region",
      options: lookupLists.regions.map(x => ({ id: x.Id ?? x.id, name: x.RegionName ?? x.regionName ?? x.name ?? x.Name ?? x.label })),
      value: filterRegion,
      onChange: (val) => setFilterRegion(val),
      placeholder: "Select Region"
    },
    {
      label: "Group",
      options: lookupLists.groups.map(x => ({ id: x.Id ?? x.id, name: x.GroupName ?? x.CustomerGroupName ?? x.name })),
      value: filterGroup,
      onChange: (val) => setFilterGroup(val),
      placeholder: "Select Group"
    }
  ];

  const handleResetFilters = () => {
    setFilterCountry("");
    setFilterState("");
    setFilterCity("");
    setFilterRegion("");
    setFilterGroup("");
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <>
      {/* COLUMN PICKER MODAL */}
      <ColumnPickerModal 
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* MAIN PAGE */}
         <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
        <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Customers</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search customers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {hasPermission(PERMISSIONS.CUSTOMERS.CREATE) && (
          <button
            onClick={() => navigate("/app/businesspartners/newcustomer")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Customer
          </button>
          )}

          <button
            onClick={() => {
              setSearchText("");
              setPage(1);
              loadCustomers();
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <button
            onClick={() => {
              setTempVisibleColumns(visibleColumns);
              setColumnModalOpen(true);
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>

          <button 
             onClick={toggleInactive}
             className={`p-2 border border-gray-600 rounded flex items-center gap-1 ${showInactive ? 'bg-gray-700' : 'bg-gray-700'}`}
           >
             <ArchiveRestore size={16} className={showInactive ? "text-yellow-400" : "text-yellow-300"} />
             <span className={`text-xs ${showInactive ? "opacity-100 font-bold text-yellow-100" : "opacity-80"}`}>
               {showInactive ? " Inactive" : " Inactive"}
             </span>
           </button>
        </div>

        {/* FILTER BAR */}
        <div className="mb-4">
          <FilterBar filters={filterFilters} onClear={handleResetFilters} />
        </div>

      {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[3300px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10 h-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                  {visibleColumns.companyName && <SortableHeader label="Company Name" sortOrder={sortConfig.key === "companyName" ? sortConfig.direction : null} onClick={() => handleSort("companyName")} />}
                  {visibleColumns.contactName && <SortableHeader label="Contact Name" sortOrder={sortConfig.key === "contactName" ? sortConfig.direction : null} onClick={() => handleSort("contactName")} />}
                  {visibleColumns.contactTitle && <SortableHeader label="Contact Title" sortOrder={sortConfig.key === "contactTitle" ? sortConfig.direction : null} onClick={() => handleSort("contactTitle")} />}
                  {visibleColumns.countryName && <SortableHeader label="Country" sortOrder={sortConfig.key === "countryName" ? sortConfig.direction : null} onClick={() => handleSort("countryName")} />}
                  {visibleColumns.stateName && <SortableHeader label="State" sortOrder={sortConfig.key === "stateName" ? sortConfig.direction : null} onClick={() => handleSort("stateName")} />}
                  {visibleColumns.cityName && <SortableHeader label="City" sortOrder={sortConfig.key === "cityName" ? sortConfig.direction : null} onClick={() => handleSort("cityName")} />}
                  {visibleColumns.regionName && <SortableHeader label="Region" sortOrder={sortConfig.key === "regionName" ? sortConfig.direction : null} onClick={() => handleSort("regionName")} />}
                  {visibleColumns.customerGroupName && <SortableHeader label="Group" sortOrder={sortConfig.key === "customerGroupName" ? sortConfig.direction : null} onClick={() => handleSort("customerGroupName")} />}
                  {visibleColumns.postalCode && <SortableHeader label="Postal Code" sortOrder={sortConfig.key === "postalCode" ? sortConfig.direction : null} onClick={() => handleSort("postalCode")} />}
                  {visibleColumns.phone && <SortableHeader label="Phone" sortOrder={sortConfig.key === "phone" ? sortConfig.direction : null} onClick={() => handleSort("phone")} />}
                  {visibleColumns.fax && <SortableHeader label="Fax" sortOrder={sortConfig.key === "fax" ? sortConfig.direction : null} onClick={() => handleSort("fax")} />}
                  {visibleColumns.website && <SortableHeader label="Website" sortOrder={sortConfig.key === "website" ? sortConfig.direction : null} onClick={() => handleSort("website")} />}
                  {visibleColumns.email && <SortableHeader label="Email" sortOrder={sortConfig.key === "email" ? sortConfig.direction : null} onClick={() => handleSort("email")} />}
                  {visibleColumns.emailAddress && <SortableHeader label="Email Address" sortOrder={sortConfig.key === "emailAddress" ? sortConfig.direction : null} onClick={() => handleSort("emailAddress")} />}
                  {visibleColumns.previousCreditBalance && <SortableHeader label="Prev. Credit" sortOrder={sortConfig.key === "previousCreditBalance" ? sortConfig.direction : null} onClick={() => handleSort("previousCreditBalance")} />}
                  {visibleColumns.cnic && <SortableHeader label="CNIC" sortOrder={sortConfig.key === "cnic" ? sortConfig.direction : null} onClick={() => handleSort("cnic")} />}
                  {visibleColumns.ntn && <SortableHeader label="NTN" sortOrder={sortConfig.key === "ntn" ? sortConfig.direction : null} onClick={() => handleSort("ntn")} />}
                  {visibleColumns.strn && <SortableHeader label="STRN" sortOrder={sortConfig.key === "strn" ? sortConfig.direction : null} onClick={() => handleSort("strn")} />}
                  {visibleColumns.salesMan && <SortableHeader label="Sales Man" sortOrder={sortConfig.key === "salesMan" ? sortConfig.direction : null} onClick={() => handleSort("salesMan")} />}
                  {visibleColumns.orderBooker && <SortableHeader label="Order Booker" sortOrder={sortConfig.key === "orderBooker" ? sortConfig.direction : null} onClick={() => handleSort("orderBooker")} />}
                </tr>
              </thead>

              <tbody className="text-center h-14">
                {loading ? (
                  <tr>
                    <td colSpan={20} className="py-6 text-center text-gray-300">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  <>
                  {/* ACTIVE DATA */}
                  {paginatedData.length === 0 ? (
                     (!showInactive || inactiveRows.length === 0) && (
                        <tr>
                          <td colSpan={20} className="py-6 text-center text-gray-400">
                            No customers found
                          </td>
                        </tr>
                     )
                  ) : (
                    paginatedData.map((r) => (
                    <tr
                      key={r.id ?? Math.random()}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                      onClick={() =>
                        navigate(
                          r.id
                            ? `/app/businesspartners/newcustomer/${r.id}`
                            : "/app/businesspartners/newcustomer",
                          { state: { customer: r, isInactive: false } }
                        )
                      }
                    >
                      {visibleColumns.id && <td className="py-2">{r.id}</td>}
                      {visibleColumns.companyName && <td className="py-2">{r.companyName}</td>}
                      {visibleColumns.contactName && <td className="py-2">{r.contactName}</td>}
                      {visibleColumns.contactTitle && <td className="py-2">{r.contactTitle}</td>}
                      {visibleColumns.countryName && (
                        <td className="py-2">
                          {lookupMaps.countries[String(r.countryId)] || r.countryName || ""}
                        </td>
                      )}
                      {visibleColumns.stateName && (
                        <td className="py-2">
                          {lookupMaps.states[String(r.stateId)] || r.stateName || ""}
                        </td>
                      )}
                      {visibleColumns.cityName && (
                        <td className="py-2">
                          {lookupMaps.cities[String(r.cityId)] || r.cityName || ""}
                        </td>
                      )}
                      {visibleColumns.regionName && (
                        <td className="py-2">
                          {lookupMaps.regions[String(r.regionId)] || r.regionName || ""}
                        </td>
                      )}
                      {visibleColumns.customerGroupName && (
                        <td className="py-2">
                          {lookupMaps.groups[String(r.customerGroupId)] ||
                            r.customerGroupName ||
                            ""}
                        </td>
                      )}
                      {visibleColumns.postalCode && <td className="py-2">{r.postalCode}</td>}
                      {visibleColumns.phone && <td className="py-2">{r.phone}</td>}
                      {visibleColumns.fax && <td className="py-2">{r.fax}</td>}
                      {visibleColumns.website && (
                        <td className="py-2 truncate max-w-[150px]">{r.website}</td>
                      )}
                      {visibleColumns.email && (
                        <td className="py-2 truncate max-w-[150px]">{r.email}</td>
                      )}
                      {visibleColumns.emailAddress && (
                        <td className="py-2 truncate max-w-[150px]">{r.emailAddress}</td>
                      )}
                      {visibleColumns.previousCreditBalance && (
                        <td className="py-2">{r.previousCreditBalance}</td>
                      )}
                      {visibleColumns.cnic && <td className="py-2">{r.cnic}</td>}
                      {visibleColumns.ntn && <td className="py-2">{r.ntn}</td>}
                      {visibleColumns.strn && <td className="py-2">{r.strn}</td>}
                      {visibleColumns.salesMan && <td className="py-2">{r.salesMan}</td>}
                      {visibleColumns.orderBooker && <td className="py-2">{r.orderBooker}</td>}
                    </tr>
                  ))
                  )}

                  {/* INACTIVE DATA (APPENDED) */}
                  {showInactive && inactiveRows.map((r) => (
                    <tr
                      key={`inactive-${r.id}`}
                      className="bg-gray-700/50 opacity-60 line-through grayscale cursor-pointer"
                      onClick={() => handleRestore(r)}
                    >
                      {visibleColumns.id && <td className="py-2">{r.id}</td>}
                      {visibleColumns.companyName && <td className="py-2">{r.companyName}</td>}
                      {visibleColumns.contactName && <td className="py-2">{r.contactName}</td>}
                      {visibleColumns.contactTitle && <td className="py-2">{r.contactTitle}</td>}
                      {visibleColumns.countryName && (
                        <td className="py-2">
                          {lookupMaps.countries[String(r.countryId)] || r.countryName || ""}
                        </td>
                      )}
                      {visibleColumns.stateName && (
                        <td className="py-2">
                          {lookupMaps.states[String(r.stateId)] || r.stateName || ""}
                        </td>
                      )}
                      {visibleColumns.cityName && (
                        <td className="py-2">
                          {lookupMaps.cities[String(r.cityId)] || r.cityName || ""}
                        </td>
                      )}
                      {visibleColumns.regionName && (
                        <td className="py-2">
                          {lookupMaps.regions[String(r.regionId)] || r.regionName || ""}
                        </td>
                      )}
                      {visibleColumns.customerGroupName && (
                        <td className="py-2">
                          {lookupMaps.groups[String(r.customerGroupId)] ||
                            r.customerGroupName ||
                            ""}
                        </td>
                      )}
                      {visibleColumns.postalCode && <td className="py-2">{r.postalCode}</td>}
                      {visibleColumns.phone && <td className="py-2">{r.phone}</td>}
                      {visibleColumns.fax && <td className="py-2">{r.fax}</td>}
                      {visibleColumns.website && (
                        <td className="py-2 truncate max-w-[150px]">{r.website}</td>
                      )}
                      {visibleColumns.email && (
                        <td className="py-2 truncate max-w-[150px]">{r.email}</td>
                      )}
                      {visibleColumns.emailAddress && (
                        <td className="py-2 truncate max-w-[150px]">{r.emailAddress}</td>
                      )}
                      {visibleColumns.previousCreditBalance && (
                        <td className="py-2">{r.previousCreditBalance}</td>
                      )}
                      {visibleColumns.cnic && <td className="py-2">{r.cnic}</td>}
                      {visibleColumns.ntn && <td className="py-2">{r.ntn}</td>}
                      {visibleColumns.strn && <td className="py-2">{r.strn}</td>}
                      {visibleColumns.salesMan && <td className="py-2">{r.salesMan}</td>}
                      {visibleColumns.orderBooker && <td className="py-2">{r.orderBooker}</td>}
                    </tr>
                  ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* PAGINATION */}
          <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            total={totalRecords}
            onRefresh={() => {
              setSearchText("");
              setPage(1);
              loadCustomers();
            }}
          />
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default Customers;



