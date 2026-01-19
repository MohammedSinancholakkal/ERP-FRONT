import React, { useEffect, useState } from "react";
import {
  FileText,
  Eye,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { getSalesApi, getCustomersApi, searchSaleApi, getInactiveSalesApi, getSaleByIdApi } from "../../services/allAPI";
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
import MasterTable from "../../components/MasterTable"; // ADDED
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext"; // ADDED
import ExportButtons from "../../components/ExportButtons"; // ADDED
import { useSettings } from "../../contexts/SettingsContext";
import { generateSalesInvoicePDF } from "../../utils/salesPdfUtils";

const Sales = () => {
  const { theme } = useTheme(); // ADDED
  const { settings } = useSettings();

  const navigate = useNavigate();

  // --- COLUMN VISIBILITY ---
  const defaultColumns = {
    id: true,
    customerName: true,
    invoiceNo: true,
    vehicleNo: true,
    date: true,
    paymentAccount: true,
    discount: true,
    totalDiscount: true,
    igstRate: true,
    cgstRate: true,
    sgstRate: true,
    totalTax: true,
    shippingCost: true,
    grandTotal: true,
    netTotal: true,
    paidAmount: true,
    due: true,
    change: true,
    details: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // --- INACTIVE STATE ---
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveRows, setInactiveRows] = useState([]);

  // --- DATA STATE ---
  const [salesList, setSalesList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [searchText, setSearchText] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- PAYMENT ACCOUNTS DROPDOWN ---
  const paymentAccounts = [
    { id: "Cash at Hand", name: "Cash at Hand" },
    { id: "Cash at Bank", name: "Cash at Bank" }
  ];

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchAllData();
  }, [page, limit]);

  const normalizeSale = (r = {}) => ({
    id: r.id ?? r.Id ?? r.SaleId ?? null,
    customerId: r.customerId ?? r.CustomerId ?? r.Customer?.id ?? r.CustomerId ?? null,
    employeeId: r.employeeId ?? r.EmployeeId ?? null,
    customerName:
      r.customerName ?? r.CustomerName ?? r.Customer?.companyName ?? r.Customer?.companyName ?? r.CompanyName ?? r.Company ?? "",
    employee: r.employee ?? r.Employee ?? r.EmployeeName ?? r.employeeName ?? "",
    invoiceNo: r.invoiceNo ?? r.VNo ?? r.vno ?? r.InvoiceNo ?? "",
    vehicleNo: r.vehicleNo ?? r.VehicleNo ?? "",
    date: (r.date ?? r.Date ?? r.CreatedAt ?? r.createdAt ?? "")?.toString(),
    paymentAccount: r.paymentAccount ?? r.PaymentAccount ?? r.payment ?? r.Payment ?? "",
    discount: parseFloat(r.discount ?? r.Discount ?? 0) || 0,
    totalDiscount: parseFloat(r.totalDiscount ?? r.TotalDiscount ?? r.total_discount ?? 0) || 0,
    igstRate: parseFloat(r.igstRate ?? r.IGSTRate ?? 0) || 0,
    cgstRate: parseFloat(r.cgstRate ?? r.CGSTRate ?? 0) || 0,
    sgstRate: parseFloat(r.sgstRate ?? r.SGSTRate ?? 0) || 0,
    totalTax: parseFloat(r.totalTax ?? r.TotalTax ?? r.total_tax ?? 0) || 0,
    shippingCost: parseFloat(r.shippingCost ?? r.ShippingCost ?? 0) || 0,
    grandTotal: parseFloat(r.grandTotal ?? r.GrandTotal ?? r.total ?? 0) || 0,
    netTotal: parseFloat(r.netTotal ?? r.NetTotal ?? r.net_total ?? 0) || 0,
    paidAmount: parseFloat(r.paidAmount ?? r.PaidAmount ?? r.paid ?? 0) || 0,
    due: parseFloat(r.due ?? r.Due ?? 0) || 0,
    change: parseFloat(r.change ?? r.Change ?? 0) || 0,
    details: r.details ?? r.Details ?? r.remarks ?? r.Remarks ?? "",
    raw: r
  });

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      // Fetch both in parallel
      const [customersRes, salesRes] = await Promise.all([
        getCustomersApi(1, 1000),
        getSalesApi(page, limit)
      ]);

      // PROCESS CUSTOMERS
      let customersMap = [];
      if (customersRes.status === 200) {
        const records = Array.isArray(customersRes?.data?.records) ? customersRes.data.records : [];
        customersMap = records.map(c => ({
          id: c.id ?? c.Id ?? c.customerId ?? c.CustomerId ?? null,
          name: c.companyName ?? c.CompanyName ?? c.name ?? c.Name ?? ""
        }));
        setCustomers(customersMap);
      }

      // PROCESS SALES
      if (salesRes.status === 200) {
        const rows = Array.isArray(salesRes.data.records) ? salesRes.data.records : [];
        const normalized = rows.map(r => {
          const norm = normalizeSale(r);
          // Look up customer name if missing
          if (!norm.customerName && norm.customerId && customersMap.length > 0) {
            const customer = customersMap.find(c => String(c.id) === String(norm.customerId));
            if (customer) {
              norm.customerName = customer.name;
            }
          }
          return norm;
        });
        setSalesList(normalized);
        setTotalRecords(salesRes.data.totalRecords || normalized.length || 0);
        setTotalPages(salesRes.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching data", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadInactiveSales = async () => {
    try {
      const res = await getInactiveSalesApi();
      if (res.status === 200) {
        let rows = Array.isArray(res.data) ? res.data : (res.data.records || []);
        const normalized = rows.map(r => {
             const norm = normalizeSale(r);
             norm.isInactive = true;
             return norm;
        });
        setInactiveRows(normalized);
      }
    } catch (error) {
      console.error("Error loading inactive sales", error);
      toast.error("Failed to load inactive sales");
    }
  };

  const toggleInactive = () => {
    const newState = !showInactive;
    setShowInactive(newState);
    if (newState && inactiveRows.length === 0) {
      loadInactiveSales();
    }
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterDate("");
    setFilterPayment("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    setPage(1);
    await fetchAllData();
    if (showInactive) {
      loadInactiveSales();
    }
    toast.success("Refreshed");
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "sales.xlsx");
    toast.success("Excel exported");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Report", 14, 10);
    doc.autoTable({
      head: [["ID", "Customer", "Invoice", "Date", "Payment", "Net Total", "Paid", "Due"]],
      body: filteredList.map(s => [
        s.id,
        s.customerName || "",
        s.invoiceNo || s.VNo || "",
        s.date || "",
        s.paymentAccount || "",
        parseFloat(s.netTotal || 0).toFixed(2),
        parseFloat(s.paidAmount || 0).toFixed(2),
        parseFloat(s.due || 0).toFixed(2)
      ]),
    });
    doc.save("sales.pdf");
    toast.success("PDF exported");
  };

  // COZY SANITARYWARE STYLE PDF
  const handleExportRowPDF = async (saleSummary) => {
    await generateSalesInvoicePDF(saleSummary.id, settings);
  };

  const filteredList = salesList.filter(s => {
    let match = true;
    const query = searchText.toLowerCase();
    
    // Search filter - local search on customer name, invoice, id
    if (searchText.trim()) {
      const searchMatch = 
        (s.customerName?.toLowerCase().includes(query)) ||
        (s.invoiceNo?.toLowerCase().includes(query)) ||
        (String(s.id).includes(query));
      if (!searchMatch) match = false;
    }
    
    // Customer filter
    if (filterCustomer && String(s.customerId) !== String(filterCustomer)) match = false;
    
    // Date filter - compare date strings properly (YYYY-MM-DD format)
    if (filterDate) {
      const saleDate = s.date?.split("T")[0] || ""; // Extract YYYY-MM-DD
      const filterDateOnly = filterDate.split("T")[0];
      if (saleDate !== filterDateOnly) match = false;
    }
    
    // Payment account filter - normalize both sides for comparison
    if (filterPayment) {
      const normalizedPayment = s.paymentAccount?.toLowerCase().trim() || "";
      const normalizedFilter = filterPayment?.toLowerCase().trim() || "";
      if (normalizedPayment !== normalizedFilter) match = false;
    }
    
    return match;
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
        if (['discount', 'totalDiscount', 'igstRate', 'cgstRate', 'sgstRate', 'totalTax', 'shippingCost', 'grandTotal', 'netTotal', 'paidAmount', 'due', 'change', 'id'].includes(sortConfig.key)) {
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
           type: 'select',
           value: filterPayment,
           onChange: setFilterPayment,
           options: paymentAccounts,
           placeholder: "Payment Account"
      },
      {
          type: 'date',
          value: filterDate,
          onChange: setFilterDate,
          placeholder: "Filter by Date"
      }
  ];

  const handleClearFilters = () => {
      setFilterCustomer("");
      setFilterPayment("");
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            
            <div className="flex justify-between items-center mb-2">
               <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Sales</h2>
            </div>
            <hr className="mb-4 border-gray-300" />
            
            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true, className: "min-w-[50px]", render: (s) => (
                        <div className="flex items-center justify-between w-full">
                           <span>{s.id}</span>
                           <div className="flex gap-1">
                              <button
                                className={`p-1 rounded border bg-white border-gray-700 hover:bg-white ${s.isInactive || isNaN(s.id) ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                                title="Download PDF"
                                disabled={s.isInactive}
                                onClick={(e) => { e.stopPropagation(); handleExportRowPDF(s); }}
                              >
                                <FileText size={14} className="text-red-300 bg-white" />
                              </button>
                              <button
                                className={`p-1 rounded border bg-white border-gray-700 hover:bg-white ${s.isInactive || isNaN(s.id) ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                                title="View Sale"
                                disabled={s.isInactive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/app/sales/invoice/preview/${s.id}`);
                                }}
                              >
                                <Eye size={14} className="text-purple-900" />
                              </button>
                           </div>
                        </div>
                    )},
                    visibleColumns.customerName && { key: "customerName", label: "Customer", sortable: true, className: "min-w-[200px]", render: (s) => (
                        <span className={theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-gray-300'}>{s.customerName || "-"}</span>
                    )},
                    visibleColumns.invoiceNo && { key: "invoiceNo", label: "Invoice No", sortable: true, render: (s) => s.invoiceNo || s.VNo || "" },
                    visibleColumns.vehicleNo && { key: "vehicleNo", label: "Vehicle No", sortable: true, render: (s) => s.vehicleNo || "" },
                    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (s) => s.date || "" },
                    visibleColumns.paymentAccount && { key: "paymentAccount", label: "Payment", sortable: true, render: (s) => s.paymentAccount || "" },
                    visibleColumns.discount && { key: "discount", label: "Discount", sortable: true, render: (s) => parseFloat(s.discount || 0).toFixed(2) },
                    visibleColumns.totalDiscount && { key: "totalDiscount", label: "Total Disc", sortable: true, render: (s) => parseFloat(s.totalDiscount || 0).toFixed(2) },
                    visibleColumns.igstRate && { key: "igstRate", label: "IGST %", sortable: true, render: (s) => parseFloat(s.igstRate || 0).toFixed(2) },
                    visibleColumns.cgstRate && { key: "cgstRate", label: "CGST %", sortable: true, render: (s) => parseFloat(s.cgstRate || 0).toFixed(2) },
                    visibleColumns.sgstRate && { key: "sgstRate", label: "SGST %", sortable: true, render: (s) => parseFloat(s.sgstRate || 0).toFixed(2) },
                    visibleColumns.totalTax && { key: "totalTax", label: "Total Tax", sortable: true, render: (s) => parseFloat(s.totalTax || 0).toFixed(2) },
                    visibleColumns.shippingCost && { key: "shippingCost", label: "Shipping", sortable: true, render: (s) => parseFloat(s.shippingCost || 0).toFixed(2) },
                    visibleColumns.grandTotal && { key: "grandTotal", label: "Grand Total", sortable: true, render: (s) => parseFloat(s.grandTotal || 0).toFixed(2) },
                    visibleColumns.netTotal && { key: "netTotal", label: "Net Total", sortable: true, render: (s) => <span className="font-semibold">{parseFloat(s.netTotal || 0).toFixed(2)}</span> },
                    visibleColumns.paidAmount && { key: "paidAmount", label: "Paid", sortable: true, render: (s) => parseFloat(s.paidAmount || 0).toFixed(2) },
                    visibleColumns.due && { key: "due", label: "Due", sortable: true, render: (s) => parseFloat(s.due || 0).toFixed(2) },
                    visibleColumns.change && { key: "change", label: "Change", sortable: true, render: (s) => parseFloat(s.change || 0).toFixed(2) },
                    visibleColumns.details && { key: "details", label: "Details", sortable: true, render: (s) => <div className="max-w-xs truncate">{s.details || "-"}</div> },
                ].filter(Boolean)}
                data={sortedList}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(s, isInactive) => navigate(`/app/sales/edit/${s.id}`, { state: { isInactive } })}
                
                // Action Bar
                search={searchText}
                onSearch={(val) => setSearchText(val)}
                
                onCreate={() => navigate("/app/sales/newsale")}
                createLabel="New Sale"
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

export default Sales;



