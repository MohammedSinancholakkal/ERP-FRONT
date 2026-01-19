import React, { useEffect, useState } from "react";
import {
  Eye,
  FileText
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import { getPurchaseOrdersApi, getSuppliersApi, searchPurchaseOrderApi, getInactivePurchaseOrdersApi, getSettingsApi } from "../../services/allAPI";
import { generatePurchaseOrderPDF } from "../../utils/purchaseOrderUtils";
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

const PurchaseOrder = () => {
  const { theme } = useTheme(); 
  const navigate = useNavigate();

  // --------------------------------------
  // Column Visibility
  // --------------------------------------
  const defaultColumns = {
    id: true,
    supplierName: true,

    date: true,
    vehicleNo: true,
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
  const [settings, setSettings] = useState({});
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchSuppliers();
    fetchSettings();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        searchPurchaseOrderApi(searchText)
          .then((res) => {
            if (res.status === 200) {
              const rows = Array.isArray(res.data.records)
                ? res.data.records
                : Array.isArray(res.data)
                ? res.data
                : (res.data.records || []);

              const normalized = rows.map((inv) => ({
                ...inv,
                invoiceNo: inv.vno,
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
        fetchPurchaseOrders();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, page, limit, suppliers]);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getPurchaseOrdersApi(page, limit);
      if (res.status === 200) {
        let rows = res.data.records || [];
        rows = rows.map((r) => ({
          ...r,
          invoiceNo: r.vno,
          supplierName: r.supplierName || suppliers.find((s) => String(s.id) === String(r.supplierId) || String(s.id) === String(r.SupplierId))?.name || "-"
        }));
        setPurchasesList(rows);
        setTotalRecords(res.data.totalRecords || rows.length || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching purchase orders", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInactivePurchaseOrders = async () => {
    try {
      const res = await getInactivePurchaseOrdersApi();
      if (res.status === 200) {
        let rows = Array.isArray(res.data) ? res.data : (res.data.records || []);
        rows = rows.map((r) => ({
          ...r,
          id: r.id || r.Id,
          invoiceNo: r.vno || r.VNo,
          date: r.date || r.Date,
          paymentAccount: r.paymentAccount || r.PaymentAccount,
          vehicleNo: r.vehicleNo || r.VehicleNo,
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
      console.error("Error loading inactive items", error);
      toast.error("Failed to load inactive items");
    }
  };

  const toggleInactive = async () => {
    const newVal = !showInactive;
    setShowInactive(newVal);
    if (newVal && inactiveRows.length === 0) {
      await loadInactivePurchaseOrders();
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

  const fetchSettings = async () => {
    try {
      const res = await getSettingsApi();
      if (res.status === 200) {
        setSettings(res.data || {});
      }
    } catch (error) {
      console.error("Error fetching settings", error);
    }
  };

  const handleRefresh = async () => {
    setSearchText("");
    setFilterSupplier("");
    setFilterDate("");
    setSortConfig({ key: null, direction: 'asc' });
    setPage(1);
    await fetchPurchaseOrders();
    if (showInactive) await loadInactivePurchaseOrders();
    toast.success("Refreshed");
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(purchasesList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PurchaseOrders");
    XLSX.writeFile(wb, "purchase_orders.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchase Orders Report", 14, 10);
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
    doc.save("purchase_orders.pdf");
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

    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";

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

  const calculateTaxAmount = (record, type) => {
    const grandTotal = parseFloat(record.grandTotal || record.GrandTotal || 0);
    const discount = parseFloat(record.discount || record.Discount || 0); 
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
              <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Purchase Order</h2>
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
                                onClick={(e) => { e.stopPropagation(); generatePurchaseOrderPDF(p.id, settings); }}
                              >
                                <FileText size={14} className="text-red-300 bg-white" />
                              </button>
                              <button
                                className={`p-1 rounded border bg-white border-gray-700 hover:bg-white ${p.isInactive ? "opacity-30 cursor-not-allowed" : "bg-gray-800"}`}
                                title="Preview Order"
                                disabled={p.isInactive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/app/purchasing/preview-order/${p.id}`, '_blank');
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
                     visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (p) => p.date ? p.date.split('T')[0] : '' },
                    visibleColumns.vehicleNo && { key: "vehicleNo", label: "Vehicle No", sortable: true },
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
                onRowClick={(p, isInactive) => navigate(`/app/purchasing/edit-order/${p.id}`, { state: { isInactive } })}
                
                // Action Bar
                search={searchText}
                onSearch={(val) => setSearchText(val)}
                
                onCreate={() => navigate("/app/purchasing/newpurchaseorder")}
                createLabel="New Purchase Order"
                permissionCreate={hasPermission(PERMISSIONS.PURCHASING.CREATE)}
                
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

export default PurchaseOrder;
