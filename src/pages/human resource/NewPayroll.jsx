import React, { useEffect, useRef, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  X,
  ChevronDown,
  Pencil,
  ArchiveRestore
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import { getBanksApi, addPayrollApi, getPayrollByIdApi, updatePayrollApi, deletePayrollApi, restorePayrollApi } from "../../services/allAPI"; // adjust import path if needed
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

const NewPayroll = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;
  const inactiveView = location.state?.isInactive;

  /* ===============================
     TOP SECTION STATE
  =============================== */
  const [number, setNumber] = useState("");

  // PAYMENT DATE default to current year-month and day 01 (e.g. 2025-12-01)
  const getDefaultPaymentDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  };

  const [paymentDate, setPaymentDate] = useState(getDefaultPaymentDate());

  // cashBank is an object { id, name } or special string 'Cash'
  const [cashBank, setCashBank] = useState(null);

  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);

  const [description, setDescription] = useState("");

  /* ===============================
     LINE ITEMS (EMPLOYEES)
     (Employees are added via /app/payroll/employee)
  =============================== */
  const [rows, setRows] = useState([]);

  /* ===============================
     SUMMARY STATE (editable; currency disabled)
  =============================== */
  const [currency] = useState("PKR");
  const [sumBasic, setSumBasic] = useState(0.0);
  const [sumIncome, setSumIncome] = useState(0.0);
  const [sumDeduction, setSumDeduction] = useState(0.0);
  const [sumTakeHome, setSumTakeHome] = useState(0.0);
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0.0);
  const [loading, setLoading] = useState(false);

  /* ===============================
     COMPUTED TOTALS (from rows)
  =============================== */
  const computedTotalBasic = rows.reduce((s, r) => s + Number(r.basicSalary || 0), 0);
  const computedTotalIncome = rows.reduce((s, r) => s + Number(r.totalIncome || 0), 0);
  const computedTotalDeduction = rows.reduce((s, r) => s + Number(r.totalDeduction || 0), 0);
  const computedTotalTakeHome = rows.reduce((s, r) => s + Number(r.takeHome || 0), 0);

  // keep the editable summary in sync with rows (update when rows change)
  useEffect(() => {
    setSumBasic(Number(computedTotalBasic.toFixed(2)));
    setSumIncome(Number(computedTotalIncome.toFixed(2)));
    setSumDeduction(Number(computedTotalDeduction.toFixed(2)));
    setSumTakeHome(Number(computedTotalTakeHome.toFixed(2)));
    setTotalPaymentAmount(Number(computedTotalTakeHome.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  /* ===============================
     INIT: generate number and load banks
  =============================== */
  useEffect(() => {
    const year = new Date().getFullYear();
    
    // 1. Initial banks fetch
    fetchBanks();

    // 2. If editing, fetch payroll data
    if (isEdit) {
      fetchPayrollData();
    } else {
      setNumber(`PAYROLL/${year}`);
    }

    // 3. Restore state if coming back from PayrollEmployee (overrides fetched data if present)
    if (location.state?.payrollState) {
      const ps = location.state.payrollState;
      setNumber(ps.number || `PAYROLL/${year}`);
      setPaymentDate(ps.paymentDate || getDefaultPaymentDate());
      setCashBank(ps.cashBank || null);
      setDescription(ps.description || "");
      setRows(ps.rows || []);
    }
  }, [id]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const resp = await getPayrollByIdApi(id);
      if (resp.status === 200) {
        const { payroll, employees } = resp.data;
        setNumber(payroll.Number);
        setPaymentDate(payroll.PaymentDate ? new Date(payroll.PaymentDate).toISOString().split('T')[0] : getDefaultPaymentDate());
        setCashBank(payroll.CashBankId ? { id: payroll.CashBankId, name: payroll.BankName || "Bank" } : null);
        setDescription(payroll.Description || "");
        
        // Normalize employees for the table
        const normalizedRows = employees.map(emp => ({
          employeeId: emp.EmployeeId,
          employeeName: emp.FirstName + " " + emp.LastName,
          bankAccount: emp.BankAccount,
          bankName: emp.BankName,
          basicSalary: emp.BasicSalary,
          totalIncome: emp.TotalIncome,
          totalDeduction: emp.TotalDeduction,
          takeHome: emp.TakeHomePay,
          incomes: (emp.incomes || []).map(inc => ({
            type: { id: inc.IncomeId, name: inc.IncomeName || "Income" },
            note: inc.ShortNote,
            amount: inc.Amount
          })),
          deductions: (emp.deductions || []).map(ded => ({
            type: { id: ded.DeductionId, name: ded.DeductionName || "Deduction" },
            note: ded.ShortNote,
            amount: ded.Amount
          }))
        }));
        setRows(normalizedRows);
      }
    } catch (err) {
      console.error("Error fetching payroll data", err);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async (page = 1, limit = 100) => {
    try {
      setBanksLoading(true);
      const resp = await getBanksApi(page, limit);
      const records = resp?.data?.records || [];
      const normalized = records.map(b => ({
        id: b.id,
        name: b.BankName
      }));
      setBanks(normalized);
    } catch (err) {
      console.error("Error loading banks", err);
      setBanks([]);
      toast.error("Failed to load banks");
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.employeePayload) {
      setRows((prev) => {
        const exists = prev.find(
          (r) => r.employeeId === location.state.employeePayload.employeeId
        );

        if (exists) {
          return prev.map((r) =>
            r.employeeId === location.state.employeePayload.employeeId
              ? location.state.employeePayload
              : r
          );
        }
        return [...prev, location.state.employeePayload];
      });
      navigate(location.pathname, { replace: true, state: { ...location.state, employeePayload: null } });
    }
  }, [location.state?.employeePayload]);

  const deleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePayroll = async () => {
    if (!paymentDate) return toast.error("Payment date required");
    if (!cashBank) return toast.error("Cash/Bank required");
    if (rows.length === 0) return toast.error("Add at least one employee");

    setLoading(true);
    try {
      const payload = {
        number,
        description,
        paymentDate,
        cashBankId: cashBank?.id || null,
        totalBasicSalary: Number(sumBasic),
        totalIncome: Number(sumIncome),
        totalDeduction: Number(sumDeduction),
        totalTakeHomePay: Number(sumTakeHome),
        totalPaymentAmount: Number(totalPaymentAmount),
        currencyName: currency,
        employees: rows.map((r) => ({
          employeeId: r.employeeId ?? null,
          bankAccount: r.bankAccount,
          bankName: r.bankName,
          basicSalary: Number(r.basicSalary),
          totalIncome: Number(r.totalIncome),
          totalDeduction: Number(r.totalDeduction),
          takeHomePay: Number(r.takeHome),
          incomes: (r.incomes || []).map(inc => ({
            incomeId: inc.type?.id || null,
            shortNote: inc.note || "",
            amount: Number(inc.amount)
          })),
          deductions: (r.deductions || []).map(ded => ({
            deductionId: ded.type?.id || null,
            shortNote: ded.note || "",
            amount: Number(ded.amount)
          }))
        })),
        userId: 1
      };

      const resp = isEdit 
        ? await updatePayrollApi(id, payload)
        : await addPayrollApi(payload);
      
      if (resp.status === 200 || resp.status === 201) {
        toast.success(isEdit ? "Payroll updated successfully!" : "Payroll saved successfully!");
        navigate("/app/hr/payroll");
      } else {
        toast.error(resp.data?.message || `Failed to ${isEdit ? 'update' : 'save'} payroll`);
      }
    } catch (err) {
      console.error("Error saving payroll", err);
      toast.error("Error saving payroll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayroll = async () => {
    if (!id) {
      toast.error("Payroll not found");
      return;
    }
  
    const result = await Swal.fire({
      title: "Delete Payroll?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
  
    if (!result.isConfirmed) return;
  
    try {
      setLoading(true);
      await deletePayrollApi(id, { userId: 1 });
      toast.success("Payroll deleted successfully");
      navigate("/app/hr/payroll");
    } catch (error) {
      console.error("Delete payroll failed:", error);
      toast.error("Failed to delete payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePayroll = async () => {
     if (!id) return;

     const result = await Swal.fire({
      title: "Restore Payroll?",
      text: "This payroll record will be restored.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        setLoading(true);
        const res = await restorePayrollApi(id, { userId: 1 });
        if (res.status === 200) {
            Swal.fire({
                title: "Restored!",
                text: "Payroll restored successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
            navigate("/app/hr/payroll");
        }
    } catch (err) {
        console.error("Restore failed", err);
        Swal.fire({
            title: "Error!",
            text: "Failed to restore payroll.",
            icon: "error",
        });
    } finally {
        setLoading(false);
    }
  };




 
  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/app/hr/payroll")} className="text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">{isEdit ? "Edit Payroll" : "New Payroll"}</h1>
          </div>
        <div className="flex flex-wrap gap-3">
          {(isEdit ? hasPermission(PERMISSIONS.HR.PAYROLL.EDIT) : hasPermission(PERMISSIONS.HR.PAYROLL.CREATE)) && !location.state?.isInactive && (
          <button
            onClick={handleSavePayroll}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded text-blue-300 hover:bg-gray-700"
          >
            <Save size={20} />
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
          )}

          {isEdit && location.state?.isInactive && hasPermission(PERMISSIONS.HR.PAYROLL.DELETE) && (
            <button
               type="button"
               onClick={handleRestorePayroll} // Define this function below
               disabled={loading}
               className="flex items-center gap-2 bg-green-600 border border-green-800 px-3 py-2 rounded text-white hover:bg-green-500"
            >
               <ArchiveRestore size={16} /> Restore
            </button>
          )}


          {isEdit && !location.state?.isInactive && hasPermission(PERMISSIONS.HR.PAYROLL.DELETE) && (
            <button
              type="button"
              onClick={handleDeletePayroll}
              disabled={loading}
              className="flex items-center gap-2 bg-red-800 border border-red-600 px-3 py-2 rounded text-red-200 hover:bg-red-700"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>

          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <label className="w-32 text-sm text-gray-300">Number</label>
              <input
                disabled
                value={number}
                className="w-full sm:flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
               <label className="w-32 text-sm text-gray-300">
                  <span className="text-red-400 mr-1">*</span> Cash / Bank
               </label>
               <div className="w-full sm:flex-1">
                <SearchableSelect
                    options={banks}
                    value={cashBank?.id}
                    onChange={(val) => {
                         const b = banks.find(x => x.id === val);
                         if (b) setCashBank(b);
                    }}
                    placeholder="Select Bank..."
                    disabled={inactiveView}
                />
               </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <label className="w-24 text-sm text-gray-300">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={inactiveView}
                className={`w-full sm:flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 ${inactiveView ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-start lg:justify-end gap-2 sm:gap-0">
              <label className="w-32 sm:w-auto sm:mr-3 text-sm text-gray-300">
                <span className="text-red-400">*</span> Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={inactiveView}
                className={`w-full sm:w-48 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 ${inactiveView ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-300">Employee List</label>
            {!inactiveView && (isEdit ? hasPermission(PERMISSIONS.HR.PAYROLL.EDIT) : hasPermission(PERMISSIONS.HR.PAYROLL.CREATE)) && (
            <button
              onClick={() => navigate("/app/hr/employee", {
                state: {
                  payrollState: { number, paymentDate, cashBank, description, rows }
                }
              })}
              className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700"
            >
              <Plus size={16} /> Add
            </button>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded overflow-hidden min-w-[900px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Bank Account</th>
                  <th className="p-3">Bank Name</th>
                  <th className="p-3">Basic Salary</th>
                  <th className="p-3">Income</th>
                  <th className="p-3">Deduction</th>
                  <th className="p-3">Take Home</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-750">
                    <td className="p-3">{r.employeeName}</td>
                    <td className="p-3">{r.bankAccount}</td>
                    <td className="p-3">{r.bankName}</td>
                    <td className="p-3">{Number(r.basicSalary).toFixed(2)}</td>
                    <td className="p-3">{Number(r.totalIncome).toFixed(2)}</td>
                    <td className="p-3">{Number(r.totalDeduction).toFixed(2)}</td>
                    <td className="p-3 font-semibold">{Number(r.takeHome).toFixed(2)}</td>
                    <td className="p-3 flex gap-2">
                       {!inactiveView && (isEdit ? hasPermission(PERMISSIONS.HR.PAYROLL.EDIT) : hasPermission(PERMISSIONS.HR.PAYROLL.CREATE)) && (
                       <>
                      <button 
                        onClick={() => navigate("/app/payroll/employee", {
                          state: {
                            payrollState: { number, paymentDate, cashBank, description, rows },
                            editEmployee: r
                          }
                        })}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => deleteRow(i)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                       </>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="p-8 text-center text-gray-500">No employees added</div>}
          </div>
        </div>

        <div className="mt-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-6 text-gray-200">Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-300 block mb-1">Currency</label>
              <input value={currency} disabled className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed" />
            </div>
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-300 block mb-1">Total Basic Salary</label>
              <input value={Number(sumBasic).toFixed(2)} readOnly className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 text-right" />
            </div>
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-300 block mb-1">Total Income</label>
              <input value={Number(sumIncome).toFixed(2)} readOnly className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 text-right" />
            </div>
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-300 block mb-1">Total Deduction</label>
              <input value={Number(sumDeduction).toFixed(2)} readOnly className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 text-right" />
            </div>
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-300 block mb-1">Total Take Home Pay</label>
              <input value={Number(sumTakeHome).toFixed(2)} readOnly className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 text-right" />
            </div>
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-300 block mb-1"><span className="text-red-400">*</span> Total Payment Amount</label>
              <input value={Number(totalPaymentAmount).toFixed(2)} readOnly className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-right font-semibold" />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default NewPayroll;
