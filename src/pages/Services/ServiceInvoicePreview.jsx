import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getServiceInvoiceByIdApi,
  getCustomersApi
} from "../../services/allAPI";

const ServiceInvoicePreview = () => {
  const { id } = useParams();

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
    <div className="min-h-screen bg-gray-900 text-white p-10 flex justify-center">
      <div className="w-full max-w-[1280px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-8">
          <h1 className="text-3xl font-semibold">Service Invoice</h1>
          <p className="text-sm text-gray-300">
            Date: {invoice?.Date ? new Date(invoice.Date).toLocaleDateString() : "-"}
          </p>
        </div>

        {/* FROM / TO / INFO */}
        <div className="grid grid-cols-3 gap-10 mb-10 text-sm text-gray-300">

          {/* FROM */}
          <div>
            <p className="text-gray-400 mb-1">From</p>
            <h3 className="text-lg font-semibold text-white">Home Button</h3>
            <p>Phone:</p>
            <p>Email:</p>
          </div>

{/* TO */}
<div>
  <p className="text-gray-400 mb-2 font-semibold">To</p>

  {/* Customer Name */}
  <h3 className="text-lg font-bold text-white mb-3">
    {customer?.name || customer?.contactName || "Customer Name Not Available"}
  </h3>

  {/* Address */}
  <p className="mt-2 text-gray-200 mb-2 whitespace-pre-wrap">
    {customer?.address || "Address not available"}
  </p>

  {/* Email */}
  <p className="text-gray-300 text-sm">
    Email:{" "}
    <span className="text-white">
      {customer?.email || "-"}
    </span>
  </p>

  {/* Phone */}
  <p className="text-gray-300 text-sm">
    Phone:{" "}
    <span className="text-white">
      {customer?.phone || "-"}
    </span>
  </p>
</div>


          {/* INVOICE META */}
          <div className="text-right">
            <p className="text-lg font-semibold text-white">
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
        <div className="mb-10">
          <table className="w-full text-sm text-left border-separate border-spacing-y-1">
            <thead className="border-b border-gray-700">
              <tr className="text-gray-200 font-semibold">
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
                <tr key={idx} className="bg-gray-900 hover:bg-gray-700">
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
        <div className="flex justify-end">
          <div className="w-full max-w-[420px] space-y-3 text-sm text-gray-300">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Subtotal:</span>
              <span>{(Number(invoice.GrandTotal) || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Total Discount:</span>
              <span>{(Number(invoice.TotalDiscount) || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>VAT:</span>
              <span>{(Number(invoice.Vat) || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-600 text-white">
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
