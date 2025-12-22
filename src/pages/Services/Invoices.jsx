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
  Eye
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { getCustomersApi, getEmployeesApi, getServiceInvoicesApi, searchServiceInvoiceApi } from "../../services/allAPI";
import { useLocation, useNavigate } from "react-router-dom";
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
      : options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

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

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  const [invoicesList, setInvoicesList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
const isPreview = location.pathname.includes("/preview/");

  useEffect(() => {
    fetchAllData();
  }, [limit]); // Initial load (and limit change if we want)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        searchServiceInvoiceApi(searchText)
          .then((res) => {
            if (res.status === 200) {
              // Server search may return different shapes (records array or direct array)
              const rows = Array.isArray(res.data.records)
                ? res.data.records
                : Array.isArray(res.data)
                ? res.data
                : (res.data.records || []);

              // Normalize rows and attach customer/employee names using loaded lists
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
        // Only fetch if NOT initial load (isLoading check)
        if (!isLoading) fetchInvoices();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, page, limit]); // Removed customers/employees dependencies

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

      // Process Invoices
      if (iRes.status === 200) {
        let invoices = iRes.data.records || [];
        // Add customer names and employee names
        invoices = invoices.map(inv => ({
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
        
        setInvoicesList(invoices);
        setTotalRecords(iRes.data.totalRecords || 0);
        setTotalPages(iRes.data.totalPages || 1);
      }
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await getServiceInvoicesApi(page, limit);
      if (res.status === 200) {
        let invoices = res.data.records || [];
        
        // Add customer names and employee names using STATE
        invoices = invoices.map(inv => ({
          ...inv,
          customerName:
            inv.customerName ||
            customers.find((c) => String(c.id) === String(inv.customerId) || String(c.id) === String(inv.CustomerId))?.name ||
            "-",
          employeeName:
            inv.employeeName ||
            employees.find((e) => String(e.id) === String(inv.employeeId) || String(e.id) === String(inv.EmployeeId))?.name ||
            "-"
        }));
        
        setInvoicesList(invoices);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching invoices", error);
    }
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterEmployee("");
    setFilterDate("");
    setPage(1);
    await fetchAllData();
    toast.success("Refreshed");
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

  const filteredList = invoicesList.filter((p) => {
    let match = true;
    const pCustomerId = p.customerId ?? p.CustomerId ?? "";
    const pEmployeeId = p.employeeId ?? p.EmployeeId ?? "";
    if (filterCustomer && String(pCustomerId) !== String(filterCustomer)) match = false;
    if (filterEmployee && String(pEmployeeId) !== String(filterEmployee)) match = false;
    if (filterDate && !String(p.date ?? "").includes(filterDate)) match = false;
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
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => tempVisibleColumns[col] && col.toLowerCase().includes(columnSearch))
                    .map((col) => (
                      <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                        <span>{col}</span>
                        <button className="text-red-400" onClick={() => setTempVisibleColumns((p) => ({ ...p, [col]: false }))}>✕</button>
                      </div>
                    ))}
                </div>
              </div>
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => !tempVisibleColumns[col] && col.toLowerCase().includes(columnSearch))
                    .map((col) => (
                      <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                        <span>{col}</span>
                        <button className="text-green-400" onClick={() => setTempVisibleColumns((p) => ({ ...p, [col]: true }))}>➕</button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={() => setTempVisibleColumns(defaultColumns)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">Restore Defaults</button>
              <div className="flex gap-3">
                <button onClick={() => setColumnModalOpen(false)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">Cancel</button>
                <button onClick={() => { setVisibleColumns(tempVisibleColumns); setColumnModalOpen(false); }} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
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

              <button
                onClick={() => navigate("/app/services/newinvoice")}
                className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-600"
              >
                <Plus size={16} /> New Invoice
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
            <div className="flex items-center gap-3 bg-gray-900 p-3 rounded border border-gray-700 mb-4">
              <SearchableDropdown
                options={customers}
                value={filterCustomer}
                onChange={setFilterCustomer}
                placeholder="Customer"
              />
              <SearchableDropdown
                options={employees}
                value={filterEmployee}
                onChange={setFilterEmployee}
                placeholder="Employee"
              />
              <input
                type="datetime-local"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              />
              <button onClick={() => { setFilterCustomer(""); setFilterEmployee(""); setFilterDate(""); }} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm hover:bg-gray-700">
                Clear
              </button>
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[2000px] text-center border-separate border-spacing-y-1 text-sm w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      {visibleColumns.id && <th className="pb-1 border-b">ID</th>}
                      {visibleColumns.customerName && <th className="pb-1 border-b">Customer</th>}
                      {visibleColumns.date && <th className="pb-1 border-b">Date</th>}
                      {visibleColumns.employee && <th className="pb-1 border-b">Employee</th>}
                      {visibleColumns.paymentAccount && <th className="pb-1 border-b">Payment</th>}
                      {visibleColumns.discount && <th className="pb-1 border-b">Discount</th>}
                      {visibleColumns.totalDiscount && <th className="pb-1 border-b">Total Disc</th>}
                      {visibleColumns.vat && <th className="pb-1 border-b">VAT</th>}
                      {visibleColumns.totalTax && <th className="pb-1 border-b">Total Tax</th>}
                      {visibleColumns.shippingCost && <th className="pb-1 border-b">Shipping</th>}
                      {visibleColumns.grandTotal && <th className="pb-1 border-b">Grand Total</th>}
                      {visibleColumns.netTotal && <th className="pb-1 border-b">Net Total</th>}
                      {visibleColumns.paidAmount && <th className="pb-1 border-b">Paid</th>}
                      {visibleColumns.due && <th className="pb-1 border-b">Due</th>}
                      {visibleColumns.change && <th className="pb-1 border-b">Change</th>}
                      {visibleColumns.details && <th className="pb-1 border-b">Details</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/app/services/edit/${p.id}`)}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
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
                    ))}
                  </tbody>
                </table>
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
                <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 bg-gray-800 border border-gray-700 rounded text-white"><ChevronLeft size={16} /></button>
                <span className="text-white">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-1 bg-gray-800 border border-gray-700 rounded text-white"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Invoices;
