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
import MasterTable from "../../components/MasterTable"; // ADDED
import { useTheme } from "../../context/ThemeContext"; // ADDED
import ExportButtons from "../../components/ExportButtons"; // ADDED

const defaultColumns = {
  id: true,
  customerName: true,
  date: true,
  employee: true,
  paymentAccount: true,
  discount: true,
  totalDiscount: true,
  igst: true,
  cgst: true,
  sgst: true,
  shippingCost: true,
  grandTotal: true,
  netTotal: true,
  paidAmount: true,
  due: true,
  change: true,
  details: true
};

const Invoices = () => {
  const { theme } = useTheme(); // ADDED
  const navigate = useNavigate();
  const location = useLocation();

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Data State
  const [invoicesList, setInvoicesList] = useState([]); 
  const [inactiveRows, setInactiveRows] = useState([]); 
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

  const calculateTaxAmount = (record, type) => {
    const subTotal = parseFloat(record.grandTotal) || 0; 
    const discount = parseFloat(record.discount) || 0; // global discount
    const taxable = subTotal - discount;
    if (taxable <= 0) return "0.00";

    let rate = 0;
    if (type === 'igst') rate = parseFloat(record.igstRate) || 0;
    else if (type === 'cgst') rate = parseFloat(record.cgstRate) || 0;
    else if (type === 'sgst') rate = parseFloat(record.sgstRate) || 0;

    const val = (taxable * rate) / 100;
    return val.toFixed(2);
  };

  /* ================= FILTER & SORT (Client-side) ================= */

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

        const numericKeys = ['grandTotal', 'netTotal', 'paidAmount', 'due', 'change', 'shippingCost', 'discount', 'totalDiscount', 'igst', 'cgst', 'sgst', 'id'];
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
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Invoices</h2>
            </div>
            
             <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.customerName && { key: "customerName", label: "Customer", sortable: true, className: "min-w-[200px]", render: (p) => (
                        <div className="flex items-center justify-center gap-2">
                             <button
                               className={`p-1 rounded border border-gray-700 hover:bg-gray-700 ${p.isInactive ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                               title="Download PDF"
                               disabled={p.isInactive}
                               onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}
                             >
                               <FileText size={14} className="text-red-300" />
                             </button>
                             <button
                               className={`p-1 rounded border border-gray-700 hover:bg-gray-700 ${p.isInactive ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                               title="Preview Invoice"
                               disabled={p.isInactive}
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
                             <span className={theme === 'emerald' ? "text-gray-900" : "text-gray-300"}>{p.customerName || p.customer || "-"}</span>
                        </div>
                    )},
                    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (p) => p.date ? new Date(p.date).toLocaleDateString() : "-" },
                    visibleColumns.employee && { key: "employeeName", label: "Employee", sortable: true, render: (p) => p.employeeName || p.employee || "-" },
                    visibleColumns.paymentAccount && { key: "paymentAccount", label: "Payment", sortable: true },
                    visibleColumns.discount && { key: "discount", label: "Discount", sortable: true, render: (p) => parseFloat(p.discount || 0).toFixed(2) },
                    visibleColumns.totalDiscount && { key: "totalDiscount", label: "Total Disc", sortable: true, render: (p) => parseFloat(p.totalDiscount || 0).toFixed(2) },
                    visibleColumns.igst && { key: "igst", label: "IGST", sortable: true, render: (p) => calculateTaxAmount(p, 'igst') },
                    visibleColumns.cgst && { key: "cgst", label: "CGST", sortable: true, render: (p) => calculateTaxAmount(p, 'cgst') },
                    visibleColumns.sgst && { key: "sgst", label: "SGST", sortable: true, render: (p) => calculateTaxAmount(p, 'sgst') },
                    visibleColumns.shippingCost && { key: "shippingCost", label: "Shipping", sortable: true, render: (p) => parseFloat(p.shippingCost || 0).toFixed(2) },
                    visibleColumns.grandTotal && { key: "grandTotal", label: "Grand Total", sortable: true, render: (p) => parseFloat(p.grandTotal || 0).toFixed(2) },
                    visibleColumns.netTotal && { key: "netTotal", label: "Net Total", sortable: true, render: (p) => <span className="font-semibold">{parseFloat(p.netTotal || 0).toFixed(2)}</span> },
                    visibleColumns.paidAmount && { key: "paidAmount", label: "Paid", sortable: true, render: (p) => parseFloat(p.paidAmount || 0).toFixed(2) },
                    visibleColumns.due && { key: "due", label: "Due", sortable: true, render: (p) => parseFloat(p.due || 0).toFixed(2) },
                    visibleColumns.change && { key: "change", label: "Change", sortable: true, render: (p) => parseFloat(p.change || 0).toFixed(2) },
                    visibleColumns.details && { key: "details", label: "Details", sortable: true, render: (p) => <div className="max-w-xs truncate">{p.details || "-"}</div> },
                ].filter(Boolean)}
                data={sortedList}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(p, isInactive) => {
                     if (isInactive) {
                         handleRestore(p);
                     } else {
                         navigate(`/app/services/edit/${p.id}`, { state: { isInactive: false } });
                     }
                }}
                
                // Action Bar
                search={searchText}
                onSearch={(val) => setSearchText(val)}
                
                onCreate={() => navigate("/app/services/newinvoice")}
                createLabel="New Invoice"
                permissionCreate={hasPermission(PERMISSIONS.SERVICES.CREATE)}
                
                onRefresh={handleRefresh}
                
                onColumnSelector={() => {
                     setTempVisibleColumns(visibleColumns);
                     setColumnModalOpen(true);
                }}
                
                onToggleInactive={toggleInactive}
                
                customActions={<ExportButtons onExcel={handleExportExcel} onPDF={handleExportPDF} />}
            >
               {/* FILTER BAR - as child */}
               <div className="">
                  <FilterBar filters={filters} onClear={clearFilters} />
               </div>
            </MasterTable>
            
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
