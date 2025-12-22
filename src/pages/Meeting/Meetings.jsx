import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  ChevronsLeft, // Keep if referenced elsewhere, or remove if unused after refactor
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";

import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";

import PageLayout from "../../layout/PageLayout";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  getMeetingsApi, 
  getInactiveMeetingsApi, 
  restoreMeetingApi 
} from "../../services/allAPI";
import toast from "react-hot-toast";

/* Searchable Filter Dropdown (Same as Employees.jsx) */
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
    const name = item.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="relative w-40" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs hover:bg-gray-700 text-white"
      >
        <span className="truncate">{value || label}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[250px] flex flex-col text-white">
          <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 text-white"
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
                const name = item.name || "";
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
              <div className="px-3 py-2 text-gray-500 text-xs text-center">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Meetings = () => {
  const navigate = useNavigate();

  /* Column Visibility State */
  const defaultColumns = {
    id: true,
    meetingName: true,
    meetingType: true,
    startDate: true,
    endDate: true,
    department: true,
    location: true,
    organizedBy: true,
    reporter: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const columnModalRef = useRef(null);

  /* Inactive State */
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveMeetings, setInactiveMeetings] = useState([]);

  /* Filters State */
  const [searchText, setSearchText] = useState("");
  const [filterMeetingType, setFilterMeetingType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterOrganizedBy, setFilterOrganizedBy] = useState("");
  const [filterReporter, setFilterReporter] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* Data */
  const [allMeetings, setAllMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /* Derived Filter Lists */
  const [dropdownOptions, setDropdownOptions] = useState({
    meetingTypes: [],
    startDates: [],
    endDates: [],
    departments: [],
    locations: [],
    organizers: [],
    reporters: []
  });

  /* ================================
     LOAD ACTIVE MEETINGS
  =================================*/
  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await getMeetingsApi(1, 5000); // Fetch all for client-side filtering

      if (res?.data) {
        let records = res.data.records || res.data || [];
        if (!Array.isArray(records)) records = [];
        setAllMeetings(records);
        
        const unique = (key) => [...new Set(records.map(r => r[key]).filter(Boolean))].sort().map(val => ({ name: val }));
        
        setDropdownOptions({
          meetingTypes: unique('meetingType'),
          startDates: unique('startDate'),
          endDates: unique('endDate'),
          departments: unique('department'),
          locations: unique('location'),
          organizers: unique('organizedBy'),
          reporters: unique('reporter'),
        });
      }
    } catch (err) {
      console.log("LOAD MEETINGS ERROR:", err);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     LOAD INACTIVE MEETINGS
  =================================*/
  const loadInactiveMeetings = async () => {
    try {
      // Don't set main loading to true to avoid hiding active table
      const res = await getInactiveMeetingsApi();
      if (res.status === 200) {
        setInactiveMeetings(res.data.records || res.data || []);
      }
    } catch (err) {
      console.log("LOAD INACTIVE ERROR:", err);
      toast.error("Failed to load inactive meetings");
    }
  };

  /* ================================
     RESTORE MEETING
  =================================  /* RESTORE MEETING */
  const handleRestore = async (id) => {
    const result = await Swal.fire({
      title: "Restore Meeting?",
      text: "This meeting will be moved back to the active list.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // Green for restore
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: "#1f2937", // Dark mode
      color: "#fff"
    });

    if (!result.isConfirmed) return;

    try {
      await restoreMeetingApi(id, { userId: 1 });
      toast.success("Meeting restored successfully");
      loadMeetings(false); // Reload and stay on inactive view or active view? Usually active view is default but let's just reload.
      // Or if we want to remove it from the inactive list instantly:
      setInactiveMeetings(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("RESTORE ERROR:", error);
      toast.error("Failed to restore meeting");
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  /* Filter Logic - ACTIVE ONLY */
  useEffect(() => {
    let result = Array.isArray(allMeetings) ? allMeetings : [];

    // Search Text
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(m => 
        Object.values(m).some(val => String(val).toLowerCase().includes(q))
      );
    }

    // Dropdown Filters
    if (filterMeetingType) result = result.filter(m => m.meetingType === filterMeetingType);
    if (filterStartDate) result = result.filter(m => m.startDate === filterStartDate);
    if (filterEndDate) result = result.filter(m => m.endDate === filterEndDate);
    if (filterDepartment) result = result.filter(m => m.department === filterDepartment);
    if (filterLocation) result = result.filter(m => m.location === filterLocation);
    if (filterOrganizedBy) result = result.filter(m => m.organizedBy === filterOrganizedBy);
    if (filterReporter) result = result.filter(m => m.reporter === filterReporter);

    // Sorting Logic
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = String(a[sortConfig.key] || "").toLowerCase();
        const valB = String(b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredMeetings(result);
    setPage(1); 
  }, [
    allMeetings, 
    searchText, 
    filterMeetingType, 
    filterStartDate, 
    filterEndDate, 
    filterDepartment, 
    filterLocation, 
    filterOrganizedBy, 
    filterReporter
  ]);

  /* Pagination Logic */
  const safeFiltered = Array.isArray(filteredMeetings) ? filteredMeetings : [];
  const total = safeFiltered.length;
  const totalPages = Math.ceil(total / limit);
  const startIdx = (page - 1) * limit;
  const paginatedData = safeFiltered.slice(startIdx, startIdx + limit);
  const endIdx = Math.min(startIdx + limit, total);
  const startRec = total === 0 ? 0 : startIdx + 1;

  // Close dropdowns logic
  useEffect(() => {
    const handler = (e) => {
      if (columnModalRef.current && columnModalRef.current.contains(e.target)) {
        return;
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setColumnModalOpen(false)} />
          <div ref={columnModalRef} className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModalOpen(false)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <div className="px-5 py-3">
              <input 
                type="text" 
                placeholder="Search column..." 
                value={columnSearch} 
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())} 
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" 
              />
            </div>
            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns).filter(col => tempVisibleColumns[col] && col.toLowerCase().includes(columnSearch)).map(col => (
                    <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                      <span>{col}</span>
                      <button className="text-red-400" onClick={() => setTempVisibleColumns(p => ({ ...p, [col]: false }))}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Hidden */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns).filter(col => !tempVisibleColumns[col] && col.toLowerCase().includes(columnSearch)).map(col => (
                    <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                      <span>{col}</span>
                      <button className="text-green-400" onClick={() => setTempVisibleColumns(p => ({ ...p, [col]: true }))}>➕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-5 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={() => setTempVisibleColumns(defaultColumns)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 text-white">Restore Defaults</button>
              <div className="flex gap-3">
                <button onClick={() => setColumnModalOpen(false)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 text-white">Cancel</button>
                <button onClick={() => { setVisibleColumns(tempVisibleColumns); setColumnModalOpen(false); }} className="px-3 py-2 bg-blue-600 border border-blue-500 rounded hover:bg-blue-500 text-white">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full flex flex-col">
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Meetings</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Search */}
              <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-56">
                <Search size={16} className="text-gray-300" />
                <input
                  type="text"
                  placeholder="search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-transparent outline-none pl-2 text-sm w-full text-white"
                />
              </div>

              <button
                className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-600 text-white"
                onClick={() => navigate("/app/meeting/meetings/new")}
              >
                <Plus size={16} /> New Meeting
              </button>

              <button
                className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
                onClick={loadMeetings}
              >
                <RefreshCw size={16} className="text-blue-300" />
              </button>

              <button 
                className="p-1.5 bg-gray-700 border border-gray-600 rounded"
                onClick={() => { setTempVisibleColumns(visibleColumns); setColumnModalOpen(true); }}
              >
                <List size={16} className="text-blue-300" />
              </button>

              <button 
                onClick={async () => {
                  if (!showInactive) await loadInactiveMeetings();
                  setShowInactive(!showInactive);
                }}
                className={`p-1.5 rounded-md border flex items-center gap-1 ${showInactive ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
              </button>
            </div>

            {/* FILTER BAR - Always Visible */}
            <div className="flex flex-wrap gap-2 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
                 <SearchableFilterDropdown label="Meeting Type" list={dropdownOptions.meetingTypes} value={filterMeetingType} onSelect={setFilterMeetingType} />
                 <SearchableFilterDropdown label="Start Date" list={dropdownOptions.startDates} value={filterStartDate} onSelect={setFilterStartDate} />
                 <SearchableFilterDropdown label="End Date" list={dropdownOptions.endDates} value={filterEndDate} onSelect={setFilterEndDate} />
                 <SearchableFilterDropdown label="Department" list={dropdownOptions.departments} value={filterDepartment} onSelect={setFilterDepartment} />
                 <SearchableFilterDropdown label="Location" list={dropdownOptions.locations} value={filterLocation} onSelect={setFilterLocation} />
                 <SearchableFilterDropdown label="Organized By" list={dropdownOptions.organizers} value={filterOrganizedBy} onSelect={setFilterOrganizedBy} />
                 <SearchableFilterDropdown label="Reporter" list={dropdownOptions.reporters} value={filterReporter} onSelect={setFilterReporter} />

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
                    className="px-3 py-1.5 bg-red-900/40 border border-red-700 rounded text-xs hover:bg-red-900/60 text-white"
                  >
                    Clear All
                  </button>
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1600px] text-center border-separate border-spacing-y-1 text-sm w-full">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white">
                      {visibleColumns.id && (
                        <SortableHeader
                          label="ID"
                          sortOrder={sortConfig.key === "id" ? sortConfig.direction : null}
                          onClick={() => handleSort("id")}
                        />
                      )}
                      {visibleColumns.meetingName && (
                        <SortableHeader
                          label="Meeting Name"
                          sortOrder={sortConfig.key === "meetingName" ? sortConfig.direction : null}
                          onClick={() => handleSort("meetingName")}
                        />
                      )}
                      {visibleColumns.meetingType && (
                        <SortableHeader
                          label="Meeting Type"
                          sortOrder={sortConfig.key === "meetingType" ? sortConfig.direction : null}
                          onClick={() => handleSort("meetingType")}
                        />
                      )}
                      {visibleColumns.startDate && (
                        <SortableHeader
                          label="Start Date"
                          sortOrder={sortConfig.key === "startDate" ? sortConfig.direction : null}
                          onClick={() => handleSort("startDate")}
                        />
                      )}
                      {visibleColumns.endDate && (
                        <SortableHeader
                          label="End Date"
                          sortOrder={sortConfig.key === "endDate" ? sortConfig.direction : null}
                          onClick={() => handleSort("endDate")}
                        />
                      )}
                      {visibleColumns.department && (
                        <SortableHeader
                          label="Department"
                          sortOrder={sortConfig.key === "department" ? sortConfig.direction : null}
                          onClick={() => handleSort("department")}
                        />
                      )}
                      {visibleColumns.location && (
                        <SortableHeader
                          label="Location"
                          sortOrder={sortConfig.key === "location" ? sortConfig.direction : null}
                          onClick={() => handleSort("location")}
                        />
                      )}
                      {visibleColumns.organizedBy && (
                        <SortableHeader
                          label="Organized By"
                          sortOrder={sortConfig.key === "organizedBy" ? sortConfig.direction : null}
                          onClick={() => handleSort("organizedBy")}
                        />
                      )}
                      {visibleColumns.reporter && (
                        <SortableHeader
                          label="Reporter"
                          sortOrder={sortConfig.key === "reporter" ? sortConfig.direction : null}
                          onClick={() => handleSort("reporter")}
                        />
                      )}
                    </tr>
                  </thead>

                  <tbody>
                     {loading ? (
                        <tr><td colSpan="9" className="py-8 text-gray-400">Loading meetings...</td></tr>
                     ) : (
                        <>
                          {paginatedData.length === 0 ? (
                            (!showInactive || inactiveMeetings.length === 0) && (
                              <tr><td colSpan="9" className="py-8 text-gray-400">No meetings found</td></tr>
                            )
                          ) : (
                            paginatedData.map((m) => (
                              <tr
                                key={m.id}
                                onClick={() => navigate(`/app/meeting/meetings/edit/${m.id}`)}
                                className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-gray-200"
                              >
                                {visibleColumns.id && <td className="px-2 py-2">{m.id}</td>}
                                {visibleColumns.meetingName && <td className="px-2 py-2">{m.meetingName}</td>}
                                {visibleColumns.meetingType && <td className="px-2 py-2">{m.meetingType}</td>}
                                {visibleColumns.startDate && <td className="px-2 py-2">{m.startDate}</td>}
                                {visibleColumns.endDate && <td className="px-2 py-2">{m.endDate}</td>}
                                {visibleColumns.department && <td className="px-2 py-2">{m.department}</td>}
                                {visibleColumns.location && <td className="px-2 py-2">{m.location}</td>}
                                {visibleColumns.organizedBy && <td className="px-2 py-2">{m.organizedBy}</td>}
                                {visibleColumns.reporter && <td className="px-2 py-2">{m.reporter}</td>}
                              </tr>
                            ))
                          )}

                          {/* INACTIVE MEETINGS */}
                          {showInactive && inactiveMeetings.map((m) => (
                             <tr
                               key={`inactive-${m.id}`}
                               onClick={() => handleRestore(m.id)}
                               className="bg-gray-900/50 opacity-60 line-through hover:bg-gray-800 cursor-pointer text-gray-200"
                             >
                               {visibleColumns.id && <td className="px-2 py-2">{m.id}</td>}
                               {visibleColumns.meetingName && <td className="px-2 py-2">{m.meetingName}</td>}
                               {visibleColumns.meetingType && <td className="px-2 py-2">{m.meetingType}</td>}
                               {visibleColumns.startDate && <td className="px-2 py-2">{m.startDate}</td>}
                               {visibleColumns.endDate && <td className="px-2 py-2">{m.endDate || "-"}</td>}
                               {visibleColumns.department && <td className="px-2 py-2">{m.department || "-"}</td>}
                               {visibleColumns.location && <td className="px-2 py-2">{m.location || "-"}</td>}
                               {visibleColumns.organizedBy && <td className="px-2 py-2">{m.organizedBy || "-"}</td>}
                               {visibleColumns.reporter && <td className="px-2 py-2">{m.reporter || "-"}</td>}
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
              total={total}
              onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadMeetings();
              }}
            />
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Meetings;



