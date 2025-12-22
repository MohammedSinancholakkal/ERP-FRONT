import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2, ArchiveRestore, Pencil } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import {
  getMeetingByIdApi,
  getAgendaItemsApi,
  getAgendaDecisionsApi,
  deleteMeetingApi,
  updateMeetingApi,
  getMeetingTypesApi,
  getDepartmentsApi,
  getLocationsApi,
  getEmployeesApi,
} from "../../services/allAPI";
import toast from "react-hot-toast";

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
    title: "",
    description: "",
    itemType: "",
    requestedBy: "",
    sequenceNo: "",
    imageFile: null,      // File object
    attachmentFile: null  // File object
  });

  const updateField = (key, value) => {
    setMeeting(prev => ({ ...prev, [key]: value }));
  };

  /* DROPDOWN DATA */
  const [meetingTypes, setMeetingTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);

  /* LOAD DROPDOWNS */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mtRes, deptRes, locRes, empRes, atRes] = await Promise.all([
          getMeetingTypesApi(1, 100),
          getDepartmentsApi(1, 100),
          getLocationsApi(1, 100),
          getEmployeesApi(1, 100),
          getAgendaItemTypesApi(1, 100)
        ]);

        // Normalize meeting types
        const mtList = mtRes.data.records || mtRes.data || [];
        setMeetingTypes(mtList.map(item => ({
          id: item.Id || item.id,
          name: item.Name || item.name
        })));

        // Normalize departments
        const deptList = deptRes.data.records || deptRes.data || [];
        setDepartments(deptList.map(item => ({
          id: item.Id || item.id,
          name: item.Department || item.department
        })));

        // Normalize locations
        const locList = locRes.data.records || locRes.data || [];
        setLocations(locList.map(item => ({
          id: item.Id || item.id,
          name: item.Name || item.name
        })));

        // Normalize employees
        const empList = empRes.data.records || empRes.data || [];
        setEmployees(empList.map(item => ({
          id: item.Id || item.id,
          name: item.FirstName ? `${item.FirstName} ${item.LastName || ''}` : item.Name || `Emp ${item.Id}`
        })));

        // Normalize Agenda Item Types
        const atList = atRes.data.records || atRes.data || [];
        setAgendaItemTypes(atList.map(item => ({
            id: item.Id || item.id,
            name: item.Name || item.name
        })));

      } catch (err) {
        console.error("Error loading dropdowns", err);
      }
    };
    fetchData();
  }, [id]);


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
    const { title, description, itemType, requestedBy, sequenceNo, imageFile, attachmentFile } = newAgendaItem;

    if (!title || !itemType || !requestedBy) {
        toast.error("Please fill required fields (Title, Item Type, Requested By)");
        return;
    }

    const formData = new FormData();
    formData.append("meetingId", id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("itemTypeId", itemType);
    formData.append("requestedBy", requestedBy); // Employee ID
    formData.append("sequenceNo", sequenceNo || 0);
    formData.append("userId", 1); // Current user

    if (imageFile) formData.append("imageFile", imageFile);
    if (attachmentFile) formData.append("attachmentFile", attachmentFile);

    try {
        await addAgendaItemApi(formData);
        toast.success("Agenda Item Added");
        setShowAgendaModal(false);
        setNewAgendaItem({
            title: "",
            description: "",
            itemType: "",
            requestedBy: "",
            sequenceNo: "",
            imageFile: null,
            attachmentFile: null
        });
        // Refresh list
        getAgendaItemsApi(id).then(res => {
             if(res.data.records) setAgendaItems(res.data.records);
        });

    } catch (err) {
        console.error("ADD AGENDA ITEM ERROR:", err);
        toast.error("Failed to add agenda item");
    }
  };




  return (
    <PageLayout>
      <div className="p-5 text-white bg-gradient-to-b from-gray-900 to-gray-700">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/app/meeting/meetings")}
            className="p-2 bg-gray-800 rounded border border-gray-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-semibold">{isInactive ? "Restore Meeting" : "Edit Meeting"}</h2>
        </div>

        <div className="flex items-center gap-3 mt-5 mb-5">
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
        {activeTab === "meeting" && (
          <div className="bg-gradient-to-br from-[#4b3b55] to-[#2e2337] border border-[#5a4a63] rounded-lg p-6">

            {/* ACTION BUTTONS (INNER TAB) */}
            <div className="flex gap-3 mb-6">
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
                    className="flex items-center gap-2 bg-[#5d536b] border border-[#7a6f88] px-4 py-2 rounded text-sm text-white hover:bg-[#6c6180]"
                  >
                    <Save size={16} /> Save
                  </button>

                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 bg-[#6b3b3b] border border-[#8a4a4a] px-4 py-2 rounded text-sm text-white hover:bg-[#7a4545]"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </>
              )}
            </div>

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

                <SelectField
                  label="Department"
                  value={meeting.department}
                  options={departments}
                  onChange={(v) => updateField("department", v)}
                  disabled={isInactive}
                />


                <SelectField
                  label="Organized By"
                  value={meeting.organizedBy}
                  options={employees}
                  onChange={(v) => updateField("organizedBy", v)}
                  disabled={isInactive}
                />

              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                <SelectField
                  label="Meeting Type *"
                  value={meeting.meetingType}
                  options={meetingTypes}
                  onChange={(v) => updateField("meetingType", v)}
                  disabled={isInactive}
                />


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

                <SelectField
                  label="Location"
                  value={meeting.location}
                  options={locations}
                  onChange={(v) => updateField("location", v)}
                  disabled={isInactive}
                />


                <SelectField
                  label="Reporter"
                  value={meeting.reporter}
                  options={employees}
                  onChange={(v) => updateField("reporter", v)}
                  disabled={isInactive}
                />

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
          </div>
        )}




        {/* AGENDA ITEMS TAB */}
        {activeTab === "agenda" && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
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
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Sequence No</th>
                </tr>
              </thead>
              <tbody>
                {agendaItems.map(a => (
                  <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="px-4 py-3">{a.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{a.title}</td>
                    <td className="px-4 py-3">{a.description}</td>
                    <td className="px-4 py-3">{a.itemTypeName}</td>
                    <td className="px-4 py-3">{a.requestedByName}</td>
                    <td className="px-4 py-3">{a.sequenceNo}</td>
                  </tr>
                ))}
                {agendaItems.length === 0 && (
                    <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">No Agenda Items found</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* NEW AGENDA ITEM MODAL */}
        {showAgendaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
                        <h3 className="text-lg font-semibold text-white">New Agenda Item</h3>
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
                                            <select 
                                                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:border-blue-400 outline-none" 
                                                value={newAgendaItem.itemType}
                                                onChange={e => setNewAgendaItem({...newAgendaItem, itemType: e.target.value})}
                                            >
                                                <option value="">--select--</option>
                                                {agendaItemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <button className="p-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700"><Plus size={16}/></button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm text-white">Requested By</label>
                                        <div className="flex gap-2">
                                            <select 
                                                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:border-blue-400 outline-none"
                                                value={newAgendaItem.requestedBy}
                                                onChange={e => setNewAgendaItem({...newAgendaItem, requestedBy: e.target.value})}
                                            >
                                                <option value="">--select--</option>
                                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                            </select>
                                            <button className="p-2 bg-gray-800 border border-gray-600 text-blue-300 rounded hover:bg-gray-700"><Plus size={16}/></button>
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
                                                📎 {newAgendaItem.attachmentFile ? "Change File" : "Select File"}
                                                <input type="file" className="hidden" onChange={e => setNewAgendaItem({...newAgendaItem, attachmentFile: e.target.files[0]})} />
                                             </label>
                                             {newAgendaItem.attachmentFile && (
                                                <button onClick={() => setNewAgendaItem({...newAgendaItem, attachmentFile: null})} className="p-2 text-red-400 hover:text-red-300 bg-gray-800 border border-gray-600 rounded"><Trash2 size={16}/></button>
                                             )}
                                        </div>
                                        {newAgendaItem.attachmentFile && (
                                            <div className="text-xs text-blue-300 mt-1 truncate">
                                                {newAgendaItem.attachmentFile.name} ({(newAgendaItem.attachmentFile.size / 1024).toFixed(1)} KB)
                                            </div>
                                        )}
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

        {/* AGENDA DECISIONS TAB */}
        {activeTab === "decisions" && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg">Agenda Decisions</h3>
              <button className="flex items-center gap-1 bg-gray-800 border border-gray-600 px-3 py-1.5 rounded">
                <Plus size={14} /> Add
              </button>
            </div>

            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Due Date</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {agendaDecisions.map(d => (
                  <tr key={d.id} className="border-b border-gray-800">
                    <td>{d.id}</td>
                    <td>{d.description}</td>
                    <td>{d.dueDate}</td>
                    <td>{d.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        
      </div>
    </PageLayout>
  );
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


/* ===============================
   SMALL UI HELPERS (SAME FILE)
================================ */

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm text-white">{label}</label>
    {children}
  </div>
);

const SelectField = ({ label, value, options, onChange, disabled }) => {
  // Smart Match: Try to find match by ID, then by Name
  // This handles cases where backend returns "Review" (text) but dropdown expects ID 1
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


export default EditMeeting;
