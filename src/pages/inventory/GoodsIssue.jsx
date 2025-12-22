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
import toast from "react-hot-toast";
import {
  getGoodsIssuesApi,
  getInactiveGoodsIssuesApi,
  deleteGoodsIssueApi,
  restoreGoodsIssueApi,
  getCustomersApi,
  getSalesApi,
  getEmployeesApi,
} from "../../services/allAPI";

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
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const [searchText, setSearchText] = useState("");

  /* -------------------- Dropdown Refs -------------------- */
  const dropdownRefs = {
    customer: useRef(null),
    saleInvoice: useRef(null),
    employee: useRef(null),
  };

  const [dropdownOpen, setDropdownOpen] = useState({
    customer: false,
    saleInvoice: false,
    employee: false,
  });

  const [ddSearch, setDdSearch] = useState({
    customer: "",
    saleInvoice: "",
    employee: "",
  });

  useEffect(() => {
    const handler = (e) => {
      Object.keys(dropdownRefs).forEach((k) => {
        if (
          dropdownRefs[k].current &&
          !dropdownRefs[k].current.contains(e.target)
        ) {
          setDropdownOpen((p) => ({ ...p, [k]: false }));
        }
      });
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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

  const filteredRows = rows.filter((r) => {
    let ok = true;

    // 🔍 Action bar global search
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      ok =
        ok &&
        (String(r.id).toLowerCase().includes(s) ||
          (r.customer || "").toLowerCase().includes(s) ||
          (r.saleInvoice || "").toLowerCase().includes(s) ||
          (r.employee || "").toLowerCase().includes(s) ||
          (r.remarks || "").toLowerCase().includes(s));
    }

    // 🎯 Filter bar fields
    if (filterCustomer)
      ok =
        ok &&
        (r.customer || "").toLowerCase().includes(filterCustomer.toLowerCase());

    if (filterInvoice)
      ok =
        ok &&
        (r.saleInvoice || "").toLowerCase().includes(filterInvoice.toLowerCase());

    if (filterDate) ok = ok && (r.date || "").includes(filterDate);

    if (filterTime)
      ok =
        ok &&
        (r.time || "")
          .toLowerCase()
          .includes(filterTime.toLowerCase());

    if (filterEmployee)
      ok =
        ok &&
        (r.employee || "")
          .toLowerCase()
          .includes(filterEmployee.toLowerCase());

    return ok;
  });

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
    setLoading(true)

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
    setRows(normalized)
  } catch (error) {
    console.error("Inactive goods issue fetch failed:", error)
    toast.error("Inactive goods issues not available")
    setInactiveRows([])
    setRows([])
  } finally {
    setLoading(false)
  }
}



