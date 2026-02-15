
import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import { getSalesApi, getSettingsApi } from "../../services/allAPI";

const SalesReport = () => {
  const { theme } = useTheme();

  // State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [companyName, setCompanyName] = useState("");

  // Date formatting for header
  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).replace(/ /g, '-');

  // Fetch Data
  const fetchSales = async () => {
    setLoading(true);
    try {
        const filters = { startDate, endDate };
        // Fetch higher limit for report
        const res = await getSalesApi(1, 1000, "date", "DESC", filters);
        if (res.status === 200) {
            setSalesData(res.data.records);
            setTotalRecords(res.data.total);
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
    fetchSales();
    fetchSettings();
  }, []);

  const handleSearch = () => {
      fetchSales();
  };
  
  const handlePrint = () => {
      window.print();
  };

  // Helper to parse items
  const getItems = (row) => {
      try {
          if (typeof row.items === 'string') return JSON.parse(row.items);
          return row.items || [];
      } catch (e) {
          return [];
      }
  };

  return (
    <PageLayout>
      <div id="report-content" className={`p-6 h-full flex flex-col gap-6 overflow-hidden print:absolute print:top-0 print:left-0 print:w-full print:h-auto print:m-0 print:p-8 print:bg-white print:overflow-visible print:z-50`}>
        
        {/* TOP FILTER BAR */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4 text-gray-800 flex-none z-10 print:hidden">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">From</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-500 w-48" 
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">To</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-500 w-48" 
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
                    <h2 className="text-2xl font-bold text-black uppercase tracking-wide">Customer Sales Report</h2>
                </div>
                <div className="relative flex justify-center items-center mt-2">
                     <h1 className="text-3xl font-bold text-black">{companyName}</h1>
                     <div className="absolute right-0 bottom-1 text-sm font-medium text-dark">Date: {todayDate}</div>
                </div>
            </div>

            {/* SCREEN HEADER */}
            <div className="flex flex-col gap-1 flex-none print:hidden">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Customer Sales Report</h2>
                </div>
                
                <div className="relative flex justify-center items-center mt-2">
                    <h1 className={`text-2xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>{companyName}</h1>
                    <div className="absolute right-0 bottom-0 text-sm text-dark font-medium pb-1">
                        Date: {todayDate}
                    </div>
                </div>
            </div>
            
            {/* Custom Table */}
            <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-sm font-bold text-purple-800 border-b border-purple-200 bg-purple-50 sticky top-0 z-0 print:static print:bg-white print:text-black">
                            <th className="py-3 px-4 w-28 print:w-[15%] print:px-1">Order #</th>
                            <th className="py-3 px-4 w-40 print:w-[30%] print:px-1">Customer</th>
                            <th className="py-3 px-4 w-24 print:w-[15%] print:px-1">Date</th>
                            <th className="py-3 px-4 w-28 text-right print:w-[20%] print:px-1">Payment</th>
                            <th className="py-3 px-4 w-auto print:hidden">Sale Detail</th>
                            <th className="py-3 px-4 w-28 text-right print:w-[20%] print:px-1">Method</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-600 print:text-black">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-6">Loading data...</td></tr>
                        ) : salesData.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-6">No records found.</td></tr>
                        ) : (
                            salesData.map((row, index) => (
                                <React.Fragment key={index}>
                                    {/* Main Row */}
                                    <tr className="border-b border-gray-100 hover:bg-gray-50 align-top print:border-gray-200">
                                        <td className="py-3 px-4 font-medium text-dark print:px-1 print:text-black pt-4 whitespace-nowrap">{row.invoiceNo || row.vno}</td>
                                        <td className="py-3 px-4 font-medium text-dark print:px-1 print:text-black pt-4">{row.customerName}</td>
                                        <td className="py-3 px-4 font-medium text-dark print:px-1 print:text-black pt-4 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 font-medium text-right font-bold text-gray-900 print:px-1 print:text-black pt-4 whitespace-nowrap">{Number(row.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        
                                        {/* Nested Details Cell (Screen Only) */}
                                        <td className="py-3 px-4 print:hidden">
                                            <div className="w-[90%]">
                                                {/* Inner Header */}
                                                <div className="grid grid-cols-7 gap-2 mb-1 text-xs font-bold border-b border-purple-200 pb-1 text-purple-800 bg-purple-50 p-1">
                                                    <div className="col-span-2">Product</div>
                                                    <div className="text-right">Unit Price</div>
                                                    <div className="text-center">Quantity</div>
                                                    <div className="text-center w-28">Discount (%)</div>
                                                    <div className="text-right col-span-2">Line Total</div>
                                                </div>

                                                {/* Inner Items */}
                                                {getItems(row).map((item, idx) => (
                                                    <div key={idx} className="grid grid-cols-7 gap-2 py-1 text-xs font-medium text-gray-700 border-b border-dashed border-gray-100 last:border-0 p-1">
                                                        <div className="col-span-2 truncate" title={item.productName}>{item.productName}</div>
                                                        <div className="text-right">{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-center">{item.quantity}</div>
                                                        <div className="text-center">{Number(item.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right col-span-2">{Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        <td className="py-3 px-4 text-right font-medium pt-4 whitespace-nowrap text-gray-600 print:text-black">{row.paymentAccount || '-'}</td>
                                    </tr>

                                    {/* Print Only Row - Nested Table */}
                                    <tr className="hidden print:table-row border-b border-gray-200">
                                        <td colSpan="6" className="px-1 pb-4">
                                             <div className="w-full pl-8"> 
                                                <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] font-bold border-b border-gray-300 pb-1 text-black">
                                                    <div className="col-span-2">Product</div>
                                                    <div className="text-right">Unit Price</div>
                                                    <div className="text-center">Quantity</div>
                                                    <div className="text-center">Discount (%)</div>
                                                    <div className="text-right col-span-2">Line Total</div>
                                                </div>
                                                {getItems(row).map((item, idx) => (
                                                    <div key={idx} className="grid grid-cols-7 gap-1 py-1 text-[10px] font-medium text-black border-b border-dashed border-gray-200 last:border-0">
                                                        <div className="col-span-2 truncate">{item.productName}</div>
                                                        <div className="text-right">{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-center">{item.quantity}</div>
                                                        <div className="text-center">{Number(item.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right col-span-2">{Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    </div>
                                                ))}
                                             </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
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

export default SalesReport;
