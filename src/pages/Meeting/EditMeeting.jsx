import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2, ArchiveRestore, Pencil, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import {
  getMeetingByIdApi,
  getAgendaItemsApi,
  addAgendaItemApi, 
  updateAgendaItemApi,
  deleteAgendaItemApi,
  deleteMeetingApi,
  updateMeetingApi,
  getMeetingTypesApi,
  getDepartmentsApi,
  getLocationsApi,
  getEmployeesApi,
  getAgendaItemTypesApi, 
  addAgendaItemTypeApi,
  getAgendaDecisionsApi,
  addAgendaDecisionApi,
  updateAgendaDecisionApi,
  deleteAgendaDecisionApi,
  getResolutionStatusesApi,
  addResolutionStatusApi,
  searchMeetingTypeApi,
  searchDepartmentApi,
  searchLocationApi,
  searchCountryApi,
  searchStateApi,
  searchCityApi,
  searchAgendaItemTypeApi,
  searchResolutionStatusApi,
  getAttendeeTypesApi,
  getAttendanceStatusesApi,
  addAttendeeTypeApi,
  addAttendanceStatusApi,
  searchAttendanceStatusApi,
  updateLocationApi,
  updateDepartmentApi,
  updateMeetingTypeApi,
  updateAttendeeTypeApi,
  updateAttendanceStatusApi,
  updateAgendaItemTypeApi,
  updateResolutionStatusApi,
  getCountriesApi,
  getStatesByCountryApi,
  getCitiesApi,
  addCountryApi,
  updateCountryApi,
  addStateApi,
  updateStateApi,
  addCityApi,
  updateCityApi,
} from "../../services/allAPI";
import SearchableSelect from "../../components/SearchableSelect";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import toast from "react-hot-toast";
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import InputField from "../../components/InputField";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";


/* TAB BUTTON */
const Tab = ({ label, active, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`pb-2 text-sm font-medium transition-colors ${
      active
        ? theme === 'emerald'
          ? "text-emerald-600 border-b-2 border-emerald-600"
          : theme === 'purple'
          ? "text-purple-600 border-b-2 border-purple-600"
          : "text-yellow-400 border-b-2 border-yellow-400"
        : theme === 'emerald'
          ? "text-gray-500 hover:text-emerald-700"
          : theme === 'purple'
          ? "text-gray-500 hover:text-purple-700"
          : "text-gray-400 hover:text-white"
    }`}
  >
    {label}
  </button>
);

/**
 * Convert API datetime to datetime-local format
 * Handles both ISO format (UTC) and local time strings
 * @param {string} dateString - Date from API (e.g., "2026-01-22T14:30:00.000Z" or "2026-01-22 14:30:00")
 * @returns {string} - Format for datetime-local input (YYYY-MM-DDTHH:mm)
 */
const convertToDatetimeLocal = (dateString) => {
  if (!dateString) return "";
  
  try {
    // If it's already in correct format, return as-is
    if (dateString.includes("T") && dateString.length <= 19) {
      return dateString.slice(0, 16).replace(" ", "T");
    }
    
    // Handle ISO format with Z (UTC) - database stores LOCAL TIME as strings
    // When MSSQL returns ISO format with Z, the actual time is in the string itself
    // We just need to extract the local time portion
    if (dateString.includes("Z")) {
      // For "2026-01-22T14:30:00.000Z", we extract "2026-01-22T14:30"
      return dateString.substring(0, 16);
    }
    
    // Handle "YYYY-MM-DD HH:MM:SS" format (already local time)
    if (dateString.includes(" ")) {
      return dateString.slice(0, 16).replace(" ", "T");
    }
    
    // Fallback: slice and return
    return dateString.slice(0, 16).replace(" ", "T");
  } catch (e) {
    console.error("Error converting date:", e);
    return dateString;
  }
};






