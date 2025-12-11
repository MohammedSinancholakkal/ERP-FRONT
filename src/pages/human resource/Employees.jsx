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
} from "../../services/allAPI";

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

  const dropdownRefs = {
    designation: useRef(),
    department: useRef(),
    rateType: useRef(),
    bloodGroup: useRef(),
    country: useRef(),
    state: useRef(),
    city: useRef(),
    region: useRef(),
    territory: useRef(),
  };

  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lookup states
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [territories, setTerritories] = useState([]);

  // Dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState({
    designation: false,
    department: false,
    country: false,
    state: false,
    city: false,
    region: false,
    territory: false,
  });

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




  // Close dropdowns when clicking outside
useEffect(() => {
  const handler = (e) => {
    // ✅ If clicking inside column modal → DO NOTHING
    if (columnModalRef.current && columnModalRef.current.contains(e.target)) {
      return;
    }

    // ✅ Close only dropdowns (NOT the modal)
    Object.keys(dropdownRefs).forEach((key) => {
      if (
        dropdownRefs[key].current &&
        !dropdownRefs[key].current.contains(e.target)
      ) {
        setDropdownOpen((prev) => ({ ...prev, [key]: false }));
      }
    });
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

  // Load all lookup data
  const loadLookups = async () => {
    try {
      const [dsgRes, depRes, cntRes, stRes, citRes, regRes, terRes] = await Promise.all([
        getDesignationsApi(1, 5000),
        getDepartmentsApi(1, 5000),
        getCountriesApi(1, 5000),
        getStatesApi(1, 5000),
        getCitiesApi(1, 5000),
        getRegionsApi(1, 5000),
        getTerritoriesApi(1, 5000),
      ]);

      setDesignations(parseArrayFromResponse(dsgRes));
      setDepartments(parseArrayFromResponse(depRes));
      setCountries(parseArrayFromResponse(cntRes));
      setStates(parseArrayFromResponse(stRes));
      setCities(parseArrayFromResponse(citRes));
      setRegions(parseArrayFromResponse(regRes));
      setTerritories(parseArrayFromResponse(terRes));
    } catch (error) {
      console.error("Failed to load lookups:", error);
    }
  };

  // Fetch employees
  // const getAllEmployees = async () => {
  //   try {
  //     setLoading(true);
  //     const result = await getEmployeesApi(1, 5000);
  //     console.log("API Response:", result);
  //     console.log("Result data:", result?.data); 
      
  //     let employees = [];
  //     if (result?.data?.records) {
  //       employees = result.data.records;
  //     } else if (result?.data && Array.isArray(result.data)) {
  //       employees = result.data;
  //     } else if (Array.isArray(result)) {
  //       employees = result;
  //     }
      
  //     console.log("Parsed employees:", employees);
  //     setAllEmployees(employees);
  //   } catch (error) {
  //     console.error("Failed to fetch employees:", error);
  //     setAllEmployees([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


const getAllEmployees = async () => {
  try {
    setLoading(true);
    const result = await getEmployeesApi(1, 5000);
    // console.log(result);
    

    let employees = [];

    if (result?.data?.records) {
      employees = result.data.records;
    } else if (Array.isArray(result?.data)) {
      employees = result.data;
    } else if (Array.isArray(result)) {
      employees = result;
    }

// const normalizedEmployees = employees.map((emp) => {  
//   const country = countries.find((c) => c.id === emp.CountryId);
//   const state = states.find((s) => s.id === emp.StateId);
//   const city = cities.find((c) => c.id === emp.CityId);
//   const region = regions.find((r) => r.id === emp.RegionId);
//   const territory = territories.find((t) => t.id === emp.TerritoryId);

//   return {
//     id: emp.Id,
//     firstName: emp.FirstName,
//     lastName: emp.LastName,

//     // ✅ Already fixed
//     designation: emp.designation || emp.Designation || "",
//     department: emp.department || emp.Department || "",

//     rateType: emp.RateType,
//     phone: emp.Phone,
//     hourRateSalary: emp.HoureRateSalary,
//     email: emp.Email,
//     bloodGroup: emp.BloodGroup,

//     // ✅ ✅ ✅ ID → NAME CONVERSION HERE
//     countryName: country?.name || country?.countryName || "",
//     stateName: state?.name || state?.stateName || "",
//     cityName: city?.name || city?.cityName || "",
//     regionName: region?.name || region?.regionName || "",
//     territory: territory?.name || territory?.territoryName || "",

//     zipCode: emp.ZipCode,
//     address: emp.Address,
//     userId: emp.UserId,

//     territoryDescription: territory?.description || "",
//   };
// });

const normalizedEmployees = employees.map((emp) => {  
  const country = countries.find((c) => (c.id ?? c.Id) === emp.CountryId);
  const state = states.find((s) => (s.id ?? s.Id) === emp.StateId);
  const city = cities.find((c) => (c.id ?? c.Id) === emp.CityId);

  // ✅✅✅ EXACT MATCH FOR YOUR REGION STRUCTURE
  const region = regions.find((r) => r.regionId === emp.RegionId);

  // ✅✅✅ EXACT MATCH FOR YOUR TERRITORY STRUCTURE
  const territory = territories.find((t) => t.id === emp.TerritoryId);

  return {
    id: emp.Id,
    firstName: emp.FirstName,
    lastName: emp.LastName,

    designation: emp.designation || emp.Designation || "",
    department: emp.department || emp.Department || "",

    rateType: emp.RateType,
    phone: emp.Phone,
    hourRateSalary: emp.HoureRateSalary,
    email: emp.Email,
    bloodGroup: emp.BloodGroup,

    countryName:
      country?.name || country?.countryName || country?.CountryName || "",

    stateName:
      state?.name || state?.stateName || state?.StateName || "",

    cityName:
      city?.name || city?.cityName || city?.CityName || "",

    // ✅✅✅ WILL NOW DISPLAY 100%
    regionName: region?.regionName || "",

territory: territory?.territoryDescription || "",

    zipCode: emp.ZipCode,
    address: emp.Address,
    userId: emp.UserId,
  };
});




    setAllEmployees(normalizedEmployees);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    setAllEmployees([]);
  } finally {
    setLoading(false);
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

    // Apply column filters (exact match)
    if (filterDesignation)
      filtered = filtered.filter((emp) => emp.designation === filterDesignation);
    if (filterDepartment)
      filtered = filtered.filter((emp) => emp.department === filterDepartment);
    if (filterRateType)
      filtered = filtered.filter((emp) => emp.rateType === filterRateType);
    if (filterBloodGroup)
      filtered = filtered.filter((emp) => emp.bloodGroup === filterBloodGroup);
    if (filterCountry)
      filtered = filtered.filter((emp) => emp.countryName === filterCountry);
    if (filterState)
      filtered = filtered.filter((emp) => emp.stateName === filterState);
    if (filterCity)
      filtered = filtered.filter((emp) => emp.cityName === filterCity);
    if (filterRegion)
      filtered = filtered.filter((emp) => emp.regionName === filterRegion);
    if (filterTerritory)
      filtered = filtered.filter((emp) => emp.territory === filterTerritory);

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

  // Initial load
useEffect(() => {
  loadLookups();
}, []);

useEffect(() => {
  if (
    countries.length &&
    states.length &&
    cities.length &&
    regions.length &&
    territories.length
  ) {
    getAllEmployees();
  }
}, [countries, states, cities, regions, territories]);



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
            onClick={getAllEmployees}
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

          <button className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1">
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-2 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
          {/* Designation */}
          <div className="relative w-40" ref={dropdownRefs.designation}>
            <button
              onClick={() =>
                setDropdownOpen((prev) => ({ ...prev, designation: !prev.designation }))
              }
              className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
            >
              <span className="truncate">{filterDesignation || "Designation"}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen.designation && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[200px] overflow-auto">
                <div
                  onClick={() => {
                    setFilterDesignation("");
                    setDropdownOpen((prev) => ({ ...prev, designation: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-300"
                >
                  Clear
                </div>
                {designations.map((item) => (
                  <div
                    key={item.designationId}
                    onClick={() => {
                      setFilterDesignation(item.designationName || "");
                      setDropdownOpen((prev) => ({ ...prev, designation: false }));
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                  >
                    {item.designationName}
                  </div>
                ))}

              </div>

            )}
          </div>

          {/* Department */}
          <div className="relative w-40" ref={dropdownRefs.department}>
            <button
              onClick={() =>
                setDropdownOpen((prev) => ({ ...prev, department: !prev.department }))
              }
              className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
            >
              <span className="truncate">{filterDepartment || "Department"}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen.department && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[200px] overflow-auto">
                <div
                  onClick={() => {
                    setFilterDepartment("");
                    setDropdownOpen((prev) => ({ ...prev, department: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-300"
                >
                  Clear
                </div>
               {departments.map((item) => (
                <div
                  key={item.departmentId}
                  onClick={() => {
                    setFilterDepartment(item.departmentName || "");
                    setDropdownOpen((prev) => ({ ...prev, department: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                >
                  {item.departmentName}
                </div>
              ))}

              </div>
            )}
            </div>

          {/* Country */}
          <div className="relative w-40" ref={dropdownRefs.country}>
            <button
              onClick={() =>
                setDropdownOpen((prev) => ({ ...prev, country: !prev.country }))
              }
              className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
            >
              <span className="truncate">{filterCountry || "Country"}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen.country && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[200px] overflow-auto">
                <div
                  onClick={() => {
                    setFilterCountry("");
                    setDropdownOpen((prev) => ({ ...prev, country: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-300"
                >
                  Clear
                </div>
                {countries.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setFilterCountry(item.name || item.countryName || "");
                      setDropdownOpen((prev) => ({ ...prev, country: false }));
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                  >
                    {item.name || item.countryName || ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* State */}
          <div className="relative w-40" ref={dropdownRefs.state}>
            <button
              onClick={() =>
                setDropdownOpen((prev) => ({ ...prev, state: !prev.state }))
              }
              className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
            >
              <span className="truncate">{filterState || "State"}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen.state && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[200px] overflow-auto">
                <div
                  onClick={() => {
                    setFilterState("");
                    setDropdownOpen((prev) => ({ ...prev, state: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-300"
                >
                  Clear
                </div>
                {states.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setFilterState(item.name || item.stateName || "");
                      setDropdownOpen((prev) => ({ ...prev, state: false }));
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                  >
                    {item.name || item.stateName || ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* City */}
          <div className="relative w-40" ref={dropdownRefs.city}>
            <button
              onClick={() =>
                setDropdownOpen((prev) => ({ ...prev, city: !prev.city }))
              }
              className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
            >
              <span className="truncate">{filterCity || "City"}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen.city && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[200px] overflow-auto">
                <div
                  onClick={() => {
                    setFilterCity("");
                    setDropdownOpen((prev) => ({ ...prev, city: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-300"
                >
                  Clear
                </div>
                {cities.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setFilterCity(item.name || item.cityName || "");
                      setDropdownOpen((prev) => ({ ...prev, city: false }));
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                  >
                    {item.name || item.cityName || ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Region */}
          <div className="relative w-40" ref={dropdownRefs.region}>
            <button
              onClick={() =>
                setDropdownOpen((prev) => ({ ...prev, region: !prev.region }))
              }
              className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
            >
              <span className="truncate">{filterRegion || "Region"}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen.region && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[200px] overflow-auto">
                <div
                  onClick={() => {
                    setFilterRegion("");
                    setDropdownOpen((prev) => ({ ...prev, region: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-300"
                >
                  Clear
                </div>
                {regions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setFilterRegion(item.name || item.regionName || "");
                      setDropdownOpen((prev) => ({ ...prev, region: false }));
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                  >
                    {item.name || item.regionName || ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Territory */}
          <div className="relative w-40" ref={dropdownRefs.territory}>
            <button
              onClick={() =>
                setDropdownOpen((prev) => ({ ...prev, territory: !prev.territory }))
              }
              className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700"
            >
              <span className="truncate">{filterTerritory || "Territory"}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen.territory && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[200px] overflow-auto">
                <div
                  onClick={() => {
                    setFilterTerritory("");
                    setDropdownOpen((prev) => ({ ...prev, territory: false }));
                  }}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-300"
                >
                  Clear
                </div>
                {territories.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setFilterTerritory(item.name || item.territoryName || "");
                      setDropdownOpen((prev) => ({ ...prev, territory: false }));
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
                  >
                    {item.name || item.territoryName || ""}
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  {/* {visibleColumns.territoryDescription && (
                    <th className="pb-2 border-b">Territory Description</th>
                  )} */}
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
                      {/* {visibleColumns.territoryDescription && (
                        <td className="py-2">{r.territoryDescription}</td>
                      )} */}
                    </tr>
                  ))
                )}
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

export default Employees;
