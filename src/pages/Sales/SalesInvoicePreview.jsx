import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext"; // Import hook
import { getSaleByIdApi, getCustomersApi, getTaxTypesApi } from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";

const SalesInvoicePreview = () => {
  const { id } = useParams();
  const { settings } = useSettings(); // Global settings
  const { theme } = useTheme();

  const [sale, setSale] = useState(null);
  const [details, setDetails] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [taxTypeName, setTaxTypeName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const res = await getSaleByIdApi(id);
        if (res?.status !== 200) return;

        const s = res.data.sale;
        setSale(s);
        setDetails(res.data.details || []);

        if (s?.CustomerId) {
          const customersRes = await getCustomersApi(1, 1000);
          if (customersRes?.status === 200) {
            const cust = (customersRes.data.records || []).find((c) => c.id === s.CustomerId);
            if (cust) {
              setCustomer({
                name: cust.name || cust.companyName || "",
                contactName: cust.contactName || "",
                email: cust.email || cust.emailAddress || "",
                phone: cust.phone || "",
                address: cust.address || ""
              });
            }
          }
        }

        if (s?.TaxTypeId) {
            const taxRes = await getTaxTypesApi(1, 1000);
            if(taxRes.status === 200) {
                const found = taxRes.data.records.find(t => String(t.typeId) === String(s.TaxTypeId) || String(t.id) === String(s.TaxTypeId));
                if(found) setTaxTypeName(found.typeName || found.name || "");
            }
        }
      } catch (err) {
        console.error("Error loading sale", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>Loading...</div>;
  if (!sale) return <div className={`min-h-screen flex items-center justify-center ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>Sale not found</div>;

  const invoiceNo = (sale?.VNo && String(sale.VNo).trim()) ? sale.VNo : `INV-${String(sale?.Id ?? "").padStart(4, "0")}`;

  return (
    <div className={`min-h-screen p-4 md:p-10 flex justify-center font-sans ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>
      <div className={`w-full max-w-[1280px] border rounded-lg shadow-2xl p-6 md:p-8 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
        
        {/* HEADER */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-8 gap-4 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
          <h1 className="text-3xl font-semibold">Sales Invoice</h1>
          <div className="text-left md:text-right">
             <p className={`text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-300'}`}>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* FROM / TO / INFO */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'}`}>
          {/* FROM */}
          <div>
            <p className={`mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`}>From</p>
            <h3 className={`text-lg font-semibold ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>{settings?.companyName || "Home Button"}</h3>
            <p>Phone: {settings?.phone || ""}</p>
            <p>Email: {settings?.companyEmail || ""}</p>
            <p>GSTIN: {settings?.vatNo || ""}</p>
          </div>

          {/* TO */}
          <div>
            <p className={`mb-2 font-semibold ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`}>To</p>
            <h3 className={`text-lg font-bold mb-3 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>{customer?.name || "Customer Name Not Available"}</h3>
            <p className={`mt-2 mb-2 whitespace-pre-wrap ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-gray-200'}`}>{customer?.address || "Address not available"}</p>
            <p className="text-sm">Email: <span className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>{customer?.email || "-"}</span></p>
            <p className="text-sm">Phone: <span className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>{customer?.phone || "-"}</span></p>
          </div>

          {/* META */}
          <div className="text-left md:text-right">
            <p className={`text-lg font-semibold ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>Invoice #{invoiceNo}</p>
            <p>Order Date: {sale?.Date ? new Date(sale.Date).toLocaleDateString() : "-"}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="mb-10 overflow-x-auto">
          <table className="w-full text-sm text-left border-separate border-spacing-y-1 min-w-[600px]">
            <thead className={`border-b ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 text-gray-700' : 'border-gray-700 text-gray-200'}`}>
              <tr className="font-semibold">
                <th>Item</th>
                <th className="text-right">Unit Price</th>
                <th className="text-center">Qty</th>
                <th className="text-center">Discount (%)</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(!details || details.length === 0) ? (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No items</td></tr>
              ) : details.map((it, idx) => (
                <tr key={idx} className={`${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 hover:bg-gray-100 text-gray-800' : 'bg-gray-900 hover:bg-gray-700 text-white'}`}>
                  <td className="px-2 py-3">{it.productName || it.ProductName || it.description || it.Description}</td>
                  <td className="px-2 py-3 text-right">{(Number(it.UnitPrice) || 0).toFixed(2)}</td>
                  <td className="px-2 py-3 text-center">{it.Quantity ?? it.Qty ?? "-"}</td>
                  <td className="px-2 py-3 text-center">{(it.Discount ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-3 text-right">{(Number(it.Total) || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-start md:justify-end">
          <div className={`w-full md:w-[420px] space-y-3 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}><span>Subtotal:</span><span>{(Number(sale.GrandTotal) || 0).toFixed(2)}</span></div>
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}><span>Total Discount:</span><span>{(Number(sale.TotalDiscount) || 0).toFixed(2)}</span></div>
            
            {taxTypeName && (
                 <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                   <span className="text-gray-400">Tax Type:</span>
                   <span>{taxTypeName}</span>
                 </div>
            )}

            {/* GST / TAX SECTION */}
            {(Number(sale.IGSTRate) > 0) ? (
               <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                 <span>IGST ({sale.IGSTRate}%):</span>
                 <span>{(Number(sale.Vat) || 0).toFixed(2)}</span>
               </div>
            ) : (Number(sale.CGSTRate) > 0 || Number(sale.SGSTRate) > 0) ? (
               <>
                 <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                   <span>CGST ({sale.CGSTRate}%):</span>
                   <span>{((Number(sale.Vat) || 0) / 2).toFixed(2)}</span>
                 </div>
                 <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                   <span>SGST ({sale.SGSTRate}%):</span>
                   <span>{((Number(sale.Vat) || 0) / 2).toFixed(2)}</span>
                 </div>
               </>
            ) : (
               <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                 <span>Tax:</span>
                 <span>{(Number(sale.Vat) || 0).toFixed(2)}</span>
               </div>
            )}
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}><span>Shipping:</span><span>{(Number(sale.ShippingCost) || 0).toFixed(2)}</span></div>
            <div className={`flex justify-between font-semibold text-lg pt-3 border-t ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 text-gray-900' : 'border-gray-600 text-white'}`}><span>Grand Total:</span><span>{(Number(sale.NetTotal) || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400 pt-1"><span>Paid:</span><span>{(Number(sale.PaidAmount) || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-red-400"><span>Due:</span><span>{(Number(sale.Due) || 0).toFixed(2)}</span></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesInvoicePreview;
