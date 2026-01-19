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
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

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
  const loadMeetings = async (currentSort = sortConfig) => {
    try {
      setLoading(true);
      const { key, direction } = currentSort;
      
      const res = await getMeetingsApi(
        1, 
        5000, 
        key || "id", 
        direction || "asc"
      ); 

      if (res?.data) {
        let records = res.data.records || res.data || [];
        if (!Array.isArray(records)) records = [];
        setAllMeetings(records);
        const unique = (key) => [...new Set(records.map(r => r[key]).filter(Boolean))].sort().map(val => ({ id: val, name: val }));
        
        // Only update options if it's the initial load to preserve filter context if needed, 
        // or always update? Master pages usually update.
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
        if (res?.data) {
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
      loadMeetings(sortConfig);
      setInactiveMeetings(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("RESTORE ERROR:", error);
      showErrorToast("Failed to restore meeting");
    }
  };

  useEffect(() => {
    loadMeetings(sortConfig);
  }, []); // Initial load

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    loadMeetings(newConfig);
  };

  const handleRefresh = () => {
    setSearchText("");
    setSortConfig({ key: "id", direction: "asc" });
    setPage(1);
    setShowInactive(false); // Reset inactive view
    
    // Clear Filters
    setFilterMeetingType("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterDepartment("");
    setFilterLocation("");
    setFilterOrganizedBy("");
    setFilterReporter("");

    loadMeetings({ key: "id", direction: "asc" });
  };

  /* Filter Logic - ACTIVE ONLY (Client Side Filtering Only) */
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

    // Sorting Logic REMOVED (Handled by Backend)

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
                visibleColumns.id && { key: "id", label: "ID", sortable: true, className: "capitalize" },
                visibleColumns.meetingName && { key: "meetingName", label: "Meeting Name", sortable: true, className: "capitalize" },
                visibleColumns.meetingType && { key: "meetingType", label: "Meeting Type", sortable: true, className: "capitalize" },
                visibleColumns.startDate && { key: "startDate", label: "Start Date", sortable: true, className: "capitalize" },
                visibleColumns.endDate && { key: "endDate", label: "End Date", sortable: true, className: "capitalize" },
                visibleColumns.department && { key: "department", label: "Department", sortable: true, className: "capitalize" },
                visibleColumns.location && { key: "location", label: "Location", sortable: true, className: "capitalize" },
                visibleColumns.organizedBy && { key: "organizedBy", label: "Organized By", sortable: true, className: "capitalize" },
                visibleColumns.reporter && { key: "reporter", label: "Reporter", sortable: true, className: "capitalize" },
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
              onRefresh={handleRefresh}
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
              onRefresh={handleRefresh}
            />
            </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default Meetings;  



