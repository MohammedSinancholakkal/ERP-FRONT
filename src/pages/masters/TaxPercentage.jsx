import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  Trash2,
  ArchiveRestore,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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
      const res = await getTaxPercentagesApi(page, limit);
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
  }, [page, limit, showInactive]);

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

  // ================= CLIENT SORT =================
  const sortedList = useMemo(() => {
    let sortableItems = [...dataList];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle numbers
        if (sortConfig.key === 'id' || sortConfig.key === 'percentage') {
             aValue = parseFloat(aValue) || 0;
             bValue = parseFloat(bValue) || 0;
        } else {
             aValue = String(aValue || "").toLowerCase();
             bValue = String(bValue || "").toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [dataList, sortConfig]);

  // ================= ADD =================
  const handleAdd = async () => {
    if (!newItem.percentage) return toast.error("Percentage is required");

    // Check for duplicates
    try {
      const searchRes = await searchTaxPercentageApi(newItem.percentage);
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        // Compare percentages effectively (as strings or floats)
        const existing = rows.find(r => 
           parseFloat(r.percentage || r.Percentage) === parseFloat(newItem.percentage)
        );
        if (existing) return toast.error("This Tax Percentage already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const res = await addTaxPercentageApi({
        percentage: parseFloat(newItem.percentage),
        userId: currentUserId
      });

      if (res?.status === 200) {
        toast.success("Added Successfully");
        setModalOpen(false);
        setNewItem({ percentage: "" });
        loadData();
      } else {
        toast.error("Failed to add");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server Error");
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
    if (!editItem.percentage) return toast.error("Percentage is required");

    // Check for duplicates
    try {
      const searchRes = await searchTaxPercentageApi(editItem.percentage);
      if (searchRes?.status === 200) {
        const rows = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.records || [];
        const existing = rows.find(r => 
           parseFloat(r.percentage || r.Percentage) === parseFloat(editItem.percentage) &&
           (r.id || r.Id) !== editItem.id
        );
        if (existing) return toast.error("This Tax Percentage already exists");
      }
    } catch (err) {
      console.error(err);
      return toast.error("Error checking duplicates");
    }

    try {
      const res = await updateTaxPercentageApi(editItem.id, {
        percentage: parseFloat(editItem.percentage),
        userId: currentUserId
      });
      if (res?.status === 200) {
        toast.success("Updated Successfully");
        setEditModalOpen(false);
        if (showInactive) loadInactive();
        else loadData();
      }
    } catch (error) {
       console.error(error);
       toast.error("Update Failed");
    }
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Delete this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteTaxPercentageApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadData();
      }
    } catch (error) {
       console.error(error);
       toast.error("Delete Failed");
    }
  };

  // ================= RESTORE =================
  const handleRestore = async () => {
    try {
       const res = await restoreTaxPercentageApi(editItem.id, { userId: currentUserId });
       if (res?.status === 200) {
         toast.success("Restored");
         setEditModalOpen(false);
         loadInactive();
         loadData();
       }
    } catch (error) {
        console.error(error);
        toast.error("Restore Failed");
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
             <label className="block text-sm mb-1">Percentage % <span className="text-red-500">*</span></label>
             <input 
               type="number" 
               step="0.01"
               value={newItem.percentage}
               onChange={(e) => setNewItem({ ...newItem, percentage: e.target.value })}
               className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
               placeholder="e.g. 18.00"
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
             <label className="block text-sm mb-1">Percentage % <span className="text-red-500">*</span></label>
             <input 
               type="number" 
               step="0.01"
               value={editItem.percentage}
               onChange={(e) => setEditItem({ ...editItem, percentage: e.target.value })}
               disabled={editItem.isInactive}
               className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded disabled:opacity-50"
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
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
            <div className="flex flex-col h-full overflow-hidden gap-2">
             <h2 className="text-2xl font-semibold mb-4">Tax Percentage</h2>
             
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
                   if (!showInactive) loadData();
                   else loadInactive();
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
        </div>
      </PageLayout>
    </>
  );
};

export default TaxPercentage;
