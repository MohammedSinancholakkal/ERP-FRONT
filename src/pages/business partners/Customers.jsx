import MasterTable from "../../components/MasterTable";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
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
import { useEffect, useState } from "react";
import { useDashboard } from "../../context/DashboardContext";


const Customers = () => {
  const navigate = useNavigate();
  const { invalidateDashboard } = useDashboard();

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
    address: true,
    customerGroupName: true,
    postalCode: true,
    phone: true,
    fax: true,
    website: true,
    email: true,
    emailAddress: true,
    previousCreditBalance: true,
    pan: true,
    gstin: true,
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
      await restoreCustomerApi(customer.id, { userId: 1 }); 
      
      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Customer has been restored successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      setInactiveRows(prev => prev.filter(r => r.id !== customer.id));
      invalidateDashboard();
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
    addressLine1: r.addressLine1 ?? r.AddressLine1 ?? "",
    addressLine2: r.addressLine2 ?? r.AddressLine2 ?? "",
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
    pan: r.pan ?? r.PAN ?? "",
    gstin: r.gstin ?? r.GSTTIN ?? r.GSTIN ?? "",
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
        <div className="flex flex-col h-full overflow-hidden gap-2">
        <h2 className="text-2xl font-semibold mb-4">Customers</h2>

        <MasterTable
          columns={[
             visibleColumns.id && { key: "id", label: "ID", sortable: true },
             visibleColumns.companyName && { key: "companyName", label: "Company Name", sortable: true },
             visibleColumns.contactName && { key: "contactName", label: "Contact Name", sortable: true },
             visibleColumns.contactTitle && { key: "contactTitle", label: "Contact Title", sortable: true },
             visibleColumns.countryName && { 
                 key: "countryName", 
                 label: "Country", 
                 sortable: true,
                 render: (r) => lookupMaps.countries[String(r.countryId)] || r.countryName || "" 
             },
             visibleColumns.stateName && { 
                 key: "stateName", 
                 label: "State", 
                 sortable: true,
                 render: (r) => lookupMaps.states[String(r.stateId)] || r.stateName || "" 
             },
             visibleColumns.cityName && { 
                 key: "cityName", 
                 label: "City", 
                 sortable: true,
                 render: (r) => lookupMaps.cities[String(r.cityId)] || r.cityName || "" 
             },
             visibleColumns.regionName && { 
                 key: "regionName", 
                 label: "Region", 
                 sortable: true,
                 render: (r) => lookupMaps.regions[String(r.regionId)] || r.regionName || "" 
             },
             visibleColumns.address && { 
                 key: "address", 
                 label: "Address", 
                 sortable: true,
                 render: (r) => `${r.addressLine1 || ""} ${r.addressLine2 || ""}`.trim()
             },
              visibleColumns.customerGroupName && { 
                 key: "customerGroupName", 
                 label: "Group", 
                 sortable: true,
                 render: (r) => lookupMaps.groups[String(r.customerGroupId)] || r.customerGroupName || "" 
             },
             visibleColumns.postalCode && { key: "postalCode", label: "Postal Code", sortable: true },
             visibleColumns.phone && { key: "phone", label: "Phone", sortable: true },
             visibleColumns.fax && { key: "fax", label: "Fax", sortable: true },
             visibleColumns.website && { key: "website", label: "Website", sortable: true, className: "truncate max-w-[150px]" },
             visibleColumns.email && { key: "email", label: "Email", sortable: true, className: "truncate max-w-[150px]" },
             visibleColumns.emailAddress && { key: "emailAddress", label: "Email Address", sortable: true, className: "truncate max-w-[150px]" },
             visibleColumns.previousCreditBalance && { key: "previousCreditBalance", label: "Prev. Credit", sortable: true },

             visibleColumns.pan && { key: "pan", label: "PAN", sortable: true },
             visibleColumns.gstin && { key: "gstin", label: "GSTIN", sortable: true },
             visibleColumns.salesMan && { key: "salesMan", label: "Sales Man", sortable: true },
             visibleColumns.orderBooker && { key: "orderBooker", label: "Order Booker", sortable: true },
          ].filter(Boolean)}
          data={paginatedData}
          inactiveData={inactiveRows}
          showInactive={showInactive}
          sortConfig={sortConfig}
          onSort={handleSort}
          onRowClick={(item, isInactive) => {
               if (isInactive) {
                 handleRestore(item);
               } else {
                 navigate(
                   item.id
                     ? `/app/businesspartners/newcustomer/${item.id}`
                     : "/app/businesspartners/newcustomer",
                   { state: { customer: item, isInactive: false } }
                 );
               }
          }}
          // Action Props
          search={searchText}
          onSearch={setSearchText}
          onCreate={() => navigate("/app/businesspartners/newcustomer")}
          createLabel="New Customer"
          permissionCreate={hasPermission(PERMISSIONS.CUSTOMERS.CREATE)}
          onRefresh={() => {
              setSearchText("");
              setPage(1);
              loadCustomers();
          }}
          onColumnSelector={() => {
              setTempVisibleColumns(visibleColumns);
              setColumnModalOpen(true);
          }}
          onToggleInactive={toggleInactive}
        >
             <div className="">
               <FilterBar filters={filterFilters} onClear={handleResetFilters} />
             </div>
        </MasterTable>
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



