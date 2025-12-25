import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  Eye,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import { getPurchasesApi, getSuppliersApi, searchPurchaseApi } from "../../services/allAPI";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import FilterBar from "../../components/FilterBar";
import SortableHeader from "../../components/SortableHeader";

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
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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
    setSortConfig({ key: null, direction: 'asc' });
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredList = purchasesList.filter(p => {
    let match = true;
    const pSupplierId = p.supplierId ?? p.SupplierId ?? "";
    if (filterSupplier && String(pSupplierId) !== String(filterSupplier)) match = false;
    if (filterDate && !String(p.date ?? "").includes(filterDate)) match = false;
    return match;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Handle null/undefined
    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";

    // Numeric sort for specific columns
    if (["id", "totalDiscount", "shippingCost", "grandTotal", "netTotal", "paidAmount", "due", "change"].includes(sortConfig.key)) {
        aVal = Number(aVal);
        bVal = Number(bVal);
    } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filters = [
      {
          label: "Supplier",
          options: suppliers,
          value: filterSupplier,
          onChange: setFilterSupplier,
          placeholder: "All Suppliers"
      },
      {
          label: "Date",
          type: "date",
          value: filterDate,
          onChange: setFilterDate
      }
  ];

  const clearFilters = () => {
      setFilterSupplier("");
      setFilterDate("");
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
            <div className="sticky bottom-5 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
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
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
          <div className="flex flex-col h-full overflow-hidden">
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

            {/* FILTER BAR Component */}
            <FilterBar 
                filters={filters} 
                onClear={clearFilters}
                className="mb-4"
            />

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0 w-full">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1800px] text-center border-separate border-spacing-y-1 text-sm w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      {visibleColumns.id && <SortableHeader label="ID" sortOrder={sortConfig.key === "id" ? sortConfig.direction : null} onClick={() => handleSort("id")} />}
                      {visibleColumns.supplierName && <SortableHeader label="Supplier" sortOrder={sortConfig.key === "supplierName" ? sortConfig.direction : null} onClick={() => handleSort("supplierName")} />}
                      {visibleColumns.invoiceNo && <SortableHeader label="Invoice No" sortOrder={sortConfig.key === "invoiceNo" ? sortConfig.direction : null} onClick={() => handleSort("invoiceNo")} />}
                      {visibleColumns.date && <SortableHeader label="Date" sortOrder={sortConfig.key === "date" ? sortConfig.direction : null} onClick={() => handleSort("date")} />}
                      {visibleColumns.paymentAccount && <SortableHeader label="Payment" sortOrder={sortConfig.key === "paymentAccount" ? sortConfig.direction : null} onClick={() => handleSort("paymentAccount")} />}
                      {visibleColumns.totalDiscount && <SortableHeader label="Total Disc" sortOrder={sortConfig.key === "totalDiscount" ? sortConfig.direction : null} onClick={() => handleSort("totalDiscount")} />}
                      {visibleColumns.shippingCost && <SortableHeader label="Shipping" sortOrder={sortConfig.key === "shippingCost" ? sortConfig.direction : null} onClick={() => handleSort("shippingCost")} />}
                      {visibleColumns.grandTotal && <SortableHeader label="Grand Total" sortOrder={sortConfig.key === "grandTotal" ? sortConfig.direction : null} onClick={() => handleSort("grandTotal")} />}
                      {visibleColumns.netTotal && <SortableHeader label="Net Total" sortOrder={sortConfig.key === "netTotal" ? sortConfig.direction : null} onClick={() => handleSort("netTotal")} />}
                      {visibleColumns.paidAmount && <SortableHeader label="Paid" sortOrder={sortConfig.key === "paidAmount" ? sortConfig.direction : null} onClick={() => handleSort("paidAmount")} />}
                      {visibleColumns.due && <SortableHeader label="Due" sortOrder={sortConfig.key === "due" ? sortConfig.direction : null} onClick={() => handleSort("due")} />}
                      {visibleColumns.change && <SortableHeader label="Change" sortOrder={sortConfig.key === "change" ? sortConfig.direction : null} onClick={() => handleSort("change")} />}
                      {visibleColumns.details && <th className="pb-1 border-b">Details</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedList.map((p) => (
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
                        {visibleColumns.date && <td className="px-2 py-2">{p.date ? p.date.split('T')[0] : ''}</td>}
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

export default Purchase;



