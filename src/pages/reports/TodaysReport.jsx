import React, { useState } from "react";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";

const TodaysReport = () => {
  const { theme } = useTheme();

  // Date formatting
  const todayDate = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric"
  });

  /* Dummy Data */
  const salesData = [];
  const purchaseData = [];

  return (
    <PageLayout>
      <div className={`p-6 h-full flex flex-col gap-6 overflow-y-auto ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        
        {/* Sales Report Card */}
        <ContentCard>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold text-[#2d3748]">Today's Sales Report</h2>
                <div className="text-sm text-gray-600 font-medium">
                    Date: {todayDate}
                </div>
            </div>
            <hr className="border-gray-100" />
            
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-gray-800 border-b border-gray-100">
                            <th className="py-3 px-4 w-32">Invoice #</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4 text-center w-32">Sale Date</th>
                            <th className="py-3 px-4 text-right w-32">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-600">
                        {salesData.length > 0 ? (
                            salesData.map((row, index) => (
                                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-4 px-4 font-medium">{row.id}</td>
                                    <td className="py-4 px-4">{row.customer}</td>
                                    <td className="py-4 px-4 text-center">{row.date}</td>
                                    <td className="py-4 px-4 text-right">{row.total}</td>
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
                <h2 className="text-xl font-bold text-[#2d3748]">Today's Purchase Report</h2>
                <div className="text-sm text-gray-600 font-medium">
                    Date: {todayDate}
                </div>
            </div>
            <hr className="border-gray-100" />

            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-gray-800 border-b border-gray-100">
                            <th className="py-3 px-4 w-32">BILL #</th>
                            <th className="py-3 px-4">Supplier</th>
                            <th className="py-3 px-4 text-center w-32">Purchase Date</th>
                            <th className="py-3 px-4 text-right w-32">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-600">
                         {purchaseData.length > 0 ? (
                            purchaseData.map((row, index) => (
                                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-4 px-4 font-medium">{row.id}</td>
                                    <td className="py-4 px-4">{row.supplier}</td>
                                    <td className="py-4 px-4 text-center">{row.date}</td>
                                    <td className="py-4 px-4 text-right">{row.total}</td>
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
