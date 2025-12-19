// src/pages/purchase/GoodsReceipts.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import {
  getGoodsReceiptsApi,
  getInactiveGoodsReceiptsApi,
  deleteGoodsReceiptApi,
  restoreGoodsReceiptApi,
  getSuppliersApi,
  getEmployeesApi,
  getPurchasesApi,
} from "../../services/allAPI";

const GoodsReceipts = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = userData?.userId || userData?.id || userData?.Id;

  /* -------------------- UI state -------------------- */
  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [purchaseOptions, setPurchaseOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  /* toggles */
  const [showInactive, setShowInactive] = useState(false); // show only inactive
  const [showAll, setShowAll] = useState(false); // show both active + inactive

  /* search / filters / pagination */
  const [searchText, setSearchText] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterPurchaseBill, setFilterPurchaseBill] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [serverTotal, setServerTotal] = useState(0);

  /* dropdown helpers (keeps code similar to yours) */
  const dropdownRefs = {
    supplier: useRef(null),
    purchaseBill: useRef(null),
    employee: useRef(null),
  };
  const [dropdownOpen, setDropdownOpen] = useState({
    supplier: false,
    purchaseBill: false,
    employee: false,
  });
  const [ddSearch, setDdSearch] = useState({
    supplier: "",
    purchaseBill: "",
    employee: "",
  });

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

  /* -------------------- normalization -------------------- */
  const normalize = (rec) => {
    if (!rec || typeof rec !== "object")
      return {
        id: "",
        supplierId: "",
        supplierName: "",
        purchaseBillId: "",
        purchaseBill: "",
        date: "",
        time: "",
        totalQuantity: 0,
        employeeId: "",
        employeeName: "",
        remarks: "",
        reference: "",
        isActive: true,
      };

    const id = rec.id ?? rec.Id ?? rec.goodsReceiptId ?? rec.GoodsReceiptId ?? "";

    const supplierId =
      rec.SupplierId ?? rec.supplierId ?? rec.Supplier?.id ?? rec.supplier?.id ?? "";
    const supplierName =
      rec.supplierName ??
      rec.SupplierName ??
      (rec.supplier && (rec.supplier.name || rec.supplier.companyName)) ??
      (rec.Supplier && (rec.Supplier.name || rec.Supplier.companyName)) ??
      (typeof rec.supplier === "string" ? rec.supplier : "") ??
      "";

    const purchaseBillId = rec.PurchaseId ?? rec.purchaseId ?? rec.PurchaseOrderId ?? "";
    const purchaseBill =
      rec.reference ??
      rec.Reference ??
      rec.vNo ??
      rec.VNo ??
      rec.invoiceNo ??
      rec.invoice ??
      "";

    const rawDate = rec.date ?? rec.Date ?? rec.CreatedAt ?? rec.createdAt ?? "";
    let date = "";
    try {
      if (rawDate) {
        const s = String(rawDate);
        date = s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
      }
    } catch (e) {
      date = "";
    }

    const time = rec.time ?? rec.Time ?? "";
    const totalQuantity = rec.totalQuantity ?? rec.TotalQuantity ?? rec.TotalQty ?? rec.Total ?? 0;

    const employeeId =
      rec.EmployeeId ?? rec.employeeId ?? rec.Employee?.id ?? rec.employee?.id ?? "";
    const employeeName =
      rec.employeeName ?? rec.EmployeeName ?? rec.employee?.name ?? rec.Employee?.name ?? "";

    const remarks =
      rec.remarks ?? rec.Remarks ?? rec.employeeRemarks ?? rec.EmployeeRemarks ?? "";
    const reference = rec.reference ?? rec.Reference ?? rec.ref ?? "";

    // isActive defensively
    const isActive =
      rec.IsActive !== undefined
        ? Boolean(rec.IsActive)
        : rec.isActive !== undefined
        ? Boolean(rec.isActive)
        : rec.deleted
        ? false
        : true;

    return {
      id,
      supplierId,
      supplierName,
      purchaseBillId,
      purchaseBill,
      date,
      time,
      totalQuantity,
      employeeId,
      employeeName,
      remarks,
      reference,
      isActive,
    };
  };

  /* -------------------- fetchers -------------------- */
  const fetchActive = async (p = page, l = limit) => {
    setLoading(true);
    try {
      // call with numeric page & limit
      const res = await getGoodsReceiptsApi(p, l);
      if (res.status === 200) {
        // your backend earlier returned records + total; be defensive
        const records = Array.isArray(res?.data?.records) ? res.data.records : res?.data?.records ?? res?.data ?? [];
        const normalized = records.map((rec) => normalize(rec));
        setRows(normalized);
        // support different shapes for total
        const total = res?.data?.total ?? res?.data?.totalRecords ?? res?.data?.totalCount ?? normalized.length;
        setServerTotal(Number(total));
      } else {
        setRows([]);
        setServerTotal(0);
      }
    } catch (err) {
      console.error("Error fetching goods receipts", err);
      setRows([]);
      setServerTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchInactive = async () => {
    setLoading(true);
    try {
      const res = await getInactiveGoodsReceiptsApi();
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : res?.data ?? [];
        const normalized = records.map((rec) => normalize(rec));
        setInactiveRows(normalized);
      } else {
        setInactiveRows([]);
      }
    } catch (err) {
      console.error("Error fetching inactive goods receipts", err);
      setInactiveRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      // we'll request a large page so we get all active records (or you can loop)
      const activeRes = await getGoodsReceiptsApi(1, 1000);
      const inactiveRes = await getInactiveGoodsReceiptsApi();

      const activeRecords = activeRes?.status === 200 ? (Array.isArray(activeRes.data.records) ? activeRes.data.records : activeRes.data ?? []) : [];
      const inactiveRecords = inactiveRes?.status === 200 ? (Array.isArray(inactiveRes.data.records) ? inactiveRes.data.records : inactiveRes.data ?? []) : [];

      const combined = [...activeRecords, ...inactiveRecords].map((rec) => normalize(rec));
      setRows(combined);
      setServerTotal(combined.length);
    } catch (err) {
      console.error("Error fetching all goods receipts", err);
      setRows([]);
      setServerTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // load lookup lists (suppliers, employees, purchases)
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [suppRes, empRes, purchRes] = await Promise.all([
          getSuppliersApi(1, 1000),
          getEmployeesApi(1, 1000),
          getPurchasesApi(1, 1000),
        ]);

        const suppliers = suppRes?.data?.records || suppRes?.data || [];
        const supplierOpts = Array.isArray(suppliers)
          ? suppliers.map((s) => ({ id: s.id ?? s.Id ?? s.SupplierId, name: s.companyName ?? s.name ?? s.CompanyName ?? s.Name ?? "" }))
          : [];
        setSupplierOptions(supplierOpts);

        const employees = empRes?.data?.records || empRes?.data || [];
        const employeeOpts = Array.isArray(employees)
          ? employees.map((e) => ({ id: e.id ?? e.Id ?? e.EmployeeId, name: e.fullName ?? e.FullName ?? e.firstName ?? e.FirstName ?? e.name ?? e.Name ?? `Employee ${e.id ?? e.Id}` }))
          : [];
        setEmployeeOptions(employeeOpts);

        const purchases = purchRes?.data?.records || purchRes?.data || [];
        const purchaseOpts = Array.isArray(purchases)
          ? purchases.map((p) => ({ id: p.id ?? p.Id ?? p.PurchaseId, name: p.vNo ?? p.VNo ?? p.reference ?? p.Reference ?? p.invoiceNo ?? "" }))
          : [];
        setPurchaseOptions(purchaseOpts);
      } catch (err) {
        console.error("Error fetching dropdown lists", err);
      }
    };
    fetchLists();
  }, []);

  /* fetch when toggles or page/limit change */
  useEffect(() => {
    if (showAll) {
      fetchAll();
    } else if (showInactive) {
      // show only inactive
      fetchInactive();
    } else {
      // active paginated
      fetchActive(page, limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, showInactive, showAll]);

  /* -------------------- actions -------------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await deleteGoodsReceiptApi(id, { userId });
      if (res.status === 200) {
        toast.success("Deleted");
        // refresh current view
        if (showAll) await fetchAll();
        else if (showInactive) await fetchInactive();
        else await fetchActive(page, limit);
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      console.error("Delete error", err);
      toast.error("Delete failed");
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this goods receipt?")) return;
    try {
      const res = await restoreGoodsReceiptApi(id, { userId });
      if (res.status === 200) {
        toast.success("Restored");
        if (showAll) await fetchAll();
        else if (showInactive) await fetchInactive();
        else await fetchActive(page, limit);
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error("Restore error", err);
      toast.error("Restore failed");
    }
  };

  /* helpers to get display names from lookups */
  const getSupplierName = (id) => supplierOptions.find((s) => s.id == id)?.name || "";
  const getPurchaseName = (id) => purchaseOptions.find((p) => p.id == id)?.name || "";
  const getEmployeeName = (id) => employeeOptions.find((e) => e.id == id)?.name || "";

  /* client-side filtering (works on whichever source is active) */
  const dataSource = showInactive ? inactiveRows : rows;
  const filteredRows = dataSource.filter((r) => {
    let ok = true;
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      ok =
        ok &&
        (String(r.id).toLowerCase().includes(s) ||
          (r.supplierName || "").toLowerCase().includes(s) ||
          (r.purchaseBill || "").toLowerCase().includes(s) ||
          (r.reference || "").toLowerCase().includes(s));
    }
    if (filterSupplier) ok = ok && r.supplierName === filterSupplier;
    if (filterPurchaseBill) ok = ok && r.purchaseBill === filterPurchaseBill;
    if (filterDate) ok = ok && r.date === filterDate;
    if (filterTime) ok = ok && r.time === filterTime;
    if (filterEmployee) ok = ok && (r.employeeName || "").toLowerCase().includes(filterEmployee.toLowerCase());
    return ok;
  });

  /* pagination numbers (client-side) */
  const totalRecords = showInactive ? inactiveRows.length : showAll ? rows.length : serverTotal || rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  /* Toggle handlers */
  const toggleShowInactive = () => {
    setShowAll(false);
    setShowInactive((s) => {
      const newVal = !s;
      setPage(1);
      return newVal;
    });
  };
  const toggleShowAll = () => {
    setShowInactive(false);
    setShowAll((s) => {
      const newVal = !s;
      setPage(1);
      return newVal;
    });
  };

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
          <h2 className="text-2xl font-semibold mb-4">Goods Receipts</h2>

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
              onClick={() => navigate("/app/inventory/goodsreceipts/newgoodsreceipts")}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
            >
              <Plus size={16} /> New Receipt
            </button>

            <button
              onClick={() => {
                setSearchText("");
                setFilterSupplier("");
                setFilterPurchaseBill("");
                setFilterDate("");
                setFilterTime("");
                setFilterEmployee("");
              }}
              className="p-2 bg-gray-700 border border-gray-600 rounded"
            >
              <RefreshCw size={16} className="text-blue-400" />
            </button>

            <button
              onClick={() => {
                // open column picker if you have one; placeholder
                // setColumnModalOpen(true)
              }}
              className="p-2 bg-gray-700 border border-gray-600 rounded"
            >
              <List size={16} className="text-blue-300" />
            </button>

            {/* Inactive / All toggles */}
            <div className="flex items-center gap-2 ml-2">
              <button
                className={`p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-2 h-[35px] ${showInactive ? 'ring-2 ring-yellow-300' : ''}`}
                onClick={toggleShowInactive}
                title="Show only inactive records"
              >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">Inactive</span>
              </button>

              <button
                className={`p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-2 h-[35px] ${showAll ? 'ring-2 ring-yellow-300' : ''}`}
                onClick={toggleShowAll}
                title="Show both active and inactive"
              >
                <span className="text-xs opacity-80">All</span>
              </button>
            </div>
          </div>

          {/* filters */}
          <div className="flex flex-wrap gap-3 bg-gray-900 p-3 border border-gray-700 rounded mb-4">
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
                    .filter((s) => s.name.toLowerCase().includes((ddSearch.supplier || "").toLowerCase()))
                    .map((s) => (
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
                  {purchaseOptions
                    .filter((pb) => pb.name.toLowerCase().includes((ddSearch.purchaseBill || "").toLowerCase()))
                    .map((pb) => (
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

            <div className="w-36">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div className="w-28">
              <input
                type="time"
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
              />
            </div>

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
                  </div>
                  {employeeOptions
                    .filter((em) => em.name && em.name.toLowerCase().includes((ddSearch.employee || "").toLowerCase()))
                    .map((em) => (
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
                    ))}
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

          {/* table */}
          <div className="flex-grow overflow-auto w-full min-h-0">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1100px] border-separate border-spacing-y-1 text-sm table-fixed">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-white text-center">
                    <th className="pb-2 border-b">ID</th>
                    <th className="pb-2 border-b">Supplier</th>
                    <th className="pb-2 border-b">Purchase Bill</th>
                    <th className="pb-2 border-b">Date</th>
                    <th className="pb-2 border-b">Total Qty</th>
                    <th className="pb-2 border-b">Employee</th>
                    <th className="pb-2 border-b">Remarks</th>
                    <th className="pb-2 border-b">Reference</th>
                    <th className="pb-2 border-b">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-center">
                  {filteredRows.map((r) => (
                    <tr
                      key={r.id}
                      className={`bg-gray-900 hover:bg-gray-700 ${!r.isActive ? "opacity-50 line-through" : "cursor-pointer"}`}
                    >
                      <td
                        className="px-2 py-3 text-center"
                        onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}
                      >
                        {r.id}
                      </td>
                      <td className="px-2 py-3 text-center" onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}>
                        {r.supplierName || getSupplierName(r.supplierId)}
                      </td>
                      <td className="px-2 py-3 text-center" onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}>
                        {r.purchaseBill || getPurchaseName(r.purchaseBillId)}
                      </td>
                      <td className="px-2 py-3 text-center" onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}>{r.date}</td>
                      <td className="px-2 py-3 text-center" onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}>{r.totalQuantity}</td>
                      <td className="px-2 py-3 text-center" onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}>{r.employeeName || getEmployeeName(r.employeeId)}</td>
                      <td className="px-2 py-3 text-center" onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}>{r.remarks}</td>
                      <td className="px-2 py-3 text-center" onClick={() => navigate(`/app/inventory/goodsreceipts/edit/${r.id}`)}>{r.reference}</td>

                      <td className="px-2 py-3 text-center">
                        {r.isActive ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // soft-delete
                              if (!window.confirm("Move this receipt to inactive?")) return;
                              deleteGoodsReceiptApi(r.id, { userId })
                                .then((res) => {
                                  if (res.status === 200) {
                                    toast.success("Moved to inactive");
                                    if (showAll) fetchAll();
                                    else fetchActive(page, limit);
                                  } else {
                                    toast.error("Action failed");
                                  }
                                })
                                .catch((err) => {
                                  console.error(err);
                                  toast.error("Action failed");
                                });
                            }}
                            className="px-2 py-1 bg-red-700 rounded text-xs"
                          >
                            Inactivate
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(r.id);
                            }}
                            className="px-2 py-1 bg-green-700 rounded text-xs"
                          >
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-gray-400">
                        {loading ? "Loading..." : "No records found"}
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
                <option value={n} key={n}>
                  {n}
                </option>
              ))}
            </select>

            <button disabled={page === 1} onClick={() => setPage(1)} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
              <ChevronsLeft size={16} />
            </button>

            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>

            <span>Page</span>

            <input
              type="number"
              className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              value={page}
              onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))}
            />

            <span>/ {totalPages}</span>

            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50">
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
      </div>
    </PageLayout>
  );
};

export default GoodsReceipts;
