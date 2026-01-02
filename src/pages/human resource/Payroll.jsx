// src/pages/payroll/Payroll.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ArchiveRestore,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination";
import SortableHeader from "../../components/SortableHeader";
import PageLayout from "../../layout/PageLayout";
import {
  getPayrollsApi,
  getInactivePayrollsApi,
  restorePayrollApi
} from "../../services/allAPI";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";


const Payroll = () => {
  const navigate = useNavigate();

  // -------------------------------
  // COLUMN VISIBILITY
  // -------------------------------
  const defaultColumns = {
    id: true,
    number: true,
    description: true,
    paymentDate: true,
    cashBank: true,
    currency: true,
    totalBasicSalary: true,
    totalIncome: true,
    totalDeduction: true,
    totalTakeHomePay: true,
    totalPaymentAmount: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);


// -------------------------------
// FETCH PAYROLLS
// -------------------------------


const fetchPayrolls = async () => {
  try {
    setLoading(true);
    const resp = await getPayrollsApi(1, 10000); // Fetch ALL for client-side sorting

    if (resp.status === 200) {
      const records = resp.data?.records || [];

      const normalized = records.map((p) => ({
        id: p.id,
        // normalize names - handle potential casing issues
        number: p.Number || p.number,
        description: p.Description || p.description || "",
        paymentDate: p.PaymentDate || p.paymentDate,

        cashBank: p.BankName || p.bankName || "Cash",
        currencyName: p.CurrencyName || p.currencyName,

        totalBasicSalary: p.TotalBasicSalary || p.totalBasicSalary,
        totalIncome: p.TotalIncome || p.totalIncome,
        totalDeduction: p.TotalDeduction || p.totalDeduction,
        totalTakeHomePay: p.TotalTakeHomePay || p.totalTakeHomePay,
        totalPaymentAmount: p.TotalPaymentAmount || p.totalPaymentAmount,
        isInactive: false,
      }));

      setRows(normalized);
    }
  } catch (err) {
    console.error("Error fetching payrolls", err);
    toast.error("Failed to load payrolls");
  } finally {
    setLoading(false);
  }
};


  // -------------------------------
  // Search
  // -------------------------------
  const [searchText, setSearchText] = useState("");

  // -------------------------------
  // Pagination
  // -------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // -------------------------------
  // INACTIVE LOGIC
  // -------------------------------
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const loadInactivePayrolls = async () => {
    try {
      setLoading(true);
      const res = await getInactivePayrollsApi();
      if (res.status === 200) {
        const records = res.data?.records || res.data || [];
        const normalized = records.map((p) => ({
          id: p.id,
          number: p.Number || p.number,
          description: p.Description || p.description || "",
          paymentDate: p.PaymentDate || p.paymentDate,
          cashBank: p.BankName || p.bankName || "Cash",
          currencyName: p.CurrencyName || p.currencyName,
          totalBasicSalary: p.TotalBasicSalary || p.totalBasicSalary,
          totalIncome: p.TotalIncome || p.totalIncome,
          totalDeduction: p.TotalDeduction || p.totalDeduction,
          totalTakeHomePay: p.TotalTakeHomePay || p.totalTakeHomePay,
          totalPaymentAmount: p.TotalPaymentAmount || p.totalPaymentAmount,
          isInactive: true,
        }));
        setInactiveRows(normalized);
      }
    } catch (err) {
      console.error("Failed to load inactive payrolls", err);
      toast.error("Failed to load inactive records");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInactive = async () => {
    if (!showInactive) {
      await loadInactivePayrolls();
    }
    setShowInactive(!showInactive);
  };

  // -----------------------------------
  // SORTING & MERGING
  // -----------------------------------
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedRows = React.useMemo(() => {
    // Merge active and inactive if showing inactive
    let allData = [...rows];
    if (showInactive) {
        allData = [...allData, ...inactiveRows];
    }

    // Filter by search text
    if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        allData = allData.filter(r => 
            (r.number?.toLowerCase().includes(lowerSearch)) ||
            (r.description?.toLowerCase().includes(lowerSearch)) ||
            (r.cashBank?.toLowerCase().includes(lowerSearch)) ||
            (r.currencyName?.toLowerCase().includes(lowerSearch))
        );
    }

    let sortableItems = [...allData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
          let aVal = a[sortConfig.key] || "";
          let bVal = b[sortConfig.key] || "";

          // Date check
          if (sortConfig.key === 'paymentDate') {
              aVal = new Date(aVal).getTime() || 0;
              bVal = new Date(bVal).getTime() || 0;
          }
          // Number check
          else if (['id', 'totalBasicSalary', 'totalIncome', 'totalDeduction', 'totalTakeHomePay', 'totalPaymentAmount'].includes(sortConfig.key)) {
              aVal = Number(aVal) || 0;
              bVal = Number(bVal) || 0;
          }
          
          // String check
          if (typeof aVal === 'string') aVal = aVal.toLowerCase();
          if (typeof bVal === 'string') bVal = bVal.toLowerCase();
          
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
    } else {
        // default sort by id
        sortableItems.sort((a,b) => (a.id || 0) - (b.id || 0));
    }
    return sortableItems;
  }, [rows, inactiveRows, showInactive, sortConfig, searchText]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const totalRecords = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);
  
  const paginatedRows = sortedRows.slice((page - 1) * limit, page * limit);


  useEffect(() => {
    fetchPayrolls();
  }, []); // Fetch ONLY ONCE on mount


  // -------------------------------
  // RESTORE (Triggered from Edit Page primarily, but we can add restore capability logic here if needed)
  // -------------------------------
  
  // -------------------------------
  // UI
  // -------------------------------
  return (
    <>
      {/* COLUMN PICKER MODAL */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b 
              from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">

            <div className="sticky top-0 bg-gray-900 px-5 py-3 border-b border-gray-700 flex justify-between">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) =>
                  setColumnSearch(e.target.value.toLowerCase())
                }
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible Columns */}
              <div className="bg-gray-900/30 border border-gray-700 rounded p-4 max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((col) => tempVisibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col}</span>
                      <button
                        className="text-red-400"
                        onClick={() =>
                          setTempVisibleColumns((prev) => ({
                            ...prev,
                            [col]: false,
                          }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hidden Columns */}
              <div className="bg-gray-900/30 border border-gray-700 rounded p-4 max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>

                {Object.keys(tempVisibleColumns)
                  .filter((col) => !tempVisibleColumns[col])
                  .filter((col) => col.includes(columnSearch))
                  .map((col) => (
                    <div
                      key={col}
                      className="bg-gray-800 px-3 py-2 rounded flex justify-between mb-2"
                    >
                      <span>{col}</span>
                      <button
                        className="text-green-400"
                        onClick={() =>
                          setTempVisibleColumns((prev) => ({
                            ...prev,
                            [col]: true,
                          }))
                        }
                      >
                        ➕
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-5 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                onClick={() => setTempVisibleColumns(defaultColumns)}
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                  onClick={() => setColumnModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700  h-full">
  <div className="flex flex-col h-full overflow-hidden"> 

        <h2 className="text-2xl font-semibold mb-4">Payroll</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded 
              border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              placeholder="Search payroll..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)} 
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {hasPermission(PERMISSIONS.HR.PAYROLL.CREATE) && (
          <button
            onClick={() => navigate("/app/hr/newpayroll")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 
                border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Payroll
          </button>
          )}

          <button 
            onClick={fetchPayrolls}
            className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            <RefreshCw size={16} className={`text-blue-400 ${loading ? 'animate-spin' : ''}`} />
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
                onClick={handleToggleInactive}
                className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-2 h-[35px]"
              >
                <ArchiveRestore size={16} className="text-yellow-300" />
                <span className="text-xs opacity-80">{showInactive ? "Hide Inactive" : "Show Inactive"}</span>
              </button>
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1900px] border-separate border-spacing-y-1 
                text-sm table-fixed">

              <thead className="sticky top-0 bg-gray-900 z-10 text-center">
                <tr className="text-center">
                    {visibleColumns.id && <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.number && <SortableHeader label="Number" sortKey="number" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.description && <SortableHeader label="Description" sortKey="description" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.paymentDate && <SortableHeader label="Payment Date" sortKey="paymentDate" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.cashBank && <SortableHeader label="Cash / Bank" sortKey="cashBank" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.currency && <SortableHeader label="Currency" sortKey="currencyName" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.totalBasicSalary && <SortableHeader label="Total Basic Salary" sortKey="totalBasicSalary" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.totalIncome && <SortableHeader label="Total Income" sortKey="totalIncome" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.totalDeduction && <SortableHeader label="Total Deduction" sortKey="totalDeduction" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.totalTakeHomePay && <SortableHeader label="Take Home Pay" sortKey="totalTakeHomePay" currentSort={sortConfig} onSort={handleSort} />}
                    {visibleColumns.totalPaymentAmount && <SortableHeader label="Total Payment" sortKey="totalPaymentAmount" currentSort={sortConfig} onSort={handleSort} />}
                    
                </tr>
              </thead>

              <tbody className="text-center">
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-8 text-gray-400">
                      Loading payrolls...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-8 text-gray-400">
                      No payroll records found
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/app/hr/editpayroll/${r.id}`, { state: r.isInactive ? { isInactive: true } : {} })}
                      className={`
                        cursor-pointer
                        ${r.isInactive 
                            ? "bg-gray-900 opacity-50 line-through hover:bg-gray-800" 
                            : "bg-gray-900 hover:bg-gray-700" 
                        }
                      `}
                    >
                      {visibleColumns.id && <td className="py-2">{r.id}</td>}
                      {visibleColumns.number && <td className="py-2">{r.number}</td>}
                      {visibleColumns.description && (
                        <td className="py-2">{r.description}</td>
                      )}
                      {visibleColumns.paymentDate && (
                        <td className="py-2">{r.paymentDate ? format(new Date(r.paymentDate), "yyyy-MM-dd") : ""}</td>
                      )}
                      {visibleColumns.cashBank && (
                        <td className="py-2">{r.cashBank}</td>
                      )}
                      {visibleColumns.currency && (
                        <td className="py-2">{r.currencyName}</td>
                      )}
                      {visibleColumns.totalBasicSalary && (
                        <td className="py-2">{Number(r.totalBasicSalary || 0).toFixed(2)}</td>
                      )}
                      {visibleColumns.totalIncome && (
                        <td className="py-2">{Number(r.totalIncome || 0).toFixed(2)}</td>
                      )}
                      {visibleColumns.totalDeduction && (
                        <td className="py-2">{Number(r.totalDeduction || 0).toFixed(2)}</td>
                      )}
                      {visibleColumns.totalTakeHomePay && (
                        <td className="py-2 font-semibold text-green-400">{Number(r.totalTakeHomePay || 0).toFixed(2)}</td>
                      )}
                      {visibleColumns.totalPaymentAmount && (
                        <td className="py-2">{Number(r.totalPaymentAmount || 0).toFixed(2)}</td>
                      )}
                    </tr>
                  ))
                )}
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
                // onRefresh={handleRefresh}
              />
      </div>
</div>
      </PageLayout>
    </>
  );
};

export default Payroll;



