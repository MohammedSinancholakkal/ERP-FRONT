import React, { useEffect, useState } from "react";
import {
  Eye,
  FileText,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import { getPurchasesApi, getSuppliersApi, searchPurchaseApi, getInactivePurchasesApi } from "../../services/allAPI";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import FilterBar from "../../components/FilterBar";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import MasterTable from "../../components/MasterTable"; 
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";  
import ExportButtons from "../../components/ExportButtons"; 
import { generatePurchaseInvoicePDF } from "../../utils/purchaseInvoiceUtils"; 
import { useSettings } from "../../contexts/SettingsContext"; 

const Purchase = () => {
  const { theme } = useTheme(); 
  const { settings } = useSettings(); 
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
    igst: true,
    cgst: true,
    sgst: true,
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

  const [purchasesList, setPurchasesList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
      fetchPurchases();
  }, [page, limit, sortConfig]);

  // Removed the useEffect hook that combined search and fetch, 
  // because fetchPurchases now handles the main data loading triggered by sortConfig change.
  // Search logic should probably be separate or updating fetchPurchases to handle search text if needed, 
  // but looking at previous pattern, search replaces list.
  // I will leave the search effect as is but remove 'page', 'limit' from dependencies to avoid double fetch
  // if fetchPurchases handles them. 
  // Actually, wait. fetchPurchases is called in the new useEffect above. 
  // The existing search effect (lines 79-112) handles debounce search AND calls fetchPurchases if no search text.
  // I should MODIFY this search effect to NOT call fetchPurchases if it's already being called by the new useEffect above?
  // Or better, let's INTEGRATE them. 
  // If I use the new useEffect [page, limit, sortConfig], it calls fetchPurchases.
  // The search effect watches [searchText]. 
  // If searchText is present, it searches. If not, it calls fetchPurchases.
  // When I change sortConfig, fetchPurchases runs.
  // This seems fine, except for the potential race condition or double fetch.
  // I will update the search effect to mainly handle searchText changes.

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        searchPurchaseApi(searchText)
          .then((res) => {
            if (res.status === 200) {
               // ... (same search logic) ...
               // Search API doesn't support sorting usually, or does it? 
               // The user wants server side sorting on the main list. 
               // Search results might not need server sorting if they are few.
               // For now, I'll keep client side sorting for search results if I have to, 
               // OR just let the search API return results and we don't sort them server side.
               // But wait, the previous code replaced `purchasesList`.
               
               // Search logic ...
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
        // If search cleared, we want to fetch normal data with current sort/page
        // fetchPurchases is already called by the other useEffect when searchText becomes empty? 
        // No, searchText is not in the other useEffect dependency.
        fetchPurchases();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]); // Removed page, limit, suppliers from here to avoid conflicts


  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const res = await getPurchasesApi(page, limit, sortConfig.key, sortConfig.direction);
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
    } finally {
      setIsLoading(false);
    }
  };

  const loadInactivePurchases = async () => {
    try {
      const res = await getInactivePurchasesApi();
      if (res.status === 200) {
        let rows = Array.isArray(res.data) ? res.data : (res.data.records || []);
        rows = rows.map((r) => ({
          ...r,
          id: r.id || r.Id,
          invoiceNo: r.invoiceNo || r.InvoiceNo,
          date: r.date || r.Date,
          paymentAccount: r.paymentAccount || r.PaymentAccount,
          totalDiscount: r.totalDiscount || r.TotalDiscount,
          shippingCost: r.shippingCost || r.ShippingCost,
          grandTotal: r.grandTotal || r.GrandTotal,
          netTotal: r.netTotal || r.NetTotal,
          paidAmount: r.paidAmount || r.PaidAmount,
          due: r.due || r.Due,
          change: r.change || r.Change,
          details: r.details || r.Details,
          supplierName: r.supplierName || suppliers.find((s) => String(s.id) === String(r.supplierId || r.SupplierId))?.name || "-",
          isInactive: true
        }));
        setInactiveRows(rows);
      }
    } catch (error) {
      console.error("Error loading inactive purchases", error);
      toast.error("Failed to load inactive purchases");
    }
  };

  const toggleInactive = async () => {
    const newVal = !showInactive;
    setShowInactive(newVal);
    if (newVal && inactiveRows.length === 0) {
      await loadInactivePurchases();
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

  const handleRefresh = async () => {
    setSearchText("");
    setFilterSupplier("");
    setFilterDate("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    
    // Reset inactive view if active
    if (showInactive) {
      setShowInactive(false);
      // When switching back to active, we just fetch purchases which defaults to active
      await fetchPurchases(); 
    } else {
      // Just refresh current list
      await fetchPurchases();
    }
    
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(purchasesList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases.xlsx");
  };

  const handleExportListPDF = () => {
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
    doc.save("purchases_list.pdf");
  };

  const handleDownloadInvoice = async (id) => {
     await generatePurchaseInvoicePDF(id, settings);
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

  const sortedList = purchasesList; // Server-side sorted now

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

  const calculateTaxAmount = (record, type) => {
    const grandTotal = parseFloat(record.grandTotal || record.GrandTotal || 0);
    const discount = parseFloat(record.discount || record.Discount || 0); // Global discount
    const taxableAmount = Math.max(0, grandTotal - discount);
    
    let rate = 0;
    if (type === 'igst') rate = parseFloat(record.igstRate || record.IGSTRate || 0);
    if (type === 'cgst') rate = parseFloat(record.cgstRate || record.CGSTRate || 0);
    if (type === 'sgst') rate = parseFloat(record.sgstRate || record.SGSTRate || 0);

    return ((taxableAmount * rate) / 100).toFixed(2);
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Purchase</h2>
            </div>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true, className: "min-w-[50px]", render: (p) => (
                        <div className="flex items-center justify-between w-full">
                           <span>{p.id}</span>
                           <div className="flex gap-1">
                              <button
                                className={`p-1 rounded border bg-white border-gray-700 hover:bg-white ${p.isInactive ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                                title="Download PDF"
                                disabled={p.isInactive}
                                onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(p.id); }}
                              >
                                <FileText size={14} className="text-red-300 bg-white" />
                              </button>
                              <button
                                className={`p-1 rounded border bg-white border-gray-700 hover:bg-white ${p.isInactive ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                                title="Preview Invoice"
                                disabled={p.isInactive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/app/purchasing/preview/${p.id}`, '_blank');
                                }}
                              >
                                <Eye size={14} className="text-purple-900" />
                              </button>
                           </div>
                        </div>
                    )},
                    visibleColumns.supplierName && { key: "supplierName", label: "Supplier", sortable: true, className: "min-w-[200px]", render: (p) => (
                        <span className={theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-gray-300'}>{p.supplierName}</span>
                    )},
                    visibleColumns.invoiceNo && { key: "invoiceNo", label: "Invoice No", sortable: true },
                    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (p) => p.date ? p.date.split('T')[0] : '' },
                    visibleColumns.paymentAccount && { key: "paymentAccount", label: "Payment", sortable: true },
                    visibleColumns.totalDiscount && { key: "totalDiscount", label: "Total Disc", sortable: true },
                    visibleColumns.shippingCost && { key: "shippingCost", label: "Shipping", sortable: true },
                    visibleColumns.igst && { key: "igst", label: "IGST", sortable: false, render: (p) => calculateTaxAmount(p, 'igst') },
                    visibleColumns.cgst && { key: "cgst", label: "CGST", sortable: false, render: (p) => calculateTaxAmount(p, 'cgst') },
                    visibleColumns.sgst && { key: "sgst", label: "SGST", sortable: false, render: (p) => calculateTaxAmount(p, 'sgst') },
                    visibleColumns.grandTotal && { key: "grandTotal", label: "Grand Total", sortable: true },
                    visibleColumns.netTotal && { key: "netTotal", label: "Net Total", sortable: true },
                    visibleColumns.paidAmount && { key: "paidAmount", label: "Paid", sortable: true },
                    visibleColumns.due && { key: "due", label: "Due", sortable: true },
                    visibleColumns.change && { key: "change", label: "Change", sortable: true },
                    visibleColumns.details && { key: "details", label: "Details", sortable: true },
                ].filter(Boolean)}
                data={sortedList}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(p, isInactive) => navigate(`/app/purchasing/edit/${p.id}`, { state: { isInactive } })}
                
                // Action Bar
                search={searchText}
                onSearch={(val) => setSearchText(val)}
                
                onCreate={() => navigate("/app/purchasing/newpurchase")}
                createLabel="New Purchase"
                permissionCreate={hasPermission(PERMISSIONS.PURCHASING.CREATE)}
                
                onRefresh={handleRefresh}
                
                onColumnSelector={() => {
                     setTempVisibleColumns(visibleColumns);
                     setColumnModalOpen(true);
                }}
                
                onToggleInactive={toggleInactive}
                
                customActions={<ExportButtons onExcel={handleExportExcel} onPDF={handleExportListPDF} />}
            >
               {/* FILTER BAR - as child */}
               <div className="">
                  <FilterBar 
                    filters={filters} 
                    onClear={clearFilters} 
                  />
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

export default Purchase;



