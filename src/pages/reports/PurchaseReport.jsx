import React, { useState } from "react";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";

const PurchaseReport = () => {
  const { theme } = useTheme();

  // Date formatting
  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).replace(/ /g, '-');

  /* Dummy Data matches image structure */
  const purchaseData = [];

  return (
    <PageLayout>
      <div className={`p-6 h-full flex flex-col gap-6 overflow-y-auto ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        
        {/* TOP FILTER BAR */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
            <div className="relative">
                <input type="date" placeholder="mm/dd/yyyy" className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-500 w-48" />
            </div>
            <div className="relative">
                <input type="date" placeholder="mm/dd/yyyy" className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-500 w-48" />
            </div>
            
            <button className="bg-[#4a90e2] hover:bg-[#357abd] text-white px-6 py-2 rounded text-sm font-medium transition-colors">
                Search
            </button>
            <button className="bg-[#f5a623] hover:bg-[#d48806] text-white px-6 py-2 rounded text-sm font-medium transition-colors">
                Print
            </button>
        </div>

        {/* REPORT CONTENT */}
        <ContentCard>
          <div className="flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-end">
                    <h2 className="text-xl font-bold text-[#2d3748]">Purchase Report</h2>
                    <div className="text-sm text-gray-600 font-medium">
                        Date: {todayDate}
                    </div>
                </div>
                <hr className="border-gray-200" />
            </div>
            
            {/* Custom Table */}
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-gray-800 border-b border-gray-200">
                            <th className="py-3 pr-4 w-28">Order #</th>
                            <th className="py-3 px-4 w-48">Supplier</th>
                            <th className="py-3 px-4 w-32">Date</th>
                            <th className="py-3 px-4 w-24 text-right">Payment</th>
                            <th className="py-3 px-4">Purchase Detail</th>
                            <th className="py-3 px-4 w-32">Method</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-600">
                        {purchaseData.map((row, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                                <td className="py-4 pr-4 font-medium text-gray-800">{row.id}</td>
                                <td className="py-4 px-4">{row.supplier}</td>
                                <td className="py-4 px-4">{row.date}</td>
                                <td className="py-4 px-4 text-right">{row.payment}</td>
                                <td className="py-4 px-4">
                                    {/* Nested Table for Items */}
                                    <div className="bg-white"> 
                                        {/* Sub Table Header */}
                                        <div className="grid grid-cols-5 gap-4 mb-2 text-xs font-bold text-gray-900 border-gray-100">
                                            <div className="col-span-2">Product</div>
                                            <div className="text-right">Unit Price</div>
                                            <div className="text-center">Quantity</div>
                                            <div className="text-center">Discount (%)</div>
                                            <div className="text-right">Line Total</div>
                                        </div>
                                        
                                        {/* Items */}
                                        {row.items.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-5 gap-4 py-1 text-xs text-gray-700 border-t border-gray-100 pt-2">
                                                 <div className="col-span-2 font-medium">{item.product}</div>
                                                 <div className="text-right">{item.unitPrice}</div>
                                                 <div className="text-center">{item.quantity}</div>
                                                 <div className="text-center">{item.discount}</div>
                                                 <div className="text-right font-medium">{item.total}</div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-xs">{row.method}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

          </div>
        </ContentCard>

      </div>
    </PageLayout>
  );
};

export default PurchaseReport;
