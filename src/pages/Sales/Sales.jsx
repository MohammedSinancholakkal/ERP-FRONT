import React, { useEffect, useState } from "react";
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
  Download,
  ArchiveRestore
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { getSalesApi, getCustomersApi, searchSaleApi, getInactiveSalesApi } from "../../services/allAPI";
import SortableHeader from "../../components/SortableHeader";
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

const Sales = () => {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  // --- COLUMN VISIBILITY ---
  const defaultColumns = {
    id: true,
    customerName: true,
    invoiceNo: true,
    date: true,
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

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // --- INACTIVE STATE ---
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveRows, setInactiveRows] = useState([]);

  // --- DATA STATE ---
  const [salesList, setSalesList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // NEW: Loading state
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
    date: (r.date ?? r.Date ?? r.CreatedAt ?? r.createdAt ?? "")?.toString(),
    paymentAccount: r.paymentAccount ?? r.PaymentAccount ?? r.payment ?? r.Payment ?? "",
    discount: parseFloat(r.discount ?? r.Discount ?? 0) || 0,
    totalDiscount: parseFloat(r.totalDiscount ?? r.TotalDiscount ?? r.total_discount ?? 0) || 0,
    vat: parseFloat(r.vat ?? r.Vat ?? r.VAT ?? 0) || 0,
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
             // Customer matching logic if needed, but we joined in backend
             // If backend join returned CustomerName, normalizeSale picks it up
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

  const handleExportRowPDF = (sale) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sales Invoice", 14, 10);
    
    doc.setFontSize(10);
    doc.text(`Invoice: ${sale.invoiceNo || sale.VNo || ""}`, 14, 20);
    doc.text(`Date: ${sale.date || ""}`, 14, 25);
    doc.text(`Customer: ${sale.customerName || ""}`, 14, 30);
    doc.text(`Payment Account: ${sale.paymentAccount || ""}`, 14, 35);
    
    doc.autoTable({
      head: [["Description", "Amount"]],
      body: [
        ["Grand Total", `${parseFloat(sale.grandTotal || 0).toFixed(2)}`],
        ["Discount", `${parseFloat(sale.totalDiscount || 0).toFixed(2)}`],
        ["Shipping", `${parseFloat(sale.shippingCost || 0).toFixed(2)}`],
        ["Net Total", `${parseFloat(sale.netTotal || 0).toFixed(2)}`],
        ["Paid Amount", `${parseFloat(sale.paidAmount || 0).toFixed(2)}`],
        ["Due", `${parseFloat(sale.due || 0).toFixed(2)}`],
        ["Change", `${parseFloat(sale.change || 0).toFixed(2)}`]
      ],
      startY: 45
    });
    
    doc.save(`sale-${sale.id}.pdf`);
    toast.success(`PDF exported for Invoice ${sale.invoiceNo || sale.VNo}`);
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
        if (['discount', 'totalDiscount', 'vat', 'totalTax', 'shippingCost', 'grandTotal', 'netTotal', 'paidAmount', 'due', 'change', 'id'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else {
             // String comparison
             aValue = String(aValue).toLowerCase();
             bValue = String(bValue).toLowerCase();
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
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Sales</h2>

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

              {hasPermission(PERMISSIONS.SALES.CREATE) && (
              <button
                onClick={() => navigate("/app/sales/newsale")}
                className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-600"
              >
                <Plus size={16} /> New Sale
              </button>
              )}

              <button onClick={handleRefresh} className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
                <RefreshCw size={16} className="text-blue-300" />
              </button>

              <button onClick={() => { setTempVisibleColumns(visibleColumns); setColumnModalOpen(true); }} className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
                <List size={16} className="text-blue-300" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={handleExportExcel} className="p-1.5 bg-green-700/10 border border-green-700 rounded hover:bg-green-700/20" title="Export to Excel">
                  <FileSpreadsheet size={18} className="text-green-300" />
                </button>
                <button onClick={handleExportPDF} className="p-1.5 bg-red-700/10 border border-red-700 rounded hover:bg-red-700/20" title="Export to PDF">
                  <FileText size={18} className="text-red-300" />
                </button>
              </div>

              {/* Inactive Toggle */}
               <button
                  onClick={toggleInactive}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    showInactive
                      ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                  title={showInactive ? "Inactive" : "Inactive"}
                >
                  <ArchiveRestore size={16} />
                  {showInactive ? "Inactive" : "Inactive"}
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="mb-4">
               <FilterBar filters={filters} onClear={handleClearFilters} />
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1800px] text-center border-separate border-spacing-y-1 text-sm w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      {visibleColumns.id && <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.customerName && <SortableHeader label="Customer" sortKey="customerName" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.invoiceNo && <SortableHeader label="Invoice No" sortKey="invoiceNo" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.date && <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.paymentAccount && <SortableHeader label="Payment" sortKey="paymentAccount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.discount && <SortableHeader label="Discount" sortKey="discount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.totalDiscount && <SortableHeader label="Total Disc" sortKey="totalDiscount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.vat && <SortableHeader label="Vat" sortKey="vat" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.totalTax && <SortableHeader label="Total Tax" sortKey="totalTax" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.shippingCost && <SortableHeader label="Shipping" sortKey="shippingCost" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.grandTotal && <SortableHeader label="Grand Total" sortKey="grandTotal" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.netTotal && <SortableHeader label="Net Total" sortKey="netTotal" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.paidAmount && <SortableHeader label="Paid" sortKey="paidAmount" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.due && <SortableHeader label="Due" sortKey="due" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.change && <SortableHeader label="Change" sortKey="change" currentSort={sortConfig} onSort={handleSort} />}
                      {visibleColumns.details && <th className="pb-1 border-b text-gray-300">Details</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedList.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/app/sales/edit/${s.id}`, { state: { isInactive: s.isInactive } })}
                        className={`hover:bg-gray-700 cursor-pointer ${
                          s.isInactive 
                            ? "bg-gray-800/50 opacity-60 line-through grayscale text-gray-500" 
                            : "bg-gray-900"
                        }`}
                      >
                        {visibleColumns.id && <td className="px-2 py-2 text-gray-300">{s.id}</td>}
                        {visibleColumns.customerName && (
                          <td className="px-2 py-2 flex items-center justify-center gap-2">
                            <button 
                              className={`p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 ${s.isInactive ? "opacity-30 cursor-not-allowed" : ""}`}
                              title="Download PDF" 
                              disabled={s.isInactive}
                              onClick={(e) => { e.stopPropagation(); handleExportRowPDF(s); }}
                            >
                              <FileText size={14} className="text-red-300" />
                            </button>
                            <button 
                              className={`p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 ${s.isInactive ? "opacity-30 cursor-not-allowed" : ""}`}
                              title="View Sale" 
                              disabled={s.isInactive}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/app/sales/invoice/preview/${s.id}`); 
                              }}
                            >
                              <Eye size={14} className="text-blue-300" />
                            </button>
                            <span className="text-gray-300">{s.customerName || ""}</span>
                          </td>
                        )}
                        {visibleColumns.invoiceNo && <td className="px-2 py-2 text-gray-300">{s.invoiceNo || s.VNo || ""}</td>}
                        {visibleColumns.date && <td className="px-2 py-2 text-gray-300">{s.date || ""}</td>}
                        {visibleColumns.paymentAccount && <td className="px-2 py-2 text-gray-300">{s.paymentAccount || ""}</td>}
                        {visibleColumns.discount && <td className="px-2 py-2 text-gray-300">{parseFloat(s.discount || 0).toFixed(2)}</td>}
                        {visibleColumns.totalDiscount && <td className="px-2 py-2 text-gray-300">{parseFloat(s.totalDiscount || 0).toFixed(2)}</td>}
                        {visibleColumns.vat && <td className="px-2 py-2 text-gray-300">{parseFloat(s.vat || 0).toFixed(2)}</td>}
                        {visibleColumns.totalTax && <td className="px-2 py-2 text-gray-300">{parseFloat(s.totalTax || 0).toFixed(2)}</td>}
                        {visibleColumns.shippingCost && <td className="px-2 py-2 text-gray-300">{parseFloat(s.shippingCost || 0).toFixed(2)}</td>}
                        {visibleColumns.grandTotal && <td className="px-2 py-2 text-gray-300">{parseFloat(s.grandTotal || 0).toFixed(2)}</td>}
                        {visibleColumns.netTotal && <td className="px-2 py-2 text-gray-300 font-semibold">{parseFloat(s.netTotal || 0).toFixed(2)}</td>}
                        {visibleColumns.paidAmount && <td className="px-2 py-2 text-gray-300">{parseFloat(s.paidAmount || 0).toFixed(2)}</td>}
                        {visibleColumns.due && <td className="px-2 py-2 text-gray-300">{parseFloat(s.due || 0).toFixed(2)}</td>}
                        {visibleColumns.change && <td className="px-2 py-2 text-gray-300">{parseFloat(s.change || 0).toFixed(2)}</td>}
                        {visibleColumns.details && <td className="px-2 py-2 text-gray-300 max-w-xs truncate">{s.details || "-"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sortedList.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No sales found
                  </div>
                )}
              </div>
            </div>

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

export default Sales;



