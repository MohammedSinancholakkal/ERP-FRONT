// src/pages/employees/Employees.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import {
  getEmployeesApi,
  getDesignationsApi,
  getDepartmentsApi,
  getCountriesApi,
  getStatesApi,
  getCitiesApi,
  getRegionsApi,
  getTerritoriesApi,
  getInactiveEmployeesApi,
  restoreEmployeeApi,
  getBanksApi
} from "../../services/allAPI";
import toast from "react-hot-toast";

const Employees = () => {
  const navigate = useNavigate();

  // -----------------------------------
  // COLUMN VISIBILITY
  // -----------------------------------
  const defaultColumns = {
    id: true,
    firstName: true,
    lastName: true,
    designation: true,
    department: true,
    rateType: true,
    phone: true,
    hourRateSalary: true,
    email: true,
    bloodGroup: true,
    countryName: true,
    stateName: true,
    cityName: true,
    zipCode: true,
    address: true,
    userId: true,
    regionName: true,
    territory: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // -----------------------------------
  // FILTERS
  // -----------------------------------
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterRateType, setFilterRateType] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterTerritory, setFilterTerritory] = useState("");


  const [allEmployees, setAllEmployees] = useState([]);
  const [inactiveEmployees, setInactiveEmployees] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);
  
  // Raw data state for progressive loading
  const [rawEmployees, setRawEmployees] = useState([]);

  // Lookup states
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [banks, setBanks] = useState([]);


  // Search
  const [searchText, setSearchText] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);
  const paginatedEmployees = filteredEmployees.slice((page - 1) * limit, page * limit);



    // ============================
// NORMALIZED FILTER LISTS
// ============================

const filterDesignations = designations.map(d => ({
  id: d.id || d.designationId,
  name: d.designationName || d.designation
}));

const filterDepartments = departments.map(d => ({
  id: d.id || d.departmentId,
  name: d.departmentName || d.department
}));

const filterCountries = countries.map(c => ({
  id: c.id,
  name: c.name || c.countryName
}));

const filterStates = states.map(s => ({
  id: s.id,
  name: s.name
}));

const filterCities = cities.map(c => ({
  id: c.id,
  name: c.name
}));

const filterRegions = regions.map(r => ({
  id: r.regionId,
  name: r.regionName
}));

const filterTerritories = territories.map(t => ({
  id: t.id,
  name: t.territoryDescription
}));


  // Close dropdowns when clicking outside
