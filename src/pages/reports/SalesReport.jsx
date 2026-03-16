
import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import { getSalesApi, getSettingsApi } from "../../services/allAPI";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SalesReport = () => {
  const { theme } = useTheme();

  // State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const prepareExportData = () => {
    const data = [];
    salesData.forEach(row => {
        let items = [];
        try {
            if (typeof row.items === 'string') items = JSON.parse(row.items);
            else items = row.items || [];
        } catch (e) {
            items = [];
        }

        const baseRow = {
            "Order No": row.invoiceNo || row.vno || "-",
            "Customer": row.customerName || "-",
            "Date": new Date(row.date).toLocaleDateString(),
            "Payment Account": row.paymentAccount || "-",
            "Total Amount": Number(row.grandTotal || 0).toFixed(2),
        };

        if (items.length === 0) {
            data.push({ 
                ...baseRow, 
                "Product": "-", 
                "Unit Price": "-", 
                "Quantity": "-", 
                "Discount": "-", 
                "Taxable": "-",
                "Tax Amount": "-",
                "Line Total": "-" 
            });
        } else {
            items.forEach((item, index) => {
                const qty = Number(item.quantity || 0);
                const unitPrice = Number(item.unitPrice || 0);
                const discount = Number(item.discount || 0);
                
                const igstRate = Number(row.igstRate || row.IGSTRate || 0);
                const cgstRate = Number(row.cgstRate || row.CGSTRate || 0);
                const sgstRate = Number(row.sgstRate || row.SGSTRate || 0);
                const totalTaxRate = igstRate + cgstRate + sgstRate;

                const taxable = (qty * unitPrice) - discount;
                const tax = taxable * (totalTaxRate / 100);
                const lineTotal = taxable + tax;

                data.push({
                    "Order No": index === 0 ? baseRow["Order No"] : "",
                    "Customer": index === 0 ? baseRow["Customer"] : "",
                    "Date": index === 0 ? baseRow["Date"] : "",
                    "Payment Account": index === 0 ? baseRow["Payment Account"] : "",
                    "Total Amount": index === 0 ? baseRow["Total Amount"] : "",
                    "Product": item.productName || "-",
                    "Unit Price": unitPrice.toFixed(2),
                    "Quantity": qty,
                    "Discount": discount.toFixed(2),
                    "Taxable": taxable.toFixed(2),
                    "Tax Amount": tax.toFixed(2),
                    "Line Total": lineTotal.toFixed(2),
                });
            });
        }
    });
    return data;
  };

  const handleExportCSV = () => {
      try {
          const data = prepareExportData();
          const ws = XLSX.utils.json_to_sheet(data);
          const csv = XLSX.utils.sheet_to_csv(ws);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          saveAs(blob, `sales_report_${todayDate}.csv`);
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
          XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
          const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
          saveAs(blob, `sales_report_${todayDate}.xlsx`);
      } catch (err) {
          console.error("Export Excel Error:", err);
      } finally {
          setShowExportMenu(false);
      }
  };

  const handleExportJSON = () => {
      try {
          const data = prepareExportData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          saveAs(blob, `sales_report_${todayDate}.json`);
      } catch (err) {
          console.error("Export JSON Error:", err);
      } finally {
          setShowExportMenu(false);
      }
  };

  const handleExportPDF = () => {
      try {
          const doc = new jsPDF();
          
          doc.setFontSize(14);
          doc.text("Customer Sales Report", 14, 15);
          doc.setFontSize(10);
          doc.text(`Company: ${companyName}`, 14, 22);
          doc.text(`Date: ${todayDate}`, 14, 28);
          
          const data = prepareExportData();
          const headers = [["Order No", "Customer", "Date", "Payment Account", "Total Amount", "Product", "Unit Price", "Qty", "Dsc", "Taxable", "Tax", "Total"]];
          const rows = data.map(obj => [
              obj["Order No"], 
              obj["Customer"], 
              obj["Date"], 
              obj["Payment Account"], 
              obj["Total Amount"],
              obj["Product"],
              obj["Unit Price"],
              obj["Quantity"],
              obj["Discount"],
              obj["Taxable"],
              obj["Tax Amount"],
              obj["Line Total"]
          ]);
          
          doc.autoTable({
              startY: 35,
              head: headers,
              body: rows,
              styles: { fontSize: 7 },
              columnStyles: {
                  0: { cellWidth: 15 },
                  1: { cellWidth: 20 },
                  2: { cellWidth: 15 },
                  3: { cellWidth: 15 },
                  4: { cellWidth: 15 },
                  5: { cellWidth: 20 },
                  6: { cellWidth: 12 },
                  7: { cellWidth: 8 },
                  8: { cellWidth: 12 },
                  9: { cellWidth: 15 },
                  10: { cellWidth: 15 },
                  11: { cellWidth: 15 }
              }
          });
          
          doc.save(`sales_report_${todayDate}.pdf`);
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
                    <div className={`absolute top-full left-0 mt-1 w-64 border rounded shadow-lg z-50 text-[13px] font-sans overflow-hidden
                        ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-200'
                        : 'bg-[#f0f4f8] border-[#a0c4e4] text-gray-800'}`}
                    >
                        <div className={`px-3 py-1.5 font-semibold text-sm border-b
                            ${theme === 'emerald' ? 'bg-emerald-700 text-white border-emerald-800' 
                            : theme === 'purple' ? 'bg-[#6448AE] text-white border-[#523A8C]'
                            : theme === 'dark' ? 'bg-gray-900 text-white border-gray-700'
                            : 'bg-[#2b579a] text-white border-[#a0c4e4]'}`}
                        >
                            List of File Formats
                        </div>
                        <div className="py-1">
                            <button className={`w-full text-left px-3 py-1.5 transition-colors font-medium
                                ${theme === 'emerald' ? 'hover:bg-emerald-200 text-emerald-800 hover:text-emerald-900' 
                                : theme === 'purple' ? 'hover:bg-purple-200 text-purple-800 hover:text-purple-900'
                                : theme === 'dark' ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                                : 'hover:bg-[#ffeb9c] hover:text-[#9c6500] text-blue-800'}`} 
                                onClick={handleExportCSV}>
                                CSV (Comma Delimited)
                            </button>
                            <button className={`w-full text-left px-3 py-1.5 transition-colors font-medium
                                ${theme === 'emerald' ? 'hover:bg-emerald-200 text-emerald-800 hover:text-emerald-900' 
                                : theme === 'purple' ? 'hover:bg-purple-200 text-purple-800 hover:text-purple-900'
                                : theme === 'dark' ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                                : 'hover:bg-[#ffeb9c] hover:text-[#9c6500] text-blue-800'}`} 
                                onClick={handleExportExcel}>
                                Excel (Spreadsheet)
                            </button>
                            <button className={`w-full text-left px-3 py-1.5 transition-colors font-medium
                                ${theme === 'emerald' ? 'hover:bg-emerald-200 text-emerald-800 hover:text-emerald-900' 
                                : theme === 'purple' ? 'hover:bg-purple-200 text-purple-800 hover:text-purple-900'
                                : theme === 'dark' ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                                : 'hover:bg-[#ffeb9c] hover:text-[#9c6500] text-blue-800'}`} 
                                onClick={handleExportJSON}>
                                JSON (Data Exchange)
                            </button>
                            <button className={`w-full text-left px-3 py-1.5 transition-colors font-medium
                                ${theme === 'emerald' ? 'hover:bg-emerald-200 text-emerald-800 hover:text-emerald-900' 
                                : theme === 'purple' ? 'hover:bg-purple-200 text-purple-800 hover:text-purple-900'
                                : theme === 'dark' ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                                : 'hover:bg-[#ffeb9c] hover:text-[#9c6500] text-blue-800'}`} 
                                onClick={handleExportPDF}>
                                PDF (Printable Document)
                            </button>
                        </div>
                    </div>
                )}
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
                <div className={`flex justify-between items-center border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                    <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Customer Sales Report</h2>
                </div>
                
                <div className="relative flex justify-center items-center mt-2">
                    <h1 className={`text-2xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>{companyName}</h1>
                    <div className={`absolute right-0 bottom-0 text-sm font-medium pb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-dark'}`}>
                        Date: {todayDate}
                    </div>
                </div>
            </div>
            
            {/* Custom Table */}
            <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`text-sm font-bold border-b sticky top-0 z-0 print:static print:bg-white print:text-black ${theme === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : theme === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-gray-900 text-white border-gray-700'}`}>
                            <th className="py-3 px-4 w-28 print:w-[15%] print:px-1">Order #</th>
                            <th className="py-3 px-4 w-40 print:w-[30%] print:px-1">Customer</th>
                            <th className="py-3 px-4 w-24 print:w-[15%] print:px-1">Date</th>
                            <th className="py-3 px-4 w-28 text-right print:w-[20%] print:px-1">Payment</th>
                            <th className="py-3 px-4 w-auto hidden 2xl:table-cell print:hidden">Sale Detail</th>
                            <th className="py-3 px-4 w-28 text-right print:w-[20%] print:px-1">Method</th>
                        </tr>
                    </thead>
                    <tbody className={`text-sm print:text-black ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-6">Loading data...</td></tr>
                        ) : salesData.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-6">No records found.</td></tr>
                        ) : (
                            salesData.map((row, index) => (
                                <React.Fragment key={index}>
                                    {/* Main Row */}
                                    <tr className={`border-b align-top print:border-gray-200 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <td className={`py-3 px-4 font-medium print:px-1 print:text-black pt-4 whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{row.invoiceNo || row.vno}</td>
                                        <td className={`py-3 px-4 font-medium print:px-1 print:text-black pt-4 ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{row.customerName}</td>
                                        <td className={`py-3 px-4 font-medium print:px-1 print:text-black pt-4 whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{new Date(row.date).toLocaleDateString()}</td>
                                        <td className={`py-3 px-4 font-medium text-right font-bold print:px-1 print:text-black pt-4 whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{Number(row.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        
                                        {/* Nested Details Cell (Screen Only - Desktop) */}
                                        <td className="py-3 px-4 hidden 2xl:table-cell print:hidden">
                                            <div className="w-full">
                                                {/* Inner Header */}
                                                <div className={`grid grid-cols-9 gap-1 sm:gap-2 mb-1 text-xs font-bold border-b p-1 ${theme === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : theme === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-gray-900 text-white border-gray-700'}`}>
                                                    <div className="col-span-2">Product</div>
                                                    <div className="text-right">Price</div>
                                                    <div className="text-center">Qty</div>
                                                    <div className="text-center">Dsc (%)</div>
                                                    <div className="text-right">Taxable</div>
                                                    <div className="text-right">Tax</div>
                                                    <div className="text-right col-span-2">Total</div>
                                                </div>

                                                {/* Inner Items */}
                                                {getItems(row).map((item, idx) => {
                                                    const qty = Number(item.quantity || 0);
                                                    const unitPrice = Number(item.unitPrice || 0);
                                                    const discount = Number(item.discount || 0);
                                                    
                                                    const igstRate = Number(row.igstRate || row.IGSTRate || 0);
                                                    const cgstRate = Number(row.cgstRate || row.CGSTRate || 0);
                                                    const sgstRate = Number(row.sgstRate || row.SGSTRate || 0);
                                                    const totalTaxRate = igstRate + cgstRate + sgstRate;

                                                    const taxable = (qty * unitPrice) - discount;
                                                    const tax = taxable * (totalTaxRate / 100);
                                                    const lineTotal = taxable + tax;

                                                    return (
                                                    <div key={idx} className={`grid grid-cols-9 gap-1 sm:gap-2 py-1 text-xs font-medium border-b border-dashed last:border-0 p-1 ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                                                        <div className="col-span-2 truncate" title={item.productName}>{item.productName}</div>
                                                        <div className="text-right">{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-center">{qty}</div>
                                                        <div className="text-center">{discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right">{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right">{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right col-span-2 truncate" title={lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}>{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        <td className={`py-3 px-4 text-right font-medium pt-4 whitespace-nowrap print:text-black ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{row.paymentAccount || '-'}</td>
                                    </tr>

                                    {/* Sale Detail Row (Mobile/Tablet only) */}
                                    <tr className={`2xl:hidden border-b print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                        <td colSpan="5" className="py-3 px-4 w-full">
                                            <div className="w-full bg-black/5 dark:bg-white/5 rounded p-2">
                                                <div className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Sale Detail:</div>
                                                {/* Inner Header */}
                                                <div className={`grid grid-cols-9 gap-1 sm:gap-2 mb-1 text-xs font-bold border-b p-1 ${theme === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : theme === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-transparent text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>
                                                    <div className="col-span-2">Product</div>
                                                    <div className="text-right">Price</div>
                                                    <div className="text-center">Qty</div>
                                                    <div className="text-center">Dsc (%)</div>
                                                    <div className="text-right">Taxable</div>
                                                    <div className="text-right">Tax</div>
                                                    <div className="text-right col-span-2">Total</div>
                                                </div>

                                                {/* Inner Items */}
                                                {getItems(row).map((item, idx) => {
                                                    const qty = Number(item.quantity || 0);
                                                    const unitPrice = Number(item.unitPrice || 0);
                                                    const discount = Number(item.discount || 0);
                                                    
                                                    const igstRate = Number(row.igstRate || row.IGSTRate || 0);
                                                    const cgstRate = Number(row.cgstRate || row.CGSTRate || 0);
                                                    const sgstRate = Number(row.sgstRate || row.SGSTRate || 0);
                                                    const totalTaxRate = igstRate + cgstRate + sgstRate;

                                                    const taxable = (qty * unitPrice) - discount;
                                                    const tax = taxable * (totalTaxRate / 100);
                                                    const lineTotal = taxable + tax;

                                                    return (
                                                    <div key={idx} className={`grid grid-cols-9 gap-1 sm:gap-2 py-1 text-xs font-medium border-b border-dashed last:border-0 p-1 ${theme === 'dark' ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-200'}`}>
                                                        <div className="col-span-2 truncate" title={item.productName}>{item.productName}</div>
                                                        <div className="text-right">{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-center">{qty}</div>
                                                        <div className="text-center">{discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right">{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right">{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right col-span-2 truncate" title={lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}>{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Print Only Row - Nested Table */}
                                    <tr className="hidden print:table-row border-b border-gray-200">
                                        <td colSpan="6" className="px-1 pb-4">
                                             <div className="w-full pl-8"> 
                                                <div className="grid grid-cols-9 gap-1 mb-1 text-[10px] font-bold border-b border-gray-300 pb-1 text-black">
                                                    <div className="col-span-2">Product</div>
                                                    <div className="text-right">Price</div>
                                                    <div className="text-center">Qty</div>
                                                    <div className="text-center">Dsc (%)</div>
                                                    <div className="text-right">Taxable</div>
                                                    <div className="text-right">Tax</div>
                                                    <div className="text-right col-span-2">Total</div>
                                                </div>
                                                {getItems(row).map((item, idx) => {
                                                    const qty = Number(item.quantity || 0);
                                                    const unitPrice = Number(item.unitPrice || 0);
                                                    const discount = Number(item.discount || 0);
                                                    
                                                    const igstRate = Number(row.igstRate || row.IGSTRate || 0);
                                                    const cgstRate = Number(row.cgstRate || row.CGSTRate || 0);
                                                    const sgstRate = Number(row.sgstRate || row.SGSTRate || 0);
                                                    const totalTaxRate = igstRate + cgstRate + sgstRate;

                                                    const taxable = (qty * unitPrice) - discount;
                                                    const tax = taxable * (totalTaxRate / 100);
                                                    const lineTotal = taxable + tax;

                                                    return (
                                                    <div key={idx} className="grid grid-cols-9 gap-1 py-1 text-[10px] font-medium text-black border-b border-dashed border-gray-200 last:border-0">
                                                        <div className="col-span-2 truncate">{item.productName}</div>
                                                        <div className="text-right">{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-center">{qty}</div>
                                                        <div className="text-center">{discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right">{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right">{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className="text-right col-span-2">{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    </div>
                                                    );
                                                })}
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
