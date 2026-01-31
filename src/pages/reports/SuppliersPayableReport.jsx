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

  /* Columns */
  const defaultColumns = {
    companyName: true,
    payable: true,
    paid: true,
    balance: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  /* Sample Data */
  const activeData = [
    { id: 1, companyName: "Supplier A", payable: 5000, paid: 2000, balance: 3000 },
    { id: 2, companyName: "Supplier B", payable: 4000, paid: 1000, balance: 3000 }
  ];

  const inactiveData = [
    { id: 3, companyName: "Supplier C", payable: 3000, paid: 500, balance: 2500 }
  ];

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

            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Suppliers Payable Report</h2>
            <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.companyName && { key: "companyName", label: "Company Name", sortable: true },
                    visibleColumns.payable && { key: "payable", label: "Payable", sortable: true },
                    visibleColumns.paid && { key: "paid", label: "Paid", sortable: true },
                    visibleColumns.balance && { key: "balance", label: "Balance", sortable: true },
                ].filter(Boolean)}
                data={activeData}
                inactiveData={inactiveData}
                showInactive={showInactive}
                // sortConfig={sortConfig}
                // onSort={handleSort}
                // onRowClick={(r) => openEditModal(r)}
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                // onCreate={() => setModalOpen(true)}
                createLabel="New Report"
                // permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    toast.success("Refreshed");
                }}
                onColumnSelector={() => setColumnModal(true)}
                onToggleInactive={() => setShowInactive((s) => !s)}
                
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={activeData.length} // using dummy length
            />
          </div>
          </ContentCard>
        </div>
      </PageLayout>

    </>
  );
};

export default SuppliersPayableReport;



