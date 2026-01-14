import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";

// API
import {
  addTaxTypeApi,
  updateTaxTypeApi,
  deleteTaxTypeApi,
  restoreTaxTypeApi,
  searchTaxTypeApi,
} from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";
import MasterTable from "../../components/MasterTable";
import Swal from "sweetalert2";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";


const TaxTypes = () => {
  const { theme } = useTheme();
  const { 
    loadTaxTypes: loadTaxTypesCtx, 
    loadInactiveTaxTypes: loadInactiveCtx,
    refreshInactiveTaxTypes
  } = useMasters();

  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  const [taxTypes, setTaxTypes] = useState([]);
  const [inactiveTaxTypes, setInactiveTaxTypes] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newTaxType, setNewTaxType] = useState("");
  const [newIsInterState, setNewIsInterState] = useState(false);
  const [newPercentage, setNewPercentage] = useState("");

  // EDIT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTaxType, setEditTaxType] = useState({
    id: null,
    isInactive: false,
    isInterState: false,
    percentage: 0,
  });

  //pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // SEARCH
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // COLUMN PICKER
  const defaultColumns = {
    id: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const sortedTaxTypes = [...taxTypes];
  if (sortConfig.key) {
    sortedTaxTypes.sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // NORMALIZE HELPER
  const normalizeRows = (items = []) => 
    items.map(r => ({
      ...r,
      id: r.typeId ?? r.id,
      name: r.typeName ?? r.name
    }));

  // LOAD ACTIVE TAX TYPES
  const loadTaxTypes = async (forceRefresh = false) => {
    const { data, total } = await loadTaxTypesCtx(page, limit, searchText, forceRefresh);
    setTaxTypes(normalizeRows(data || []));
    setTotalRecords(total || 0);
  };

  useEffect(() => {
    loadTaxTypes();
  }, [page, limit]); 

  // LOAD INACTIVE
  const loadInactive = async () => {
    const data = await loadInactiveCtx();
    setInactiveTaxTypes(normalizeRows(data || []));
  };

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);
    if (text.trim() === "") {
        const { data, total } = await loadTaxTypesCtx(1, limit, "");
        setTaxTypes(normalizeRows(data || []));
        setTotalRecords(total || 0);
        return;
    }

    const { data, total } = await loadTaxTypesCtx(1, limit, text);
    setTaxTypes(normalizeRows(data || []));
    setTotalRecords(total || 0); 
  };

  // ADD
  const handleAddTaxType = async () => {
    // Check for duplicates
    try {
        const searchRes = await searchTaxTypeApi(newPercentage);
        if (searchRes?.data) {
             const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data.records || [];
             const existing = rows.find(r => 
                parseFloat(r.percentage || r.Percentage || 0) === parseFloat(newPercentage) &&
                Boolean(r.isInterState || r.IsInterState) === Boolean(newIsInterState)
             );
             if (existing) return toast.error("Tax Type with this percentage and category already exists");
        }
    } catch (err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    const res = await addTaxTypeApi({
      name: "", // Removed from UI
      isInterState: newIsInterState,
      percentage: parseFloat(newPercentage) || 0,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Tax Type added");
      setNewTaxType("");
      setNewIsInterState(false);
      setNewPercentage("");
      setModalOpen(false);
      loadTaxTypes(true); // Force Reload
    } else {
      toast.error("Failed to add");
    }
  };

  // UPDATE
  const handleUpdateTaxType = async () => {
    // Check for duplicates
    try {
        const searchRes = await searchTaxTypeApi(editTaxType.percentage);
        if (searchRes?.data) {
             const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data.records || [];
             const existing = rows.find(r => 
                parseFloat(r.percentage || r.Percentage || 0) === parseFloat(editTaxType.percentage) &&
                Boolean(r.isInterState || r.IsInterState) === Boolean(editTaxType.isInterState) &&
                (r.id || r.Id || r.typeId || r.TypeId) !== editTaxType.id
             );
             if (existing) return toast.error("Tax Type with this percentage and category already exists");
        }
    } catch (err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    const res = await updateTaxTypeApi(editTaxType.id, {
      name: "", // Removed from UI
      isInterState: editTaxType.isInterState,
      percentage: parseFloat(editTaxType.percentage) || 0,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Tax Type updated");
      setEditModalOpen(false);
      loadTaxTypes(true);
      if (showInactive) {
          refreshInactiveTaxTypes();
          loadInactive();
      }
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE
  const handleDeleteTaxType = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteTaxTypeApi(editTaxType.id, {
          userId: user?.userId || 1,
        });

        if (res?.status === 200) {
          toast.success("Tax Type deleted");
          setEditModalOpen(false);
          loadTaxTypes(true);
          if (showInactive) {
            refreshInactiveTaxTypes();
            loadInactive();
          }
        } else {
          toast.error("Delete failed");
        }
      }
    });
  };

  // RESTORE
  const handleRestoreTaxType = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to restore this Tax Type?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restore it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await restoreTaxTypeApi(editTaxType.id, {
          userId: user?.userId || 1,
        });

        if (res?.status === 200) {
          toast.success("Tax Type restored");
          setEditModalOpen(false);
          loadTaxTypes(true);
          refreshInactiveTaxTypes();
          loadInactive();
        } else {
          toast.error("Failed to restore");
        }
      }
    });
  };

  const tableColumns = [
    visibleColumns.id && { key: "id", label: "ID", sortable: true },
    { key: "isInterState", label: "Type", render: (row) => row.isInterState ? "Inter State (IGST)" : "Intra State (CGST+SGST)" },
    { key: "percentage", label: "Percentage (%)", sortable: true },
  ].filter(Boolean);

  return (
    <PageLayout>
      <>
        {/* ADD MODAL */}
        <AddModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAddTaxType}
          title="New Tax Type"
        >
          <div className="mb-3">
            <label className="block text-sm mb-1">Tax Category</label>
            <select
              value={newIsInterState ? "inter" : "intra"}
              onChange={(e) => setNewIsInterState(e.target.value === "inter")}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
            >
              <option value="intra">Intra State (CGST + SGST)</option>
              <option value="inter">Inter State (IGST)</option>
            </select>
          </div>

          <label className="block text-sm mb-1">Percentage (%)</label>
          <input
            type="number"
            value={newPercentage}
            onChange={(e) => setNewPercentage(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none mb-3"
          />
        </AddModal>

        {/* EDIT MODAL */}
        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdateTaxType}
          onDelete={handleDeleteTaxType}
          onRestore={handleRestoreTaxType}
          isInactive={editTaxType.isInactive}
          >
            <div className="mt-3">
              <label className="block text-sm mb-1">Tax Category</label>
              <select
                value={editTaxType.isInterState ? "inter" : "intra"}
                onChange={(e) => setEditTaxType(prev => ({ ...prev, isInterState: e.target.value === "inter" }))}
                disabled={editTaxType.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none ${
                    editTaxType.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="intra">Intra State (CGST + SGST)</option>
                <option value="inter">Inter State (IGST)</option>
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-sm mb-1">Percentage (%)</label>
              <input
                type="number"
                value={editTaxType.percentage}
                onChange={(e) => setEditTaxType(prev => ({ ...prev, percentage: e.target.value }))}
                disabled={editTaxType.isInactive}
                className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none ${
                  editTaxType.isInactive ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
        </EditModal>

        {/* COLUMN PICKER MODAL */}
        <ColumnPickerModal
          isOpen={columnModal}
          onClose={() => setColumnModal(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
        />

        {/* MAIN PAGE */}
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className="text-2xl font-semibold mb-4">Tax Types</h2>

            {/* TABLE SECTION */}
            <MasterTable
              columns={tableColumns}
              data={sortedTaxTypes}
              inactiveData={inactiveTaxTypes}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(item, isInactive) => {
                setEditTaxType({
                  id: item.id,
                  isInterState: item.isInterState,
                  percentage: item.percentage,
                  isInactive,
                });
                setEditModalOpen(true);
              }}
              // Action Bar Props
              search={searchText}
              onSearch={handleSearch}
              onCreate={() => setModalOpen(true)}
              createLabel="New Tax Type"
              permissionCreate={true} // TODO: Permission
              onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadTaxTypes();
              }}
              onColumnSelector={() => setColumnModal(true)}
              onToggleInactive={async () => {
                if (!showInactive) await loadInactive();
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
              onRefresh={() => {
                setSearchText("");
                setPage(1);
                loadTaxTypes();
              }}
            />
          </div>
        </div>
      </>
    </PageLayout>
  );
};

export default TaxTypes;
