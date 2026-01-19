import MasterTable from "../../components/MasterTable";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/Pagination";
import PageLayout from "../../layout/PageLayout";
import { useNavigate } from "react-router-dom";
import { 
  getMeetingsApi, 
  getInactiveMeetingsApi, 
  restoreMeetingApi 
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import toast from "react-hot-toast";
import { showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";


const Meetings = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  /* Column Visibility State */
  const defaultColumns = {
    id: true,
    meetingName: true,
    meetingType: true,
    startDate: true,
    endDate: true,
    department: true,
    location: true,
    organizedBy: true,
    reporter: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  // Column picker modal state
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  /* Inactive State */
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveMeetings, setInactiveMeetings] = useState([]);

  /* Filters State */
  const [searchText, setSearchText] = useState("");
  const [filterMeetingType, setFilterMeetingType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterOrganizedBy, setFilterOrganizedBy] = useState("");
  const [filterReporter, setFilterReporter] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* Data */
  const [allMeetings, setAllMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /* Derived Filter Lists */
  const [dropdownOptions, setDropdownOptions] = useState({
    meetingTypes: [],
    startDates: [],
    endDates: [],
    departments: [],
    locations: [],
    organizers: [],
    reporters: []
  });

  /* ================================
     LOAD ACTIVE MEETINGS
  =================================*/
  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await getMeetingsApi(1, 5000); // Fetch all for client-side filtering

      if (res?.data) {
        let records = res.data.records || res.data || [];
        if (!Array.isArray(records)) records = [];
        setAllMeetings(records);
        const unique = (key) => [...new Set(records.map(r => r[key]).filter(Boolean))].sort().map(val => ({ id: val, name: val }));
        setDropdownOptions({
          meetingTypes: unique('meetingType'),
          startDates: unique('startDate'),
          endDates: unique('endDate'),
          departments: unique('department'),
          locations: unique('location'),
          organizers: unique('organizedBy'),
          reporters: unique('reporter'),
        });
      }
    } catch (err) {
      console.log("LOAD MEETINGS ERROR:", err);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     LOAD INACTIVE MEETINGS
  =================================*/
  const loadInactiveMeetings = async () => {
    try {
      // Don't set main loading to true to avoid hiding active table
      const res = await getInactiveMeetingsApi();
      if (res.status === 200) {
        setInactiveMeetings(res.data.records || res.data || []);
      }
    } catch (err) {
      console.log("LOAD INACTIVE ERROR:", err);
      toast.error("Failed to load inactive meetings");
    }
  };

  /* ================================
     RESTORE MEETING
  =================================  /* RESTORE MEETING */
  const handleRestore = async (id) => {
    const result = await showRestoreConfirm("meeting");

    if (!result.isConfirmed) return;

    try {
      await restoreMeetingApi(id, { userId: 1 });
      showSuccessToast("Meeting restored successfully");
      loadMeetings(false);
      setInactiveMeetings(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("RESTORE ERROR:", error);
      showErrorToast("Failed to restore meeting");
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  /* Filter Logic - ACTIVE ONLY */
  useEffect(() => {
    let result = Array.isArray(allMeetings) ? allMeetings : [];

    // Search Text
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(m => 
        Object.values(m).some(val => String(val).toLowerCase().includes(q))
      );
    }

    // Dropdown Filters
    if (filterMeetingType) result = result.filter(m => m.meetingType === filterMeetingType);
    if (filterStartDate) result = result.filter(m => m.startDate === filterStartDate);
    if (filterEndDate) result = result.filter(m => m.endDate === filterEndDate);
    if (filterDepartment) result = result.filter(m => m.department === filterDepartment);
    if (filterLocation) result = result.filter(m => m.location === filterLocation);
    if (filterOrganizedBy) result = result.filter(m => m.organizedBy === filterOrganizedBy);
    if (filterReporter) result = result.filter(m => m.reporter === filterReporter);

    // Sorting Logic
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = String(a[sortConfig.key] || "").toLowerCase();
        const valB = String(b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredMeetings(result);
    setPage(1); 
  }, [
    allMeetings, 
    searchText, 
    filterMeetingType, 
    filterStartDate, 
    filterEndDate, 
    filterDepartment, 
    filterLocation, 
    filterOrganizedBy, 
    filterReporter
  ]);

  /* Pagination Logic */
  const safeFiltered = Array.isArray(filteredMeetings) ? filteredMeetings : [];
  const total = safeFiltered.length;
  const startIdx = (page - 1) * limit;
  const paginatedData = safeFiltered.slice(startIdx, startIdx + limit);




  const filterFilters = [
      { label: "Meeting Type", options: dropdownOptions.meetingTypes, value: filterMeetingType, onChange: setFilterMeetingType, placeholder: "Select Type" },
      { label: "Start Date", options: dropdownOptions.startDates, value: filterStartDate, onChange: setFilterStartDate, placeholder: "Select Start Date" },
      { label: "End Date", options: dropdownOptions.endDates, value: filterEndDate, onChange: setFilterEndDate, placeholder: "Select End Date" },
      { label: "Department", options: dropdownOptions.departments, value: filterDepartment, onChange: setFilterDepartment, placeholder: "Select Department" },
      { label: "Location", options: dropdownOptions.locations, value: filterLocation, onChange: setFilterLocation, placeholder: "Select Location" },
      { label: "Organized By", options: dropdownOptions.organizers, value: filterOrganizedBy, onChange: setFilterOrganizedBy, placeholder: "Select Organizer" },
      { label: "Reporter", options: dropdownOptions.reporters, value: filterReporter, onChange: setFilterReporter, placeholder: "Select Reporter" }
  ];

  const handleClearFilters = () => {
    setFilterMeetingType("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterDepartment("");
    setFilterLocation("");
    setFilterOrganizedBy("");
    setFilterReporter("");
  };

  return (
    <>
      <ColumnPickerModal 
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      <PageLayout>
        <div className="p-6 h-full">
            <ContentCard>
                <h2 className="text-xl font-bold text-[#6448AE] mb-2">Meetings</h2>
                <hr className="mb-4 border-gray-300" />

            {/* MASTER TABLE */}
            <MasterTable
              columns={[
                visibleColumns.id && { key: "id", label: "ID", sortable: true },
                visibleColumns.meetingName && { key: "meetingName", label: "Meeting Name", sortable: true },
                visibleColumns.meetingType && { key: "meetingType", label: "Meeting Type", sortable: true },
                visibleColumns.startDate && { key: "startDate", label: "Start Date", sortable: true },
                visibleColumns.endDate && { key: "endDate", label: "End Date", sortable: true },
                visibleColumns.department && { key: "department", label: "Department", sortable: true },
                visibleColumns.location && { key: "location", label: "Location", sortable: true },
                visibleColumns.organizedBy && { key: "organizedBy", label: "Organized By", sortable: true },
                visibleColumns.reporter && { key: "reporter", label: "Reporter", sortable: true },
              ].filter(Boolean)}
              data={paginatedData}
              inactiveData={inactiveMeetings}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(item, isInactive) => {
                 if(isInactive) {
                    handleRestore(item.id);
                 } else {
                    navigate(`/app/meeting/meetings/edit/${item.id}`);
                 }
              }}
              // Action Props
              search={searchText}
              onSearch={setSearchText}
              onCreate={() => navigate("/app/meeting/meetings/new")}
              createLabel="New Meeting"
              permissionCreate={hasPermission(PERMISSIONS.MEETINGS.CREATE)}
              onRefresh={loadMeetings}
              onColumnSelector={() => setColumnModalOpen(true)}
              onToggleInactive={async () => {
                if (!showInactive) await loadInactiveMeetings();
                setShowInactive(!showInactive);
              }}
            >
              {/* FILTER BAR as Child */}
              <div className="">
                 <FilterBar filters={filterFilters} onClear={handleClearFilters} />
              </div>
            </MasterTable>

            {/* PAGINATION */}
            <Pagination
              page={page}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              total={total}
              onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadMeetings();
              }}
            />
            </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default Meetings;  



