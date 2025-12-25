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
} from "../../services/allAPI";
import SearchableSelect from "../../components/SearchableSelect";
import toast from "react-hot-toast";


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

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm text-white">{label}</label>
    {children}
  </div>
);

const SelectField = ({ label, value, options, onChange, disabled }) => {
  const normalize = (v) => (v ? String(v) : "");
  const selectedOption = options.find(o =>
    normalize(o.id) === normalize(value) ||
    normalize(o.name).toLowerCase() === normalize(value).toLowerCase()
  );
  const activeValue = selectedOption ? selectedOption.id : (value || "");

  return (
    <div className="space-y-1">
      <label className="text-sm text-white">{label}</label>
      <select
        value={activeValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`input-dark bg-gray-700 border border-gray-600 rounded p-2 w-full text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="">--select--</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
};

/* SEARCHABLE DROPDOWN COMPONENT */
const SearchableDropdown = ({ label, value, options, onChange, placeholder = "--select--", disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = React.useRef(null);
  
    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
  
    // Find selected option label
    const selectedOption = options.find(o => String(o.id) === String(value));
    
    // Filter options
    const filteredOptions = options.filter(o => 
        o.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
        <div className="space-y-1 relative" ref={wrapperRef}>
            {label && <label className="text-sm text-white">{label}</label>}
            <div 
                className={`w-full bg-gray-800 border ${isOpen ? 'border-blue-400' : 'border-gray-600'} text-white rounded px-3 py-2 cursor-pointer flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? "text-white" : "text-gray-400"}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <span className="text-gray-400">▼</span>
            </div>
            
            {isOpen && (
                <div className="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <div className="p-2 sticky top-0 bg-gray-800 border-b border-gray-700">
                        <input 
                            autoFocus
                            className="w-full bg-gray-900 border border-gray-600 text-white rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => (
                            <div 
                                key={opt.id}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-700 ${String(value) === String(opt.id) ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}
                                onClick={() => {
                                    onChange(opt.id);
                                    setIsOpen(false);
                                    setSearchTerm("");
                                }}
                            >
                                {opt.name}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};


const EditMeeting = () => {
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
    imageFile: null,      // File object
    attachmentFile: null  // File object
  });

  /* AGENDA ITEM TYPE MODAL STATE */
  const [showAgendaTypeModal, setShowAgendaTypeModal] = useState(false);
  const [newAgendaType, setNewAgendaType] = useState({ name: "", description: "" });

  /* DECISIONS STATE */
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showResolutionStatusModal, setShowResolutionStatusModal] = useState(false);
  const [resolutionStatuses, setResolutionStatuses] = useState([]);
  const [newResolutionStatus, setNewResolutionStatus] = useState({ name: "", description: "" });
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

  /* DROPDOWN DATA */
  const [meetingTypes, setMeetingTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  /* QUICK CREATE MODAL STATES */
  const [meetingTypeModalOpen, setMeetingTypeModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  
  /* NESTED LOCATION MODAL STATES */
  const [addCountryModalOpen, setAddCountryModalOpen] = useState(false);
  const [addStateModalOpen, setAddStateModalOpen] = useState(false);
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);

  /* FORM DATA FOR QUICK CREATE */
  const [newMeetingType, setNewMeetingType] = useState("");
  const [newDepartment, setNewDepartment] = useState({ department: "", description: "", parentDepartmentId: "" });
  const [newLocation, setNewLocation] = useState({
    name: "", countryId: "", stateId: "", cityId: "", address: "", latitude: "", longitude: ""
  });
  
  /* NESTED LOCATION FORM DATA */
  const [newCountryName, setNewCountryName] = useState("");
  const [newState, setNewState] = useState({ name: "", countryId: "" });
  const [newCity, setNewCity] = useState({ name: "", countryId: "", stateId: "" });

  /* DROPDOWN DATA FOR LOCATION MODALS */
  const [modalCountries, setModalCountries] = useState([]);
  const [locationModalStates, setLocationModalStates] = useState([]);
  const [locationModalCities, setLocationModalCities] = useState([]);
  const [modalStates, setModalStates] = useState([]); // For City Modal

  /* SEARCH STATES */
  const [parentDeptSearch, setParentDeptSearch] = useState("");

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
      setMeetingTypes(normalizeSimple(res?.data?.records || []));
    } catch (err) { console.error(err); }
  };

  const loadDepartments = async () => {
    try {
      const res = await getDepartmentsApi(1, 5000);
      setDepartments((res?.data?.records || []).map(r => ({ id: r.id, name: r.department })));
    } catch (err) { console.error(err); }
  };

  const loadLocations = async () => {
     try {
      const res = await getLocationsApi(1, 5000);
      setLocations((res?.data?.records || []).map(l => ({
        id: String(l.Id),
        name: `${l.Name} (${l.CityName ?? ""})`
      })));
     } catch (err) { console.error(err); }
  };
  
  const loadAgendaItemTypes = async () => {
    try {
        const res = await getAgendaItemTypesApi(1, 1000);
        setAgendaItemTypes(normalizeSimple(res?.data?.records || []));
    } catch (err) { console.error(err); }
  };

  const loadResolutionStatuses = async () => {
    try {
        const res = await getResolutionStatusesApi(1, 1000);
        setResolutionStatuses(normalizeSimple(res?.data?.records || []));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadEmployees();
    loadMeetingTypes();
    loadDepartments();
    loadLocations();
    loadAgendaItemTypes();
    loadResolutionStatuses();
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
    else if (type === "Organizer" || type === "Reporter") {
      navigate("/app/hr/newemployee", { state: { from: location.pathname } });
    }
  };

  const handleSaveMeetingType = async () => {
    if (!newMeetingType.trim()) return toast.error("Name is required");
    try {
      await addMeetingTypeApi({ name: newMeetingType, userId: currentUserId });
      toast.success("Meeting Type Added");
      setNewMeetingType("");
      setMeetingTypeModalOpen(false);
      loadMeetingTypes();
    } catch (error) { toast.error("Failed to add Meeting Type"); }
  };

  const handleSaveDepartment = async () => {
    if (!newDepartment.department.trim()) return toast.error("Department Name is required");
    try {
      await addDepartmentApi({ ...newDepartment, userId: currentUserId });
      toast.success("Department Added");
      setNewDepartment({ department: "", description: "", parentDepartmentId: "" });
      setDepartmentModalOpen(false);
      loadDepartments();
    } catch (error) { toast.error("Failed to add Department"); }
  };

   const handleSaveLocation = async () => {
    if (!newLocation.name.trim()) return toast.error("Location Name is required");
    try {
      await addLocationApi({ ...newLocation, userId: currentUserId });
      toast.success("Location Added");
      setNewLocation({ name: "", countryId: "", stateId: "", cityId: "", address: "", latitude: "", longitude: "" });
      setLocationModalOpen(false);
      loadLocations();
    } catch (error) { toast.error("Failed to add Location"); }
  };

  const handleSaveCountry = async () => {
    if (!newCountryName.trim()) return toast.error("Country Name is required");
    try {
      await addCountryApi({ name: newCountryName, userId: currentUserId });
      toast.success("Country Added");
      setNewCountryName("");
      setAddCountryModalOpen(false);
      const res = await getCountriesApi(1, 5000);
      setModalCountries(res?.data?.records || []);
    } catch (error) { toast.error("Failed to add Country"); }
  };

  const handleSaveState = async () => {
    if (!newState.name.trim() || !newState.countryId) return toast.error("State Name and Country are required");
    try {
      await addStateApi({ ...newState, userId: currentUserId });
      toast.success("State Added");
      setNewState({ name: "", countryId: "" });
      setAddStateModalOpen(false);
      if (newLocation.countryId) {
        const res = await getStatesByCountryApi(newLocation.countryId);
        setLocationModalStates(res?.data || []);
      }
    } catch (error) { toast.error("Failed to add State"); }
  };

  const handleSaveCity = async () => {
    if (!newCity.name.trim() || !newCity.stateId) return toast.error("City Name and State are required");
    try {
      await addCityApi({ ...newCity, userId: currentUserId });
      toast.success("City Added");
      setNewCity({ name: "", countryId: "", stateId: "", cityId: "" });
      setAddCityModalOpen(false);
    } catch (error) { toast.error("Failed to add City"); }
  };


  /* LOAD DATA */
  useEffect(() => {
    getMeetingByIdApi(id).then(res => {
      console.log("🔵 RAW getMeetingByIdApi RESPONSE:", res?.data);

      if (res?.data?.meeting) {
        console.log("🟢 MEETING OBJECT FROM API:", res.data.meeting);
        console.log("🟢 ATTENDEES FROM API:", res.data.attendees);

        setMeeting({
          ...res.data.meeting,
          attendees: res.data.attendees || []
        });
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
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;

    try {
      await deleteMeetingApi(id, { userId: 1 }); // soft delete
      toast.success("Meeting deleted successfully");
      navigate("/app/meeting/meetings");
    } catch (err) {
      console.error("DELETE MEETING ERROR:", err);
      toast.error("Failed to delete meeting");
    }
  };

  const handleRestore = async () => {
    if (!window.confirm("Are you sure you want to restore this meeting?")) return;
    try {
      await restoreMeetingApi(id, { userId: 1 });
      toast.success("Meeting restored successfully");
      navigate("/app/meeting/meetings");
    } catch (err) {
      console.error("RESTORE ERROR:", err);
      toast.error("Failed to restore meeting");
    }
  };

  const handleSave = async () => {
    try {
      if (!meeting.meetingName || !meeting.startDate || !meeting.meetingType) {
        toast.error("Please fill all required fields");
        return;
      }


      const payload = {
        ...meeting,
        meetingType: meeting.meetingType || null,
        department: meeting.department || null,
        location: meeting.location || null,
        organizedBy: meeting.organizedBy || null,
        reporter: meeting.reporter || null,
      };

      await updateMeetingApi(id, payload);
      toast.success("Meeting updated successfully");
      navigate("/app/meeting/meetings");

    } catch (err) {
      console.error("UPDATE MEETING ERROR:", err);
      toast.error("Failed to update meeting");
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
      if(!window.confirm("Are you sure you want to delete this agenda item?")) return;

      try {
          const res = await deleteAgendaItemApi(itemId);
          if (res.status === 200) {
              toast.success("Agenda Item deleted");
              // Refresh List
              const aiRes = await getAgendaItemsApi(id);
              if (aiRes.data.records) setAgendaItems(aiRes.data.records);
          } else {
              toast.error("Failed to delete item");
          }
      } catch (error) {
          console.error("DELETE AGENDA ITEM ERROR:", error);
          toast.error("Failed to delete item");
      }
  };

  /* AGENDA ITEM TYPE HANDLERS */
  const handleSaveAgendaType = async () => {
    if (!newAgendaType.name) {
        toast.error("Name is required");
        return;
    }
    try {
        const res = await addAgendaItemTypeApi(newAgendaType);
        if (res.status === 201 || res.status === 200) {
           toast.success("Agenda Item Type Added");
           setShowAgendaTypeModal(false);
           setNewAgendaType({ name: "", description: "" });
           
           // Refresh dropdown
           const atRes = await getAgendaItemTypesApi(1, 1000);
           const atList = atRes.data.records || atRes.data || [];
           setAgendaItemTypes(atList.map(item => ({
               id: item.Id || item.id,
               name: item.Name || item.name
           })));

           // Auto-select the new type (optional but nice)
           // We'd need to know the ID of the new item. If backend returns it, great.
           // Assuming common pattern where res.data.id or similar is returned.
           if (res.data && (res.data.id || res.data.Id)) {
               setNewAgendaItem(prev => ({ ...prev, itemType: res.data.id || res.data.Id }));
           }

        } else {
            toast.error("Failed to add Agenda Item Type");
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
      if(!window.confirm("Are you sure you want to delete this decision?")) return;

      try {
          const res = await deleteAgendaDecisionApi(decisionId);
          if (res.status === 200) {
              toast.success("Decision deleted");
              const dRes = await getAgendaDecisionsApi(id);
              if (dRes.data.records) setAgendaDecisions(dRes.data.records);
          } else {
              toast.error("Failed to delete decision");
          }
      } catch (error) {
          console.error("DELETE DECISION ERROR:", error);
          toast.error("Failed to delete decision");
      }
  };

  const handleSaveResolutionStatus = async () => {
      if(!newResolutionStatus.name) {
          toast.error("Name required");
          return;
      }
      try {
          const res = await addResolutionStatusApi(newResolutionStatus);
          if (res.status === 201 || res.status === 200) {
              toast.success("Status Added");
              setShowResolutionStatusModal(false);
              setNewResolutionStatus({ name: "", description: "" });
              
              // Refresh dropdown
              const rsRes = await getResolutionStatusesApi(1, 100);
              const rsList = rsRes.data.records || rsRes.data || [];
              setResolutionStatuses(rsList.map(item => ({
                id: item.Id || item.id,
                name: item.Name || item.name
              })));
          } else {
              toast.error("Failed to add status");
          }
      } catch (err) {
          console.error(err);
          toast.error("Failed to add status");
      }
  };




  return (
    <PageLayout>
      <div className="p-5 text-white bg-gradient-to-b from-gray-900 to-gray-700">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/app/meeting/meetings")}
                className="p-2 bg-gray-800 rounded border border-gray-700"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-xl font-semibold">{isInactive ? "Restore Meeting" : "Edit Meeting"}</h2>
            </div>
            
             <div className="flex items-center gap-3">
               {isInactive ? (
                 <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-700 border border-green-600 px-4 py-2 rounded text-sm text-white hover:bg-green-600"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
               ) : (
                 <>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300 hover:bg-gray-700"
                    >
                      <Save size={16} /> Save
                    </button>
    
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 bg-red-800 border border-red-600 px-4 py-2 rounded text-sm text-red-200 hover:bg-red-700"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                 </>
               )}
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-6 border-b border-gray-700 mb-5">
          <Tab
            label="Meeting"
            active={activeTab === "meeting"}
            onClick={() => navigate(`/app/meeting/meetings/edit/${id}`)}
          />
          <Tab
            label="Agenda Items"
            active={activeTab === "agenda"}
            onClick={() =>
              navigate(`/app/meeting/meetings/edit/${id}/agenda`)
            }
          />
          <Tab
            label="Agenda Decisions"
            active={activeTab === "decisions"}
            onClick={() =>
              navigate(`/app/meeting/meetings/edit/${id}/decisions`)
            }
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
            className="bg-gradient-to-br from-[#4b3b55] to-[#2e2337] border border-[#5a4a63] rounded-lg p-6"
          >


            {/* FORM GRID */}
            <div className="grid grid-cols-2 gap-6">

              {/* LEFT */}
              <div className="space-y-4">
                <Field label="Meeting Name *">
                  <input
                    value={meeting.meetingName}
                    onChange={(e) => updateField("meetingName", e.target.value)}
                    disabled={isInactive}
                    className={`input-dark ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </Field>

                <Field label="Start Date *">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={meeting.startDate?.split("T")[0] || ""}
                      onChange={(e) =>
                        updateField("startDate", e.target.value + "T00:00:00")
                      }
                      className="input-dark"
                    />
                    <input type="time" className="input-dark w-28" />
                  </div>
                </Field>

                <div>
                   <label className="text-sm text-white">Department</label>
                   <div className="flex gap-2">
                      <SearchableSelect
                        options={departments.map(d => ({ id: d.id, name: d.name }))}
                        value={meeting.department}
                        onChange={(v) => updateField("department", v)}
                        disabled={isInactive}
                        placeholder="--select--"
                        className="w-full"
                      />
                      {!isInactive && (
                          <button
                            onClick={() => handleCreateNew("Department")}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add Department"
                        >
                            <Star size={16} />
                        </button>
                      )}
                   </div>
                </div>

                <div>
                   <label className="text-sm text-white">Organized By</label>
                   <div className="flex gap-2">
                      <SearchableSelect
                        options={employees.map(e => ({ id: e.id, name: e.name }))}
                        value={meeting.organizedBy}
                        onChange={(v) => updateField("organizedBy", v)}
                        disabled={isInactive}
                        placeholder="--select--"
                        className="w-full"
                      />
                      {!isInactive && (
                          <button
                            onClick={() => handleCreateNew("Organizer")}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add Organizer"
                        >
                            <Star size={16} />
                        </button>
                      )}
                   </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                <div>
                   <label className="text-sm text-white">Meeting Type *</label>
                   <div className="flex gap-2">
                      <SearchableSelect
                        options={meetingTypes.map(t => ({ id: t.id, name: t.name }))}
                        value={meeting.meetingType}
                        onChange={(v) => updateField("meetingType", v)}
                        disabled={isInactive}
                        placeholder="--select--"
                        className="w-full"
                      />
                      {!isInactive && (
                          <button
                            onClick={() => handleCreateNew("Meeting Type")}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add Meeting Type"
                        >
                            <Star size={16} />
                        </button>
                      )}
                   </div>
                </div>

                <Field label="End Date *">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={meeting.endDate?.split("T")[0] || ""}
                      onChange={(e) =>
                        updateField("endDate", e.target.value + "T00:00:00")
                      }
                      className="input-dark"
                    />
                    <input type="time" className="input-dark w-28" />
                  </div>
                </Field>

                <div>
                   <label className="text-sm text-white">Location</label>
                   <div className="flex gap-2">
                      <SearchableSelect
                        options={locations.map(l => ({ id: l.id, name: l.name }))}
                        value={meeting.location}
                        onChange={(v) => updateField("location", v)}
                        disabled={isInactive}
                        placeholder="--select--"
                        className="w-full"
                      />
                      {!isInactive && (
                          <button
                            onClick={() => handleCreateNew("Location")}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add Location"
                        >
                            <Star size={16} />
                        </button>
                      )}
                   </div>
                </div>

                <div>
                   <label className="text-sm text-white">Reporter</label>
                   <div className="flex gap-2">
                      <SearchableSelect
                        options={employees.map(e => ({ id: e.id, name: e.name }))}
                        value={meeting.reporter}
                        onChange={(v) => updateField("reporter", v)}
                        disabled={isInactive}
                        placeholder="--select--"
                        className="w-full"
                      />
                      {!isInactive && (
                          <button
                            onClick={() => handleCreateNew("Reporter")}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add Reporter"
                        >
                            <Star size={16} />
                        </button>
                      )}
                   </div>
                </div>
              </div>
            </div>

            {/* ATTENDEES */}
            <div className="mt-8">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-white">Attendees</label>
                {!isInactive && (
                  <button
                    onClick={() => setShowAttendeeModal(true)}
                    className="flex items-center gap-1 bg-[#5d8f65] px-3 py-1.5 rounded text-sm"
                  >
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                <table className="w-full text-sm border border-[#5a4a63]">
                  <thead className="bg-[#3b2f44] text-white">
                    <tr>
                      <th className="p-2">Attendee</th>
                      <th className="p-2">Attendee Type</th>
                      <th className="p-2">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.attendees.map((a, i) => (
                      <tr key={i} className="border-t border-[#5a4a63]">
                        <td className="p-2 text-yellow-300">{a.attendeeName || a.attendee}</td>
                        <td className="p-2">{a.attendeeTypeName || a.attendeeType}</td>
                        <td className="p-2">{a.attendanceStatusName || a.attendanceStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            className="bg-gray-900 border border-gray-700 rounded-lg p-5"
          >

            <div className="flex justify-between mb-4 items-center">
              <h3 className="text-lg font-semibold text-white">Agenda Items</h3>
              <button 
                onClick={() => setShowAgendaModal(true)}
                className="flex items-center gap-1 bg-gray-800 border border-gray-600 px-3 py-1.5 rounded text-sm text-blue-300 hover:bg-gray-700"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Item Type</th>
                  <th className="px-4 py-2 text-left text-gray-400 font-normal">Requested By</th>
                <th className="px-4 py-2 text-left text-gray-400 font-normal">Seq</th>
                <th className="px-4 py-2 text-left text-gray-400 font-normal">Actions</th>
              </tr>
              </thead>
              <tbody>
                {agendaItems.map(a => (
                  <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3">{a.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{a.title}</td>
                    <td className="px-4 py-3">{a.description}</td>
                    <td className="px-4 py-3">{a.itemTypeName}</td>
                    <td className="px-4 py-3">{a.requestedByName}</td>
                    <td className="px-4 py-3">{a.sequenceNo}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                        <button 
                            onClick={() => handleEditAgendaItem(a)}
                            className="p-1.5 bg-gray-700/50 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                            title="Edit"
                        >
                            <Pencil size={15} />
                        </button>
                        <button 
                            onClick={() => handleDeleteAgendaItem(a.id)}
                            className="p-1.5 bg-gray-700/50 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={15} />
                        </button>
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
            className="bg-gray-900 border border-gray-700 rounded-lg p-5"
          >
            <div className="flex justify-between mb-4 items-center">
              <h3 className="text-lg font-semibold text-white">Agenda Decisions</h3>
              <button 
                onClick={() => setShowDecisionModal(true)}
                className="flex items-center gap-1 bg-gray-800 border border-gray-600 px-3 py-1.5 rounded text-sm text-blue-300 hover:bg-gray-700"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-2 text-left text-gray-400 font-normal">Resol. Status</th>
                <th className="px-4 py-2 text-left text-gray-400 font-normal">Assigned To</th>
                <th className="px-4 py-2 text-left text-gray-400 font-normal">Action</th>
              </tr>
              </thead>
              <tbody>
                {agendaDecisions.map(d => (
                   <tr key={d.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                     <td className="px-4 py-3">{d.id}</td>
                     <td className="px-4 py-3 text-white">{d.description}</td>
                     <td className="px-4 py-3">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "-"}</td>
                     <td className="px-4 py-3">{d.resolutionStatusName}</td>
                     <td className="px-4 py-3">{d.assignedToName}</td>
                     <td className="px-4 py-3 flex items-center gap-2">
                        <button 
                            onClick={() => handleEditDecision(d)}
                            className="p-1.5 bg-gray-700/50 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                            title="Edit"
                        >
                            <Pencil size={15} />
                        </button>
                        <button 
                            onClick={() => handleDeleteDecision(d.id)}
                            className="p-1.5 bg-gray-700/50 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={15} />
                        </button>
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
        </AnimatePresence>

        {/* NEW AGENDA ITEM MODAL */}
        {showAgendaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
                        <h3 className="text-lg font-semibold text-white">{newAgendaItem.id ? "Edit Agenda Item" : "New Agenda Item"}</h3>
                        <button onClick={() => setShowAgendaModal(false)} className="text-gray-400 hover:text-white">
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* LEFT COLUMN: Inputs */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-white">Title <span className="text-red-400">*</span></label>
                                    <input 
                                        className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:border-blue-400 outline-none transition-colors"
                                        placeholder="Enter title"
                                        value={newAgendaItem.title}
                                        onChange={e => setNewAgendaItem({...newAgendaItem, title: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-white">Description</label>
                                    <textarea 
                                        rows={4}
                                        className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:border-blue-400 outline-none transition-colors resize-none"
                                        placeholder="Enter description..."
                                        value={newAgendaItem.description}
                                        onChange={e => setNewAgendaItem({...newAgendaItem, description: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm text-white">Item Type <span className="text-red-400">*</span></label>
                                        <div className="flex gap-2">
                                            <SearchableSelect 
                                                className="w-full" 
                                                options={agendaItemTypes}
                                                value={newAgendaItem.itemType}
                                                onChange={(val) => setNewAgendaItem({...newAgendaItem, itemType: val})}
                                            />
                                            <button 
                                                onClick={() => setShowAgendaTypeModal(true)}
                                                className="p-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700"
                                                title="Add New Item Type"
                                            >
                                                <Star size={16}/>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm text-white">Requested By</label>
                                        <div className="flex gap-2">
                                            <SearchableSelect 
                                                className="w-full"
                                                options={employees}
                                                value={newAgendaItem.requestedBy}
                                                onChange={(val) => setNewAgendaItem({...newAgendaItem, requestedBy: val})}
                                            />
                                            <button 
                                                onClick={() => navigate("/app/hr/newemployee", { state: { from: location.pathname } })}
                                                className="p-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700"
                                                title="New Employee"
                                            >
                                                <Star size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                        <label className="text-sm text-white">Sequence No</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:border-blue-400 outline-none"
                                            value={newAgendaItem.sequenceNo}
                                            onChange={e => setNewAgendaItem({...newAgendaItem, sequenceNo: e.target.value})}
                                        />
                                    </div>
                                    
                                    {/* Attachment Input */}
                                     <div className="space-y-1">
                                        <label className="text-sm text-white">Attachment</label>
                                        <div className="flex items-center gap-2">
                                             <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded cursor-pointer hover:bg-gray-700 text-sm text-gray-300 transition-colors">
                                                📎 {newAgendaItem.attachmentFile || newAgendaItem.attachments ? "Change File" : "Select File"}
                                                <input type="file" className="hidden" onChange={e => setNewAgendaItem({...newAgendaItem, attachmentFile: e.target.files[0]})} />
                                             </label>
                                             {(newAgendaItem.attachmentFile || newAgendaItem.attachments) && (
                                                <button onClick={() => setNewAgendaItem({...newAgendaItem, attachmentFile: null, attachments: null})} className="p-2 text-red-400 hover:text-red-300 bg-gray-800 border border-gray-600 rounded"><Trash2 size={16}/></button>
                                             )}
                                        </div>
                                        {newAgendaItem.attachmentFile ? (
                                            <div className="text-xs text-blue-300 mt-1 truncate">
                                                {newAgendaItem.attachmentFile.name} ({(newAgendaItem.attachmentFile.size / 1024).toFixed(1)} KB)
                                            </div>
                                        ) : newAgendaItem.attachments ? (
                                            <div className="text-xs text-green-300 mt-1 truncate">
                                                Existing: {newAgendaItem.attachments}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            
                            {/* RIGHT COLUMN: Image Preview */}
                            <div className="md:col-span-1 space-y-4">
                                 <div className="space-y-1 h-full flex flex-col">
                                    <label className="text-sm text-white">Image</label>
                                    
                                    <div className="flex-1 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/50 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px]">
                                        {newAgendaItem.imageFile ? (
                                            <>
                                                <img 
                                                    src={URL.createObjectURL(newAgendaItem.imageFile)} 
                                                    alt="Preview" 
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
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                                                    {newAgendaItem.images}
                                                </div>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-4 text-center w-full h-full justify-center">
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
                        </div>
                    </div>
                    {/* Footer - No Footer needed as button is at top, or keep consistent */}
                     <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end">
                        <button 
                            onClick={handleSaveAgendaItem}
                            className="bg-gray-800 border border-gray-600 text-blue-300 px-6 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Save size={16}/> Save Agenda Item
                        </button>
                     </div>
                </div>
            </div>

        )}

        {/* NEW AGENDA ITEM TYPE MODAL */}
        {showAgendaTypeModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                 <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[700px] p-6">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                         <h3 className="text-lg font-semibold text-white">New Item Type</h3>
                         <button onClick={() => setShowAgendaTypeModal(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm text-white">Name <span className="text-red-400">*</span></label>
                            <input 
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 outline-none focus:border-blue-400"
                                value={newAgendaType.name}
                                onChange={e => setNewAgendaType({...newAgendaType, name: e.target.value})}
                            />
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
                             <button 
                                onClick={handleSaveAgendaType}
                                className="bg-gray-800 border border-gray-600 text-blue-300 px-6 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
                            >
                                <Save size={16}/> Save
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
        )}

        {/* NEW DECISION MODAL */}
        {showDecisionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
                        <h3 className="text-lg font-semibold text-white">New Agenda Decision</h3>
                        <button onClick={() => setShowDecisionModal(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 text-white">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm text-white">Description <span className="text-red-400">*</span></label>
                                <textarea 
                                    rows={4}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 outline-none focus:border-blue-400 resize-none"
                                    value={newDecision.description}
                                    onChange={e => setNewDecision({...newDecision, description: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-white">Due Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 outline-none focus:border-blue-400"
                                    value={newDecision.dueDate}
                                    onChange={e => setNewDecision({...newDecision, dueDate: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-white">Assigned To</label>
                                <SearchableSelect
                                    options={employees.map(e => ({ id: e.id, name: e.name }))}
                                    value={newDecision.assignedTo}
                                    onChange={val => setNewDecision({...newDecision, assignedTo: val})}
                                    placeholder="--select--"
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-white">Decision Number</label>
                                <input 
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 outline-none focus:border-blue-400"
                                    value={newDecision.decisionNumber}
                                    onChange={e => setNewDecision({...newDecision, decisionNumber: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-white">Related Agenda Item</label>
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

                            <div className="space-y-1">
                                <label className="text-sm text-white">Resolution Status</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <SearchableSelect
                                            options={resolutionStatuses.map(rs => ({ id: rs.id, name: rs.name }))}
                                            value={newDecision.resolutionStatus}
                                            onChange={val => setNewDecision({...newDecision, resolutionStatus: val})}
                                            placeholder="--select--"
                                            className="w-full"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setShowResolutionStatusModal(true)}
                                        className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 h-[42px] hover:scale-105 transition-transform" // Align with input
                                        title="Add Status"
                                    >
                                        <Star size={16}/>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Images Input */}
                            <div className="space-y-1">
                                <label className="text-sm text-white">Images</label>
                                <div className="flex flex-col gap-2">
                                     <div className="flex-1 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/50 flex flex-col items-center justify-center relative overflow-hidden min-h-[160px]">
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
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 truncate">
                                                    {newDecision.images}
                                                </div>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-4 text-center w-full h-full justify-center">
                                                <Plus size={32} />
                                                <span className="text-xs">Click to Upload Image</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => setNewDecision({...newDecision, imageFile: e.target.files[0]})} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                             {/* Attachments Input */}
                             <div className="space-y-1">
                                <label className="text-sm text-white">Attachments</label>
                                <div className="flex items-center gap-2">
                                     <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded cursor-pointer hover:bg-gray-700 transition">
                                        <Pencil size={14} /> {newDecision.attachmentFile || newDecision.attachments ? "Change File" : "Select File"}
                                        <input type="file" className="hidden" onChange={e => setNewDecision({...newDecision, attachmentFile: e.target.files[0]})} />
                                     </label>
                                     {newDecision.attachmentFile ? (
                                         <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-2 rounded">
                                             <div className="flex flex-col">
                                                 <span className="text-blue-300 text-sm font-medium truncate max-w-[200px]">{newDecision.attachmentFile.name}</span>
                                                 <span className="text-gray-500 text-xs">{(newDecision.attachmentFile.size / 1024).toFixed(1)} KB • {newDecision.attachmentFile.name.split('.').pop().toUpperCase()}</span>
                                             </div>
                                             <button onClick={() => setNewDecision({...newDecision, attachmentFile: null})} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={16}/></button>
                                         </div>
                                     ) : newDecision.attachments ? (
                                         <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-2 rounded">
                                             <div className="flex flex-col">
                                                 <span className="text-green-300 text-sm font-medium truncate max-w-[200px]">{newDecision.attachments}</span>
                                                 <span className="text-gray-500 text-xs">Existing File</span>
                                             </div>
                                             <button onClick={() => setNewDecision({...newDecision, attachments: null})} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={16}/></button>
                                         </div>
                                     ) : null}
                                </div>
                            </div>

                        </div>
                    </div>
                
                    <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end">
                        <button 
                            onClick={handleSaveDecision}
                            className="bg-gray-800 border border-gray-600 text-blue-300 px-6 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Save size={16}/> Save
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* DECISION RESOLUTION STATUS MODAL */}
        {showResolutionStatusModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                 <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[700px] p-6">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                         <h3 className="text-lg font-semibold text-white">New Resolution Status</h3>
                         <button onClick={() => setShowResolutionStatusModal(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm text-white">Name <span className="text-red-400">*</span></label>
                            <input 
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 outline-none focus:border-blue-400"
                                value={newResolutionStatus.name}
                                onChange={e => setNewResolutionStatus({...newResolutionStatus, name: e.target.value})}
                            />
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
                             <button 
                                onClick={handleSaveResolutionStatus}
                                className="bg-gray-800 border border-gray-600 text-blue-300 px-6 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
                            >
                                <Save size={16}/> Save
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
        )}



      

        {/* MEETING TYPE MODAL */}
        <SimpleModal
            title="Add Meeting Type"
            isOpen={meetingTypeModalOpen}
            onClose={() => setMeetingTypeModalOpen(false)}
            onSave={handleSaveMeetingType}
            value={newMeetingType}
            setValue={setNewMeetingType}
            placeholder="Enter Meeting Type Name"
        />

      {/* DEPARTMENT MODAL */}
      {departmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[700px] shadow-xl">
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
                <SearchableSelect
                  options={departments.map(d => ({ id: d.id, name: d.name }))}
                  value={newDepartment.parentDepartmentId}
                  onChange={(val) => setNewDepartment({ ...newDepartment, parentDepartmentId: val })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDepartmentModalOpen(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 text-red-400 rounded hover:bg-gray-700">Cancel</button>
              <button onClick={handleSaveDepartment} className="px-4 py-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION MODAL */}
      {locationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[700px] max-h-[90vh] overflow-y-auto shadow-xl">
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
                 <div className="space-y-1">
                    <label className="text-sm text-white">Country</label>
                    <div className="flex gap-2">
                        <SearchableSelect
                          options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                          value={newLocation.countryId}
                          onChange={(val) => setNewLocation({ ...newLocation, countryId: val, stateId: "", cityId: "" })}
                          placeholder="--select--"
                          className="w-full"
                        />
                         <button
                            onClick={() => setAddCountryModalOpen(true)}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add Country"
                        >
                            <Star size={16} />
                        </button>
                    </div>
                </div>
              </div>

              <div>
                <div className="space-y-1">
                    <label className="text-sm text-white">State</label>
                    <div className="flex gap-2">
                        <SearchableSelect
                          options={locationModalStates.map(s => ({ id: s.id, name: s.name }))}
                          value={newLocation.stateId}
                          onChange={(val) => setNewLocation({ ...newLocation, stateId: val, cityId: "" })}
                          placeholder="--select--"
                          className="w-full"
                        />
                         <button
                            onClick={() => setAddStateModalOpen(true)}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add State"
                        >
                            <Star size={16} />
                        </button>
                    </div>
                </div>
              </div>

              <div>
                 <div className="space-y-1">
                    <label className="text-sm text-white">City</label>
                    <div className="flex gap-2">
                        <SearchableSelect
                          options={locationModalCities.map(c => ({ id: c.id, name: c.name }))}
                          value={newLocation.cityId}
                          onChange={(val) => setNewLocation({ ...newLocation, cityId: val })}
                          placeholder="--select--"
                          className="w-full"
                        />
                         <button
                            onClick={() => setAddCityModalOpen(true)}
                            className="p-2 bg-gray-800 border border-gray-600 text-yellow-400 rounded hover:bg-gray-700 hover:scale-105 transition-transform"
                            title="Add City"
                        >
                            <Star size={16} />
                        </button>
                    </div>
                </div>
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
              <button onClick={() => setLocationModalOpen(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 text-red-400 rounded hover:bg-gray-700">Cancel</button>
              <button onClick={handleSaveLocation} className="px-4 py-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700">Save</button>
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
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[700px] shadow-xl">
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
                <SearchableSelect
                  options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                  value={newState.countryId}
                  onChange={(val) => setNewState({ ...newState, countryId: val })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setAddStateModalOpen(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 text-red-400 rounded hover:bg-gray-700">Cancel</button>
              <button onClick={handleSaveState} className="px-4 py-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* NESTED ADD CITY MODAL */}
      {addCityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[700px] shadow-xl">
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
                <SearchableSelect
                  options={modalCountries.map(c => ({ id: c.id, name: c.name }))}
                  value={newCity.countryId}
                  onChange={(val) => setNewCity({ ...newCity, countryId: val, stateId: "" })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-white">State *</label>
                <SearchableSelect
                  options={modalStates.map(s => ({ id: s.id, name: s.name }))}
                  value={newCity.stateId}
                  onChange={(val) => setNewCity({ ...newCity, stateId: val })}
                  placeholder="--select--"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setAddCityModalOpen(false)} className="px-4 py-2 bg-gray-800 border border-gray-600 text-red-400 rounded hover:bg-gray-700">Cancel</button>
              <button onClick={handleSaveCity} className="px-4 py-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}

      </div>
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
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-[700px] shadow-xl">
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
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 border border-gray-600 text-red-400 rounded hover:bg-gray-700">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700">Save</button>
        </div>
      </div>
    </div>
  );
};
  
const X = ({size, className, onClick}) => (
    <span onClick={onClick} className={`cursor-pointer ${className}`}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
);

export default EditMeeting;
