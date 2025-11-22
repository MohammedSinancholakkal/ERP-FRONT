import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getServicesApi,
  addServiceApi,
  updateServiceApi,
  deleteServiceApi,
  searchServiceApi,
} from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";

const Services = () => {
  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  // data
  const [services, setServices] = useState([]);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // add form
  const [newService, setNewService] = useState({
    ServiceName: "",
    Charge: "",
    Description: "",
    Tax: "",
  });

  // edit form
  const [editData, setEditData] = useState({
    id: null,
    ServiceName: "",
    Charge: "",
    Description: "",
    Tax: "",
  });

  // column picker
  const defaultColumns = {
    id: true,
    ServiceName: true,
    Charge: true,
    Description: true,
    Tax: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [searchColumn, setSearchColumn] = useState("");

  // search
  const [searchText, setSearchText] = useState("");

  const toggleColumn = (col) =>
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));

  const restoreDefaultColumns = () => setVisibleColumns(defaultColumns);

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  const [sortOrder, setSortOrder] = useState("asc");
  const sortedServices = [...services];

  if (sortOrder === "asc") {
    sortedServices.sort((a, b) => a.id - b.id);
  }
  
  // load services
  const loadServices = async () => {
    try {
      // Search mode → disable pagination
      if (searchText.trim()) {
        const res = await searchServiceApi(searchText.trim());
        if (res?.status === 200) {
          setServices(res.data);
          setTotalRecords(res.data.length);
        }
        return;
      }

      const res = await getServicesApi(page, limit);

      if (res?.status === 200) {
        const { records = [], total = 0 } = res.data;
        setServices(records);
        setTotalRecords(total);
      } else toast.error("Failed to load services");
    } catch (err) {
      console.error("Load Error:", err);
      toast.error("Server Error");
    }
  };

  useEffect(() => {
    loadServices();
  }, [page, limit]);

  // search
  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      setPage(1);
      loadServices();
      return;
    }

    const res = await searchServiceApi(value.trim());
    if (res?.status === 200) {
      setServices(res.data);
      setTotalRecords(res.data.length);
    }
  };

  // add
  const handleAdd = async () => {
    if (!newService.ServiceName.trim() || newService.Charge === "")
      return toast.error("Required fields missing");

    try {
      const res = await addServiceApi({
        ...newService,
        userId: currentUserId,
      });

      if (res?.status === 201) {
        toast.success("Service added");
        setModalOpen(false);
        setNewService({
          ServiceName: "",
          Charge: "",
          Description: "",
          Tax: "",
        });
        loadServices();
      } else toast.error("Add failed");
    } catch (err) {
      console.error("Add Error:", err);
      toast.error("Server Error");
    }
  };

  // edit
  const openEditModal = (item) => {
    setEditData({
      id: item.id,
      ServiceName: item.ServiceName,
      Charge: item.Charge,
      Description: item.Description,
      Tax: item.Tax,
    });
    setEditModalOpen(true);
  };

  // update
  const handleUpdate = async () => {
    if (!editData.ServiceName.trim() || editData.Charge === "")
      return toast.error("Required fields missing");

    try {
      const res = await updateServiceApi(editData.id, {
        ...editData,
        userId: currentUserId,
      });

      if (res?.status === 200) {
        toast.success("Updated");
        setEditModalOpen(false);
        loadServices();
      } else toast.error("Update failed");
    } catch (err) {
      console.error("Update Error:", err);
      toast.error("Server Error");
    }
  };

  // delete
  const handleDelete = async () => {
    try {
      const res = await deleteServiceApi(editData.id, { userId: currentUserId });

      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        loadServices();
      } else toast.error("Delete failed");
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("Server Error");
    }
  };

  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Service</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm">Service Name *</label>
                <input
                  type="text"
                  value={newService.ServiceName}
                  onChange={(e) =>
                    setNewService((p) => ({
                      ...p,
                      ServiceName: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">Charge *</label>
                <input
                  type="number"
                  value={newService.Charge}
                  onChange={(e) =>
                    setNewService((p) => ({
                      ...p,
                      Charge: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">Description</label>
                <textarea
                  value={newService.Description}
                  onChange={(e) =>
                    setNewService((p) => ({
                      ...p,
                      Description: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 h-20"
                ></textarea>
              </div>

              <div>
                <label className="text-sm">Tax (%)</label>
                <input
                  type="number"
                  value={newService.Tax}
                  onChange={(e) =>
                    setNewService((p) => ({
                      ...p,
                      Tax: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[650px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                Edit Service ({editData.ServiceName})
              </h2>
              <button onClick={() => setEditModalOpen(false)}>
                <X size={20} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 gap-4">
              <input
                type="text"
                value={editData.ServiceName}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, ServiceName: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              />

              <input
                type="number"
                value={editData.Charge}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, Charge: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              />

              <textarea
                value={editData.Description}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, Description: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 h-20"
              ></textarea>

              <input
                type="number"
                value={editData.Tax}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, Tax: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded border border-red-900"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded border border-gray-600 text-blue-300"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 text-white min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Services</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          {/* SEARCH */}
          <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              className="bg-transparent pl-2 w-full text-sm text-gray-200 outline-none"
              placeholder="search..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* NEW SERVICE */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-gray-700 px-3 py-1.5 border border-gray-600 rounded text-sm hover:bg-gray-600"
          >
            <Plus size={16} /> New Service
          </button>

          {/* REFRESH */}
          <button
            onClick={() => {
              setSearchText("");
              setPage(1);
              loadServices();
            }}
            className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <RefreshCw className="text-blue-400" size={16} />
          </button>

          {/* COLUMN PICKER */}
          <button
            onClick={() => setColumnModal(true)}
            className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <List className="text-blue-300" size={16} />
          </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
  <div className="w-full overflow-auto">
    <table className="w-[700px] text-left border-separate border-spacing-y-1 text-sm">
      <thead className="sticky top-0 bg-gray-900 z-10">
        <tr className="text-white">

          {visibleColumns.id && (
            <SortableHeader
              label="ID"
              sortOrder={sortOrder}
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? null : "asc"))
              }
            />
          )}

          {visibleColumns.ServiceName && (
            <th className="pb-1 border-b border-white text-center">
              Service Name
            </th>
          )}

          {visibleColumns.Charge && (
            <th className="pb-1 border-b border-white text-center">
              Charge
            </th>
          )}

          {visibleColumns.Description && (
            <th className="pb-1 border-b border-white text-center">
              Description
            </th>
          )}

          {visibleColumns.Tax && (
            <th className="pb-1 border-b border-white text-center">
              Tax %
            </th>
          )}

        </tr>
      </thead>

      <tbody>
        {sortedServices.length === 0 && (
          <tr>
            <td
              colSpan={Object.values(visibleColumns).filter(Boolean).length}
              className="text-center py-4 text-gray-400"
            >
              No records found
            </td>
          </tr>
        )}

        {sortedServices.map((item) => (
          <tr
            key={item.id}
            className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
            onClick={() => openEditModal(item)}
          >
            {visibleColumns.id && (
              <td className="px-2 py-1 text-center">{item.id}</td>
            )}

            {visibleColumns.ServiceName && (
              <td className="px-2 py-1 text-center">
                {item.ServiceName}
              </td>
            )}

            {visibleColumns.Charge && (
              <td className="px-2 py-1 text-center">
                ₹ {item.Charge}
              </td>
            )}

            {visibleColumns.Description && (
              <td className="px-2 py-1 text-center">
                {item.Description}
              </td>
            )}

            {visibleColumns.Tax && (
              <td className="px-2 py-1 text-center">
                {item.Tax}%
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


        {/* PAGINATION BAR — STATES STYLE */}
        <div className="mt-5 sticky bottom-0 bg-gray-900/90 px-4 py-2 border-t border-gray-700 z-20">
          <div className="flex flex-wrap items-center gap-3 bg-transparent rounded text-sm">
            {/* LIMIT DROPDOWN */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {/* FIRST PAGE */}
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* PREVIOUS PAGE */}
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>

            {/* PAGE INPUT */}
            <span>Page</span>
            <input
              type="number"
              className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              value={page}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalPages) setPage(val);
              }}
            />
            <span>/ {totalPages}</span>

            {/* NEXT PAGE */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>

            {/* LAST PAGE */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
            >
              <ChevronsRight size={16} />
            </button>

            {/* REFRESH */}
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
                loadServices();
              }}
              className="p-1 bg-gray-800 border border-gray-700 rounded"
            >
              <RefreshCw size={16} />
            </button>

            {/* SHOWING COUNT */}
            <span>
              Showing <b>{start <= totalRecords ? start : 0}</b> to <b>{end}</b>{" "}
              of <b>{totalRecords}</b> records
            </span>
          </div>
        </div>
      </div>

      {/* COLUMN PICKER */}
      {columnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[700px] bg-gray-900 text-white rounded-lg border border-gray-700">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModal(false)}>
                <X size={22} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="search columns..."
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
                className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible Columns */}
              <div className="bg-gray-800/40 p-4 rounded border border-gray-700">
                <h3 className="font-medium mb-3">Visible Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((col) => visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-700 p-2 rounded mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        onClick={() => toggleColumn(col)}
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden Columns */}
              <div className="bg-gray-800/40 p-4 rounded border border-gray-700">
                <h3 className="font-medium mb-3">Hidden Columns</h3>
                {Object.keys(visibleColumns)
                  .filter((col) => !visibleColumns[col])
                  .filter((col) => col.includes(searchColumn))
                  .map((col) => (
                    <div
                      key={col}
                      className="flex justify-between bg-gray-700 p-2 rounded mb-2"
                    >
                      <span>{col.toUpperCase()}</span>
                      <button
                        onClick={() => toggleColumn(col)}
                        className="text-green-400"
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-between px-5 py-3 border-t border-gray-700">
              <button
                onClick={restoreDefaultColumns}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModal(false)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
                <button
                  onClick={() => setColumnModal(false)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Services;
