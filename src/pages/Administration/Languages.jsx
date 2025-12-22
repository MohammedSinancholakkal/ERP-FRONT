import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
} from "lucide-react";

import toast from "react-hot-toast";

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

const Languages = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

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

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // Column Picker
  const defaultColumns = {
    id: true,
    languageId: true,
    languageName: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  const [sortOrder, setSortOrder] = useState("asc");

  // Sorted active rows
  const sortedLanguages = [...languages];
  if (sortOrder === "asc") {
    sortedLanguages.sort((a, b) => a.id - b.id);
  }

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
  const handleDeleteLanguage = async () => {
    const res = await deleteLanguageApi(editLanguage.id, {
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Language deleted");
      setEditModalOpen(false);
      loadLanguages();
      if (showInactive) loadInactive();
    } else {
      toast.error("Delete failed");
    }
  };

  // RESTORE
  const handleRestoreLanguage = async () => {
    const res = await restoreLanguageApi(editLanguage.id, {
      userId: user?.userId || 1,
    });

    if (res?.status === 200) {
      toast.success("Language restored");
      setEditModalOpen(false);
      loadLanguages();
      loadInactive();
    } else {
      toast.error("Failed to restore");
    }
  };

  return (
    <>
      {/* =============================
          ADD LANGUAGE MODAL
      ============================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Language</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1">Language ID *</label>
                <input
                  type="text"
                  value={newLanguage.languageId}
                  onChange={(e) =>
                    setNewLanguage((prev) => ({
                      ...prev,
                      languageId: e.target.value,
                    }))
                  }
                  placeholder="Enter Language ID"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Language Name *</label>
                <input
                  type="text"
                  value={newLanguage.languageName}
                  onChange={(e) =>
                    setNewLanguage((prev) => ({
                      ...prev,
                      languageName: e.target.value,
                    }))
                  }
                  placeholder="Enter Language Name"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAddLanguage}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-sm text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =============================
          EDIT LANGUAGE MODAL
      ============================== */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[600px] bg-gray-900 text-white rounded-lg border border-gray-700">

            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editLanguage.isInactive ? "Restore Language" : "Edit Language"} ({editLanguage.languageName})
              </h2>

              <button onClick={() => setEditModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              <div>
                <label className="block text-sm mb-1">Language ID *</label>
                <input
                  type="text"
                  value={editLanguage.languageId}
                  onChange={(e) =>
                    setEditLanguage((prev) => ({
                      ...prev,
                      languageId: e.target.value,
                    }))
                  }
                  disabled={editLanguage.isInactive}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Language Name *</label>
                <input
                  type="text"
                  value={editLanguage.languageName}
                  onChange={(e) =>
                    setEditLanguage((prev) => ({
                      ...prev,
                      languageName: e.target.value,
                    }))
                  }
                  disabled={editLanguage.isInactive}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>

            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">

              {editLanguage.isInactive ? (
                <button
                  onClick={handleRestoreLanguage}
                  className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
              ) : (
                <button
                  onClick={handleDeleteLanguage}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {!editLanguage.isInactive && (
                <button
                  onClick={handleUpdateLanguage}
                  className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300"
                >
                  <Save size={16} /> Save
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* =============================
              MAIN PAGE
      ============================== */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden"> 

          <h2 className="text-2xl font-semibold mb-4">Languages</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">

            {/* SEARCH */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-60">
              <Search size={16} className="text-gray-300" />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent outline-none pl-2 text-gray-200 w-full text-sm"
              />
            </div>

            {/* ADD */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm hover:bg-gray-600"
            >
              <Plus size={16} /> New Language
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadLanguages();
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            {/* INACTIVE */}
            <button
              onClick={async () => {
                if (!showInactive) await loadInactive();
                setShowInactive(!showInactive);
              }}
              className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-80">Inactive</span>
            </button>

          </div>

          {/* ==========================
                  TABLE
          =========================== */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-auto">

              <table className="w-[600px] text-left border-separate border-spacing-y-1 text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white">

                    {/* ID */}
                    {visibleColumns.id && (
                      <th
                        className="pb-1 border-b border-white text-center cursor-pointer select-none"
                        onClick={() => setSortOrder(sortOrder === "asc" ? null : "asc")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {sortOrder === "asc" && <span>▲</span>}
                          {sortOrder === null && <span className="opacity-40">⬍</span>}
                          <span>ID</span>
                        </div>
                      </th>
                    )}

                    {/* LANGUAGE ID */}
                    {visibleColumns.languageId && (
                      <th className="pb-1 border-b border-white text-center">Language ID</th>
                    )}

                    {/* LANGUAGE NAME */}
                    {visibleColumns.languageName && (
                      <th className="pb-1 border-b border-white text-center">Language Name</th>
                    )}

                  </tr>
                </thead>

                <tbody>

                  {/* ACTIVE ROWS */}
                  {sortedLanguages.map((l) => (
                    <tr
                      key={l.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer rounded shadow-sm"
                      onClick={() => {
                        setEditLanguage({
                          id: l.id,
                          languageId: l.languageId,
                          languageName: l.languageName,
                          isInactive: false,
                        });
                        setEditModalOpen(true);
                      }}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-1 text-center">{l.id}</td>
                      )}

                      {visibleColumns.languageId && (
                        <td className="px-2 py-1 text-center">{l.languageId}</td>
                      )}

                      {visibleColumns.languageName && (
                        <td className="px-2 py-1 text-center">{l.languageName}</td>
                      )}
                    </tr>
                  ))}

                  {/* INACTIVE ROWS */}
                  {showInactive &&
                    inactiveLanguages.map((l) => (
                      <tr
                        key={`inactive-${l.id}`}
                        className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                        onClick={() => {
                          setEditLanguage({
                            id: l.id,
                            languageId: l.languageId,
                            languageName: l.languageName,
                            isInactive: true,
                          });
                          setEditModalOpen(true);
                        }}
                      >
                        {visibleColumns.id && (
                          <td className="px-2 py-1 text-center">{l.id}</td>
                        )}

                        {visibleColumns.languageId && (
                          <td className="px-2 py-1 text-center">{l.languageId}</td>
                        )}

                        {visibleColumns.languageName && (
                          <td className="px-2 py-1 text-center">{l.languageName}</td>
                        )}
                      </tr>
                    ))}

                </tbody>
              </table>

            </div>
          </div>

 {/* PAGINATION */}
           
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                // onRefresh={handleRefresh}
              />
        </div>
        </div>
</PageLayout>
        
    </>
  );
};

export default Languages;



