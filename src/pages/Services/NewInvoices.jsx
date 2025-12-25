// src/pages/sales/NewInvoices.jsx
import React, { useEffect, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Star,
  X,
  Edit
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import { useLocation } from "react-router-dom";

// APIs (service-invoice & supporting)
import {
  getCustomersApi,
  addCustomerApi,
  getEmployeesApi,
  getServicesApi,
  getServiceInvoiceByIdApi,
  addServiceInvoiceApi,
  updateServiceInvoiceApi,
  deleteServiceInvoiceApi
} from "../../services/allAPI";

const NewInvoices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  // --- TOP SECTION STATE ---
  const [customer, setCustomer] = useState("");
  const [employee, setEmployee] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // --- DROPDOWN DATA ---
  const [customersList, setCustomersList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  const paymentOptions = ["Cash at Hand", "Cash at Bank"];

  // --- LINE ITEMS STATE ---
  const [rows, setRows] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // --- MODAL ITEM STATE (service-based) ---
const [newItem, setNewItem] = useState({
  serviceId: "",
  serviceName: "",
  description: "",
  quantity: 0,
  unitPrice: 0,
  discount: "0",   
  total: 0
});



  // --- QUICK CREATE CUSTOMER MODAL STATE ---
  // --- QUICK CREATE CUSTOMER MODAL STATE ---
  // const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false); // Removed in favor of navigation
  // const [newCustomerName, setNewCustomerName] = useState("");

  // --- BOTTOM SECTION STATE ---
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [details, setDetails] = useState("");

  // --- CALCULATED VALUES ---
  const [netTotal, setNetTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);

  /* ================= INITIAL DATA LOADING ================= */
  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchServices();
  }, []);

  // --- HANDLE RETURN FROM NEW CUSTOMER ---
  useEffect(() => {
    if (location.state?.newCustomerId) {
      const newId = location.state.newCustomerId;
      getCustomersApi(1, 1000).then(res => {
         if(res.status === 200) {
             const list = (res.data.records || []).map(r => ({
                id: r.id ?? r.Id ?? r.customerId ?? r.CustomerId ?? null,
                companyName: r.companyName ?? r.CompanyName ?? r.name ?? r.Name ?? "",
             }));
             setCustomersList(list);
             if(list.find(c => String(c.id) === String(newId))) {
                 setCustomer(newId);
             }
         }
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomersApi(1, 1000);
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records)
          ? res.data.records
          : Array.isArray(res?.data)
          ? res.data
          : [];
        const normalized = records.map((r) => ({
          id: r.id ?? r.Id ?? r.customerId ?? r.CustomerId ?? null,
          companyName: r.companyName ?? r.CompanyName ?? r.name ?? r.Name ?? "",
        }));
        setCustomersList(normalized);
      }
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await getEmployeesApi(1, 1000);
      console.log("EMPLOYEES RAW:", res.data);

      // handle both shapes: res.data.records or res.data (array)
      const records = Array.isArray(res?.data?.records)
        ? res.data.records
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const normalized = records.map(e => ({
        id: e.id ?? e.Id ?? e.employeeId ?? e.EmployeeId ?? null,
        name:
          e.name ??
          e.employeeName ??
          e.FullName ??
          `${e.firstName ?? e.FirstName ?? ""} ${e.lastName ?? e.LastName ?? ""}`.trim()
      }));

      setEmployeesList(normalized);
    } catch (error) {
      console.error("Error fetching employees", error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await getServicesApi(1, 1000);
      console.log("SERVICES RAW:", res.data);

      const records = Array.isArray(res?.data?.records)
        ? res.data.records
        : Array.isArray(res?.data)
        ? res.data
        : [];

      // Important: include actual DB column names (ServiceName, Charge, Description)
      const normalized = records.map(s => ({
        id: s.id ?? s.Id ?? s.serviceId ?? s.ServiceId ?? null,
        name: s.name ?? s.ServiceName ?? s.serviceName ?? "",
        charge:
          parseFloat(
            s.Charge ??
            s.charge ??
            s.ServiceCharge ??
            s.UnitPrice ??
            s.price ??
            0
          ) || 0,
        defaultQty: parseFloat(s.quantity ?? s.DefaultQuantity ?? s.DefaultQty ?? 1) || 1,
        description: s.description ?? s.Description ?? ""
      }));

      setServicesList(normalized);
    } catch (error) {
      console.error("Error fetching services", error);
    }
  };

  /* ================= FETCH INVOICE FOR EDIT ================= */
  useEffect(() => {
    if (id) {
      fetchInvoiceDetails(id);
    }
  }, [id]);

  const fetchInvoiceDetails = async (invoiceId) => {
    try {
      const res = await getServiceInvoiceByIdApi(invoiceId);
      if (res.status === 200) {
        const { invoice, details } = res.data;

        setCustomer(invoice.CustomerId);
        setEmployee(invoice.EmployeeId);
        setPaymentAccount(invoice.PaymentAccount || invoice.paymentAccount || "");
        if (invoice.Date) setDate(invoice.Date.split("T")[0]);

        setGlobalDiscount(invoice.Discount || 0);
        setShippingCost(invoice.ShippingCost || 0);
        setPaidAmount(invoice.PaidAmount || 0);
        setDetails(invoice.Details || "");

        const mappedRows = (details || []).map(d => ({
          serviceId: d.serviceId,
          serviceName: d.serviceName,
          description: d.Description,
          quantity: d.Quantity,
          unitPrice: d.UnitPrice,
          discount: d.Discount,
          total: d.Total
        }));
        setRows(mappedRows);
      }
    } catch (error) {
      console.error("Error fetching invoice details", error);
      toast.error("Failed to load invoice details");
    }
  };

  /* ================= LINE ITEM LOGIC ================= */
  const handleServiceSelect = (serviceId) => {
    const service = servicesList.find(
      s => String(s.id) === String(serviceId)
    );

    if (!service) {
      // clear if none
        setNewItem({
        serviceId: service.id,
        serviceName: service.name,
        description: "",
        quantity: qty,
        unitPrice: price,
        discount: "0", 
        total: +(qty * price).toFixed(2)
        });

      return;
    }

    const qty = Number.isFinite(service.defaultQty) ? service.defaultQty : 1;
    const price = Number.isFinite(service.charge) ? service.charge : 0;

    setNewItem({
      serviceId: service.id,
      serviceName: service.name,
      description: "",
      quantity: qty,
      unitPrice: price,
      discount: 0,
      total: +(qty * price).toFixed(2)
    });
  };

  const calculateItemTotal = (qty, price, disc) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    const d = parseFloat(disc) || 0;
    const line = q * p;
    const total = line - ((line * d) / 100);
    return +total.toFixed(2);
  };

  const addItemToTable = () => {
    if (!newItem.serviceId) {
      toast.error("Please select a service");
      return;
    }
    if (newItem.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const itemToInsert = {
      ...newItem,
      // ensure types
      quantity: parseFloat(newItem.quantity) || 0,
      unitPrice: parseFloat(newItem.unitPrice) || 0,
      discount: parseFloat(newItem.discount) || 0,
      total: calculateItemTotal(newItem.quantity, newItem.unitPrice, newItem.discount)
    };

    if (editingIndex !== null) {
      const updatedRows = [...rows];
      updatedRows[editingIndex] = itemToInsert;
      setRows(updatedRows);
      setEditingIndex(null);
    } else {
      setRows([...rows, itemToInsert]);
    }
    setIsItemModalOpen(false);
  };

  const editRow = (index) => {
    setEditingIndex(index);
    setNewItem(rows[index]);
    setIsItemModalOpen(true);
  };

  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  /* ================= QUICK CREATE CUSTOMER ================= */
  /* ================= QUICK CREATE CUSTOMER REMOVED (Replaced by Navigation) ================= */
 /* const handleCreateCustomer = async () => { ... } */

  /* ================= TOTAL CALC (no tax on UI) ================= */
  useEffect(() => {
    let sumLineTotals = 0;
    let sumLineDiscounts = 0;

    rows.forEach((row) => {
      const qty = parseFloat(row.quantity) || 0;
      const price = parseFloat(row.unitPrice) || 0;
      const discPercent = parseFloat(row.discount) || 0;

      const lineBase = qty * price;
      const lineDisc = (lineBase * discPercent) / 100;
      const lineTotal = lineBase - lineDisc;

      sumLineTotals += lineTotal;
      sumLineDiscounts += lineDisc;
    });

    const subTotal = sumLineTotals;
    const gDiscount = parseFloat(globalDiscount) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    const paid = parseFloat(paidAmount) || 0;

    // tax removed from UI — set tax = 0, vatPercentage 0
    const tax = 0;

    const finalTotal = subTotal - gDiscount + tax + shipping;

    setNetTotal(+finalTotal.toFixed(2));
    setGrandTotal(+subTotal.toFixed(2));
    setTotalDiscount(+((sumLineDiscounts + gDiscount).toFixed(2)));

    // Update Due and Change
    if (paid >= finalTotal) {
      setChangeAmount(+((paid - finalTotal).toFixed(2)));
      setDueAmount(0);
    } else {
      setChangeAmount(0);
      setDueAmount(+((finalTotal - paid).toFixed(2)));
    }

  }, [rows, globalDiscount, shippingCost, paidAmount]);

  /* ================= SAVE / UPDATE / DELETE ================= */
  const handleSaveInvoice = async () => {
    const currentUserId = userData?.userId || userData?.id || userData?.Id;
    if (!currentUserId) {
      console.error("User ID missing from session data:", userData);
      return toast.error("User session invalid. Please re-login.");
    }

    if (!customer) return toast.error("Please select a customer");
    if (!employee) return toast.error("Please select an employee");
    if (!paymentAccount) return toast.error("Please select a payment account");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      customerId: customer,
      date,
      userId: currentUserId,
      employeeId: employee,
      paymentAccount: paymentAccount || "",
      discount: parseFloat(globalDiscount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      vat: 0, // tax removed from UI but backend expects field
      totalTax: 0,
      vatPercentage: 0,
      noTax: 1,
      vatType: "None",
      shippingCost: parseFloat(shippingCost) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      netTotal: parseFloat(netTotal) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      due: parseFloat(dueAmount) || 0,
      change: parseFloat(changeAmount) || 0,
      // paymentAccount set above
      details,
      vno: "",
      items: rows.map(r => ({
        serviceId: r.serviceId,
        serviceName: r.serviceName,
        description: r.description,
        quantity: parseFloat(r.quantity) || 0,
        unitPrice: parseFloat(r.unitPrice) || 0,
        discount: parseFloat(r.discount) || 0,
        total: parseFloat(r.total) || 0
      })),
      insertUserId: currentUserId
    };

    try {
      const res = await addServiceInvoiceApi(payload);
      if (res.status === 200) {
        toast.success("Service invoice added successfully");
        navigate("/app/services/invoices");
      } else {
        toast.error("Failed to add service invoice");
      }
    } catch (error) {
      console.error("SAVE INVOICE ERROR", error);
      toast.error("Error saving invoice");
    }
  };

  const handleUpdateInvoice = async () => {
    if (!customer) return toast.error("Please select a customer");
    if (!employee) return toast.error("Please select an employee");
    if (!paymentAccount) return toast.error("Please select a payment account");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      customerId: customer,
      date,
      userId: userId,
      employeeId: employee,
      paymentAccount: paymentAccount || "",
      discount: parseFloat(globalDiscount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      vat: 0,
      totalTax: 0,
      vatPercentage: 0,
      noTax: 1,
      vatType: "None",
      shippingCost: parseFloat(shippingCost) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      netTotal: parseFloat(netTotal) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      due: parseFloat(dueAmount) || 0,
      change: parseFloat(changeAmount) || 0,
      details,
      vno: "",
      items: rows.map(r => ({
        serviceId: r.serviceId,
        serviceName: r.serviceName,
        description: r.description,
        quantity: parseFloat(r.quantity) || 0,
        unitPrice: parseFloat(r.unitPrice) || 0,
        discount: parseFloat(r.discount) || 0,
        total: parseFloat(r.total) || 0
      })),
      updateUserId: userId
    };

    try {
      const res = await updateServiceInvoiceApi(id, payload);
      if (res.status === 200) {
        toast.success("Service invoice updated successfully");
        navigate("/app/services/invoices");
      } else {
        toast.error("Failed to update service invoice");
      }
    } catch (error) {
      console.error("UPDATE INVOICE ERROR", error);
      toast.error("Error updating invoice");
    }
  };

  const handleDeleteInvoice = async () => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await deleteServiceInvoiceApi(id, { userId });
      if (res.status === 200) {
        toast.success("Service invoice deleted successfully");
        navigate("/app/services/invoices");
      } else {
        toast.error("Failed to delete service invoice");
      }
    } catch (error) {
      console.error("DELETE INVOICE ERROR", error);
      toast.error("Error deleting invoice");
    }
  };

  const openItemModal = () => {
    setEditingIndex(null);
    setNewItem({
      serviceId: "",
      serviceName: "",
      description: "",
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      total: 0
    });
    setIsItemModalOpen(true);
  };

  /* ================= UI ================= */
  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-[calc(100vh-80px)] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-white-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl text-white font-medium">{id ? "Edit Service Invoice" : "New Service Invoice"}</h2>
        </div>

        {/* ACTIONS BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              <button onClick={handleUpdateInvoice} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-blue-300 hover:bg-gray-600">
                <Save size={18} /> Update
              </button>
              <button onClick={handleDeleteInvoice} className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500">
                <Trash2 size={18} /> Delete
              </button>
            </>
          ) : (
            <button onClick={handleSaveInvoice} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-white hover:bg-gray-600">
              <Save size={18} /> Save
            </button>
          )}
        </div>

        {/* TOP SECTION */}
