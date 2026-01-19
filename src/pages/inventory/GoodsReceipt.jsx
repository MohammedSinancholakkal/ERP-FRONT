// src/pages/purchase/GoodsReceipt.jsx
import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Star,
  ArchiveRestore,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import MasterTable from "../../components/MasterTable";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import {
  getGoodsReceiptsApi,
  getInactiveGoodsReceiptsApi,
  deleteGoodsReceiptApi,
  restoreGoodsReceiptApi,
  getSuppliersApi,
  getEmployeesApi,
  getPurchasesApi,
} from "../../services/allAPI";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";

const GoodsReceipt = () => {
    const { theme } = useTheme();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user"))
  const userId = userData?.userId || userData?.id || userData?.Id

  /* -------------------- column picker -------------------- */
  const defaultColumns = {
    id: true,
    supplier: true,
    purchaseBill: true,
    date: true,
    totalQuantity: true,
    employee: true,
    remarks: true,
    reference: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  /* -------------------- server-driven lists (populated after fetch) -------------------- */
  const [supplierOptions, setSupplierOptions] = useState([])
  const [purchaseOptions, setPurchaseOptions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])

  /* -------------------- data rows -------------------- */
  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverTotal, setServerTotal] = useState(0);

  /* -------------------- search & filters -------------------- */
  /* -------------------- search & filters -------------------- */
  const [searchText, setSearchText] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterPurchaseBill, setFilterPurchaseBill] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  
  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // -------------------- pagination -------------------- 
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const totalRecords = showInactive ? inactiveRows.length : (showAll ? rows.length : (serverTotal || rows.length));
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  /* -------------------- modal (new goods receipt) -------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const todayDate = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5); // HH:MM

  const [form, setForm] = useState({
    supplier: "",
    supplierSearch: "",
    supplierDropdown: false,
    purchaseBill: "",
    purchaseBillSearch: "",
    purchaseBillDropdown: false,
    date: todayDate,
    time: nowTime,
    totalQuantity: "",
    employee: "",
    employeeSearch: "",
    employeeDropdown: false,
    employeeRemarks: "",
    reference: "",
  });

  // helper to reset form
  const resetForm = () =>
    setForm({
      supplier: "",
      supplierSearch: "",
      supplierDropdown: false,
      purchaseBill: "",
      purchaseBillSearch: "",
      purchaseBillDropdown: false,
      date: todayDate,
      time: nowTime,
      totalQuantity: "",
      employee: "",
      employeeSearch: "",
      employeeDropdown: false,
      employeeRemarks: "",
      reference: "",
    });

  const handleAdd = () => {
    // required fields (reference is optional)
    if (
      !form.supplier ||
      !form.purchaseBill ||
      !form.date ||
      !form.time ||
      form.totalQuantity === "" ||
      !form.employee ||
      !form.employeeRemarks
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const entry = {
      id: rows.length + 1,
      supplier: form.supplier,
      purchaseBill: form.purchaseBill,
      date: form.date,
      time: form.time,
      totalQuantity: Number(form.totalQuantity),
      employeeRemarks: form.employeeRemarks,
      reference: form.reference || "",
      isActive: true,
    };

    setRows((r) => [...r, entry]);
    setModalOpen(false);
    resetForm();
  };

  /* -------------------- filtering logic (client side) -------------------- */
  const filteredRows = React.useMemo(() => {
    let list = rows;
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      list = list.filter(r =>
        String(r.id).includes(s) ||
          (r.supplierName || "").toLowerCase().includes(s) ||
          (r.purchaseBill || "").toLowerCase().includes(s) ||
          (r.reference || "").toLowerCase().includes(s)
      );
    }
    if (filterSupplier) list = list.filter(r => r.supplierName === filterSupplier);
    if (filterPurchaseBill) list = list.filter(r => r.purchaseBill === filterPurchaseBill);
    if (filterEmployee) list = list.filter(r => r.employeeName?.toLowerCase().includes(filterEmployee.toLowerCase()));
    return list;
  }, [rows, searchText, filterSupplier, filterPurchaseBill, filterEmployee]);

    // --- SORTING LOGIC ---
  const sortedList = React.useMemo(() => {
    let sortableItems = [...filteredRows];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        if (['id', 'totalQuantity'].includes(sortConfig.key)) {
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
  }, [filteredRows, sortConfig]);

  // --- FILTER BAR CONFIG ---
  const filters = [
      {
          type: 'select',
          value: filterSupplier,
          onChange: setFilterSupplier,
          options: supplierOptions,
          placeholder: "All Suppliers"
      },
      {
          type: 'select',
          value: filterPurchaseBill,
          onChange: setFilterPurchaseBill,
          options: purchaseOptions,
          placeholder: "All Bills"
      },
      {
          type: 'select',
          value: filterEmployee,
          onChange: setFilterEmployee,
          options: employeeOptions,
          placeholder: "All Employees"
      }
  ];

  const handleClearFilters = () => {
    setSearchText("");
    setFilterSupplier("");
    setFilterPurchaseBill("");
    setFilterEmployee("");
    setSortConfig({ key: null, direction: 'asc' });
  };

  // -------------------- server interactions --------------------
  const normalize = (rec) => {
    // defensive normalization of various backend shapes into consistent table fields
    if (!rec || typeof rec !== 'object') return {
      id: '', supplierId: '', supplierName: '', purchaseBillId: '', purchaseBill: '', date: '', time: '', totalQuantity: 0, employeeId: '', employeeName: '', remarks: '', reference: '', isActive: true
    }

    const id = rec.id ?? rec.Id ?? rec.goodsReceiptId ?? rec.GoodsReceiptId ?? ''

    // Extract supplier ID and name separately
    const supplierId = rec.SupplierId ?? rec.supplierId ?? rec.Supplier?.id ?? rec.supplier?.id ?? ''
    const supplierName = (rec.supplierName ?? rec.SupplierName) ||
      ((rec.supplier && (rec.supplier.name || rec.supplier.companyName)) || (rec.Supplier && (rec.Supplier.name || rec.Supplier.companyName))) ||
      (typeof rec.supplier === 'string' ? rec.supplier : '') || ''

    // Extract purchase ID and bill
    const purchaseBillId = rec.PurchaseId ?? rec.purchaseId ?? rec.PurchaseOrderId ?? ''
    const purchaseBill = rec.purchaseInvoice ?? rec.PurchaseInvoice ?? rec.reference ?? rec.Reference ?? rec.vNo ?? rec.VNo ?? rec.invoiceNo ?? rec.invoice ?? ''

    const rawDate = rec.date ?? rec.Date ?? rec.CreatedAt ?? rec.createdAt ?? ''
    let date = ''
    try {
      if (rawDate) {
        const s = String(rawDate)
        date = s.includes('T') ? s.split('T')[0] : s.split(' ')[0]
      }
    } catch (e) {
      date = ''
    }

    const time = rec.time ?? rec.Time ?? ''
    const totalQuantity = rec.totalQuantity ?? rec.TotalQuantity ?? rec.TotalQty ?? rec.Total ?? 0

    // Extract employee ID and name separately
    const employeeId = rec.EmployeeId ?? rec.employeeId ?? rec.Employee?.id ?? rec.employee?.id ?? ''
    const employeeName = rec.employeeName ?? rec.EmployeeName ?? rec.employee?.name ?? rec.Employee?.name ?? (typeof rec.employee === 'string' ? rec.employee : '') ?? ''

    const remarks = rec.remarks ?? rec.Remarks ?? rec.employeeRemarks ?? rec.EmployeeRemarks ?? ''
    const reference = rec.reference ?? rec.Reference ?? rec.ref ?? ''
    const isActive = (rec.isActive ?? rec.IsActive) !== undefined ? (rec.isActive ?? rec.IsActive) : (rec.deleted ? false : true)

    return { id, supplierId, supplierName, purchaseBillId, purchaseBill, date, time, totalQuantity, employeeId, employeeName, remarks, reference, isActive }
  };

  // Helper to map IDs to display names using lookup tables
  const mapDisplayNames = (record) => {
    const mapped = { ...record }

    // Map supplier ID to supplier name
    if (record.supplierId && !record.supplierName && supplierOptions.length > 0) {
      const supplierOpt = supplierOptions.find(s => s.id == record.supplierId)
      if (supplierOpt) mapped.supplierName = supplierOpt.name
    }

    // Map employee ID to employee name
    if (record.employeeId && !record.employeeName && employeeOptions.length > 0) {
      const employeeOpt = employeeOptions.find(e => e.id == record.employeeId)
      if (employeeOpt) mapped.employeeName = employeeOpt.name
    }

    // Map purchase ID to purchase reference
    if (record.purchaseBillId && !record.purchaseBill && purchaseOptions.length > 0) {
      const purchaseOpt = purchaseOptions.find(p => p.id == record.purchaseBillId)
      if (purchaseOpt) mapped.purchaseBill = purchaseOpt.name
    }

    return mapped
  };

  const fetchActive = async () => {
    setLoading(true)
    try {
      const res = await getGoodsReceiptsApi(page, limit)
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : (res?.data ?? [])
        const normalized = records.map(rec => normalize(rec))
        setRows(normalized)
        setServerTotal(res?.data?.totalRecords ?? normalized.length)
      }
    } catch (err) {
      console.error('Error fetching goods receipts', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchInactive = async () => {
    setLoading(true)
    try {
      const res = await getInactiveGoodsReceiptsApi()
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : (res?.data ?? [])
        const normalized = records.map(rec => ({ ...normalize(rec), isActive: false }))
        setInactiveRows(normalized)
        // setRows(normalized) // DO NOT REPLACE ACTIVE ROWS
      }
    } catch (err) {
      console.error('Error fetching inactive goods receipts', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [activeRes, inactiveRes] = await Promise.all([getGoodsReceiptsApi(1, 1000), getInactiveGoodsReceiptsApi()])
      const active = activeRes.status === 200 ? (Array.isArray(activeRes.data.records) ? activeRes.data.records : activeRes.data || []) : []
      const inactive = inactiveRes.status === 200 ? (Array.isArray(inactiveRes.data.records) ? inactiveRes.data.records : inactiveRes.data || []) : []
      const combined = [...active, ...inactive].map(rec => normalize(rec))
      setRows(combined)
      setServerTotal(combined.length)
    } catch (err) {
      console.error('Error fetching all goods receipts', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const result = await showDeleteConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await deleteGoodsReceiptApi(id, { userId })
      if (res.status === 200) {
        showSuccessToast('Deleted')
        // refresh
        if (showAll) await fetchAll()
        else {
          await fetchActive()
          if(showInactive) await fetchInactive()
        }
      }
    } catch (err) {
      console.error('Delete error', err)
      showErrorToast('Delete failed')
    }
  }

  const handleRestore = async (id) => {
    const result = await showRestoreConfirm();

    if (!result.isConfirmed) return;

    try {
      const res = await restoreGoodsReceiptApi(id, { userId })
      if (res.status === 200) {
        showSuccessToast('Restored')
        if (showAll) await fetchAll()
        else {
          await fetchActive()
          if(showInactive) await fetchInactive()
        }
      }
    } catch (err) {
      console.error('Restore error', err)
      showErrorToast('Restore failed')
    }
  }

  // fetch when page/limit or toggles change
  useEffect(() => {
    if (showAll) {
      fetchAll()
    } else {
      fetchActive();
      if (showInactive) {
        fetchInactive();
      }
    }
  }, [page, limit, showInactive, showAll])


  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [suppRes, empRes, purchRes] = await Promise.all([
          getSuppliersApi(1, 1000),
          getEmployeesApi(1, 1000),
          getPurchasesApi(1, 1000)
        ])

        // extract suppliers (handle various response shapes)
        const suppliers = suppRes?.data?.records || suppRes?.data || []
        const supplierOpts = Array.isArray(suppliers)
          ? suppliers.map(s => ({ id: s.id || s.Id || s.SupplierId, name: s.companyName || s.name || s.CompanyName || s.Name || '' }))
          : []
        setSupplierOptions(supplierOpts)
        // console.log('Suppliers loaded:', supplierOpts)

        // extract employees with detailed debugging
        const employees = empRes?.data?.records || empRes?.data || []
        // console.log('Raw employee response:', empRes?.data)
        // console.log('Employees array:', employees)

        const employeeOpts = Array.isArray(employees)
          ? employees.map(e => {
            const empId = e.id || e.Id || e.EmployeeId || e.employeeId
            const empName = e.fullName || e.FullName || e.firstName || e.FirstName ||
              e.first_name || e.First_Name ||
              e.name || e.Name ||
              e.employeeName || e.EmployeeName ||
              e.employee_name ||
              `Employee ${empId}` || ''
            // console.log('Processing employee:', { raw: e, empId, empName })
            return { id: empId, name: empName }
          })
          : []
        // console.log('Processed employee options:', employeeOpts)
        setEmployeeOptions(employeeOpts)

        // extract purchases
        const purchases = purchRes?.data?.records || purchRes?.data || []
        const purchaseOpts = Array.isArray(purchases)
          ? purchases.map(p => ({ id: p.id || p.Id || p.PurchaseId, name: p.vNo || p.VNo || p.reference || p.Reference || p.invoiceNo || '' }))
          : []
        setPurchaseOptions(purchaseOpts)
        // console.log('Purchases loaded:', purchaseOpts)
      } catch (err) {
        console.error('Error fetching dropdown lists', err)
      }
    }
    fetchLists()
  }, [])

  /* -------------------- small helpers -------------------- */
  const openSupplierCreate = () => navigate("/app/business-partners/new-supplier")
  const openPurchaseCreate = () => navigate("/app/purchases/new-purchases")
  const openEmployeeCreate = () => navigate("/app/human-resource/new-employee")

  // Helper to get display name from ID
  const getSupplierName = (id) => supplierOptions.find(s => s.id == id)?.name || ''
  const getPurchaseName = (id) => purchaseOptions.find(p => p.id == id)?.name || ''
  const getEmployeeName = (id) => employeeOptions.find(e => e.id == id)?.name || ''

  // Dedicated function to load employees separately
  const loadEmployeeOptions = async () => {
    try {
      const res = await getEmployeesApi(1, 1000)
      // console.log('loadEmployeeOptions - API Response:', res?.data)

      
      const employees = res?.data?.records || res?.data || []
      // console.log('loadEmployeeOptions - Employees array:', employees)

      if (Array.isArray(employees) && employees.length > 0) {
        const employeeOpts = employees.map(e => {
          const empId = e.id || e.Id || e.EmployeeId || e.employeeId
          // Try multiple field names for employee name
          const empName = e.fullName || e.FullName || e.firstName || e.FirstName ||
            e.first_name || e.First_Name ||
            e.name || e.Name ||
            e.employeeName || e.EmployeeName ||
            e.employee_name ||
            `Employee ${empId}` || ''
          // console.log('Employee extraction:', { id: empId, name: empName, raw: e })
          return { id: empId, name: empName }
        })
        // console.log('loadEmployeeOptions - Processed options:', employeeOpts)
        setEmployeeOptions(employeeOpts)
        return employeeOpts
      } else {
        // console.warn('loadEmployeeOptions - No employees found')
        setEmployeeOptions([])
        return []
      }
    } catch (err) {
      console.error('loadEmployeeOptions - Error:', err)
      return []
    }
  }

  // Trigger employee loading when component mounts and when needed
  useEffect(() => {
    loadEmployeeOptions()
  }, [])

  /* -------------------- render -------------------- */
  return (
    <>
      {/* ---------- ADD MODAL ---------- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-[900px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white border border-gray-700 rounded-lg shadow-xl">
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Goods Receipt</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white">
                <X />
              </button>

            </div>

            <div className="p-6 grid grid-cols-3 gap-4">
              {/* Supplier (searchable + star) */}
              <div className="col-span-1 relative">
                <label className="text-sm">Supplier *</label>
                <div className="flex gap-2 items-center">
                  <SearchableSelect
                    options={supplierOptions}
                    value={form.supplier}
                    onChange={(v) => setForm((p) => ({ ...p, supplier: v }))}
                    placeholder="Search or select supplier..."
                    className="w-full"
                  />
                  <button
                    onClick={openSupplierCreate}
                    className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    <Star size={16} className="" />
                  </button>
                </div>


              </div>

              {/* Purchase Bill (searchable + star) */}
              <div className="col-span-1 relative">
                <label className="text-sm">Purchase Bill *</label>
                <div className="flex gap-2 items-center">
                  <SearchableSelect
                    options={purchaseOptions}
                    value={form.purchaseBill}
                    onChange={(v) => setForm((p) => ({ ...p, purchaseBill: v }))}
                    placeholder="Search or select purchase bill..."
                    className="w-full"
                  />
                  <button
                    onClick={openPurchaseCreate}
                    className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    <Star size={16} className="" />
                  </button>
                </div>


              </div>

              {/* Date */}
              <div>
                <label className="text-sm">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-sm">Time *</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Total Quantity */}
              <div>
                <label className="text-sm">Total Quantity *</label>
                <input
                  type="number"
                  value={form.totalQuantity}
                  onChange={(e) => setForm((p) => ({ ...p, totalQuantity: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Employee (searchable + star) */}
              <div className="relative col-span-2">
                <label className="text-sm">Employee *</label>
                <div className="flex gap-2 items-center">
                  <SearchableSelect
                    options={employeeOptions}
                    value={form.employee}
                    onChange={(v) => setForm((p) => ({ ...p, employee: v }))}
                    placeholder="Search or select employee..."
                    className="w-full"
                  />
                  <button
                    onClick={openEmployeeCreate}
                    className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    <Star size={16} className="" />
                  </button>
                </div>


              </div>

              {/* Employee Remarks */}
              <div className="col-span-3">
                <label className="text-sm">Employee Remarks *</label>
                <textarea
                  rows={3}
                  value={form.employeeRemarks}
                  onChange={(e) => setForm((p) => ({ ...p, employeeRemarks: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  placeholder="Enter remarks..."
                />
              </div>

              {/* Reference */}
              <div className="col-span-3">
                <label className="text-sm">Reference (optional)</label>
                <input
                  value={form.reference}
                  onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
                  placeholder="Reference / PO / GRN..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  resetForm();
                  setModalOpen(false);
                }}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

       {/* ---------- MAIN PAGE ---------- */}
      <PageLayout>
         <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
           <ContentCard>
           <div className="flex flex-col h-full overflow-hidden gap-2">
             <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Goods Receipt</h2>
             <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "Number", sortable: true },
                    visibleColumns.supplier && { key: "supplierName", label: "Supplier", sortable: true },
                    visibleColumns.purchaseBill && { key: "purchaseBill", label: "Bill", sortable: true },
                    visibleColumns.date && { key: "date", label: "Date", sortable: true },
                    visibleColumns.totalQuantity && { key: "totalQuantity", label: "Total Qty", sortable: true },
                    visibleColumns.employee && { key: "employeeName", label: "Employee", sortable: true },
                    visibleColumns.remarks && { key: "remarks", label: "Remarks", sortable: true },
                    visibleColumns.reference && { key: "reference", label: "Reference", sortable: true },
                ].filter(Boolean)}
                data={showAll ? sortedList.slice(start - 1, end) : sortedList}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(r, isInactive) => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`, { state: { mode: isInactive ? 'restore' : 'edit' } })}
                // Action Bar Props
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => navigate('/app/inventory/goodsreceipts/newgoodsreceipts')}
                createLabel="New Receipt"
                permissionCreate={hasPermission(PERMISSIONS.INVENTORY.GOODS_RECEIPTS.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setFilterSupplier("");
                    setFilterPurchaseBill("");
                    setFilterEmployee("");
                    if(showAll) fetchAll();
                    else {
                        setPage(1);
                        fetchActive();
                    }
                }}
                onColumnSelector={() => {
                    setTempVisibleColumns(visibleColumns);
                    setColumnModalOpen(true);
                }}
                onToggleInactive={async () => {
                    if (!showInactive) await fetchInactive();
                    setShowInactive((s) => !s);
                }}
             >
                <div className="">
                  <FilterBar filters={filters} onClear={handleClearFilters} />
                </div>
             </MasterTable>

             <Pagination
               page={page}
               setPage={setPage}
               limit={limit}
               setLimit={setLimit}
               total={totalRecords}
               onRefresh={() => {
                   if(showAll) fetchAll()
                   else fetchActive()
               }}
             />
           </div>
           </ContentCard>
         </div>

         {/* COLUMN TYPE */}
         <ColumnPickerModal
           isOpen={columnModalOpen}
           onClose={() => setColumnModalOpen(false)}
           visibleColumns={visibleColumns}
           setVisibleColumns={setVisibleColumns}
           defaultColumns={defaultColumns}
         />
      </PageLayout>

    </>
  );
};

export default GoodsReceipt;



