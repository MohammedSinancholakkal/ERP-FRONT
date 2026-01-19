// src/pages/payroll/PayrollEmployee.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ArrowLeft, Plus, Save, Trash2, Pencil, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import { getEmployeesApi, getEmployeeByIdApi, getBanksApi, getIncomesApi, getDeductionsApi } from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";
import SearchableSelect from "../../components/SearchableSelect";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

const PayrollEmployee = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Access Check
  const canCreate = hasPermission(PERMISSIONS.HR.PAYROLL.CREATE);
  const canEdit = hasPermission(PERMISSIONS.HR.PAYROLL.EDIT);
  const isEditing = location.state?.editEmployee;

  if (isEditing ? !canEdit : !canCreate) {
      return (
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-400">You do not have permission to {isEditing ? "edit" : "create"} payroll.</p>
          </div>
        </div>
      );
  }

  /* =========================
     EMPLOYEE INFO
  ========================= */
const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankId, setBankId] = useState(null);
  const [banks, setBanks] = useState([]);
  
  console.log("🔄 Render - bankName state:", bankName);


  /* =========================
     PAYROLL COMPONENTS
  ========================= */
  const [basicSalary, setBasicSalary] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [deductions, setDeductions] = useState([]);

  /* modal states */
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);

  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingDeductionId, setEditingDeductionId] = useState(null);

  const [incomeForm, setIncomeForm] = useState({
    type: null, // {id, name}
    amount: "",
    note: ""
  });

  const [deductionForm, setDeductionForm] = useState({
    type: null, // {id, name}
    amount: "",
    note: ""
  });

  /* sample type lists (replace with real lookups if you have them) */
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    fetchEmployees();
    fetchBanks();
    fetchTypes();

    // If editing, load existing data
    if (location.state?.editEmployee) {
      const edit = location.state.editEmployee;
      setEmployee({ id: edit.employeeId, name: edit.employeeName });
      setBankAccount(edit.bankAccount || "");
      setBankName(edit.bankName || "");
      setBasicSalary(edit.basicSalary || "");
      setIncomes(edit.incomes || []);
      setDeductions(edit.deductions || []);
    }
  }, []);

  const fetchTypes = async () => {
    try {
      const [incResp, dedResp] = await Promise.all([
        getIncomesApi(1, 1000),
        getDeductionsApi(1, 1000)
      ]);
      
      const incRecords = incResp?.data?.records || [];
      const dedRecords = dedResp?.data?.records || [];

      setIncomeTypes(incRecords.map(i => ({ id: i.Id, name: i.IncomeName })));
      setDeductionTypes(dedRecords.map(d => ({ id: d.Id, name: d.Name || d.DeductionName })));
    } catch (err) {
      console.error("Error fetching types", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const resp = await getEmployeesApi(1, 1000);
      const records = resp?.data?.records || [];
      const normalized = records.map(e => ({
        id: e.Id,
        name: `${e.FirstName} ${e.LastName}`
      }));
      setEmployees(normalized);
    } catch (err) {
      console.error("Error fetching employees", err);
      toast.error("Failed to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const resp = await getBanksApi(1, 5000);
      const records = resp?.data?.records || [];
      const normalized = records.map(b => ({
        id: b.Id,
        name: b.BankName
      }));
      setBanks(normalized);
    } catch (err) {
      console.error("Error fetching banks", err);
    }
  };

  const handleEmployeeSelect = async (emp) => {
    setEmployee(emp);
    try {
      const resp = await getEmployeeByIdApi(emp.id);
      const data = resp?.data;
      if (data) {
        setBasicSalary(data.BasicSalary || "");
        setBankAccount(data.BankAccountForPayroll || "");
        
        // resolve bank name
        console.log("🏦 Employee Data Full:", data);
        
        if (data.PayrollBankName) {
            setBankName(data.PayrollBankName);
            setBankId(data.PayrollBankId); // Capture ID
        } else if (data.PayrollBankId) {
            // Fallback to client-side lookup if needed (e.g. legacy data)
             const pBankId = data.PayrollBankId;
             setBankId(pBankId); // Capture ID
             let currentBanks = banks;
             if (currentBanks.length === 0) {
                const respB = await getBanksApi(1, 5000);
                const records = respB?.data?.records || [];
                currentBanks = records.map(b => ({ id: b.Id, name: b.BankName }));
                setBanks(currentBanks);
             }
             const bank = currentBanks.find(b => String(b.id) === String(pBankId));
             if (bank) setBankName(bank.name);
        } else {
             setBankName(""); 
             setBankId(null);
        }

        // auto-fill incomes
        if (Array.isArray(data.incomes)) {
          setIncomes(data.incomes.map(inc => ({
            id: `i_${inc.Id}`,
            type: { id: inc.IncomeId, name: inc.IncomeName },
            typeName: inc.IncomeName,
            amount: Number(inc.Amount || 0),
            note: ""
          })));
        }

        // auto-fill deductions
        if (Array.isArray(data.deductions)) {
          setDeductions(data.deductions.map(ded => ({
            id: `d_${ded.Id}`,
            type: { id: ded.DeductionId, name: ded.DeductionName },
            typeName: ded.DeductionName,
            amount: Number(ded.Amount || 0),
            note: ""
          })));
        }
      }
    } catch (err) {
      console.error("Error fetching employee details", err);
      toast.error("Failed to load employee details");
    }
  };

  /* =========================
     CALCULATIONS
  ========================= */
  const totalIncome = incomes.reduce(
    (s, i) => s + Number(i.amount || 0),
    0
  );

  // Summary display: Total Income should include Basic Salary for accuracy
  const summaryTotalIncome = Number(basicSalary || 0) + totalIncome;

  const totalDeduction = deductions.reduce(
    (s, d) => s + Number(d.amount || 0),
    0
  );

  const takeHomePay = summaryTotalIncome - totalDeduction;

  /* =========================
     HANDLERS
  ========================= */
  const addIncomeRow = (payload) => {
    setIncomes((prev) => [payload, ...prev]);
  };

  const addDeductionRow = (payload) => {
    setDeductions((prev) => [payload, ...prev]);
  };

  const updateIncomeRow = (id, payload) => {
    setIncomes((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
  };

  const updateDeductionRow = (id, payload) => {
    setDeductions((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
  };

  const deleteIncome = (id) => setIncomes((p) => p.filter((x) => x.id !== id));
  const deleteDeduction = (id) => setDeductions((p) => p.filter((x) => x.id !== id));

  // Handlers for Modals
  const handleIncomeSave = () => {
    if (!incomeForm.type?.name?.trim())
      return toast.error("Income name is required");
    if (!Number(incomeForm.amount))
      return toast.error("Amount must be greater than 0");

    if (editingIncomeId) {
      updateIncomeRow(editingIncomeId, {
        type: incomeForm.type,
        amount: Number(incomeForm.amount),
        note: incomeForm.note || "",
      });
      toast.success("Income updated");
    } else {
      addIncomeRow({
        id: `i_${Date.now()}`,
        type: incomeForm.type,
        typeName: incomeForm.type.name,
        amount: Number(incomeForm.amount),
        note: incomeForm.note || "",
      });
      toast.success("Income added");
    }

    setIncomeForm({ type: null, amount: "", note: "" });
    setEditingIncomeId(null);
    setShowIncomeModal(false);
  };

  const handleDeductionSave = () => {
    if (!deductionForm.type || !deductionForm.type.name?.trim()) return toast.error("Deduction name is required");
    if (!String(deductionForm.amount).trim() || Number(deductionForm.amount) <= 0) return toast.error("Amount must be greater than 0");

    if (editingDeductionId) {
      updateDeductionRow(editingDeductionId, {
        type: deductionForm.type,
        amount: Number(deductionForm.amount),
        note: deductionForm.note || ""
      });
      toast.success("Deduction updated");
    } else {
      const newRow = {
        id: `d_${Date.now()}`,
        type: deductionForm.type,
        typeName: deductionForm.type.name,
        amount: Number(deductionForm.amount),
        note: deductionForm.note || ""
      };
      addDeductionRow(newRow);
      toast.success("Deduction added");
    }

    setDeductionForm({ type: null, amount: "", note: "" });
    setEditingDeductionId(null);
    setShowDeductionModal(false);
  };

  /* =========================
     SAVE (STRICT VALIDATION)
  ========================= */
const handleSave = () => {
  if (!employee) return toast.error("Employee is required");
  if (!bankAccount.trim()) return toast.error("Bank Account is required");
  if (!bankName.trim()) return toast.error("Bank Name is required");

  if (!String(basicSalary).trim() || Number(basicSalary) <= 0)
    return toast.error("Basic Salary must be greater than 0");

  // Normalize incomes for backend
  const normalizedIncomes = incomes.map((i) => ({
    incomeId: i.type?.id || null,
    shortNote: i.note || "",
    amount: Number(i.amount)
  }));

  // Normalize deductions for backend
  const normalizedDeductions = deductions.map((d) => ({
    deductionId: d.type?.id || null,
    shortNote: d.note || "",
    amount: Number(d.amount)
  }));

  const employeePayload = {
    employeeId: employee.id,
    employeeName: employee.name,
    bankId, // Add BankId
    bankAccount,
    bankName,
    basicSalary: Number(basicSalary),
    totalIncome,
    totalDeduction,
    takeHome: takeHomePay,
    incomes: incomes, // pass raw for UI editing
    deductions: deductions // pass raw for UI editing
  };

  const targetPath = location.state?.payrollId 
      ? `/app/hr/editpayroll/${location.state.payrollId}`
      : "/app/hr/newpayroll";

  navigate(targetPath, {
    state: {
      ...location.state,
      employeePayload,
      editIndex: location.state?.editIndex // Pass it back
    }
  });
};

const handleBack = () => {
  if (location.state?.payrollState) {
      const targetPath = location.state.payrollId 
          ? `/app/hr/editpayroll/${location.state.payrollId}`
          : "/app/hr/newpayroll";
      
      navigate(targetPath, {
          state: {
              payrollState: location.state.payrollState
          }
      });
  } else {
      navigate(-1);
  }
};



  /* =========================
     UI
  ========================= */
  return (
    <PageLayout>
      <div className={`p-6 ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard>
          
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="hover:text-gray-500">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Employee Payroll</h2>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 border px-4 py-2 rounded ${theme === 'emerald' || theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]   text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
              <Save size={16} /> {location.state?.editEmployee ? "Update" : "Save"}
            </button>
          </div>
        </div>
        
        <hr className="mb-4 border-gray-300" />

        {/* EMPLOYEE INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div className="space-y-4">
               <SearchableSelect
                    label={<>Employee <span className="text-dark">*</span></>}
                    options={employees}
                    value={employee?.id}
                    onChange={(val) => {
                        const emp = employees.find(e => e.id === val);
                        if (emp) {
                            handleEmployeeSelect(emp);
                        } else {
                            setEmployee(null);
                            setBankName("");
                            setBankAccount("");
                            setBasicSalary("");
                            setIncomes([]);
                            setDeductions([]);
                        }
                    }}
                    placeholder={employeesLoading ? "Loading..." : "Select Employee"}
                />
                
                 <InputField 
                    label="Bank Account" 
                    value={bankAccount} 
                    onChange={(e) => setBankAccount(e.target.value)} 
                    required 
                 />
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
                 <InputField
                    label={<>Bank Name <span className="text-dark">*</span></>}
                    value={bankName}
                    readOnly
                    placeholder={employee ? "Auto-filled from Employee Profile" : "Select Employee first..."}
                 />
            </div>
        </div>


        {/* PAYROLL COMPONENTS */}
        <Section title="Payroll Components">
          <div className="mb-6">
            <InputField
              label={<>Basic Salary <span className="text-dark"></span></>}
              type="number"
              value={basicSalary}
              onChange={setBasicSalary}
              required
            />
          </div>

          {/* INCOMES */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-lg">Incomes</h3>
              <button
                onClick={() => {
                  setEditingIncomeId(null);
                  setIncomeForm({ type: null, amount: "", note: "" });
                  setShowIncomeModal(true);
                }}
                className={`flex items-center gap-2 border px-4 py-2 rounded ${theme === 'emerald' || theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]   text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
                <Plus size={12} /> Add
              </button>
            </div>

            <div className={`border rounded p-2 w-full lg:w-1/2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900/20'}`}>
              <table className="w-full text-sm">
                <thead className={`${theme === 'emerald' || theme === 'purple' ? 'bg-purple-50 text-purple-800' : 'bg-gray-900 text-white'}`}>
                  <tr>
                    <th className="p-2 text-left">Income</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Short Note</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'emerald' || theme === 'purple' ? 'divide-y divide-gray-200' : 'bg-gray-800 divide-y divide-gray-700'}`}>
                  {incomes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">
                        No incomes added
                      </td>
                    </tr>
                  ) : (
                    incomes.map((r) => (
                      <tr key={r.id} className={`${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-700'}`}>
                        <td className="p-2">{r.type?.name ?? r.typeName}</td>
                        <td className="p-2 text-right">{Number(r.amount).toFixed(2)}</td>
                        <td className="p-2">{r.note || "-"}</td>
                        <td className="p-2 text-right">
                          <button
                            className="p-1 mr-2"
                            onClick={() => {
                              setEditingIncomeId(r.id);
                              setIncomeForm({ type: r.type ?? { id: r.type?.id || r.typeName, name: r.typeName }, amount: r.amount, note: r.note });
                              setShowIncomeModal(true);
                            }}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            className="p-1 text-dark"
                            onClick={() => deleteIncome(r.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DEDUCTIONS */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-lg">Deductions</h3>
              <button
                onClick={() => {
                  setEditingDeductionId(null);
                  setDeductionForm({ type: null, amount: "", note: "" });
                  setShowDeductionModal(true);
                }}
              className={`flex items-center gap-2 border px-4 py-2 rounded ${theme === 'emerald' || theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]   text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
                <Plus size={12} /> Add
              </button>
            </div>

            <div className={`border rounded p-2 overflow-x-auto w-full lg:w-1/2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900/20'}`}>
              <table className="w-full text-center text-sm">
                <thead className={`${theme === 'emerald' || theme === 'purple' ? 'bg-purple-50 text-purple-800' : 'bg-gray-900 text-white'}`}>
                  <tr className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
                    <th className="py-2 pr-4">Deduction</th>
                    <th className="py-2 w-24">Amount</th>
                    <th className="py-2">Short Note</th>
                    <th className="py-2 w-28">Actions</th>
                  </tr>
                </thead>

                <tbody className={`${theme === 'emerald' || theme === 'purple' ? 'divide-y divide-gray-200' : 'bg-gray-800 divide-y divide-gray-700'}`}>
                  {deductions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No deductions added
                      </td>
                    </tr>
                  ) : (
                    deductions.map((r) => (
                      <tr key={r.id} className={`${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-700'}`}>
                        <td className="py-2 pr-4">{r.type?.name ?? r.typeName}</td>
                        <td className="py-2 w-24 text-right">{Number(r.amount).toFixed(2)}</td>
                        <td className="py-2">{r.note || "-"}</td>
                        <td className="py-2 text-right">
                          <button
                            className="p-1 mr-2"
                            onClick={() => {
                              setEditingDeductionId(r.id);
                              setDeductionForm({ type: r.type ?? { id: r.type?.id || r.typeName, name: r.typeName }, amount: r.amount, note: r.note });
                              setShowDeductionModal(true);
                            }}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            className="p-1 text-dark"
                            onClick={() => deleteDeduction(r.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </Section>

        {/* SUMMARY */}
        <Section title="Summary">
          <div className="space-y-4 max-w-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                 <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Income</label>
                  <div className="flex-1 font-medium">
                     <input value={Number(summaryTotalIncome).toFixed(2)} disabled className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-300'}`} />
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                 <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>Total Deduction</label>
                  <div className="flex-1 font-medium">
                     <input value={Number(totalDeduction).toFixed(2)} disabled className={`w-full border rounded px-3 py-2 text-right ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-300'}`} />
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                 <label className={`w-40 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-bold' : 'text-gray-300'}`}>Take Home Pay</label>
                  <div className="flex-1 font-medium">
                     <input value={Number(takeHomePay).toFixed(2)} disabled className={`w-full border rounded px-3 py-2 text-right font-bold text-lg ${theme === 'emerald' || theme === 'purple' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-900 border-gray-600 text-white'}`} />
                 </div>
              </div>
          </div>
        </Section>
        
        </ContentCard>
      </div>

      {/* MODALS */}
      {/* INCOME MODAL */}
      <AddModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSave={handleIncomeSave}
        title={editingIncomeId ? "Edit Income" : "Add Income"}
        width="500px"
      >
        <div className="space-y-3">
          <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
            Income Name <span className="text-dark mr-1">*</span>
             
          </label>
          <SearchableSelect
            options={incomeTypes}
            value={incomeForm.type?.id}
            name="incomeType"
            id="incomeType"
            onChange={(val) => {
                const item = incomeTypes.find(x => x.id === val);
                if (item) {
                   setIncomeForm(p => ({ ...p, type: item }));
                }
            }}
            placeholder="Select Income..."
          />

          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
               <InputField 
                    label="Amount *" 
                    type="number" 
                    value={incomeForm.amount} 
                    onChange={(e) => setIncomeForm((p) => ({ ...p, amount: e.target.value }))} 
               />
            </div>

            <div className="col-span-2">
               <InputField 
                    label="Short Note (optional)" 
                    value={incomeForm.note} 
                    onChange={(e) => setIncomeForm((p) => ({ ...p, note: e.target.value }))} 
               />
            </div>
          </div>
        </div>
      </AddModal>

      {/* DEDUCTION MODAL */}
      <AddModal
        isOpen={showDeductionModal}
        onClose={() => setShowDeductionModal(false)}
        onSave={handleDeductionSave}
        title={editingDeductionId ? "Edit Deduction" : "Add Deduction"}
        width="500px"
      >
         <div className="space-y-3">
           <label className={`text-sm block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
             Deduction Name <span className="text-dark mr-1">*</span>
          </label>
          <SearchableSelect
             options={deductionTypes}
             value={deductionForm.type?.id}
             name="deductionType"
             id="deductionType"
             onChange={(val) => {
                const item = deductionTypes.find(x => x.id === val);
                if(item) {
                     setDeductionForm(p => ({...p, type: item}));
                }
             }}
             placeholder="Select Deduction..."
          />

          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <InputField 
                    label="Amount *" 
                    type="number" 
                    value={deductionForm.amount} 
                    onChange={(e) => setDeductionForm((p) => ({ ...p, amount: e.target.value }))} 
               />
            </div>

            <div className="col-span-2">
              <InputField 
                    label="Short Note (optional)" 
                    value={deductionForm.note} 
                    onChange={(e) => setDeductionForm((p) => ({ ...p, note: e.target.value }))} 
               />
            </div>
          </div>
        </div>
      </AddModal>
    </PageLayout>
  );
};

export default PayrollEmployee;

/* =========================
   REUSABLE UI
========================= */

const Section = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <div className="mb-10">
      <h3 className={`text-md font-medium mb-4 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-gray-200'}`}>{title}</h3>
      <div className={`border rounded-lg p-5 ${theme === 'emerald' || theme === 'purple' ? 'bg-white/50 border-gray-200 shadow-sm' : 'bg-gray-900/40 border-gray-700'}`}>
        {children}
      </div>
    </div>
  );
};
