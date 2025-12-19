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
import { getPurchasesApi, getSuppliersApi, searchPurchaseApi } from "../../services/allAPI";
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

const Purchase = () => {
  const navigate = useNavigate();

  // --------------------------------------
  // Column Visibility
  // --------------------------------------
  const defaultColumns = {
    id: true,
    supplierName: true,
    invoiceNo: true,
    date: true,
    paymentAccount: true,
    totalDiscount: true,
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

  const [purchasesList, setPurchasesList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        searchPurchaseApi(searchText)
          .then((res) => {
            if (res.status === 200) {
              const rows = Array.isArray(res.data.records)
                ? res.data.records
                : Array.isArray(res.data)
                ? res.data
                : (res.data.records || []);

              const normalized = rows.map((inv) => ({
                ...inv,
                supplierName:
                  inv.supplierName || suppliers.find((s) => String(s.id) === String(inv.supplierId) || String(s.id) === String(inv.SupplierId))?.name || "-"
              }));

              setPurchasesList(normalized);
              setTotalRecords((res.data.totalRecords) || normalized.length || 0);
              setTotalPages((res.data.totalPages) || 1);
            }
          })
          .catch((error) => {
            console.error("Search error", error);
            toast.error("Search failed");
          });
      } else {
        fetchPurchases();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, page, limit, suppliers]);

  const fetchPurchases = async () => {
    try {
      const res = await getPurchasesApi(page, limit);
      if (res.status === 200) {
        let rows = res.data.records || [];
        rows = rows.map((r) => ({
          ...r,
          supplierName: r.supplierName || suppliers.find((s) => String(s.id) === String(r.supplierId) || String(s.id) === String(r.SupplierId))?.name || "-"
        }));
        setPurchasesList(rows);
        setTotalRecords(res.data.totalRecords || rows.length || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching purchases", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliersApi(1, 1000);
      if (res.status === 200) {
        const mapped = (res.data.records || []).map(s => ({
          id: s.id,
          name: s.companyName
        }));
        setSuppliers(mapped);
      }
    } catch (error) {
      console.error("Error fetching suppliers", error);
    }
  };

  const handleRefresh = () => {
    setSearchText("");
    setFilterSupplier("");
    setFilterDate("");
    setPage(1);
    fetchPurchases();
    toast.success("Refreshed");
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(purchasesList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchases Report", 14, 10);
    doc.autoTable({
      head: [["ID", "Supplier", "Invoice", "Date", "Net Total", "Paid", "Due"]],
      body: purchasesList.map(p => [
        p.id,
        p.supplierName,
        p.invoiceNo,
        p.date,
        p.netTotal,
        p.paidAmount,
        p.due
      ]),
    });
    doc.save("purchases.pdf");
  };

  const filteredList = purchasesList.filter(p => {
    let match = true;
    const pSupplierId = p.supplierId ?? p.SupplierId ?? "";
    if (filterSupplier && String(pSupplierId) !== String(filterSupplier)) match = false;
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
            <h2 className="text-2xl font-semibold mb-4">Purchase</h2>

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
                onClick={() => navigate("/app/purchasing/newpurchase")}
                className="flex items-center gap-1 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-600"
              >
                <Plus size={16} /> New Purchase
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
                options={suppliers}
                value={filterSupplier}
                onChange={setFilterSupplier}
                placeholder="Supplier"
              />
              <input
                type="datetime-local"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              />
              <button onClick={() => { setFilterSupplier(""); setFilterDate(""); }} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm hover:bg-gray-700">
                Clear
              </button>
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1800px] text-center border-separate border-spacing-y-1 text-sm w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      {visibleColumns.id && <th className="pb-1 border-b">ID</th>}
                      {visibleColumns.supplierName && <th className="pb-1 border-b">Supplier</th>}
                      {visibleColumns.invoiceNo && <th className="pb-1 border-b">Invoice No</th>}
                      {visibleColumns.date && <th className="pb-1 border-b">Date</th>}
                      {visibleColumns.paymentAccount && <th className="pb-1 border-b">Payment</th>}
                      {visibleColumns.totalDiscount && <th className="pb-1 border-b">Total Disc</th>}
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
                        onClick={() => navigate(`/app/purchasing/edit/${p.id}`)}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                      >
                        {visibleColumns.id && <td className="px-2 py-2">{p.id}</td>}
                        {visibleColumns.supplierName && (
                          <td className="px-2 py-2 flex items-center justify-center gap-2">
                             <button className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700" title="Download PDF" onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}>
                              <FileText size={14} className="text-red-300" />
                            </button>
                            <button 
                              className="p-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700" 
                              title="Preview Invoice" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                window.open(`/app/purchasing/preview/${p.id}`, '_blank'); 
                              }}
                            >
                              <Eye size={14} className="text-blue-300" />
                            </button>
                            {p.supplierName}
                          </td>
                        )}
                        {visibleColumns.invoiceNo && <td className="px-2 py-2">{p.invoiceNo}</td>}
                        {visibleColumns.date && <td className="px-2 py-2">{p.date}</td>}
                        {visibleColumns.paymentAccount && <td className="px-2 py-2">{p.paymentAccount}</td>}
                        {visibleColumns.totalDiscount && <td className="px-2 py-2">{p.totalDiscount}</td>}
                        {visibleColumns.shippingCost && <td className="px-2 py-2">{p.shippingCost}</td>}
                        {visibleColumns.grandTotal && <td className="px-2 py-2">{p.grandTotal}</td>}
                        {visibleColumns.netTotal && <td className="px-2 py-2">{p.netTotal}</td>}
                        {visibleColumns.paidAmount && <td className="px-2 py-2">{p.paidAmount}</td>}
                        {visibleColumns.due && <td className="px-2 py-2">{p.due}</td>}
                        {visibleColumns.change && <td className="px-2 py-2">{p.change}</td>}
                        {visibleColumns.details && <td className="px-2 py-2">{p.details}</td>}
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

export default Purchase;
