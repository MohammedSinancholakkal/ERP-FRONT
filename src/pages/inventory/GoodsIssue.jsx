// src/pages/inventory/GoodsIssue.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Star,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  getGoodsIssuesApi,
  getInactiveGoodsIssuesApi,
  deleteGoodsIssueApi,
  restoreGoodsIssueApi,
  getCustomersApi,
  getSalesApi,
  getEmployeesApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

const GoodsIssue = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = userData?.userId || userData?.id || userData?.Id;

const openEdit = (row, isInactive = false) => {
  navigate(`/app/inventory/goodsissue/edit/${row.id}`, {
    state: {
      mode: isInactive ? "restore" : "edit"
    }
  });
};






  /* --------------------------- Column Picker --------------------------- */
  const defaultColumns = {
    id: true,
    customer: true,
    saleInvoice: true,
    date: true,
    time: true,
    totalQuantity: true,
    employee: true,
    remarks: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  /* ------------------------------- Filters ------------------------------- */
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterInvoice, setFilterInvoice] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  
  const [searchText, setSearchText] = useState("");
  
  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };



  /* ------------------------------- Data ------------------------------- */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveRows, setInactiveRows] = useState([]);

  const location = useLocation();
  const { id } = useParams();

const mode = location.state?.mode || "edit";
const isRestoreMode = mode === "restore";
const readOnly = isRestoreMode;


  /* ------------------------------ Pagination ------------------------------ */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [serverTotal, setServerTotal] = useState(0);

  const totalRecords = serverTotal;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  /* -------------------- helper to safely read multiple possible keys -------------------- */
  const get = (obj, ...keys) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) {
        return obj[k];
      }
      // also try lowercase/uppercase alternate variations
      const alt = Object.keys(obj).find(
        (actual) => actual.toLowerCase() === String(k).toLowerCase()
      );
      if (alt && obj[alt] != null) return obj[alt];
    }
    return undefined;
  };

  const filteredRows = React.useMemo(() => {
    let list = rows;

    // 🔍 Action bar global search
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      list = list.filter(r =>
        String(r.id).toLowerCase().includes(s) ||
          (r.customer || "").toLowerCase().includes(s) ||
          (r.saleInvoice || "").toLowerCase().includes(s) ||
          (r.employee || "").toLowerCase().includes(s) ||
          (r.remarks || "").toLowerCase().includes(s));
    }

    // 🎯 Filter bar fields
    if (filterCustomer) list = list.filter(r => (r.customer || "").toLowerCase().includes(filterCustomer.toLowerCase()));
    if (filterInvoice) list = list.filter(r => (r.saleInvoice || "").toLowerCase().includes(filterInvoice.toLowerCase()));
    if (filterEmployee) list = list.filter(r => (r.employee || "").toLowerCase().includes(filterEmployee.toLowerCase()));

    return list;
  }, [rows, searchText, filterCustomer, filterInvoice, filterEmployee]);

    // --- SORTING LOGIC ---
  const sortedList = React.useMemo(() => {
    let sortableItems = [...filteredRows];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        if (['id', 'totalQuantity'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else {
             // String comparison
             aValue = String(aValue || "").toLowerCase();
             bValue = String(bValue || "").toLowerCase();
        }

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
  }, [filteredRows, sortConfig]);

  // --- FILTER BAR CONFIG ---
  const filters = [
      {
          type: 'select',
          value: filterCustomer,
          onChange: setFilterCustomer,
          options: [...new Set(rows.map(r => r.customer))].map(c => ({ id: c, name: c })),
          placeholder: "All Customers"
      },
      {
          type: 'select',
          value: filterInvoice,
          onChange: setFilterInvoice,
          options: [...new Set(rows.map(r => r.saleInvoice))].map(i => ({ id: i, name: i })),
          placeholder: "All Invoices"
      },
      {
          type: 'select',
          value: filterEmployee,
          onChange: setFilterEmployee,
          options: [...new Set(rows.map(r => r.employee))].map(e => ({ id: e, name: e })),
          placeholder: "All Employees"
      }
  ];

  const handleClearFilters = () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterInvoice("");
    setFilterEmployee("");
    setSortConfig({ key: null, direction: 'asc' });
  };

  /* ------------------------------ Fetchers ------------------------------ */
  const fetchGoodsIssues = async () => {
    try {
      setLoading(true);
      const res = await getGoodsIssuesApi(page, limit);

      // tolerate various response shapes
      const records = Array.isArray(res?.data?.records)
        ? res.data.records
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const totalFromResp = res?.data?.total ?? res?.data?.totalRecords ?? null;
      setServerTotal(totalFromResp ?? records.length);

      const normalized = records.map((r) => {
        const issueDate = get(r, "Date", "date", "InsertDate", "insertDate");

        const parsedDate = issueDate ? new Date(issueDate) : null;
        const isoDate = parsedDate && !isNaN(parsedDate)
          ? parsedDate.toISOString().split("T")[0]
          : "-";

        const timeStr = parsedDate && !isNaN(parsedDate)
          ? parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "-";

        const saleInvoice =
          get(r, "SaleInvoice", "saleInvoice") ||
          get(r, "VNo", "vno", "Vno") ||
          get(r, "vNo") ||
          get(r, "invoiceNo", "InvoiceNo") ||
          "-";

        const customer =
          get(r, "CustomerName", "customerName") ||
          get(r, "Customer", "customer") ||
          get(r, "Name", "name") ||
          "-";

        const employee =
          get(r, "EmployeeName", "employeeName") ||
          get(r, "Employee", "employee") ||
          get(r, "FirstName", "firstName") ||
          "-";

        const totalQuantity =
          get(r, "TotalQuantity", "totalQuantity", "TotalQty", "total_qty") ?? 0;

        const id = get(r, "id", "Id");

        return {
          id,
          customer,
          saleInvoice,
          date: isoDate,
          time: timeStr,
          totalQuantity,
          employee,
          remarks: get(r, "Remarks", "remarks", "Details") || "-",
          isActive: get(r, "IsActive") === 0 ? false : true,
          // keep raw object for debugging if needed
          __raw: r,
        };
      });

      setRows(normalized);
    } catch (error) {
      console.error("Error fetching goods issues", error);
      toast.error("Failed to load goods issues");
      // keep rows unchanged on error
    } finally {
      setLoading(false);
    }
  };

const fetchInactiveGoodsIssues = async () => {
  try {
    // setLoading(true) // Clean loading - no spinner for inactive append

    const res = await getInactiveGoodsIssuesApi()

    if (res.status !== 200) {
      throw new Error('Non-200 response')
    }

    const records = Array.isArray(res?.data?.records)
      ? res.data.records
      : []

    setServerTotal(records.length)

    const normalized = records.map((r) => {
      const issueDate = get(r, "Date", "date", "InsertDate", "insertDate")
      const parsedDate = issueDate ? new Date(issueDate) : null

      return {
        id: get(r, "Id", "id"),
        customer: get(r, "CustomerName", "customerName") || "-",
       saleInvoice:
  get(r, "SaleInvoice", "saleInvoice", "VNo", "vNo") || "-",
        date:
          parsedDate && !isNaN(parsedDate)
            ? parsedDate.toISOString().split("T")[0]
            : "-",
        time:
          parsedDate && !isNaN(parsedDate)
            ? parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "-",
        totalQuantity: get(r, "TotalQuantity", "totalQuantity") ?? 0,
        employee: get(r, "EmployeeName", "employeeName") || "-",
        remarks: get(r, "Remarks", "remarks") || "-",
        isActive: false,
        __raw: r
      }
    })



    setInactiveRows(normalized)
    // setRows(normalized) // DO NOT REPLACE ACTIVE ROWS
  } catch (error) {
    console.error("Inactive goods issue fetch failed:", error)
    toast.error("Inactive goods issues not available")
    setInactiveRows([])
  } finally {
    // setLoading(false)
  }
}



const handleRestoreIssue = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This goods issue will be restored!",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

  try {
    const res = await restoreGoodsIssueApi(id, { userId });

    if (res.status === 200) {
      toast.success("Restored successfully");
      await fetchGoodsIssues();
      if(showInactive) await fetchInactiveGoodsIssues();
    } else {
      toast.error("Restore failed");
    }
  } catch (error) {
    console.error("RESTORE ERROR", error);
    toast.error("Error restoring goods issue");
  }
};



  useEffect(() => {
    fetchGoodsIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    if (showInactive) {
      fetchInactiveGoodsIssues();
    }
  }, [showInactive]);

  /* ------------------------------ Add Modal ------------------------------ */
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [newIssue, setNewIssue] = useState({
    date: today,
    time: currentTime,
    customer: "",
    saleInvoice: "",
    totalQuantity: "",
    employee: "",
    remarks: "",
  });

  /* ------------------------------ Render ------------------------------ */
  return (
    <>
      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Goods Issue</h2>

            {/* ACTION BAR (Same as Goods Receipt) */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Search */}
              <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-64">
                <Search size={16} className="text-gray-300" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search goods issues..."
                  className="bg-transparent pl-2 text-sm w-full outline-none"
                />
              </div>
              
              {hasPermission(PERMISSIONS.INVENTORY.GOODS_ISSUE.CREATE) && (
              <button
                onClick={() => navigate("/app/inventory/goodsissue/newgoodsissue")}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
              >
                <Plus size={16} /> New Issue
              </button>
              )}

              {/* Refresh */}
              <button
                onClick={() => {
                  setSearchText("");
                  setFilterCustomer("");
                  setFilterInvoice("");
                  setFilterDate("");
                  setFilterTime("");
                  setFilterEmployee("");
                  fetchGoodsIssues();
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <RefreshCw size={16} className="text-blue-400" />
              </button>

              {/* Column Picker */}
              <button
                onClick={() => {
                  setTempVisibleColumns(visibleColumns);
                  setColumnModalOpen(true);
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <List size={16} className="text-blue-300" />
              </button>

              {/* Show Inactive */}
              <button
                onClick={async () => {
                  // if (!showInactive) await fetchInactiveGoodsIssues(); // Handled by useEffect
                  setShowInactive((s) => !s);
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded flex items-center gap-2 hover:bg-gray-600"
              >
                <ArchiveRestore size={16} className="text-yellow-400" />
                <span className="text-xs text-gray-300">
                Inactive
                </span>
              </button>
            </div>

            {/* FILTER BAR */}
            <div className="mb-4">
               <FilterBar filters={filters} onClear={handleClearFilters} />
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto w-full min-h-0">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1500px] border-separate border-spacing-y-1 text-sm table-fixed">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr>
                       {visibleColumns.id && <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />}
                       {visibleColumns.customer && <SortableHeader label="Customer" sortKey="customer" currentSort={sortConfig} onSort={handleSort} />}
                       {visibleColumns.saleInvoice && <SortableHeader label="Sales Invoice" sortKey="saleInvoice" currentSort={sortConfig} onSort={handleSort} />}
                       {visibleColumns.date && <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />}
                       {visibleColumns.time && <SortableHeader label="Time" sortKey="time" currentSort={sortConfig} onSort={handleSort} />}
                       {visibleColumns.totalQuantity && <SortableHeader label="Total Qty" sortKey="totalQuantity" currentSort={sortConfig} onSort={handleSort} />}
                       {visibleColumns.employee && <SortableHeader label="Employee" sortKey="employee" currentSort={sortConfig} onSort={handleSort} />}
                       {visibleColumns.remarks && <th className="px-4 py-2 font-semibold">Remarks</th>}
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {!loading && sortedList.length > 0 ? (
                        sortedList.slice(start - 1, end).map((r) => (
                          <tr
                            key={r.id}
                            className={`bg-gray-900 cursor-pointer transition-colors ${!r.isActive ? 'opacity-40 line-through' : 'hover:bg-gray-700'}`}
                            onClick={() => openEdit(r, !r.isActive)}
                          >
                           {visibleColumns.id && <td className="px-2 py-3">{r.id}</td>}
                           {visibleColumns.customer && <td>{r.customer}</td>}
                           {visibleColumns.saleInvoice && <td>{r.saleInvoice}</td>}
                           {visibleColumns.date && <td>{r.date}</td>}
                           {visibleColumns.time && <td>{r.time}</td>}
                           {visibleColumns.totalQuantity && <td>{String(r.totalQuantity)}</td>}
                           {visibleColumns.employee && <td>{r.employee}</td>}
                           {visibleColumns.remarks && <td>{r.remarks}</td>}
                          </tr>
                        ))
                    ) : (
                      !showInactive && (
                        <tr>
                          <td colSpan={10} className="px-4 py-6 text-center text-gray-400">
                            No records found
                          </td>
                        </tr>
                      )
                    )}
                    {/* INACTIVE ROWS APPENDED */}
                    {showInactive && inactiveRows.map((r) => (
                      <tr
                        key={`inactive-${r.id}`}
                        className="bg-gray-900 cursor-pointer opacity-50 line-through hover:bg-gray-800"
                        onClick={() => handleRestoreIssue(r.id)}
                      >
                           {visibleColumns.id && <td className="px-2 py-3">{r.id}</td>}
                           {visibleColumns.customer && <td>{r.customer}</td>}
                           {visibleColumns.saleInvoice && <td>{r.saleInvoice}</td>}
                           {visibleColumns.date && <td>{r.date}</td>}
                           {visibleColumns.time && <td>{r.time}</td>}
                           {visibleColumns.totalQuantity && <td>{String(r.totalQuantity)}</td>}
                           {visibleColumns.employee && <td>{r.employee}</td>}
                           {visibleColumns.remarks && <td>{r.remarks}</td>}
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
                total={serverTotal}
                onRefresh={fetchGoodsIssues}
              />
          </div>
        </div>

        {/* ---------------- COLUMN PICKER MODAL ---------------- */}
        {columnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setColumnModalOpen(false)}
            />

            <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
              {/* Header */}
              <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Column Picker</h2>
                <button
                  onClick={() => setColumnModalOpen(false)}
                  className="text-gray-300 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="px-5 py-3">
                <input
                  type="text"
                  placeholder="Search column..."
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Columns */}
              <div className="grid grid-cols-2 gap-5 px-5 pb-5">
                {/* Visible */}
                <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                  <h3 className="font-semibold mb-2">Visible Columns</h3>

                  <div className="space-y-2">
                    {Object.keys(tempVisibleColumns)
                      .filter((col) => tempVisibleColumns[col])
                      .filter((col) => col.includes(columnSearch))
                      .map((col) => (
                        <div
                          key={col}
                          className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                        >
                          <span>{col}</span>
                          <button
                            className="text-red-400"
                            onClick={() =>
                              setTempVisibleColumns((p) => ({ ...p, [col]: false }))
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Hidden */}
                <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                  <h3 className="font-semibold mb-2">Hidden Columns</h3>

                  <div className="space-y-2">
                    {Object.keys(tempVisibleColumns)
                      .filter((col) => !tempVisibleColumns[col])
                      .filter((col) => col.includes(columnSearch))
                      .map((col) => (
                        <div
                          key={col}
                          className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                        >
                          <span>{col}</span>
                          <button
                            className="text-green-400"
                            onClick={() =>
                              setTempVisibleColumns((p) => ({ ...p, [col]: true }))
                            }
                          >
                            ➕
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-5 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
                <button
                  onClick={() => setTempVisibleColumns(defaultColumns)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Restore Defaults
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setColumnModalOpen(false)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      setVisibleColumns(tempVisibleColumns);
                      setColumnModalOpen(false);
                    }}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default GoodsIssue;


