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
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import { getBanksApi, addPayrollApi, getPayrollByIdApi, updatePayrollApi, deletePayrollApi, restorePayrollApi } from "../../services/allAPI"; // adjust import path if needed
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";
import PageLayout from "../../layout/PageLayout";

const NewPayroll = () => {
  const { theme } = useTheme();
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
          bankId: emp.BankId, // Get from API
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
      showErrorToast("Failed to load payroll data");
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
      showErrorToast("Failed to load banks");
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.employeePayload) {
      const editIdx = location.state.editIndex;
      setRows((prev) => {
        if (editIdx !== undefined && editIdx !== null && editIdx >= 0 && editIdx < prev.length) {
             // Update existing row by index
             const newRows = [...prev];
             newRows[editIdx] = location.state.employeePayload;
             return newRows;
        } else {
             // Check if employeeId exists just in case (fallback for safety or direct adds)
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
        }
      });
      navigate(location.pathname, { replace: true, state: { ...location.state, employeePayload: null, editIndex: null } });
    }
  }, [location.state?.employeePayload]);

  const deleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePayroll = async () => {
    if (!paymentDate) return showErrorToast("Payment date required");
    if (!cashBank) return showErrorToast("Cash/Bank required");
    if (rows.length === 0) return showErrorToast("Add at least one employee");

    const descLen = description?.trim().length || 0;
    if (description && (descLen < 2 || descLen > 300)) return showErrorToast("Description must be between 2 and 300 characters");

    // Validate Rows
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.bankName && (r.bankName.length < 2 || r.bankName.length > 20)) return showErrorToast(`Row ${i+1}: Bank Name must be 2-20 characters`);
        if (r.bankAccount && !/^\d{10,18}$/.test(r.bankAccount)) return showErrorToast(`Row ${i+1}: Bank Account must be 10-18 numbers`);
        
        // Incomes notes
        if(r.incomes) {
            for(const inc of r.incomes) {
                if(inc.note && (inc.note.length < 2 || inc.note.length > 50)) return showErrorToast(`Row ${i+1}: Short Note (Income) must be 2-50 characters`);
            }
        }
        // Deductions notes
        if(r.deductions) {
            for(const ded of r.deductions) {
                 if(ded.note && (ded.note.length < 2 || ded.note.length > 50)) return showErrorToast(`Row ${i+1}: Short Note (Deduction) must be 2-50 characters`);
            }
        }
    }

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
          bankId: r.bankId, // Add BankId
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
        showSuccessToast(isEdit ? "Payroll updated successfully!" : "Payroll saved successfully!");
        if (!isEdit && resp.data.payrollId) {
             navigate(`/app/hr/editpayroll/${resp.data.payrollId}`);
        } else {
             if (isEdit) navigate("/app/hr/payroll");
        }
      } else {
        showErrorToast(resp.data?.message || `Failed to ${isEdit ? 'update' : 'save'} payroll`);
      }
    } catch (err) {
      console.error("Error saving payroll", err);
      showErrorToast("Error saving payroll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayroll = async () => {
    if (!id) {
      showErrorToast("Payroll not found");
      return;
    }
  
    const result = await showDeleteConfirm("this payroll record");
  
    if (!result.isConfirmed) return;
  
    try {
      setLoading(true);
      await deletePayrollApi(id, { userId: 1 });
      showSuccessToast("Payroll deleted successfully");
      navigate("/app/hr/payroll");
    } catch (error) {
      console.error("Delete payroll failed:", error);
      showErrorToast("Failed to delete payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePayroll = async () => {
     if (!id) return;

     const result = await showRestoreConfirm("this payroll record");

    if (!result.isConfirmed) return;

    try {
        setLoading(true);
        const res = await restorePayrollApi(id, { userId: 1 });
        if (res.status === 200) {
            showSuccessToast("Payroll restored successfully.");
            navigate("/app/hr/payroll");
        }
    } catch (err) {
        console.error("Restore failed", err);
        showErrorToast("Failed to restore payroll.");
    } finally {
        setLoading(false);
    }
  };




 
  return (
    <PageLayout>
 <div className={`p-6 ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/app/hr/payroll")} className="hover:text-gray-500">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">
              {isEdit ? "Edit Payroll" : "New Payroll"}
            </h2>
          </div>
        <div className="flex flex-wrap gap-3">
          {(isEdit ? hasPermission(PERMISSIONS.HR.PAYROLL.EDIT) : hasPermission(PERMISSIONS.HR.PAYROLL.CREATE)) && !location.state?.isInactive && (
          <button
            onClick={handleSavePayroll}
            disabled={loading}
            className={`flex items-center gap-2 border px-3 py-2 rounded ${theme === 'emerald' || theme === 'purple' ?  ' bg-[#6448AE] hover:bg-[#6E55B6] text-white' : 'bg-gray-800 border-gray-600 text-blue-300 hover:bg-gray-700'}`}
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
        <hr className="mb-4 border-gray-300" />

        {/* TOP SECTION: 2-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           {/* LEFT COLUMN */}
           <div className="space-y-4">
               {/* Number */}
               <InputField
                   label="Number"
                   value={number}
                   disabled
               />

               {/* Cash / Bank */}
               <SearchableSelect
                   label={<>Cash / Bank <span className="text-dark">*</span></>}
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

           {/* RIGHT COLUMN */}
           <div className="space-y-4">
              {/* Description */}
              <InputField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={inactiveView}
              />

              {/* Payment Date */}
              <InputField
                  type="date"
                  label={<>Payment Date <span className="text-dark">*</span></>}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={inactiveView}
              />
           </div>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2 font-medium">
            <label className={`text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Employee List</label>
            {!inactiveView && (isEdit ? hasPermission(PERMISSIONS.HR.PAYROLL.EDIT) : hasPermission(PERMISSIONS.HR.PAYROLL.CREATE)) && (
            <button
              onClick={() => navigate("/app/hr/employee", {
                state: {
                  payrollState: { number, paymentDate, cashBank, description, rows },
                  payrollId: id
                }
              })}
              className={`flex items-center gap-2 px-4 py-2 border rounded ${theme === 'emerald' || theme === 'purple' ?  ' bg-[#6448AE] hover:bg-[#6E55B6] text-white' : 'bg-gray-800 border-gray-600 text-blue-300 hover:bg-gray-700'}`}
            >
              <Plus size={16} /> Add
            </button>
            )}
          </div>

          <div className={`border rounded overflow-hidden min-w-[900px] ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <table className="w-full text-sm">
              <thead className={`${theme === 'emerald' || theme === 'purple' ? 'bg-purple-50 text-purple-800' : 'bg-gray-700 text-white'}`}>
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
              <tbody className={`divide-y text-center ${theme === 'emerald' || theme === 'purple' ? 'divide-gray-200' : 'divide-gray-700'}`}>
                {rows.map((r, i) => (
                  <tr key={i} className={`${theme === 'emerald' || theme === 'purple' ? 'hover:bg-gray-50 border-gray-200' : 'hover:bg-gray-750 border-gray-700'}`}>
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
                        onClick={() => navigate("/app/hr/employee", {
                          state: {
                            payrollState: { number, paymentDate, cashBank, description, rows },
                            editEmployee: r,
                            editIndex: i,
                            payrollId: id // Pass current ID
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
            {rows.length === 0 && <div className={`p-8 text-center ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-500'}`}>No employees added</div>}
          </div>
        </div>

        {/* BOTTOM SECTION (SUMMARY): 2-COLUMN GRID */}
        <div className={`mt-10 border rounded-lg p-6 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-gray-700'}`}>
          <h3 className={`text-lg font-medium mb-6 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-gray-200'}`}>Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* LEFT COLUMN - Totals */}
             <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Currency</label>
                     <div className="flex-1 font-medium">
                        <input value={currency} disabled className={`w-full border rounded px-3 py-2 cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`} />
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Basic Salary</label>
                     <div className="flex-1 font-medium">
                        <input value={Number(sumBasic).toFixed(2)} disabled className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-300'}`} />
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                     <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Income</label>
                      <div className="flex-1 font-medium">
                        <input value={Number(sumIncome).toFixed(2)} disabled className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-300'}`} />
                     </div>
                 </div>
             </div>

             {/* RIGHT COLUMN - Totals */}
             <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                     <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Deduction</label>
                      <div className="flex-1 font-medium">
                        <input value={Number(sumDeduction).toFixed(2)} disabled className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-300'}`} />
                     </div>
                 </div>

                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                     <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Take Home Pay</label>
                      <div className="flex-1 font-medium">
                        <input value={Number(sumTakeHome).toFixed(2)} disabled className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-300'}`} />
                     </div>
                 </div>

                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                     <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                         Total Payment Amount <span className="text-dark">*</span>
                     </label>
                      <div className="flex-1 font-medium">
                        <input value={Number(totalPaymentAmount).toFixed(2)} readOnly className={`w-full border rounded px-3 py-2 text-right font-semibold ${theme === 'emerald' || theme === 'purple' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-900 border-gray-600 text-white'}`} />
                     </div>
                 </div>
             </div>
          </div>
        </div>

      </ContentCard>
      </div>
    </PageLayout>
  );
};

export default NewPayroll;
