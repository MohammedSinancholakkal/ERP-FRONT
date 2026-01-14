// src/pages/payroll/Payroll.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  // Icons handled by MasterTable
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination";
// import SortableHeader from "../../components/SortableHeader"; // REMOVED
import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";
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
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";


const Payroll = () => {
  const { theme } = useTheme();
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

      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* MAIN PAGE */}
      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden gap-2"> 
            <h2 className="text-2xl font-semibold mb-4">Payroll</h2>

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.number && { key: "number", label: "Number", sortable: true },
                    visibleColumns.description && { key: "description", label: "Description", sortable: true },
                    visibleColumns.paymentDate && { key: "paymentDate", label: "Payment Date", sortable: true, render: (r) => r.paymentDate ? format(new Date(r.paymentDate), "yyyy-MM-dd") : "" },
                    visibleColumns.cashBank && { key: "cashBank", label: "Cash / Bank", sortable: true },
                    visibleColumns.currency && { key: "currencyName", label: "Currency", sortable: true },
                    visibleColumns.totalBasicSalary && { key: "totalBasicSalary", label: "Total Basic Salary", sortable: true, render: (r) => Number(r.totalBasicSalary || 0).toFixed(2) },
                    visibleColumns.totalIncome && { key: "totalIncome", label: "Total Income", sortable: true, render: (r) => Number(r.totalIncome || 0).toFixed(2) },
                    visibleColumns.totalDeduction && { key: "totalDeduction", label: "Total Deduction", sortable: true, render: (r) => Number(r.totalDeduction || 0).toFixed(2) },
                    visibleColumns.totalTakeHomePay && { key: "totalTakeHomePay", label: "Take Home Pay", sortable: true, className: "font-semibold text-green-400", render: (r) => Number(r.totalTakeHomePay || 0).toFixed(2) },
                    visibleColumns.totalPaymentAmount && { key: "totalPaymentAmount", label: "Total Payment", sortable: true, render: (r) => Number(r.totalPaymentAmount || 0).toFixed(2) },
                ].filter(Boolean)}
                data={paginatedRows}
                inactiveData={inactiveRows}
                showInactive={showInactive}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={(r, isInactive) => navigate(`/app/hr/editpayroll/${r.id}`, { state: isInactive ? { isInactive: true } : {} })}
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => navigate("/app/hr/newpayroll")}
                createLabel="New Payroll"
                permissionCreate={hasPermission(PERMISSIONS.HR.PAYROLL.CREATE)}
                onRefresh={fetchPayrolls}
                onColumnSelector={() => {
                    setTempVisibleColumns(visibleColumns);
                    setColumnModalOpen(true);
                }}
                onToggleInactive={handleToggleInactive}
            />

             {/* PAGINATION */}
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
              />
          </div>
        </div>
      </PageLayout>

    </>
  );
};

export default Payroll;



