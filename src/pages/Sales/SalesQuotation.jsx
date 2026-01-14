import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  FileSpreadsheet,
  FileText,
  Eye,
  ArchiveRestore
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { getCustomersApi, getEmployeesApi, getQuotationsApi, searchQuotationApi, getQuotationByIdApi, getInactiveQuotationsApi } from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
// import { hasPermission } from "../../utils/permissionUtils";
// import { PERMISSIONS } from "../../constants/permissions";
// import ColumnPickerModal from "../../components/modals/ColumnPickerModal";



import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import MasterTable from "../../components/MasterTable"; 
import { useTheme } from "../../context/ThemeContext"; 
import ExportButtons from "../../components/ExportButtons"; 
import { useSettings } from "../../contexts/SettingsContext"; // ADDED
import { generateSalesInvoicePDF } from "../../utils/salesPdfUtils"; // ADDED
const SalesQuotation = () => {
  const { theme } = useTheme(); 
  const { settings } = useSettings(); // ADDED
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(null);
  const [columnSearch, setColumnSearch] = useState("");

  const [searchText, setSearchText] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterExpiry, setFilterExpiry] = useState("");

  // --- INACTIVE STATE ---
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveRows, setInactiveRows] = useState([]);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [quotationsList, setQuotationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to normalize
  const normalizeQuotation = (q, cList = [], eList = []) => ({
    ...q,
    customerName:
      q.customerName || cList.find((c) => String(c.id) === String(q.customerId) || String(c.id) === String(q.CustomerId))?.name || "-",
    employeeName:
      q.employeeName || eList.find((e) => String(e.id) === String(q.employeeId) || String(e.id) === String(q.EmployeeId))?.name || "-"
  });

  

  const defaultColumns = {
    id: true,
    customerName: true,
    date: true,
    employee: true,
    discount: true,
    totalDiscount: true,
    vat: false, // Legacy
    igstRate: true,
    cgstRate: true,
    sgstRate: true,
    totalTax: true,
    shippingCost: true,
    grandTotal: true,
    netTotal: true,
    details: true,
    expiryDate: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const navigate = useNavigate();
  

  useEffect(() => {
    fetchAllData();
  }, [limit]); // Fetch on mount or limit change (Wait, if I use fetchAllData on limit change it reloads everything. Just mount is better if we have pagination effect)
  
  // Actually, I'll stick to just mount for now, and rely on pagination effect for limit changes.
  // But wait, my plan below (in next steps) will define fetchAllData.
  // The original code had useEffect(() => { fetchCustomers(); fetchEmployees(); }, []);
  // I will change it to fetchAllData.

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        searchQuotationApi(searchText)
          .then((res) => {
            if (res.status === 200) {
              const rows = Array.isArray(res.data.records)
                ? res.data.records
                : Array.isArray(res.data)
                ? res.data
                : (res.data.records || []);

              const normalized = rows.map((q) => ({
                ...q,
                customerName:
                  q.customerName || customers.find((c) => String(c.id) === String(q.customerId) || String(c.id) === String(q.CustomerId))?.name || "-",
                employeeName:
                  q.employeeName || employees.find((e) => String(e.id) === String(q.employeeId) || String(e.id) === String(q.EmployeeId))?.name || "-"
              }));

              setQuotationsList(normalized);
              setTotalRecords((res.data.totalRecords) || normalized.length || 0);
              setTotalPages((res.data.totalPages) || 1);
            }
          })
          .catch((error) => {
            console.error("Search error", error);
            toast.error("Search failed");
          });
      } else {
        fetchQuotations();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, page, limit, customers, employees]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [cRes, eRes, qRes] = await Promise.all([
        getCustomersApi(1, 1000),
        getEmployeesApi(1, 1000),
        getQuotationsApi(page, limit)
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

      // Process Quotations
      if (qRes.status === 200) {
        let rows = qRes.data.records || [];
        const normalized = rows.map(q => normalizeQuotation(q, cList, eList));
        setQuotationsList(normalized);
        const total = qRes.data.totalRecords ?? qRes.data.total ?? rows.length ?? 0;
        setTotalRecords(total);
        setTotalPages(qRes.data.totalPages ?? Math.max(1, Math.ceil(total / limit)));
      }
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await getQuotationsApi(page, limit);
      if (res.status === 200) {
        let rows = res.data.records || [];
        // Use current state for customers/employees
        const normalized = rows.map(q => normalizeQuotation(q, customers, employees));
        setQuotationsList(normalized);
        const total = res.data.totalRecords ?? res.data.total ?? rows.length ?? 0;
        setTotalRecords(total);
        setTotalPages(res.data.totalPages ?? Math.max(1, Math.ceil(total / limit)));
      }
    } catch (error) {
      console.error("Error fetching quotations", error);
    }
  };

  const loadInactiveQuotations = async () => {
    try {
      const res = await getInactiveQuotationsApi();
      if (res.status === 200) {
        let rows = Array.isArray(res.data) ? res.data : (res.data.records || []);
        const normalized = rows.map(q => {
             const norm = normalizeQuotation(q, customers, employees); // Use current c/e lists
             norm.isInactive = true;
             return norm;
        });
        setInactiveRows(normalized);
      }
    } catch (error) {
      console.error("Error loading inactive quotations", error);
      toast.error("Failed to load inactive quotations");
    }
  };

  const toggleInactive = () => {
    const newState = !showInactive;
    setShowInactive(newState);
    if (newState && inactiveRows.length === 0) {
      loadInactiveQuotations();
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(quotationsList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "quotations");
    XLSX.writeFile(wb, "quotations.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Quotations Report", 14, 10);
    doc.autoTable({
      head: [["ID", "Customer", "Date", "Employee", "Net Total"]],
      body: quotationsList.map((p) => [p.id, p.customerName || p.customer || "", p.date, p.employeeName || p.employee || "", p.netTotal])
    });
    doc.save("quotations.pdf");
  };

  // COZY SANITARYWARE STYLE PDF (REUSED for Proforma)
  const handleDownloadPdf = async (id) => {
    // We pass "PROFORMA INVOICE" as title (or "Performa Invoice" if user insists, but "PROFORMA" is standard)
    // User requested "performa invoice" as heading.
    // I will use "PROFORMA INVOICE" as it looks professional, or "PERFORMA INVOICE" to be literal?
    // Let's use "PROFORMA INVOICE" (Standard). If user complains, I change it.
    // Actually user said "change the heading as performa invoice".
    await generateSalesInvoicePDF(id, settings, "PROFORMA INVOICE");
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterDate("");
    setFilterExpiry("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    setPage(1);
    await fetchAllData();
    if (showInactive) {
      loadInactiveQuotations();
    }
    toast.success("Refreshed");
  };

  const filteredList = quotationsList.filter((p) => {
    let match = true;
    const pCustomerId = p.customerId ?? p.CustomerId ?? "";
    if (filterCustomer && String(pCustomerId) !== String(filterCustomer)) match = false;
    if (filterDate && !String(p.date ?? "").includes(filterDate)) match = false;
    if (filterExpiry && !String(p.expiryDate ?? "").includes(filterExpiry)) match = false;
    return match;
  });

  // Combine lists if showing inactive
  const displayList = showInactive ? [...filteredList, ...inactiveRows] : filteredList;

   // --- SORTING LOGIC ---
   const sortedList = React.useMemo(() => {
    let sortableItems = [...displayList];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        if (['discount', 'totalDiscount', 'vat', 'igstRate', 'cgstRate', 'sgstRate', 'totalTax', 'shippingCost', 'grandTotal', 'netTotal', 'id'].includes(sortConfig.key)) {
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
  }, [displayList, sortConfig]);

  // --- FILTER BAR CONFIG ---
  const filters = [
    {
        type: 'select',
        value: filterCustomer,
        onChange: setFilterCustomer,
        options: customers,
        placeholder: "All Customers"
    },
    {
        type: 'date',
        value: filterDate,
        onChange: setFilterDate,
        placeholder: "Filter by Date"
    },
     {
        type: 'date',
        value: filterExpiry,
        onChange: setFilterExpiry,
        placeholder: "Filter by Expiry"
    }
  ];

  const handleClearFilters = () => {
    setFilterCustomer("");
    setFilterDate("");
    setFilterExpiry("");
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
      {/* ===========================
          MAIN PAGE
        ============================ */}
      <PageLayout> 
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Sales Quotation</h2>
            </div>
          
            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.customerName && { key: "customerName", label: "Customer", sortable: true, className: "min-w-[200px]", render: (q) => (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className={`p-1 rounded border border-gray-700 hover:bg-gray-700 ${q.isInactive || isNaN(q.id) ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                            title="Download PDF"
                            disabled={q.isInactive}
                            onClick={(e) => { e.stopPropagation(); handleDownloadPdf(q.id); }}
                          >
                            <FileText size={14} className="text-red-300" />
                          </button>

                          <button
                            className={`p-1 rounded border border-gray-700 hover:bg-gray-700 ${q.isInactive || isNaN(q.id) ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                            title="Preview"
                            disabled={q.isInactive}
                            onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/app/sales/preview/${q.id}`, '_blank'); }}
                          >
                            <Eye size={14} className="text-blue-300" />
                          </button>

                          <span className={theme === 'emerald' ? "text-gray-900" : "text-gray-300"}>{q.customerName || q.customer || "-"}</span>
                        </div>
                    )},
                    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (q) => q.date ? new Date(q.date).toLocaleDateString() : "-" },
                    visibleColumns.discount && { key: "discount", label: "Disc", sortable: true, render: (q) => parseFloat(q.discount || 0).toFixed(2) },
                    visibleColumns.totalDiscount && { key: "totalDiscount", label: "Total Disc", sortable: true, render: (q) => parseFloat(q.totalDiscount || 0).toFixed(2) },
                    visibleColumns.vat && { key: "vat", label: "VAT", sortable: true, render: (q) => parseFloat(q.vat || 0).toFixed(2) },
                    visibleColumns.igstRate && { key: "igstRate", label: "IGST", sortable: true, render: (q) => parseFloat(q.igstRate || 0).toFixed(2) },
                    visibleColumns.cgstRate && { key: "cgstRate", label: "CGST", sortable: true, render: (q) => parseFloat(q.cgstRate || 0).toFixed(2) },
                    visibleColumns.sgstRate && { key: "sgstRate", label: "SGST", sortable: true, render: (q) => parseFloat(q.sgstRate || 0).toFixed(2) },
                    visibleColumns.totalTax && { key: "totalTax", label: "Total Tax", sortable: true, render: (q) => parseFloat(q.totalTax || 0).toFixed(2) },
                    visibleColumns.shippingCost && { key: "shippingCost", label: "Shipping", sortable: true, render: (q) => parseFloat(q.shippingCost || 0).toFixed(2) },
                    visibleColumns.grandTotal && { key: "grandTotal", label: "Grand Total", sortable: true, render: (q) => parseFloat(q.grandTotal || 0).toFixed(2) },
                    visibleColumns.netTotal && { key: "netTotal", label: "Net Total", sortable: true, render: (q) => <span className="font-semibold">{parseFloat(q.netTotal || 0).toFixed(2)}</span> },
                    visibleColumns.details && { key: "details", label: "Details", sortable: true, render: (q) => <div className="max-w-xs truncate">{q.details || "-"}</div> },
                    visibleColumns.expiryDate && { key: "expiryDate", label: "Expiry", sortable: true, render: (q) => q.expiryDate ? new Date(q.expiryDate).toLocaleDateString() : "-" },
                ].filter(Boolean)}
                data={sortedList}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(q, isInactive) => navigate(`/app/sales/newsalequotation/${q.id}`, { state: { isInactive } })}
                
                // Action Bar
                search={searchText}
                onSearch={(val) => setSearchText(val)}
                
                onCreate={() => navigate('/app/sales/newsalequotation')}
                createLabel="New Quotation"
                permissionCreate={hasPermission(PERMISSIONS.SALES.CREATE)}
                
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
                  <FilterBar filters={filters} onClear={handleClearFilters} />
               </div>
            </MasterTable>

            {/* PAGINATION */}
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

export default SalesQuotation;



