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
  Download
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { getSalesApi, getCustomersApi, searchSaleApi } from "../../services/allAPI";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";

/* Searchable Dropdown */
const SearchableDropdown = ({ options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered =
    !query.trim()
      ? options
      : options.filter((o) =>
          o.name.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((o) => o.id == value)?.name || "";

  return (
    <div className="relative w-56">
      <input
        type="text"
        value={open ? query : selected || query}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-sm text-white"
      />
      {open && (
        <div className="absolute z-50 w-full bg-gray-800 border border-gray-700 mt-1 max-h-48 overflow-y-auto rounded shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <div
                key={opt.id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-white"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {opt.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">No results</div>
          )}
        </div>
      )}
      {/* Overlay to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        ></div>
      )}
    </div>
  );
};

const Sales = () => {
  const navigate = useNavigate();

  // --- COLUMN VISIBILITY ---
  const defaultColumns = {
    id: true,
    customerName: true,
    employee: false,
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
    details: false
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // --- DATA STATE ---
  const [salesList, setSalesList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // --- PAYMENT ACCOUNTS DROPDOWN ---
  const paymentAccounts = [
    { id: "Cash at Hand", name: "Cash at Hand" },
    { id: "Cash at Bank", name: "Cash at Bank" }
  ];

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch sales when customers are loaded
  useEffect(() => {
    if (customers.length > 0 && salesList.length === 0) {
      fetchSales();
    }
  }, [customers]);

  // normalize sale record shape coming from API
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Fetch sales on page/limit change
      if (!searchText.trim()) {
        fetchSales(customers);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, limit, customers]);

  const fetchSales = async (customersData = customers) => {
    try {
      const res = await getSalesApi(page, limit);
      console.log("Raw sales API response:", res);
      
      if (res.status === 200) {
        const rows = Array.isArray(res.data.records) ? res.data.records : [];
        const normalized = rows.map(r => {
          const normalized = normalizeSale(r);
          // If customerName is empty, try to look it up from customers list
          if (!normalized.customerName && normalized.customerId && customersData.length > 0) {
            const customer = customersData.find(c => String(c.id) === String(normalized.customerId));
            if (customer) {
              normalized.customerName = customer.name;
            }
          }
          return normalized;
        });
        console.log("Normalized sales:", normalized);
        setSalesList(normalized);
        setTotalRecords(res.data.totalRecords || normalized.length || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching sales", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await getCustomersApi(1, 1000);
      // console.log(res);
      
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : [];
        const mapped = records.map(c => ({
          id: c.id ?? c.Id ?? c.customerId ?? c.CustomerId ?? null,
          name: c.companyName ?? c.CompanyName ?? c.name ?? c.Name ?? ""
        }));
        setCustomers(mapped);
      }
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterDate("");
    setFilterPayment("");
    setPage(1);
    
    // Fetch customers first, then use them to fetch sales
    const res = await getCustomersApi(1, 1000);
    if (res.status === 200) {
      const records = Array.isArray(res?.data?.records) ? res.data.records : [];
      const mapped = records.map(c => ({
        id: c.id ?? c.Id ?? c.customerId ?? c.CustomerId ?? null,
        name: c.companyName ?? c.CompanyName ?? c.name ?? c.Name ?? ""
      }));
      setCustomers(mapped);
      // Now fetch sales with the updated customers data
      await fetchSales(mapped);
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
  });

  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />
          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button onClick={() => setColumnModalOpen(false)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter(col => tempVisibleColumns[col] && col.toLowerCase().includes(columnSearch))
                    .map(col => (
                      <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                        <span>{col}</span>
                        <button className="text-red-400" onClick={() => setTempVisibleColumns(p => ({ ...p, [col]: false }))}>✕</button>
                      </div>
                    ))}
                </div>
              </div>
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter(col => !tempVisibleColumns[col] && col.toLowerCase().includes(columnSearch))
                    .map(col => (
                      <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                        <span>{col}</span>
                        <button className="text-green-400" onClick={() => setTempVisibleColumns(p => ({ ...p, [col]: true }))}>➕</button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={() => setTempVisibleColumns(defaultColumns)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white hover:bg-gray-700">Restore Defaults</button>
              <div className="flex gap-3">
                <button onClick={() => setColumnModalOpen(false)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white hover:bg-gray-700">Cancel</button>
                <button onClick={() => { setVisibleColumns(tempVisibleColumns); setColumnModalOpen(false); }} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white hover:bg-gray-700">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
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

              <button
                onClick={() => navigate("/app/sales/newsale")}
                className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-600"
              >
                <Plus size={16} /> New Sale
              </button>

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
            </div>

            {/* FILTER BAR */}
            <div className="flex items-center gap-3 bg-gray-900 p-3 rounded border border-gray-700 mb-4 flex-wrap">
              <SearchableDropdown
                options={customers}
                value={filterCustomer}
                onChange={setFilterCustomer}
                placeholder="Customer"
              />
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="">-- Payment Account --</option>
                <option value="Cash at Hand">Cash at Hand</option>
                <option value="Cash at Bank">Cash at Bank</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              />
              <button onClick={() => { setFilterCustomer(""); setFilterPayment(""); setFilterDate(""); }} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm hover:bg-gray-700 text-white">
                Clear
              </button>
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1800px] text-center border-separate border-spacing-y-1 text-sm w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      {visibleColumns.id && <th className="pb-1 border-b text-gray-300">ID</th>}
                      {visibleColumns.customerName && <th className="pb-1 border-b text-gray-300">Customer</th>}
                      {visibleColumns.employee && <th className="pb-1 border-b text-gray-300">Employee</th>}
                      {visibleColumns.invoiceNo && <th className="pb-1 border-b text-gray-300">Invoice No</th>}
                      {visibleColumns.date && <th className="pb-1 border-b text-gray-300">Date</th>}
                      {visibleColumns.paymentAccount && <th className="pb-1 border-b text-gray-300">Payment</th>}
                      {visibleColumns.discount && <th className="pb-1 border-b text-gray-300">Discount</th>}
                      {visibleColumns.totalDiscount && <th className="pb-1 border-b text-gray-300">Total Disc</th>}
                      {visibleColumns.vat && <th className="pb-1 border-b text-gray-300">Vat</th>}
                      {visibleColumns.totalTax && <th className="pb-1 border-b text-gray-300">Total Tax</th>}
                      {visibleColumns.shippingCost && <th className="pb-1 border-b text-gray-300">Shipping</th>}
                      {visibleColumns.grandTotal && <th className="pb-1 border-b text-gray-300">Grand Total</th>}
                      {visibleColumns.netTotal && <th className="pb-1 border-b text-gray-300">Net Total</th>}
                      {visibleColumns.paidAmount && <th className="pb-1 border-b text-gray-300">Paid</th>}
                      {visibleColumns.due && <th className="pb-1 border-b text-gray-300">Due</th>}
                      {visibleColumns.change && <th className="pb-1 border-b text-gray-300">Change</th>}
                      {visibleColumns.details && <th className="pb-1 border-b text-gray-300">Details</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/app/sales/edit/${s.id}`)}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                      >
                        {visibleColumns.id && <td className="px-2 py-2 text-gray-300">{s.id}</td>}
                        {visibleColumns.customerName && (
                          <td className="px-2 py-2 flex items-center justify-center gap-2">
                            <button 
                              className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700" 
                              title="Download PDF" 
                              onClick={(e) => { e.stopPropagation(); handleExportRowPDF(s); }}
                            >
                              <FileText size={14} className="text-red-300" />
                            </button>
                            <button 
                              className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700" 
                              title="View Sale" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/app/sales/view/${s.id}`); 
                              }}
                            >
                              <Eye size={14} className="text-blue-300" />
                            </button>
                            <span className="text-gray-300">{s.customerName || ""}</span>
                          </td>
                        )}
                        {visibleColumns.employee && <td className="px-2 py-2 text-gray-300">{s.employee || "-"}</td>}
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
                {filteredList.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No sales found
                  </div>
                )}
              </div>
            </div>

            {/* PAGINATION */}
            <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-3 text-sm">
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                >
                  {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
                </select>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700"><ChevronLeft size={16} /></button>
                <span className="text-white">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-1 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Sales;