useEffect(() => {
  const handler = (e) => {
    // ✅ If clicking inside column modal → DO NOTHING
    if (columnModalRef.current && columnModalRef.current.contains(e.target)) {
      return;
    }
  };

  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}, []);







  // Helper to parse array from various response formats
  const parseArrayFromResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.records) return res.data.records;
    if (res.records) return res.records;
    const maybeArray = Object.values(res).find((v) => Array.isArray(v));
    return Array.isArray(maybeArray) ? maybeArray : [];
  };

  // -----------------------------------
  // DATA FETCHING
  // -----------------------------------
  // -----------------------------------
  // DATA FETCHING (Progressive)
  // -----------------------------------
  const fetchAllData = async () => {
    // 1. Fetch Employees FIRST (Fast UI)
    try {
      setLoading(true);
      const empRes = await getEmployeesApi(1, 5000);
      
      let raw = [];
      if (empRes?.data?.records) {
        raw = empRes.data.records;
      } else if (Array.isArray(empRes?.data)) {
        raw = empRes.data;
      } else if (Array.isArray(empRes)) {
        raw = empRes;
      }
      setRawEmployees(raw);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false); // Table appears here
    }

    // 2. Fetch Lookups in Background (Progressive enhancement, batched updates)
    try {
      setLoadingLookups(true);
      
      // Split into two parallel batches to manage DB connection pool (max 10)
      // Batch A: Organization & Finance
      const batchA = Promise.all([
        getDesignationsApi(1, 5000),
        getDepartmentsApi(1, 5000),
        getBanksApi(1, 5000)
      ]);

      // Batch B: Geography (starts only after Batch A completes to be safe)
      const [dsgRes, depRes, bankRes] = await batchA;

      const batchB = Promise.all([
        getCountriesApi(1, 5000),
        getStatesApi(1, 5000),
        getCitiesApi(1, 5000),
        getRegionsApi(1, 5000),
        getTerritoriesApi(1, 5000)
      ]);

      const [cntRes, stRes, citRes, regRes, terRes] = await batchB;

      // UPDATE ALL STATE AT ONCE to prevent "one by one" pop-in
      setDesignations(parseArrayFromResponse(dsgRes));
      setDepartments(parseArrayFromResponse(depRes));
      setBanks(parseArrayFromResponse(bankRes));
      setCountries(parseArrayFromResponse(cntRes));
      setStates(parseArrayFromResponse(stRes));
      setCities(parseArrayFromResponse(citRes));
      setRegions(parseArrayFromResponse(regRes));
      setTerritories(parseArrayFromResponse(terRes));

    } catch (err) {
      console.error("Failed to fetch lookups:", err);
    } finally {
      setLoadingLookups(false);
    }
  };

  // 3. Normalize Data (Automatic whenever rawEmployees OR lookups change)
  useEffect(() => {
    if (!rawEmployees.length) {
      setAllEmployees([]);
      return;
    }

    const normalized = rawEmployees.map(emp => {
      const country = countries.find(c => String(c.id) === String(emp.CountryId));
      const state = states.find(s => String(s.id) === String(emp.StateId));
      const city = cities.find(c => String(c.id) === String(emp.CityId));
      const region = regions.find(r => String(r.regionId) === String(emp.RegionId));
      const territory = territories.find(t => String(t.id) === String(emp.TerritoryId));
      const bank = banks.find(b => String(b.id) === String(emp.PayrollBankId));

      return {
        id: emp.Id,
        firstName: emp.FirstName,
        lastName: emp.LastName,
        designation: emp.designation || "",
        department: emp.department || "",
        rateType: emp.RateType,
        phone: emp.Phone,
        hourRateSalary: emp.HoureRateSalary || emp.HourlyRateSalary || emp.hourRateSalary || 0,
        basicSalary: emp.BasicSalary,
        totalIncome: emp.TotalIncome,
        totalDeduction: emp.TotalDeduction,
        takeHomePay: (Number(emp.BasicSalary || 0) + Number(emp.TotalIncome || 0) - Number(emp.TotalDeduction || 0)),
        email: emp.Email,
        bloodGroup: emp.BloodGroup,
        countryName: country?.name || "",
        stateName: state?.name || "",
        cityName: city?.name || "",
        regionName: region?.regionName || "",
        territory: territory?.territoryDescription || "",
        zipCode: emp.ZipCode,
        address: emp.Address,
        userId: emp.UserId,
        bankName: bank?.BankName || "",
        bankAccount: emp.BankAccountForPayroll || ""
      };
    });

    setAllEmployees(normalized);
  }, [
    rawEmployees, 
    countries, 
    states, 
    cities, 
    regions, 
    territories, 
    banks
  ]);
 
  useEffect(() => {
    fetchAllData();
  }, []);

  const loadInactiveEmployees = async () => {
    try {
      const res = await getInactiveEmployeesApi();
      if (res.status === 200) {
        const inactive = res.data || [];
        const normalized = inactive.map(emp => {
          const country = countries.find(c => String(c.id) === String(emp.CountryId));
          const state = states.find(s => String(s.id) === String(emp.StateId));
          const city = cities.find(c => String(c.id) === String(emp.CityId));
          const region = regions.find(r => String(r.regionId) === String(emp.RegionId));
          const territory = territories.find(t => String(t.id) === String(emp.TerritoryId));

          return {
            id: emp.Id,
            firstName: emp.FirstName,
            lastName: emp.LastName,
            designation: emp.designation || "",
            department: emp.department || "",
            rateType: emp.RateType,
            phone: emp.Phone,
            basicSalary: emp.BasicSalary,
            totalIncome: emp.TotalIncome,
            totalDeduction: emp.TotalDeduction,
            takeHomePay: (Number(emp.BasicSalary || 0) + Number(emp.TotalIncome || 0) - Number(emp.TotalDeduction || 0)),
            email: emp.Email,
            bloodGroup: emp.BloodGroup,
            countryName: country?.name || "",
            stateName: state?.name || "",
            cityName: city?.name || "",
            regionName: region?.regionName || "",
            territory: territory?.territoryDescription || "",
            zipCode: emp.ZipCode,
            address: emp.Address,
            userId: emp.UserId,
            isInactive: true
          };
        });
        setInactiveEmployees(normalized);
      }
    } catch (error) {
      console.error("Failed to fetch inactive employees:", error);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Are you sure you want to restore this employee?")) return;
    try {
      const res = await restoreEmployeeApi(id, { userId: 1 });
      if (res.status === 200) {
        toast.success("Employee restored");
        fetchAllData();
        loadInactiveEmployees();
      }
    } catch (error) {
      console.error("Restore failed:", error);
      toast.error("Failed to restore employee");
    }
  };

  // Apply search and filter
  useEffect(() => {
    let filtered = allEmployees;

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((emp) =>
        Object.values(emp).some(
          (val) => val && String(val).toLowerCase().includes(search)
        )
      );
    }

    // Apply column filters (robust comparison)
    if (filterDesignation)
      filtered = filtered.filter((emp) => String(emp.designation || "").trim() === filterDesignation);
    if (filterDepartment)
      filtered = filtered.filter((emp) => String(emp.department || "").trim() === filterDepartment);
    if (filterRateType)
      filtered = filtered.filter((emp) => String(emp.rateType || "").trim() === filterRateType);
    if (filterBloodGroup)
      filtered = filtered.filter((emp) => String(emp.bloodGroup || "").trim() === filterBloodGroup);
    if (filterCountry)
      filtered = filtered.filter((emp) => String(emp.countryName || "").trim() === filterCountry);
    if (filterState)
      filtered = filtered.filter((emp) => String(emp.stateName || "").trim() === filterState);
    if (filterCity)
      filtered = filtered.filter((emp) => String(emp.cityName || "").trim() === filterCity);
    if (filterRegion)
      filtered = filtered.filter((emp) => String(emp.regionName || "").trim() === filterRegion);
    if (filterTerritory)
      filtered = filtered.filter((emp) => String(emp.territory || "").trim() === filterTerritory);

    setFilteredEmployees(filtered);
    setPage(1);
  }, [
    allEmployees,
    searchText,
    filterDesignation,
    filterDepartment,
    filterRateType,
    filterBloodGroup,
    filterCountry,
    filterState,
    filterCity,
    filterRegion,
    filterTerritory,
  ]);



