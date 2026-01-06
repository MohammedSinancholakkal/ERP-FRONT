// src/pages/attendance/Attendance.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  // Other icons handled by MasterTable
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";

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
// import SortableHeader from "../../components/SortableHeader"; // REMOVED
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";

const Attendance = () => {
  const { theme } = useTheme();
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
      {/* COLUMN PICKER */}
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveAttendance}
        title="Add Attendance"
        width="700px"
        permission={hasPermission(PERMISSIONS.HR.ATTENDANCE.CREATE)}
      >
        <div className="p-0 space-y-4">
          <div className="mb-4">
            <label className="text-sm opacity-80 mb-1 block">Employee</label>
            <SearchableSelect
              value={form.employeeId}
              onChange={(val) => {
                const emp = employees.find((e) => e.Id === val);
                setForm({
                  ...form,
                  employeeId: val,
                  employee: emp ? `${emp.FirstName} ${emp.LastName}` : "",
                });
              }}
              options={employees.map((e) => ({
                id: e.Id,
                name: `${e.FirstName} ${e.LastName}`,
              }))}
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
              />
            </div>
          </div>
        </div>
      </AddModal>

      {/* EDIT / RESTORE MODAL */}
      <EditModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        isInactive={editForm.isInactive}
        title={editForm.isInactive ? "Restore Attendance" : "Edit Attendance"}
        permissionDelete={hasPermission(PERMISSIONS.HR.ATTENDANCE.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.HR.ATTENDANCE.EDIT)}
        width="700px"
      >
        <div className="p-0 space-y-4">
          {/* EMPLOYEE */}
          <div className="mb-4">
            <label className="text-sm opacity-80 mb-1 block">Employee</label>
            <SearchableSelect
              value={editForm.employeeId}
              onChange={(val) => {
                const emp = employees.find((e) => e.Id === val);
                setEditForm({
                  ...editForm,
                  employeeId: val,
                  employee: emp ? `${emp.FirstName} ${emp.LastName}` : "",
                });
              }}
              options={employees.map((e) => ({
                id: e.Id,
                name: `${e.FirstName} ${e.LastName}`,
              }))}
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
                onChange={(e) =>
                  setEditForm({ ...editForm, checkInDate: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
                disabled={editForm.isInactive}
              />
            </div>
            <div>
              <label className="text-sm opacity-80">Check In Time</label>
              <input
                type="time"
                value={editForm.checkInTime}
                onChange={(e) =>
                  setEditForm({ ...editForm, checkInTime: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
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
                onChange={(e) =>
                  setEditForm({ ...editForm, checkOutDate: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
                disabled={editForm.isInactive}
              />
            </div>
            <div>
              <label className="text-sm opacity-80">Check Out Time</label>
              <input
                type="time"
                value={editForm.checkOutTime}
                onChange={(e) =>
                  setEditForm({ ...editForm, checkOutTime: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1"
                disabled={editForm.isInactive}
              />
            </div>
          </div>
        </div>
      </EditModal>

      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Attendance</h2>

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.employee && { key: "employee", label: "Employee", sortable: true },
                    visibleColumns.checkIn && { key: "checkIn", label: "Check In", sortable: true },
                    visibleColumns.checkOut && { key: "checkOut", label: "Check Out", sortable: true },
                    visibleColumns.stayTime && { key: "stayTime", label: "Stay Time", sortable: true },
                ].filter(Boolean)}
                data={sortedRows}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={handleRowClick}
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => setModalOpen(true)}
                createLabel="Add Attendance"
                permissionCreate={hasPermission(PERMISSIONS.HR.ATTENDANCE.CREATE)}
                onRefresh={() => loadAttendance()}
                onColumnSelector={() => {
                    setTempVisibleColumns(visibleColumns);
                    setColumnModalOpen(true);
                }}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactiveAttendance();
                    setShowInactive(!showInactive);
                }}
            />

             {/* PAGINATION */}
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
              />
          </div>
        </div>
      </PageLayout>

    </>
  );
};

export default Attendance;



