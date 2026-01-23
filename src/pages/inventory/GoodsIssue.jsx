// src/pages/inventory/GoodsIssue.jsx
import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import MasterTable from "../../components/MasterTable";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
import { showConfirmDialog, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
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
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const GoodsIssue = () => {
    const { theme } = useTheme();
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
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    fetchGoodsIssues(page, limit, newConfig);
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
  // Client side sorting removed
  // const sortedList = ...

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
    setSortConfig({ key: "id", direction: 'asc' });
    fetchGoodsIssues(1, limit, { key: "id", direction: 'asc' });
  };

  /* ------------------------------ Fetchers ------------------------------ */
  const fetchGoodsIssues = async (p = page, l = limit, currentSort = sortConfig) => {
    try {
      setLoading(true);
      const { key, direction } = currentSort;
      const res = await getGoodsIssuesApi(p, l, key, direction);

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
      showErrorToast("Failed to load goods issues");
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
    showErrorToast("Inactive goods issues not available")
    setInactiveRows([])
  } finally {
    // setLoading(false)
  }
}



const handleRestoreIssue = async (id) => {
    const result = await showRestoreConfirm();

    if (!result.isConfirmed) return;

  try {
    const res = await restoreGoodsIssueApi(id, { userId });

    if (res.status === 200) {
      showSuccessToast("Restored successfully");
      await fetchGoodsIssues();
      if(showInactive) await fetchInactiveGoodsIssues();
    } else {
      showErrorToast("Restore failed");
    }
  } catch (error) {
    console.error("RESTORE ERROR", error);
    showErrorToast("Error restoring goods issue");
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
           <ContentCard>
           <div className="flex flex-col h-full overflow-hidden gap-2">
             <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Goods Issue</h2>
             <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.customer && { key: "customer", label: "Customer", sortable: true },
                    visibleColumns.saleInvoice && { key: "saleInvoice", label: "Sales Invoice", sortable: true },
                    visibleColumns.date && { key: "date", label: "Date", sortable: true },
                    visibleColumns.time && { key: "time", label: "Time", sortable: true },
                    visibleColumns.totalQuantity && { key: "totalQuantity", label: "Total Qty", sortable: true },
                    visibleColumns.employee && { key: "employee", label: "Employee", sortable: true },
                    visibleColumns.remarks && { key: "remarks", label: "Remarks", sortable: true },
                ].filter(Boolean)}
                data={filteredRows} // Use filteredRows directly
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(r, isInactive) => openEdit(r, isInactive)}
                // Action Bar Props
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => navigate("/app/inventory/goodsissue/newgoodsissue")}
                createLabel="New Issue"
                permissionCreate={hasPermission(PERMISSIONS.INVENTORY.GOODS_ISSUE.CREATE)}
                onRefresh={() => {
                   setSearchText("");
                    setFilterCustomer("");
                    setFilterInvoice("");
                    setFilterEmployee("");
                    setSortConfig({ key: "id", direction: 'asc' });
                    setPage(1);
                    setShowInactive(false);
                    fetchGoodsIssues(1, limit, { key: "id", direction: 'asc' });
                 }}
                onColumnSelector={() => {
                   setTempVisibleColumns(visibleColumns);
                   setColumnModalOpen(true);
                }}
                onToggleInactive={async () => {
                   setShowInactive((s) => !s);
                }}
             >
                <div className="">
                  <FilterBar filters={filters} onClear={handleClearFilters} />
                </div>
             </MasterTable>

             <Pagination
               page={page}
               setPage={setPage}
               limit={limit}
               setLimit={setLimit}
               total={serverTotal}
               onRefresh={() => {
                   fetchGoodsIssues();
               }}
             />
           </div>
           </ContentCard>
         </div>

         {/* COLUMN TYPE */}
         <ColumnPickerModal
           isOpen={columnModalOpen}
           onClose={() => setColumnModalOpen(false)}
           visibleColumns={visibleColumns}
           setVisibleColumns={setVisibleColumns}
           defaultColumns={defaultColumns}
         />
      </PageLayout>
    </>
  );
};

export default GoodsIssue;


