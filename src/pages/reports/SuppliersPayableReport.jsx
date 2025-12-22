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

/* COLUMN PICKER DROPDOWN */
const ColumnPickerModal = ({ open, onClose, visibleColumns, setVisibleColumns }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="w-[500px] bg-gray-900 border border-gray-700 rounded-lg text-white">
        <div className="flex justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-lg">Column Picker</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 gap-3 max-h-72 overflow-auto">
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
            className="px-4 py-2 bg-gray-700 rounded border border-gray-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const SuppliersPayableReport = () => {
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
        open={columnModal}
        onClose={() => setColumnModal(false)}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />

      {/* MAIN PAGE */}
      <PageLayout> 
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">

          <h2 className="text-2xl font-semibold mb-4">Suppliers Payable Report</h2>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-2 mb-3">

            {/* Search Box */}
            <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-56">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search supplier..."
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
            <table className="min-w-[500px] text-center border-separate border-spacing-y-1 text-sm ">

                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr>
                    {visibleColumns.companyName && (
                      <th className="pb-1 border-b">Company Name</th>
                    )}
                    {visibleColumns.payable && (
                      <th className="pb-1 border-b">Payable</th>
                    )}
                    {visibleColumns.paid && (
                      <th className="pb-1 border-b">Paid</th>
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
                      {visibleColumns.companyName && (
                        <td className="px-2 py-2">{row.companyName}</td>
                      )}
                      {visibleColumns.payable && (
                        <td className="px-2 py-2">{row.payable}</td>
                      )}
                      {visibleColumns.paid && (
                        <td className="px-2 py-2">{row.paid}</td>
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
                        className="bg-gray-900 opacity-40 hover:bg-gray-700 cursor-pointer line-through"
                      >
                        {visibleColumns.companyName && (
                          <td className="px-2 py-2">{row.companyName}</td>
                        )}
                        {visibleColumns.payable && (
                          <td className="px-2 py-2">{row.payable}</td>
                        )}
                        {visibleColumns.paid && (
                          <td className="px-2 py-2">{row.paid}</td>
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
                    
              <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                // total={totalRecords}
                // onRefresh={handleRefresh}
              />
          </div>
        </div>
      </PageLayout>

    </>
  );
};

export default SuppliersPayableReport;



