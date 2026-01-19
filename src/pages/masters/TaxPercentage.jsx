import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  Trash2,
  ArchiveRestore,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

import {
  addTaxPercentageApi,
  getTaxPercentagesApi,
  updateTaxPercentageApi,
  deleteTaxPercentageApi,
  searchTaxPercentageApi,
  getInactiveTaxPercentagesApi,
  restoreTaxPercentageApi,
} from "../../services/allAPI";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import PageLayout from "../../layout/PageLayout";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import InputField from "../../components/InputField";

const TaxPercentage = () => {
  const { theme } = useTheme();

  // STATES
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  
  const [dataList, setDataList] = useState([]);
  const [inactiveDataList, setInactiveDataList] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  
  const [searchText, setSearchText] = useState("");
  
  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // FORM STATES
  const [newItem, setNewItem] = useState({ percentage: "" });
  const [editItem, setEditItem] = useState({ id: null, percentage: "", isInactive: false });

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.userId || 1;

  // COLUMNS
  const defaultColumns = { id: true, percentage: true };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  // SORT
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ================= LOAD DATA =================
  const loadData = async () => {
    setSearchText("");
    try {
      const res = await getTaxPercentagesApi(page, limit, sortConfig.key, sortConfig.direction);
      if (res?.status === 200) {
        setDataList(res.data.records || []);
        setTotalRecords(res.data.total || 0);
      }
    } catch (error) {
       console.error(error);
    }
  };

  const loadInactive = async () => {
    try {
      const res = await getInactiveTaxPercentagesApi();
      if (res?.status === 200) {
        setInactiveDataList(res.data.records || res.data || []);
      }
    } catch (error) {
        console.error(error);
    }
  };

  useEffect(() => {
    if (showInactive) loadInactive();
    else loadData();
  }, [page, limit, showInactive, sortConfig]);

  // ================= SEARCH =================
  const handleSearch = async (txt) => {
    setSearchText(txt);
    if (!txt.trim()) return loadData();

    try {
      const res = await searchTaxPercentageApi(txt);
      if (res?.status === 200) {
        setDataList(res.data || []);
      }
    } catch (error) {
        console.error(error);
    }
  };

  // ================= CLIENT SORT REMOVED =================
  const sortedList = dataList;

  // ================= ADD =================
  const handleAdd = async () => {
    if (!newItem.percentage) return showErrorToast("Percentage is required");

    // Check for duplicates
    try {
      const searchRes = await searchTaxPercentageApi(newItem.percentage);
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        // Compare percentages effectively (as strings or floats)
        const existing = rows.find(r => 
           parseFloat(r.percentage || r.Percentage) === parseFloat(newItem.percentage)
        );
        if (existing) return showErrorToast("This Tax Percentage already exists");
      }
    } catch (err) {
      console.error(err);
      return showErrorToast("Error checking duplicates");
    }

    try {
      const res = await addTaxPercentageApi({
        percentage: parseFloat(newItem.percentage),
        userId: currentUserId
      });

      if (res?.status === 200) {
        showSuccessToast("Added Successfully");
        setModalOpen(false);
        setNewItem({ percentage: "" });
        loadData();
      } else {
        showErrorToast("Failed to add");
      }
    } catch (error) {
      console.error(error);
      showErrorToast("Server Error");
    }
  };

  // ================= OPEN EDIT =================
  const openEditModal = (item, isInactive) => {
    setEditItem({
      id: item.id,
      percentage: item.percentage,
      isInactive: isInactive
    });
    setEditModalOpen(true);
  };

  // ================= UPDATE =================
  const handleUpdate = async () => {
    if (!editItem.percentage) return showErrorToast("Percentage is required");

    // Check for duplicates
    try {
      const searchRes = await searchTaxPercentageApi(editItem.percentage);
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        const existing = rows.find(r => 
           parseFloat(r.percentage || r.Percentage) === parseFloat(editItem.percentage) &&
           (r.id || r.Id) !== editItem.id
        );
        if (existing) return showErrorToast("This Tax Percentage already exists");
      }
    } catch (err) {
      console.error(err);
      return showErrorToast("Error checking duplicates");
    }

    try {
      const res = await updateTaxPercentageApi(editItem.id, {
        percentage: parseFloat(editItem.percentage),
        userId: currentUserId
      });
      if (res?.status === 200) {
        showSuccessToast("Updated Successfully");
        setEditModalOpen(false);
        if (showInactive) loadInactive();
        else loadData();
      }
    } catch (error) {
       console.error(error);
       showErrorToast("Update Failed");
    }
  };

  // ================= DELETE =================
  // ================= DELETE =================
  const handleDelete = async () => {
    const result = await showDeleteConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await deleteTaxPercentageApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        showSuccessToast("Deleted");
        setEditModalOpen(false);
        loadData();
      }
    } catch (error) {
       console.error(error);
       showErrorToast("Delete Failed");
    }
  };

  // ================= RESTORE =================
  // ================= RESTORE =================
  const handleRestore = async () => {
    const result = await showRestoreConfirm();

    if (result.isConfirmed) {
        try {
           const res = await restoreTaxPercentageApi(editItem.id, { userId: currentUserId });
           if (res?.status === 200) {
             showSuccessToast("Restored");
             setEditModalOpen(false);
             loadInactive();
             loadData();
           }
        } catch (error) {
            console.error(error);
            showErrorToast("Restore Failed");
        }
    }
  };


  return (
    <>
      {/* ADD MODAL */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Tax Percentage"
        permission={hasPermission(PERMISSIONS.MASTERS?.ADD ?? true)} // Fallback if perm not defined
      >
        <div className="space-y-4">
           <div>
             <InputField
               label="Percentage %"
               type="number"
               step="0.01"
               value={newItem.percentage}
               onChange={(e) => setNewItem({ ...newItem, percentage: e.target.value })}
               placeholder="e.g. 18.00"
               required
             />
           </div>
        </div>
      </AddModal>

      {/* EDIT MODAL */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        isInactive={editItem.isInactive}
        title={editItem.isInactive ? "Restore Tax Percentage" : "Edit Tax Percentage"}
        // permissionEdit={...}
        // permissionDelete={...}
      >
         <div className="space-y-4">
           <div>
             <InputField
               label="Percentage %"
               type="number"
               step="0.01"
               value={editItem.percentage}
               onChange={(e) => setEditItem({ ...editItem, percentage: e.target.value })}
               disabled={editItem.isInactive}
               required
             />
           </div>
        </div>
      </EditModal>

      {/* COLUMN PICKER MODAL */}
      <ColumnPickerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
      />

      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
            <ContentCard>
              <div className="flex flex-col h-full overflow-hidden gap-2">
                 <h2 className="text-xl font-bold text-[#6448AE] mb-2">Tax Percentage</h2>
                 <hr className="mb-4 border-gray-300" />
             
             <MasterTable
                columns={[
                   visibleColumns.id && { key: "id", label: "ID", sortable: true },
                   visibleColumns.percentage && { key: "percentage", label: "Percentage %", sortable: true, render: (r) => `${r.percentage}%` }
                ].filter(Boolean)}
                data={sortedList}
                inactiveData={inactiveDataList}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(e, isInactive) => openEditModal(e, isInactive)}
                
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New Tax Percentage"
                
                onRefresh={() => {
                   setSearchText("");
                   setPage(1);
                   setSortConfig({ key: "id", direction: 'asc' });
                   setShowInactive(false);
                   loadData();
                }}
                
                onColumnSelector={() => setColumnModalOpen(true)}
                onToggleInactive={async () => {
                    if (!showInactive) await loadInactive();
                    setShowInactive(!showInactive);
                }}
                
                page={page}
                setPage={setPage}
                totalPages={Math.ceil(totalRecords / limit)}
             />
              </div>
            </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default TaxPercentage;
