import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import toast from 'react-hot-toast';
import { getCustomerReceivablesDetailedApi } from "../../services/allAPI";

const CustomerReceivableDetailedReport = () => {
    const { theme } = useTheme();

  /* UI State */
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Fetch Data */
  const fetchReport = async () => {
      try {
          setLoading(true);
          const res = await getCustomerReceivablesDetailedApi(sortConfig.key, sortConfig.direction);
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

  useEffect(() => {
      fetchReport();
  }, [sortConfig]);

  // Filtered Data
  const filteredData = data.filter(d => 
      d.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (d.phone && d.phone.includes(searchText))
  );

  // Pagination Logic
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  
  const toggleRow = (id) => {
      setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <PageLayout> 
      <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-4">

            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Customer Receivable Detailed Report</h2>
              
              <div className="flex space-x-2 relative">
                <input
                    type="text"
                    placeholder="Search customer..."
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
                    <th className="px-4 py-3 cursor-pointer select-none"></th>
                    <th className="px-4 py-3 cursor-pointer select-none font-medium hover:bg-black/5" onClick={() => handleSort('name')}>
                      Customer Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Total Receivable</th>
                    <th className="px-4 py-3 text-right font-medium">Total Received</th>
                    <th className="px-4 py-3 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'purple' ? 'divide-purple-100' : theme === 'emerald' ? 'divide-emerald-100' : 'divide-gray-700'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8">Loading...</td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={`text-center py-8 ${theme === 'purple' ? 'text-purple-600' : theme === 'emerald' ? 'text-emerald-600' : 'text-gray-400'}`}>No customers found.</td>
                    </tr>
                  ) : (
                    paginatedData.map((customer) => (
                      <React.Fragment key={customer.id}>
                        <tr className={`${theme === 'purple' ? 'hover:bg-purple-50 bg-white text-gray-900' : theme === 'emerald' ? 'hover:bg-emerald-50 bg-white text-gray-900' : 'hover:bg-gray-700 bg-gray-800 text-gray-200'} cursor-pointer transition-colors duration-200`} onClick={() => toggleRow(customer.id)}>
                          <td className="px-4 py-3 w-10">
                            {expandedRows[customer.id] ? (
                                <ChevronDown size={18} className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`} />
                            ) : (
                                <ChevronRight size={18} className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`} />
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold">{customer.name}</td>
                          <td className="px-4 py-3 text-right">{(customer.receivable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-right">{(customer.received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-right font-bold">{(customer.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        
                        {/* Expanded Child Rows */}
                        {expandedRows[customer.id] && customer.transactions && customer.transactions.length > 0 && (
                          <tr>
                            <td colSpan="5" className="px-0 py-0">
                                <div className={`p-4 border-b ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'}`}>
                                    <table className={`w-full text-sm text-left border rounded-lg overflow-hidden shadow-inner ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800'}`}>
                                        <thead className={`${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 text-gray-700' : 'bg-gray-900 text-gray-300'}`}>
                                            <tr>
                                                <th className="px-3 py-2 font-medium">Date</th>
                                                <th className="px-3 py-2 font-medium">Type</th>
                                                <th className="px-3 py-2 font-medium">Reference #</th>
                                                <th className="px-3 py-2 font-medium">Account</th>
                                                <th className="px-3 py-2 font-medium">Description</th>
                                                <th className="px-3 py-2 text-right font-medium">Receivable Amount</th>
                                                <th className="px-3 py-2 text-right font-medium">Received Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${theme === 'emerald' || theme === 'purple' ? 'divide-gray-200' : 'divide-gray-700'}`}>
                                            {customer.transactions.map(txn => (
                                                <tr key={txn.id} className={`${theme === 'emerald' || theme === 'purple' ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700 text-gray-200'} transition-colors`}>
                                                    <td className="px-3 py-2">{txn.date ? format(new Date(txn.date), 'dd/MM/yyyy') : '-'}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${(txn.type || '').toLowerCase().includes('receipt') || txn.received > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {txn.type || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">{txn.referenceNo || '-'}</td>
                                                    <td className="px-3 py-2">{txn.accountType || '-'}</td>
                                                    <td className={`px-3 py-2 whitespace-normal break-words ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-400'}`} style={{ minWidth: '200px' }}>{txn.description || '-'}</td>
                                                    <td className="px-3 py-2 text-right text-red-600 font-medium">{txn.receivable > 0 ? txn.receivable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                                    <td className="px-3 py-2 text-right text-green-600 font-medium">{txn.received > 0 ? txn.received.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                          </tr>
                        )}
                        {expandedRows[customer.id] && (!customer.transactions || customer.transactions.length === 0) && (
                            <tr>
                                <td colSpan="5" className={`px-4 py-3 text-center italic text-sm ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-500' : 'bg-gray-800/50 text-gray-400'}`}>
                                    No transactions found for this customer.
                                </td>
                            </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredData.length > 0 && (
                <div className="mt-auto">
                    <Pagination
                        total={filteredData.length}
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

export default CustomerReceivableDetailedReport;
