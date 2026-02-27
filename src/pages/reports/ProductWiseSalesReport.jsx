
import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import { getProductWiseSalesApi, getSettingsApi } from "../../services/allAPI"; // Imported new API

const ProductWiseSalesReport = () => {
  const { theme } = useTheme();

  // State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");

  // Date formatting for header
  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).replace(/ /g, '-');

  // Fetch Data
  const fetchReport = async () => {
    setLoading(true);
    try {
        const filters = { startDate, endDate };
        const res = await getProductWiseSalesApi(filters);
        if (res.status === 200) {
            setSalesData(res.data.records);
        }
    } catch (err) {
        console.error("Report Fetch Error:", err);
    } finally {
        setLoading(false);
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
    fetchReport();
    fetchSettings();
  }, []);

  const handleSearch = () => {
      fetchReport();
  };
  
  const handlePrint = () => {
      window.print();
  };

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
                    className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-48 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-600'}`} 
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-48 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-600'}`} 
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
            <div className="mt-auto pb-0.5">
                <button 
                    onClick={handlePrint}
                    className="bg-[#f5a623] hover:bg-[#d48806] text-white px-6 py-2 rounded text-sm font-medium transition-colors"
                >
                    Print
                </button>
            </div>
        </div>

        {/* REPORT CONTENT */}
        <ContentCard className="flex-1 min-h-0 shadow-md print:shadow-none print:border-none print:h-auto print:overflow-visible">
          <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 print:overflow-visible print:h-auto custom-scrollbar">
            
            {/* PRINT HEADER */}
            <div className="hidden print:flex flex-col gap-2 mb-4">
                <style type="text/css" media="print">
                  {`
                    @page { size: auto; margin: 0mm; }
                    body { visibility: hidden; }
                    #report-content, #report-content * { visibility: visible; }
                    #report-content {
                        position: absolute !important;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        margin: 0;
                        padding: 10mm !important; 
                        background: white;
                        overflow: visible !important;
                    }
                  `}
                </style>

                <div className="border-b border-black pb-2">
                    <h2 className="text-2xl font-bold text-black uppercase tracking-wide">Product Wise Sales Report</h2>
                </div>
                <div className="relative flex justify-center items-center mt-2">
                     <h1 className="text-3xl font-bold text-black">{companyName}</h1>
                     <div className="absolute right-0 bottom-1 text-sm font-medium text-dark">Date: {todayDate}</div>
                </div>
            </div>

            {/* SCREEN HEADER */}
            <div className="flex flex-col gap-1 flex-none print:hidden">
                <div className={`flex justify-between items-center border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                    <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Product Wise Sales Report</h2>
                </div>
                
                <div className="relative flex justify-center items-center mt-2">
                    <h1 className={`text-2xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>{companyName}</h1>
                    <div className={`absolute right-0 bottom-0 text-sm font-medium pb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                        Date: {todayDate}
                    </div>
                </div>
            </div>
            
            {/* Custom Table */}
            <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`text-sm font-bold border-b sticky top-0 z-0 print:static print:bg-white print:text-black ${theme === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : theme === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-gray-900 text-white border-gray-700'}`}>
                            <th className="py-3 px-4 w-32 print:w-[15%] print:px-1">Sales Date</th>
                            <th className="py-3 px-4 print:px-1">Product</th>
                            <th className="py-3 px-4 w-32 print:w-[15%] print:px-1">Invoice No</th>
                            <th className="py-3 px-4 w-48 print:w-[20%] print:px-1">Customer Name</th>
                            <th className="py-3 px-4 text-left w-24 print:w-[10%] print:px-1">Rate</th>
                            <th className="py-3 px-4 text-center w-24 print:w-[10%] print:px-1">Qty</th>
                            <th className="py-3 px-4 text-center w-32 print:w-[10%] print:px-1">Discount (%)</th>
                            <th className="py-3 px-4 text-left w-28 print:w-[10%] print:px-1">Total</th>
                        </tr>
                    </thead>
                    <tbody className={`text-sm print:text-black ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
                        {loading ? (
                            <tr><td colSpan="8" className="text-center py-6">Loading data...</td></tr>
                        ) : salesData.length === 0 ? (
                            <tr><td colSpan="8" className="text-center py-6">No records found.</td></tr>
                        ) : (
                            salesData.map((row, index) => (
                                <tr key={index} className={`border-b align-top print:border-gray-200 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    <td className={`py-3 px-4 font-medium pt-3 whitespace-nowrap ${theme === 'dark' ? 'text-white' : ''}`}>{new Date(row.date).toLocaleDateString()}</td>
                                    <td className={`py-3 px-4 font-medium pt-3 ${theme === 'dark' ? 'text-white' : ''}`}>{row.productName}</td>
                                    <td className={`py-3 px-4 font-medium pt-3 whitespace-nowrap ${theme === 'dark' ? 'text-white' : ''}`}>{row.invoiceNo || row.vno}</td>
                                    <td className={`py-3 px-4 font-medium pt-3 ${theme === 'dark' ? 'text-white' : ''}`}>{row.customerName}</td>
                                    <td className={`py-3 px-4 font-medium text-left pt-3 whitespace-nowrap ${theme === 'dark' ? 'text-white' : ''}`}>{Number(row.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className={`py-3 px-4 font-bold text-center pt-3 whitespace-nowrap ${theme === 'dark' ? 'text-white' : ''}`}>{row.quantity}</td>
                                    <td className={`py-3 px-4 text-center pt-3 whitespace-nowrap ${theme === 'dark' ? 'text-white' : ''}`}>{Number(row.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className={`py-3 px-4 font-bold text-left pt-3 whitespace-nowrap print:text-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{Number(row.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

          </div>
        </ContentCard>

      </div>
    </PageLayout>
  );
};

export default ProductWiseSalesReport;
