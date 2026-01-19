import React, { useEffect, useState } from "react";
import { useSettings } from "../../contexts/SettingsContext"; // Import hook
import { useTheme } from "../../context/ThemeContext";
import {
  getServiceInvoiceByIdApi,
  getCustomersApi
} from "../../services/allAPI";
import { useParams } from "react-router-dom";
const ServiceInvoicePreview = () => {
  const { id } = useParams();
  const { settings } = useSettings(); // Use hook
  const { theme } = useTheme();

  const [invoice, setInvoice] = useState(null);
  const [details, setDetails] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to safely extract a customer object from many response shapes
  const extractCustomerObject = (raw) => {
    if (!raw) return null;

    // If the raw is an axios response-like object, unwrap .data
    let payload = raw.data ?? raw;

    // If payload is an object with records array
    if (payload?.records && Array.isArray(payload.records) && payload.records.length) {
      return payload.records[0];
    }

    // If payload has data array
    if (payload?.data && Array.isArray(payload.data) && payload.data.length) {
      return payload.data[0];
    }

    // If payload.data is an object that looks like the customer
    if (payload?.data && typeof payload.data === "object" && (payload.data.Name || payload.data.name || payload.data.ContactName)) {
      return payload.data;
    }

    // If payload itself looks like a customer object
    if (typeof payload === "object" && (payload.Name || payload.name || payload.ContactName || payload.Address)) {
      return payload;
    }

    // If nested under 'customer' or 'Customer'
    if (payload?.customer && (payload.customer.Name || payload.customer.name || payload.customer.ContactName)) {
      return payload.customer;
    }
    if (payload?.Customer && (payload.Customer.Name || payload.Customer.name || payload.Customer.ContactName)) {
      return payload.Customer;
    }

    // If payload is an array, pick first
    if (Array.isArray(payload) && payload.length) {
      return payload[0];
    }

    // No match
    return null;
  };
useEffect(() => {
  const fetchInvoice = async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch invoice
      const res = await getServiceInvoiceByIdApi(id);
      if (res?.status !== 200) return;

      const inv = res.data.invoice;
      setInvoice(inv);
      setDetails(res.data.details || []);

      // 2️⃣ Fetch customers list (because single-customer API DOES NOT exist)
      if (inv?.CustomerId) {
        const customersRes = await getCustomersApi(1, 1000);

        if (customersRes?.status === 200) {
          const customer = customersRes.data?.records?.find(
            (c) => c.id === inv.CustomerId
          );

          if (customer) {
            setCustomer({
              name: customer.name || "",
              contactName: customer.contactName || "",
              email: customer.email || customer.emailAddress || "",
              phone: customer.phone || "",
              address: customer.address || ""
            });
          } else {
            setCustomer(null);
          }
        }
      }
    } catch (err) {
      console.error("Error loading service invoice", err);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  fetchInvoice();
}, [id]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Invoice not found
      </div>
    );
  }

  // Invoice Number (fallback logic)
  const invoiceNo =
    (invoice?.VNo && invoice.VNo.trim()) ? invoice.VNo : `INV-${String(invoice?.Id ?? "").padStart(4, "0")}`;

  return (
    <div className={`h-screen p-4 md:p-10 flex justify-center overflow-y-auto ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>
      <div className={`w-full max-w-[1280px] border rounded-lg shadow-2xl p-6 md:p-8 h-fit ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>

        {/* HEADER */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-8 gap-4 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
          <h1 className="text-3xl font-semibold">Service Invoice</h1>
          <p className={`text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-300'}`}>
            Date: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* FROM / TO / INFO */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'}`}>

          {/* FROM */}
          <div>
            <p className="text-gray-400 mb-1">From</p>
            <h3 className={`text-lg font-semibold ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-white'}`}>{settings?.companyName || "Home Button"}</h3>
            <p>Phone: {settings?.phone || ""}</p>
            <p>Email: {settings?.companyEmail || ""}</p>
          </div>

{/* TO */}
<div>
  <p className="text-gray-400 mb-2 font-semibold">To</p>

  {/* Customer Name */}
  <h3 className={`text-lg font-bold mb-3 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-white'}`}>
    {customer?.name || customer?.contactName || "Customer Name Not Available"}
  </h3>

  {/* Address */}
  <p className={`mt-2 mb-2 whitespace-pre-wrap ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-200'}`}>
    {customer?.address || "Address not available"}
  </p>

  {/* Email */}
  <p className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'} text-sm`}>
    Email:{" "}
    <span className={theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-white'}>
      {customer?.email || "-"}
    </span>
  </p>

  {/* Phone */}
  <p className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'} text-sm`}>
    Phone:{" "}
    <span className={theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-white'}>
      {customer?.phone || "-"}
    </span>
  </p>
</div>


          {/* INVOICE META */}
          <div className="text-left md:text-right">
            <p className={`text-lg font-semibold ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-white'}`}>
              Invoice #{invoiceNo}
            </p>
            <p>Order Date: {invoice?.Date ? new Date(invoice.Date).toLocaleDateString() : "-"}</p>
            <p>
              Due Date:{" "}
              {invoice?.DueDate ? new Date(invoice.DueDate).toLocaleDateString() : (invoice?.Date ? new Date(invoice.Date).toLocaleDateString() : "-")}
            </p>
          </div>
        </div>

        {/* SERVICES TABLE */}
        <div className="mb-10 overflow-x-auto">
          <table className="w-full text-sm text-left border-separate border-spacing-y-1 min-w-[600px]">
            <thead className={`border-b ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
              <tr className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-200'} font-semibold`}>
                <th>Service</th>
                <th className="text-right">Unit Price</th>
                <th className="text-center">Qty</th>
                <th className="text-center">Discount (%)</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No service items
                  </td>
                </tr>
              ) : details.map((item, idx) => (
                <tr key={idx} className={`${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 hover:bg-gray-100 text-gray-800' : 'bg-gray-900 hover:bg-gray-700 text-white'}`}>
                  <td className="px-2 py-3">{item.serviceName || item.ServiceName || item.Description}</td>
                  <td className="px-2 py-3 text-right">{(Number(item.UnitPrice) || 0).toFixed(2)}</td>
                  <td className="px-2 py-3 text-center">{item.Quantity ?? item.Qty ?? "-"}</td>
                  <td className="px-2 py-3 text-center">{(item.Discount ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-3 text-right">{(Number(item.Total) || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-start md:justify-end">
          <div className={`w-full md:w-[420px] space-y-3 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'}`}>
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
              <span>Subtotal:</span>
              <span>{(Number(invoice.GrandTotal) || 0).toFixed(2)}</span>
            </div>

            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
              <span>Total Discount:</span>
              <span>{(Number(invoice.TotalDiscount) || 0).toFixed(2)}</span>
            </div>

            {/* TAX DISPLAY */}
            {/* TAX DISPLAY */}
            {(() => {
                const igst = Number(invoice.IgstRate || invoice.IGSTRate || invoice.igstRate || 0);
                const cgst = Number(invoice.CgstRate || invoice.CGSTRate || invoice.cgstRate || 0);
                const sgst = Number(invoice.SgstRate || invoice.SGSTRate || invoice.sgstRate || 0);
                const tTax = Number(invoice.TotalTax || invoice.totalTax || 0);

                if (igst > 0) {
                    return (
                        <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                           <span>IGST ({igst}%):</span>
                           <span>{tTax.toFixed(2)}</span>
                        </div>
                    );
                } else if (cgst > 0 || sgst > 0) {
                    return (
                        <>
                        <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                           <span>CGST ({cgst}%):</span>
                           <span>{(tTax / 2).toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                           <span>SGST ({sgst}%):</span>
                           <span>{(tTax / 2).toFixed(2)}</span>
                        </div>
                        </>
                    );
                } else {
                    return (
                        <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                           <span>Tax:</span>
                           <span>{tTax.toFixed(2)}</span>
                        </div>
                    );
                }
            })()}

            <div className={`flex justify-between font-semibold text-lg pt-3 border-t ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 text-gray-800' : 'border-gray-600 text-white'}`}>
              <span>Grand Total:</span>
              <span>{(Number(invoice.NetTotal) || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span>Paid:</span>
              <span>{(Number(invoice.PaidAmount) || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Due:</span>
              <span>{(Number(invoice.Due) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceInvoicePreview;
