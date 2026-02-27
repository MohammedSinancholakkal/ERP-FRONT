import React, { useState } from "react";
import PageLayout from "../../layout/PageLayout";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { useTheme } from "../../context/ThemeContext";
import toast from 'react-hot-toast';
import { getDailyClosingReportApi } from "../../services/allAPI";
import { useEffect } from "react";

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

  /* Data */
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchData = async () => {
    try {
      const res = await getDailyClosingReportApi(page, limit);
      if (res.status === 200) {
        setRows(res.data.records);
        setTotalRecords(res.data.total);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load daily closing report");
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, searchText]);

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

            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Daily Closing Report</h2>
            <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (r) => new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                    visibleColumns.lastDayClosing && { key: "lastDayClosing", label: "Last Day Closing", sortable: true, render: (r) => (r.lastDayClosing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.receive && { key: "receive", label: "Receive", sortable: true, render: (r) => (r.receive || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.payment && { key: "payment", label: "Payment", sortable: true, render: (r) => (r.payment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.balance && { key: "balance", label: "Balance", sortable: true, render: (r) => (r.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                ].filter(Boolean)}
                data={rows}
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
                
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
            />
          </div>
          </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default DailyClosingReport;



