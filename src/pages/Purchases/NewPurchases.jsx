// src/pages/purchases/NewPurchase.jsx
import React, { useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";

import PageLayout from "../../layout/PageLayout";

const NewPurchase = () => {
  const [supplier, setSupplier] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState("");
  const [details, setDetails] = useState("");

  const [rows, setRows] = useState([]);

  const addRow = () => {
    setRows([
      ...rows,
      {
        productName: "",
        description: "",
        unitName: "",
        quantity: 0,
        unitPrice: 0,
        discount: 0,
      },
    ]);
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-[calc(100vh-90px)] overflow-auto">

        <h2 className="text-2xl font-semibold mb-6">New Purchase</h2>

        {/* TOP FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900 p-6 rounded-lg border border-gray-700">

          {/* Supplier */}
          <div>
            <label className="text-sm mb-1 block">
              Supplier <span className="text-red-400">*</span>
            </label>
            <select
              className="bg-gray-900 border border-gray-700 px-3 py-2 rounded w-full outline-none"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              <option value="">--select--</option>
            </select>
          </div>

          {/* Payment Account */}
          <div>
            <label className="text-sm mb-1 block">
              Payment Account <span className="text-red-400">*</span>
            </label>
            <select
              className="bg-gray-900 border border-gray-700 px-3 py-2 rounded w-full outline-none"
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
            >
              <option value="">--select--</option>
            </select>
          </div>

          {/* Invoice No */}
          <div>
            <label className="text-sm mb-1 block">Invoice No</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="bg-gray-900 border border-gray-700 px-3 py-2 rounded w-full outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm mb-1 block">
              Date <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3">
              <input
                type="date"
                onChange={(e) => setDate(e.target.value)}
                value={date}
                className="bg-transparent flex-1 py-2 outline-none"
              />
              <Calendar size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* LINE ITEMS TITLE */}
        <div className="flex justify-between items-center mt-8 mb-3">
          <h3 className="text-lg font-semibold">Line Items</h3>
          <button
            onClick={addRow}
            className="flex gap-2 items-center bg-gray-700 border border-gray-600 px-3 py-1.5 rounded hover:bg-gray-600"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="overflow-auto border border-gray-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-2">Product Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Unit Price</th>
                <th className="p-2">Discount %</th>
                <th className="p-2">Total</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => {
                const total =
                  row.quantity * row.unitPrice -
                  (row.quantity * row.unitPrice * row.discount) / 100;

                return (
                  <tr key={i} className="bg-gray-900 border-t border-gray-800">
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded"
                        value={row.productName}
                        onChange={(e) =>
                          updateRow(i, "productName", e.target.value)
                        }
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded"
                        value={row.description}
                        onChange={(e) =>
                          updateRow(i, "description", e.target.value)
                        }
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded"
                        value={row.unitName}
                        onChange={(e) =>
                          updateRow(i, "unitName", e.target.value)
                        }
                      />
                    </td>

                    <td className="p-2 w-20">
                      <input
                        type="number"
                        className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded"
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(i, "quantity", Number(e.target.value))
                        }
                      />
                    </td>

                    <td className="p-2 w-24">
                      <input
                        type="number"
                        className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded"
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateRow(i, "unitPrice", Number(e.target.value))
                        }
                      />
                    </td>

                    <td className="p-2 w-24">
                      <input
                        type="number"
                        className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded"
                        value={row.discount}
                        onChange={(e) =>
                          updateRow(i, "discount", Number(e.target.value))
                        }
                      />
                    </td>

                    <td className="p-2 text-center">
                      {total.toFixed(2)}
                    </td>

                    <td className="p-2">
                      <button
                        onClick={() => deleteRow(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* DETAILS BOX */}
        <div className="mt-6">
          <label className="text-sm mb-1 block">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full h-28 bg-gray-900 border border-gray-700 px-3 py-2 rounded outline-none"
          ></textarea>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end mt-6">
          <button className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-5 py-2 rounded text-blue-300 hover:bg-gray-700">
            <Save size={18} /> Save Purchase
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default NewPurchase;