const EditMeeting = () => {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  /* detect tab from URL */
  const isAgenda = location.pathname.endsWith("/agenda");
  const isDecisions = location.pathname.endsWith("/decisions");
  
  // Feature superseded by list-view restore. Hardcode to false to prevent errors.
  const isInactive = false;

  const activeTab = isAgenda
    ? "agenda"
    : isDecisions
      ? "decisions"
      : "meeting";

  /* DATA */
  const [meeting, setMeeting] = useState({
    meetingName: "",
    meetingType: "",
    startDate: "",
    endDate: "",
    department: "",
    location: "",
    organizedBy: "",
    reporter: "",
    attendees: []
  });
  const [agendaItems, setAgendaItems] = useState([]);
  const [agendaDecisions, setAgendaDecisions] = useState([]);

  /* ATTENDEE MODAL STATE */
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [attendeeForm, setAttendeeForm] = useState({
    attendee: "",
    attendeeType: "",
    attendanceStatus: "",
  });
  const [attendeeTypes, setAttendeeTypes] = useState([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState([]);
  
  // Quick Add for Attendee Types/Status
  const [attendeeTypeModalOpen, setAttendeeTypeModalOpen] = useState(false);
  const [attendanceStatusModalOpen, setAttendanceStatusModalOpen] = useState(false);
  const [newAttendeeType, setNewAttendeeType] = useState({ id: null, name: "" });
  const [newAttendanceStatus, setNewAttendanceStatus] = useState({ id: null, name: "" });

  const [externalRecipients, setExternalRecipients] = useState(""); // ⬅ New State for Recipients

  /* AGENDA MODAL STATE */
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [agendaItemTypes, setAgendaItemTypes] = useState([]);
  const [newAgendaItem, setNewAgendaItem] = useState({
    id: null,
    title: "",
    description: "",
    itemType: "",
    requestedBy: "",
    sequenceNo: "",
    imageFile: null,      
    attachmentFile: null  
  });

  /* AGENDA ITEM TYPE MODAL STATE */
  const [showAgendaTypeModal, setShowAgendaTypeModal] = useState(false);
  const [newAgendaType, setNewAgendaType] = useState({ id: null, name: "", description: "" });

  /* DECISIONS STATE */
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showResolutionStatusModal, setShowResolutionStatusModal] = useState(false);
  const [resolutionStatuses, setResolutionStatuses] = useState([]);
  const [newResolutionStatus, setNewResolutionStatus] = useState({ id: null, name: "", description: "" });
  const [newDecision, setNewDecision] = useState({
    id: null,
    description: "",
    dueDate: "",
    assignedTo: "",
    decisionNumber: "",
    relatedAgendaItem: "",
    resolutionStatus: "",
    imageFile: null,
    attachmentFile: null
  });

  const updateField = (key, value) => {
    setMeeting(prev => ({ ...prev, [key]: value }));
  };

  // Helper for meeting state
  const setMeetingState = (newState) => { // Renaming because setMeeting is const
      setMeeting(newState);
  }

  /* DROPDOWN DATA */
  const [meetingTypes, setMeetingTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);

  /* RAW DATA FOR EDITING */
  const [rawMeetingTypes, setRawMeetingTypes] = useState([]);
  const [rawDepartments, setRawDepartments] = useState([]);
  const [rawLocations, setRawLocations] = useState([]);
  const [rawAttendeeTypes, setRawAttendeeTypes] = useState([]);
  const [rawAttendanceStatuses, setRawAttendanceStatuses] = useState([]);
  const [rawAgendaItemTypes, setRawAgendaItemTypes] = useState([]);
  const [rawResolutionStatuses, setRawResolutionStatuses] = useState([]);
  
  /* QUICK CREATE MODAL STATES */
  const [meetingTypeModalOpen, setMeetingTypeModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  
  /* NESTED LOCATION MODAL STATES */
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);

  /* FORM DATA FOR QUICK CREATE */
  // Changed newMeetingType to object to support ID
  const [newMeetingType, setNewMeetingType] = useState({ id: null, name: "" }); 
  const [newDepartment, setNewDepartment] = useState({ id: null, department: "", description: "", parentDepartmentId: "" });
  const [newLocation, setNewLocation] = useState({
    id: null, name: "", countryId: "", stateId: "", cityId: "", address: "", latitude: "", longitude: ""
  });
  
  /* NESTED LOCATION FORM DATA */
  const [newCountry, setNewCountry] = useState({ id: null, name: "" }); // was newCountryName
  const [newState, setNewState] = useState({ id: null, name: "", countryId: "" });
  const [newCity, setNewCity] = useState({ id: null, name: "", countryId: "", stateId: "" });

  /* DROPDOWN DATA FOR LOCATION MODALS */
  const [modalCountries, setModalCountries] = useState([]);
  const [locationModalStates, setLocationModalStates] = useState([]);
  const [locationModalCities, setLocationModalCities] = useState([]);
  const [modalStates, setModalStates] = useState([]); // For City Modal



  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // ===============================
  // HELPERS & LOADERS
  // ===============================
  const normalizeSimple = (records) =>
    records.map(r => ({
      id: String(r.Id ?? r.id),
      name: r.Name ?? r.name
    }));

  const loadEmployees = async () => {
    try {
      const res = await getEmployeesApi(1, 5000);
      setEmployees((res?.data?.records || []).map(r => ({
          id: String(r.Id),
          name: `${r.FirstName} ${r.LastName ?? ""}`.trim(),
      })));
    } catch (err) { console.error(err); }
  };

  const loadMeetingTypes = async () => {
    try {
      const res = await getMeetingTypesApi(1, 5000);
      const records = res?.data?.records || [];
      setRawMeetingTypes(records);
      setMeetingTypes(normalizeSimple(records));
    } catch (err) { console.error(err); }
  };

  const loadDepartments = async () => {
    try {
      const res = await getDepartmentsApi(1, 5000);
      const records = res?.data?.records || [];
      setRawDepartments(records);
      setDepartments(records.map(r => ({ id: r.id, name: r.department })));
    } catch (err) { console.error(err); }
  };

  const loadLocations = async () => {
     try {
      const res = await getLocationsApi(1, 5000);
      const records = res?.data?.records || [];
      setRawLocations(records);
      setLocations(records.map(l => ({
        id: String(l.Id),
        name: `${l.Name} (${l.CityName ?? ""})`
      })));
     } catch (err) { console.error(err); }
  };
  
  const loadAgendaItemTypes = async () => {
    try {
        const res = await getAgendaItemTypesApi(1, 1000);
        const records = res?.data?.records || [];
        setRawAgendaItemTypes(records);
        setAgendaItemTypes(normalizeSimple(records));
    } catch (err) { console.error(err); }
  };

  const loadResolutionStatuses = async () => {
    try {
        const res = await getResolutionStatusesApi(1, 1000);
        const records = res?.data?.records || [];
        setRawResolutionStatuses(records);
        setResolutionStatuses(normalizeSimple(records));
    } catch (err) { console.error(err); }
  };

  const loadAttendeeTypes = async () => {
    try {
      const res = await getAttendeeTypesApi(1, 5000);
      const records = res?.data?.records || [];
      setRawAttendeeTypes(records);
      setAttendeeTypes(normalizeSimple(records));
    } catch (err) { console.error(err); }
  };

  const loadAttendanceStatuses = async () => {
    try {
      const res = await getAttendanceStatusesApi(1, 5000);
      const records = res?.data?.records || [];
      setRawAttendanceStatuses(records);
      setAttendanceStatuses(normalizeSimple(records));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadEmployees();
    loadMeetingTypes();
    loadDepartments();
    loadLocations();
    loadAgendaItemTypes();
    loadResolutionStatuses();
    loadAttendeeTypes();
    loadAttendanceStatuses();
  }, []);

  // NESTED MODAL EFFECTS
  // Load Countries when Location Modal opens
  useEffect(() => {
    if (locationModalOpen || addStateModalOpen || addCityModalOpen) {
      const fetchCountries = async () => {
        const res = await getCountriesApi(1, 5000);
        setModalCountries((res?.data?.records || []).map(c => ({ id: String(c.Id ?? c.id), name: c.Name ?? c.name })));
      };
      fetchCountries();
    }
  }, [locationModalOpen, addStateModalOpen, addCityModalOpen]);

  // Load States when Country changes in Location Modal
  useEffect(() => {
    if (newLocation.countryId) {
      const fetchStates = async () => {
        const res = await getStatesByCountryApi(newLocation.countryId);
        setLocationModalStates((res?.data || []).map(s => ({ id: String(s.Id ?? s.id), name: s.Name ?? s.name })));
      };
      fetchStates();
    } else { setLocationModalStates([]); }
  }, [newLocation.countryId]);

  // Load Cities when State changes in Location Modal
  useEffect(() => {
    if (newLocation.stateId) {
      const fetchCities = async () => {
        const res = await getCitiesApi(1, 5000);
        const allCities = res?.data?.records || [];
        const filtered = allCities.filter(c => String(c.stateId) === String(newLocation.stateId));
        setLocationModalCities(filtered.map(c => ({ id: String(c.Id ?? c.id), name: c.Name ?? c.name })));
      };
      fetchCities();
    } else { setLocationModalCities([]); }
  }, [newLocation.stateId]);

  // Load States for Nested City Modal
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
    } else { setModalStates([]); }
  }, [newCity.countryId]);


  // ===============================
  // HANDLERS
  // ===============================

  const handleCreateNew = (type) => {
    if (type === "Meeting Type") setMeetingTypeModalOpen(true);
    else if (type === "Department") setDepartmentModalOpen(true);
    else if (type === "Location") setLocationModalOpen(true);
    else if (type === "Attendee Type") setAttendeeTypeModalOpen(true);
    else if (type === "Attendance Status") setAttendanceStatusModalOpen(true);
    else if (type === "Agenda Item Type") setShowAgendaTypeModal(true);
    else if (type === "Resolution Status") setShowResolutionStatusModal(true);
    else if (type === "Organizer" || type === "Reporter") {
      navigate("/app/hr/newemployee", { state: { from: location.pathname } });
    }
  };

  const handleEditMaster = (type, id) => {
    if (!id) return;

    if (type === "Meeting Type") {
        const item = rawMeetingTypes.find(r => String(r.id || r.Id) === String(id));
        if(item) {
            setNewMeetingType({ id: item.id || item.Id, name: item.name || item.Name });
            setMeetingTypeModalOpen(true);
        }
    } else if (type === "Department") {
         const item = rawDepartments.find(r => String(r.id || r.Id) === String(id));
         if(item) {
             setNewDepartment({
                 id: item.id || item.Id,
                 department: item.department || item.Department || item.name || item.Name,
                 description: item.description || item.Description || "",
                 parentDepartmentId: item.parentDepartmentId || item.ParentDepartmentId || ""
             });
             setDepartmentModalOpen(true);
         }
    } else if (type === "Location") {
        const item = rawLocations.find(r => String(r.id || r.Id) === String(id));
        if(item) {
            setNewLocation({
                id: item.id || item.Id,
                name: item.name || item.Name || "",
                countryId: item.countryId || item.CountryId || "",
                stateId: item.stateId || item.StateId || "",
                cityId: item.cityId || item.CityId || "",
                address: item.address || item.Address || "",
                latitude: item.latitude || item.Latitude || "",
                longitude: item.longitude || item.Longitude || ""
            });
            setLocationModalOpen(true);
        }
    } else if (type === "Attendee Type") {
         const item = rawAttendeeTypes.find(r => String(r.id || r.Id) === String(id));
         if(item) {
             setNewAttendeeType({ id: item.id || item.Id, name: item.name || item.Name });
             setAttendeeTypeModalOpen(true);
         }
    } else if (type === "Attendance Status") {
         const item = rawAttendanceStatuses.find(r => String(r.id || r.Id) === String(id));
         if(item) {
             setNewAttendanceStatus({ id: item.id || item.Id, name: item.name || item.Name });
             setAttendanceStatusModalOpen(true);
         }
    } else if (type === "Agenda Item Type") {
         const item = rawAgendaItemTypes.find(r => String(r.id || r.Id) === String(id));
         if(item) {
             setNewAgendaType({
                 id: item.id || item.Id,
                 name: item.name || item.Name,
                 description: item.description || item.Description || ""
             });
             setShowAgendaTypeModal(true);
         }
    } else if (type === "Resolution Status") {
        const item = rawResolutionStatuses.find(r => String(r.id || r.Id) === String(id));
        if(item) {
             setNewResolutionStatus({
                 id: item.id || item.Id,
                 name: item.name || item.Name,
                 description: item.description || item.Description || ""
             });
             setShowResolutionStatusModal(true);
        }
    } else if (type === "Country") {
        const item = modalCountries.find(c => String(c.id) === String(id));
        if(item) {
             setNewCountry({ id: item.id, name: item.name });
             setAddCountryModalOpen(true);
        }
    } else if (type === "State") {
        const item = locationModalStates.find(s => String(s.id) === String(id));
        if(item) {
             setNewState({ id: item.id, name: item.name, countryId: newLocation.countryId });
             setAddStateModalOpen(true);
        }
    } else if (type === "City") {
        const item = locationModalCities.find(c => String(c.id) === String(id));
        if(item) {
             setNewCity({ id: item.id, name: item.name, countryId: newLocation.countryId, stateId: newLocation.stateId });
             setAddCityModalOpen(true);
        }
    } else if (type === "Organizer" || type === "Reporter") {
        navigate(`/app/hr/editemployee/${id}`, { state: { from: location.pathname } });
    }
  };

  /* ATTENDEE HANDLERS */
  const saveAttendee = () => {
    if (!attendeeForm.attendee || !attendeeForm.attendeeType || !attendeeForm.attendanceStatus) {
      return toast.error("Please fill all fields");
    }
    const newRow = {
      attendee: employees.find((e) => String(e.id) === String(attendeeForm.attendee))?.name || "",
      attendeeType: attendeeTypes.find((t) => String(t.id) === String(attendeeForm.attendeeType))?.name || "",
      attendanceStatus: attendanceStatuses.find((s) => String(s.id) === String(attendeeForm.attendanceStatus))?.name || "",
      attendeeId: attendeeForm.attendee,
      attendeeTypeId: attendeeForm.attendeeType,
      attendanceStatusId: attendeeForm.attendanceStatus,
      employeeId: employees.find((e) => String(e.id) === String(attendeeForm.attendee))?.id || "",
      departmentName: "—",
      designationName: "—",
    };
    let updated = [...meeting.attendees];
    if (editIndex !== null) updated[editIndex] = newRow;
    else updated.push(newRow);
    setMeeting({ ...meeting, attendees: updated });
    setShowAttendeeModal(false);
    setEditIndex(null);
    setAttendeeForm({ attendee: "", attendeeType: "", attendanceStatus: "" });
  };

  const editAttendee = (index) => {
    const row = meeting.attendees[index];
    setAttendeeForm({
      attendee: row.attendeeId || "",
      attendeeType: row.attendeeTypeId || "",
      attendanceStatus: row.attendanceStatusId || "",
    });
    setEditIndex(index);
    setShowAttendeeModal(true);
  };

  const deleteAttendee = (index) => {
      const updated = meeting.attendees.filter((_, i) => i !== index);
      setMeeting({ ...meeting, attendees: updated });
  };

  const handleSaveAttendeeType = async () => {
    if (!newAttendeeType.name.trim()) return toast.error("Name is required");
    try {
        let res;
        if(newAttendeeType.id) {
            res = await updateAttendeeTypeApi(newAttendeeType.id, { name: newAttendeeType.name, userId: currentUserId });
        } else {
            res = await addAttendeeTypeApi({ name: newAttendeeType.name, userId: currentUserId });
        }

        if(res?.status === 200 || res?.status === 201) {
            toast.success(newAttendeeType.id ? "Attendee Type Updated" : "Attendee Type Added");
            
            let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

            const resA = await getAttendeeTypesApi(1, 5000);
            if(resA?.status === 200) {
                 const rows = resA.data.records || resA.data || [];
                 setRawAttendeeTypes(rows);
                 const normalized = normalizeSimple(rows);
                 setAttendeeTypes(normalized);

                 if(!createdId && newAttendeeType.id) createdId = newAttendeeType.id;
                 if(!createdId) {
                     const created = normalized.find(r => r.name.trim().toLowerCase() === newAttendeeType.name.trim().toLowerCase());
                     if(created) createdId = created.id;
                 }

                 if(createdId && showAttendeeModal) {
                     setAttendeeForm(prev => ({ ...prev, attendeeType: String(createdId) }));
                 }
            }
            setNewAttendeeType({ id: null, name: "" });
            setAttendeeTypeModalOpen(false);
        } else {
             toast.error("Failed to save Attendee Type");
        }
    } catch (error) { console.error(error); toast.error("Failed to save Attendee Type"); }
  };
  
  const handleSaveAttendanceStatus = async () => {
    if (!newAttendanceStatus.name.trim()) return toast.error("Name is required");
    try {
        let res;
        if(newAttendanceStatus.id) {
            res = await updateAttendanceStatusApi(newAttendanceStatus.id, { name: newAttendanceStatus.name, userId: currentUserId });
        } else {
            res = await addAttendanceStatusApi({ name: newAttendanceStatus.name, userId: currentUserId });
        }

        if(res?.status === 200 || res?.status === 201) {
            toast.success(newAttendanceStatus.id ? "Attendance Status Updated" : "Attendance Status Added");
            
            let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

            const resS = await getAttendanceStatusesApi(1, 5000);
            if(resS?.status === 200) {
                const rows = resS.data.records || resS.data || [];
                setRawAttendanceStatuses(rows);
                const normalized = normalizeSimple(rows);
                setAttendanceStatuses(normalized);

                if(!createdId && newAttendanceStatus.id) createdId = newAttendanceStatus.id;
                if(!createdId) {
                     const created = normalized.find(r => r.name.trim().toLowerCase() === newAttendanceStatus.name.trim().toLowerCase());
                     if(created) createdId = created.id;
                }

                if(createdId && showAttendeeModal) {
                    setAttendeeForm(prev => ({ ...prev, attendanceStatus: String(createdId) }));
                }
            }
            setNewAttendanceStatus({ id: null, name: "" });
            setAttendanceStatusModalOpen(false);
        } else {
            toast.error("Failed to save Attendance Status");
        }
    } catch (error) { console.error(error); toast.error("Failed to save Attendance Status"); }
  };

  const handleSaveMeetingType = async () => {
    if (!newMeetingType.name.trim()) return toast.error("Name is required");
    try {
      // DUPLICATE CHECK
      const duplicateRes = await searchMeetingTypeApi(newMeetingType.name.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.name || i.Name || "").toLowerCase() === newMeetingType.name.trim().toLowerCase() && String(i.Id || i.id) !== String(newMeetingType.id)
      );
      if (isDuplicate) {
        toast.error("Meeting Type with this name already exists.");
        return;
      }

      let res;
      if (newMeetingType.id) {
        res = await updateMeetingTypeApi(newMeetingType.id, { name: newMeetingType.name, userId: currentUserId });
      } else {
        res = await addMeetingTypeApi({ name: newMeetingType.name, userId: currentUserId });
      }

      if(res?.status === 200 || res?.status === 201) {
          toast.success(newMeetingType.id ? "Meeting Type Updated" : "Meeting Type Added");
          
          let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

          const resM = await getMeetingTypesApi(1, 10000);
          if(resM?.status === 200) {
              const rows = resM.data.records || resM.data || [];
              const normalized = normalizeSimple(rows);
              setRawMeetingTypes(rows);
              setMeetingTypes(normalized);
              
              if(!createdId && newMeetingType.id) createdId = newMeetingType.id; // If update, use same ID
              if(!createdId) {
                 const created = normalized.find(r => r.name.trim().toLowerCase() === newMeetingType.name.trim().toLowerCase());
                 if(created) createdId = created.id;
              }

              if(createdId) {
                  setMeeting(prev => ({ ...prev, meetingType: String(createdId) }));
              }
          }
          setNewMeetingType({ id: null, name: "" });
          setMeetingTypeModalOpen(false);
      } else {
          toast.error("Failed to save Meeting Type");
      }
    } catch (error) { toast.error("Failed to save Meeting Type"); }
  };

  const handleSaveDepartment = async () => {
    if (!newDepartment.department.trim()) return toast.error("Department Name is required");
    try {
      // DUPLICATE CHECK
      const duplicateRes = await searchDepartmentApi(newDepartment.department.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.department || i.Department || i.name || i.Name || "").toLowerCase() === newDepartment.department.trim().toLowerCase() && String(i.Id || i.id) !== String(newDepartment.id)
      );
      if (isDuplicate) {
        toast.error("Department with this name already exists.");
        return;
      }

      let res;
      if (newDepartment.id) {
        res = await updateDepartmentApi(newDepartment.id, { ...newDepartment, userId: currentUserId });
      } else {
        res = await addDepartmentApi({ ...newDepartment, userId: currentUserId });
      }

      if(res?.status === 200 || res?.status === 201) {
          toast.success(newDepartment.id ? "Department Updated" : "Department Added");
          
          let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

          const resD = await getDepartmentsApi(1, 5000);
          if(resD?.status === 200) {
              const rows = resD.data.records || resD.data || [];
              setRawDepartments(rows);
              const normalized = rows.map((r) => ({ id: r.id, name: r.department }));
              setDepartments(normalized);

              if(!createdId && newDepartment.id) createdId = newDepartment.id;
              if(!createdId) {
                  const created = normalized.find(r => r.name.trim().toLowerCase() === newDepartment.department.trim().toLowerCase());
                  if(created) createdId = created.id;
              }

              if(createdId) {
                  setMeeting(prev => ({ ...prev, department: String(createdId) }));
              }
          }
          setNewDepartment({ id: null, department: "", description: "", parentDepartmentId: "" });
          setDepartmentModalOpen(false);
      } else {
          toast.error("Failed to save Department");
      }
    } catch (error) { toast.error("Failed to save Department"); }
  };

   const handleSaveLocation = async () => {
    if (!newLocation.name.trim()) return toast.error("Location Name is required");
    try {
      // DUPLICATE CHECK
      const duplicateRes = await searchLocationApi(newLocation.name.trim());
      const duplicates = (duplicateRes?.data?.records || duplicateRes?.data || []);
      const isDuplicate = duplicates.some(
        (i) => (i.name || i.Name || "").toLowerCase() === newLocation.name.trim().toLowerCase() && String(i.Id || i.id) !== String(newLocation.id)
      );
      if (isDuplicate) {
        toast.error("Location with this name already exists.");
        return;
      }

      let res;
      if (newLocation.id) {
         res = await updateLocationApi(newLocation.id, { ...newLocation, userId: currentUserId });
      } else {
         res = await addLocationApi({ ...newLocation, userId: currentUserId });
      }

      if(res?.status === 200 || res?.status === 201) {
          toast.success(newLocation.id ? "Location Updated" : "Location Added");
          
          let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

          const resL = await getLocationsApi(1, 5000);
          if(resL?.status === 200) {
              const rows = resL.data.records || resL.data || [];
              setRawLocations(rows);
              const normalized = rows.map(l => ({
                id: String(l.Id),
                name: `${l.Name} (${l.CityName ?? ""})`
              }));
              setLocations(normalized);

              if(!createdId && newLocation.id) createdId = newLocation.id;
              if(!createdId) {
                  const created = rows.find(l => (l.Name || l.name || "").trim().toLowerCase() === newLocation.name.trim().toLowerCase());
                  if(created) createdId = created.id;
              }

              if(createdId) {
                  setMeeting(prev => ({ ...prev, location: String(createdId) }));
              }
          }
          setNewLocation({ id: null, name: "", countryId: "", stateId: "", cityId: "", address: "", latitude: "", longitude: "" });
          setLocationModalOpen(false);
      } else {
          toast.error("Failed to save Location");
      }
    } catch (error) { toast.error("Failed to save Location"); }
  };

  const handleSaveCountry = async () => {
    if (!newCountry.name.trim()) return toast.error("Country Name is required");
    try {
        // DUPLICATE CHECK
        const duplicateRes = await searchCountryApi(newCountry.name.trim());
        const duplicates = duplicateRes?.data?.records || duplicateRes?.data || [];
        const isDuplicate = duplicates.some(
            (c) => (c.name || c.CountryName || "").toLowerCase() === newCountry.name.trim().toLowerCase() && String(c.id || c.Id) !== String(newCountry.id)
        );
        if (isDuplicate) {
            toast.error("Country with this name already exists.");
            return;
        }

      let res;
      if (newCountry.id) {
          res = await updateCountryApi(newCountry.id, { name: newCountry.name });
      } else {
          res = await addCountryApi({ name: newCountry.name, userId: currentUserId });
      }

      if(res?.status === 200 || res?.status === 201) {
          toast.success(newCountry.id ? "Country Updated" : "Country Added");

          let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

          const resC = await getCountriesApi(1, 5000);
          if (resC?.status === 200) {
               const rows = resC.data.records || resC.data || [];
               setModalCountries(rows.map(c => ({ id: String(c.Id ?? c.id), name: c.Name ?? c.name })));
               
               if(!createdId && newCountry.id) createdId = newCountry.id;
               if(!createdId) {
                   const created = rows.find(c => (c.Name || c.name || "").trim().toLowerCase() === newCountry.name.trim().toLowerCase());
                   if(created) createdId = created.Id || created.id;
               }

               if(createdId) {
                  // If Location modal open
                  if(locationModalOpen) setNewLocation(prev => ({ ...prev, countryId: String(createdId), stateId: "", cityId: "" }));
                  // If State Add modal open
                  if(addStateModalOpen) setNewState(prev => ({ ...prev, countryId: String(createdId) }));
                  // If City Add modal open
                  if(addCityModalOpen) setNewCity(prev => ({ ...prev, countryId: String(createdId) }));
               }
          }
          setNewCountry({ id: null, name: "" }); // Reset
          setAddCountryModalOpen(false);
      } else {
          toast.error("Failed to save Country");
      }
    } catch (error) { toast.error("Failed to save Country"); }
  };

  const handleSaveState = async () => {
    if (!newState.name.trim() || !newState.countryId) return toast.error("State Name and Country are required");
    try {
      // DUPLICATE CHECK
      const duplicateRes = await searchStateApi(newState.name.trim());
      const duplicates = duplicateRes?.data?.records || duplicateRes?.data || [];
      const isDuplicate = duplicates.some(
        (s) =>
          (s.name || s.StateName || "").toLowerCase() === newState.name.trim().toLowerCase() &&
          Number(s.countryId ?? s.CountryId) === Number(newState.countryId) &&
          String(s.id || s.Id) !== String(newState.id)
      );
      if (isDuplicate) {
        toast.error("State with this name already exists in selected country.");
        return;
      }

      let res;
      if (newState.id) {
          res = await updateStateApi(newState.id, { name: newState.name, countryId: newState.countryId });
      } else {
          res = await addStateApi({ name: newState.name, countryId: newState.countryId, userId: currentUserId });
      }

      if(res?.status === 200 || res?.status === 201) {
          toast.success(newState.id ? "State Updated" : "State Added");

          let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

          if (newLocation.countryId) {
             const resS = await getStatesByCountryApi(newLocation.countryId);
             if(resS?.status === 200) {
                 const rows = resS.data || [];
                 setLocationModalStates(rows.map(s => ({ id: String(s.Id ?? s.id), name: s.Name ?? s.name })));

                 if(String(newState.countryId) === String(newLocation.countryId)) {
                     if(!createdId && newState.id) createdId = newState.id;
                     if(!createdId) {
                         const created = rows.find(s => (s.name || s.Name).trim().toLowerCase() === newState.name.trim().toLowerCase());
                         if(created) createdId = created.Id || created.id;
                     }
                     if(createdId) {
                         // If editing currently selected state, update it
                         if(locationModalOpen && String(newLocation.stateId) === String(createdId)) {
                            // no-op, name updated via list
                         }
                         
                         if(!newState.id && locationModalOpen) {
                            setNewLocation(prev => ({ ...prev, stateId: String(createdId), cityId: "" }));
                         }
                     }
                 }
             }
          }
          setNewState({ id: null, name: "", countryId: "" });
          setAddStateModalOpen(false);
      } else {
          toast.error("Failed to save State");
      }
    } catch (error) { toast.error("Failed to save State"); }
  };

  const handleSaveCity = async () => {
    if (!newCity.name.trim() || !newCity.stateId) return toast.error("City Name and State are required");
    try {
        // DUPLICATE CHECK
        const duplicateRes = await searchCityApi(newCity.name.trim());
        const duplicates = duplicateRes?.data?.records || duplicateRes?.data || [];
        const isDuplicate = duplicates.some(
          (c) =>
            (c.name || c.CityName || "").toLowerCase() === newCity.name.trim().toLowerCase() &&
            Number(c.stateId ?? c.StateId) === Number(newCity.stateId) &&
            String(c.id || c.Id) !== String(newCity.id)
        );
        if (isDuplicate) {
          toast.error("City with this name already exists in selected state.");
          return;
        }

      let res;
      if (newCity.id) {
          res = await updateCityApi(newCity.id, { name: newCity.name, countryId: newCity.countryId, stateId: newCity.stateId });
      } else {
          res = await addCityApi({ ...newCity, userId: currentUserId });
      }

      if(res?.status === 200 || res?.status === 201) {
          toast.success(newCity.id ? "City Updated" : "City Added");

          let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

          if (newLocation.stateId) {
             const resC = await getCitiesApi(1, 5000);
             if(resC?.status === 200) {
                 const allCities = resC.data.records || resC.data || [];
                 const filtered = allCities.filter(c => String(c.stateId) === String(newLocation.stateId));
                 setLocationModalCities(filtered.map(c => ({ id: String(c.Id ?? c.id), name: c.Name ?? c.name })));

                 if(String(newCity.stateId) === String(newLocation.stateId)) {
                     if(!createdId && newCity.id) createdId = newCity.id;
                     if(!createdId) {
                         const created = filtered.find(c => (c.Name || c.name || "").trim().toLowerCase() === newCity.name.trim().toLowerCase());
                         if(created) createdId = created.Id || created.id;
                     }
                     if(createdId) {
                         if(!newCity.id) setNewLocation(prev => ({ ...prev, cityId: String(createdId) }));
                     }
                 }
             }
          }
          setNewCity({ id: null, name: "", countryId: "", stateId: "", cityId: "" });
          setAddCityModalOpen(false);
      } else {
          toast.error("Failed to save City");
      }
    } catch (error) { toast.error("Failed to save City"); }
  };


  /* LOAD DATA */
  useEffect(() => {
    getMeetingByIdApi(id).then(res => {
      console.log("🔵 RAW getMeetingByIdApi RESPONSE:", res?.data);

      if (res?.data?.meeting) {
        console.log("🟢 MEETING OBJECT FROM API:", res.data.meeting);
        console.log("🟢 ATTENDEES FROM API:", res.data.attendees);

        const m = res.data.meeting;
        setMeeting({
          ...m,
          // Convert API datetime to datetime-local format
          startDate: m.startDate ? convertToDatetimeLocal(m.startDate) : "",
          endDate: m.endDate ? convertToDatetimeLocal(m.endDate) : "",
          attendees: res.data.attendees || []
        });

        // ⬅ Set external recipients from meeting Recipients field (check both cases)
        const recipients = m.Recipients || m.recipients || "";
        if (recipients) {
          console.log("📧 RECIPIENTS LOADED:", recipients);
          setExternalRecipients(recipients);
        }
      }
    });
  }, [id]);

  /* LOAD AGENDA ITEMS */
  useEffect(() => {
    if (activeTab === "agenda") {
        getAgendaItemsApi(id).then(res => {
            if(res.data.records) {
                setAgendaItems(res.data.records);
            }
        }).catch(err => console.error(err));
    }
    if (activeTab === "decisions") {
        getAgendaDecisionsApi(id).then(res => {
            if(res.data.records) {
                setAgendaDecisions(res.data.records);
            }
        }).catch(err => console.error("Error fetching decisions:", err));
    }
  }, [id, activeTab]);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, activeTab]);



  const handleDelete = async () => {
    const result = await showDeleteConfirm('meeting');
    if (!result.isConfirmed) return;

    try {
      await deleteMeetingApi(id, { userId: 1 }); // soft delete
      showSuccessToast("Meeting deleted successfully");
      navigate("/app/meeting/meetings");
    } catch (err) {
      console.error("DELETE MEETING ERROR:", err);
      showErrorToast("Failed to delete meeting");
    }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm('meeting');
    if (!result.isConfirmed) return;
    try {
      await restoreMeetingApi(id, { userId: 1 });
      showSuccessToast("Meeting restored successfully");
      navigate("/app/meeting/meetings");
    } catch (err) {
      console.error("RESTORE ERROR:", err);
      showErrorToast("Failed to restore meeting");
    }
  };

  /* SAVE / UPDATE */
  const handleSave = async () => {
    try {
      // VALIDATION
      if (!meeting.meetingName?.trim() || 
          !meeting.meetingType || 
          !meeting.startDate || 
          !meeting.endDate || 
          !meeting.department || 
          !meeting.location || 
          !meeting.organizedBy || 
          !meeting.reporter) {
          toast.error("Please fill in all required fields.");
          return;
      }

      const payload = {
        meetingName: meeting.meetingName,
        meetingType: meeting.meetingType || null,
        department: meeting.department || null,
        location: meeting.location || null,
        organizedBy: meeting.organizedBy || null,
        reporter: meeting.reporter,
        // Ensure seconds are included for backend if missing
        startDate: meeting.startDate && meeting.startDate.length === 16 ? meeting.startDate + ":00" : meeting.startDate,
        endDate: meeting.endDate && meeting.endDate.length === 16 ? meeting.endDate + ":00" : meeting.endDate,
        attendees: meeting.attendees.map(a => ({
          attendeeId: a.attendeeId,
          attendeeTypeId: a.attendeeTypeId,
          attendanceStatusId: a.attendanceStatusId
        })),
        recipients: externalRecipients.split(',').map(e => e.trim()).filter(e => e), // ⬅ Process recipients
        userId: currentUserId
      };

      const res = await updateMeetingApi(id, payload);
      if (res.status === 200) {
        toast.success("Meeting updated successfully");
        // Add refresh flag to trigger data reload in Meetings.jsx
        navigate("/app/meeting/meetings?refresh=true");
      } else {
        toast.error("Failed to update meeting");
      }
    } catch (error) {
      console.error("SAVE MEETING ERROR:", error);
      toast.error("Error updating meeting");
    }
  };

  /* AGENDA HANDLERS */
  const handleSaveAgendaItem = async () => {
    if (!newAgendaItem.title || !newAgendaItem.itemType) {
        toast.error("Title and Type are required");
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append("meetingId", id);
        formData.append("title", newAgendaItem.title);
        formData.append("description", newAgendaItem.description);
        formData.append("itemTypeId", newAgendaItem.itemType);
        formData.append("requestedBy", newAgendaItem.requestedBy);
        formData.append("sequenceNo", newAgendaItem.sequenceNo);
        
        if (newAgendaItem.attachmentFile) formData.append("attachmentFile", newAgendaItem.attachmentFile);
        if (newAgendaItem.imageFile) formData.append("imageFile", newAgendaItem.imageFile);

        let res;
        if (newAgendaItem.id) {
           // UPDATE
           res = await updateAgendaItemApi(newAgendaItem.id, formData);
        } else {
           // ADD
           res = await addAgendaItemApi(formData);
        }

        if (res.status === 201 || res.status === 200) {
            toast.success(newAgendaItem.id ? "Agenda Item Updated" : "Agenda Item Added");
            setShowAgendaModal(false);
            setNewAgendaItem({
                id: null,
                title: "",
                description: "",
                itemType: "",
                requestedBy: "",
                sequenceNo: "",
                attachmentFile: null,
                imageFile: null
            });
            // Refresh List
            const aiRes = await getAgendaItemsApi(id);
            if (aiRes.data.records) setAgendaItems(aiRes.data.records);
        } else {
            toast.error("Failed to save agenda item");
        }
    } catch (err) {
        console.error("SAVE AGENDA ITEM ERROR:", err);
        toast.error("Failed to save agenda item");
    }
  };

  const handleEditAgendaItem = (item) => {
    console.log("✏️ EDIT AGENDA ITEM - RAW DATA:", item);
    setNewAgendaItem({
        id: item.id,
        title: item.title || "",
        description: item.description || "",
        itemType: item.itemTypeId || "", 
        requestedBy: item.requestedBy || item.requestedById || "", 
        sequenceNo: item.sequenceNo || "",
        attachmentFile: null, 
        imageFile: null,
        images: item.images || null,
        attachments: item.attachments || null
    });
    setShowAgendaModal(true);
  };

  const handleDeleteAgendaItem = async (itemId) => {
      const result = await showDeleteConfirm('agenda item');
      if (!result.isConfirmed) return;

      try {
          const res = await deleteAgendaItemApi(itemId);
          if (res.status === 200) {
              showSuccessToast("Agenda Item deleted");
              // Refresh List
              const aiRes = await getAgendaItemsApi(id);
              if (aiRes.data.records) setAgendaItems(aiRes.data.records);
          } else {
              showErrorToast("Failed to delete item");
          }
      } catch (error) {
          console.error("DELETE AGENDA ITEM ERROR:", error);
          showErrorToast("Failed to delete item");
      }
  };

  /* AGENDA ITEM TYPE HANDLERS */
  const handleSaveAgendaType = async () => {
    if (!newAgendaType.name) {
        toast.error("Name is required");
        return;
    }
    try {
        // DUPLICATE CHECK
        const duplicateRes = await searchAgendaItemTypeApi(newAgendaType.name.trim());
        const duplicates = duplicateRes?.data?.records || duplicateRes?.data || [];
        const isDuplicate = duplicates.some(
            (i) => (i.name || i.Name || "").toLowerCase() === newAgendaType.name.trim().toLowerCase()
        );
        if (isDuplicate) {
            toast.error("Agenda Item Type with this name already exists.");
            return;
        }

        let res;
        if(newAgendaType.id) {
           res = await updateAgendaItemTypeApi(newAgendaType.id, { name: newAgendaType.name, userId: currentUserId });
        } else {
           res = await addAgendaItemTypeApi(newAgendaType);
        }

        if (res.status === 201 || res.status === 200) {
           toast.success(newAgendaType.id ? "Agenda Item Type Updated" : "Agenda Item Type Added");
           
           let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

           // Refresh dropdown
           const atRes = await getAgendaItemTypesApi(1, 1000);
           if (atRes?.status === 200) {
               const atList = atRes.data.records || atRes.data || [];
               setRawAgendaItemTypes(atList);
               setAgendaItemTypes(atList.map(item => ({
                   id: item.Id || item.id,
                   name: item.Name || item.name
               })));

               // Auto-select
               if(!createdId && newAgendaType.id) createdId = newAgendaType.id;
               if(!createdId) {
                   const created = atList.find(i => (i.Name || i.name || "").trim().toLowerCase() === newAgendaType.name.trim().toLowerCase());
                   if(created) createdId = created.Id || created.id;
               }

               if(createdId) {
                   setNewAgendaItem(prev => ({ ...prev, itemType: String(createdId) }));
               }
           }
           setShowAgendaTypeModal(false);
           setNewAgendaType({ id: null, name: "", description: "" });
        } else {
            toast.error("Failed to save Agenda Item Type");
        }
    } catch (err) {
        console.error("ADD AGENDA TYPE ERROR:", err);
        toast.error("Failed to add agenda item type");
    }
  };

  /* DECISION HANDLERS */
  const handleSaveDecision = async () => {
    if (!newDecision.description) {
        toast.error("Description is required");
        return;
    }
    try {
        const formData = new FormData();
        formData.append("meetingId", id);
        formData.append("description", newDecision.description);
        formData.append("dueDate", newDecision.dueDate);
        formData.append("assignedTo", newDecision.assignedTo);
        formData.append("decisionNumber", newDecision.decisionNumber);
        formData.append("relatedAgendaItem", newDecision.relatedAgendaItem);
        formData.append("resolutionStatus", newDecision.resolutionStatus);
        
        if (newDecision.imageFile) formData.append("imageFile", newDecision.imageFile);
        if (newDecision.attachmentFile) formData.append("attachmentFile", newDecision.attachmentFile);

        let res;
        if (newDecision.id) {
           // UPDATE
           res = await updateAgendaDecisionApi(newDecision.id, formData);
        } else {
           // ADD
           res = await addAgendaDecisionApi(formData);
        }

        if (res.status === 201 || res.status === 200) {
            toast.success(newDecision.id ? "Decision Updated" : "Decision Added");
            setShowDecisionModal(false);
            setNewDecision({
                id: null,
                description: "",
                dueDate: "",
                assignedTo: "",
                decisionNumber: "",
                relatedAgendaItem: "",
                resolutionStatus: "",
                imageFile: null,
                attachmentFile: null
            });
            // Refresh
            const dRes = await getAgendaDecisionsApi(id);
            if (dRes.data.records) setAgendaDecisions(dRes.data.records);
        } else {
            toast.error("Failed to save decision");
        }
    } catch (err) {
        console.error("SAVE DECISION ERROR:", err);
        toast.error("Failed to save decision");
    }
  };

  const handleEditDecision = (item) => {
      setNewDecision({
          id: item.id,
          description: item.description || "",
          dueDate: item.dueDate ? item.dueDate.split('T')[0] : "",
          assignedTo: item.assignedTo || item.assignedToId || "",
          decisionNumber: item.decisionNumber || "",
          relatedAgendaItem: item.relatedAgendaItem || item.relatedAgendaItemId || "",
          resolutionStatus: item.resolutionStatus || item.resolutionStatusId || "",
          imageFile: null,
          attachmentFile: null,
          images: item.images || null,
          attachments: item.attachments || null
      });
      setShowDecisionModal(true);
  };

  const handleDeleteDecision = async (decisionId) => {
      const result = await showDeleteConfirm('decision');
      if (!result.isConfirmed) return;

      try {
          const res = await deleteAgendaDecisionApi(decisionId);
          if (res.status === 200) {
              showSuccessToast("Decision deleted");
              const dRes = await getAgendaDecisionsApi(id);
              if (dRes.data.records) setAgendaDecisions(dRes.data.records);
          } else {
              showErrorToast("Failed to delete decision");
          }
      } catch (error) {
          console.error("DELETE DECISION ERROR:", error);
          showErrorToast("Failed to delete decision");
      }
  };

  const handleSaveResolutionStatus = async () => {
      if(!newResolutionStatus.name) {
          toast.error("Name required");
          return;
      }
      try {
          // DUPLICATE CHECK
          const duplicateRes = await searchResolutionStatusApi(newResolutionStatus.name.trim());
          const duplicates = duplicateRes?.data?.records || duplicateRes?.data || [];
          const isDuplicate = duplicates.some(
             (s) => (s.name || s.Name || "").toLowerCase() === newResolutionStatus.name.trim().toLowerCase()
          );
          if (isDuplicate) {
              toast.error("Resolution Status with this name already exists.");
              return;
          }

          let res;
          if(newResolutionStatus.id) {
             res = await updateResolutionStatusApi(newResolutionStatus.id, { name: newResolutionStatus.name, userId: currentUserId });
          } else {
             res = await addResolutionStatusApi(newResolutionStatus);
          }

          if (res.status === 201 || res.status === 200) {
              toast.success(newResolutionStatus.id ? "Status Updated" : "Status Added");
              
              let createdId = res.data?.record?.Id || res.data?.record?.id || res.data?.Id || res.data?.id;

              // Refresh dropdown
              const rsRes = await getResolutionStatusesApi(1, 100);
              if(rsRes?.status === 200) {
                  const rsList = rsRes.data.records || rsRes.data || [];
                  setRawResolutionStatuses(rsList);
                  setResolutionStatuses(rsList.map(item => ({
                    id: item.Id || item.id,
                    name: item.Name || item.name
                  })));

                  if(!createdId && newResolutionStatus.id) createdId = newResolutionStatus.id;
                  if(!createdId) {
                      const created = rsList.find(i => (i.Name || i.name || "").trim().toLowerCase() === newResolutionStatus.name.trim().toLowerCase());
                      if(created) createdId = created.Id || created.id;
                  }

                  if(createdId) {
                      setNewDecision(prev => ({ ...prev, resolutionStatus: String(createdId) }));
                  }
              }
              setShowResolutionStatusModal(false);
              setNewResolutionStatus({ id: null, name: "", description: "" });
          } else {
              toast.error("Failed to save status");
          }
      } catch (err) {
          console.error(err);
          toast.error("Failed to add status");
      }
  };




  return (
    <PageLayout>
      <div className="p-6 h-full">
        <ContentCard>
          <div className="h-full overflow-y-auto w-full p-2">

        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate("/app/meeting/meetings")}
                    className={`p-2 rounded border transition-colors ${theme === 'emerald' ? 'bg-white border-gray-200 hover:bg-emerald-50 text-gray-600' : theme === 'purple' ? 'bg-[#6448AE] text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="text-xl font-bold text-[#6448AE]">{isInactive ? "Restore Meeting" : "Edit Meeting"}</h2>
                </div>
                
                 <div className="flex items-center gap-3">
                   {isInactive ? (
                     hasPermission(PERMISSIONS.MEETINGS.DELETE) && (
                     <button
                      onClick={handleRestore}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm text-white transition-colors ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-700 border border-green-600 hover:bg-green-600'}`}
                    >
                      <ArchiveRestore size={16} /> Restore
                    </button>
                     )
                   ) : (
                     <>
                        {hasPermission(PERMISSIONS.MEETINGS.EDIT) && (
                        <button
                          onClick={handleSave}
                          className={`flex items-center gap-2 px-4 py-2 border rounded${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : theme === 'purple' ?  ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white border-[#6448AE]' : 'bg-gray-800 border border-gray-600 text-blue-300 hover:bg-gray-700'}`}
                        >
                          <Save size={16} /> Save
                        </button>
                        )}
        
                        {hasPermission(PERMISSIONS.MEETINGS.DELETE) && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                        )}
                     </>
                   )}
                </div>
            </div>
            <hr className="border-gray-300" />
        </div>

        {/* TABS */}
        <div className="flex gap-6 mb-5">
          <Tab
            label="Meeting"
            active={activeTab === "meeting"}
            onClick={() => navigate(`/app/meeting/meetings/edit/${id}`)}
            theme={theme}
          />
          <Tab
            label="Agenda Item"
            active={activeTab === "agenda"}
            onClick={() =>
              navigate(`/app/meeting/meetings/edit/${id}/agenda`)
            }
            theme={theme}
          />
          <Tab
            label="Agenda Decision"
            active={activeTab === "decisions"}
            onClick={() =>
              navigate(`/app/meeting/meetings/edit/${id}/decisions`)
            }
            theme={theme}
          />
        </div>

        {/* ================= TAB CONTENT ================= */}

        {/* MEETING TAB */}
        <AnimatePresence mode="wait">
        {activeTab === "meeting" && (
          <motion.div
            key="meeting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >


            {/* FORM GRID */}
            <div className={`grid grid-cols-12 gap-x-6 gap-y-6 ${theme === 'emerald' || theme === 'purple' ? 'text-black' : 'text-gray-300'}`}>

              {/* Meeting Name */}
              <div className="col-span-12 md:col-span-6">
                 <div className="flex gap-2 font-medium">
                     <div className="flex-1 font-medium">
                        <InputField
                           label="Meeting Name *"
                           value={meeting.meetingName}
                           onChange={(e) => updateField("meetingName", e.target.value)}
                           disabled={isInactive}
                           placeholder="e.g. Sales Strategy Q4"
                        />
                    </div>
                    {/* Spacer to match Meeting Type / Location button width */}
                    <div className="w-[34px]"></div>
                </div>
              </div>

              {/* Location */}
              <div className="col-span-12 md:col-span-6">
                   <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Location </label>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 font-medium">
                          <SearchableSelect
                            options={locations.map(l => ({ id: l.id, name: l.name }))}
                            value={meeting.location}
                            onChange={(v) => updateField("location", v)}
                            disabled={isInactive}
                            placeholder="-- Select Location --"
                            className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                          />
                      </div>
                      {!isInactive && (
                          <button
                            onClick={() => meeting.location ? handleEditMaster("Location", meeting.location) : handleCreateNew("Location")}
                            className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                            title={meeting.location ? "Edit Location" : "Add Location"}
                        >
                            {meeting.location ? <Pencil size={16} /> : <Star size={16} />}
                        </button>
                      )}
                   </div>
              </div>

              {/* Start Date */}
              <div className="col-span-12 md:col-span-6">
                 <div className="flex gap-2 font-medium">
                     <div className="flex-1 font-medium">
                        <InputField
                            label="Start Date "
                            type="datetime-local"
                            value={meeting.startDate}
                            onChange={(e) => updateField("startDate", e.target.value)}
                            disabled={isInactive}
                            required
                        />
                    </div>
                    <div className="w-[34px]"></div>
                </div>
              </div>

                {/* End Date */}
                <div className="col-span-12 md:col-span-6">
                     <div className="flex gap-2 font-medium">
                         <div className="flex-1 font-medium">
                            <InputField
                                label="End Date"
                                type="datetime-local"
                                value={meeting.endDate}
                                onChange={(e) => updateField("endDate", e.target.value)}
                                disabled={isInactive}
                                required
                            />
                        </div>
                        <div className="w-[34px]"></div>
                    </div>
                </div>

                {/* Meeting Type */}
                <div className="col-span-12 md:col-span-6">
                   <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Meeting Type *</label>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 font-medium">
                          <SearchableSelect
                            options={meetingTypes.map(t => ({ id: t.id, name: t.name }))}
                            value={meeting.meetingType}
                            onChange={(v) => updateField("meetingType", v)}
                            disabled={isInactive}
                            placeholder="-- Select Type --"
                            className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                          />
                      </div>
                      {!isInactive && (
                          <button
                            onClick={() => meeting.meetingType ? handleEditMaster("Meeting Type", meeting.meetingType) : handleCreateNew("Meeting Type")}
                            className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                            title={meeting.meetingType ? "Edit Meeting Type" : "Add Meeting Type"}
                        >
                            {meeting.meetingType ? <Pencil size={16} /> : <Star size={16} />}
                        </button>
                      )}
                   </div>
                </div>

              {/* Department */}
              <div className="col-span-12 md:col-span-6">
                   <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Department *</label>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 font-medium">
                        <SearchableSelect
                            options={departments.map(d => ({ id: d.id, name: d.name }))}
                            value={meeting.department}
                            onChange={(v) => updateField("department", v)}
                            disabled={isInactive}
                            placeholder="-- Select Department --"
                            className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                        />
                      </div>
                      {!isInactive && (
                          <button
                            onClick={() => meeting.department ? handleEditMaster("Department", meeting.department) : handleCreateNew("Department")}
                            className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                            title={meeting.department ? "Edit Department" : "Add Department"}
                        >
                            {meeting.department ? <Pencil size={16} /> : <Star size={16} />}
                        </button>
                      )}
                   </div>
                </div>

                {/* Organized By */}
                <div className="col-span-12 md:col-span-6">
                   <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Organized By *</label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 font-medium">
                          <SearchableSelect
                            options={employees.map(e => ({ id: e.id, name: e.name }))}
                            value={meeting.organizedBy}
                            onChange={(v) => updateField("organizedBy", v)}
                            disabled={isInactive}
                            placeholder="-- Select Organizer --"
                            className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                          />
                      </div>
                      {!isInactive && (
                          <button
                            onClick={() => meeting.organizedBy ? navigate(`/app/hr/editemployee/${meeting.organizedBy}`, { state: { from: location.pathname } }) : handleCreateNew("Organizer")}
                            className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                            title={meeting.organizedBy ? "Edit Organizer" : "Add Organizer"}
                        >
                            {meeting.organizedBy ? <Pencil size={16} /> : <Star size={16} />}
                        </button>
                      )}
                   </div>
                </div>

                {/* Reporter */}
                <div className="col-span-12 md:col-span-6">
                   <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Reporter *</label>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 font-medium">
                          <SearchableSelect
                            options={employees.map(e => ({ id: e.id, name: e.name }))}
                            value={meeting.reporter}
                            onChange={(v) => updateField("reporter", v)}
                            disabled={isInactive}
                            placeholder="-- Select Reporter --"
                            className={theme === 'emerald' ? 'bg-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900' : 'bg-gray-800'}
                          />
                      </div>
                      {!isInactive && (
                          <button
                            onClick={() => meeting.reporter ? navigate(`/app/hr/editemployee/${meeting.reporter}`, { state: { from: location.pathname } }) : handleCreateNew("Reporter")}
                            className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                            title={meeting.reporter ? "Edit Reporter" : "Add Reporter"}
                        >
                            {meeting.reporter ? <Pencil size={16} /> : <Star size={16} />}
                        </button>
                      )}
                   </div>
                </div>

            </div>

            {/* ATTENDEES */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${theme === 'emerald' ? 'text-gray-800' : theme === 'purple' ? 'text-dark font-medium' : 'text-gray-800'}`}>Attendees</h3>
                {!isInactive && hasPermission(PERMISSIONS.MEETINGS.EDIT) && (
                  <button
                    onClick={() => setShowAttendeeModal(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors border ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : theme === 'purple' ? 'bg-[#6448AE] text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-blue-300'}`}
                  >
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>

              <div className={`overflow-x-auto rounded-lg border ${theme === 'emerald' ? '' : 'border-gray-700'}`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={theme === 'emerald' ? 'bg-emerald-50/50 text-gray-700' : theme === 'purple' ? 'bg-purple-50 text-purple-900 font-medium border-b border-purple-100' : 'bg-gray-800 text-gray-400 font-medium'}>
                      <th className="p-3 text-sm font-medium">Attendee</th>
                      <th className="p-3 text-sm font-medium">Attendee Type</th>
                      <th className="p-3 text-sm font-medium">Attendance Status</th>
                      <th className="p-3 text-sm font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.attendees.map((a, i) => (
                      <tr key={i} className={`transition-colors ${theme === 'emerald' ? 'border-gray-100 hover:bg-gray-50' : theme === 'purple' ? 'border-t border-purple-100 font-medium' : 'border-t border-gray-800 bg-gray-800 hover:bg-gray-700/50'}`}>
                        <td className={`p-3 text-sm ${theme === 'emerald' ? 'text-gray-900' : theme === 'purple' ? 'text-purple-800 font-medium' : 'text-yellow-300'}`}>{a.attendeeName || a.attendee}</td>
                        <td className="p-3 text-sm text-purple-800 font-medium">{a.attendeeTypeName || a.attendeeType}</td>
                        <td className="p-3 text-sm text-purple-800 font-medium">{a.attendanceStatusName || a.attendanceStatus}</td>
                        <td className="p-3 text-right flex justify-end gap-2">
                             <button onClick={() => editAttendee(i)} className="p-1 text-purple-800 hover:text-blue-400">
                                 <Pencil size={16} />
                             </button>
                             <button onClick={() => deleteAttendee(i)} className="p-1 text-purple-800 hover:text-red-400">
                                 <Trash2 size={16} />
                             </button>
                        </td>
                      </tr>
                    ))}
                      {meeting.attendees.length === 0 && (
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

               {/* EXTERNAL RECIPIENTS */}
              <div className="mt-8 border-t pt-6">
                   <InputField
                      label="External Recipients (Email)"
                      textarea
                      rows={2}
                      placeholder="Enter emails separated by commas (e.g. client@example.com, vendor@test.com)"
                      value={externalRecipients}
                      onChange={(e) => setExternalRecipients(e.target.value)}
                   />
              </div>

          </motion.div>
        )}

        {/* AGENDA ITEMS TAB */}
        {activeTab === "agenda" && (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >

            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${theme === 'emerald' ? 'text-gray-800' : 'text-white'}`}>Agenda Items</h3>
              {hasPermission(PERMISSIONS.MEETINGS.EDIT) && (
                <button
                    onClick={() => setShowAgendaModal(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors border ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : theme === 'purple' ? 'bg-[#6448AE] text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-blue-300'}`}
                >
                    <Plus size={16} /> Add
                </button>
              )}
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={theme === 'emerald' ? 'bg-emerald-50/50 text-gray-700' : theme === 'purple' ? 'bg-purple-50 text-purple-900 border-b border-purple-100' : 'bg-gray-800 text-gray-400'}>
                  <th className="px-4 py-3 text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-sm font-medium">Item Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Requested By</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Seq</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
              </tr>
              </thead>
              <tbody>
                {agendaItems.map(a => (
                    <tr key={a.id} className={`border-t transition-colors ${theme === 'emerald' ? 'border-gray-100 hover:bg-gray-50' : theme === 'purple' ? 'border-purple-100  hover:bg-purple-50' : 'border-gray-800 hover:bg-gray-700/50'}`}>
                    <td className="px-4 py-3 text-sm text-purple-800 font-medium">{a.id}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${theme === 'emerald' ? 'text-gray-900' : theme === 'purple' ? 'text-purple-900' : 'text-white'}`}>{a.title}</td>
                    <td className="px-4 py-3 text-sm text-purple-800 font-medium">{a.description}</td>
                    <td className="px-4 py-3 text-sm">
                        <span className={`text-sm font-medium ${theme === 'emerald' ? 'bg-blue-50 text-blue-700' : theme === 'purple' ? 'text-purple-800' : 'bg-blue-900/30 text-blue-300'}`}>
                         {agendaItemTypes.find(t => String(t.id) === String(a.itemTypeId || a.itemType))?.name || "-"}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-800 font-medium">{employees.find(e => String(e.id) === String(a.requestedById || a.requestedBy))?.name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-purple-800 font-medium">{a.sequenceNo}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                        {hasPermission(PERMISSIONS.MEETINGS.EDIT) && (
                        <>
                        <button 
                            onClick={() => handleEditAgendaItem(a)}
                            className="p-1.5 text-purple-800 hover:text-blue-400 rounded transition-colors mr-2"
                            title="Edit"
                        >
                            <Pencil size={15} />
                        </button>
                        <button 
                            onClick={() => handleDeleteAgendaItem(a.id)}
                            className="p-1.5 text-purple-800 hover:text-red-400 rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={15} />
                        </button>
                        </>
                        )}
                    </td>
                  </tr>
                ))}
                {agendaItems.length === 0 && (
                    <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">No Agenda Items found</td>
                    </tr>
                )}
              </tbody>
            </table>
            
          </motion.div>
        )}

        {/* AGENDA DECISIONS TAB */}
        {activeTab === "decisions" && (
          <motion.div
            key="decisions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${theme === 'emerald' ? 'text-gray-800' : 'text-white'}`}>Agenda Decisions</h3>
              {hasPermission(PERMISSIONS.MEETINGS.EDIT) && (
              <button 
                onClick={() => {
                    setNewDecision({ decisionText: "", agendaItemId: "", decisionDate: "", resolutionStatusId: "" });
                    setShowDecisionModal(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors border ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : theme === 'purple' ? 'bg-[#6448AE] text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-blue-300'}`}
              >
                <Plus size={16} /> Add
              </button>
              )}
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={theme === 'emerald' ? 'bg-emerald-50/50 text-gray-700' : theme === 'purple' ? 'bg-purple-50 text-purple-900 border-b border-purple-100' : 'bg-gray-800 text-gray-400'}>
                  <th className="px-4 py-3 text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-sm font-medium">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Resol. Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Assigned To</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
              </tr>
              </thead>
              <tbody>
                {agendaDecisions.map(d => (
                   <tr key={d.id} className={`border-t transition-colors ${theme === 'emerald' ? 'border-gray-100 hover:bg-gray-50' : theme === 'purple' ? 'border-purple-100 hover:bg-purple-50 text-sm font-medium text-purple-800' : 'border-gray-800 hover:bg-gray-700/50'}`}>
                     <td className="px-4 py-3 text-sm  text-purple-800">{d.id}</td>
                     <td className={`px-4 py-3 text-sm font-medium ${theme === 'emerald' ? 'text-gray-900' : theme === 'purple' ? 'text-purple-900' : 'text-white'}`}>{d.description}</td>
                     <td className="px-4 py-3 text-sm text-purple-800">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "-"}</td>
                     <td className="px-4 py-3 text-sm">
                        <span className={`text-sm font-medium ${
                            d.resolutionStatusName === 'Adopted' 
                            ? (theme === 'emerald' ? 'bg-green-50 text-green-700' : 'bg-green-900/30 text-green-300')
                            : theme === 'purple' ? 'text-purple-800' : ' text-dark'
                        }`}>
                         {resolutionStatuses.find(s => String(s.id) === String(d.resolutionStatus || d.resolutionStatusId))?.name || "-"}
                        </span>
                     </td>
                     <td className="px-4 py-3 text-sm text-purple-800">{employees.find(e => String(e.id) === String(d.assignedTo || d.assignedToId))?.name || "-"}</td>
                     <td className="px-4 py-3 flex items-center gap-2">
                        {hasPermission(PERMISSIONS.MEETINGS.EDIT) && (
                        <>
                        <button 
                            onClick={() => handleEditDecision(d)}
                            className="p-1.5 text-purple-800 hover:text-blue-400 rounded transition-colors mr-2"
                            title="Edit"
                        >
                            <Pencil size={15} />
                        </button>
                        <button 
                            onClick={() => handleDeleteDecision(d.id)}
                            className="p-1.5 text-purple-800 hover:text-red-400 rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={15} />
                        </button>
                        </>
                        )}
                    </td>
                   </tr>
                ))}
                 {agendaDecisions.length === 0 && (
                    <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">No Agenda Decisions found</td>
                    </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}
        
        {/* INTERNAL NOTES TAB */}

        </AnimatePresence>

        {/* NEW AGENDA ITEM MODAL */}
        {showAgendaModal && (
            <AddModal
                isOpen={showAgendaModal}
                onClose={() => setShowAgendaModal(false)}
                onSave={handleSaveAgendaItem}
                title={newAgendaItem.id ? "Edit Agenda Item" : "New Agenda Item"}
                width="950px"
            >
                        <div className="space-y-6">
                            
                            {/* Inputs Section */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <InputField
                                         label="Title"
                                         value={newAgendaItem.title}
                                         onChange={e => setNewAgendaItem({...newAgendaItem, title: e.target.value})}
                                         placeholder="Enter title"
                                         required
                                    />
                                </div>

                                <div>
                                    <InputField
                                        label="Description"
                                        textarea
                                        rows={4}
                                        placeholder="Enter description..."
                                        value={newAgendaItem.description}
                                        onChange={e => setNewAgendaItem({...newAgendaItem, description: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Item Type *</label>
                                         <div className="flex items-center gap-2">
                                            <div className="flex-1 font-medium">
                                                <SearchableSelect 
                                                    className="w-full" 
                                                    options={agendaItemTypes}
                                                    value={newAgendaItem.itemType}
                                                    onChange={(val) => setNewAgendaItem({...newAgendaItem, itemType: val})}
                                                    placeholder="-- select type --"
                                                />
                                            </div>
                                            {hasPermission(PERMISSIONS.AGENDA_ITEM_TYPES.CREATE) && (
                                            <button 
                                                onClick={() => newAgendaItem.itemType ? handleEditMaster("Agenda Item Type", newAgendaItem.itemType) : setShowAgendaTypeModal(true)}
                                                className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                                                title={newAgendaItem.itemType ? "Edit Item Type" : "Add New Item Type"}
                                            >
                                                {newAgendaItem.itemType ? <Pencil size={16}/> : <Star size={16}/>}
                                            </button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                         <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Requested By</label>
                                         <div className="flex items-center gap-2">
                                            <div className="flex-1 font-medium">
                                                <SearchableSelect 
                                                    className="w-full"
                                                    options={employees}
                                                    value={newAgendaItem.requestedBy}
                                                    onChange={(val) => setNewAgendaItem({...newAgendaItem, requestedBy: val})}
                                                    placeholder="-- select employee --"
                                                />
                                            </div>
                                            {hasPermission(PERMISSIONS.HR.EMPLOYEES.CREATE) && (
                                            <button 
                                                onClick={() => newAgendaItem.requestedBy ? navigate(`/app/hr/editemployee/${newAgendaItem.requestedBy}`, { state: { from: location.pathname } }) : navigate("/app/hr/newemployee", { state: { from: location.pathname } })}
                                                className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                                                title={newAgendaItem.requestedBy ? "Edit Employee" : "New Employee"}
                                            >
                                                {newAgendaItem.requestedBy ? <Pencil size={16}/> : <Star size={16}/>}
                                            </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <InputField
                                            label="Sequence No"
                                            type="number"
                                            value={newAgendaItem.sequenceNo}
                                            onChange={e => setNewAgendaItem({...newAgendaItem, sequenceNo: e.target.value})}
                                        />
                                    </div>
                                    
                                    {/* Attachment Input */}
                                     <div>
                                        <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Attachment</label>
                                        <div className="flex items-center gap-2">
                                             <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded cursor-pointer transition-colors text-sm ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50' : theme === 'purple' ? 'bg-[#6448AE] text-white border-none hover:opacity-90' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                                                📎 {newAgendaItem.attachmentFile || newAgendaItem.attachments ? "Change File" : "Select File"}
                                                <input type="file" className="hidden" onChange={e => setNewAgendaItem({...newAgendaItem, attachmentFile: e.target.files[0]})} />
                                             </label>
                                             {(newAgendaItem.attachmentFile || newAgendaItem.attachments) && (
                                                <button onClick={() => setNewAgendaItem({...newAgendaItem, attachmentFile: null, attachments: null})} className={`p-2 border rounded ${theme === 'emerald' ? 'bg-white border-gray-300 text-red-600 hover:bg-red-50' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-800 border-gray-600 text-red-400 hover:bg-gray-700'}`}><Trash2 size={16}/></button>
                                             )}
                                        </div>
                                        {newAgendaItem.attachmentFile ? (
                                            <div className="text-xs text-blue-500 mt-1 truncate">
                                                {newAgendaItem.attachmentFile.name} ({(newAgendaItem.attachmentFile.size / 1024).toFixed(1)} KB)
                                            </div>
                                        ) : newAgendaItem.attachments ? (
                                            <div className="text-xs text-emerald-600 mt-1 truncate">
                                                Existing: {newAgendaItem.attachments}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Image Preview Section (Relocated to Bottom) */}
                            <div className="space-y-1">
                                <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' : theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Image</label>
                                
                                <div className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative overflow-hidden h-[200px] w-full ${theme === 'emerald' ? 'border-gray-300 bg-gray-50' : theme === 'purple' ? 'border-gray-700 bg-white' : 'border-gray-700 bg-gray-800/50'}`}>
                                    {newAgendaItem.imageFile ? (
                                        <>
                                            <img 
                                                src={URL.createObjectURL(newAgendaItem.imageFile)} 
                                                alt="Preview" 
                                                className="absolute inset-0 w-full h-full object-contain p-2"
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                 <label className="p-1.5 bg-purple-100border-gray-700 rounded cursor-pointer hover:bg-purple-100 text-gray-700">
                                                    <Pencil size={14} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => setNewAgendaItem({...newAgendaItem, imageFile: e.target.files[0]})} />
                                                 </label>
                                                 <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setNewAgendaItem({...newAgendaItem, imageFile: null});
                                                    }}
                                                    className="p-1.5 bg-red-900/80 rounded hover:bg-red-800 text-white"
                                                 >
                                                    <Trash2 size={14} />
                                                 </button>
                                            </div>
                                        </>
                                    ) : newAgendaItem.images ? (
                                        <>
                                            <img 
                                                src={`http://localhost:5000/uploads/agenda_items/${newAgendaItem.images}`} 
                                                alt="Existing" 
                                                className="absolute inset-0 w-full h-full object-contain p-2"
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                 <label className="p-1.5 bg-gray-900/80 rounded cursor-pointer hover:bg-black text-white">
                                                    <Pencil size={14} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => setNewAgendaItem({...newAgendaItem, imageFile: e.target.files[0]})} />
                                                 </label>
                                                 <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setNewAgendaItem({...newAgendaItem, images: null});
                                                    }}
                                                    className="p-1.5 bg-red-900/80 rounded hover:bg-red-800 text-white"
                                                 >
                                                    <Trash2 size={14} />
                                                 </button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                                                {newAgendaItem.images}
                                            </div>
                                        </>
                                    ) : (
                                        <label className={`cursor-pointer flex flex-col items-center gap-2 transition-colors p-4 text-center w-full h-full justify-center ${theme === 'emerald' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}>
                                            <Plus size={32} />
                                            <span className="text-xs">Click to Upload Image</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={e => setNewAgendaItem({...newAgendaItem, imageFile: e.target.files[0]})} />
                                        </label>
                                    )}
                                </div>
                                 {newAgendaItem.imageFile && (
                                    <div className="text-xs text-center text-gray-400">
                                        {newAgendaItem.imageFile.name}
                                    </div>
                                 )}
                            </div>
                        </div>
            </AddModal>
        )}

        {/* NEW AGENDA ITEM TYPE MODAL */}
        {showAgendaTypeModal && (
            <AddModal
                isOpen={showAgendaTypeModal}
                onClose={() => setShowAgendaTypeModal(false)}
                onSave={handleSaveAgendaType}
                title={newAgendaType.id ? "Edit Item Type" : "New Item Type"}
                width="700px"
            >
                <div className="space-y-4">
                    <InputField
                         label="Name"
                         value={newAgendaType.name}
                         onChange={e => setNewAgendaType({...newAgendaType, name: e.target.value})}
                         required
                    />
                </div>
            </AddModal>
        )}

        {/* NEW DECISION MODAL */}
        {showDecisionModal && (
            <AddModal
                isOpen={showDecisionModal}
                onClose={() => setShowDecisionModal(false)}
                onSave={handleSaveDecision}
                title={newDecision.id ? "Edit Agenda Decision" : "New Agenda Decision"}
                width="800px"
            >
                        <div className="space-y-4">

                            <div>
                                <InputField
                                    label="Description *"
                                    textarea
                                    rows={4}
                                    value={newDecision.description}
                                    onChange={e => setNewDecision({...newDecision, description: e.target.value})}
                                />
                            </div>

                            <InputField
                                label="Due Date *"
                                type="date"
                                value={newDecision.dueDate}
                                onChange={e => setNewDecision({...newDecision, dueDate: e.target.value})}
                            />

                            <div>
                                <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' :theme === 'purple' ? 'text-dark font-medium' : 'text-white'}`}>Assigned To</label>
                                <SearchableSelect
                                    options={employees.map(e => ({ id: e.id, name: e.name }))}
                                    value={newDecision.assignedTo}
                                    onChange={val => setNewDecision({...newDecision, assignedTo: val})}
                                    placeholder="--select--"
                                    className="w-full"
                                />
                            </div>

                            <InputField
                                label="Decision Number"
                                value={newDecision.decisionNumber}
                                onChange={e => setNewDecision({...newDecision, decisionNumber: e.target.value})}
                            />

                            <div>
                                <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Related Agenda Item</label>
                                <SearchableSelect
                                    options={agendaItems.map(item => ({ 
                                        id: item.id, 
                                        name: item.description ? item.description.substring(0, 50) + "..." : item.title || `Item ${item.id}` 
                                    }))}
                                    value={newDecision.relatedAgendaItem}
                                    onChange={val => setNewDecision({...newDecision, relatedAgendaItem: val})}
                                    placeholder="--select--"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Resolution Status</label>
                                 <div className="flex items-center gap-2">
                                     <div className="flex-1 font-medium">
                                        <SearchableSelect
                                            options={resolutionStatuses.map(rs => ({ id: rs.id, name: rs.name }))}
                                            value={newDecision.resolutionStatus}
                                            onChange={val => setNewDecision({...newDecision, resolutionStatus: val})}
                                            placeholder="--select--"
                                            className="w-full"
                                        />
                                    </div>
                                    {hasPermission(PERMISSIONS.RESOLUTION_STATUS.CREATE) && (
                                    <button 
                                        onClick={() => newDecision.resolutionStatus ? handleEditMaster("Resolution Status", newDecision.resolutionStatus) : setShowResolutionStatusModal(true)}
                                      className={`p-2 border rounded transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                                        title={newDecision.resolutionStatus ? "Edit Status" : "Add Status"}
                                    >
                                        {newDecision.resolutionStatus ? <Pencil size={16}/> : <Star size={16}/>}
                                    </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Images Input */}
                            <div className="space-y-1">
                                <label className={`text-sm mb-1 block ${theme === 'emerald' || theme === 'purple' ? 'text-black font-medium' : 'text-gray-300'}`}>Images</label>
                                <div className="flex flex-col gap-2">
                                     <div className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative overflow-hidden min-h-[160px] ${theme === 'emerald' ? 'border-gray-300 bg-gray-50' : theme === 'purple' ? 'border-gray-500 bg-gray-50' : 'border-gray-700 bg-gray-800/50'}`}>
                                        {newDecision.imageFile ? (
                                            <>
                                                <img 
                                                    src={URL.createObjectURL(newDecision.imageFile)} 
                                                    alt="Preview" 
                                                    className="absolute inset-0 w-full h-full object-contain p-2"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                     <label className="p-1.5 bg-gray-900/80 rounded cursor-pointer hover:bg-black text-white">
                                                        <Pencil size={14} />
                                                        <input type="file" className="hidden" accept="image/*" onChange={e => setNewDecision({...newDecision, imageFile: e.target.files[0]})} />
                                                     </label>
                                                     <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setNewDecision({...newDecision, imageFile: null});
                                                        }}
                                                        className="p-1.5 bg-red-900/80 rounded hover:bg-red-800 text-white"
                                                     >
                                                        <Trash2 size={14} />
                                                     </button>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                                                    {newDecision.imageFile.name}
                                                </div>
                                            </>
                                        ) : newDecision.images ? (
                                            <>
                                                <img 
                                                    src={`http://localhost:5000/uploads/agenda_items/${newDecision.images}`} 
                                                    alt="Existing" 
                                                    className="absolute inset-0 w-full h-full object-contain p-2"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                     <label className="p-1.5 bg-gray-900/80 rounded cursor-pointer hover:bg-black text-white">
                                                        <Pencil size={14} />
                                                        <input type="file" className="hidden" accept="image/*" onChange={e => setNewDecision({...newDecision, imageFile: e.target.files[0]})} />
                                                     </label>
                                                     <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setNewDecision({...newDecision, images: null});
                                                        }}
                                                        className="p-1.5 bg-red-900/80 rounded hover:bg-red-800 text-white"
                                                     >
                                                        <Trash2 size={14} />
                                                     </button>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                                                    {newDecision.images}
                                                </div>
                                            </>
                                        ) : (
                                            <label className={`cursor-pointer flex flex-col items-center gap-2 transition-colors p-4 text-center w-full h-full justify-center ${theme === 'emerald' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}>
                                                <Plus size={32} />
                                                <span className="text-xs">Click to Upload Image</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => setNewDecision({...newDecision, imageFile: e.target.files[0]})} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                             {/* Attachments Input */}
                             <div>
                                <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' :theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Attachments</label>
                                <div className="flex items-center gap-2">
                                     <label className={`flex items-center gap-2 px-4 py-2 border rounded cursor-pointer transition ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : theme === 'purple' ? 'bg-[#6448AE] hover:bg-[#6E55B6] text-white border-transparent' : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'}`}>
                                        <Pencil size={14} /> {newDecision.attachmentFile || newDecision.attachments ? "Change File" : "Select File"}
                                        <input type="file" className="hidden" onChange={e => setNewDecision({...newDecision, attachmentFile: e.target.files[0]})} />
                                     </label>
                                     {newDecision.attachmentFile ? (
                                         <div className={`flex items-center gap-2 border px-3 py-2 rounded ${theme === 'emerald' ? 'bg-blue-50 border-blue-200' : 'bg-gray-800 border-gray-700'}`}>
                                             <div className="flex flex-col">
                                                 <span className={`text-sm font-medium truncate max-w-[200px] ${theme === 'emerald' ? 'text-blue-700' : 'text-blue-300'}`}>{newDecision.attachmentFile.name}</span>
                                                 <span className="text-gray-500 text-xs">{(newDecision.attachmentFile.size / 1024).toFixed(1)} KB • {newDecision.attachmentFile.name.split('.').pop().toUpperCase()}</span>
                                             </div>
                                             <button onClick={() => setNewDecision({...newDecision, attachmentFile: null})} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={16}/></button>
                                         </div>
                                     ) : newDecision.attachments ? (
                                         <div className={`flex items-center gap-2 border px-3 py-2 rounded ${theme === 'emerald' ? 'bg-green-50 border-green-200' : 'bg-gray-800 border-gray-700'}`}>
                                             <div className="flex flex-col">
                                                 <span className={`text-sm font-medium truncate max-w-[200px] ${theme === 'emerald' ? 'text-green-700' : 'text-green-300'}`}>{newDecision.attachments}</span>
                                                 <span className="text-gray-500 text-xs">Existing File</span>
                                             </div>
                                             <button onClick={() => setNewDecision({...newDecision, attachments: null})} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={16}/></button>
                                         </div>
                                     ) : null}
                                </div>
                            </div>


                        </div>
            </AddModal>
        )}

        {/* DECISION RESOLUTION STATUS MODAL */}
        {showResolutionStatusModal && (
            <AddModal
                isOpen={showResolutionStatusModal}
                onClose={() => setShowResolutionStatusModal(false)}
                onSave={handleSaveResolutionStatus}
                title={newResolutionStatus.id ? "Edit Resolution Status" : "New Resolution Status"}
                width="700px"
            >
                <div className="space-y-4">
                    <InputField
                        label="Name"
                        value={newResolutionStatus.name}
                        onChange={e => setNewResolutionStatus({...newResolutionStatus, name: e.target.value})}
                        required
                        direction="up"
                    />
                </div>
            </AddModal>
        )}



      

        {/* MEETING TYPE MODAL */}
        <AddModal
            title={newMeetingType.id ? "Edit Meeting Type" : "Add Meeting Type"}
            isOpen={meetingTypeModalOpen}
            onClose={() => setMeetingTypeModalOpen(false)}
            onSave={handleSaveMeetingType}
            width="700px"
        >
             <div className="space-y-4">
               <div>
                  <InputField
                    label="Meeting Type Name"
                    value={newMeetingType.name}
                    onChange={(e) => setNewMeetingType({ ...newMeetingType, name: e.target.value })}
                    placeholder="Enter Meeting Type Name"
                  />
               </div>
            </div>
        </AddModal>

      {/* DEPARTMENT MODAL */}
      {departmentModalOpen && (
        <AddModal
             title={newDepartment.id ? "Edit Department" : "Add Department"}
             isOpen={departmentModalOpen}
             onClose={() => setDepartmentModalOpen(false)}
             onSave={handleSaveDepartment}
             width="700px"
        >
            <div className="space-y-4">
              <div>
                <InputField
                  label="Department Name *"
                  type="text"
                  value={newDepartment.department}
                  onChange={(e) => setNewDepartment({ ...newDepartment, department: e.target.value })}
                />
              </div>

             <div>
  <label
    className={`text-sm mb-1 block ${
      theme === 'emerald'
        ? 'text-gray-700'
        : theme === 'purple'
        ? 'text-dark font-medium'
        : 'text-gray-300'
    }`}
  >
    Description
  </label>

  <textarea
    value={newDepartment.description}
    onChange={(e) =>
      setNewDepartment({ ...newDepartment, description: e.target.value })
    }
    className="w-full rounded px-3 py-2 mt-1 outline-none transition-colors
               bg-white border border-gray-300 text-gray-800 text-purple-800
               focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
  />
</div>


              <div>
                <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' :  theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Parent Department</label>
                <SearchableSelect
                  options={departments.map(d => ({ id: d.id, name: d.name }))}
                  value={newDepartment.parentDepartmentId}
                  onChange={(val) => setNewDepartment({ ...newDepartment, parentDepartmentId: val })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
            </div>
        </AddModal>
      )}

      {/* LOCATION MODAL */}
      {locationModalOpen && (
        <AddModal
             title={newLocation.id ? "Edit Location" : "Add Location"}
             isOpen={locationModalOpen}
             onClose={() => setLocationModalOpen(false)}
             onSave={handleSaveLocation}
             width="700px"
        >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField
                  label="Location Name *"
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                />
              </div>

              <div>
                 <div className="space-y-1">
                    <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' :  theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>Country *</label>
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
                             onClick={() => newLocation.countryId ? handleEditMaster("Country", newLocation.countryId) : setAddCountryModalOpen(true)}
                             className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                             title={newLocation.countryId ? "Edit Country" : "Add Country"}
                         >
                             {newLocation.countryId ? <Pencil size={16} /> : <Star size={16} />}
                         </button>
                          )}
                     </div>
                </div>
              </div>

              <div>
                <div className="space-y-1">
                    <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' :  theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>State</label>
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
                             onClick={() => newLocation.stateId ? handleEditMaster("State", newLocation.stateId) : setAddStateModalOpen(true)}
                             className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                             title={newLocation.stateId ? "Edit State" : "Add State"}
                         >
                             {newLocation.stateId ? <Pencil size={16} /> : <Star size={16} />}
                         </button>
                          )}
                     </div>
                </div>
              </div>

              <div>
                 <div className="space-y-1">
                    <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' :  theme === 'purple' ? 'text-dark font-medium' : 'text-gray-300'}`}>City</label>
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
                             onClick={() => newLocation.cityId ? handleEditMaster("City", newLocation.cityId) : setAddCityModalOpen(true)}
                             className={`p-2 border rounded flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                             title={newLocation.cityId ? "Edit City" : "Add City"}
                         >
                             {newLocation.cityId ? <Pencil size={16} /> : <Star size={16} />}
                         </button>
                          )}
                     </div>
                </div>
              </div>

              <div>
                <InputField
                  label="Address"
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                />
              </div>

              <div>
                <InputField
                  label="Latitude"
                  type="text"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                />
              </div>

              <div>
                <InputField
                  label="Longitude"
                  type="text"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                />
              </div>
            </div>
        </AddModal>
      )}

      {/* ATTENDEE MODAL */}
      {showAttendeeModal && (
        <AddModal
            isOpen={showAttendeeModal}
            onClose={() => {
              setShowAttendeeModal(false);
              setEditIndex(null);
              setAttendeeForm({ attendee: "", attendeeType: "", attendanceStatus: "" });
            }}
            onSave={saveAttendee}
            title={editIndex !== null ? "Edit Attendee" : "Add Attendee"}
            width="600px"
        >
            <div className="space-y-4">
            {/* EMPLOYEE DROPDOWN */}
             <div>
              <label className={`block text-sm font-medium-medium mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-black' : 'text-gray-300'}`}>Attendee *</label>
              <SearchableSelect
                options={employees.map(e => ({ id: e.id, name: e.name }))}
                value={attendeeForm.attendee}
                onChange={(val) => setAttendeeForm({ ...attendeeForm, attendee: val })}
                placeholder="--select--"
                className="w-full font-medium"
              />
            </div>

            {/* TYPE DROPDOWN */}
             <div>
              <label className={`block text-sm font-medium-medium mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-black' : 'text-gray-300'}`}>Attendee Type *</label>
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
                      onClick={() => attendeeForm.attendeeType ? handleEditMaster("Attendee Type", attendeeForm.attendeeType) : handleCreateNew("Attendee Type")}
                      className={`p-2 border rounded transition-colors flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                      title={attendeeForm.attendeeType ? "Edit Attendee Type" : "Add Attendee Type"}
                  >
                      {attendeeForm.attendeeType ? <Pencil size={16} /> : <Star size={16} />}
                  </button>
                   )}
              </div>
            </div>

            {/* STATUS DROPDOWN */}
             <div>
              <label className={`block text-sm font-medium-medium mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-black' : 'text-gray-300'}`}>Attendance Status *</label>
               <div className="flex gap-2 font-medium">
                  <SearchableSelect
                    options={attendanceStatuses.map(s => ({ id: s.id, name: s.name }))}
                    value={attendeeForm.attendanceStatus}
                    onChange={(val) => setAttendeeForm({ ...attendeeForm, attendanceStatus: val })}
                    placeholder="--select--"
                    className="w-full"
                  />
                   {hasPermission(PERMISSIONS.ATTENDANCE_STATUS.CREATE) && (
                   <button
                      onClick={() => attendeeForm.attendanceStatus ? handleEditMaster("Attendance Status", attendeeForm.attendanceStatus) : handleCreateNew("Attendance Status")}
                      className={`p-2 border rounded transition-colors flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'}`}
                      title={attendeeForm.attendanceStatus ? "Edit Status" : "Add Status"}
                  >
                      {attendeeForm.attendanceStatus ? <Pencil size={16} /> : <Star size={16} />}
                  </button>
                   )}
              </div>
            </div>
            </div>
        </AddModal>
      )}

      {/* QUICK ADD ATTENDEE MODALS */}
      <AddModal
        title={newAttendeeType.id ? "Edit Attendee Type" : "Add Attendee Type"}
        isOpen={attendeeTypeModalOpen}
        onClose={() => setAttendeeTypeModalOpen(false)}
        onSave={handleSaveAttendeeType}
        width="700px"
      >
        <div>
           <InputField
            label="Type Name"
            placeholder="Enter Attendee Type Name"
            value={newAttendeeType.name}
            onChange={(e) => setNewAttendeeType({ ...newAttendeeType, name: e.target.value })}
          />
        </div>
      </AddModal>

      <AddModal
        title={newAttendanceStatus.id ? "Edit Attendance Status" : "Add Attendance Status"}
        isOpen={attendanceStatusModalOpen}
        onClose={() => setAttendanceStatusModalOpen(false)}
        onSave={handleSaveAttendanceStatus}
        width="700px"
      >
        <div>
           <InputField
            label="Status Name"
            placeholder="Enter Attendance Status Name"
            value={newAttendanceStatus.name}
            onChange={(e) => setNewAttendanceStatus({ ...newAttendanceStatus, name: e.target.value })}
          />
        </div>
      </AddModal>

       {/* NESTED ADD COUNTRY MODAL */}
        <AddModal
             title={newCountry.id ? "Edit Country" : "Add Country"}
             isOpen={addCountryModalOpen}
             onClose={() => setAddCountryModalOpen(false)}
             onSave={handleSaveCountry}
             width="700px"
         >
              <div className="space-y-4">
                <div>
                   <InputField
                     label="Country Name"
                     value={newCountry.name}
                     onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                     placeholder="Enter Country Name"
                   />
                </div>
             </div>
         </AddModal>

      {/* NESTED ADD STATE MODAL */}
       {addStateModalOpen && (
         <AddModal
              title={newState.id ? "Edit State" : "Add State"}
              isOpen={addStateModalOpen}
             onClose={() => setAddStateModalOpen(false)}
             onSave={handleSaveState}
             width="700px"
        >
            <div className="space-y-4">
              <div>
                <InputField
                  label="State Name *"
                  type="text"
                  value={newState.name}
                  onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                />
              </div>
              <div>
                <label className={`text-sm mb-1 block text-dark font-medium ${theme === 'emerald' ? 'text-gray-700' : theme === 'purple' ? '' : 'text-gray-300'}`}>Country *</label>
                <SearchableSelect
                  options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                  value={newState.countryId}
                  onChange={(val) => setNewState({ ...newState, countryId: val })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
            </div>
        </AddModal>
      )}

      {/* NESTED ADD CITY MODAL */}
      {addCityModalOpen && (
        <AddModal
             title="Add City"
             isOpen={addCityModalOpen}
             onClose={() => setAddCityModalOpen(false)}
             onSave={handleSaveCity}
             width="700px"
        >
            <div className="space-y-4">
              <div>
                <InputField
                  label="City Name *"
                  type="text"
                  value={newCity.name}
                  onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                />
              </div>
              <div>
                <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' : 'text-gray-300'}`}>Country *</label>
                <SearchableSelect
                  options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                  value={newCity.countryId}
                  onChange={(val) => setNewCity({ ...newCity, countryId: val, stateId: "" })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
              <div>
                <label className={`text-sm mb-1 block ${theme === 'emerald' ? 'text-gray-700' : 'text-gray-300'}`}>State *</label>
                <SearchableSelect
                  options={modalStates.map(s => ({ id: s.id, name: s.name }))}
                  value={newCity.stateId}
                  onChange={(val) => setNewCity({ ...newCity, stateId: val })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
            </div>
        </AddModal>
      )}

          </div>
        </ContentCard>
      </div>
    </PageLayout>
  );
};








export default EditMeeting;
