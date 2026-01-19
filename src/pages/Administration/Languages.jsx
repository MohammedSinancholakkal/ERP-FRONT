import React, { useState, useEffect } from "react";
import {
  X,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";


import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

// API
import {
  addLanguageApi,
  getLanguagesApi,
  updateLanguageApi,
  deleteLanguageApi,
  searchLanguageApi,
  getInactiveLanguagesApi,
  restoreLanguageApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import InputField from "../../components/InputField";
import ContentCard from "../../components/ContentCard";

const Languages = () => {
  const { theme } = useTheme();
  if (!hasPermission(PERMISSIONS.LANGUAGES.VIEW)) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  const [languages, setLanguages] = useState([]);
  const [inactiveLanguages, setInactiveLanguages] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [newLanguage, setNewLanguage] = useState({
    languageId: "",
    languageName: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLanguage, setEditLanguage] = useState({
    id: null,
    languageId: "",
    languageName: "",
    isInactive: false,
  });

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchText, setSearchText] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  // Column Picker
  const defaultColumns = {
    id: true,
    languageId: true,
    languageName: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  // Sorted active rows
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLanguages = React.useMemo(() => {
    let sortableItems = [...languages];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
         if (typeof aValue === 'string') aValue = aValue.toLowerCase();
         if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [languages, sortConfig]);

  // LOAD ACTIVE LANGUAGES
  const loadLanguages = async () => {
    setSearchText("");
    const res = await getLanguagesApi(page, limit);
    if (res?.status === 200) {
      setLanguages(res.data.records);
      setTotalRecords(res.data.total);
    } else {
      toast.error("Failed to load languages");
    }
  };

  useEffect(() => {
    loadLanguages();
  }, [page, limit]);

  // LOAD INACTIVE
  const loadInactive = async () => {
    const res = await getInactiveLanguagesApi();
    if (res?.status === 200) {
      setInactiveLanguages(res.data.records);
    } else {
      toast.error("Failed to load inactive languages");
    }
  };

  // SEARCH
  const handleSearch = async (text) => {
    setSearchText(text);
    if (text.trim() === "") return loadLanguages();

    const res = await searchLanguageApi(text);
    if (res?.status === 200) {
      setLanguages(res.data);
    }
  };

  // ADD
  const handleAddLanguage = async () => {
    const { languageId, languageName } = newLanguage;

    if (!languageId.trim() || !languageName.trim()) {
      return toast.error("Both fields required");
    }

    // Check duplicates (Name)
    try {
        const searchRes = await searchLanguageApi(languageName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.LanguageName || r.languageName).toLowerCase() === languageName.trim().toLowerCase()
            );
            if (existing) return toast.error("Language name already exists");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    // Check duplicates (ID)
    try {
        const searchRes = await searchLanguageApi(languageId.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.LanguageId || r.languageId).toLowerCase() === languageId.trim().toLowerCase()
            );
            if (existing) return toast.error("Language ID already exists");
        }
    } catch(err) {
        console.error(err);
    }

    const res = await addLanguageApi({
      languageId,
      languageName,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Language added");
      setNewLanguage({ languageId: "", languageName: "" });
      setModalOpen(false);
      loadLanguages();
    } else {
      toast.error("Failed to add language");
    }
  };

  // UPDATE
  const handleUpdateLanguage = async () => {
    const { languageId, languageName } = editLanguage;

    if (!languageId.trim() || !languageName.trim()) {
      return toast.error("Both fields required");
    }

    // Check duplicates (Name)
    try {
        const searchRes = await searchLanguageApi(languageName.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.LanguageName || r.languageName).toLowerCase() === languageName.trim().toLowerCase() &&
                (r.Id || r.id) !== editLanguage.id
            );
            if (existing) return toast.error("Language name already exists");
        }
    } catch(err) {
        console.error(err);
        return toast.error("Error checking duplicates");
    }

    // Check duplicates (ID)
    try {
        const searchRes = await searchLanguageApi(languageId.trim());
        if (searchRes?.status === 200) {
            const rows = searchRes.data || [];
            const existing = rows.find(r => 
                (r.LanguageId || r.languageId).toLowerCase() === languageId.trim().toLowerCase() &&
                (r.Id || r.id) !== editLanguage.id
            );
            if (existing) return toast.error("Language ID already exists");
        }
    } catch(err) {
        console.error(err);
    }

    const res = await updateLanguageApi(editLanguage.id, {
      languageId,
      languageName,
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Language updated");
      setEditModalOpen(false);
      loadLanguages();
      if (showInactive) loadInactive();
    } else {
      toast.error("Update failed");
    }
  };

  // DELETE
  // DELETE
  const handleDeleteLanguage = async () => {
    const result = await showDeleteConfirm("this language");

    if (!result.isConfirmed) return;

    try {
      const res = await deleteLanguageApi(editLanguage.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        showSuccessToast("Language deleted successfully.");
        setEditModalOpen(false);
        loadLanguages();
        if (showInactive) loadInactive();
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      showErrorToast("Failed to delete language.");
    }
  };

  // RESTORE
  // RESTORE
  const handleRestoreLanguage = async () => {
    const result = await showRestoreConfirm("this language");

    if (!result.isConfirmed) return;

    try {
      const res = await restoreLanguageApi(editLanguage.id, {
        userId: user?.userId || 1,
      });

      if (res?.status === 200) {
        showSuccessToast("Language restored successfully.");
        setEditModalOpen(false);
        loadLanguages();
        loadInactive();
      } else {
        throw new Error("Restore failed");
      }
    } catch {
      showErrorToast("Failed to restore language.");
    }
  };

  return (
    <>
      {/* =============================
          ADD LANGUAGE MODAL
      ============================== */}
      {/* =============================
          ADD LANGUAGE MODAL
      ============================== */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddLanguage}
        title="New Language"
        width="700px"
        permission={hasPermission(PERMISSIONS.LANGUAGES.CREATE)}
      >
        <div className="p-0 space-y-4">
          <div>
            <InputField
              label="Language ID"
              value={newLanguage.languageId}
              onChange={(e) =>
                setNewLanguage((prev) => ({
                  ...prev,
                  languageId: e.target.value,
                }))
              }
              placeholder="Enter Language ID"
              required
            />
          </div>

          <div>
            <InputField
              label="Language Name"
              value={newLanguage.languageName}
              onChange={(e) =>
                setNewLanguage((prev) => ({
                  ...prev,
                  languageName: e.target.value,
                }))
              }
              placeholder="Enter Language Name"
              required
            />
          </div>
        </div>
      </AddModal>

      {/* =============================
          EDIT LANGUAGE MODAL
      ============================== */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateLanguage}
        onDelete={handleDeleteLanguage}
        onRestore={handleRestoreLanguage}
        isInactive={editLanguage.isInactive}
        title={`${
          editLanguage.isInactive ? "Restore Language" : "Edit Language"
        } (${editLanguage.languageName})`}
        permissionDelete={hasPermission(PERMISSIONS.LANGUAGES.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.LANGUAGES.EDIT)}
        width="700px"
      >
        <div className="p-0 space-y-4">
          <div>
            <InputField
              label="Language ID"
              value={editLanguage.languageId}
              onChange={(e) =>
                setEditLanguage((prev) => ({
                  ...prev,
                  languageId: e.target.value,
                }))
              }
              disabled={editLanguage.isInactive}
              required
            />
          </div>

          <div>
            <InputField
              label="Language Name"
              value={editLanguage.languageName}
              onChange={(e) =>
                setEditLanguage((prev) => ({
                  ...prev,
                  languageName: e.target.value,
                }))
              }
              disabled={editLanguage.isInactive}
              required
            />
          </div>
        </div>
      </EditModal>


      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* =============================
              MAIN PAGE
      ============================== */}

      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Languages</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.languageId && { key: "languageId", label: "Language ID", sortable: true },
                    visibleColumns.languageName && { key: "languageName", label: "Language Name", sortable: true },
                ].filter(Boolean)}
                data={sortedLanguages}
                inactiveData={inactiveLanguages}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(r, isInactive) => {
                    setEditLanguage({
                        id: r.id,
                        languageId: r.languageId,
                        languageName: r.languageName,
                        isInactive: isInactive,
                    });
                    setEditModalOpen(true);
                }}
                // Action Bar
                search={searchText}
                onSearch={handleSearch}
                onCreate={() => setModalOpen(true)}
                createLabel="New Language"
                permissionCreate={hasPermission(PERMISSIONS.LANGUAGES.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    loadLanguages();
                }}
                onColumnSelector={() => {
                    setColumnModalOpen(true); 
                }}
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
              />
          </div>
          </ContentCard>
        </div>
      </PageLayout>

        
    </>
  );
};

export default Languages;