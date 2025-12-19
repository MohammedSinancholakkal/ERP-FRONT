// src/pages/accounts/ChartOfAccounts.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Save,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";

const ChartOfAccounts = () => {
  // -----------------------------------
  // COLUMN VISIBILITY
  // -----------------------------------
  const defaultColumns = {
    headCode: true,
    headName: true,
    openingBalance: true,
    balance: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // -----------------------------------
  // MODAL (Add/Edit)
  // -----------------------------------
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    headName: "",
    headCode: "",
    parentHead: "",
    parentHeadName: "",
    headLevel: "",
    headType: "",
    isTransaction: false,
    isGI: false,
  });

  // Parent Head Search State
  const [parentHeadSearch, setParentHeadSearch] = useState("");
  const [isParentHeadDropdownOpen, setIsParentHeadDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsParentHeadDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // -----------------------------------
  // DATA & STATE
  // -----------------------------------
  // Hierarchical Data Structure
  const initialData = [
    {
      id: "1",
      headCode: "1",
      headName: "Assets",
      headLevel: 1,
      headType: "A",
      openingBalance: 0,
      balance: -5845376,
      children: [
        {
          id: "101",
          headCode: "101",
          headName: "Current Assets",
          headLevel: 2,
          headType: "A",
          openingBalance: 0,
          balance: -20000,
          children: [
             { id: "10101", headCode: "10101", headName: "Cash in Hand", headLevel: 3, headType: "A", openingBalance: 0, balance: 5000 },
             { id: "10102", headCode: "10102", headName: "Bank Accounts", headLevel: 3, headType: "A", openingBalance: 0, balance: 15000 },
          ]
        },
        {
          id: "102",
          headCode: "102",
          headName: "Non Current Assets",
          headLevel: 2,
          headType: "A",
          openingBalance: 0,
          balance: -5825376,
           children: [
             { id: "10201", headCode: "10201", headName: "Land and Building", headLevel: 3, headType: "A", openingBalance: 0, balance: 5000000 },
          ]
        },
      ],
    },
    {
      id: "2",
      headCode: "2",
      headName: "Equity",
      headLevel: 1,
      headType: "L",
      openingBalance: 0,
      balance: 0,
      children: [
        { id: "201", headCode: "201", headName: "Share Capital", headLevel: 2, headType: "L", openingBalance: 0, balance: 0 },
        { id: "202", headCode: "202", headName: "Retained Earnings", headLevel: 2, headType: "L", openingBalance: 0, balance: 0 },
      ],
    },
    {
      id: "4",
      headCode: "4",
      headName: "Expence",
      headLevel: 1,
      headType: "E",
      openingBalance: 0,
      balance: 3600,
      children: [
        { id: "401", headCode: "401", headName: "Direct Expenses", headLevel: 2, headType: "E", openingBalance: 0, balance: 3000 },
        { id: "402", headCode: "402", headName: "Indirect Expenses", headLevel: 2, headType: "E", openingBalance: 0, balance: 600 },
      ],
    },
    {
      id: "3",
      headCode: "3",
      headName: "Income",
      headLevel: 1,
      headType: "I",
      openingBalance: 0,
      balance: -100,
      children: [
        { id: "301", headCode: "301", headName: "Direct Income", headLevel: 2, headType: "I", openingBalance: 0, balance: -100 },
        { id: "302", headCode: "302", headName: "Indirect Income", headLevel: 2, headType: "I", openingBalance: 0, balance: 0 },
      ],
    },
    {
      id: "5",
      headCode: "5",
      headName: "Liabilities",
      headLevel: 1,
      headType: "L",
      openingBalance: 0,
      balance: 5096400,
      children: [
         {
          id: "501",
          headCode: "501",
          headName: "Current Liabilities",
          headLevel: 2,
          headType: "L",
          openingBalance: 0,
          balance: 96400,
          children: [
             { id: "50101", headCode: "50101", headName: "Accounts Payable", headLevel: 3, headType: "L", openingBalance: 0, balance: 50000 },
          ]
        },
        {
          id: "502",
          headCode: "502",
          headName: "Non Current Liabilities",
          headLevel: 2,
          headType: "L",
          openingBalance: 0,
          balance: 5000000,
           children: [
             { id: "50201", headCode: "50201", headName: "Long Term Loans", headLevel: 3, headType: "L", openingBalance: 0, balance: 5000000 },
          ]
        },
      ],
    },
  ];

  const [data, setData] = useState(initialData);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Search
  const [searchText, setSearchText] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = 100; // Mock total for now since we have nested data
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  // -----------------------------------
  // HELPERS
  // -----------------------------------
  
  // Flatten data for dropdown options with path
  const flattenData = (nodes, parentPath = "") => {
    let result = [];
    nodes.forEach((node) => {
      const currentPath = parentPath ? `${parentPath} -> ${node.headName}` : node.headName;
      result.push({
        ...node,
        path: currentPath,
      });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenData(node.children, currentPath));
      }
    });
    return result;
  };

  const flatOptions = flattenData(data);

  // Generate Next Head Code
  const generateNextHeadCode = (parentCode, children) => {
    if (!children || children.length === 0) {
      return `${parentCode}01`;
    }
    // Find max code
    const codes = children.map(c => parseInt(c.headCode));
    const maxCode = Math.max(...codes);
    return (maxCode + 1).toString();
  };

  const handleParentHeadSelect = (option) => {
    const nextCode = generateNextHeadCode(option.headCode, option.children);
    
    setForm(prev => ({
      ...prev,
      parentHead: option.headCode,
      parentHeadName: option.headName,
      headLevel: (option.headLevel || 0) + 1,
      headType: option.headType || "",
      headCode: nextCode,
    }));
    setParentHeadSearch(option.path);
    setIsParentHeadDropdownOpen(false);
  };

  const handleClearParentHead = (e) => {
    e.stopPropagation();
    setParentHeadSearch("");
    setForm(prev => ({
      ...prev,
      parentHead: "",
      parentHeadName: "",
      headLevel: "",
      headType: "",
      headCode: "",
    }));
  };

  // Helper to flatten data for display (handling expansion)
  const renderRows = (nodes, level = 0) => {
    return nodes.map((node) => {
      const isExpanded = !!expandedRows[node.id];
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <React.Fragment key={node.id}>
          <tr className="bg-gray-900 hover:bg-gray-700 cursor-default">
            {visibleColumns.headCode && (
              <td className="py-2 px-4 text-yellow-500 font-medium">{node.headCode}</td>
            )}
            {visibleColumns.headName && (
              <td className="py-2 px-4 text-left">
                <div 
                  className="flex items-center gap-2" 
                  style={{ paddingLeft: `${level * 20}px` }}
                >
                  {hasChildren ? (
                    <button 
                      onClick={() => toggleRow(node.id)}
                      className="p-0.5 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                    >
                      {isExpanded ? <span className="text-xs px-0.5">-</span> : <span className="text-xs px-0.5">+</span>}
                    </button>
                  ) : (
                     <span className="w-5 h-5 inline-block"></span>
                  )}
                  <span className="text-gray-200">{node.headName}</span>
                </div>
              </td>
            )}
            {visibleColumns.openingBalance && (
              <td className="py-2 px-4 text-gray-300">{node.openingBalance}</td>
            )}
            {visibleColumns.balance && (
              <td className="py-2 px-4 text-gray-300">{node.balance}</td>
            )}
          </tr>
          {hasChildren && isExpanded && renderRows(node.children, level + 1)}
        </React.Fragment>
      );
    });
  };


  // -----------------------------------
  // UI
  // -----------------------------------
  return (
    <>
      {/* COLUMN PICKER */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />

          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b 
                          from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white shadow-2xl">
            
            <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
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
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              {/* Visible */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2 text-sm text-gray-400 uppercase tracking-wider">Visible</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((c) => tempVisibleColumns[c])
                    .filter((c) => c.includes(columnSearch))
                    .map((c) => (
                      <div
                        key={c}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between items-center border border-gray-700/50"
                      >
                        <span className="text-sm">{c}</span>
                        <button
                          className="text-red-400 hover:text-red-300"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({ ...p, [c]: false }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Hidden */}
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2 text-sm text-gray-400 uppercase tracking-wider">Hidden</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((c) => !tempVisibleColumns[c])
                    .filter((c) => c.includes(columnSearch))
                    .map((c) => (
                      <div
                        key={c}
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between items-center border border-gray-700/50"
                      >
                        <span className="text-sm">{c}</span>
                        <button
                          className="text-green-400 hover:text-green-300"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({ ...p, [c]: true }))
                          }
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setTempVisibleColumns(defaultColumns)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Restore Defaults
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                  className="px-3 py-2 bg-blue-600 border border-blue-500 rounded hover:bg-blue-500 transition-colors text-sm"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD COA MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-[750px] bg-gradient-to-b from-gray-900 to-gray-800 
                          border border-gray-700 rounded-lg text-white p-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h2 className="text-lg font-semibold">Add Head</h2>
              <X className="cursor-pointer text-gray-400 hover:text-white" onClick={() => setModalOpen(false)} />
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4 mt-4">

              <div className="col-span-2">
                <label className="text-sm text-gray-400 block mb-1">Head Name *</label>
                <input
                  value={form.headName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, headName: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* PARENT HEAD SEARCHABLE DROPDOWN */}
              <div className="col-span-2 relative" ref={dropdownRef}>
                <label className="text-sm text-gray-400 block mb-1">Parent Head</label>
                <div className="relative">
                  <input
                    value={parentHeadSearch}
                    onChange={(e) => {
                      setParentHeadSearch(e.target.value);
                      setIsParentHeadDropdownOpen(true);
                    }}
                    onClick={() => setIsParentHeadDropdownOpen(true)}
                    placeholder="Select..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors pr-8"
                  />
                  {parentHeadSearch && (
                    <button 
                      onClick={handleClearParentHead}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                
                {isParentHeadDropdownOpen && (
                  <div className="absolute left-0 right-0 top-[65px] bg-gray-800 border border-gray-700 rounded shadow-xl max-h-60 overflow-y-auto z-50">
                    {flatOptions
                      .filter(opt => opt.path.toLowerCase().includes(parentHeadSearch.toLowerCase()))
                      .map(opt => (
                        <div 
                          key={opt.id}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-700/50 last:border-0"
                          onClick={() => handleParentHeadSelect(opt)}
                        >
                          <div className="font-medium text-gray-200">{opt.headName}</div>
                          <div className="text-xs text-gray-500">{opt.path}</div>
                        </div>
                      ))}
                    {flatOptions.filter(opt => opt.path.toLowerCase().includes(parentHeadSearch.toLowerCase())).length === 0 && (
                       <div className="px-3 py-2 text-gray-500 text-sm">No results found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-400 block mb-1">Head Code (Auto)</label>
                <input
                  value={form.headCode}
                  readOnly
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Parent Head Code</label>
                <input
                  value={form.parentHead}
                  readOnly
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Parent Head Name</label>
                <input
                  value={form.parentHeadName}
                  readOnly
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Head Level</label>
                <input
                  value={form.headLevel}
                  readOnly
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Head Type</label>
                <input
                  value={form.headType}
                  readOnly
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.isTransaction}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isTransaction: e.target.checked }))
                  }
                  className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
                />
                <label className="text-sm text-gray-300">Is Transaction</label>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.isGI}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isGI: e.target.checked }))
                  }
                  className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
                />
                <label className="text-sm text-gray-300">Is GI</label>
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-5 border-t border-gray-700 pt-3">
              <button
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition-colors"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>

              <button className="flex items-center gap-2 bg-blue-600 px-4 py-2 border border-blue-500 rounded text-white hover:bg-blue-500 transition-colors">
                <Save size={16} /> Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
          <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden"> 

            {/* HEADER */}
            <h2 className="text-2xl font-semibold mb-4">Chart of Accounts</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded 
                              border border-gray-600 w-full sm:w-60">
                <Search size={16} className="text-gray-300" />
                <input
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-transparent pl-2 text-sm w-full outline-none"
                />
              </div>

              <button
                onClick={() => {
                  setForm({
                    headName: "",
                    headCode: "",
                    parentHead: "",
                    parentHeadName: "",
                    headLevel: "",
                    headType: "",
                    isTransaction: false,
                    isGI: false,
                  });
                  setParentHeadSearch("");
                  setModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 
                           bg-gray-700 border border-gray-600 rounded h-[35px]"
              >
                <Plus size={16} /> New Head
              </button>

              <button className="p-2 bg-gray-700 border border-gray-600 rounded">
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
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto min-h-0">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[700px] border-separate border-spacing-y-1 
                                  text-sm table-fixed">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-center">
                      {visibleColumns.headCode && (
                        <th className="pb-2 border-b">Head Code</th>
                      )}
                      {visibleColumns.headName && (
                        <th className="pb-2 border-b">Head Name</th>
                      )}
                      {visibleColumns.openingBalance && (
                        <th className="pb-2 border-b">Opening Balance</th>
                      )}
                      {visibleColumns.balance && (
                        <th className="pb-2 border-b">Balance</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="text-center">
                    {renderRows(data)}
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
                {[10, 25, 50, 100].map((n) => (
                  <option value={n} key={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              <span>Page</span>

              <input
                type="number"
                value={page}
                onChange={(e) =>
                  setPage(
                    Math.min(totalPages, Math.max(1, Number(e.target.value)))
                  )
                }
                className="w-12 bg-gray-800 border border-gray-600 rounded text-center"
              />

              <span>/ {totalPages}</span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
              >
                <ChevronsRight size={16} />
              </button>

              <span>
                Showing <b>{start}</b> to <b>{end}</b> of <b>{totalRecords}</b> records
              </span>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default ChartOfAccounts;
