// src/pages/meetings/NewMeeting.jsx
import React, { useState, useEffect } from "react";
import { Save, ArrowLeft, Plus, Pencil, Trash2, X, Star } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Swal from "sweetalert2";

import {
  addMeetingApi,
  getAttendeeTypesApi,
  getAttendanceStatusesApi,
  getEmployeesApi,
  getDepartmentsApi,
  getLocationsApi,
  getMeetingTypesApi,
  addMeetingTypeApi,
  addDepartmentApi,
  addLocationApi,
  addAttendeeTypeApi,
  addAttendanceStatusApi,
  addCountryApi,
  addStateApi,
  addCityApi,
  getCountriesApi,
  getStatesByCountryApi,
  getCitiesApi,
  searchCountryApi,
  searchStateApi,
  searchCityApi,
  deleteMeetingApi,
  getMeetingByIdApi,
  updateMeetingApi,
} from "../../services/allAPI";

import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const NewMeeting = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);


  // Quick Create Modal States
  const [meetingTypeModalOpen, setMeetingTypeModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [attendeeTypeModalOpen, setAttendeeTypeModalOpen] = useState(false);
  const [attendanceStatusModalOpen, setAttendanceStatusModalOpen] = useState(false);

  // Nested Location Modal States 
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);

  // Form Data for Quick Create
  const [newMeetingType, setNewMeetingType] = useState("");
  const [newDepartment, setNewDepartment] = useState({ department: "", description: "", parentDepartmentId: "" });
  const [newLocation, setNewLocation] = useState({
    name: "", countryId: "", stateId: "", cityId: "", address: "", latitude: "", longitude: ""
  });
  const [newAttendeeType, setNewAttendeeType] = useState("");
  const [newAttendanceStatus, setNewAttendanceStatus] = useState("");

  // Nested Location Form Data
  const [newCountryName, setNewCountryName] = useState("");
  const [newState, setNewState] = useState({ name: "", countryId: "" });
  const [newCity, setNewCity] = useState({ name: "", countryId: "", stateId: "" });

  // Dropdown Data for Modals
  const [modalCountries, setModalCountries] = useState([]);
  const [modalStates, setModalStates] = useState([]);
  const [modalCities, setModalCities] = useState([]);
  const [locationModalStates, setLocationModalStates] = useState([]); // For Location Modal
  const [locationModalCities, setLocationModalCities] = useState([]); // For Location Modal

  // Search States for Dropdowns in Modals
  const [parentDeptSearch, setParentDeptSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

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

  const normalizeSimple = (records) =>
    records.map(r => ({
      id: String(r.Id ?? r.id),
      name: r.Name ?? r.name
    }));

  const normalizeEmployees = (records = []) =>
    records.map(r => ({
      id: String(r.Id),
      name: `${r.FirstName} ${r.LastName ?? ""}`.trim(),
      employeeId: r.Id,
      departmentName: "",     // ❗ employees API DOES NOT HAVE THIS
      designationName: ""     // ❗ employees API DOES NOT HAVE THIS
    }));


  useEffect(() => {
    if (!isEdit) return;

    setForm(f => ({ ...f }));
  }, [meetingTypes, departments, locations, employees]);




  // ===============================
  // SEPARATE LOADER FUNCTIONS
  // ===============================



  const loadEmployees = async () => {
    try {
      const res = await getEmployeesApi(1, 5000);
      console.log(res);

      setEmployees(normalizeEmployees(res?.data?.records || []));
    } catch (err) {
      console.log("Employees Load Error:", err);
    }
  };

  const loadAttendeeTypes = async () => {
    try {
      const res = await getAttendeeTypesApi(1, 5000);
      console.log(res);

      setAttendeeTypes(normalizeSimple(res?.data?.records));
    } catch (err) {
      console.log("Attendee Types Load Error:", err);
    }
  };

  const loadAttendanceStatuses = async () => {
    try {
      const res = await getAttendanceStatusesApi(1, 5000);
      console.log(res);

      setAttendanceStatuses(normalizeSimple(res?.data?.records));
    } catch (err) {
      console.log("Attendance Status Load Error:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await getDepartmentsApi(1, 5000);
      console.log(res);

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
    const res = await getLocationsApi(1, 5000);

    setLocations(
      (res?.data?.records || []).map(l => ({
        id: String(l.Id),
        name: `${l.Name} (${l.CityName ?? ""})`
      }))
    );
  };


  const loadMeetingTypes = async () => {
    try {
      const res = await getMeetingTypesApi(1, 5000);
      console.log(res);

      setMeetingTypes(normalizeSimple(res?.data?.records));
    } catch (err) {
      console.log("Meeting Types Load Error:", err);
    }
  };



  useEffect(() => {
    if (!isEdit) return;

    const loadMeeting = async () => {
      try {
        const res = await getMeetingByIdApi(id);
        const m = res?.data?.meeting;
        const attendees = res?.data?.attendees;

        if (!m) return;

        // Smart Match Helper: specific to this scope
        const resolveId = (val, list) => {
          if (!val) return "";
          const strVal = String(val);
          // If it's already a number/ID in the list, return it
          if (list.some(item => String(item.id) === strVal)) return strVal;

          // Otherwise try to find by Name (case insensitive)
          const match = list.find(item => item.name?.toLowerCase() === strVal.toLowerCase());
          return match ? String(match.id) : strVal;
        };

        setForm({
          meetingName: m.meetingName ?? "",

          // 🔑 Use resolveId to handle text values ("Review" -> "5")
          meetingType: resolveId(m.meetingType, meetingTypes),
          department: resolveId(m.department, departments),
          location: resolveId(m.location, locations),
          organizedBy: resolveId(m.organizedBy, employees),
          reporter: resolveId(m.reporter, employees),

          // 🕒 datetime-local needs YYYY-MM-DDTHH:mm
          startDate: m.startDate ? m.startDate.slice(0, 16) : "",
          endDate: m.endDate ? m.endDate.slice(0, 16) : "",

          // 👥 attendees (from JOIN query)
          attendees: (attendees || []).map(a => ({
            attendee: a.attendeeName ?? "",
            attendeeType: a.attendeeTypeName ?? "",
            attendanceStatus: a.attendanceStatusName ?? "",

            // 🔑 IDs as STRING for edit modal
            attendeeId: String(a.attendeeId ?? ""),
            attendeeTypeId: String(a.attendeeTypeId ?? ""),
            attendanceStatusId: String(a.attendanceStatusId ?? ""),

            // 📋 extra table fields
            employeeId: a.employeeId ?? "",
            departmentName: a.departmentName ?? "",
            designationName: a.designationName ?? ""
          }))
        });


      } catch (err) {
        console.error("LOAD MEETING ERROR:", err);
      }
    };

    loadMeeting();
  }, [id]);



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

  // Load Countries when Location Modal opens
  useEffect(() => {
    if (locationModalOpen || addStateModalOpen || addCityModalOpen) {
      const fetchCountries = async () => {
        const res = await getCountriesApi(1, 5000);
        setModalCountries(
          (res?.data?.records || []).map(c => ({
            id: String(c.Id),
            name: c.Name
          }))
        );

      };
      fetchCountries();
    }
  }, [locationModalOpen, addStateModalOpen, addCityModalOpen]);

  // Load States when Country changes in Location Modal
  useEffect(() => {
    if (newLocation.countryId) {
      const fetchStates = async () => {
        const res = await getStatesByCountryApi(newLocation.countryId);
        setLocationModalStates(
          (res?.data || []).map(s => ({
            id: String(s.Id),
            name: s.Name
          }))
        );
      };
      fetchStates();
    } else {
      setLocationModalStates([]);
    }
  }, [newLocation.countryId]);

  // Load Cities when State changes in Location Modal
  useEffect(() => {
    if (newLocation.stateId) {
      const fetchCities = async () => {
        const res = await getCitiesApi(1, 5000);
        const allCities = res?.data?.records || [];
        const filtered = allCities.filter(c => String(c.stateId) === String(newLocation.stateId));
        setLocationModalCities(
          filtered.map(c => ({
            id: String(c.Id),
            name: c.Name
          }))
        );
      };
      fetchCities();
    } else {
      setLocationModalCities([]);
    }
  }, [newLocation.stateId]);

  // Load States for Nested City Modal (when country selected there)
  useEffect(() => {
    if (newCity.countryId) {
      const fetchStates = async () => {
        const res = await getStatesByCountryApi(newCity.countryId);
        setModalStates(res?.data || []);
      };
      fetchStates();
    } else {
      setModalStates([]);
    }
  }, [newCity.countryId]);



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
      // Add extra details for the table
      employeeId: employees.find((e) => String(e.id) === String(attendeeForm.attendee))?.employeeId || "",
      departmentName:
        employees.find(e => e.id === attendeeForm.attendee)?.departmentName || "—",
      designationName:
        employees.find(e => e.id === attendeeForm.attendee)?.designationName || "—",
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

  /* Helper to check for valid numeric IDs */
  const isValidId = (val) => val && !isNaN(Number(val)) && Number(val) !== 0;

  const handleSave = async () => {
    try {
      // Required Fields Check (Must be present AND valid numeric IDs)
      if (!form.meetingName || !form.startDate || !form.endDate) {
        toast.error("Please fill all required fields");
        return;
      }

      if (!isValidId(form.meetingType)) {
        toast.error("Please select a valid Meeting Type");
        return;
      }

      const payload = {
        ...form,
        // Optional Fields: Only send if valid number, else null (clears legacy text)
        meetingType: isValidId(form.meetingType) ? form.meetingType : null,
        department: isValidId(form.department) ? form.department : null,
        location: isValidId(form.location) ? form.location : null,
        organizedBy: isValidId(form.organizedBy) ? form.organizedBy : null,
        reporter: isValidId(form.reporter) ? form.reporter : null,

        attendees: form.attendees.map(a => ({
          attendeeId: isValidId(a.attendeeId) ? a.attendeeId : null,
          attendeeTypeId: isValidId(a.attendeeTypeId) ? a.attendeeTypeId : null,
          attendanceStatusId: isValidId(a.attendanceStatusId) ? a.attendanceStatusId : null,
        })),
        startDate: formatDateTime(form.startDate),
        endDate: formatDateTime(form.endDate),
        userId: currentUserId,
      };

      if (isEdit) {
        await updateMeetingApi(id, payload);
        toast.success("Meeting updated successfully");
      } else {
        await addMeetingApi(payload);
        toast.success("Meeting created successfully");
      }

      navigate("/app/meeting/meetings");

    } catch (err) {
      console.error("SAVE MEETING ERROR:", err);
      toast.error("Failed to save meeting");
    }
  };



  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Meeting?",
      text: "This action cannot be undone.",
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
      await deleteMeetingApi(id, { userId: currentUserId });
      toast.success("Meeting deleted successfully");
      navigate("/app/meeting/meetings");
    } catch (error) {
      console.error("DELETE MEETING ERROR:", error);
      toast.error("Failed to delete meeting");
    }
  };



  // ===============================
  // QUICK CREATE HANDLERS
  // ===============================

  const handleSaveMeetingType = async () => {
    if (!newMeetingType.trim()) return toast.error("Name is required");
    try {
      await addMeetingTypeApi({ name: newMeetingType, userId: currentUserId });
      toast.success("Meeting Type Added");
      setNewMeetingType("");
      setMeetingTypeModalOpen(false);
      loadMeetingTypes();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add Meeting Type");
    }
  };

  const handleSaveAttendeeType = async () => {
    if (!newAttendeeType.trim()) return toast.error("Name is required");
    try {
      await addAttendeeTypeApi({ name: newAttendeeType, userId: currentUserId });
      toast.success("Attendee Type Added");
      setNewAttendeeType("");
      setAttendeeTypeModalOpen(false);
      loadAttendeeTypes();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add Attendee Type");
    }
  };

  const handleSaveAttendanceStatus = async () => {
    if (!newAttendanceStatus.trim()) return toast.error("Name is required");
    try {
      await addAttendanceStatusApi({ name: newAttendanceStatus, userId: currentUserId });
      toast.success("Attendance Status Added");
      setNewAttendanceStatus("");
      setAttendanceStatusModalOpen(false);
      loadAttendanceStatuses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add Attendance Status");
    }
  };

  const handleSaveDepartment = async () => {
    if (!newDepartment.department.trim()) return toast.error("Department Name is required");
    try {
      await addDepartmentApi({ ...newDepartment, userId: currentUserId });
      toast.success("Department Added");
      setNewDepartment({ department: "", description: "", parentDepartmentId: "" });
      setDepartmentModalOpen(false);
      loadDepartments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add Department");
    }
  };

  // --- Location & Nested Handlers ---

  const handleSaveCountry = async () => {
    if (!newCountryName.trim()) return toast.error("Country Name is required");
    try {
      await addCountryApi({ name: newCountryName, userId: currentUserId });
      toast.success("Country Added");
      setNewCountryName("");
      setAddCountryModalOpen(false);
      // Refresh countries
      const res = await getCountriesApi(1, 5000);
      setModalCountries(res?.data?.records || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add Country");
    }
  };

  const handleSaveState = async () => {
    if (!newState.name.trim() || !newState.countryId) return toast.error("State Name and Country are required");
    try {
      await addStateApi({ ...newState, userId: currentUserId });
      toast.success("State Added");
      setNewState({ name: "", countryId: "" });
      setAddStateModalOpen(false);
      // Refresh states if country selected
      if (newLocation.countryId) {
        const res = await getStatesByCountryApi(newLocation.countryId);
        setLocationModalStates(res?.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add State");
    }
  };

  const handleSaveCity = async () => {
    if (!newCity.name.trim() || !newCity.stateId) return toast.error("City Name and State are required");
    try {
      await addCityApi({ ...newCity, userId: currentUserId });
      toast.success("City Added");
      setNewCity({ name: "", countryId: "", stateId: "" });
      setAddCityModalOpen(false);
      // Refresh cities if state selected
      if (newLocation.stateId) {
        // Note: getCitiesApi is paginated, but we might need a way to get cities by state or just refresh the list.
        // For now, let's assume we rely on the main location modal to re-fetch or we might need a specific API.
        // Actually, the Location modal usually filters cities by state.
        // Let's just re-fetch all cities or handle it via useEffect in the modal.
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add City");
    }
  };

  const handleSaveLocation = async () => {
    if (!newLocation.name.trim()) return toast.error("Location Name is required");
    try {
      await addLocationApi({ ...newLocation, userId: currentUserId });
      toast.success("Location Added");
      setNewLocation({ name: "", countryId: "", stateId: "", cityId: "", address: "", latitude: "", longitude: "" });
      setLocationModalOpen(false);
      loadLocations();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add Location");
    }
  };

  const handleCreateNew = (type) => {
    if (type === "Meeting Type") setMeetingTypeModalOpen(true);
    else if (type === "Department") setDepartmentModalOpen(true);
    else if (type === "Location") setLocationModalOpen(true);
    else if (type === "Attendee Type") setAttendeeTypeModalOpen(true);
    else if (type === "Attendance Status") setAttendanceStatusModalOpen(true);
    else if (type === "Organizer" || type === "Reporter") {
      navigate("/app/hr/newemployee");
    } else {
      toast.success(`Create New ${type} clicked`);
    }
  };

  /* TAB BUTTON */
  const Tab = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`pb-2 text-sm font-medium ${active
        ? "text-yellow-400 border-b-2 border-yellow-400"
        : "text-gray-400 hover:text-white"
        }`}
    >
      {label}
    </button>
  );

  return (
    <PageLayout>
      <div className="p-5 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/app/meeting/meetings")}
              className="p-2 bg-gray-800 rounded border border-gray-700"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-semibold">
              {isEdit ? "Edit Meeting" : "New Meeting"}
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
            >
              <Save size={18} /> {isEdit ? "Update" : "Save"}
            </button>

            {isEdit && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-800 border border-red-600 px-4 py-2 rounded text-sm text-red-200"
              >
                <Trash2 size={18} /> Delete
              </button>
            )}
          </div>
        </div>

        {isEdit && (
          <div className="flex gap-6 border-b border-gray-700 mb-5">
            <Tab
              label="Meeting"
              active={true}
              onClick={() => navigate(`/app/meeting/meetings/edit/${id}`)}
            />
            <Tab
              label="Agenda Items"
              active={false}
              onClick={() => navigate(`/app/meeting/meetings/edit/${id}/agenda`)}
            />
            <Tab
              label="Agenda Decisions"
              active={false}
              onClick={() => navigate(`/app/meeting/meetings/edit/${id}/decisions`)}
            />
          </div>
        )}


        <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
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
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">Department</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleCreateNew("Department")} />
                </div>
                <select
                  value={form.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="text-white bg-gray-800">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">Organized By</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleCreateNew("Organizer")} />
                </div>
                <select
                  value={form.organizedBy}
                  onChange={(e) => updateField("organizedBy", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id} className="text-white bg-gray-800">
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">Meeting Type *</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleCreateNew("Meeting Type")} />
                </div>
                <select
                  value={String(form.meetingType || "")}
                  onChange={(e) => updateField("meetingType", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {meetingTypes.map((mt) => (
                    <option key={mt.id} value={mt.id} className="text-white bg-gray-800">
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
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">Location</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleCreateNew("Location")} />
                </div>
                <select
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id} className="text-white bg-gray-800">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">Reporter</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleCreateNew("Reporter")} />
                </div>
                <select
                  value={form.reporter}
                  onChange={(e) => updateField("reporter", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id} className="text-white bg-gray-800">
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

            <div className="mt-3 bg-gray-800 border border-gray-700 rounded p-3 overflow-x-auto">
              <table className="w-full text-left text-sm text-white min-w-[800px]">
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
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm text-white">Attendee Type *</label>
              <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleCreateNew("Attendee Type")} />
            </div>
            <select
              value={attendeeForm.attendeeType}
              onChange={(e) =>
                setAttendeeForm({ ...attendeeForm, attendeeType: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mb-3"
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
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm text-white">Attendance Status *</label>
              <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleCreateNew("Attendance Status")} />
            </div>
            <select
              value={attendeeForm.attendanceStatus}
              onChange={(e) =>
                setAttendeeForm({ ...attendeeForm, attendanceStatus: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mb-6"
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


      {/* SIMPLE MODALS */}
      <SimpleModal
        title="Add Meeting Type"
        isOpen={meetingTypeModalOpen}
        onClose={() => setMeetingTypeModalOpen(false)}
        onSave={handleSaveMeetingType}
        value={newMeetingType}
        setValue={setNewMeetingType}
        placeholder="Enter Meeting Type Name"
      />

      <SimpleModal
        title="Add Attendee Type"
        isOpen={attendeeTypeModalOpen}
        onClose={() => setAttendeeTypeModalOpen(false)}
        onSave={handleSaveAttendeeType}
        value={newAttendeeType}
        setValue={setNewAttendeeType}
        placeholder="Enter Attendee Type Name"
      />

      <SimpleModal
        title="Add Attendance Status"
        isOpen={attendanceStatusModalOpen}
        onClose={() => setAttendanceStatusModalOpen(false)}
        onSave={handleSaveAttendanceStatus}
        value={newAttendanceStatus}
        setValue={setNewAttendanceStatus}
        placeholder="Enter Attendance Status Name"
      />

      {/* DEPARTMENT MODAL */}
      {departmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[500px] shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-white text-lg">Add Department</h3>
              <X size={20} className="cursor-pointer text-gray-400 hover:text-red-400" onClick={() => setDepartmentModalOpen(false)} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white">Department Name *</label>
                <input
                  type="text"
                  value={newDepartment.department}
                  onChange={(e) => setNewDepartment({ ...newDepartment, department: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-white">Description</label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-white">Parent Department</label>
                <input
                  type="text"
                  placeholder="Search parent..."
                  value={parentDeptSearch}
                  onChange={(e) => setParentDeptSearch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
                {parentDeptSearch && (
                  <div className="max-h-40 overflow-y-auto bg-gray-800 border border-gray-600 rounded mt-1">
                    {departments
                      .filter((d) => d.name.toLowerCase().includes(parentDeptSearch.toLowerCase()))
                      .map((d) => (
                        <div
                          key={d.id}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                          onClick={() => {
                            setNewDepartment({ ...newDepartment, parentDepartmentId: d.id });
                            setParentDeptSearch(d.name);
                          }}
                        >
                          {d.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDepartmentModalOpen(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
              <button onClick={handleSaveDepartment} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION MODAL */}
      {locationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[600px] max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-white text-lg">Add Location</h3>
              <X size={20} className="cursor-pointer text-gray-400 hover:text-red-400" onClick={() => setLocationModalOpen(false)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-white">Location Name *</label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">Country</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => setAddCountryModalOpen(true)} />
                </div>
                <select
                  value={newLocation.countryId}
                  onChange={(e) => setNewLocation({ ...newLocation, countryId: e.target.value, stateId: "", cityId: "" })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {modalCountries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">State</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => setAddStateModalOpen(true)} />
                </div>
                <select
                  value={newLocation.stateId}
                  onChange={(e) => setNewLocation({ ...newLocation, stateId: e.target.value, cityId: "" })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {locationModalStates.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-white">City</label>
                  <Star size={14} className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" onClick={() => setAddCityModalOpen(true)} />
                </div>
                <select
                  value={newLocation.cityId}
                  onChange={(e) => setNewLocation({ ...newLocation, cityId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="">--select--</option>
                  {locationModalCities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-white">Address</label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-white">Latitude</label>
                <input
                  type="text"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-white">Longitude</label>
                <input
                  type="text"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setLocationModalOpen(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
              <button onClick={handleSaveLocation} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* NESTED ADD COUNTRY MODAL */}
      <SimpleModal
        title="Add Country"
        isOpen={addCountryModalOpen}
        onClose={() => setAddCountryModalOpen(false)}
        onSave={handleSaveCountry}
        value={newCountryName}
        setValue={setNewCountryName}
        placeholder="Enter Country Name"
      />

      {/* NESTED ADD STATE MODAL */}
      {addStateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[400px] shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-white text-lg">Add State</h3>
              <X size={20} className="cursor-pointer text-gray-400 hover:text-red-400" onClick={() => setAddStateModalOpen(false)} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white">State Name *</label>
                <input
                  type="text"
                  value={newState.name}
                  onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-white">Country *</label>
                <select
                  value={newState.countryId}
                  onChange={(e) => setNewState({ ...newState, countryId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {modalCountries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setAddStateModalOpen(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
              <button onClick={handleSaveState} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* NESTED ADD CITY MODAL */}
      {addCityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[400px] shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-white text-lg">Add City</h3>
              <X size={20} className="cursor-pointer text-gray-400 hover:text-red-400" onClick={() => setAddCityModalOpen(false)} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white">City Name *</label>
                <input
                  type="text"
                  value={newCity.name}
                  onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-white">Country *</label>
                <select
                  value={newCity.countryId}
                  onChange={(e) => setNewCity({ ...newCity, countryId: e.target.value, stateId: "" })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {modalCountries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-white">State *</label>
                <select
                  value={newCity.stateId}
                  onChange={(e) => setNewCity({ ...newCity, stateId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">--select--</option>
                  {modalStates.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setAddCityModalOpen(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
              <button onClick={handleSaveCity} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  );
};

// ===============================
// SIMPLE MODAL COMPONENT (Internal)
// ===============================
const SimpleModal = ({ title, isOpen, onClose, onSave, value, setValue, placeholder }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[400px] shadow-xl">
        <div className="flex justify-between mb-4">
          <h3 className="text-white text-lg">{title}</h3>
          <X size={20} className="cursor-pointer text-gray-400 hover:text-red-400" onClick={onClose} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default NewMeeting;
