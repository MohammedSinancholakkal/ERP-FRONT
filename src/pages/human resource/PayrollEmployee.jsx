// src/pages/payroll/PayrollEmployee.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ArrowLeft, Plus, Save, Trash2, Pencil, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";
import { getEmployeesApi, getEmployeeByIdApi, getBanksApi, getIncomesApi, getDeductionsApi } from "../../services/allAPI";




/* =========================
    SEARCHABLE DROPDOWN
========================= */
const SearchableDropdown = ({
  label,
  list = [],
  value,
  onChange,
  placeholder = "--select--",
  required = false
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value?.name) setQuery(value.name);
  }, [value?.id]);

  /* ✅ CLOSE ON OUTSIDE CLICK */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filtered = (list || []).filter((x) =>
    x.name.toLowerCase().includes((query || "").toLowerCase())
  );

  const selectItem = (it) => {
    onChange(it);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      <label className="text-sm text-white block mb-1">
        {required && <span className="text-red-400 mr-1">*</span>}
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border text-white border-gray-700 rounded px-3 py-2 text-sm"
        />

        {open && (
          <div className="absolute left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-40 max-h-56 overflow-auto">
            {filtered.length > 0 ? (
              filtered.map((it) => (
                <div
                  key={it.id}
                  onClick={() => selectItem(it)}
                  className="px-3 py-2 hover:bg-gray-800 cursor-pointer text-sm text-gray-200"
                >
                  {it.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">
                No matches
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


/* =========================
   PORTAL
========================= */
const Portal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
};

/* =========================
   INCOME MODAL
========================= */
const IncomeModal = React.memo(({
incomeTypes,
incomeForm,
setIncomeForm,
editingIncomeId,
setEditingIncomeId,
setShowIncomeModal,
updateIncomeRow,
addIncomeRow,
setIncomeTypes,
}) => {

const resetAndClose = () => {
  setIncomeForm({ type: null, amount: "", note: "" });
  setEditingIncomeId(null);
  setShowIncomeModal(false);
};

return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    <div className="w-[680px] bg-gray-900 border border-gray-700 rounded">
      <div className="flex justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg text-white">
          {editingIncomeId ? "Edit Income" : "Add Income"}
        </h2>
        <button onClick={resetAndClose} className="p-1 text-white">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <SearchableDropdown
          label="Income Name"
          list={incomeTypes}
          value={incomeForm.type}
          onChange={(item) => {
            if (!incomeTypes.find((x) => x.id === item.id)) {
              setIncomeTypes((p) => [item, ...p]);
            }
            setIncomeForm((p) => ({ ...p, type: item }));
          }}
          required
          placeholder="Select Income..."
          className="w-full text-white"
        />

        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="text-sm text-white block mb-1">Amount *</label>
            <input
              type="number"
              min="0"
              value={incomeForm.amount}
              onChange={(e) =>
                setIncomeForm((p) => ({ ...p, amount: e.target.value }))
              }
              className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-2"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm text-white block mb-1">
              Short Note (optional)
            </label>
            <input
              value={incomeForm.note}
              onChange={(e) =>
                setIncomeForm((p) => ({ ...p, note: e.target.value }))
              }
              className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={resetAndClose}
            className="px-3 py-1 bg-gray-800 text-white border border-gray-700 rounded text-sm"
          >
            Cancel
          </button>

          <button
            onClick={() => {
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

              resetAndClose();
            }}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-blue-300"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
);
});

/* =========================
   DEDUCTION MODAL
========================= */
const DeductionModal = () => {
  const resetAndClose = () => {
    setDeductionForm({ type: null, amount: "", note: "" });
    setEditingDeductionId(null);
    setShowDeductionModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="w-[680px] bg-gray-900 border border-gray-700 rounded">
        <div className="flex justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg text-white">{editingDeductionId ? "Edit Deduction" : "Add Deduction"}</h2>
          <button onClick={resetAndClose} className="p-1 text-white"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-3">
          <SearchableDropdown
            label="Deduction Name"
            list={deductionTypes}
            value={deductionForm.type}
            onChange={(item) => {
              if (!deductionTypes.find((x) => x.id === item.id)) {
                setDeductionTypes((p) => [item, ...p]);
              }
              setDeductionForm((p) => ({ ...p, type: item }));
            }}
            required
            placeholder="Select Deduction..."
            className="w-full text-white"
          />

          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="text-sm text-white block mb-1">Amount *</label>
              <input
                type="number"
                min="0"
                value={deductionForm.amount}
                onChange={(e) => setDeductionForm((p) => ({ ...p, amount: e.target.value }))}
                className="w-full bg-gray-800 border text-white border-gray-700 rounded px-2 py-2"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm text-white block mb-1">Short Note (optional)</label>
              <input
                value={deductionForm.note}
                onChange={(e) => setDeductionForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full bg-gray-800 border text-white border-gray-700 rounded px-2 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetAndClose} className="px-3 py-1 bg-gray-800 text-white border border-gray-700 rounded text-sm">Cancel</button>

            <button
              onClick={() => {
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
              }}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-blue-300"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const PayrollEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================
     EMPLOYEE INFO
  ========================= */
const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [banks, setBanks] = useState([]);

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
      const resp = await getBanksApi(1, 1000);
      const records = resp?.data?.records || [];
      setBanks(records); // keep full records to resolve by id
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
        if (data.PayrollBankId) {
          let currentBanks = banks;
          if (currentBanks.length === 0) {
            // fallback if banks not loaded yet
            const respB = await getBanksApi(1, 1000);
            currentBanks = respB?.data?.records || [];
            setBanks(currentBanks);
          }
          const bank = currentBanks.find(b => String(b.Id || b.id) === String(data.PayrollBankId));
          if (bank) {
            setBankName(bank.BankName || bank.name || "");
          }
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
    bankAccount,
    bankName,
    basicSalary: Number(basicSalary),
    totalIncome,
    totalDeduction,
    takeHome: takeHomePay,
    incomes: incomes, // pass raw for UI editing
    deductions: deductions // pass raw for UI editing
  };

  navigate("/app/hr/newpayroll", {
    state: {
      ...location.state,
      employeePayload
    }
  });
};



  /* =========================
     UI
  ========================= */
  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-[calc(100vh-80px)] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-medium">Employee Payroll</h2>
        </div>

        {/* ACTION BAR */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded"
          >
            <Save size={16} /> Save
          </button>
        </div>

        {/* EMPLOYEE INFO */}
        <Section title="Employee Info">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<SearchableDropdown
            label="Employee"
            list={employees}
            value={employee}
            onChange={handleEmployeeSelect}
            required
            placeholder={employeesLoading ? "Loading..." : "Select Employee"}
          />
            <Input label="Bank Account" value={bankAccount} onChange={setBankAccount} required />
            <Input label="Bank Name" value={bankName} onChange={setBankName} required />
          </div>
        </Section>

        {/* PAYROLL COMPONENTS */}
        <Section title="Payroll Components">
          <div className="mb-6">
            <Input
              label="Basic Salary"
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
                className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-2 py-1 rounded text-sm"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div className="border border-gray-700 rounded p-2 w-1/2">
              <table className="w-full text-sm">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="p-2 text-left">Income</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Short Note</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800">
                  {incomes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">
                        No incomes added
                      </td>
                    </tr>
                  ) : (
                    incomes.map((r) => (
                      <tr key={r.id} className="border-t border-gray-700">
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
                            className="p-1 text-red-400"
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
                className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-2 py-1 rounded text-sm"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div className="border border-gray-700 rounded p-2 overflow-x-auto w-1/2">
              <table className="w-full text-center text-sm">
                <thead className="bg-gray-900">
                  <tr className="text-gray-300">
                    <th className="py-2 pr-4">Deduction</th>
                    <th className="py-2 w-24">Amount</th>
                    <th className="py-2">Short Note</th>
                    <th className="py-2 w-28">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-gray-800">
                  {deductions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No deductions added
                      </td>
                    </tr>
                  ) : (
                    deductions.map((r) => (
                      <tr key={r.id} className="border-t border-gray-700">
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
                            className="p-1 text-red-400"
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
          <div className="space-y-4">
            <ReadOnly label="Total Income" value={summaryTotalIncome} />
            <ReadOnly label="Total Deduction" value={totalDeduction} />
            <ReadOnly label="Take Home Pay" value={takeHomePay} bold />
          </div>
        </Section>

      </div>

      {/* MODALS */}
{showIncomeModal && (
  <Portal>
    <IncomeModal
      incomeTypes={incomeTypes}
      incomeForm={incomeForm}
      setIncomeForm={setIncomeForm}
      editingIncomeId={editingIncomeId}
      setEditingIncomeId={setEditingIncomeId}
      setShowIncomeModal={setShowIncomeModal}
      updateIncomeRow={updateIncomeRow}
      addIncomeRow={addIncomeRow}
      setIncomeTypes={setIncomeTypes}
    />
  </Portal>
)}
      {showDeductionModal && <Portal><DeductionModal /></Portal>}
    </PageLayout>
  );
};

export default PayrollEmployee;

/* =========================
   REUSABLE UI
========================= */

const Section = ({ title, children }) => (
  <div className="mb-10">
    <h3 className="text-md font-medium mb-4 text-gray-200">{title}</h3>
    <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-5">
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = "text", required }) => (
  <div>
    <label className="text-sm text-gray-300 block mb-1">
      {required && <span className="text-red-400 mr-1">*</span>}
      {label}
    </label>
    <input
      type={type}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
    />
  </div>
);

const ReadOnly = ({ label, value, bold }) => (
  <div>
    <label className="text-sm text-gray-300 block mb-1">{label}</label>
    <input
      disabled
      value={Number(value || 0).toFixed(2)}
      className={`w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-right ${
        bold ? "font-bold text-lg text-white" : "text-gray-300"
      }`}
    />
  </div>
);
