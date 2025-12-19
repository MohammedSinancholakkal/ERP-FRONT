import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import {
  getMeetingByIdApi,
  getAgendaItemsApi,
  getAgendaDecisionsApi,
  deleteMeetingApi,
  updateMeetingApi,
} from "../../services/allAPI";
import toast from "react-hot-toast";

const EditMeeting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  /* detect tab from URL */
  const isAgenda = location.pathname.endsWith("/agenda");
  const isDecisions = location.pathname.endsWith("/decisions");

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

  const updateField = (key, value) => {
  setMeeting(prev => ({ ...prev, [key]: value }));
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

const handleSave = async () => {
  try {
    if (!meeting.meetingName || !meeting.startDate || !meeting.meetingType) {
      toast.error("Please fill all required fields");
      return;
    }

    await updateMeetingApi(id, meeting);
    toast.success("Meeting updated successfully");
    navigate("/app/meeting/meetings");

  } catch (err) {
    console.error("UPDATE MEETING ERROR:", err);
    toast.error("Failed to update meeting");
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
          <h2 className="text-xl font-semibold">Edit Meeting</h2>
        </div>

            <div className="flex items-center gap-3 mt-5 mb-5">
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

    {/* ACTION BUTTONS */}
    <div className="flex gap-3 mb-6">
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
    </div>

    {/* FORM GRID */}
    <div className="grid grid-cols-2 gap-6">

      {/* LEFT */}
      <div className="space-y-4">
        <Field label="Meeting Name *">
       <input
        value={meeting.meetingName}
        onChange={(e) => updateField("meetingName", e.target.value)}
        className="input-dark"
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
/>


      <SelectField
  label="Organized By"
  value={meeting.organizedBy}
  options={employees}
  onChange={(v) => updateField("organizedBy", v)}
/>

      </div>

      {/* RIGHT */}
      <div className="space-y-4">
       <SelectField
  label="Meeting Type *"
  value={meeting.meetingType}
  options={meetingTypes}
  onChange={(v) => updateField("meetingType", v)}
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
/>


     <SelectField
  label="Reporter"
  value={meeting.reporter}
  options={employees}
  onChange={(v) => updateField("reporter", v)}
/>

      </div>
    </div>

    {/* ATTENDEES */}
    <div className="mt-8">
      <div className="flex justify-between mb-2">
        <label className="text-sm text-white">Attendees</label>
        <button
          onClick={() => setShowAttendeeModal(true)}
          className="flex items-center gap-1 bg-[#5d8f65] px-3 py-1.5 rounded text-sm"
        >
          <Plus size={14} /> Add
        </button>
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
              <td className="p-2 text-yellow-300">{a.attendee}</td>
              <td className="p-2">{a.attendeeType}</td>
              <td className="p-2">{a.attendanceStatus}</td>
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
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg">Agenda Items</h3>
              <button className="flex items-center gap-1 bg-gray-800 border border-gray-600 px-3 py-1.5 rounded">
                <Plus size={14} /> Add
              </button>
            </div>

            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Item Type</th>
                </tr>
              </thead>
              <tbody>
                {agendaItems.map(a => (
                  <tr key={a.id} className="border-b border-gray-800">
                    <td>{a.id}</td>
                    <td>{a.title}</td>
                    <td>{a.description}</td>
                    <td>{a.itemType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    className={`pb-2 text-sm font-medium ${
      active
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

const SelectField = ({ label, value, options, onChange }) => (
  <div className="space-y-1">
    <label className="text-sm text-white">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-dark"
    >
      <option value="">--select--</option>
      {options.map((o) => (
        <option key={o.id} value={o.name}>
          {o.name}
        </option>
      ))}
    </select>
  </div>
);


export default EditMeeting;
