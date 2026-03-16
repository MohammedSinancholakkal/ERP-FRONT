import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import toast from 'react-hot-toast';
import { getTaxReportApi } from "../../services/allAPI";

const TaxReport = () => {
    const { theme } = useTheme();

  /* UI State */
  const [searchText, setSearchText] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  const [sortConfig, setSortConfig] = useState({ key: "Date", direction: "desc" });

  const handleSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'asc';
    } else if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [data, setData] = useState([]);
  const [totalTaxCollected, setTotalTaxCollected] = useState(0);
  const [totalTaxPaid, setTotalTaxPaid] = useState(0);
  const [netTax, setNetTax] = useState(0);
  const [loading, setLoading] = useState(false);

  /* Fetch Data */
  const fetchReport = async () => {
      try {
          setLoading(true);
          const res = await getTaxReportApi(page, limit, sortConfig.key, sortConfig.direction);
          if (res.status === 200) {
              setData(res.data.records);
              setTotal(res.data.total);
              setTotalTaxCollected(res.data.TotalTaxCollected);
              setTotalTaxPaid(res.data.TotalTaxPaid);
              setNetTax(res.data.NetTax);
          } else {
              toast.error("Failed to load tax report data");
          }
      } catch (error) {
          console.error("Error fetching report:", error);
          toast.error("Failed to load tax report data");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchReport();
  }, [page, limit, sortConfig]);

  // Filtered Data (Local filtering if needed, though backend is paginated. Just for description/ref)
  const filteredData = (data || []).filter(d => 
      (d.Description && d.Description.toLowerCase().includes(searchText.toLowerCase())) ||
      (d.ReferenceNo && d.ReferenceNo.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <PageLayout> 
      <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-4">

            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Tax Report</h2>
              
              <div className="flex space-x-4 items-center relative">
                <div className={`text-sm font-bold px-4 py-2 rounded-lg bg-blue-100 text-blue-800`}>
                    Tax Collected: {(totalTaxCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-bold px-4 py-2 rounded-lg bg-orange-100 text-orange-800`}>
                    Tax Paid: {(totalTaxPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-lg font-bold px-4 py-2 rounded-lg 
                    ${(netTax || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Net Tax: {(netTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <input
                    type="text"
                    placeholder="Search by reference..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className={`pl-3 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'emerald' || theme === 'purple' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-800 text-white border-gray-600'}`}
                />
              </div>
            </div>

            <hr className="border-gray-300" />
            
            <div className={`flex-1 overflow-x-auto overflow-y-auto rounded-lg border ${theme === 'purple' ? 'border-purple-200' : theme === 'emerald' ? 'border-emerald-200' : 'border-gray-700'}`}>
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className={`sticky top-0 z-10 ${theme === 'purple' ? 'bg-purple-100 text-purple-900' : theme === 'emerald' ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-800 text-gray-300'}`}>
                  <tr>
                    <th className="px-4 py-3 cursor-pointer select-none font-medium hover:bg-black/5" onClick={() => handleSort('Date')}>
                      Date {sortConfig.key === 'Date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 cursor-pointer select-none font-medium hover:bg-black/5" onClick={() => handleSort('ReferenceNo')}>
                      Reference # {sortConfig.key === 'ReferenceNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 cursor-pointer select-none text-right font-medium hover:bg-black/5" onClick={() => handleSort('TaxCollected')}>
                      Tax Collected (Sales) {sortConfig.key === 'TaxCollected' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer select-none text-right font-medium hover:bg-black/5" onClick={() => handleSort('TaxPaid')}>
                      Tax Paid (Purchases) {sortConfig.key === 'TaxPaid' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'purple' ? 'divide-purple-100' : theme === 'emerald' ? 'divide-emerald-100' : 'divide-gray-700'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8">Loading...</td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={`text-center py-8 ${theme === 'purple' ? 'text-purple-600' : theme === 'emerald' ? 'text-emerald-600' : 'text-gray-400'}`}>No tax records found.</td>
                    </tr>
                  ) : (
                    filteredData.map((record) => (
                        <tr key={record.TransactionId + record.Type} className={`${theme === 'purple' ? 'bg-white hover:bg-purple-50 text-gray-900' : theme === 'emerald' ? 'bg-white hover:bg-emerald-50 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'} transition-colors duration-200`}>
                          <td className="px-4 py-3">{record.Date ? format(new Date(record.Date), 'dd/MM/yyyy') : '-'}</td>
                          <td className="px-4 py-3">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${record.Type === 'Sale' || record.Type === 'Service' ? 'bg-blue-100 text-blue-800' : 
                                     'bg-red-100 text-red-800'}`}>
                                  {record.Type}
                              </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{record.ReferenceNo || '-'}</td>
                          <td className={`px-4 py-3 max-w-[300px] truncate ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-400'}`} title={record.Description}>{record.Description || '-'}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-bold">{record.TaxCollected > 0 ? record.TaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                          <td className="px-4 py-3 text-right text-orange-600 font-bold">{record.TaxPaid > 0 ? record.TaxPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                        </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {total > 0 && (
                <div className="mt-auto">
                    <Pagination
                        total={total}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                    />
                </div>
            )}
          </div>
        </ContentCard>
      </div>
    </PageLayout>
  );
};

export default TaxReport;
