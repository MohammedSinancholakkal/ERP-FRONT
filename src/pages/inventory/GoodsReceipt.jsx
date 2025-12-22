// src/pages/purchase/GoodsReceipt.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Star,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from 'react-hot-toast'
import {
  getGoodsReceiptsApi,
  getInactiveGoodsReceiptsApi,
  deleteGoodsReceiptApi,
  restoreGoodsReceiptApi,
  getSuppliersApi,
  getEmployeesApi,
  getPurchasesApi,
} from "../../services/allAPI";

const GoodsReceipt = () => {
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
  const [searchText, setSearchText] = useState("");

  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterPurchaseBill, setFilterPurchaseBill] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  // dropdown refs & open states for filter bar
  const dropdownRefs = {
    supplier: useRef(null),
    purchaseBill: useRef(null),
    date: useRef(null),
    time: useRef(null),
    employee: useRef(null),
  };
  const [dropdownOpen, setDropdownOpen] = useState({
    supplier: false,
    purchaseBill: false,
    date: false,
    time: false,
    employee: false,
  });
  const [ddSearch, setDdSearch] = useState({
    supplier: "",
    purchaseBill: "",
    employee: "",
  });

  // close dropdowns clicking outside
  useEffect(() => {
    const handler = (e) => {
      Object.keys(dropdownRefs).forEach((k) => {
        if (dropdownRefs[k].current && !dropdownRefs[k].current.contains(e.target)) {
          setDropdownOpen((p) => ({ ...p, [k]: false }));
        }
      });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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
  const filteredRows = rows.filter((r) => {
    let ok = true;
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      ok =
        ok &&
        (String(r.id).includes(s) ||
          r.supplierName.toLowerCase().includes(s) ||
          r.purchaseBill.toLowerCase().includes(s) ||
          (r.reference || "").toLowerCase().includes(s));
    }
    if (filterSupplier) ok = ok && r.supplierName === filterSupplier;
    if (filterPurchaseBill) ok = ok && r.purchaseBill === filterPurchaseBill;
    if (filterDate) ok = ok && r.date === filterDate;
    if (filterTime) ok = ok && r.time === filterTime;
    if (filterEmployee) ok = ok && r.employeeName?.toLowerCase().includes(filterEmployee.toLowerCase());
    return ok;
  });

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
        setRows(normalized)
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
    if (!window.confirm('Are you sure you want to delete this record?')) return
    try {
      const res = await deleteGoodsReceiptApi(id, { userId })
      if (res.status === 200) {
        toast.success('Deleted')
        // refresh
        if (showAll) await fetchAll()
        else if (showInactive) await fetchInactive()
        else await fetchActive()
      }
    } catch (err) {
      console.error('Delete error', err)
      toast.error('Delete failed')
    }
  }

  const handleRestore = async (id) => {
    try {
      const res = await restoreGoodsReceiptApi(id, { userId })
      if (res.status === 200) {
        toast.success('Restored')
        if (showAll) await fetchAll()
        else if (showInactive) await fetchInactive()
        else await fetchActive()
      }
    } catch (err) {
      console.error('Restore error', err)
      toast.error('Restore failed')
    }
  }

  // fetch when page/limit or toggles change
  useEffect(() => {
    if (showAll) {
      fetchAll()
    } else if (showInactive) {
      fetchInactive()
    } else {
      fetchActive()
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
                  <input
                    value={form.supplierSearch || getSupplierName(form.supplier)}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, supplierSearch: e.target.value, supplierDropdown: true }))
                    }
                    onClick={() =>
                      setForm((p) => ({ ...p, supplierDropdown: !p.supplierDropdown }))
                    }
                    placeholder="Search or select supplier..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
                  />
                  <button
                    onClick={openSupplierCreate}
                    className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    <Star size={16} className="text-yellow-400" />
                  </button>
                </div>

                {form.supplierDropdown && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={form.supplierSearch}
                        onChange={(e) => setForm((p) => ({ ...p, supplierSearch: e.target.value }))}
                        placeholder="Type to filter..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      {supplierOptions.filter(s => s.name.toLowerCase().includes((form.supplierSearch || "").toLowerCase())).map(s => (
                        <div
                          key={s.id}
                          onClick={() => setForm((p) => ({ ...p, supplier: s.id, supplierSearch: "", supplierDropdown: false }))}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {s.name}
                        </div>
                      ))}
                      {supplierOptions.filter(s => s.name.toLowerCase().includes((form.supplierSearch || "").toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No suppliers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Bill (searchable + star) */}
              <div className="col-span-1 relative">
                <label className="text-sm">Purchase Bill *</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={form.purchaseBillSearch || getPurchaseName(form.purchaseBill)}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, purchaseBillSearch: e.target.value, purchaseBillDropdown: true }))
                    }
                    onClick={() =>
                      setForm((p) => ({ ...p, purchaseBillDropdown: !p.purchaseBillDropdown }))
                    }
                    placeholder="Search or select purchase bill..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
                  />
                  <button
                    onClick={openPurchaseCreate}
                    className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    <Star size={16} className="text-yellow-400" />
                  </button>
                </div>

                {form.purchaseBillDropdown && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={form.purchaseBillSearch}
                        onChange={(e) => setForm((p) => ({ ...p, purchaseBillSearch: e.target.value }))}
                        placeholder="Type to filter..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      {purchaseOptions.filter(pb => pb.name.toLowerCase().includes((form.purchaseBillSearch || "").toLowerCase())).map(pb => (
                        <div
                          key={pb.id}
                          onClick={() => setForm((p) => ({ ...p, purchaseBill: pb.id, purchaseBillSearch: "", purchaseBillDropdown: false }))}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {pb.name}
                        </div>
                      ))}
                      {purchaseOptions.filter(pb => pb.name.toLowerCase().includes((form.purchaseBillSearch || "").toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No purchase bills</div>
                      )}
                    </div>
                  </div>
                )}
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
                  <input
                    value={form.employeeSearch || getEmployeeName(form.employee)}
                    onChange={(e) => setForm((p) => ({ ...p, employeeSearch: e.target.value, employeeDropdown: true }))}
                    onClick={() => setForm((p) => ({ ...p, employeeDropdown: !p.employeeDropdown }))}
                    placeholder="Search or select employee..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer"
                  />
                  <button
                    onClick={openEmployeeCreate}
                    className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    <Star size={16} className="text-yellow-400" />
                  </button>
                </div>

                {form.employeeDropdown && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={form.employeeSearch}
                        onChange={(e) => setForm((p) => ({ ...p, employeeSearch: e.target.value }))}
                        placeholder="Type to filter..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      {employeeOptions.filter(em => em.name.toLowerCase().includes((form.employeeSearch || "").toLowerCase())).map(em => (
                        <div
                          key={em.id}
                          onClick={() => setForm((p) => ({ ...p, employee: em.id, employeeSearch: "", employeeDropdown: false }))}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {em.name}
                        </div>
                      ))}
                      {employeeOptions.filter(em => em.name.toLowerCase().includes((form.employeeSearch || "").toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No employees</div>
                      )}
                    </div>
                  </div>
                )}
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
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Goods Receipt</h2>

            {/* action bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-64">
                <Search size={16} className="text-gray-300" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search goods receipts..."
                  className="bg-transparent pl-2 text-sm w-full outline-none"
                />
              </div>

              <button
                onClick={() => navigate('/app/inventory/goodsreceipts/newgoodsreceipts')}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
              >
                <Plus size={16} /> New Receipt
              </button>

              <button
                onClick={() => {
                  setSearchText("");
                  // optionally reset filters
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <RefreshCw size={16} className="text-blue-400" />
              </button>

              <button
                onClick={() => {
                  setTempVisibleColumns(visibleColumns);
                  setColumnModalOpen(true);
                }}
                className="p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <List size={16} className="text-blue-300" />
              </button>

              <button
                onClick={async () => {
                  if (!showInactive) await fetchInactive();
                  setShowInactive((s) => !s);
                }}
                className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-2 h-[35px]"
              >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
              </button>
            </div>
            {/* filters */}
            <div className="flex flex-wrap gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
              {/* supplier filter */}
              <div className="relative w-40" ref={dropdownRefs.supplier}>
                <input
                  readOnly
                  onClick={() => setDropdownOpen((p) => ({ ...p, supplier: !p.supplier }))}
                  value={filterSupplier || ""}
                  placeholder="Supplier"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm cursor-pointer"
                />
                {dropdownOpen.supplier && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[180px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={ddSearch.supplier}
                        onChange={(e) => setDdSearch((p) => ({ ...p, supplier: e.target.value }))}
                        placeholder="Search supplier..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                      />
                    </div>
                    {supplierOptions
                      .filter(s => s.name.toLowerCase().includes((ddSearch.supplier || "").toLowerCase()))
                      .map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setFilterSupplier(s.name);
                            setDropdownOpen((p) => ({ ...p, supplier: false }));
                            setDdSearch((p) => ({ ...p, supplier: "" }));
                          }}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {s.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* purchase bill filter */}
              <div className="relative w-36" ref={dropdownRefs.purchaseBill}>
                <input
                  readOnly
                  onClick={() => setDropdownOpen((p) => ({ ...p, purchaseBill: !p.purchaseBill }))}
                  value={filterPurchaseBill || ""}
                  placeholder="Purchase Bill"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm cursor-pointer"
                />
                {dropdownOpen.purchaseBill && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[160px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={ddSearch.purchaseBill}
                        onChange={(e) => setDdSearch((p) => ({ ...p, purchaseBill: e.target.value }))}
                        placeholder="Search bill..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                      />
                    </div>
                    {purchaseOptions.filter(pb => pb.name.toLowerCase().includes((ddSearch.purchaseBill || "").toLowerCase())).map(pb => (
                      <div
                        key={pb.id}
                        onClick={() => {
                          setFilterPurchaseBill(pb.name);
                          setDropdownOpen((p) => ({ ...p, purchaseBill: false }));
                          setDdSearch((p) => ({ ...p, purchaseBill: "" }));
                        }}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                      >
                        {pb.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* date filter */}
              <div className="w-36">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>

              {/* time filter */}
              <div className="w-28">
                <input
                  type="time"
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
                />
              </div>

              {/* employee filter */}
              <div className="relative w-40" ref={dropdownRefs.employee}>
                <input
                  readOnly
                  onClick={() => setDropdownOpen((p) => ({ ...p, employee: !p.employee }))}
                  value={filterEmployee || ""}
                  placeholder="Employee"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm cursor-pointer"
                />
                {dropdownOpen.employee && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded shadow max-h-[160px] overflow-auto">
                    <div className="p-2">
                      <input
                        value={ddSearch.employee}
                        onChange={(e) => setDdSearch((p) => ({ ...p, employee: e.target.value }))}
                        placeholder="Search employee..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                      />
                      {employeeOptions.length === 0 && (
                        <div className="text-xs text-yellow-500 mt-2">Loading employees... ({employeeOptions.length})</div>
                      )}
                    </div>
                    {employeeOptions && employeeOptions.length > 0 ? (
                      employeeOptions.filter(em => em.name && em.name.toLowerCase().includes((ddSearch.employee || "").toLowerCase())).map(em => (
                        <div
                          key={em.id}
                          onClick={() => {
                            setFilterEmployee(em.name);
                            setDropdownOpen((p) => ({ ...p, employee: false }));
                            setDdSearch((p) => ({ ...p, employee: "" }));
                          }}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {em.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-400">No employees available</div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setFilterSupplier("");
                  setFilterPurchaseBill("");
                  setFilterDate("");
                  setFilterTime("");
                  setFilterEmployee("");
                }}
                className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>

            {/* table (scroll behavior same as Bank Transactions) */}
            <div className="flex-grow overflow-auto w-full min-h-0">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1200px] border-separate border-spacing-y-1 text-sm table-fixed">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white text-center">
                      {visibleColumns.id && <th className="pb-2 border-b">ID</th>}
                      {visibleColumns.supplier && <th className="pb-2 border-b">Supplier</th>}
                      {visibleColumns.purchaseBill && <th className="pb-2 border-b">Purchase Bill</th>}
                      {visibleColumns.date && <th className="pb-2 border-b">Date</th>}
                      {visibleColumns.totalQuantity && <th className="pb-2 border-b">Total Qty</th>}
                      {visibleColumns.employee && <th className="pb-2 border-b">Employee</th>}
                      {visibleColumns.remarks && <th className="pb-2 border-b">Remarks</th>}
                      {visibleColumns.reference && <th className="pb-2 border-b">Reference</th>}
                    </tr>
                  </thead>

                  <tbody className="text-center">
                    {filteredRows.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`, {
                          state: { mode: !r.isActive ? 'restore' : 'edit' }
                        })}
                        className={`bg-gray-900 cursor-pointer ${!r.isActive
                          ? "opacity-40 line-through hover:bg-gray-800"
                          : "hover:bg-gray-700"
                          }`}
                      >
                        {visibleColumns.id && <td className="px-2 py-3 text-center">{r.id}</td>}
                        {visibleColumns.supplier && (
                          <td className="px-2 py-3 text-center">{r.supplierName}</td>
                        )}
                        {visibleColumns.purchaseBill && (
                          <td className="px-2 py-3 text-center">{r.purchaseBill}</td>
                        )}
                        {visibleColumns.date && <td className="px-2 py-3 text-center">{r.date}</td>}
                        {visibleColumns.totalQuantity && (
                          <td className="px-2 py-3 text-center">{r.totalQuantity}</td>
                        )}
                        {visibleColumns.employee && (
                          <td className="px-2 py-3 text-center">{r.employeeName}</td>
                        )}
                        {visibleColumns.remarks && (
                          <td className="px-2 py-3 text-center">{r.remarks}</td>
                        )}
                        {visibleColumns.reference && (
                          <td className="px-2 py-3 text-center">{r.reference}</td>
                        )}
                      </tr>
                    ))}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={Object.values(visibleColumns).filter(Boolean).length}
                          className="px-4 py-6 text-center text-gray-400"
                        >
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>


            {/* pagination */}
            <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option value={n} key={n}>{n}</option>
                ))}
              </select>

              <button disabled={page === 1} onClick={() => setPage(1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronsLeft size={16} />
              </button>

              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
                value={page}
                onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))}
              />

              <span>/ {totalPages}</span>

              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronRight size={16} />
              </button>

              <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
                <ChevronsRight size={16} />
              </button>

              <span>
                Showing <b>{start}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
              </span>
            </div>
          </div>

          {/* column picker modal */}
          {columnModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setColumnModalOpen(false)} />
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
                      {Object.keys(tempVisibleColumns).filter(col => tempVisibleColumns[col]).filter(col => col.includes(columnSearch)).map(col => (
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
                      {Object.keys(tempVisibleColumns).filter(col => !tempVisibleColumns[col]).filter(col => col.includes(columnSearch)).map(col => (
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
        </div>
      </PageLayout>
    </>
  );
};

export default GoodsReceipt;
