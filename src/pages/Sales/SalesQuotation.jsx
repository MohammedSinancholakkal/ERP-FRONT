import React, { useEffect, useState } from "react";
import {
  FileText,
  Eye,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { getCustomersApi, getEmployeesApi, getQuotationsApi, searchQuotationApi, getInactiveQuotationsApi } from "../../services/allAPI";
// import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import MasterTable from "../../components/MasterTable"; 
import ContentCard from "../../components/ContentCard";
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
    const newConfig = { key, direction };
    setSortConfig(newConfig);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, sortConfig]); // Fetch on mount or limit/sort change


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [cRes, eRes, qRes] = await Promise.all([
        getCustomersApi(1, 1000),
        getEmployeesApi(1, 1000),
        getQuotationsApi(page, limit, sortConfig.key, sortConfig.direction)
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
      const res = await getQuotationsApi(page, limit, sortConfig.key, sortConfig.direction);
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

    await generateSalesInvoicePDF(id, settings, "PROFORMA INVOICE", "QUOTATION");
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterDate("");
    setFilterExpiry("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    setShowInactive(false); // Reset inactive
    await fetchAllData();
    // toast.success("Refreshed");
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

   // --- DATA LIST ---
  // Use direct list instead of sortedList since sorting is server-side
  // const displayList = showInactive ? [...filteredList, ...inactiveRows] : filteredList; // Already defined above

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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Sales Quotation</h2>
            </div>
            <hr className="mb-4 border-gray-300" />
          
            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true, className: "min-w-[50px]", render: (q) => (
                        <div className="flex items-center justify-between w-full">
                           <span>{q.id}</span>
                           <div className="flex gap-1">
                              <button
                                className={`p-1 rounded border bg-white border-gray-700 hover:bg-white ${q.isInactive || isNaN(q.id) ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                                title="Download PDF"
                                disabled={q.isInactive}
                                onClick={(e) => { e.stopPropagation(); handleDownloadPdf(q.id); }}
                              >
                                <FileText size={14} className="text-red-300 bg-white" />
                              </button>
                              <button
                                className={`p-1 rounded border bg-white border-gray-700 hover:bg-white ${q.isInactive || isNaN(q.id) ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                                title="Preview"
                                disabled={q.isInactive}
                                onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/app/sales/preview/${q.id}`, '_blank'); }}
                              >
                                <Eye size={14} className="text-purple-900" />
                              </button>
                           </div>
                        </div>
                    )},
                    visibleColumns.customerName && { key: "customerName", label: "Customer", sortable: true, className: "min-w-[200px]", render: (q) => (
                        <span className={q.isInactive ? "text-white" : (theme === 'emerald' || theme === 'purple' ? "text-gray-900" : "text-gray-300")}>{q.customerName || q.customer || "-"}</span>
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
                data={displayList}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(q, isInactive) => navigate(`/app/sales/newsalequotation/${q.id}`, { state: { isInactive, quotation: q } })}
                
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
        </ContentCard>
      </div>
      </PageLayout>
    </>
  );
};

export default SalesQuotation;



