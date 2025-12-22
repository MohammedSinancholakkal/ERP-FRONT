// src/pages/attendance/Attendance.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Save,
} from "lucide-react";

import {
  getEmployeesApi,
  getAttendanceApi,
  addAttendanceApi,
  searchAttendanceApi,
} from "../../services/allAPI";

import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

const Attendance = () => {
  const defaultColumns = {
    id: true,
    employee: true,
    checkIn: true,
    checkOut: true,
    stayTime: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    employee: "",
    employeeId: null,
    checkInDate: getTodayDate(),
    checkInTime: getCurrentTime(),
    checkOutDate: getTodayDate(),
    checkOutTime: getCurrentTime(),
  });

  const [employeeDDOpen, setEmployeeDDOpen] = useState(false);
  const employeeRef = useRef();

  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await getEmployeesApi(1, 5000);
        const records = Array.isArray(res?.data?.records)
          ? res.data.records
          : [];
        setEmployees(records);
      } catch (err) {
        console.error("Failed to load employees:", err);
      }
    };
    loadEmployees();
  }, []);


  const splitDateTime = (dateTime) => {
  if (!dateTime) return { date: null, time: null };
  const d = new Date(dateTime);
  return {
    date: d.toISOString().split("T")[0],
    time: d.toTimeString().slice(0, 5),
  };
};



  useEffect(() => {
    const handler = (e) => {
      if (employeeRef.current && !employeeRef.current.contains(e.target)) {
        setEmployeeDDOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const calculateStayTime = (inDate, inTime, outDate, outTime) => {
    const start = new Date(`${inDate}T${inTime}`);
    const end = new Date(`${outDate}T${outTime}`);
    const diffMs = end - start;
    if (diffMs <= 0) return "0h";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    return `${hours}h ${minutes}m`;
  };

  const [searchText, setSearchText] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const loadAttendance = async () => {
    try {
      if (searchText.trim() !== "") {
        const res = await searchAttendanceApi(searchText);
        const data = res?.data || [];

        const formatted = data.map((item) => {
        const { date: inDate, time: inTime } = splitDateTime(item.checkIn);
        const { date: outDate, time: outTime } = splitDateTime(item.checkOut);

        return {
          id: item.id,
          employee: emp ? `${emp.FirstName} ${emp.LastName}` : "Unknown",
          checkIn: `${inDate} ${inTime}`,
          checkOut: item.checkOut ? `${outDate} ${outTime}` : "-",
          stayTime: item.checkOut
            ? calculateStayTime(inDate, inTime, outDate, outTime)
            : "-",
        };

        });

        setRows(formatted);
        setTotal(formatted.length);
        return;
      }

      const res = await getAttendanceApi(page, limit);
      const data = res?.data?.records || [];

      const formatted = data.map((item) => {
        const emp = employees.find((e) => e.Id === item.employeeId);  // ✅ FIX ADDED

        const { date: inDate, time: inTime } = splitDateTime(item.checkIn);
        const { date: outDate, time: outTime } = splitDateTime(item.checkOut);

        return {
          id: item.id,
          employee: emp ? `${emp.FirstName} ${emp.LastName}` : "Unknown",
          checkIn: `${inDate} ${inTime}`,
          checkOut: item.checkOut ? `${outDate} ${outTime}` : "-",
          stayTime: item.checkOut
            ? calculateStayTime(inDate, inTime, outDate, outTime)
            : "-",
        };
      });


      setRows(formatted);    
      setTotal(res?.data?.total || 0);
    } catch (err) {
      console.error("Failed to load attendance:", err);
    }
  };

  useEffect(() => {
    if (employees.length > 0) loadAttendance();
  }, [page, limit, searchText, employees]);

  const saveAttendance = async () => {
    if (!form.employeeId) {
      alert("Please select an employee");
      return;
    }

    const checkIn = `${form.checkInDate} ${form.checkInTime}`;
    const checkOut = `${form.checkOutDate} ${form.checkOutTime}`;

    try {  
      await addAttendanceApi({
        employeeId: form.employeeId,
        checkIn,
        checkOut,
        userId: 1,
      });

      loadAttendance();
      setModalOpen(false);

      setForm({
        employee: "",
        employeeId: null,
        checkInDate: getTodayDate(),
        checkInTime: getCurrentTime(),
        checkOutDate: getTodayDate(),
        checkOutTime: getCurrentTime(),
      });
    } catch (err) {
      console.error("Failed to save attendance:", err);
      alert("Failed to save attendance");
    }
  };

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  return (
    <>
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />
          <div className="relative w-[600px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
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
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[45vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((c) => tempVisibleColumns[c])
                    .filter((c) => c.includes(columnSearch))
                    .map((c) => (
                      <div
                        key={c}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                      >
                        <span>{c}</span>
                        <button
                          className="text-red-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [c]: false,
                            }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[45vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((c) => !tempVisibleColumns[c])
                    .filter((c) => c.includes(columnSearch))
                    .map((c) => (
                      <div
                        key={c}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                      >
                        <span>{c}</span>
                        <button
                          className="text-green-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [c]: true,
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

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[500px] max-h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white p-5 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add Attendance</h2>

            <div className="mb-4" ref={employeeRef}>
              <label className="text-sm opacity-80">Employee</label>
              <input
                readOnly
                value={form.employee}
                onClick={() => {
                  setEmployeeSearch("");
                  setEmployeeDDOpen(!employeeDDOpen);
                }}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1 cursor-pointer"
                placeholder="Select employee"
              />

              {employeeDDOpen && (
                <div className="bg-gray-800 border border-gray-700 rounded mt-1 max-h-40 overflow-auto">
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full bg-gray-900 border-b border-gray-700 px-3 py-2 text-sm outline-none"
                  />

                  {employees
                    .filter((emp) =>
                      `${emp.FirstName} ${emp.LastName}`
                        .toLowerCase()
                        .includes(employeeSearch.toLowerCase())
                    )
                    .map((emp) => (
                      <div
                        key={emp.Id}
                        onClick={() => {
                          setForm((p) => ({
                            ...p,
                            employee: `${emp.FirstName} ${emp.LastName}`,
                            employeeId: emp.Id,
                          }));
                          setEmployeeDDOpen(false);
                          setEmployeeSearch("");
                        }}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                      >
                        {emp.FirstName} {emp.LastName}
                      </div>
                    ))}

                  {employees.length === 0 && (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No employees found
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm opacity-80">Check In Date</label>
                <input
                  type="date"
                  value={form.checkInDate}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      checkInDate: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm opacity-80">Check In Time</label>
                <input
                  type="time"
                  value={form.checkInTime}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      checkInTime: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                />
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm opacity-80">Check Out Date</label>
                <input
                  type="date"
                  value={form.checkOutDate}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      checkOutDate: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm opacity-80">Check Out Time</label>
                <input
                  type="time"
                  value={form.checkOutTime}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      checkOutTime: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveAttendance}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Attendance</h2>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
                <Search size={16} className="text-gray-300" />
                <input
                  placeholder="Search attendance..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-transparent pl-2 text-sm w-full outline-none"
                />
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
              >
                <Plus size={16} /> Add Attendance
              </button>

              <button
                onClick={() => loadAttendance()}
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
            </div>

            <div className="flex-grow overflow-auto w-full min-h-0">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] border-separate border-spacing-y-1 text-sm table-fixed">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                      {visibleColumns.id && (
                        <th className="pb-2 border-b">ID</th>
                      )}
                      {visibleColumns.employee && (
                        <th className="pb-2 border-b">Employee</th>
                      )}
                      {visibleColumns.checkIn && (
                        <th className="pb-2 border-b">Check In</th>
                      )}
                      {visibleColumns.checkOut && (
                        <th className="pb-2 border-b">Check Out</th>
                      )}
                      {visibleColumns.stayTime && (
                        <th className="pb-2 border-b">Stay Time</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="text-center">
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className="bg-gray-900 hover:bg-gray-700 cursor-default"
                      >
                        {visibleColumns.id && (
                          <td className="py-2">{r.id}</td>
                        )}
                        {visibleColumns.employee && (
                          <td className="py-2">{r.employee}</td>
                        )}
                        {visibleColumns.checkIn && (
                          <td className="py-2">{r.checkIn}</td>
                        )}
                        {visibleColumns.checkOut && (
                          <td className="py-2">{r.checkOut}</td>
                        )}
                        {visibleColumns.stayTime && (
                          <td className="py-2">{r.stayTime}</td>
                        )}
                      </tr>
                    ))}
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
                // onRefresh={handleRefresh}
              />
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Attendance;



