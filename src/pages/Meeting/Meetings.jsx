import React, { useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";

/* Searchable Dropdown */
const SearchableDropdown = ({ options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered =
    !query.trim()
      ? options
      : options.filter((o) =>
          o.name.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((o) => o.id == value)?.name || "";

  return (
    <div className="relative w-56">
      <input
        type="text"
        value={open ? query : selected || query}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-sm"
      />

      {open && (
        <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded max-h-56 overflow-auto mt-1 z-50">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                {o.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

const Meetings = () => {
  /* Filters */
  const [searchText, setSearchText] = useState("");
  const [filterMeetingType, setFilterMeetingType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterOrganizedBy, setFilterOrganizedBy] = useState("");
  const [filterReporter, setFilterReporter] = useState("");

  /* UI */
  const [columnModal, setColumnModal] = useState(false);

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* Dropdown Data (sample only) */
  const meetingTypes = [
    { id: 1, name: "Internal" },
    { id: 2, name: "External" }
  ];

  const departments = [
    { id: 1, name: "HR" },
    { id: 2, name: "Sales" }
  ];

  const locations = [
    { id: 1, name: "Conference Room" },
    { id: 2, name: "Head Office" }
  ];

  const employees = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Doe" }
  ];

  /* Table Columns */
  const defaultColumns = {
    id: true,
    meetingName: true,
    meetingTypeName: true,
    startDate: true,
    endDate: true,
    department: true,
    locationName: true,
    organizedBy: true,
    reporter: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  /* Sample Data */
  const meetingData = [
    {
      id: 1,
      meetingName: "Monthly Review",
      meetingTypeName: "Internal",
      startDate: "2025-03-01 10:00",
      endDate: "2025-03-01 12:00",
      department: "Sales",
      locationName: "Conference Room",
      organizedBy: "John Doe",
      reporter: "Jane Doe"
    }
  ];

  return (
    <>
      {/* MAIN PAGE */}
            <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Meetings</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-3">

            {/* Search */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-56">
              <Search size={16} />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-transparent outline-none pl-2 text-sm w-full"
              />
            </div>

            <button className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600">
              <Plus size={16} /> New Meeting
            </button>

            <button className="p-1.5 bg-gray-700 border border-gray-600 rounded">
              <RefreshCw size={16} className="text-blue-300" />
            </button>

            <button
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
            >
              <List size={16} className="text-blue-300" />
            </button>

          </div>

          {/* FILTER BAR */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-900 p-3 rounded border border-gray-700 mb-4">

            <SearchableDropdown
              options={meetingTypes}
              value={filterMeetingType}
              onChange={setFilterMeetingType}
              placeholder="Meeting Type"
            />

            <input
              type="datetime-local"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />

            <input
              type="datetime-local"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />

            <SearchableDropdown
              options={departments}
              value={filterDepartment}
              onChange={setFilterDepartment}
              placeholder="Department"
            />

            <SearchableDropdown
              options={locations}
              value={filterLocation}
              onChange={setFilterLocation}
              placeholder="Location"
            />

            <SearchableDropdown
              options={employees}
              value={filterOrganizedBy}
              onChange={setFilterOrganizedBy}
              placeholder="Organized By"
            />

            <SearchableDropdown
              options={employees}
              value={filterReporter}
              onChange={setFilterReporter}
              placeholder="Reporter"
            />

            <button className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">
              Apply
            </button>

            <button
              onClick={() => {
                setFilterMeetingType("");
                setFilterStartDate("");
                setFilterEndDate("");
                setFilterDepartment("");
                setFilterLocation("");
                setFilterOrganizedBy("");
                setFilterReporter("");
              }}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              Clear
            </button>
          </div>

          {/* TABLE SCROLL AREA */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1600px] text-center border-separate border-spacing-y-1 text-sm w-full">

                <thead className="sticky top-0 bg-gray-900">
                  <tr>
                    {visibleColumns.id && <th className="pb-1 border-b">ID</th>}
                    {visibleColumns.meetingName && <th className="pb-1 border-b">Meeting Name</th>}
                    {visibleColumns.meetingTypeName && <th className="pb-1 border-b">Meeting Type</th>}
                    {visibleColumns.startDate && <th className="pb-1 border-b">Start Date</th>}
                    {visibleColumns.endDate && <th className="pb-1 border-b">End Date</th>}
                    {visibleColumns.department && <th className="pb-1 border-b">Department</th>}
                    {visibleColumns.locationName && <th className="pb-1 border-b">Location</th>}
                    {visibleColumns.organizedBy && <th className="pb-1 border-b">Organized By</th>}
                    {visibleColumns.reporter && <th className="pb-1 border-b">Reporter</th>}
                  </tr>
                </thead>

                <tbody>
                  {meetingData.map((m) => (
                    <tr
                      key={m.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.id && <td className="px-2 py-2">{m.id}</td>}
                      {visibleColumns.meetingName && <td className="px-2 py-2">{m.meetingName}</td>}
                      {visibleColumns.meetingTypeName && <td className="px-2 py-2">{m.meetingTypeName}</td>}
                      {visibleColumns.startDate && <td className="px-2 py-2">{m.startDate}</td>}
                      {visibleColumns.endDate && <td className="px-2 py-2">{m.endDate}</td>}
                      {visibleColumns.department && <td className="px-2 py-2">{m.department}</td>}
                      {visibleColumns.locationName && <td className="px-2 py-2">{m.locationName}</td>}
                      {visibleColumns.organizedBy && <td className="px-2 py-2">{m.organizedBy}</td>}
                      {visibleColumns.reporter && <td className="px-2 py-2">{m.reporter}</td>}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20">
            <div className="flex flex-wrap items-center gap-3 text-sm">

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsLeft size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              />

              <span>/ 1</span>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronRight size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsRight size={16} />
              </button>

            </div>
          </div>

        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default Meetings;
