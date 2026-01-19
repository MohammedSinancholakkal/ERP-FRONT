// src/pages/meetings/NewMeeting.jsx
import React, { useState, useEffect } from "react";
import { Save, ArrowLeft, Plus, Pencil, Trash2, X, Star } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { showDeleteConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

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
  searchMeetingTypeApi,
  searchDepartmentApi,
  searchLocationApi,
  searchAttendeeTypeApi,
  searchAttendanceStatusApi,
  deleteMeetingApi,
  searchMeetingsApi,
  getMeetingByIdApi,
  updateMeetingApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import AddModal from "../../components/modals/AddModal";
import InputField from "../../components/InputField";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";

const NewMeeting = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [locationModalStates, setLocationModalStates] = useState([]); 
  const [locationModalCities, setLocationModalCities] = useState([]); 

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
      departmentName: "",    
      designationName: ""    
    }));


  useEffect(() => {
    if (location.state?.preservedState) {
        const { form: savedForm, showAttendeeModal: savedModal, attendeeForm: savedAttendeeForm, editIndex: savedEditIndex } = location.state.preservedState;
        if (savedForm) setForm(savedForm);
        if (savedModal) {
            setShowAttendeeModal(true);
            setAttendeeForm(savedAttendeeForm);
            setEditIndex(savedEditIndex);
        }
        // Clear state to prevent reapplying
        window.history.replaceState({}, document.title);
    } else if (isEdit) {
      setForm(f => ({ ...f }));
    }
  }, [isEdit, location.state]);




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

        const resolveId = (val, list) => {
          if (!val) return "";
          const strVal = String(val);
          if (list.some(item => String(item.id) === strVal)) return strVal;

          // Otherwise try to find by Name (case insensitive)
          const match = list.find(item => item.name?.toLowerCase() === strVal.toLowerCase());
          return match ? String(match.id) : strVal;
        };

        setForm({
          meetingName: m.meetingName ?? "",
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
            id: String(c.Id ?? c.id),
            name: c.Name ?? c.name
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
            id: String(s.Id ?? s.id),
            name: s.Name ?? s.name
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
            id: String(c.Id ?? c.id),
            name: c.Name ?? c.name
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
        setModalStates((res?.data || []).map(s => ({
            id: String(s.Id ?? s.id),
            name: s.Name ?? s.name
        })));
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

      // DUPLICATE CHECK
      try {
        const searchRes = await searchMeetingsApi(form.meetingName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data.records || searchRes.data || [];
            const existing = rows.find(m => 
                (m.Title || m.title || m.meetingName || "").toLowerCase() === form.meetingName.trim().toLowerCase() && 
                (isEdit ? String(m.id || m.Id || m.MeetingId) !== String(id) : true)
            );
            
            if (existing) {
                toast.error("A meeting with this name already exists");
                return;
            }
        }
      } catch (e) {
        console.error("Duplicate Check Error", e);
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
    const result = await showDeleteConfirm("meeting");

    if (!result.isConfirmed) return;

    try {
      await deleteMeetingApi(id, { userId: currentUserId });
      showSuccessToast("Meeting deleted successfully");
      navigate("/app/meeting/meetings");
    } catch (error) {
      console.error("DELETE MEETING ERROR:", error);
      showErrorToast("Failed to delete meeting");
    }
  };



  // ===============================
  // QUICK CREATE HANDLERS
  // ===============================

  const handleSaveMeetingType = async () => {
    if (!newMeetingType.trim()) return toast.error("Name is required");
    try {
      // DUPLICATE CHECK
      const duplicateRes = await searchMeetingTypeApi(newMeetingType.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.name || i.Name || "").toLowerCase() === newMeetingType.trim().toLowerCase()
      );

      if (isDuplicate) {
        toast.error("Meeting Type with this name already exists.");
        return;
      }

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
      // DUPLICATE CHECK
      const duplicateRes = await searchAttendeeTypeApi(newAttendeeType.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.name || i.Name || "").toLowerCase() === newAttendeeType.trim().toLowerCase()
      );

      if (isDuplicate) {
        toast.error("Attendee Type with this name already exists.");
        return;
      }

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
      // DUPLICATE CHECK
      const duplicateRes = await searchAttendanceStatusApi(newAttendanceStatus.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.name || i.Name || "").toLowerCase() === newAttendanceStatus.trim().toLowerCase()
      );

      if (isDuplicate) {
        toast.error("Attendance Status with this name already exists.");
        return;
      }

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
      // DUPLICATE CHECK
      const duplicateRes = await searchDepartmentApi(newDepartment.department.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.department || i.Department || i.name || i.Name || "").toLowerCase() === newDepartment.department.trim().toLowerCase()
      );

      if (isDuplicate) {
        toast.error("Department with this name already exists.");
        return;
      }

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
      // DUPLICATE CHECK
      const duplicateRes = await searchCountryApi(newCountryName.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.name || i.CountryName || "").toLowerCase() === newCountryName.trim().toLowerCase()
      );
      if (isDuplicate) {
        toast.error("Country with this name already exists.");
        return;
      }

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
      // DUPLICATE CHECK
      const duplicateRes = await searchStateApi(newState.name.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) =>
           (i.name || i.StateName || "").toLowerCase() === newState.name.trim().toLowerCase() &&
           String(i.countryId ?? i.CountryId) === String(newState.countryId)
      );
      if (isDuplicate) {
        toast.error("State with this name already exists in selected country.");
        return;
      }

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
      // DUPLICATE CHECK
      const duplicateRes = await searchCityApi(newCity.name.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) =>
           (i.name || i.CityName || "").toLowerCase() === newCity.name.trim().toLowerCase() &&
           String(i.stateId ?? i.StateId) === String(newCity.stateId)
      );
      if (isDuplicate) {
        toast.error("City with this name already exists in selected state.");
        return;
      }

      await addCityApi({ ...newCity, userId: currentUserId });
      toast.success("City Added");
      setNewCity({ name: "", countryId: "", stateId: "" });
      setAddCityModalOpen(false);
      if (newLocation.stateId) {
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add City");
    }
  };

  const handleSaveLocation = async () => {
    if (!newLocation.name.trim()) return toast.error("Location Name is required");
    try {
      // DUPLICATE CHECK
      const duplicateRes = await searchLocationApi(newLocation.name.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.name || i.Name || "").toLowerCase() === newLocation.name.trim().toLowerCase()
      );
      if (isDuplicate) {
        toast.error("Location with this name already exists.");
        return;
      }

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
      navigate("/app/hr/newemployee", { 
        state: { 
            returnTo: location.pathname,
            preservedState: {
                form,
                showAttendeeModal,
                attendeeForm,
                editIndex
            }
        } 
      });
    } else {
      toast.success(`Create New ${type} clicked`);
    }
  };

  /* TAB BUTTON */
  const Tab = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`pb-2 text-sm font-medium ${active
        ? "text-emerald-500 border-b-2 border-emerald-500"
        : "text-gray-400 hover:text-gray-600"
        }`}
    >
      {label}
    </button>
  );

  return (
    <PageLayout>
        <div className="p-6 h-full">
            <ContentCard>
                <div className="h-full overflow-y-auto w-full p-2">
            
        <div className="mb-6">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => navigate("/app/meeting/meetings")}
                   className={`p-2 rounded-full ${theme === 'emerald' ? 'hover:bg-emerald-200' : theme === 'purple' ? 'hover:bg-purple-200' : 'hover:bg-gray-700'}`}
                 >
                    <ArrowLeft size={24} />
                 </button>
                 <h2 className="text-xl font-bold text-[#6448AE]">{isEdit ? "Edit Meeting" : "New Meeting"}</h2>
              </div>
    
              <div className="flex items-center gap-3">
                 {isEdit && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                    >
                        <Trash2 size={18} />
                        Delete
                    </button>
                 )}
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium ${
                     theme === 'emerald'
                     ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                     : theme === 'purple'
                     ?  ' bg-[#6448AE] hover:bg-[#6E55B6] text-white'
                     : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 text-blue-300'
                  }`}
                >
                  <Save size={18} />
                  {isEdit ? "Update" : "Save"}
                </button>
              </div>
           </div>
           <hr className="border-gray-300" />
        </div>

        {/* MAIN FORM */}
        <div className="mt-6">
            <div className="grid grid-cols-12 gap-x-6 gap-y-6">
                
                {/* Meeting Name */}
                <div className="col-span-12 md:col-span-6">
                   <div className="flex gap-2 font-medium">
                        <div className="flex-1 font-medium">
                           <InputField
                              label="Meeting Name"
                              value={form.meetingName}
                              onChange={(e) => updateField("meetingName", e.target.value)}
                              placeholder="e.g. Sales Strategy Q4"
                              required
                           />
                       </div>
                       <div className="w-[18px]"></div>
                   </div>
                </div>

                {/* Location */}
                <div className="col-span-12 md:col-span-6">
                   <label className="block text-sm font-medium mb-1 text-black font-medium font-medium">Location</label>
                    <div className="flex items-center gap-2">
                          <div className="flex-1 font-medium">
                            <SearchableSelect 
                                options={locations}
                                value={form.location}
                                onChange={(val) => updateField("location", val)}
                                placeholder="-- Select Location --"
                                className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                            />
                        </div>
                         <button onClick={() => handleCreateNew("Location")} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                            <Star size={16} />
                        </button>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="col-span-12 md:col-span-6">
                   <div className="flex gap-2 font-medium">
                        <div className="flex-1 font-medium">
                           <InputField
                              label="Start Date"
                              type="datetime-local"
                              value={form.startDate}
                              onChange={(e) => updateField("startDate", e.target.value)}
                              required
                           />
                       </div>
                       <div className="w-[18px]"></div>
                   </div>
                </div>
                <div className="col-span-12 md:col-span-6">
                   <div className="flex gap-2 font-medium">
                        <div className="flex-1 font-medium">
                           <InputField
                              label="End Date"
                              type="datetime-local"
                              value={form.endDate}
                              onChange={(e) => updateField("endDate", e.target.value)}
                              required
                           />
                       </div>
                       <div className="w-[18px]"></div>
                   </div>
                </div>

                {/* Meeting Type */}
                <div className="col-span-12 md:col-span-6">
                    <label className={`block text-sm font-medium mb-1 ${theme === 'purple' ? 'text-dark' : ''}`}>Meeting Type *</label>
                    <div className="flex items-center gap-2">
                         <div className="flex-1 font-medium">
                            <SearchableSelect 
                                options={meetingTypes}
                                value={form.meetingType}
                                onChange={(val) => updateField("meetingType", val)}
                                placeholder="-- Select Type --"
                                className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                            />
                        </div>
                        <button onClick={() => handleCreateNew("Meeting Type")} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                            <Star size={16} />
                        </button>
                    </div>
                </div>

                 {/* Department */}
                 <div className="col-span-12 md:col-span-6">
                    <label className={`block text-sm font-medium font-medium mb-1 ${theme === 'purple' ? 'text-dark' : ''}`}>Department</label>
                    <div className="flex items-center gap-2">
                         <div className="flex-1 font-medium">
                            <SearchableSelect 
                                options={departments}
                                value={form.department}
                                onChange={(val) => updateField("department", val)}
                                placeholder="-- Select Department --"
                                className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                            />
                        </div>
                        <button onClick={() => handleCreateNew("Department")} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                            <Star size={16} />
                        </button>
                    </div>
                </div>

                {/* Organized By */}
                <div className="col-span-12 md:col-span-6">
                    <label className={`block text-sm font-medium font-medium mb-1 ${theme === 'purple' ? 'text-dark' : ''}`}>Organized By</label>
                    <div className="flex items-center gap-2">
                         <div className="flex-1 font-medium">
                            <SearchableSelect 
                                options={employees}
                                value={form.organizedBy}
                                onChange={(val) => updateField("organizedBy", val)}
                                placeholder="-- Select Organizer --"
                                className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                            />
                        </div>
                        <button onClick={() => handleCreateNew("Organizer")} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                             <Star size={16} />
                        </button>
                    </div>
                </div>

                {/* Reporter */}
                <div className="col-span-12 md:col-span-6">
                    <label className={`block text-sm font-medium mb-1 ${theme === 'purple' ? 'text-dark' : ''}`}>Reporter</label>
                    <div className="flex items-center gap-2">
                          <div className="flex-1 font-medium">
                            <SearchableSelect 
                                options={employees}
                                value={form.reporter}
                                onChange={(val) => updateField("reporter", val)}
                                placeholder="-- Select Reporter --"
                                className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                            />
                        </div>
                        <button onClick={() => handleCreateNew("Reporter")} className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}>
                            <Star size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ATTENDEES SECTION */}
            <div className="mt-8">
                 <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">Attendees</h3>
                     <button
                        onClick={() => setShowAttendeeModal(true)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm transition-colors border ${
                            theme === 'emerald' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                            : theme === 'purple'
                            ?  ' bg-[#6448AE] hover:bg-[#6E55B6] text-white'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-blue-300'
                        }`}
                     >
                        <Plus size={16} />
                        Add Attendee
                     </button>
                 </div>
               

                 <div className={`overflow-x-auto rounded-lg border ${theme === 'emerald' ? 'border-gray-200' : theme === 'purple' ? 'border-purple-200' : 'border-gray-700'}`}>
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className={theme === 'emerald' ? 'bg-emerald-50/50 text-gray-700' : theme === 'purple' ? 'bg-purple-50 text-purple-900' : 'bg-gray-800 text-gray-400'}>
                             <th className="p-3 text-sm font-medium">Name</th>
                             <th className="p-3 text-sm font-medium">Department</th>
                             <th className="p-3 text-sm font-medium">Designation</th>
                             <th className="p-3 text-sm font-medium">Type</th>
                             <th className="p-3 text-sm font-medium">Status</th>
                             <th className="p-3 text-sm font-medium text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody>
                          {form.attendees.map((row, index) => (
                             <tr key={index} className={`border-t ${theme === 'emerald' ? 'border-gray-100 hover:bg-gray-50' : theme === 'purple' ? 'border-purple-100 hover:bg-purple-50' : 'border-gray-800 hover:bg-gray-700/50'}`}>
                                <td className="p-3 text-sm">{row.attendee}</td>
                                <td className="p-3 text-sm text-gray-500">{row.departmentName}</td>
                                <td className="p-3 text-sm text-gray-500">{row.designationName}</td>
                                <td className="p-3 text-sm">
                                   <span className={`px-2 py-0.5 rounded text-xs ${theme === 'emerald' ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300'}`}>
                                      {row.attendeeType}
                                   </span>
                                </td>
                                <td className="p-3 text-sm">
                                   <span className={`px-2 py-0.5 rounded text-xs ${
                                       row.attendanceStatus === 'Present' 
                                         ? (theme === 'emerald' ? 'bg-green-50 text-green-700' : 'bg-green-900/30 text-green-300')
                                         : (theme === 'emerald' ? 'bg-orange-50 text-orange-700' : 'bg-yellow-900/30 text-yellow-300')
                                   }`}>
                                      {row.attendanceStatus}
                                   </span>
                                </td>
                                <td className="p-3 text-right flex justify-end gap-2">
                                     <button onClick={() => editAttendee(index)} className="p-1 text-gray-400 hover:text-blue-400">
                                         <Pencil size={16} />
                                     </button>
                                     <button onClick={() => deleteAttendee(index)} className="p-1 text-gray-400 hover:text-red-400">
                                         <Trash2 size={16} />
                                     </button>
                                </td>
                             </tr>
                          ))}
                          {form.attendees.length === 0 && (
                             <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                                   No attendees added yet.
                                </td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
            </div>

        </div>
       </div>
      </ContentCard>
     </div>
      {showAttendeeModal && (
        <AddModal
          isOpen={showAttendeeModal}
          onClose={() => setShowAttendeeModal(false)}
          onSave={saveAttendee}
          title={editIndex !== null ? "Edit Attendee" : "Add Attendee"}
          width="700px"
        >
            <div className="p-0 space-y-4">
            {/* ATTENDEE DROPDOWN */}
            <div>
              <label className="block text-sm font-medium mb-1">Attendee *</label>
              <div className="flex gap-2 font-medium">
                  <SearchableSelect
                    options={employees.map(e => ({ id: e.id, name: e.name }))}
                    value={attendeeForm.attendee}
                    onChange={(val) => setAttendeeForm({ ...attendeeForm, attendee: val })}
                    placeholder="--select--"
                    className="w-full"
                  />
                  {hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE) && (
                  <button
                      onClick={() => handleCreateNew("Organizer")}
                      className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                      title="Add Attendee"
                  >
                      <Star size={16} />
                  </button>
                  )}
              </div>
            </div>

            {/* TYPE DROPDOWN */}
             <div>
              <label className="block text-sm font-medium mb-1">Attendee Type *</label>
              <div className="flex gap-2 font-medium">
                  <SearchableSelect
                    options={attendeeTypes.map(t => ({ id: t.id, name: t.name }))}
                    value={attendeeForm.attendeeType}
                    onChange={(val) => setAttendeeForm({ ...attendeeForm, attendeeType: val })}
                    placeholder="--select--"
                    className="w-full"
                  />
                   {hasPermission(PERMISSIONS.ATTENDEE_TYPES.CREATE) && (
                   <button
                      onClick={() => handleCreateNew("Attendee Type")}
                      className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                      title="Add Attendee Type"
                  >
                      <Star size={16} />
                  </button>
                   )}
              </div>
            </div>

            {/* STATUS DROPDOWN */}
             <div>
              <label className="block text-sm font-medium mb-1">Attendance Status *</label>
              <div className="flex gap-2 font-medium">
                  <SearchableSelect
                    options={attendanceStatuses.map(s => ({ id: s.id, name: s.name }))}
                    value={attendeeForm.attendanceStatus}
                    onChange={(val) => setAttendeeForm({ ...attendeeForm, attendanceStatus: val })}
                    placeholder="--select--"
                    className="w-full"
                    direction="up"
                  />
                   {hasPermission(PERMISSIONS.ATTENDANCE_STATUS.CREATE) && (
                   <button
                      onClick={() => handleCreateNew("Attendance Status")}
                      className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                      title="Add Status"
                  >
                      <Star size={16} />
                  </button>
                   )}
              </div>
            </div>
            </div>
        </AddModal>
      )}


      {/* SIMPLE MODALS */}
      <AddModal
        title="Add Meeting Type"
        isOpen={meetingTypeModalOpen}
        onClose={() => setMeetingTypeModalOpen(false)}
        onSave={handleSaveMeetingType}
        width="700px"
      >
        <div>
           <InputField
            label="Type Name"
            placeholder="Enter Meeting Type Name"
            value={newMeetingType}
            onChange={(e) => setNewMeetingType(e.target.value)}
          />
        </div>
      </AddModal>

      <AddModal
        title="Add Attendee Type"
        isOpen={attendeeTypeModalOpen}
        onClose={() => setAttendeeTypeModalOpen(false)}
        onSave={handleSaveAttendeeType}
        width="700px"
      >
        <div>
           <InputField
            label="Type Name"
            placeholder="Enter Attendee Type Name"
            value={newAttendeeType}
            onChange={(e) => setNewAttendeeType(e.target.value)}
          />
        </div>
      </AddModal>

      <AddModal
        title="Add Attendance Status"
        isOpen={attendanceStatusModalOpen}
        onClose={() => setAttendanceStatusModalOpen(false)}
        onSave={handleSaveAttendanceStatus}
        width="700px"
      >
        <div>
           <InputField
            label="Status Name"
            placeholder="Enter Attendance Status Name"
            value={newAttendanceStatus}
            onChange={(e) => setNewAttendanceStatus(e.target.value)}
          />
        </div>
      </AddModal>

      {/* DEPARTMENT MODAL */}
      <AddModal
          isOpen={departmentModalOpen}
          onClose={() => setDepartmentModalOpen(false)}
          onSave={handleSaveDepartment}
          title="Add Department"
          width="700px"
      >
            <div className="space-y-4">
              <div>
                <InputField
                   label="Department Name *"
                   value={newDepartment.department}
                   onChange={(e) => setNewDepartment({ ...newDepartment, department: e.target.value })}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'emerald' ? 'text-gray-700' : theme === 'purple' ? 'text-dark' : 'text-gray-300'}`}>Description</label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  className={`w-full rounded px-3 py-2 text-sm outline-none transition-colors border ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900 focus:border-purple-500' : 'bg-gray-900 border-gray-700 text-white focus:border-blue-500'}`}
                  rows={3}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'emerald' ? 'text-gray-700' : theme === 'purple' ? 'text-dark' : 'text-gray-300'}`}>Parent Department</label>
                <SearchableSelect
                  options={departments.map(d => ({ id: d.id, name: d.name }))}
                  value={newDepartment.parentDepartmentId}
                  onChange={(val) => setNewDepartment({ ...newDepartment, parentDepartmentId: val })}
                  placeholder="--select--"
                  className={`w-full ${theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}`}
                  direction="up"
                />
              </div>
            </div>
      </AddModal>

      {/* LOCATION MODAL */}
      <AddModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={handleSaveLocation}
        title="Add Location"
        width="700px"
      >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField
                  label="Location Name *"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                />
              </div>

              <div>
                 <div className="space-y-1">
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <div className="flex gap-2 font-medium">
                        <SearchableSelect
                          options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                          value={newLocation.countryId}
                          onChange={(val) => setNewLocation({ ...newLocation, countryId: val, stateId: "", cityId: "" })}
                          placeholder="--select--"
                          className="w-full"
                        />
                         {hasPermission(PERMISSIONS.COUNTRIES.CREATE) && (
                         <button
                            onClick={() => setAddCountryModalOpen(true)}
                            className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                            title="Add Country"
                        >
                            <Star size={16} />
                        </button>
                         )}
                    </div>
                </div>
              </div>

              <div>
                <div className="space-y-1">
                    <label className="block text-sm font-medium mb-1">State</label>
                    <div className="flex gap-2 font-medium">
                        <SearchableSelect
                          options={locationModalStates.map(s => ({ id: s.id, name: s.name }))}
                          value={newLocation.stateId}
                          onChange={(val) => setNewLocation({ ...newLocation, stateId: val, cityId: "" })}
                          placeholder="--select--"
                          className="w-full"
                        />
                         {hasPermission(PERMISSIONS.STATES.CREATE) && (
                         <button
                            onClick={() => setAddStateModalOpen(true)}
                            className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                            title="Add State"
                        >
                            <Star size={16} />
                        </button>
                         )}
                    </div>
                </div>
              </div>

              <div>
                 <div className="space-y-1">
                    <label className="block text-sm font-medium mb-1">City</label>
                    <div className="flex gap-2 font-medium">
                        <SearchableSelect
                          options={locationModalCities.map(c => ({ id: c.id, name: c.name }))}
                          value={newLocation.cityId}
                          onChange={(val) => setNewLocation({ ...newLocation, cityId: val })}
                          placeholder="--select--"
                          className="w-full"
                        />
                         {hasPermission(PERMISSIONS.CITIES.CREATE) && (
                         <button
                            onClick={() => setAddCityModalOpen(true)}
                            className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                            title="Add City"
                        >
                            <Star size={16} />
                        </button>
                         )}
                    </div>
                </div>
              </div>

              <div>
                <InputField
                   label="Address"
                   value={newLocation.address}
                   onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                />
              </div>

              <div>
                <InputField
                   label="Latitude"
                   value={newLocation.latitude}
                   onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                />
              </div>

              <div>
                <InputField
                   label="Longitude"
                   value={newLocation.longitude}
                   onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                />
              </div>
            </div>
      </AddModal>

      {/* NESTED ADD COUNTRY MODAL */}
      <AddModal
        title="Add Country"
        isOpen={addCountryModalOpen}
        onClose={() => setAddCountryModalOpen(false)}
        onSave={handleSaveCountry}
        width="700px"
      >
        <div>
           <InputField
            label="Country Name"
            placeholder="Enter Country Name"
            value={newCountryName}
            onChange={(e) => setNewCountryName(e.target.value)}
          />
        </div>
      </AddModal>

      {/* NESTED ADD STATE MODAL */}
      <AddModal
        isOpen={addStateModalOpen}
        onClose={() => setAddStateModalOpen(false)}
        onSave={handleSaveState}
        title="Add State"
        width="700px"
      >
            <div className="space-y-4">
              <div>
                <InputField
                   label="State Name *"
                   value={newState.name}
                   onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country *</label>
                <SearchableSelect
                  options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                  value={newState.countryId}
                  onChange={(val) => setNewState({ ...newState, countryId: val })}
                  placeholder="--select--"
                  className="w-full"
                  direction="up"
                />
              </div>
            </div>
      </AddModal>

      {/* NESTED ADD CITY MODAL */}
      <AddModal
        isOpen={addCityModalOpen}
        onClose={() => setAddCityModalOpen(false)}
        onSave={handleSaveCity}
        title="Add City"
        width="700px"
      >
            <div className="space-y-4">
              <div>
                <InputField
                   label="City Name *"
                   value={newCity.name}
                   onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country *</label>
                <SearchableSelect
                  options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                  value={newCity.countryId}
                  onChange={(val) => setNewCity({ ...newCity, countryId: val, stateId: "" })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <SearchableSelect
                  options={modalStates.map(s => ({ id: s.id, name: s.name }))}
                  value={newCity.stateId}
                  onChange={(val) => setNewCity({ ...newCity, stateId: val })}
                  placeholder="--select--"
                  className="w-full"
                  direction="up"
                />
              </div>
            </div>
      </AddModal>

    </PageLayout>
  );
};

export default NewMeeting;
