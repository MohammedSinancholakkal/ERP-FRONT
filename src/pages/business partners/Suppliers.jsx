import MasterTable from "../../components/MasterTable";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
  import {
  getSuppliersApi,
  searchSupplierApi,
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  getRegionsApi,
  getSupplierGroupsApi,
  getInactiveSuppliersApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { useEffect, useState } from "react";



const Suppliers = () => {
  const navigate = useNavigate();

  // --------------------------------------
  // Column Visibility
  // --------------------------------------
  const defaultColumns = {
    id: true,
    companyName: true,
    contactName: true,
    contactTitle: true,
    countryName: true,
    stateName: true,
    cityName: true,
    regionName: true,
    supplierGroupName: true,
    postalCode: true,
    phone: true,
    fax: true,
    website: true,
    email: true,
    emailAddress: true,
    previousCreditBalance: true,
    orderBooker: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // --------------------------------------
  // Filters
  // --------------------------------------
  // --------------------------------------
  // Filters
  // --------------------------------------
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  /* Data State */
  const [allSuppliers, setAllSuppliers] = useState([]); // Stores all active suppliers
  const [filteredSuppliers, setFilteredSuppliers] = useState([]); // Stores filtered active suppliers
  
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
    let result = Array.isArray(allSuppliers) ? allSuppliers : [];

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
    if (filterGroup) result = result.filter(r => String(r.supplierGroupId) === String(filterGroup));

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

    setFilteredSuppliers(result);
    setPage(1); // Reset to page 1 on filter change
  }, [
    allSuppliers,
    searchText,
    filterCountry,
    filterState,
    filterCity,
    filterRegion,
    filterGroup,
    sortConfig
  ]);


  /* Pagination Calculations */
  const totalRecords = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startIdx = (page - 1) * limit;
  const paginatedData = filteredSuppliers.slice(startIdx, startIdx + limit);
  const start = totalRecords === 0 ? 0 : startIdx + 1;
  const end = Math.min(startIdx + limit, totalRecords);

  // --------------------------------------
  // Helpers
  // --------------------------------------
  const normalizeRow = (r = {}) => ({
    id: r.id ?? r.Id ?? null,
    companyName: r.companyName ?? r.CompanyName ?? "",
    contactName: r.contactName ?? r.ContactName ?? "",
    contactTitle: r.contactTitle ?? r.ContactTitle ?? "",
    countryName:
      r.countryName ??
      r.CountryName ??
      r.country ??
      r.Country ??
      r.country_label ??
      "",
    stateName:
      r.stateName ??
      r.StateName ??
      r.state ??
      r.State ??
      r.state_label ??
      "",
    cityName:
      r.cityName ??
      r.CityName ??
      r.city ??
      r.City ??
      r.city_label ??
      "",
    regionName:
      r.regionName ??
      r.RegionName ??
      r.region ??
      r.Region ??
      r.region_label ??
      "",
    supplierGroupName:
      r.supplierGroupName ??
      r.SupplierGroupName ??
      r.groupName ??
      r.GroupName ??
      r.group ??
      r.Group ??
      r.supplierGroup ??
      "",
    countryId: r.countryId ?? r.CountryId ?? r.country ?? "",
    stateId: r.stateId ?? r.StateId ?? r.state ?? "",
    cityId: r.cityId ?? r.CityId ?? r.city ?? "",
    regionId: r.regionId ?? r.RegionId ?? r.region ?? "",
    supplierGroupId:
      r.supplierGroupId ?? r.SupplierGroupId ?? r.supplierGroup ?? r.group ?? "",
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
      r.previousCredit ??
      r.PreviousCredit ??
      "",

    orderBooker:
      r.orderBooker ??
      r.OrderBooker ??
      r.orderBookerId ??
      r.OrderBookerId ??
      "",

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
        getSupplierGroupsApi(1, 5000),
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
        groups: toMap(groups, ["Id", "id", "SupplierGroupId", "groupId"], ["GroupName", "groupName", "SupplierGroupName", "name", "label"]),
      });
    } catch (err) {
      console.error("lookup load error", err);
    }
  };


  const loadInactiveSuppliers = async () => {
    try {
      // Intentionally NOT setting global loading to true to avoid hiding active table
      const res = await getInactiveSuppliersApi();
      const records = parseArrayFromResponse(res);
      // Mark them as inactive so we can style them
      setInactiveRows(records.map(r => ({ ...normalizeRow(r), isInactive: true })));
    } catch (err) {
      console.error("load inactive suppliers error", err);
      toast.error("Failed to load inactive suppliers");
    }
  };

  const toggleInactive = async () => {
    const newVal = !showInactive;
    setShowInactive(newVal);
    if (newVal && inactiveRows.length === 0) {
      // Only load if not already loaded (or implementation choice: reload every time?)
      // Let's load if empty to save bandwidth, or you can force reload.
      // Given user wants "no extra loading", checking if empty is better, 
      // but refreshing might be needed if user just made one inactive.
      // Let's force load but without UI loader block.
      await loadInactiveSuppliers();
    }
  };


  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await getSuppliersApi(1, 5000); // Fetch all for client-side
      
      let records = [];
      if (res?.data?.records) {
        records = res.data.records;
      } else if (Array.isArray(res?.data)) {
        records = res.data;
      } else if (Array.isArray(res)) {
        records = res;
      }
      setAllSuppliers(records.map(normalizeRow));
    } catch (err) {
      console.error("load suppliers error", err);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  // Deprecated handleSearch - search is now effect-based
  // keeping empty or removing references in JSX to avoid errors
  // We will map inputs to setSearchText directly.

  useEffect(() => {
    loadSuppliers();
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------
  // Filter Config
  // --------------------------------------
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
      label: "Supplier Group",
      options: lookupLists.groups.map(x => ({ id: x.Id ?? x.id, name: x.GroupName ?? x.SupplierGroupName ?? x.name })),
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

  // --------------------------------------
  // Render
  // --------------------------------------
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

      {/* MAIN */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Suppliers</h2>

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
             visibleColumns.supplierGroupName && { 
                 key: "supplierGroupName", 
                 label: "Supplier Group", 
                 sortable: true,
                 render: (r) => lookupMaps.groups[String(r.supplierGroupId)] || r.supplierGroupName || "" 
             },
             visibleColumns.postalCode && { key: "postalCode", label: "Postal", sortable: true },
             visibleColumns.phone && { key: "phone", label: "Phone", sortable: true },
             visibleColumns.fax && { key: "fax", label: "Fax", sortable: true },
             visibleColumns.website && { key: "website", label: "Website", sortable: true, className: "truncate max-w-[150px]" },
             visibleColumns.email && { key: "email", label: "Email", sortable: true, className: "truncate max-w-[150px]" },
             visibleColumns.emailAddress && { key: "emailAddress", label: "Email Address", sortable: true, className: "truncate max-w-[150px]" },
             visibleColumns.previousCreditBalance && { key: "previousCreditBalance", label: "Prev Credit", sortable: true },
             visibleColumns.orderBooker && { key: "orderBooker", label: "Order Booker", sortable: true },
          ].filter(Boolean)}
          data={paginatedData}
          inactiveData={inactiveRows}
          showInactive={showInactive}
          sortConfig={sortConfig}
          onSort={handleSort}
          onRowClick={(item, isInactive) => {
               navigate(
                  item.id
                    ? `/app/businesspartners/newsupplier/${item.id}`
                    : "/app/businesspartners/newsupplier",
                  { state: { supplier: item, isInactive } }
                );
          }}
          // Action Props
          search={searchText}
          onSearch={setSearchText}
          onCreate={() => navigate("/app/businesspartners/newsupplier")}
          createLabel="New Supplier"
          permissionCreate={hasPermission(PERMISSIONS.SUPPLIERS.CREATE)}
          onRefresh={() => {
              setSearchText("");
              setPage(1);
              loadSuppliers();
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
            loadSuppliers();
          }}
        />
        </div>
      </div>
      </PageLayout>

    </>
  );
};

export default Suppliers;