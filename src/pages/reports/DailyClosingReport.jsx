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

/* COLUMN PICKER */
const ColumnPickerModal = ({ open, onClose, visibleColumns, setVisibleColumns }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="w-[500px] bg-gray-900 border border-gray-700 rounded-lg text-white">
        
        <div className="flex justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-lg">Column Picker</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-5 max-h-72 overflow-auto space-y-2">
          {Object.keys(visibleColumns).map((col) => (
            <div 
              key={col}
              className="flex justify-between bg-gray-800 px-3 py-2 rounded border border-gray-700"
            >
              <span>{col.toUpperCase()}</span>
              <input
                type="checkbox"
                checked={visibleColumns[col]}
                onChange={() =>
                  setVisibleColumns((p) => ({ ...p, [col]: !p[col] }))
                }
              />
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded"
          >
            OK
          </button>
        </div>

      </div>
    </div>
  );
};

const DailyClosingReport = () => {

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
        open={columnModal}
        onClose={() => setColumnModal(false)}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />

      {/* MAIN PAGE */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
  <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Daily Closing Report</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-3">

            {/* Search */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md
                            border border-gray-600 w-full sm:w-56">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-transparent outline-none pl-2 text-sm w-full"
              />
            </div>

            {/* Refresh */}
            <button className="p-1.5 bg-gray-700 border border-gray-600 rounded">
              <RefreshCw size={16} className="text-blue-300" />
            </button>

            {/* Column Picker */}
            <button 
              onClick={() => setColumnModal(true)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded"
            >
              <List size={16} className="text-blue-300" />
            </button>

            {/* Inactive Toggle */}
            <button 
              onClick={() => setShowInactive((s) => !s)}
              className="p-1.5 bg-gray-700 border border-gray-600 rounded flex items-center gap-1"
            >
              <ArchiveRestore size={16} className="text-yellow-300" />
              <span className="text-xs opacity-70">Inactive</span>
            </button>

          </div>

          {/* TABLE */}
          <div className="flex-grow overflow-auto min-h-0 w-full">
            <div className="w-full overflow-x-auto">

              <table className="min-w-[600px]  text-center text-sm border-separate border-spacing-y-1">

                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr>
                    {visibleColumns.date && <th className="pb-1 border-b">Date</th>}
                    {visibleColumns.lastDayClosing && (
                      <th className="pb-1 border-b">Last Day Closing</th>
                    )}
                    {visibleColumns.receive && (
                      <th className="pb-1 border-b">Receive</th>
                    )}
                    {visibleColumns.payment && (
                      <th className="pb-1 border-b">Payment</th>
                    )}
                    {visibleColumns.balance && (
                      <th className="pb-1 border-b">Balance</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {/* ACTIVE ROWS */}
                  {activeData.map((row) => (
                    <tr 
                      key={row.id}
                      className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    >
                      {visibleColumns.date && <td className="px-2 py-2">{row.date}</td>}
                      {visibleColumns.lastDayClosing && (
                        <td className="px-2 py-2">{row.lastDayClosing}</td>
                      )}
                      {visibleColumns.receive && (
                        <td className="px-2 py-2">{row.receive}</td>
                      )}
                      {visibleColumns.payment && (
                        <td className="px-2 py-2">{row.payment}</td>
                      )}
                      {visibleColumns.balance && (
                        <td className="px-2 py-2">{row.balance}</td>
                      )}
                    </tr>
                  ))}

                  {/* INACTIVE ROWS */}
                  {showInactive &&
                    inactiveData.map((row) => (
                      <tr
                        key={`inactive-${row.id}`}
                        className="bg-gray-900 opacity-40 hover:bg-gray-700 line-through cursor-pointer"
                      >
                        {visibleColumns.date && <td className="px-2 py-2">{row.date}</td>}
                        {visibleColumns.lastDayClosing && (
                          <td className="px-2 py-2">{row.lastDayClosing}</td>
                        )}
                        {visibleColumns.receive && (
                          <td className="px-2 py-2">{row.receive}</td>
                        )}
                        {visibleColumns.payment && (
                          <td className="px-2 py-2">{row.payment}</td>
                        )}
                        {visibleColumns.balance && (
                          <td className="px-2 py-2">{row.balance}</td>
                        )}
                      </tr>
                    ))}
                </tbody>

              </table>

            </div>
          </div>

          {/* PAGINATION */}
        <div className="mt-5 sticky bottom-5 bg-gray-900/80 px-4 py-2 border-t border-gray-700 z-20 flex flex-wrap items-center gap-3 text-sm">

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
              </select>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsLeft size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              />

              <span>/ 1</span>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronRight size={16} />
              </button>

              <button className="p-1 bg-gray-800 border border-gray-700 rounded">
                <ChevronsRight size={16} />
              </button>

            </div>
          </div>
                </div>
       </PageLayout>
    </>
  );
};

export default DailyClosingReport;
