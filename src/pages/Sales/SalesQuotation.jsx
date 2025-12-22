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
  Eye
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { getCustomersApi, getEmployeesApi, getQuotationsApi, searchQuotationApi, getQuotationByIdApi } from "../../services/allAPI";
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
        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-sm"
      />

      {open && (
        <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded max-h-56 overflow-auto mt-1 z-50">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                {o.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

/* Export Buttons Icons */
const ExportButtons = ({ onExcel, onPdf }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onExcel}
      className="p-1.5 bg-green-700/10 border border-green-700 rounded hover:bg-green-700/20"
      title="Export to Excel"
    >
      <FileSpreadsheet size={18} className="text-green-300" />
    </button>

    <button
      onClick={onPdf}
      className="p-1.5 bg-red-700/10 border border-red-700 rounded hover:bg-red-700/20"
      title="Export to PDF"
    >
      <FileText size={18} className="text-red-300" />
    </button>
  </div>
);

const SalesQuotation = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(null);
  const [columnSearch, setColumnSearch] = useState("");

  const [searchText, setSearchText] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterExpiry, setFilterExpiry] = useState("");

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
    vat: true,
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

  const handleDownloadPdf = async (id) => {
    try {
      const res = await getQuotationByIdApi(id);
      if (res?.status !== 200) {
        toast.error("Failed to load quotation for PDF");
        return;
      }

      const q = res.data?.quotation || res.data?.data || res.data?.records?.[0] || res.data;
      const items = res.data?.details || res.data?.items || q?.details || [];

      const doc = new jsPDF();
      doc.text("Sales Quotation", 14, 10);
      doc.text(`Quotation #: ${q?.VNo || q?.Id || id}`, 14, 20);
      doc.text(`Date: ${q?.Date ? new Date(q.Date).toLocaleDateString() : "-"}`, 14, 28);

      const body = items.map((it) => [it.itemName || it.ItemName || it.Description || "", (Number(it.UnitPrice) || 0).toFixed(2), it.Quantity ?? it.Qty ?? "-", (it.Discount ?? 0).toFixed(2), (Number(it.Total) || 0).toFixed(2)]);

      doc.autoTable({
        startY: 36,
        head: [["Item", "Unit Price", "Qty", "Disc (%)", "Line Total"]],
        body
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 140;
      doc.text(`Grand Total: ${(Number(q?.NetTotal) || 0).toFixed(2)}`, 14, finalY + 6);
      doc.save(`quotation-${q?.Id || id}.pdf`);
    } catch (err) {
      console.error("PDF generation error", err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterCustomer("");
    setFilterDate("");
    setFilterExpiry("");
    setPage(1);
    await fetchAllData();
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


  const SearchableDropdown = ({ options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const filtered =
    !query.trim()
      ? options
      : options.filter((o) =>
          o.name.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((o) => o.id == value)?.name || "";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-56">
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
        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-sm"
      />

      {open && (
        <div className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded max-h-56 overflow-auto mt-1 z-50">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {o.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">
              No results
            </div>
          )}
        </div>
      )}
    </div>
  );
};


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
                  {Object.keys(tempVisibleColumns || visibleColumns)
                    .filter((col) => (tempVisibleColumns || visibleColumns)[col] && col.toLowerCase().includes(columnSearch))
                    .map((col) => (
                      <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                        <span>{col}</span>
                        <button className="text-red-400" onClick={() => setTempVisibleColumns((p) => ({ ...(p || visibleColumns), [col]: false }))}>✕</button>
                      </div>
                    ))}
                </div>
              </div>
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns || visibleColumns)
                    .filter((col) => !(tempVisibleColumns || visibleColumns)[col] && col.toLowerCase().includes(columnSearch))
                    .map((col) => (
                      <div key={col} className="bg-gray-800 px-3 py-2 rounded flex justify-between">
                        <span>{col}</span>
                        <button className="text-green-400" onClick={() => setTempVisibleColumns((p) => ({ ...(p || visibleColumns), [col]: true }))}>➕</button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button onClick={() => setTempVisibleColumns(defaultColumns)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">Restore Defaults</button>
              <div className="flex gap-3">
                <button onClick={() => setColumnModalOpen(false)} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">Cancel</button>
                <button onClick={() => { setVisibleColumns(tempVisibleColumns || visibleColumns); setColumnModalOpen(false); }} className="px-3 py-2 bg-gray-800 border border-gray-600 rounded">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ===========================
          MAIN PAGE
        ============================ */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Sales Quotation</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-52">
              <Search size={16} />
              <input
                type="text"
                placeholder="search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-transparent outline-none pl-2 text-sm w-full"
              />
            </div>

            <button
              onClick={() => navigate('/app/sales/newsalequotation')}
              className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600"
            >
              <Plus size={16} /> New Quotation
            </button>

            <button onClick={handleRefresh} className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600">
              <RefreshCw size={16} className="text-blue-300" />
            </button>

            <button
              onClick={() => { setTempVisibleColumns(visibleColumns); setColumnModalOpen(true); }}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
            >
              <List size={16} className="text-blue-300" />
            </button>

            <ExportButtons onExcel={handleExportExcel} onPdf={handleExportPDF} />
          </div>

          {/* FILTER BAR */}
          <div className="flex items-center gap-3 bg-gray-900 p-3 rounded border border-gray-700 mb-4">
            <SearchableDropdown
              options={customers}
              value={filterCustomer}
              onChange={setFilterCustomer}
              placeholder="Customer"
            />

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300 whitespace-nowrap">Date:</label>
              <input
                type="datetime-local"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300 whitespace-nowrap">Expiry Date:</label>
              <input
                type="datetime-local"
                value={filterExpiry}
                onChange={(e) => setFilterExpiry(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <button className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm">
              Apply
            </button>
            <button
              onClick={() => {
                setFilterCustomer("");
                setFilterDate("");
                setFilterExpiry("");
              }}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              Clear
            </button>
          </div>

          {/* TABLE SCROLL */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1800px] text-center border-separate border-spacing-y-1 text-sm w-full">
                <thead className="sticky top-0 bg-gray-900">
                  <tr>
                    {visibleColumns.id && <th className="pb-1 border-b">ID</th>}
                    {visibleColumns.customerName && (
                      <th className="pb-1 border-b">Customer</th>
                    )}
                    {visibleColumns.date && (
                      <th className="pb-1 border-b">Date</th>
                    )}
                    {visibleColumns.discount && (
                      <th className="pb-1 border-b">Disc</th>
                    )}
                    {visibleColumns.totalDiscount && (
                      <th className="pb-1 border-b">Total Disc</th>
                    )}
                    {visibleColumns.vat && <th className="pb-1 border-b">VAT</th>}
                    {visibleColumns.totalTax && (
                      <th className="pb-1 border-b">Total Tax</th>
                    )}
                    {visibleColumns.shippingCost && (
                      <th className="pb-1 border-b">Shipping</th>
                    )}
                    {visibleColumns.grandTotal && (
                      <th className="pb-1 border-b">Grand Total</th>
                    )}
                    {visibleColumns.netTotal && (
                      <th className="pb-1 border-b">Net Total</th>
                    )}
                    {visibleColumns.details && (
                      <th className="pb-1 border-b">Details</th>
                    )}
                    {visibleColumns.expiryDate && (
                      <th className="pb-1 border-b">Expiry</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredList.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/app/sales/newsalequotation/${q.id}`)}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.id && <td className="px-2 py-2">{q.id}</td>}

                      {visibleColumns.customerName && (
                        <td className="px-2 py-2 flex items-center justify-center gap-2">
                          {/* PDF icon */}
                          <button
                            className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700"
                            title="Download PDF"
                            onClick={(e) => { e.stopPropagation(); handleDownloadPdf(q.id); }}
                          >
                            <FileText size={14} className="text-red-300" />
                          </button>

                          {/* Preview */}
                          <button
                            className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700"
                            title="Preview"
                            onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/app/sales/preview/${q.id}`, '_blank'); }}
                          >
                            <Eye size={14} className="text-blue-300" />
                          </button>

                          {q.customerName || q.customer || "-"}
                        </td>
                      )}

                      {visibleColumns.date && (
                        <td className="px-2 py-2">{q.date ? new Date(q.date).toLocaleDateString() : "-"}</td>
                      )}

                      {visibleColumns.discount && (
                        <td className="px-2 py-2">{parseFloat(q.discount || 0).toFixed(2)}</td>
                      )}

                      {visibleColumns.totalDiscount && (
                        <td className="px-2 py-2">{parseFloat(q.totalDiscount || 0).toFixed(2)}</td>
                      )}

                      {visibleColumns.vat && (
                        <td className="px-2 py-2">{parseFloat(q.vat || 0).toFixed(2)}</td>
                      )}

                      {visibleColumns.totalTax && (
                        <td className="px-2 py-2">{parseFloat(q.totalTax || 0).toFixed(2)}</td>
                      )}

                      {visibleColumns.shippingCost && (
                        <td className="px-2 py-2">{parseFloat(q.shippingCost || 0).toFixed(2)}</td>
                      )}

                      {visibleColumns.grandTotal && (
                        <td className="px-2 py-2">{parseFloat(q.grandTotal || 0).toFixed(2)}</td>
                      )}

                      {visibleColumns.netTotal && (
                        <td className="px-2 py-2 font-semibold">{parseFloat(q.netTotal || 0).toFixed(2)}</td>
                      )}

                      {visibleColumns.details && (
                        <td className="px-2 py-2 max-w-xs truncate">{q.details || "-"}</td>
                      )}

                      {visibleColumns.expiryDate && (
                        <td className="px-2 py-2">{q.expiryDate ? new Date(q.expiryDate).toLocaleDateString() : "-"}</td>
                      )}
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
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsLeft size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                value={page}
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
                onChange={(e) => setPage(Number(e.target.value))}
              />

<span>/ {totalPages}</span>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronRight size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default SalesQuotation;
