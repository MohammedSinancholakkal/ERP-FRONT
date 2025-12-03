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
import { useNavigate } from "react-router-dom";

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

  // --------------------------------------
  // Dummy Data
  // --------------------------------------
  const sampleSuppliers = [
    {
      id: 1,
      companyName: "Mega Supplies",
      contactName: "Ahmad Khan",
      contactTitle: "Director",
      countryName: "Pakistan",
      stateName: "Sindh",
      cityName: "Karachi",
      regionName: "South",
      supplierGroupName: "Wholesale",
      postalCode: "75500",
      phone: "03001234567",
      fax: "021-99999",
      website: "https://megasupplies.com",
      email: "info@megasupplies.com",
      emailAddress: "sales@megasupplies.com",
      previousCreditBalance: 12000,
      cnic: "42101-9876543-2",
      ntn: "5544332",
      strn: "STRN-1122",
      orderBooker: "Hamza",
    },
  ];

  const [rows, setRows] = useState(sampleSuppliers);

  // --------------------------------------
  // Search
  // --------------------------------------
  const [searchText, setSearchText] = useState("");

  // --------------------------------------
  // Pagination
  // --------------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

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
        <h2 className="text-2xl font-semibold mb-4">Suppliers</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search suppliers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          <button
            onClick={() => navigate("/human-resource/new-employee")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Supplier
          </button>

          <button className="p-2 bg-gray-700 border border-gray-600 rounded">
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
          {[
            ["Country", "country"],
            ["State", "state"],
            ["City", "city"],
            ["Region", "region"],
            ["Group", "group"],
          ].map(([label, key]) => (
            <div
              className="relative w-40"
              ref={dropdownRefs[key]}
              key={key}
            >
              <input
                readOnly
                onClick={() =>
                  setDropdownOpen((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                value={
                  {
                    country: filterCountry,
                    state: filterState,
                    city: filterCity,
                    region: filterRegion,
                    group: filterGroup,
                  }[key] || ""
                }
                placeholder={`Filter by ${label}`}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm cursor-pointer"
              />

              {dropdownOpen[key] && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                  {["A", "B", "C"].map((v) => (
                    <div
                      key={v}
                      onClick={() => {
                        const setter = {
                          country: setFilterCountry,
                          state: setFilterState,
                          city: setFilterCity,
                          region: setFilterRegion,
                          group: setFilterGroup,
                        }[key];

                        if (setter) setter(v);
                        setDropdownOpen((prev) => ({ ...prev, [key]: false }));
                      }}
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {v}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

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
            <table className="min-w-[3300px] border-separate border-spacing-y-1 text-sm table-fixed">
              <thead className="sticky top-0 bg-gray-900 z-10">
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
                    <th className="pb-2 border-b">Group</th>
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

              <tbody className="text-center">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="bg-gray-900 hover:bg-gray-700 cursor-default"
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
                      <td className="py-2">{r.countryName}</td>
                    )}
                    {visibleColumns.stateName && (
                      <td className="py-2">{r.stateName}</td>
                    )}
                    {visibleColumns.cityName && (
                      <td className="py-2">{r.cityName}</td>
                    )}
                    {visibleColumns.regionName && (
                      <td className="py-2">{r.regionName}</td>
                    )}
                    {visibleColumns.supplierGroupName && (
                      <td className="py-2">{r.supplierGroupName}</td>
                    )}
                    {visibleColumns.postalCode && (
                      <td className="py-2">{r.postalCode}</td>
                    )}
                    {visibleColumns.phone && (
                      <td className="py-2">{r.phone}</td>
                    )}
                    {visibleColumns.fax && <td className="py-2">{r.fax}</td>}
                    {visibleColumns.website && (
                      <td className="py-2">{r.website}</td>
                    )}
                    {visibleColumns.email && (
                      <td className="py-2">{r.email}</td>
                    )}
                    {visibleColumns.emailAddress && (
                      <td className="py-2">{r.emailAddress}</td>
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
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
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
            Showing <b>{start}</b> to <b>{end}</b> of{" "}
            <b>{totalRecords}</b> records
          </span>
        </div>
        </div>
      </div>
      </PageLayout>

    </>
  );
};

export default Suppliers;
