// src/pages/meetings/NewMeeting.jsx
import React, { useState, useEffect } from "react";
import { Save, ArrowLeft, Plus, Pencil, Trash2, X } from "lucide-react";
import PageLayout from "../../layout/PageLayout";

import {
  addMeetingApi,
  getAttendeeTypesApi,
  getAttendanceStatusesApi,
  getEmployeesApi,
  getDepartmentsApi,
  getLocationsApi,
  getMeetingTypesApi,
} from "../../services/allAPI";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const NewMeeting = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    meetingName: "",
    meetingType: "",
    startDate: "",
    endDate: "",
    department: "",
    location: "",
    organizedBy: "",
    reporter: "",
    attendees: [],
  });

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const [employees, setEmployees] = useState([]);
  const [attendeeTypes, setAttendeeTypes] = useState([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [meetingTypes, setMeetingTypes] = useState([]);


  // useEffect(() => {
  //   loadDropdowns();
  // }, []);

  const normalizeRecords = (records) => {
    if (!Array.isArray(records)) return [];
    return records.map((r) => {
      const id = r.Id ?? r.id ?? r.ID ?? null;
      let name = null;
      if (r.FirstName || r.LastName) {
        name = `${r.FirstName ?? ""} ${r.LastName ?? ""}`.trim();
      } else {
        name = r.Name ?? r.name ?? r.label ?? "";
      }
      return { id, name };
    });
  };

 // ===============================
// SEPARATE LOADER FUNCTIONS
// ===============================

const loadEmployees = async () => {
  try {
    const res = await getEmployeesApi(1, 5000);
    setEmployees(normalizeRecords(res?.data?.records || []));
  } catch (err) {
    console.log("Employees Load Error:", err);
  }
};

const loadAttendeeTypes = async () => {
  try {
    const res = await getAttendeeTypesApi(1, 5000);
    setAttendeeTypes(normalizeRecords(res?.data?.records || []));
  } catch (err) {
    console.log("Attendee Types Load Error:", err);
  }
};

const loadAttendanceStatuses = async () => {
  try {
    const res = await getAttendanceStatusesApi(1, 5000);
    setAttendanceStatuses(normalizeRecords(res?.data?.records || []));
  } catch (err) {
    console.log("Attendance Status Load Error:", err);
  }
};
const loadDepartments = async () => {
  try {
    const res = await getDepartmentsApi(1, 5000);
    const records = res?.data?.records || [];

    const normalized = records.map((r) => ({
      id: r.id,
      name: r.department,   // 👈 FIX here
    }));

    setDepartments(normalized);
  } catch (err) {
    console.log("Departments Load Error:", err);
  }
};

const loadLocations = async () => {
  try {
    const res = await getLocationsApi(1, 5000);
    setLocations(normalizeRecords(res?.data?.records || []));
  } catch (err) {
    console.log("Locations Load Error:", err);
  }
};

const loadMeetingTypes = async () => {
  try {
    const res = await getMeetingTypesApi(1, 5000);
    setMeetingTypes(normalizeRecords(res?.data?.records || []));
  } catch (err) {
    console.log("Meeting Types Load Error:", err);
  }
};

// ===============================
// RUN ALL LOADERS SEPARATELY
// ===============================
useEffect(() => {
  loadEmployees();
  loadAttendeeTypes();
  loadAttendanceStatuses();
  loadDepartments();
  loadLocations();
  loadMeetingTypes();
}, []);



  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [attendeeForm, setAttendeeForm] = useState({
    attendee: "",
    attendeeType: "",
    attendanceStatus: "",
  });

  const saveAttendee = () => {
    if (
      !attendeeForm.attendee ||
      !attendeeForm.attendeeType ||
      !attendeeForm.attendanceStatus
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const newRow = {
      attendee:
        employees.find((e) => String(e.id) === String(attendeeForm.attendee))
          ?.name || "",
      attendeeType:
        attendeeTypes.find((t) => String(t.id) === String(attendeeForm.attendeeType))
          ?.name || "",
      attendanceStatus:
        attendanceStatuses.find(
          (s) => String(s.id) === String(attendeeForm.attendanceStatus)
        )?.name || "",
      attendeeId: attendeeForm.attendee,
      attendeeTypeId: attendeeForm.attendeeType,
      attendanceStatusId: attendeeForm.attendanceStatus,
    };

    let updated = [...form.attendees];

    if (editIndex !== null) {
      updated[editIndex] = newRow;
    } else {
      updated.push(newRow);
    }

    setForm({ ...form, attendees: updated });

    setShowAttendeeModal(false);
    setEditIndex(null);
    setAttendeeForm({
      attendee: "",
      attendeeType: "",
      attendanceStatus: "",
    });
  };

  const editAttendee = (index) => {
    const row = form.attendees[index];
    setAttendeeForm({
      attendee: row.attendeeId || "",
      attendeeType: row.attendeeTypeId || "",
      attendanceStatus: row.attendanceStatusId || "",
    });

    setEditIndex(index);
    setShowAttendeeModal(true);
  };

  const deleteAttendee = (index) => {
    const updated = form.attendees.filter((_, i) => i !== index);
    setForm({ ...form, attendees: updated });
  };


const formatDateTime = (value) => {
  if (!value) return null;
  return value.replace("T", " ") + ":00";
};

const handleSave = async () => {
  try {
    const userId = 1;

const payload = {
  ...form,
  attendees: form.attendees.map(a => ({
    attendeeId: a.attendeeId,
    attendeeTypeId: a.attendeeTypeId,
    attendanceStatusId: a.attendanceStatusId
  })),
  startDate: formatDateTime(form.startDate),
  endDate: formatDateTime(form.endDate),
  userId,
};


    console.log("📤 Sending Payload:", payload);

    const res = await addMeetingApi(payload);

    console.log("📥 API Response:", res);

    if (!form.meetingName || !form.startDate || !form.meetingType) {
  toast.error("Please fill all required fields");
  return;
}

    if (res?.status === 201 || res?.status === 200) {
      toast.success("Meeting Saved Successfully");
      navigate("/app/meeting/meetings");
    } else {
      toast.error("Failed to save meeting");
    }

  } catch (error) {
    console.error("ADD MEETING ERROR:", error);
    toast.error("Server Error");
  }
};



  return (
    <PageLayout>
      <div className="p-5 text-white bg-gradient-to-b from-gray-900 to-gray-700 min-h-[calc(100vh-80px)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/app/meeting/meetings")}
              className="p-2 bg-gray-800 rounded border border-gray-700"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-semibold">New Meeting</h2>
          </div>

          <button
            onClick={handleSave}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
          >
            <Save size={18} /> Save
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white">Meeting Name *</label>
                <input
                  type="text"
                  value={form.meetingName}
                  onChange={(e) => updateField("meetingName", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-white">Start Date *</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-white">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name} className="text-white bg-gray-800">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-white">Organized By</label>
                <select
                  value={form.organizedBy}
                  onChange={(e) => updateField("organizedBy", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.name} className="text-white bg-gray-800">
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white">Meeting Type *</label>
               <select
                  value={form.meetingType}
                  onChange={(e) => updateField("meetingType", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {meetingTypes.map((mt) => (
                    <option key={mt.id} value={mt.name} className="text-white bg-gray-800">
                      {mt.name}
                    </option>
                  ))}
                </select>

              </div>

              <div>
                <label className="text-sm text-white">End Date *</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-white">Location</label>
                <select
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.name} className="text-white bg-gray-800">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-white">Reporter</label>
                <select
                  value={form.reporter}
                  onChange={(e) => updateField("reporter", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.name} className="text-white bg-gray-800">
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className="text-sm text-white">Attendees</label>

            <button
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
              onClick={() => {
                setEditIndex(null);
                setAttendeeForm({
                  attendee: "",
                  attendeeType: "",
                  attendanceStatus: "",
                });
                setShowAttendeeModal(true);
              }}
            >
              <Plus size={16} /> Add
            </button>

            <div className="mt-3 bg-gray-800 border border-gray-700 rounded p-3">
              <table className="w-full text-left text-sm text-white">
                <thead className="text-gray-300 border-b border-gray-700">
                  <tr>
                    <th className="pb-2">Attendee</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {form.attendees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-gray-400 text-center">
                        No attendees yet
                      </td>
                    </tr>
                  ) : (
                    form.attendees.map((row, i) => (
                      <tr key={i} className="border-b border-gray-700">
                        <td className="py-2">{row.attendee}</td>
                        <td className="py-2">{row.attendeeType}</td>
                        <td className="py-2">{row.attendanceStatus}</td>

                        <td className="py-2 flex gap-3">
                          <Pencil
                            size={16}
                            className="text-yellow-400 cursor-pointer"
                            onClick={() => editAttendee(i)}
                          />
                          <Trash2
                            size={16}
                            className="text-red-400 cursor-pointer"
                            onClick={() => deleteAttendee(i)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

{showAttendeeModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto py-10 z-50">
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl">
      
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h3 className="text-white text-lg">
          {editIndex !== null ? "Edit Attendee" : "Add Attendee"}
        </h3>

        {/* TOP CLOSE BUTTON */}
        <X
          size={22}
          className="cursor-pointer hover:text-red-400"
          onClick={() => setShowAttendeeModal(false)}
        />
      </div>

      {/* ATTENDEE DROPDOWN */}
      <label className="text-sm text-white">Attendee *</label>
      <select
        value={attendeeForm.attendee}
        onChange={(e) =>
          setAttendeeForm({ ...attendeeForm, attendee: e.target.value })
        }
        className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1 mb-3"
      >
        <option value="">--select--</option>
        {employees.map((e) => (
          <option
            key={e.id}
            value={e.id}
            className="text-gray-200 bg-gray-800"   
          >
            {e.name}
          </option>
        ))}
      </select>

      {/* TYPE DROPDOWN */}
      <label className="text-sm text-white">Attendee Type *</label>
      <select
        value={attendeeForm.attendeeType}
        onChange={(e) =>
          setAttendeeForm({ ...attendeeForm, attendeeType: e.target.value })
        }
        className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1 mb-3"
      >
        <option value="">--select--</option>
        {attendeeTypes.map((t) => (
          <option
            key={t.id}
            value={t.id}
            className="text-gray-200 bg-gray-800"  
          >
            {t.name}
          </option>
        ))}
      </select>

      {/* STATUS DROPDOWN */}
      <label className="text-sm text-white">Attendance Status *</label>
      <select
        value={attendeeForm.attendanceStatus}
        onChange={(e) =>
          setAttendeeForm({ ...attendeeForm, attendanceStatus: e.target.value })
        }
        className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1 mb-6"
      >
        <option value="">--select--</option>
        {attendanceStatuses.map((s) => (
          <option
            key={s.id}
            value={s.id}
            className="text-gray-200 bg-gray-800"  
          >
            {s.name}
          </option>
        ))}
      </select>

      {/* FOOTER BUTTONS */}
      <div className="flex justify-end gap-3">

        {/* NEW CANCEL / CLOSE BUTTON */}
        <button
          onClick={() => setShowAttendeeModal(false)}
          className="flex items-center gap-2 bg-red-700 border border-gray-600 px-4 py-2 rounded text-sm text-gray-300 hover:bg-gray-600"
        >
          <X size={16} /> Close
        </button>

        {/* SAVE BUTTON */}
        <button
          onClick={saveAttendee}
          className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300 hover:bg-gray-700"
        >
          <Save size={16} /> Save
        </button>

      </div>

    </div>
  </div>
)}


    </PageLayout>
  );
};

export default NewMeeting;
