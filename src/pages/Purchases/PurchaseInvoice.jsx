import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { getPurchaseByIdApi, getSuppliersApi } from "../../services/allAPI";
// import logo from "../../assets/logo.png"; // Assuming a logo exists, or placeholder

const PurchaseInvoice = () => {
  const { id } = useParams();
  const { settings } = useSettings(); // Hook to access global settings
  const [purchase, setPurchase] = useState(null);
  const [details, setDetails] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await getPurchaseByIdApi(id);
        if (res.status === 200) {
          const purchaseData = res.data.purchase;
          setPurchase(purchaseData);
          setDetails(res.data.details);

          // Fetch supplier details
          if (purchaseData?.SupplierId) {
            const suppliersRes = await getSuppliersApi(1, 1000);
            if (suppliersRes?.status === 200) {
              const supplierRecord = suppliersRes.data?.records?.find(
                (s) => s.id === purchaseData.SupplierId
              );
              if (supplierRecord) {
                setSupplier({
                  companyName: supplierRecord.companyName || "",
                  contactName: supplierRecord.contactName || "",
                  email: supplierRecord.email || "",
                  phone: supplierRecord.phone || "",
                  address: supplierRecord.address || ""
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching invoice", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  if (!purchase) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Invoice not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-10 flex justify-center font-sans">
      <div className="w-full max-w-[1280px] bg-gray-800 rounded-lg shadow-2xl p-6 md:p-8 border border-gray-700">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-600 pb-4 mb-8 gap-4">
          <h1 className="text-4xl font-light text-white opacity-90">Bill</h1>
          <div className="text-left md:text-right">
            <p className="text-lg font-medium text-gray-300">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* ADDRESS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 text-gray-300">
          <div>
            <p className="text-sm text-gray-400 mb-1">From</p>
            <h3 className="text-xl font-bold text-white mb-1">{settings?.companyName || "Home Button"}</h3>
            <p>Phone: {settings?.phone || ""}</p>
            <p>Email: {settings?.companyEmail || ""}</p>
            <p>VAT: {settings?.vatNo || ""}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2 font-semibold">To</p>
            <h3 className="text-xl font-bold text-white mb-3">
              {supplier?.companyName || "Supplier Name Not Available"}
            </h3>
            <p className="mb-4 text-gray-200">
              {supplier?.address || "Address not available"}
            </p>
            
            <p className="text-sm text-gray-300 mb-1">
              Email:{" "}
              <span className="text-white">
                {supplier?.email || "-"}
              </span>
            </p>
            <p className="text-sm text-gray-300 mb-3">
              Phone:{" "}
              <span className="text-white">
                {supplier?.phone || "-"}
              </span>
            </p>

            <p className="text-sm text-gray-400 mb-1">Bill #{purchase.InvoiceNo || purchase.VNo || "N/A"}</p>
            <p>Order Date: {new Date(purchase.Date).toLocaleDateString()}</p>
            <p>Due Date : {new Date(purchase.Date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-600 text-gray-200 font-bold">
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-center">Quantity</th>
                <th className="py-2 text-center">Discount (%)</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {details.map((item, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <td className="py-3">{item.productName}</td>
                  <td className="py-3 text-right">{parseFloat(item.UnitPrice).toFixed(2)}</td>
                  <td className="py-3 text-center">{item.Quantity}</td>
                  <td className="py-3 text-center">{parseFloat(item.Discount).toFixed(2)}</td>
                  <td className="py-3 text-right">{parseFloat(item.Total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-start md:justify-end">
          <div className="w-full md:w-1/2 space-y-3 text-gray-300">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Subtotal:</span>
              <span>{parseFloat(purchase.GrandTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Fix Discount:</span>
              <span>{parseFloat(purchase.Discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Total Discount:</span>
              <span>{parseFloat(purchase.TotalDiscount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>VAT ({settings?.vatPercent || 10}%):</span>
              <span>{parseFloat(purchase.Vat).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-white text-lg pt-2 border-t border-gray-600">
              <span>Grand Total:</span>
              <span>{parseFloat(purchase.NetTotal).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoice;
