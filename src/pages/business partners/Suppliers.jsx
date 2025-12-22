// src/pages/suppliers/Suppliers.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import SortableHeader from "../../components/SortableHeader";
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
} from "../../services/allAPI";

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
    cnic: true,
    ntn: true,
    strn: true,
    orderBooker: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // --------------------------------------
  // Filters
  // --------------------------------------
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const dropdownRefs = {
    country: useRef(),
    state: useRef(),
    city: useRef(),
    region: useRef(),
    group: useRef(),
  };

  const [dropdownOpen, setDropdownOpen] = useState({
    country: false,
    state: false,
    city: false,
    region: false,
    group: false,
  });

  const [rows, setRows] = useState([]);
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

  const [filterSearch, setFilterSearch] = useState({
    country: "",
    state: "",
    city: "",
    region: "",
    group: "",
  });

  // --------------------------------------
  // Search
  // --------------------------------------
  const [searchText, setSearchText] = useState("");

  // --------------------------------------
  // Pagination
  // --------------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const applyFilters = (data) => {
    return data.filter((row) => {
      const countryMatch = filterCountry
        ? (lookupMaps.countries[String(row.countryId)] || row.countryName || "")
            .toLowerCase()
            .includes(filterCountry.toLowerCase())
        : true;
      const stateMatch = filterState
        ? (lookupMaps.states[String(row.stateId)] || row.stateName || "")
            .toLowerCase()
            .includes(filterState.toLowerCase())
        : true;
      const cityMatch = filterCity
        ? (lookupMaps.cities[String(row.cityId)] || row.cityName || "")
            .toLowerCase()
            .includes(filterCity.toLowerCase())
        : true;
      const regionMatch = filterRegion
        ? (lookupMaps.regions[String(row.regionId)] || row.regionName || "")
            .toLowerCase()
            .includes(filterRegion.toLowerCase())
        : true;
      const groupMatch = filterGroup
        ? (lookupMaps.groups[String(row.supplierGroupId)] || row.supplierGroupName || "")
            .toLowerCase()
            .includes(filterGroup.toLowerCase())
        : true;
      return countryMatch && stateMatch && cityMatch && regionMatch && groupMatch;
    });
  };

  const dataSource = showInactive ? inactiveRows : rows;
  const filteredRows = applyFilters(dataSource);

  // Sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = String(a[sortConfig.key] || "").toLowerCase();
    const valB = String(b[sortConfig.key] || "").toLowerCase();
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalRecords = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

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
    cnic: r.cnic ?? r.CNIC ?? "",
    ntn: r.ntn ?? r.NTN ?? "",
    strn: r.strn ?? r.STRN ?? "",
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


  const loadSuppliers = async (pageNo = page, pageSize = limit) => {
    try {
      setLoading(true);
      const res = await getSuppliersApi(pageNo, pageSize);
      console.log(res);
      
      let records = [];
      if (res?.data?.records) {
        records = res.data.records;
      } else if (Array.isArray(res?.data)) {
        records = res.data;
      } else if (Array.isArray(res)) {
        records = res;
      }
      setRows(records.map(normalizeRow));
      setPage(pageNo);
    } catch (err) {
      console.error("load suppliers error", err);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return loadSuppliers(1, limit);
    try {
      setLoading(true);
      const res = await searchSupplierApi(searchText.trim());
      const records = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRows(records.map(normalizeRow));
      setPage(1);
    } catch (err) {
      console.error("search suppliers error", err);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderFilterDropdown = (label, key, list = []) => {
    const displayValue =
      {
        country: filterCountry,
        state: filterState,
        city: filterCity,
        region: filterRegion,
        group: filterGroup,
      }[key] || "";

    return (
      <div className="relative w-48" ref={dropdownRefs[key]} key={key}>
        <div
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm cursor-pointer flex justify-between items-center"
          onClick={() =>
            setDropdownOpen((prev) => ({ ...prev, [key]: !prev[key] }))
          }
        >
          <span className={displayValue ? "text-white" : "text-gray-400"}>
            {displayValue || `Select ${label}`}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {dropdownOpen[key] && (
          <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[220px] overflow-auto">
            <div className="p-2">
              <input
                value={filterSearch[key]}
                onChange={(e) =>
                  setFilterSearch((p) => ({ ...p, [key]: e.target.value }))
                }
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="max-h-48 overflow-auto">
              {list
                .filter((item) => {
                  const txt =
                    item.CountryName ||
                    item.StateName ||
                    item.CityName ||
                    item.RegionName ||
                    item.regionName ||
                    item.GroupName ||
                    item.groupName ||
                    item.SupplierGroupName ||
                    item.name ||
                    item.label ||
                    "";
                  return txt
                    .toString()
                    .toLowerCase()
                    .includes(filterSearch[key].toLowerCase());
                })
                .map((item) => {
                  const val =
                    item.CountryName ||
                    item.StateName ||
                    item.CityName ||
                    item.RegionName ||
                    item.regionName ||
                    item.GroupName ||
                    item.groupName ||
                    item.SupplierGroupName ||
                    item.name ||
                    item.label ||
                    "";
                  return (
                    <div
                      key={item.Id ?? item.id}
                      onClick={() => {
                        const setter = {
                          country: setFilterCountry,
                          state: setFilterState,
                          city: setFilterCity,
                          region: setFilterRegion,
                          group: setFilterGroup,
                        }[key];
                        if (setter) setter(val);
                        setDropdownOpen((prev) => ({ ...prev, [key]: false }));
                      }}
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {val}
                    </div>
                  );
                })}
              {list.length === 0 && (
                <div className="px-3 py-2 text-gray-400 text-sm">
                  No options
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --------------------------------------
  // Close dropdown when clicking outside
  // --------------------------------------
  useEffect(() => {
    const handler = (e) => {
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

  // --------------------------------------
  // Render
  // --------------------------------------
  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
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
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible Columns */}
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
                            setTempVisibleColumns((p) => ({
                              ...p,
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

              {/* Hidden Columns */}
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
                            setTempVisibleColumns((p) => ({
                              ...p,
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

            <div className="sticky bottom-5 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
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
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Suppliers</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search suppliers..."
              value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => navigate("/app/businesspartners/newsupplier")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Supplier
          </button>

          <button
            onClick={() => loadSuppliers(page, limit)}
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

          <button className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-1">
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-2 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
          {renderFilterDropdown("Country", "country", lookupLists.countries)}
          {renderFilterDropdown("State", "state", lookupLists.states)}
          {renderFilterDropdown("City", "city", lookupLists.cities)}
          {renderFilterDropdown("Region", "region", lookupLists.regions)}
          {renderFilterDropdown("Group", "group", lookupLists.groups)}

          <button
            onClick={() => {
              setFilterCountry("");
              setFilterState("");
              setFilterCity("");
              setFilterRegion("");
              setFilterGroup("");
            }}
            className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm"
          >
            Reset
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[2500px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10 h-10">
                <tr className="text-white text-center">
                  {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                  {visibleColumns.companyName && (
                    <th className="pb-2 border-b">Company Name</th>
                  )}
                  {visibleColumns.contactName && (
                    <th className="pb-2 border-b">Contact Name</th>
                  )}
                  {visibleColumns.contactTitle && (
                    <th className="pb-2 border-b">Contact Title</th>
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
                  {visibleColumns.regionName && (
                    <th className="pb-2 border-b">Region</th>
                  )}
                  {visibleColumns.supplierGroupName && (
                    <th className="pb-2 border-b">Supplier Group</th>
                  )}
                  {visibleColumns.postalCode && (
                    <th className="pb-2 border-b">Postal</th>
                  )}
                  {visibleColumns.phone && (
                    <th className="pb-2 border-b">Phone</th>
                  )}
                  {visibleColumns.fax && (
                    <th className="pb-2 border-b">Fax</th>
                  )}
                  {visibleColumns.website && (
                    <th className="pb-2 border-b">Website</th>
                  )}
                  {visibleColumns.email && (
                    <th className="pb-2 border-b">Email</th>
                  )}
                  {visibleColumns.emailAddress && (
                    <th className="pb-2 border-b">Email Address</th>
                  )}
                  {visibleColumns.previousCreditBalance && (
                    <th className="pb-2 border-b">Prev Credit</th>
                  )}
                  {visibleColumns.cnic && (
                    <th className="pb-2 border-b">CNIC</th>
                  )}
                  {visibleColumns.ntn && <th className="pb-2 border-b">NTN</th>}
                  {visibleColumns.strn && (
                    <th className="pb-2 border-b">STRN</th>
                  )}
                  {visibleColumns.orderBooker && (
                    <th className="pb-2 border-b">Order Booker</th>
                  )}
                </tr>
              </thead>

              <tbody className="text-center h-14">
                {loading ? (
                  <tr>
                    <td colSpan={20} className="py-6 text-center text-gray-300">
                      Loading...
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="py-6 text-center text-gray-400">
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  sortedRows.slice(start - 1, end).map((r) => (
                    <tr
                      key={r.id ?? Math.random()}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                      onClick={() =>
                        navigate(
                          r.id
                            ? `/app/businesspartners/newsupplier/${r.id}`
                            : "/app/businesspartners/newsupplier",
                          { state: { supplier: r } }
                        )
                      }
                    >
                      {visibleColumns.id && <td className="py-2">{r.id}</td>}
                      {visibleColumns.companyName && (
                        <td className="py-2">{r.companyName}</td>
                      )}
                      {visibleColumns.contactName && (
                        <td className="py-2">{r.contactName}</td>
                      )}
                      {visibleColumns.contactTitle && (
                        <td className="py-2">{r.contactTitle}</td>
                      )}
                      {visibleColumns.countryName && (
                        <td className="py-2">
                          {lookupMaps.countries[String(r.countryId)] ||
                            r.countryName ||
                            ""}
                        </td>
                      )}
                      {visibleColumns.stateName && (
                        <td className="py-2">
                          {lookupMaps.states[String(r.stateId)] ||
                            r.stateName ||
                            ""}
                        </td>
                      )}
                      {visibleColumns.cityName && (
                        <td className="py-2">
                          {lookupMaps.cities[String(r.cityId)] ||
                            r.cityName ||
                            ""}
                        </td>
                      )}
                      {visibleColumns.regionName && (
                        <td className="py-2">
                          {lookupMaps.regions[String(r.regionId)] ||
                            r.regionName ||
                            ""}
                        </td>
                      )}
                      {visibleColumns.supplierGroupName && (
                        <td className="py-2">
                          {lookupMaps.groups[String(r.supplierGroupId)] ||
                            r.supplierGroupName ||
                            ""}
                        </td>
                      )}
                      {visibleColumns.postalCode && (
                        <td className="py-2">{r.postalCode}</td>
                      )}
                      {visibleColumns.phone && (
                        <td className="py-2">{r.phone}</td>
                      )}
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
                      {visibleColumns.orderBooker && (
                        <td className="py-2">{r.orderBooker}</td>
                      )}
                    </tr>
                  ))
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



