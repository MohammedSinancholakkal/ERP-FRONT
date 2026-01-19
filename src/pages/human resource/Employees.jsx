// src/pages/employees/Employees.jsx
import React, { useEffect, useState, useRef } from "react";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import {
//   Search,
//   Plus,
//   RefreshCw,
//   List,
  ArchiveRestore, // Keep specific icons if used elsewhere, but MasterTable handles standard ones
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";

import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
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
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
// import SortableHeader from "../../components/SortableHeader"; // REMOVED

import Swal from "sweetalert2";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const Employees = () => {
    const { theme } = useTheme();
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

  // -----------------------------------
  // SORTING
  // -----------------------------------
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedEmployees = React.useMemo(() => {
    return filteredEmployees;
  }, [filteredEmployees]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // MasterTable expects an array of objects for columns
  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    visibleColumns.firstName && { key: "firstName", label: "First Name", sortable: true },
    visibleColumns.lastName && { key: "lastName", label: "Last Name", sortable: true },
    visibleColumns.designation && { key: "designation", label: "Designation", sortable: true },
    visibleColumns.department && { key: "department", label: "Department", sortable: true },
    visibleColumns.rateType && { key: "rateType", label: "Rate Type", sortable: true },
    visibleColumns.phone && { key: "phone", label: "Phone", sortable: true },
    visibleColumns.hourRateSalary && { key: "hourRateSalary", label: "Hour Rate Salary", sortable: true },
    visibleColumns.email && { key: "email", label: "Email", sortable: true },
    visibleColumns.bloodGroup && { key: "bloodGroup", label: "Blood Group", sortable: true },
    visibleColumns.countryName && { key: "countryName", label: "Country", sortable: true },
    visibleColumns.stateName && { key: "stateName", label: "State", sortable: true },
    visibleColumns.cityName && { key: "cityName", label: "City", sortable: true },
    visibleColumns.zipCode && { key: "zipCode", label: "Zip Code", sortable: true },
    visibleColumns.address && { key: "address", label: "Address", sortable: true },
    visibleColumns.userId && { key: "userId", label: "User ID", sortable: true },
    visibleColumns.regionName && { key: "regionName", label: "Region", sortable: true },
    visibleColumns.territory && { key: "territory", label: "Territory Description", sortable: true },
  ].filter(Boolean);


  const totalRecords = sortedEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);
  
  // Apply pagination to SORTED list
  const paginatedEmployees = sortedEmployees.slice((page - 1) * limit, page * limit);



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
      const empRes = await getEmployeesApi(1, 5000, sortConfig.key, sortConfig.direction);
      
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
  }, [sortConfig]);

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
  const result = await Swal.fire({
    title: "Restore employee?",
    text: "This employee will be restored and made active again.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, restore",
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: "Restoring...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await restoreEmployeeApi(id, { userId: 1 });
    Swal.close();

    if (res.status === 200) {
      Swal.fire({
        icon: "success",
        title: "Restored!",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchAllData();
      loadInactiveEmployees();
    }
  } catch (error) {
    Swal.close();
    Swal.fire({
      icon: "error",
      title: "Restore failed",
      text: "Failed to restore employee.",
    });
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
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* MAIN */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Employees</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={tableColumns}
                data={paginatedEmployees}
                inactiveData={inactiveEmployees}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(c, isInactive) => {
                     // Navigate to Edit
                     navigate(`/app/hr/employees/${c.id}`);
                }}
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => navigate("/app/hr/newemployee")}
                createLabel="New Employee"
                permissionCreate={hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE)}
                onRefresh={() => { fetchAllData(); }}
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactiveEmployees();
                    setShowInactive(!showInactive);
                }}
            >
                {/* FILTER BAR as Children */}
                <FilterBar
                    filters={[
                        { label: "Designation", value: filterDesignation, onChange: setFilterDesignation, options: filterDesignations, placeholder: "All Designations" },
                        { label: "Department", value: filterDepartment, onChange: setFilterDepartment, options: filterDepartments, placeholder: "All Departments" },
                        { label: "Rate Type", value: filterRateType, onChange: setFilterRateType, options: ["Hourly", "Salaried", "Commission"].map(r => ({ id: r, name: r })), placeholder: "Rate Type" },
                        { label: "Blood Group", value: filterBloodGroup, onChange: setFilterBloodGroup, options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(b => ({ id: b, name: b })), placeholder: "Blood Group" },
                        { label: "Country", value: filterCountry, onChange: setFilterCountry, options: filterCountries, placeholder: "Country" },
                        { label: "State", value: filterState, onChange: setFilterState, options: filterStates, placeholder: "State" },
                        { label: "City", value: filterCity, onChange: setFilterCity, options: filterCities, placeholder: "City" },
                        { label: "Region", value: filterRegion, onChange: setFilterRegion, options: filterRegions, placeholder: "Region" },
                        { label: "Territory", value: filterTerritory, onChange: setFilterTerritory, options: filterTerritories, placeholder: "Territory" },
                    ]}
                    onClear={() => {
                        setFilterDesignation("");
                        setFilterDepartment("");
                        setFilterRateType("");
                        setFilterBloodGroup("");
                        setFilterCountry("");
                        setFilterState("");
                        setFilterCity("");
                        setFilterRegion("");
                        setFilterTerritory("");
                        setSearchText("");
                    }}
                />
                
            </MasterTable>
             {/* PAGINATION */}
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
              />
          </div>
          </ContentCard>
        </div>
      </PageLayout>

    </>
  );
};



export default Employees;