const handleRestoreIssue = async () => {
  try {
    const res = await restoreGoodsIssueApi(id, { userId });

    if (res.status === 200) {
      toast.success("Goods issue restored successfully");
      navigate("/app/inventory/goodsissue");
    } else {
      toast.error("Restore failed");
    }
  } catch (error) {
    console.error("RESTORE ERROR", error);
    toast.error("Error restoring goods issue");
  }
};



  useEffect(() => {
    if (showInactive) {
      fetchInactiveGoodsIssues();
    } else {
      fetchGoodsIssues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, showInactive]);

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
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
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

              {/* New Goods Issue */}
              <button
                onClick={() => navigate("/app/inventory/goodsissue/newgoodsissue")}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
              >
                <Plus size={16} /> New Issue
              </button>

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
                  if (!showInactive) await fetchInactiveGoodsIssues();
                  setShowInactive((s) => !s);
                }}
                className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-2 h-[35px]"
              >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
              </button>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-wrap gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
              {/* Customer */}
              <div className="relative w-40" ref={dropdownRefs.customer}>
                <input
                  readOnly
                  onClick={() =>
                    setDropdownOpen((p) => ({ ...p, customer: !p.customer }))
                  }
                  value={filterCustomer || ""}
                  placeholder="Customer"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm cursor-pointer"
                />

                {dropdownOpen.customer && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={ddSearch.customer}
                        onChange={(e) =>
                          setDdSearch((p) => ({ ...p, customer: e.target.value }))
                        }
                        placeholder="Search customer..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                      />
                    </div>

                    {[...new Set(rows.map((r) => r.customer))]
                      .filter((c) =>
                        c?.toLowerCase().includes(ddSearch.customer.toLowerCase())
                      )
                      .map((c) => (
                        <div
                          key={c}
                          onClick={() => {
                            setFilterCustomer(c);
                            setDropdownOpen((p) => ({ ...p, customer: false }));
                            setDdSearch((p) => ({ ...p, customer: "" }));
                          }}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {c}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Sales Invoice */}
              <div className="relative w-40" ref={dropdownRefs.saleInvoice}>
                <input
                  readOnly
                  onClick={() =>
                    setDropdownOpen((p) => ({ ...p, saleInvoice: !p.saleInvoice }))
                  }
                  value={filterInvoice || ""}
                  placeholder="Sales Invoice"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm cursor-pointer"
                />

                {dropdownOpen.saleInvoice && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={ddSearch.saleInvoice}
                        onChange={(e) =>
                          setDdSearch((p) => ({ ...p, saleInvoice: e.target.value }))
                        }
                        placeholder="Search invoice..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                      />
                    </div>

                    {[...new Set(rows.map((r) => r.saleInvoice))]
                      .filter((i) =>
                        i?.toLowerCase().includes(ddSearch.saleInvoice.toLowerCase())
                      )
                      .map((i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setFilterInvoice(i);
                            setDropdownOpen((p) => ({ ...p, saleInvoice: false }));
                            setDdSearch((p) => ({ ...p, saleInvoice: "" }));
                          }}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {i}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="w-36">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>

              {/* Time */}
              <div className="w-28">
                <input
                  type="time"
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>

              {/* Employee */}
              <div className="relative w-40" ref={dropdownRefs.employee}>
                <input
                  readOnly
                  onClick={() =>
                    setDropdownOpen((p) => ({ ...p, employee: !p.employee }))
                  }
                  value={filterEmployee || ""}
                  placeholder="Employee"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm cursor-pointer"
                />

                {dropdownOpen.employee && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={ddSearch.employee}
                        onChange={(e) =>
                          setDdSearch((p) => ({ ...p, employee: e.target.value }))
                        }
                        placeholder="Search employee..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                      />
                    </div>

                    {[...new Set(rows.map((r) => r.employee))]
                      .filter((e) =>
                        e?.toLowerCase().includes(ddSearch.employee.toLowerCase())
                      )
                      .map((e) => (
                        <div
                          key={e}
                          onClick={() => {
                            setFilterEmployee(e);
                            setDropdownOpen((p) => ({ ...p, employee: false }));
                            setDdSearch((p) => ({ ...p, employee: "" }));
                          }}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {e}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Clear */}
              <button
                onClick={() => {
                  setFilterCustomer("");
                  setFilterInvoice("");
                  setFilterDate("");
                  setFilterTime("");
                  setFilterEmployee("");
                }}
                className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto w-full min-h-0">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1500px] border-separate border-spacing-y-1 text-sm table-fixed">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                      {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                      {visibleColumns.customer && (
                        <th className="pb-2 border-b">Customer</th>
                      )}
                      {visibleColumns.saleInvoice && (
                        <th className="pb-2 border-b">Sales Invoice</th>
                      )}
                      {visibleColumns.date && <th className="pb-2 border-b">Date</th>}
                      {visibleColumns.time && <th className="pb-2 border-b">Time</th>}
                      {visibleColumns.totalQuantity && (
                        <th className="pb-2 border-b">Total Qty</th>
                      )}
                      {visibleColumns.employee && (
                        <th className="pb-2 border-b">Employee</th>
                      )}
                      {visibleColumns.remarks && (
                        <th className="pb-2 border-b">Remarks</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="text-center">
                    {/* ACTIVE ROWS */}
                    {!showInactive &&
                      filteredRows.map((r) => (
                        <tr
                          key={r.id}
                          className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                          onClick={() => openEdit(r, false)}
                        >
                          {visibleColumns.id && (
                            <td className="px-2 py-3 text-center">{r.id}</td>
                          )}
                          {visibleColumns.customer && <td>{r.customer}</td>}
                          {visibleColumns.saleInvoice && <td>{r.saleInvoice}</td>}
                          {visibleColumns.date && <td>{r.date}</td>}
                          {visibleColumns.time && <td>{r.time}</td>}
                          {visibleColumns.totalQuantity && (
                            <td>{String(r.totalQuantity)}</td>
                          )}
                          {visibleColumns.employee && <td>{r.employee}</td>}
                          {visibleColumns.remarks && <td>{r.remarks}</td>}
                        </tr>
                      ))}

                    {/* INACTIVE ROWS */}
                    {showInactive &&
                      inactiveRows.map((r) => (
                        <tr
                          key={`inactive-${r.id}`}
                          className="bg-gray-900 opacity-40 line-through cursor-pointer hover:bg-gray-800"
                          onClick={() => openEdit(r, true)}
                        >
                          {visibleColumns.id && <td className="px-2 py-3">{r.id}</td>}
                          {visibleColumns.customer && <td>{r.customer}</td>}
                          {visibleColumns.saleInvoice && <td>{r.saleInvoice}</td>}
                          {visibleColumns.date && <td>{r.date}</td>}
                          {visibleColumns.time && <td>{r.time}</td>}
                          {visibleColumns.totalQuantity && <td>{r.totalQuantity}</td>}
                          {visibleColumns.employee && <td>{r.employee}</td>}
                          {visibleColumns.remarks && <td>{r.remarks}</td>}
                        </tr>
                      ))}

                    {/* NO RESULTS */}
                    {!filteredRows.length && !showInactive && (
                      <tr>
                        <td
                          colSpan={Object.values(visibleColumns).filter(Boolean).length}
                          className="px-4 py-6 text-center text-gray-400"
                        >
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
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

              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                value={page}
                onChange={(e) =>
                  setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))
                }
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              />

              <span>/ {totalPages}</span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsRight size={16} />
              </button>

              <span>
                Showing <b>{start}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
              </span>
            </div>
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
              <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
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