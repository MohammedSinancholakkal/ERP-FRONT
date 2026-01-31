import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import { useTheme } from "../../context/ThemeContext";

const ProductWiseSalesReport = () => {
  const { theme } = useTheme();

  // Date formatting
  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).replace(/ /g, '-');

  /* Dummy Data matching image structure */
  const salesData = [];

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
                    <h2 className="text-xl font-bold text-[#2d3748]">Product Wise Sale Report</h2>
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
                            <th className="py-3 px-4 w-32">Sales Date</th>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-4 w-32">Invoice No</th>
                            <th className="py-3 px-4 w-48">Customer Name</th>
                            <th className="py-3 px-4 text-right w-24">Rate</th>
                            <th className="py-3 px-4 text-center w-24">Quantity</th>
                            <th className="py-3 px-4 text-center w-28">Discount (%)</th>
                            <th className="py-3 px-4 text-right w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-600">
                        {salesData.map((row, index) => (
                            <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-4 px-4 font-medium">{row.date}</td>
                                <td className="py-4 px-4">{row.product}</td>
                                <td className="py-4 px-4">{row.invoiceNo}</td>
                                <td className="py-4 px-4">{row.customer}</td>
                                <td className="py-4 px-4 text-right">{row.rate}</td>
                                <td className="py-4 px-4 text-center">{row.quantity}</td>
                                <td className="py-4 px-4 text-center">{row.discount}</td>
                                <td className="py-4 px-4 text-right">{row.total}</td>
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

export default ProductWiseSalesReport;
