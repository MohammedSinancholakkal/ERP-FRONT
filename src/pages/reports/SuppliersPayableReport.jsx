import React, { useState } from "react";
import {
  Search,
  RefreshCw,
  ArchiveRestore,
  List,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { useTheme } from "../../context/ThemeContext";
import toast from 'react-hot-toast';
import { getSupplierPayablesApi } from "../../services/allAPI";

/* COLUMN PICKER DROPDOWN */

const SuppliersPayableReport = () => {
    const { theme } = useTheme();
  /* UI State */
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [sortConfig, setSortConfig] = useState({ key: "companyName", direction: "asc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /* Columns */
  const defaultColumns = {
    companyName: true,
    payable: true,
    paid: true,
    balance: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Fetch Data */
  const fetchReport = async () => {
      try {
          setLoading(true);
          const res = await getSupplierPayablesApi(sortConfig.key, sortConfig.direction);
          if (res.status === 200) {
              setData(res.data);
          } else {
              toast.error("Failed to load report data");
          }
      } catch (error) {
          console.error("Error fetching report:", error);
          toast.error("Failed to load report data");
      } finally {
          setLoading(false);
      }
  };

  React.useEffect(() => {
      fetchReport();
  }, [sortConfig]);

  // Filtered Data
  const filteredData = data.filter(d => 
      d.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      (d.phone && d.phone.includes(searchText))
  );

  // Pagination Logic
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  return (
    <>
      {/* COLUMN PICKER MODAL */}
       <ColumnPickerModal
        isOpen={columnModal} 
        onClose={() => setColumnModal(false)}
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* MAIN PAGE */}
      <PageLayout> 
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
            <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Suppliers Payable Report</h2>
            <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.companyName && { key: "companyName", label: "Company Name", sortable: true },
                    visibleColumns.payable && { key: "payable", label: "Payable", sortable: true, render: (r) => (r.payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.paid && { key: "paid", label: "Paid", sortable: true, render: (r) => (r.paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.balance && { key: "balance", label: "Balance", sortable: true, render: (r) => (r.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                ].filter(Boolean)}
                data={paginatedData}
                // inactiveData={inactiveData}
                // showInactive={showInactive}

                sortConfig={sortConfig}
                onSort={handleSort}
                
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                
                // createLabel="New Report"
                
                onRefresh={() => {
                    const newSort = { key: "companyName", direction: "desc" };
                    setSortConfig(newSort);
                    setLimit(25);
                    setPage(1);
                    setSearchText("");
                    fetchReport();
                }}
                onColumnSelector={() => setColumnModal(true)}
                // onToggleInactive={() => setShowInactive((s) => !s)}
                
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={filteredData.length}
                loading={loading}
            />
          </div>
          </ContentCard>
        </div>
      </PageLayout>

    </>
  );
};

export default SuppliersPayableReport;



