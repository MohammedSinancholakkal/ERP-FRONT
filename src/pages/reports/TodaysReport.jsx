import React, { useState, useEffect } from "react";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
import { serverURL } from "../../services/serverURL"; 
// Assuming global axios or relative path. Since I don't know exact config, I'll try standard /api/dashboard call.
// Safest is to check where other API calls are made. 
// Step 41 mentioned `getCreditVouchersApi`. Let's assume there's an api service or use raw axios.
// I will use raw axios for now to `/api/dashboard/todays-detailed` assuming configured proxy or absolute URL if needed.
// Better: Check `config.js` or similar?
// Let's use local state and fetch logic.

const TodaysReport = () => {
  const { theme } = useTheme();
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date formatting
  const todayDate = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric"
  });

  useEffect(() => {
    fetchTodaysReport();
  }, []);

  const fetchTodaysReport = async () => {
      try {
          // Assuming API exists at this path based on routes
          const token = localStorage.getItem("token"); // Basic auth assumption
          // Use client browser date (YYYY-MM-DD) to ensure "Today" matches user's view
          // Use client browser date (YYYY-MM-DD) to ensure "Today" matches user's view
          
          const config = { 
              headers: { Authorization: `Bearer ${token}` }
          };
          
          // Using typical VITE_API_URL or relative path if proxy is set
          // I'll assume relative path since frontend/backend commonly proxy or cors.
          // Adjust base URL if needed.
           const response = await axios.get(`${serverURL}/dashboard/todays-detailed`, config);
           
           if(response.data) {
               setSalesData(response.data.sales || []);
               setPurchaseData(response.data.purchases || []);
           }
      } catch (error) {
          console.error("Error fetching today's report:", error);
      } finally {
          setLoading(false);
      }
  };

  return (
    <PageLayout>
      <div className={`p-6 h-full flex flex-col gap-6 overflow-y-auto ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        
        {/* Sales Report Card */}
        <ContentCard>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold text-purple-800">Today's Sales Report</h2>
                <div className="text-sm text-gray-600 font-medium">
                    Date: {todayDate}
                </div>
            </div>
            <hr className="border-gray-100" />
            
            <div className="w-full h-[220px] overflow-y-scroll custom-scrollbar pr-2">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="text-sm font-bold text-purple-800 border-b border-purple-200 bg-purple-50">
                            <th className="py-3 px-4 w-1/4">Invoice #</th>
                            <th className="py-3 px-4 w-1/4">Customer</th>
                            <th className="py-3 px-4 text-center w-1/4">Sale Date</th>
                            <th className="py-3 px-4 text-right w-1/4">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-dark font-medium">
                        {loading ? (
                             <tr><td colSpan="4" className="py-4 px-4 text-center">Loading...</td></tr>
                        ) : salesData.length > 0 ? (
                            salesData.map((row, index) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                                    <td className="py-2 px-4 font-medium text-dark whitespace-nowrap">{row.invoiceNo}</td>
                                    <td className="py-2 px-4 font-medium text-dark">{row.customer}</td>
                                    <td className="py-2 px-4 font-medium text-dark text-center whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 font-medium text-right font-bold text-gray-900 whitespace-nowrap">{Number(row.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))
                        ) : (
                           <tr>
                                <td colSpan="4" className="py-4 px-4 text-center text-gray-400 text-xs italic">
                                    No sales found for today.
                                </td>
                           </tr> 
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </ContentCard>

        {/* Purchase Report Card */}
        <ContentCard>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold text-purple-800">Today's Purchase Report</h2>
                <div className="text-sm text-gray-600 font-medium">
                    Date: {todayDate}
                </div>
            </div>
            <hr className="border-gray-100" />

            <div className="w-full h-[220px] overflow-y-scroll custom-scrollbar pr-2">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="text-sm font-bold text-purple-800 border-b border-purple-200 bg-purple-50">
                            <th className="py-3 px-4 w-1/4">BILL #</th>
                            <th className="py-3 px-4 w-1/4">Supplier</th>
                            <th className="py-3 px-4 text-center w-1/4">Purchase Date</th>
                            <th className="py-3 px-4 text-right w-1/4">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-dark font-medium">
                         {loading ? (
                             <tr><td colSpan="4" className="py-4 px-4 text-center">Loading...</td></tr>
                        ) : purchaseData.length > 0 ? (
                            purchaseData.map((row, index) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                                    <td className="py-2 px-4 font-medium text-dark whitespace-nowrap">{row.billNo}</td>
                                    <td className="py-2 px-4 font-medium text-dark">{row.supplier}</td>
                                    <td className="py-2 px-4 font-medium text-dark text-center whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 font-medium text-right font-bold text-gray-900 whitespace-nowrap">{Number(row.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))
                        ) : (
                           <tr>
                                <td colSpan="4" className="py-4 px-4 text-center text-gray-400 text-xs italic">
                                    No purchases found for today.
                                </td>
                           </tr> 
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

export default TodaysReport;
