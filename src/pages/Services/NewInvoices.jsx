// src/pages/sales/NewInvoices.jsx
import React, { useEffect, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Star,
  X,
  Edit,
  ArchiveRestore
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";

// APIs (service-invoice & supporting)
import {
  getCustomersApi,
  getEmployeesApi,
  getServicesApi,
  getServiceInvoiceByIdApi,
  addServiceInvoiceApi,
  updateServiceInvoiceApi,
  deleteServiceInvoiceApi,
  restoreServiceInvoiceApi,
  getTaxTypesApi
} from "../../services/allAPI";
import Swal from "sweetalert2";

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
  const [taxTypeId, setTaxTypeId] = useState("");
  
  const [inactiveView, setInactiveView] = useState(false);

  useEffect(() => {
    if (location.state?.isInactive) {
      setInactiveView(true);
    }
  }, [location.state]);

  // --- DROPDOWN DATA ---
  const [customersList, setCustomersList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [taxTypesList, setTaxTypesList] = useState([]);

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

  // --- BOTTOM SECTION STATE ---
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [details, setDetails] = useState("");
  const [noTax, setNoTax] = useState(false);

  const [igstRate, setIgstRate] = useState(0);
  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);

  const [taxAmount, setTaxAmount] = useState(0);

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
    fetchTaxTypes();
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
      
      const records = Array.isArray(res?.data?.records)
        ? res.data.records
        : Array.isArray(res?.data)
        ? res.data
        : [];

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

  const fetchTaxTypes = async () => {
    try {
      const res = await getTaxTypesApi(1, 1000);
      if (res.status === 200) {
         // Normalize to match NewSales logic
         const list = res.data.records.map(t => ({
             id: t.typeId,
             name: `${t.isInterState ? "IGST" : "CGST/SGST"} - ${t.percentage}%`,
             isInterState: t.isInterState,
             percentage: t.percentage
         }));
         setTaxTypesList(list);
      }
    } catch (error) {
      console.error("Error fetching tax types", error);
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
        setNoTax(invoice.NoTax === 1);

        setTaxTypeId(invoice.TaxTypeId || ""); 
        setCgstRate(invoice.CGSTRate || 0);
        setSgstRate(invoice.SGSTRate || 0);

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
        setNewItem({
        serviceId: "",
        serviceName: "",
        description: "",
        quantity: 0,
        unitPrice: 0,
        discount: "0", 
        total: 0
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

  // --- UPDATE RATES WHEN TAX TYPE CHANGE ---
  useEffect(() => {
    if (!taxTypeId) {
        setCgstRate(0);
        setSgstRate(0);
        setIgstRate(0);
        return;
    }
    const selected = taxTypesList.find(t => String(t.id) === String(taxTypeId));
    if (selected) {
        const pct = parseFloat(selected.percentage) || 0;
        if (selected.isInterState) {
            setIgstRate(pct);
            setCgstRate(0);
            setSgstRate(0);
        } else {
            const half = pct / 2;
            setCgstRate(half);
            setSgstRate(half);
            setIgstRate(0);
        }
    }
  }, [taxTypeId, taxTypesList]);

  /* ================= TOTAL CALC ================= */
  useEffect(() => {
    const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

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

    const subTotal = round2(sumLineTotals);
    const gDiscount = parseFloat(globalDiscount) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    const paid = parseFloat(paidAmount) || 0;

    // Taxable Amount
    let taxableAmount = subTotal - gDiscount;
    if (taxableAmount < 0) taxableAmount = 0;
    taxableAmount = round2(taxableAmount);

    let tax = 0;
    if (!noTax) {
        const igst = (taxableAmount * igstRate) / 100;
        const cgst = (taxableAmount * cgstRate) / 100;
        const sgst = (taxableAmount * sgstRate) / 100;
        tax = round2(igst + cgst + sgst);
    }

    const finalTotal = round2(taxableAmount + tax + shipping);

    setNetTotal(finalTotal);
    setGrandTotal(subTotal);
    setTaxAmount(tax);
    setTotalDiscount(round2(sumLineDiscounts + gDiscount));

    // Update Due and Change
    if (paid >= finalTotal) {
      setChangeAmount(round2(paid - finalTotal));
      setDueAmount(0);
    } else {
      setChangeAmount(0);
      setDueAmount(round2(finalTotal - paid));
    }

  }, [rows, globalDiscount, shippingCost, paidAmount, noTax, igstRate, cgstRate, sgstRate]);

  /* ================= SAVE / UPDATE / DELETE / RESTORE ================= */
  const handleSaveInvoice = async () => {
    const currentUserId = userData?.userId || userData?.id || userData?.Id;
    if (!currentUserId) {
      console.error("User ID missing from session data:", userData);
      return toast.error("User session invalid. Please re-login.");
    }

    if (!customer) return toast.error("Please select a customer");
    if (!employee) return toast.error("Please select an employee");
    if (!paymentAccount) return toast.error("Please select a payment account");
    if (!noTax && !taxTypeId) return toast.error("Please select a Tax Type");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      customerId: customer,
      date,
      userId: currentUserId,
      employeeId: employee,
      paymentAccount: paymentAccount || "",
      discount: parseFloat(globalDiscount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      noTax: noTax ? 1 : 0,
      
      taxTypeId: taxTypeId || null,
      igstRate: parseFloat(igstRate) || 0,
      cgstRate: parseFloat(cgstRate) || 0,
      sgstRate: parseFloat(sgstRate) || 0,

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
    if (!noTax && !taxTypeId) return toast.error("Please select a Tax Type");
    if (rows.length === 0) return toast.error("Please add at least one item");

    const payload = {
      customerId: customer,
      date,
      userId: userId,
      employeeId: employee,
      paymentAccount: paymentAccount || "",
      discount: parseFloat(globalDiscount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      totalTax: parseFloat(taxAmount) || 0,
      noTax: noTax ? 1 : 0,

      taxTypeId: taxTypeId || null,
      igstRate: parseFloat(igstRate) || 0,
      cgstRate: parseFloat(cgstRate) || 0,
      sgstRate: parseFloat(sgstRate) || 0,

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
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to delete this invoice?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: "Deleting...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await deleteServiceInvoiceApi(id, { userId });
    Swal.close();

    if (res.status === 200) {
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Service invoice deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/app/services/invoices");
    } else {
      Swal.fire("Failed", "Failed to delete service invoice", "error");
    }
  } catch (error) {
    Swal.close();
    console.error("DELETE INVOICE ERROR", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error deleting invoice",
    });
  }
};


const handleRestoreInvoice = async () => {
  const result = await Swal.fire({
    title: "Restore invoice?",
    text: "Do you want to restore this invoice?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#10b981", // green
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, restore",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: "Restoring...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await restoreServiceInvoiceApi(id, { userId });
    Swal.close();

    if (res.status === 200) {
      await Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Service invoice restored successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/app/services/invoices");
    } else {
      Swal.fire("Failed", "Failed to restore service invoice", "error");
    }
  } catch (error) {
    Swal.close();
    console.error("RESTORE INVOICE ERROR", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error restoring invoice",
    });
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
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => {
                if(location.state?.returnTo) {
                    navigate(location.state.returnTo);
                } else {
                    navigate("/app/services/invoices");
                }
            }}
            className="text-white hover:text-white-400"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl text-white font-medium">{id ? "Edit Service Invoice" : "New Service Invoice"}</h2>
        </div>

        {/* ACTIONS BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              {!inactiveView && hasPermission(PERMISSIONS.SERVICES.EDIT) && (
              <button onClick={handleUpdateInvoice} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-blue-300 hover:bg-gray-600">
                <Save size={18} /> Update
              </button>
              )}
              
              {!inactiveView && hasPermission(PERMISSIONS.SERVICES.DELETE) && (
              <button onClick={handleDeleteInvoice} className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500">
                <Trash2 size={18} /> Delete
              </button>
              )}

              {inactiveView && (
                  <button onClick={handleRestoreInvoice} className="flex items-center gap-2 bg-green-600 border border-green-500 px-4 py-2 rounded text-white hover:bg-green-500">
                      <ArchiveRestore size={18} /> Restore
                  </button>
              )}
            </>
          ) : (
            hasPermission(PERMISSIONS.SERVICES.CREATE) && (
            <button onClick={handleSaveInvoice} className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded text-white hover:bg-gray-600">
              <Save size={18} /> Save
            </button>
            )
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
                    disabled={inactiveView}
                  />

                  <Star
                    size={20}
                    className={`text-white cursor-pointer hover:text-yellow-400 ${inactiveView ? "pointer-events-none opacity-50" : ""}`}
                    onClick={() => !inactiveView && navigate("/app/businesspartners/newcustomer", { state: { returnTo: location.pathname } })}
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
                  disabled={inactiveView}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
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
                  disabled={inactiveView}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none disabled:opacity-50"
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
                    disabled={inactiveView}
                />
              </div>
            </div>

            {/* Tax Type */}
            <div className="lg:col-span-6">
               <div className="flex items-center gap-3">
               <label className="w-24 text-sm text-gray-300">
                  <span className="text-red-400">*</span> Tax Type
               </label>
               <div className="flex-1">
                <SearchableSelect
                    options={taxTypesList}
                    value={taxTypeId}
                    onChange={setTaxTypeId}
                    placeholder="Select Tax Type..."
                    className="w-full"
                    disabled={inactiveView || noTax}
                 />
                </div>
               </div>
            </div>

          </div>
        </div>


        {/* LINE ITEMS SECTION */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-300">Line Items</label>
            { !inactiveView && (
            <button
              onClick={openItemModal}
              className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700"
            >
              <Plus size={16} /> Add
            </button>
            )}
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
                      {!inactiveView && (
                          <>
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
                          </>
                      )}
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



            {/* TAX RATE FIELDS (Percentage) */}
            {!noTax && taxTypeId && (() => {
               const selectedTax = taxTypesList.find(t => String(t.id) === String(taxTypeId));
               if(!selectedTax) return null;
               
               if(selectedTax.isInterState) {
                   return (
                     <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">IGST %</label>
                       <input
                         type="number"
                         value={igstRate}
                         readOnly
                         className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 outline-none cursor-not-allowed"
                       />
                     </div>
                   );
               } else {
                   return (
                     <>
                      <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">CGST %</label>
                       <input
                         type="number"
                         value={cgstRate}
                         readOnly
                         className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 outline-none cursor-not-allowed"
                       />
                      </div>
                      <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">SGST %</label>
                       <input
                         type="number"
                         value={sgstRate}
                         readOnly
                         className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-right text-gray-300 outline-none cursor-not-allowed"
                       />
                      </div>
                     </>
                   );
               }
            })()}

            {/* TOTAL TAX AMOUNT */}
            <div className="flex items-center justify-between">
               <label className="text-sm text-gray-300">Total Tax</label>
               <div className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-gray-300">
                 {taxAmount.toFixed(2)}
               </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300"><span className="text-red-400">*</span> Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                disabled={inactiveView}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
              />
            </div>

            <div className="pt-2">
              <label className="text-sm text-gray-300 block mb-1">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                disabled={inactiveView}
                className="w-full h-24 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white outline-none resize-none disabled:opacity-50"
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
                disabled={inactiveView}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
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
                disabled={inactiveView}
                className="w-32 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-right text-white outline-none disabled:opacity-50"
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
      <AddModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={addItemToTable}
        title={editingIndex !== null ? "Edit Line Item" : "Add Line Item"}
        width="700px"
      >
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
                  discount: discountStr, // allows empty
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
      </AddModal>
    </PageLayout>
  );
};

export default NewInvoices;
