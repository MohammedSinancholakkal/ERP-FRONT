import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

import PageLayout from "../../layout/PageLayout";
import { useNavigate } from "react-router-dom";
import { getMeetingsApi } from "../../services/allAPI";

/* Searchable Dropdown */
const SearchableDropdown = ({ options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = !query.trim()
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
  const navigate = useNavigate();

  /* Filters */
  const [searchText, setSearchText] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* Table Data */
  const [meetingData, setMeetingData] = useState([]);
  const [total, setTotal] = useState(0);

  /* Column Visibility */
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

  /* ================================
     LOAD MEETINGS FROM DATABASE
  =================================*/
  const loadMeetings = async () => {
    try {
      const res = await getMeetingsApi(page, limit);

      if (res?.data) {
        setMeetingData(res.data.records || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.log("LOAD MEETINGS ERROR:", err);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [page, limit]);

  const totalPages = Math.ceil(total / limit);

  return (
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

            <button
              className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600"
              onClick={() => navigate("/app/meeting/meetings/new")}
            >
              <Plus size={16} /> New Meeting
            </button>

            <button
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
              onClick={loadMeetings}
            >
              <RefreshCw size={16} className="text-blue-300" />
            </button>

            <button className="p-1.5 bg-gray-700 border border-gray-600 rounded">
              <List size={16} className="text-blue-300" />
            </button>
          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1600px] text-center border-separate border-spacing-y-1 text-sm w-full">
                <thead className="sticky top-0 bg-gray-900">
                  <tr>
                    {visibleColumns.id && <th className="pb-1 border-b">ID</th>}
                    {visibleColumns.meetingName && (
                      <th className="pb-1 border-b">Meeting Name</th>
                    )}
                    {visibleColumns.meetingType && (
                      <th className="pb-1 border-b">Meeting Type</th>
                    )}
                    {visibleColumns.startDate && (
                      <th className="pb-1 border-b">Start Date</th>
                    )}
                    {visibleColumns.endDate && (
                      <th className="pb-1 border-b">End Date</th>
                    )}
                    {visibleColumns.department && (
                      <th className="pb-1 border-b">Department</th>
                    )}
                    {visibleColumns.location && (
                      <th className="pb-1 border-b">Location</th>
                    )}
                    {visibleColumns.organizedBy && (
                      <th className="pb-1 border-b">Organized By</th>
                    )}
                    {visibleColumns.reporter && (
                      <th className="pb-1 border-b">Reporter</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {meetingData.map((m) => (
                    <tr
                      key={m.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-2">{m.id}</td>
                      )}
                      {visibleColumns.meetingName && (
                        <td className="px-2 py-2">{m.meetingName}</td>
                      )}
                      {visibleColumns.meetingType && (
                        <td className="px-2 py-2">{m.meetingType}</td>
                      )}
                      {visibleColumns.startDate && (
                        <td className="px-2 py-2">{m.startDate}</td>
                      )}
                      {visibleColumns.endDate && (
                        <td className="px-2 py-2">{m.endDate}</td>
                      )}
                      {visibleColumns.department && (
                        <td className="px-2 py-2">{m.department}</td>
                      )}
                      {visibleColumns.location && (
                        <td className="px-2 py-2">{m.location}</td>
                      )}
                      {visibleColumns.organizedBy && (
                        <td className="px-2 py-2">{m.organizedBy}</td>
                      )}
                      {visibleColumns.reporter && (
                        <td className="px-2 py-2">{m.reporter}</td>
                      )}
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

              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              />

              <span>/ {totalPages}</span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <ChevronRight size={16} />
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1 bg-gray-800 border border-gray-700 rounded"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Meetings;
