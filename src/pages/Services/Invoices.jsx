import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  Eye,
  FileSpreadsheet,
  FileText,
  ArchiveRestore
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SortableHeader from "../../components/SortableHeader";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import Swal from "sweetalert2";
import { 
  getCustomersApi, 
  getEmployeesApi, 
  getServiceInvoicesApi, 
  searchServiceInvoiceApi, 
  getInactiveServiceInvoicesApi,
  restoreServiceInvoiceApi
} from "../../services/allAPI";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const defaultColumns = {
  id: true,
  customerName: true,
  date: true,
  employee: true,
  paymentAccount: true,
  discount: true,
  totalDiscount: true,
  vat: true,
  totalTax: true,
  shippingCost: true,
  grandTotal: true,
  netTotal: true,
  paidAmount: true,
  due: true,
  change: true,
  details: true
};

const Invoices = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // Data State
  const [invoicesList, setInvoicesList] = useState([]); // Active invoices
  const [inactiveRows, setInactiveRows] = useState([]); // Inactive invoices (separate list)
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchText, setSearchText] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Lookups
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchAllData();
  }, [limit, page]); 

  // Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        searchServiceInvoiceApi(searchText)
          .then((res) => {
            if (res.status === 200) {
              const rows = Array.isArray(res.data.records)
                ? res.data.records
                : Array.isArray(res.data)
                ? res.data
                : (res.data.records || []);

              const normalized = rows.map((inv) => ({
                ...inv,
                customerName:
                  inv.customerName || customers.find((c) => String(c.id) === String(inv.customerId) || String(c.id) === String(inv.CustomerId))?.name || "-",
                employeeName:
                  inv.employeeName || employees.find((e) => String(e.id) === String(inv.employeeId) || String(e.id) === String(inv.EmployeeId))?.name || "-"
              }));

              setInvoicesList(normalized);
              setTotalRecords((res.data.totalRecords) || normalized.length || 0);
              setTotalPages((res.data.totalPages) || 1);
            }
          })
          .catch((error) => {
            console.error("Search error", error);
            toast.error("Search failed");
          });
      } else {
        if (!isLoading) fetchAllData();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]); 

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [cRes, eRes, iRes] = await Promise.all([
        getCustomersApi(1, 1000),
        getEmployeesApi(1, 1000),
        getServiceInvoicesApi(page, limit)
      ]);

      let cList = [];
      let eList = [];

      // Process Customers
      if (cRes.status === 200) {
         cList = (cRes.data.records || []).map((c) => ({
          id: c.id ?? c.Id ?? c.customerId ?? c.CustomerId ?? null,
          name:
            c.name ?? c.Name ?? c.companyName ?? c.CompanyName ?? `${c.firstName ?? c.FirstName ?? ""} ${c.lastName ?? c.LastName ?? ""}`.trim()
        }));
        setCustomers(cList);
      }

      // Process Employees
      if (eRes.status === 200) {
        eList = (eRes.data.records || []).map((e) => ({
          id: e.id ?? e.Id ?? e.employeeId ?? e.EmployeeId ?? null,
          name: e.fullName ?? e.fullname ?? e.name ?? e.Name ?? `${e.firstName ?? e.FirstName ?? ""} ${e.lastName ?? e.LastName ?? ""}`.trim()
        }));
        setEmployees(eList);
      }

      // Process Active Invoices
      let activeInvoices = [];
      if (iRes.status === 200) {
        activeInvoices = iRes.data.records || [];
        setTotalRecords(iRes.data.totalRecords || 0);
        setTotalPages(iRes.data.totalPages || 1);
      }

      // Normalize Active
      const normalized = activeInvoices.map(inv => ({
        ...inv,
        customerName:
          inv.customerName ||
          cList.find((c) => String(c.id) === String(inv.customerId) || String(c.id) === String(inv.CustomerId))?.name ||
          "-",
        employeeName:
          inv.employeeName ||
          eList.find((e) => String(e.id) === String(inv.employeeId) || String(e.id) === String(inv.EmployeeId))?.name ||
          "-"
      }));
      
      setInvoicesList(normalized);

      // If showing inactive, reload them too
      if (showInactive) {
          loadInactiveInvoices(cList, eList);
      }

    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInactiveInvoices = async (cList = customers, eList = employees) => {
      try {
          const res = await getInactiveServiceInvoicesApi();
          if (res.status === 200) {
              const rows = Array.isArray(res.data) ? res.data : (res.data.records || []);
              const normalized = rows.map(inv => ({
                ...inv,
                customerName:
                   inv.customerName ||
                   cList.find((c) => String(c.id) === String(inv.customerId) || String(c.id) === String(inv.CustomerId))?.name || "-",
                employeeName:
                   inv.employeeName ||
                   eList.find((e) => String(e.id) === String(inv.employeeId) || String(e.id) === String(inv.EmployeeId))?.name || "-",
                isInactive: true
              }));
              setInactiveRows(normalized);
          }
      } catch (error) {
          console.error("Error loading inactive invoices", error);
      }
  };

  const toggleInactive = async () => {
    const newVal = !showInactive;
    setShowInactive(newVal);
    if (newVal && inactiveRows.length === 0) {
      await loadInactiveInvoices();
    }
  };

  const handleRestore = async (invoice) => {
    Swal.fire({
      title: "Restore Invoice?",
      text: `Are you sure you want to restore invoice #${invoice.id}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await restoreServiceInvoiceApi(invoice.id, { userId });
                if (res.status === 200) {
                    Swal.fire({
                        icon: "success",
                        title: "Restored!",
                        text: "Invoice has been restored.",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    // Refresh lists
                    setInactiveRows(prev => prev.filter(r => r.id !== invoice.id));
                    fetchAllData();
                } else {
                    Swal.fire("Error!", "Failed to restore invoice.", "error");
                }
            } catch (error) {
                console.error("Restore error", error);
                Swal.fire("Error!", "Error restoring invoice.", "error");
            }
        }
    });
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterEmployee("");
    setFilterDate("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    await fetchAllData();
    toast.success("Refreshed");
  };

  /* ================= FILTER & SORT (Client-side) ================= */
  // Filter only applies to active list usually, but let's see requirements.
  // Customers.jsx applies filter to `allCustomers` (active) only. Inactive are just appended.
  // We will follow the same pattern.

  const filteredList = invoicesList.filter((p) => {
    let match = true;
    const pCustomerId = p.customerId ?? p.CustomerId ?? "";
    const pEmployeeId = p.employeeId ?? p.EmployeeId ?? "";
    if (filterCustomer && String(pCustomerId) !== String(filterCustomer)) match = false;
    if (filterEmployee && String(pEmployeeId) !== String(filterEmployee)) match = false;
    if (filterDate && !String(p.date ?? "").includes(filterDate)) match = false;
    return match;
  });

  const sortedList = React.useMemo(() => {
    let sortableItems = [...filteredList];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        const numericKeys = ['grandTotal', 'netTotal', 'paidAmount', 'due', 'change', 'shippingCost', 'discount', 'totalDiscount', 'vat', 'totalTax', 'id'];
        if (numericKeys.includes(sortConfig.key)) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else {
             aValue = aValue ? String(aValue).toLowerCase() : '';
             bValue = bValue ? String(bValue).toLowerCase() : '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredList, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(invoicesList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "invoices.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Invoices Report", 14, 10);
    doc.autoTable({
      head: [["ID", "Customer", "Date", "Employee", "Net Total", "Paid", "Due"]],
      body: invoicesList.map((p) => [
        p.id,
        p.customerName || p.customer || "",
        p.date,
        p.employeeName || p.employee || "",
        p.netTotal,
        p.paidAmount,
        p.due,
      ]),
    });
    doc.save("invoices.pdf");
  };

  const filters = [
      {
          type: 'select',
          placeholder: "Customer",
          options: customers,
          value: filterCustomer,
          onChange: setFilterCustomer
      },
      {
           type: 'select',
           placeholder: "Employee",
           options: employees,
           value: filterEmployee,
           onChange: setFilterEmployee
      },
      {
           type: 'date',
           placeholder: "Date",
           value: filterDate,
           onChange: (e) => setFilterDate(e.target.value)
      }
  ];

  const clearFilters = () => {
      setFilterCustomer("");
      setFilterEmployee("");
      setFilterDate("");
  };

  return (
    <>
      {/* COLUMN PICKER MODAL */}
          <ColumnPickerModal
            isOpen={columnModalOpen} 
            onClose={() => setColumnModalOpen(false)} 
            visibleColumns={visibleColumns} 
            setVisibleColumns={setVisibleColumns} 
            defaultColumns={defaultColumns} 
          />

      <PageLayout> 
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Invoices</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-52">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-transparent outline-none pl-2 text-sm w-full text-white"
                />
              </div>

              {hasPermission(PERMISSIONS.SERVICES.CREATE) && (
              <button
                onClick={() => navigate("/app/services/newinvoice")}
                className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-600"
              >
                <Plus size={16} /> New Invoice
              </button>
              )}

              <button onClick={handleRefresh} className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
                <RefreshCw size={16} className="text-blue-300" />
              </button>

              <button onClick={() => { setTempVisibleColumns(visibleColumns); setColumnModalOpen(true); }} className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
                <List size={16} className="text-blue-300" />
              </button>

              <button 
                 onClick={toggleInactive}
                 className={`p-2 border border-gray-600 rounded flex items-center gap-1 ${showInactive ? 'bg-gray-700' : 'bg-gray-700'}`}
               >
                 <ArchiveRestore size={16} className={showInactive ? "text-yellow-400" : "text-yellow-300"} />
                 <span className={`text-xs ${showInactive ? "opacity-100 font-bold text-yellow-100" : "opacity-80"}`}>
                   {showInactive ? " Inactive" : " Inactive"}
                 </span>
              </button>

              <div className="flex items-center gap-2">
                <button onClick={handleExportExcel} className="p-1.5 bg-green-700/10 border border-green-700 rounded hover:bg-green-700/20" title="Export to Excel">
                  <FileSpreadsheet size={18} className="text-green-300" />
                </button>
                <button onClick={handleExportPDF} className="p-1.5 bg-red-700/10 border border-red-700 rounded hover:bg-red-700/20" title="Export to PDF">
                  <FileText size={18} className="text-red-300" />
                </button>
              </div>
            </div>

            {/* FILTER BAR */}
            <div className="mb-4">
              <FilterBar filters={filters} onClear={clearFilters} />
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[2000px] text-center border-separate border-spacing-y-1 text-sm w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      {visibleColumns.id && <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.customerName && <SortableHeader label="Customer" sortKey="customerName" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.date && <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.employee && <SortableHeader label="Employee" sortKey="employeeName" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.paymentAccount && <SortableHeader label="Payment" sortKey="paymentAccount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.discount && <SortableHeader label="Discount" sortKey="discount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.totalDiscount && <SortableHeader label="Total Disc" sortKey="totalDiscount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.vat && <SortableHeader label="VAT" sortKey="vat" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.totalTax && <SortableHeader label="Total Tax" sortKey="totalTax" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.shippingCost && <SortableHeader label="Shipping" sortKey="shippingCost" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.grandTotal && <SortableHeader label="Grand Total" sortKey="grandTotal" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.netTotal && <SortableHeader label="Net Total" sortKey="netTotal" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.paidAmount && <SortableHeader label="Paid" sortKey="paidAmount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.due && <SortableHeader label="Due" sortKey="due" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.change && <SortableHeader label="Change" sortKey="change" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.details && <SortableHeader label="Details" sortKey="details" currentSort={sortConfig} onSort={handleSort} />}
                    </tr>
                  </thead>
                  <tbody>
                    {/* ACTIVE ROWS */}
                    {sortedList.length === 0 ? (
                      <tr>
                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-8 text-center text-gray-400">
                          {isLoading ? "Loading..." : "No active invoices found"}
                        </td>
                      </tr>
                    ) : (
                      sortedList.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/app/services/edit/${p.id}`, { state: { isInactive: false } })}
                        className="hover:bg-gray-700 cursor-pointer bg-gray-900"
                      >
                        {visibleColumns.id && <td className="px-2 py-2">{p.id}</td>}
                        {visibleColumns.customerName && (
                          <td className="px-2 py-2 flex items-center justify-center gap-2">
                            <button className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700" title="Download PDF" onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}>
                              <FileText size={14} className="text-red-300" />
                            </button>
                            <button
                              className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700"
                              title="Preview Invoice"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  `${window.location.origin}/app/services/preview/${p.id}`,
                                  "_blank"
                                );
                              }}
                            >
                              <Eye size={14} className="text-blue-300" />
                            </button>
                            {p.customerName || p.customer || "-"}
                          </td>
                        )}
                        {visibleColumns.date && <td className="px-2 py-2">{p.date ? new Date(p.date).toLocaleDateString() : "-"}</td>}
                        {visibleColumns.employee && <td className="px-2 py-2">{p.employeeName || p.employee || "-"}</td>}
                        {visibleColumns.paymentAccount && <td className="px-2 py-2">{p.paymentAccount || "-"}</td>}
                        {visibleColumns.discount && <td className="px-2 py-2">{parseFloat(p.discount || 0).toFixed(2)}</td>}
                        {visibleColumns.totalDiscount && <td className="px-2 py-2">{parseFloat(p.totalDiscount || 0).toFixed(2)}</td>}
                        {visibleColumns.vat && <td className="px-2 py-2">{parseFloat(p.vat || 0).toFixed(2)}</td>}
                        {visibleColumns.totalTax && <td className="px-2 py-2">{parseFloat(p.totalTax || 0).toFixed(2)}</td>}
                        {visibleColumns.shippingCost && <td className="px-2 py-2">{parseFloat(p.shippingCost || 0).toFixed(2)}</td>}
                        {visibleColumns.grandTotal && <td className="px-2 py-2">{parseFloat(p.grandTotal || 0).toFixed(2)}</td>}
                        {visibleColumns.netTotal && <td className="px-2 py-2 font-semibold">{parseFloat(p.netTotal || 0).toFixed(2)}</td>}
                        {visibleColumns.paidAmount && <td className="px-2 py-2">{parseFloat(p.paidAmount || 0).toFixed(2)}</td>}
                        {visibleColumns.due && <td className="px-2 py-2">{parseFloat(p.due || 0).toFixed(2)}</td>}
                        {visibleColumns.change && <td className="px-2 py-2">{parseFloat(p.change || 0).toFixed(2)}</td>}
                        {visibleColumns.details && <td className="px-2 py-2 max-w-xs truncate">{p.details || "-"}</td>}
                      </tr>
                    ))
                    )}

                    {/* INACTIVE ROWS (APPENDED AT BOTTOM) */}
                    {showInactive && inactiveRows.map((p) => (
                      <tr
                        key={`inactive-${p.id}`}
                        onClick={() => handleRestore(p)}
                        className="hover:bg-gray-700 cursor-pointer bg-gray-700/50 opacity-60 line-through grayscale"
                      >
                         {visibleColumns.id && <td className="px-2 py-2">{p.id}</td>}
                        {visibleColumns.customerName && (
                          <td className="px-2 py-2 flex items-center justify-center gap-2">
                             <button className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 opacity-50" title="Download PDF" onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}>
                               <FileText size={14} className="text-red-300" />
                             </button>
                             <button
                               className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 opacity-50"
                               title="Preview Invoice"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 window.open(
                                   `${window.location.origin}/app/services/preview/${p.id}`,
                                   "_blank"
                                 );
                               }}
                             >
                               <Eye size={14} className="text-blue-300" />
                             </button>
                             {p.customerName || p.customer || "-"}
                          </td>
                        )}
                        {visibleColumns.date && <td className="px-2 py-2">{p.date ? new Date(p.date).toLocaleDateString() : "-"}</td>}
                        {visibleColumns.employee && <td className="px-2 py-2">{p.employeeName || p.employee || "-"}</td>}
                        {visibleColumns.paymentAccount && <td className="px-2 py-2">{p.paymentAccount || "-"}</td>}
                        {visibleColumns.discount && <td className="px-2 py-2">{parseFloat(p.discount || 0).toFixed(2)}</td>}
                        {visibleColumns.totalDiscount && <td className="px-2 py-2">{parseFloat(p.totalDiscount || 0).toFixed(2)}</td>}
                        {visibleColumns.vat && <td className="px-2 py-2">{parseFloat(p.vat || 0).toFixed(2)}</td>}
                        {visibleColumns.totalTax && <td className="px-2 py-2">{parseFloat(p.totalTax || 0).toFixed(2)}</td>}
                        {visibleColumns.shippingCost && <td className="px-2 py-2">{parseFloat(p.shippingCost || 0).toFixed(2)}</td>}
                        {visibleColumns.grandTotal && <td className="px-2 py-2">{parseFloat(p.grandTotal || 0).toFixed(2)}</td>}
                        {visibleColumns.netTotal && <td className="px-2 py-2 font-semibold">{parseFloat(p.netTotal || 0).toFixed(2)}</td>}
                        {visibleColumns.paidAmount && <td className="px-2 py-2">{parseFloat(p.paidAmount || 0).toFixed(2)}</td>}
                        {visibleColumns.due && <td className="px-2 py-2">{parseFloat(p.due || 0).toFixed(2)}</td>}
                        {visibleColumns.change && <td className="px-2 py-2">{parseFloat(p.change || 0).toFixed(2)}</td>}
                        {visibleColumns.details && <td className="px-2 py-2 max-w-xs truncate">{p.details || "-"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
             <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
                onRefresh={handleRefresh}
              />
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Invoices;