<div className="grid grid-cols-1 gap-6 mb-8">

  {/* ROW 1: Customer | Payment | Date */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

    {/* Customer */}
    <div className="lg:col-span-6">
      <div className="flex items-center gap-3">
        <label className="w-32 text-sm text-gray-300">
          <span className="text-red-400">*</span> Customer
        </label>

        <div className="flex-1 flex items-center gap-2">
          <SearchableSelect
            options={customersList.map(c => ({ id: c.id, name: c.companyName }))}
            value={customer}
            onChange={setCustomer}
            placeholder="Select customer..."
            className="w-full"
          />

          <Star
            size={20}
            className="text-white cursor-pointer hover:text-yellow-400"
            onClick={() => navigate("/app/businesspartners/newcustomer", { state: { returnTo: location.pathname } })}
          />
        </div>
      </div>
    </div>

    {/* Payment */}
    <div className="lg:col-span-3">
      <div className="flex items-center gap-3">
        <label className="w-24 text-sm text-gray-300">
          <span className="text-red-400">*</span> Payment
        </label>

        <select
          value={paymentAccount}
          onChange={(e) => setPaymentAccount(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none"
        >
          <option value="">-- select --</option>
          {paymentOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Date */}
    <div className="lg:col-span-3">
      <div className="flex items-center gap-3">
        <label className="w-16 text-sm text-gray-300">
          <span className="text-red-400">*</span> Date
        </label>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none"
        />
      </div>
    </div>
  </div>

  {/* ROW 2: Employee */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

    <div className="lg:col-span-6">
      <div className="flex items-center gap-3">
        <label className="w-32 text-sm text-gray-300">
          <span className="text-red-400">*</span> Employee
        </label>

        <SearchableSelect
            options={employeesList.map(e => ({ id: e.id, name: e.name }))}
            value={employee}
            onChange={setEmployee}
            placeholder="Select employee..."
            className="w-full"
        />
      </div>
    </div>

  </div>
</div>


        {/* LINE ITEMS SECTION */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-300">Line Items</label>
            <button
              onClick={openItemModal}
              className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded overflow-hidden min-w-[900px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700 text-gray-300 font-medium">
                <tr>
                  <th className="p-3">Service Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Service Charge</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Discount (%)</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-750">
                    <td className="p-3">{row.serviceName}</td>
                    <td className="p-3">{row.description}</td>
                    <td className="p-3">{row.unitPrice}</td>
                    <td className="p-3">{row.quantity}</td>
                    <td className="p-3">{row.discount}</td>
                    <td className="p-3 text-gray-300">{parseFloat(row.total).toFixed(2)}</td>
                    <td className="p-3 text-center flex items-center justify-center gap-2">
                      <Edit 
                        size={18} 
                        className="text-blue-400 cursor-pointer hover:text-blue-300"
                        onClick={() => editRow(i)}
                      />
                      <Trash2
                        size={18}
                        className="text-red-400 cursor-pointer hover:text-red-300"
                        onClick={() => deleteRow(i)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No items added. Click "+ Add" to start.
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Grand Total</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 font-bold">
                {grandTotal.toFixed(2)}
              </div>
            </div>

            {/* Tax removed from UI */}

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="text-sm text-gray-300 block mb-1">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full h-24 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none resize-none"
              ></textarea>
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Discount</label>
              <input
                type="number"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Total Discount</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {totalDiscount.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Due</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {dueAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Shipping Cost</label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Change</label>
              <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                {changeAmount.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-sm text-gray-300 font-semibold">Net Total</label>
              <div className="w-32 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-right text-white font-bold text-lg">
                {netTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- ADD ITEM MODAL --- */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl text-white font-semibold mb-6">{editingIndex !== null ? "Edit Line Item" : "Add Line Item"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service select */}
             <div className="md:col-span-2 w-full">
  <label className="block text-sm text-gray-300 mb-1">
    Service
  </label>

  <div className="w-full">
    <SearchableSelect
      options={servicesList.map(s => ({
        id: s.id,
        name: s.name ?? s.ServiceName ?? s.serviceName
      }))}
      value={newItem.serviceId}
      onChange={handleServiceSelect}
      placeholder="--select service--"
      className="w-full"
    />
  </div>
</div>


              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => {
                      const qty = parseFloat(e.target.value) || 0;
                      const price = parseFloat(newItem.unitPrice) || 0;
                      const disc = parseFloat(newItem.discount) || 0;
                      setNewItem({
                        ...newItem,
                        quantity: qty,
                        total: calculateItemTotal(qty, price, disc)
                      });
                  }}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
                />
              </div>

              {/* Service Charge (unitPrice) */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Service Charge</label>
                <input
                  type="number"
                  value={newItem.unitPrice}
                  onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const qty = parseFloat(newItem.quantity) || 0;
                      const disc = parseFloat(newItem.discount) || 0;
                      setNewItem({
                        ...newItem,
                        unitPrice: price,
                        total: calculateItemTotal(qty, price, disc)
                      });
                  }}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Discount (%)</label>
             <input
                type="number"
                value={newItem.discount}
                placeholder="0"
                onChange={(e) => {
                    const discountStr = e.target.value; // keep string
                    const disc = parseFloat(discountStr) || 0;
                    const qty = parseFloat(newItem.quantity) || 0;
                    const price = parseFloat(newItem.unitPrice) || 0;

                    setNewItem({
                    ...newItem,
                    discount: discountStr, // ✅ allows empty
                    total: calculateItemTotal(qty, price, disc)
                    });
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
                required
                />

              </div>

              {/* Total (read-only) */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Total</label>
                <input
                  type="text"
                  value={parseFloat(newItem.total || 0).toFixed(2)}
                  readOnly
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-300 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addItemToTable}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700"
              >
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOMER MODAL --- */}
      {/* --- ADD CUSTOMER MODAL REMOVED --- */}

    </PageLayout>
  );
};

export default NewInvoices;
