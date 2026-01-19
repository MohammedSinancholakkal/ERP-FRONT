import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";

// API
import {
  addTaxTypeApi,
  updateTaxTypeApi,
  deleteTaxTypeApi,
  restoreTaxTypeApi,
  searchTaxTypeApi,
  getTaxTypesApi,
} from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";
import { useMasters } from "../../context/MastersContext";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

// MODALS
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";


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

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  // REMOVED CLIENT SIDE SORT LOGIC
  const sortedTaxTypes = taxTypes;
  // NORMALIZE HELPER
  const normalizeRows = (items = []) => 
    items.map(r => ({
      ...r,
      id: r.typeId ?? r.id,
      name: r.typeName ?? r.name
    }));

  // LOAD ACTIVE TAX TYPES
  const loadTaxTypes = async () => {
    try {
        const res = await getTaxTypesApi(page, limit, sortConfig.key, sortConfig.direction);
        if (res?.status === 200) {
            const rows = res.data.records || res.data || [];
            setTaxTypes(normalizeRows(rows));
            setTotalRecords(res.data.total || rows.length || 0);
        }
    } catch(err) {
        console.error(err);
    }
  };

  useEffect(() => {
    loadTaxTypes();
  }, [page, limit, sortConfig]); 

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
             if (existing) return showErrorToast("Tax Type with this percentage and category already exists");
        }
    } catch (err) {
        console.error(err);
        return showErrorToast("Error checking duplicates");
    }

    const res = await addTaxTypeApi({
      name: "", // Removed from UI
      isInterState: newIsInterState,
      percentage: parseFloat(newPercentage) || 0,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      showSuccessToast("Tax Type added");
      setNewTaxType("");
      setNewIsInterState(false);
      setNewPercentage("");
      setModalOpen(false);
      loadTaxTypes(true); // Force Reload
    } else {
      showErrorToast("Failed to add");
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
             if (existing) return showErrorToast("Tax Type with this percentage and category already exists");
        }
    } catch (err) {
        console.error(err);
        return showErrorToast("Error checking duplicates");
    }

    const res = await updateTaxTypeApi(editTaxType.id, {
      name: "", // Removed from UI
      isInterState: editTaxType.isInterState,
      percentage: parseFloat(editTaxType.percentage) || 0,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      showSuccessToast("Tax Type updated");
      setEditModalOpen(false);
      loadTaxTypes(true);
      if (showInactive) {
          refreshInactiveTaxTypes();
          loadInactive();
      }
    } else {
      showErrorToast("Update failed");
    }
  };

  // DELETE
  const handleDeleteTaxType = async () => {
    const result = await showDeleteConfirm();

    if (result.isConfirmed) {
        const res = await deleteTaxTypeApi(editTaxType.id, {
          userId: user?.userId || 1,
        });

        if (res?.status === 200) {
          showSuccessToast("Tax Type deleted");
          setEditModalOpen(false);
          loadTaxTypes(true);
          if (showInactive) {
            refreshInactiveTaxTypes();
            loadInactive();
          }
        } else {
          showErrorToast("Delete failed");
        }
    }
  };

  // RESTORE
  const handleRestoreTaxType = async () => {
    const result = await showRestoreConfirm();

    if (result.isConfirmed) {
        const res = await restoreTaxTypeApi(editTaxType.id, {
          userId: user?.userId || 1,
        });

        if (res?.status === 200) {
          showSuccessToast("Tax Type restored");
          setEditModalOpen(false);
          loadTaxTypes(true);
          refreshInactiveTaxTypes();
          loadInactive();
        } else {
          showErrorToast("Failed to restore");
        }
    }
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
          <div className="mb-3">
            <label className="block text-sm mb-1">Tax Category</label>
            <SearchableSelect
              options={[
                { id: "intra", name: "Intra State (CGST + SGST)" },
                { id: "inter", name: "Inter State (IGST)" }
              ]}
              value={newIsInterState ? "inter" : "intra"}
              onChange={(val) => setNewIsInterState(val === "inter")}
              className="w-full"
            />
          </div>
          </div>

          <InputField
            label="Percentage (%)"
            type="number"
            value={newPercentage}
            onChange={(e) => setNewPercentage(e.target.value)}
            placeholder="0.00"
            className="mb-3"
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
              <SearchableSelect
                options={[
                    { id: "intra", name: "Intra State (CGST + SGST)" },
                    { id: "inter", name: "Inter State (IGST)" }
                ]}
                value={editTaxType.isInterState ? "inter" : "intra"}
                onChange={(val) => setEditTaxType(prev => ({ ...prev, isInterState: val === "inter" }))}
                disabled={editTaxType.isInactive}
                className="w-full"
              />
            </div>

            <div className="mt-3">
              <InputField
                label="Percentage (%)"
                type="number"
                value={editTaxType.percentage}
                onChange={(e) => setEditTaxType(prev => ({ ...prev, percentage: e.target.value }))}
                disabled={editTaxType.isInactive}
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
            <div className="flex flex-col h-full overflow-hidden gap-2">
              <h2 className="text-xl font-bold text-[#6448AE] mb-2">Tax Types</h2>
              <hr className="mb-4 border-gray-300" />

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
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
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
                setSortConfig({ key: "id", direction: "asc" });
                setShowInactive(false);
                loadTaxTypes();
              }}
            />
          </div>
          </ContentCard>
        </div>
      </>
    </PageLayout>
  );
};

export default TaxTypes;