const columnModalRef = useRef(null);



  // -----------------------------------
  // RENDER
  // -----------------------------------
  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />
        <div
              ref={columnModalRef}
              className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white"
            >

            <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) =>
                  setColumnSearch(e.target.value.toLowerCase())
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible columns */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => tempVisibleColumns[col])
                    .filter((col) => col.includes(columnSearch))
                    .map((col) => (
                      <div
                        key={col}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                      >
                        <span>{col}</span>
                        <button
                          className="text-red-400"
                          onClick={() =>
                            setTempVisibleColumns((prev) => ({
                              ...prev,
                              [col]: false,
                            }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Hidden columns */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => !tempVisibleColumns[col])
                    .filter((col) => col.includes(columnSearch))
                    .map((col) => (
                      <div
                        key={col}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                      >
                        <span>{col}</span>
                        <button
                          className="text-green-400"
                          onClick={() =>
                            setTempVisibleColumns((prev) => ({
                              ...prev,
                              [col]: true,
                            }))
                          }
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setTempVisibleColumns(defaultColumns)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Employees</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search employees..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate("/app/hr/newemployee")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[33px]"
          >
            <Plus size={16} /> New Employee
          </button>



          <button
            onClick={fetchAllData}
            className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
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
            onClick={async () => {
              if (!showInactive) await loadInactiveEmployees();
              setShowInactive(!showInactive);
            }}
            className={`p-1.5 rounded-md border flex items-center gap-1 ${showInactive ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-2 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
          <SearchableFilterDropdown
            label="filterDesignations"
            list={filterDesignations}
            value={filterDesignation}
            onSelect={setFilterDesignation}
          />

          <SearchableFilterDropdown
            label="Department"
            list={filterDepartments}
            value={filterDepartment}
            onSelect={setFilterDepartment}
          />

          <SearchableFilterDropdown
            label="Rate Type"
            list={[{ name: "Hourly" }, { name: "Salary" }]}
            value={filterRateType}
            onSelect={setFilterRateType}
          />

          <SearchableFilterDropdown
            label="Blood Group"
            list={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => ({ name: g }))}
            value={filterBloodGroup}
            onSelect={setFilterBloodGroup}
          />

          <SearchableFilterDropdown
            label="Country"
            list={filterCountries}
            value={filterCountry}
            onSelect={setFilterCountry}
          />

          <SearchableFilterDropdown
            label="filterStates"
            list={filterStates}
            value={filterState}
            onSelect={setFilterState}
          />

          <SearchableFilterDropdown
            label="filterCities"
            list={filterCities}
            value={filterCity}
            onSelect={setFilterCity}
          />

          <SearchableFilterDropdown
            label="Region"
            list={filterRegions}
            value={filterRegion}
            onSelect={setFilterRegion}
          />

          <SearchableFilterDropdown
            label="filterTerritories"
            list={filterTerritories}
            value={filterTerritory}
            onSelect={setFilterTerritory}
          />

          <button
            onClick={() => {
              setFilterDesignation("");
              setFilterDepartment("");
              setFilterRateType("");
              setFilterBloodGroup("");
              setFilterCountry("");
              setFilterState("");
              setFilterCity("");
              setFilterRegion("");
              setFilterTerritory("");
            }}
            className="px-3 py-1.5 bg-red-900/40 border border-red-700 rounded text-xs hover:bg-red-900/60"
          >
            Clear All
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[3500px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10 h-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.firstName && (
                    <th className="pb-2 border-b">First Name</th>
                  )}
                  {visibleColumns.lastName && (
                    <th className="pb-2 border-b">Last Name</th>
                  )}
                  {visibleColumns.designation && (
                    <th className="pb-2 border-b">Designation</th>
                  )}
                  {visibleColumns.department && (
                    <th className="pb-2 border-b">Department</th>
                  )}
                  {visibleColumns.rateType && (
                    <th className="pb-2 border-b">Rate Type</th>
                  )}
                  {visibleColumns.phone && (
                    <th className="pb-2 border-b">Phone</th>
                  )}
                  {visibleColumns.hourRateSalary && (
                    <th className="pb-2 border-b">Hour Rate Salary</th>
                  )}
                  {visibleColumns.email && (
                    <th className="pb-2 border-b">Email</th>
                  )}
                  {visibleColumns.bloodGroup && (
                    <th className="pb-2 border-b">Blood Group</th>
                  )}
                  {visibleColumns.countryName && (
                    <th className="pb-2 border-b">Country</th>
                  )}
                  {visibleColumns.stateName && (
                    <th className="pb-2 border-b">State</th>
                  )}
                  {visibleColumns.cityName && (
                    <th className="pb-2 border-b">City</th>
                  )}
                  {visibleColumns.zipCode && (
                    <th className="pb-2 border-b">Zip Code</th>
                  )} 
                  {visibleColumns.address && (
                    <th className="pb-2 border-b">Address</th>
                  )}
                  {visibleColumns.userId && (
                    <th className="pb-2 border-b">User ID</th>
                  )}
                  {visibleColumns.regionName && (
                    <th className="pb-2 border-b">Region</th>
                  )}
                  {visibleColumns.territory && (
                    <th className="pb-2 border-b">Territory Description</th>
                  )}
                </tr>
              </thead>

              <tbody className="text-center h-10">
                {loading ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-8 text-gray-400">
                      Loading employees...
                    </td>
                  </tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-8 text-gray-400 text-left">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((r) => (
                   <tr
                    key={r.id}
                    onClick={() => navigate(`/app/hr/editemployee/${r.id}`)}
                    className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                  >

                      {visibleColumns.id && <td className="py-2">{r.id}</td>}
                      {visibleColumns.firstName && (
                        <td className="py-2">{r.firstName}</td>
                      )}
                      {visibleColumns.lastName && (
                        <td className="py-2">{r.lastName}</td>
                      )}
                      {visibleColumns.designation && (
                        <td className="py-2">{r.designation}</td>
                      )}
                      {visibleColumns.department && (
                        <td className="py-2">{r.department}</td>
                      )}
                      {visibleColumns.rateType && (
                        <td className="py-2">{r.rateType}</td>
                      )}
                      {visibleColumns.phone && <td className="py-2">{r.phone}</td>}
                      {visibleColumns.hourRateSalary && (
                        <td className="py-2">{r.hourRateSalary}</td>
                      )}
                      {visibleColumns.email && <td className="py-2">{r.email}</td>}
                      {visibleColumns.bloodGroup && (
                        <td className="py-2">{r.bloodGroup}</td>
                      )}
                      {visibleColumns.countryName && (
                        <td className="py-2">{r.countryName}</td>
                      )}
                      {visibleColumns.stateName && (
                        <td className="py-2">{r.stateName}</td>
                      )}
                      {visibleColumns.cityName && (
                        <td className="py-2">{r.cityName}</td>
                      )}
                      {visibleColumns.zipCode && (
                        <td className="py-2">{r.zipCode}</td>
                      )} 
                      {visibleColumns.address && (
                        <td className="py-2">{r.address}</td>
                      )}
                      {visibleColumns.userId && (
                        <td className="py-2">{r.userId}</td>
                      )}
                      {visibleColumns.regionName && (
                        <td className="py-2">{r.regionName}</td>
                      )}
                      {visibleColumns.territory && (
                        <td className="py-2">{r.territory}</td>
                      )}
                    </tr>
                  ))
                )}

                {/* INACTIVE EMPLOYEES */}
                {showInactive && inactiveEmployees.map((r) => (
                  <tr
                    key={`inactive-${r.id}`}
                    className="bg-gray-900/50 opacity-60 line-through hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleRestore(r.id)}
                  >
                    {visibleColumns.id && <td className="py-2">{r.id}</td>}
                    {visibleColumns.firstName && <td className="py-2">{r.firstName}</td>}
                    {visibleColumns.lastName && <td className="py-2">{r.lastName}</td>}
                    {visibleColumns.designation && <td className="py-2">{r.designation}</td>}
                    {visibleColumns.department && <td className="py-2">{r.department}</td>}
                    {visibleColumns.rateType && <td className="py-2">{r.rateType}</td>}
                    {visibleColumns.phone && <td className="py-2">{r.phone}</td>}
                    {visibleColumns.hourRateSalary && <td className="py-2">{r.hourRateSalary}</td>}
                    {visibleColumns.email && <td className="py-2">{r.email}</td>}
                    {visibleColumns.bloodGroup && <td className="py-2">{r.bloodGroup}</td>}
                    {visibleColumns.countryName && <td className="py-2">{r.countryName}</td>}
                    {visibleColumns.stateName && <td className="py-2">{r.stateName}</td>}
                    {visibleColumns.cityName && <td className="py-2">{r.cityName}</td>}
                    {visibleColumns.zipCode && <td className="py-2">{r.zipCode}</td>}
                    {visibleColumns.address && <td className="py-2">{r.address}</td>}
                    {visibleColumns.userId && <td className="py-2">{r.userId}</td>}
                    {visibleColumns.regionName && <td className="py-2">{r.regionName}</td>}
                    {visibleColumns.territory && <td className="py-2">{r.territory}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map((n) => (
              <option value={n} key={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>

          <input
            type="number"
            value={page}
            onChange={(e) =>
              setPage(
                Math.min(totalPages, Math.max(1, Number(e.target.value)))
              )
            }
            className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
          />

          <span>/ {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
          >
            <ChevronsRight size={16} />
          </button>

          <span>
            Showing <b>{start}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
          </span>
        </div>
      </div>
      </div>
      </PageLayout>
    </>
  );
};

const SearchableFilterDropdown = ({ label, list, value, onSelect, placeholder = "Search..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = list.filter((item) => {
    const name = item.name || item.designationName || item.departmentName || item.countryName || item.stateName || item.cityName || item.regionName || item.territoryName || item.territoryDescription || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="relative w-40" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
      >
        <span className="truncate">{value || label}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[250px] flex flex-col">
          <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="overflow-auto flex-grow">
            <div
              onClick={() => {
                onSelect("");
                setIsOpen(false);
                setSearch("");
              }}
              className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-400 italic"
            >
              Clear
            </div>
            {filtered.length > 0 ? (
              filtered.map((item, idx) => {
                const name = item.name || item.designationName || item.departmentName || item.countryName || item.stateName || item.cityName || item.regionName || item.territoryName || item.territoryDescription || "";
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelect(name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                  >
                    {name}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-gray-500">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
