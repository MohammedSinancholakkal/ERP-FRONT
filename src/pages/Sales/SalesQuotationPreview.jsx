import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuotationByIdApi, getCustomersApi } from "../../services/allAPI";

const SalesQuotationPreview = () => {
  const { id } = useParams();

  const [quotation, setQuotation] = useState(null);
  const [details, setDetails] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true);
        const res = await getQuotationByIdApi(id);
        if (res?.status !== 200) return;

        // Try common shapes
        const q = res.data?.quotation || res.data?.data || res.data?.records?.[0] || res.data;
        setQuotation(q);
        setDetails(res.data?.details || res.data?.items || q?.details || []);

        if (q?.CustomerId) {
          const customersRes = await getCustomersApi(1, 1000);
          if (customersRes?.status === 200) {
            const cust = (customersRes.data.records || []).find((c) => c.id === q.CustomerId);
            if (cust) {
              setCustomer({
                name: cust.name || "",
                contactName: cust.contactName || "",
                email: cust.email || cust.emailAddress || "",
                phone: cust.phone || "",
                address: cust.address || ""
              });
            }
          }
        }
      } catch (err) {
        console.error("Error loading quotation", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  if (!quotation) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Quotation not found</div>;

  const qNo = (quotation?.VNo && String(quotation.VNo).trim()) ? quotation.VNo : `Q-${String(quotation?.Id ?? "").padStart(4, "0")}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10 flex justify-center">
      <div className="w-full max-w-[1100px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-8">
          <h1 className="text-3xl font-semibold">Sales Quotation</h1>
          <p className="text-sm text-gray-300">Date: {quotation?.Date ? new Date(quotation.Date).toLocaleDateString() : "-"}</p>
        </div>

        <div className="grid grid-cols-3 gap-10 mb-10 text-sm text-gray-300">
          <div>
            <p className="text-gray-400 mb-1">From</p>
            <h3 className="text-lg font-semibold text-white">Home Button</h3>
          </div>

          <div>
            <p className="text-gray-400 mb-2 font-semibold">To</p>
            <h3 className="text-lg font-bold text-white mb-3">{customer?.name || customer?.contactName || "Customer Name Not Available"}</h3>
            <p className="mt-2 text-gray-200 mb-2 whitespace-pre-wrap">{customer?.address || "Address not available"}</p>
            <p className="text-gray-300 text-sm">Email: <span className="text-white">{customer?.email || "-"}</span></p>
            <p className="text-gray-300 text-sm">Phone: <span className="text-white">{customer?.phone || "-"}</span></p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold text-white">Quotation #{qNo}</p>
            <p>Validity: {quotation?.ExpiryDate ? new Date(quotation.ExpiryDate).toLocaleDateString() : (quotation?.Date ? new Date(quotation.Date).toLocaleDateString() : "-")}</p>
          </div>
        </div>

        <div className="mb-10">
          <table className="w-full text-sm text-left border-separate border-spacing-y-1">
            <thead className="border-b border-gray-700">
              <tr className="text-gray-200 font-semibold">
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
                <tr key={idx} className="bg-gray-900 hover:bg-gray-700">
                  <td className="px-2 py-3">{it.itemName || it.ItemName || it.Description}</td>
                  <td className="px-2 py-3 text-right">{(Number(it.UnitPrice) || 0).toFixed(2)}</td>
                  <td className="px-2 py-3 text-center">{it.Quantity ?? it.Qty ?? "-"}</td>
                  <td className="px-2 py-3 text-center">{(it.Discount ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-3 text-right">{(Number(it.Total) || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-[420px] space-y-3 text-sm text-gray-300">
            <div className="flex justify-between border-b border-gray-700 pb-2"><span>Subtotal:</span><span>{(Number(quotation.GrandTotal) || 0).toFixed(2)}</span></div>
            <div className="flex justify-between border-b border-gray-700 pb-2"><span>Total Discount:</span><span>{(Number(quotation.TotalDiscount) || 0).toFixed(2)}</span></div>
            <div className="flex justify-between border-b border-gray-700 pb-2"><span>VAT:</span><span>{(Number(quotation.Vat) || 0).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-600 text-white"><span>Grand Total:</span><span>{(Number(quotation.NetTotal) || 0).toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesQuotationPreview;
