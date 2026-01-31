import React, { useState } from "react";
import PageLayout from "../../layout/PageLayout";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { useTheme } from "../../context/ThemeContext";
import toast from 'react-hot-toast';

/* COLUMN PICKER */

const DailyClosingReport = () => {
    const { theme } = useTheme();

  /* UI State */
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* Visible Columns */
  const defaultColumns = {
    date: true,
    lastDayClosing: true,
    receive: true,
    payment: true,
    balance: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  /* Dummy Data */
  const activeData = [
    {
      id: 1,
      date: "2025-02-05",
      lastDayClosing: 5000,
      receive: 2000,
      payment: 1500,
      balance: 5500
    },
    {
      id: 2,
      date: "2025-02-06",
      lastDayClosing: 5500,
      receive: 3000,
      payment: 1200,
      balance: 7300
    }
  ];

  const inactiveData = [
    {
      id: 3,
      date: "2025-02-01",
      lastDayClosing: 4500,
      receive: 1000,
      payment: 800,
      balance: 4700
    }
  ];

  return (
    <>
      {/* COLUMN PICKER */}
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

            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Daily Closing Report</h2>
            <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.date && { key: "date", label: "Date", sortable: true },
                    visibleColumns.lastDayClosing && { key: "lastDayClosing", label: "Last Day Closing", sortable: true },
                    visibleColumns.receive && { key: "receive", label: "Receive", sortable: true },
                    visibleColumns.payment && { key: "payment", label: "Payment", sortable: true },
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

export default DailyClosingReport;



