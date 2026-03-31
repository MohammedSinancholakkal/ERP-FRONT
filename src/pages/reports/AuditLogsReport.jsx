import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import { getAuditLogsApi, getSettingsApi, getUsersApi } from "../../services/allAPI";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Pagination from "../../components/Pagination";

const AuditLogsReport = () => {
  const { theme } = useTheme();

  // State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userId, setUserId] = useState("");
  const [tableName, setTableName] = useState("");
  const [auditData, setAuditData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Date formatting for header
  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).replace(/ /g, '-');

  // Fetch Data
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
        const res = await getAuditLogsApi(page, limit, startDate, endDate, userId, tableName);
        if (res.status === 200) {
            setAuditData(res.data.records);
            setTotalRecords(res.data.total);
        }
    } catch (err) {
        console.error("Audit Logs Fetch Error:", err);
    } finally {
        setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
        const res = await getUsersApi(1, 1000);
        if (res.status === 200) {
            setUsers(res.data.records || []);
        }
    } catch (err) {
        console.error("Users Fetch Error:", err);
    }
  };

  const fetchSettings = async () => {
      try {
          const res = await getSettingsApi();
          if (res.status === 200 && res.data.companyName) {
              setCompanyName(res.data.companyName);
          }
      } catch (err) {
          console.error("Settings Fetch Error:", err);
      }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, limit]);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const handleSearch = () => {
      setPage(1);
      fetchAuditLogs();
  };
  
  const handlePrint = () => {
      window.print();
  };

  const prepareExportData = () => {
    return auditData.map(row => ({
        "Date": new Date(row.Timestamp).toLocaleString(),
        "User": row.UserName || "System",
        "Table": row.tableName,
        "Action": row.Action,
        "Column": row.columnName,
        "Old Value": row.oldValue,
        "New Value": row.newValue,
        "IP Address": row.IpAddress
    }));
  };

  const handleExportCSV = () => {
      try {
          const data = prepareExportData();
          const ws = XLSX.utils.json_to_sheet(data);
          const csv = XLSX.utils.sheet_to_csv(ws);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          saveAs(blob, `audit_logs_${todayDate}.csv`);
      } catch (err) {
          console.error("Export CSV Error:", err);
      } finally {
          setShowExportMenu(false);
      }
  };

  const handleExportExcel = () => {
      try {
          const data = prepareExportData();
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
          const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
          saveAs(blob, `audit_logs_${todayDate}.xlsx`);
      } catch (err) {
          console.error("Export Excel Error:", err);
      } finally {
          setShowExportMenu(false);
      }
  };

  const handleExportPDF = () => {
      try {
          const doc = new jsPDF('l', 'mm', 'a4'); // landscape
          
          doc.setFontSize(14);
          doc.text("Audit Logs Report", 14, 15);
          doc.setFontSize(10);
          doc.text(`Company: ${companyName}`, 14, 22);
          doc.text(`Date: ${todayDate}`, 14, 28);
          
          const data = prepareExportData();
          const headers = [["Date", "User", "Table", "Action", "Column", "Old Value", "New Value", "IP Address"]];
          const rows = data.map(obj => [
              obj["Date"], 
              obj["User"], 
              obj["Table"], 
              obj["Action"], 
              obj["Column"],
              obj["Old Value"],
              obj["New Value"],
              obj["IP Address"]
          ]);
          
          doc.autoTable({
              startY: 35,
              head: headers,
              body: rows,
              styles: { fontSize: 8 },
          });
          
          doc.save(`audit_logs_${todayDate}.pdf`);
      } catch (err) {
          console.error("Export PDF Error:", err);
      } finally {
          setShowExportMenu(false);
      }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('#export-dropdown-container')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  return (
    <PageLayout>
      <div id="report-content" className={`p-6 h-full flex flex-col gap-6 overflow-hidden print:absolute print:top-0 print:left-0 print:w-full print:h-auto print:m-0 print:p-8 print:bg-white print:overflow-visible print:z-50 ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        
        {/* TOP FILTER BAR */}
        <div className={`p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4 flex-none z-10 print:hidden ${theme === 'dark' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-800'}`}>
            <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>From</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-40 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-600'}`} 
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-40 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-600'}`} 
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>User</label>
                <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-40 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-600'}`}
                >
                    <option value="">All Users</option>
                    {users.map(u => <option key={u.userId} value={u.userId}>{u.displayName}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Table Name</label>
                <input 
                    type="text" 
                    placeholder="Filter table..."
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-40 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-600'}`} 
                />
            </div>
            
            <div className="mt-auto pb-0.5">
                <button 
                    onClick={handleSearch}
                    className="bg-[#4a90e2] hover:bg-[#357abd] text-white px-6 py-2 rounded text-sm font-medium transition-colors"
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>
            <div className="mt-auto pb-0.5 relative" id="export-dropdown-container">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className={`px-6 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 text-white
                        ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : theme === 'purple' ? 'bg-[#6448AE] hover:bg-[#523A8C]' 
                        : 'bg-[#f5a623] hover:bg-[#d48806]'}`}
                >
                    Export ▼
                </button>
                
                {showExportMenu && (
                    <div className={`absolute top-full left-0 mt-1 w-56 border rounded shadow-lg z-50 text-[13px] font-sans overflow-hidden
                        ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-200'
                        : 'bg-[#f0f4f8] border-[#a0c4e4] text-gray-800'}`}
                    >
                        <div className="py-1">
                            <button className="w-full text-left px-3 py-1.5 hover:bg-gray-100" onClick={handleExportCSV}>CSV</button>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-gray-100" onClick={handleExportExcel}>Excel</button>
                            <button className="w-full text-left px-3 py-1.5 hover:bg-gray-100" onClick={handleExportPDF}>PDF</button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* REPORT CONTENT */}
        <ContentCard className="flex-1 min-h-0 shadow-md print:shadow-none print:border-none print:h-auto print:overflow-visible">
          <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 print:overflow-visible print:h-auto custom-scrollbar">
            
            {/* SCREEN HEADER */}
            <div className="flex flex-col gap-1 flex-none">
                <div className={`flex justify-between items-center border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                    <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Audit Logs Report</h2>
                </div>
                
                <div className="relative flex justify-center items-center mt-2">
                    <h1 className={`text-2xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>{companyName}</h1>
                    <div className={`absolute right-0 bottom-0 text-sm font-medium pb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-dark'}`}>
                        Date: {todayDate}
                    </div>
                </div>
            </div>
            
            {/* Table */}
            <div className="w-full overflow-x-auto pb-4 print:overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`text-sm font-bold border-b sticky top-0 z-20 print:static print:bg-white print:text-black ${theme === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : theme === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-gray-900 text-white border-gray-700'}`}>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Table</th>
                            <th className="py-3 px-4">Operations</th>
                            <th className="py-3 px-4">Column</th>
                            <th className="py-3 px-4 text-red-500">Old Value</th>
                            <th className="py-3 px-4 text-green-500">New Value</th>
                            <th className="py-3 px-4">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className={`text-xs print:text-black ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
                        {loading ? (
                            <tr><td colSpan="8" className="text-center py-6">Loading data...</td></tr>
                        ) : auditData.length === 0 ? (
                            <tr><td colSpan="8" className="text-center py-6">No records found.</td></tr>
                        ) : (
                            auditData.map((row, index) => {
                                const isPageVisit   = row.Action === 'PAGE_VISIT';
                                const isAdd         = !isPageVisit && (row.Action?.startsWith('ADD_') || row.Action?.includes('CREATE'));
                                const isDelete      = !isPageVisit && row.Action?.startsWith('DELETE_');
                                const isUpdate      = !isPageVisit && row.Action?.startsWith('UPDATE_');
                                const isRestore     = !isPageVisit && row.Action?.includes('RESTORE');

                                const rowBg = isPageVisit
                                  ? (theme === 'dark' ? 'border-gray-700 bg-purple-900/10'  : 'border-purple-100 bg-purple-50/30')
                                  : isAdd
                                  ? (theme === 'dark' ? 'border-gray-700 bg-green-900/10'   : 'border-green-100 bg-green-50/30')
                                  : isDelete
                                  ? (theme === 'dark' ? 'border-gray-700 bg-red-900/10'     : 'border-red-100 bg-red-50/20')
                                  : isUpdate
                                  ? (theme === 'dark' ? 'border-gray-700 bg-amber-900/10'   : 'border-amber-100 bg-amber-50/30')
                                  : isRestore
                                  ? (theme === 'dark' ? 'border-gray-700 bg-blue-900/10'    : 'border-blue-100 bg-blue-50/20')
                                  : (theme === 'dark' ? 'border-gray-700' : 'border-gray-100');

                                const displayOld = row.oldValue === '—' || row.oldValue === '-' || !row.oldValue ? '—' : row.oldValue;
                                const displayNew = row.newValue === '—' || row.newValue === '-' || !row.newValue ? '—' : row.newValue;

                                return (
                                <tr key={index} className={`border-b align-top transition-colors hover:brightness-95 ${rowBg}`}>
                                    <td className="py-2 px-4 whitespace-nowrap">{new Date(row.Timestamp).toLocaleString()}</td>
                                    <td className="py-2 px-4">{row.UserName || 'System'}</td>
                                    <td className="py-2 px-4 font-medium">{isPageVisit ? 'Navigation' : row.tableName}</td>
                                    <td className="py-2 px-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            isPageVisit ? 'bg-purple-100 text-purple-700' :
                                            isAdd       ? 'bg-green-100 text-green-700'   :
                                            isDelete    ? 'bg-red-100 text-red-700'       :
                                            row.Action?.includes('RESTORE') ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>{row.Action}</span>
                                    </td>
                                    <td className="py-2 px-4 font-semibold text-blue-600">
                                        {isPageVisit ? '—' : (row.columnName || '—')}
                                    </td>
                                    <td className="py-2 px-4 font-medium break-words max-w-xs">
                                        {isPageVisit || isAdd
                                          ? <span className="text-gray-400">—</span>
                                          : <span className="text-red-600">{displayOld}</span>
                                        }
                                    </td>
                                    <td className="py-2 px-4 font-medium break-words max-w-xs">
                                        {isPageVisit
                                          ? <span className="text-purple-600">{row.Details?.replace('Visited: ', '')}</span>
                                          : isDelete
                                          ? <span className="text-gray-400">—</span>
                                          : <span className="text-green-600">{displayNew}</span>
                                        }
                                    </td>
                                    <td className="py-2 px-4 text-gray-400">{row.IpAddress}</td>
                                </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="print:hidden">
                <Pagination
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    total={totalRecords}
                    onRefresh={fetchAuditLogs}
                />
            </div>

          </div>
        </ContentCard>

      </div>
    </PageLayout>
  );
};

export default AuditLogsReport;
