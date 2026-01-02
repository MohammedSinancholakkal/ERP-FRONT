// src/pages/attendance/Attendance.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  Save,
  Trash2,
  ArchiveRestore,
  X,
} from "lucide-react";

import {
  getEmployeesApi,
  getAttendanceApi,
  addAttendanceApi,
  searchAttendanceApi,
  getInactiveAttendanceApi,
  updateAttendanceApi,
  deleteAttendanceApi,
  restoreAttendanceApi,
} from "../../services/allAPI";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";
import SortableHeader from "../../components/SortableHeader";

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
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveRows, setInactiveRows] = useState([]);

  // Edit/Restore Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    employeeId: null,
    employee: "",
    checkInDate: "",
    checkInTime: "",
    checkOutDate: "",
    checkOutTime: "",
    isInactive: false, // track if we are editing an inactive record
  });

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
  const [employees, setEmployees] = useState([]);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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





  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const sortedRows = React.useMemo(() => {
    if (!sortConfig.key) return rows;
    const sorted = [...rows].sort((a, b) => {
        const aVal = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : "";
        const bVal = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });
    return sorted;
  }, [rows, sortConfig]);

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
          employeeId: item.employeeId, // Store raw ID for editing
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
          employeeId: item.employeeId, // Store raw ID for editing
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

  const loadInactiveAttendance = async () => {
    try {
      const res = await getInactiveAttendanceApi();
      const records = res?.data?.records || [];
      const formatted = records.map((item) => {
        const emp = employees.find((e) => e.Id === item.employeeId);
        const { date: inDate, time: inTime } = splitDateTime(item.checkIn);
        const { date: outDate, time: outTime } = splitDateTime(item.checkOut);
        return {
          id: item.id,
          employeeId: item.employeeId,
          employee: emp ? `${emp.FirstName} ${emp.LastName}` : "Unknown",
          checkIn: `${inDate} ${inTime}`,
          checkOut: item.checkOut ? `${outDate} ${outTime}` : "-",
          stayTime: item.checkOut
            ? calculateStayTime(inDate, inTime, outDate, outTime)
            : "-",
          isInactive: true,
        };
      });
      setInactiveRows(formatted);
    } catch (err) {
      console.error("Failed to load inactive attendance", err);
      toast.error("Failed to load inactive records");
    }
  };

  const handleRowClick = (row) => {
    // Prepare form for edit
    const { date: inDate, time: inTime } = splitDateTime(row.checkIn);
    const { date: outDate, time: outTime } = splitDateTime(row.checkOut !== "-" ? row.checkOut : null);
    
    setEditForm({
      id: row.id,
      employeeId: row.employeeId, 
      employee: row.employee,
      checkInDate: inDate || "",
      checkInTime: inTime || "",
      checkOutDate: outDate || "",
      checkOutTime: outTime || "",
      isInactive: row.isInactive || false,
    });
    setActionModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editForm.employeeId) return toast.error("Employee required");
    
    const checkIn = `${editForm.checkInDate} ${editForm.checkInTime}`;
    const checkOut = `${editForm.checkOutDate} ${editForm.checkOutTime}`;

    try {
      await updateAttendanceApi(editForm.id, {
        employeeId: editForm.employeeId,
        checkIn,
        checkOut,
        userId: 1
      });
      toast.success("Attendance updated");
      setActionModalOpen(false);
      loadAttendance();
    } catch(err) {
      console.error("Update failed", err);
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Attendance?",
      text: "This record will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteAttendanceApi(editForm.id, { userId: 1 });
      Swal.fire({
        title: "Deleted!",
        text: "Record has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setActionModalOpen(false);
      loadAttendance();
      if (showInactive) loadInactiveAttendance();
    } catch (err) {
      console.error("Delete failed", err);
      Swal.fire({
        title: "Error!",
        text: "Failed to delete record.",
        icon: "error",
      });
    }
  };

  const handleRestore = async () => {
    const result = await Swal.fire({
        title: "Restore Attendance?",
        text: "This record will be restored!",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, restore",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });
  
      if (!result.isConfirmed) return;

    try {
      await restoreAttendanceApi(editForm.id, { userId: 1 });
      Swal.fire({
        title: "Restored!",
        text: "Record has been restored.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setActionModalOpen(false);
      loadAttendance();
      loadInactiveAttendance();
    } catch (err) {
      console.error("Restore failed", err);
      Swal.fire({
        title: "Error!",
        text: "Failed to restore record.",
        icon: "error",
      });
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

          <div className="relative w-[700px] max-h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white p-5 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add Attendance</h2>

            <div className="mb-4">
              <label className="text-sm opacity-80 mb-1 block">Employee</label>
              <SearchableSelect
                value={form.employeeId}
                onChange={(val) => {
                    const emp = employees.find(e => e.Id === val);
                    setForm({ 
                        ...form, 
                        employeeId: val, 
                        employee: emp ? `${emp.FirstName} ${emp.LastName}` : "" 
                    });
                }}
                options={employees.map(e => ({ id: e.Id, name: `${e.FirstName} ${e.LastName}` }))}
                placeholder="Select employee"
                className="w-full"
              />
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

      {/* EDIT / RESTORE MODAL */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActionModalOpen(false)} />
            
            <div className="relative w-[700px] max-h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white p-5 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        {editForm.isInactive ? "Restore Attendance" : "Edit Attendance"}
                    </h2>
                    <button onClick={() => setActionModalOpen(false)}>
                        <X size={20} className="text-gray-400 hover:text-white" />
                    </button>
                </div>

                {/* EMPLOYEE */}
                <div className="mb-4">
                    <label className="text-sm opacity-80 mb-1 block">Employee</label>
                    <SearchableSelect
                        value={editForm.employeeId}
                        onChange={(val) => {
                             const emp = employees.find(e => e.Id === val);
                             setEditForm({ ...editForm, employeeId: val, employee: emp ? `${emp.FirstName} ${emp.LastName}` : "" });
                        }}
                        options={employees.map(e => ({ id: e.Id, name: `${e.FirstName} ${e.LastName}` }))}
                        placeholder="Select employee"
                        className="w-full"
                        disabled={editForm.isInactive}
                    />
                </div>

                 <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm opacity-80">Check In Date</label>
                        <input
                            type="date"
                            value={editForm.checkInDate}
                            onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                            disabled={editForm.isInactive}
                        />
                    </div>
                    <div>
                        <label className="text-sm opacity-80">Check In Time</label>
                        <input
                            type="time"
                            value={editForm.checkInTime}
                            onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                            disabled={editForm.isInactive}
                        />
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm opacity-80">Check Out Date</label>
                        <input
                            type="date"
                            value={editForm.checkOutDate}
                            onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                            disabled={editForm.isInactive}
                        />
                    </div>
                    <div>
                        <label className="text-sm opacity-80">Check Out Time</label>
                        <input
                            type="time"
                            value={editForm.checkOutTime}
                            onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1"
                            disabled={editForm.isInactive}
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-6 border-t border-gray-700 pt-4">
                    {editForm.isInactive ? (
                        hasPermission(PERMISSIONS.HR.ATTENDANCE.DELETE) && (
                        <button 
                            onClick={handleRestore}
                            className="flex items-center gap-2 bg-green-600/20 border border-green-600 text-green-400 px-4 py-2 rounded hover:bg-green-600/30"
                        >
                            <ArchiveRestore size={16} /> Restore
                        </button>
                        )
                    ) : (
                         hasPermission(PERMISSIONS.HR.ATTENDANCE.DELETE) && (
                         <button 
                            onClick={handleDelete}
                            className="flex items-center gap-2 bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded hover:bg-red-600/30"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                        )
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setActionModalOpen(false)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                            Cancel
                        </button>
                        {!editForm.isInactive && hasPermission(PERMISSIONS.HR.ATTENDANCE.EDIT) && (
                            <button onClick={handleUpdate} className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300">
                                <Save size={16} /> Save
                            </button>
                        )}
                    </div>
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

              {hasPermission(PERMISSIONS.HR.ATTENDANCE.CREATE) && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
              >
                <Plus size={16} /> Add Attendance
              </button>
              )}

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

              <button
                onClick={async () => {
                  if (!showInactive) await loadInactiveAttendance();
                  setShowInactive(!showInactive);
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-2 hover:bg-gray-600"
              >
                <ArchiveRestore size={16} className="text-yellow-400" />
                <span className="text-xs text-gray-300">
                  {showInactive ? "Mask" : "Show"} Inactive
                </span>
              </button>
            </div>

            <div className="flex-grow overflow-auto w-full min-h-0">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] border-separate border-spacing-y-1 text-sm table-fixed">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                      {visibleColumns.id && (
                        <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
                      )}
                      {visibleColumns.employee && (
                         <SortableHeader label="Employee" sortKey="employee" currentSort={sortConfig} onSort={handleSort} />
                      )}
                      {visibleColumns.checkIn && (
                        <SortableHeader label="Check In" sortKey="checkIn" currentSort={sortConfig} onSort={handleSort} />
                      )}
                      {visibleColumns.checkOut && (
                         <SortableHeader label="Check Out" sortKey="checkOut" currentSort={sortConfig} onSort={handleSort} />
                      )}
                      {visibleColumns.stayTime && (
                         <SortableHeader label="Stay Time" sortKey="stayTime" currentSort={sortConfig} onSort={handleSort} />
                      )}
                    </tr>
                  </thead>

                  <tbody className="text-center">
                    {sortedRows.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => handleRowClick(r)}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
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

                    {/* INACTIVE ROWS */}
                    {showInactive && inactiveRows.map((r) => (
                      <tr
                        key={`inactive-${r.id}`}
                        onClick={() => handleRowClick(r)}
                        className="bg-gray-900 opacity-50 line-through cursor-pointer hover:bg-gray-800"
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



