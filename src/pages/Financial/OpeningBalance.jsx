// src/pages/accounts/OpeningBalance.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";
import { showSuccessToast, showErrorToast } from "../../utils/notificationUtils"; 
import { Save } from "lucide-react";
import { getCOAHeadsApi, addOpeningBalanceApi } from "../../services/allAPI";

const OpeningBalance = () => {
  const { theme } = useTheme();

  // -----------------------------------
  // FORM STATE
  // -----------------------------------
  const [form, setForm] = useState({
    vdate: new Date().toISOString().split("T")[0],
    accountHead: "",
    balanceType: "Debit",
    amount: "",
    remark: "",
  });

  const [accountHeadOptions, setAccountHeadOptions] = useState([]);

  // Fetch Accounts
  useEffect(() => {
    const fetchAccounts = async () => {
        try {
            const res = await getCOAHeadsApi();
            console.log(res);
            
            if (res.status === 200 && Array.isArray(res.data)) {
                // Filter leaf nodes or transaction-enabled nodes
                // AND Restrict to Assets (A), Liabilities (L), Equity (EQ)
                const parentCodes = new Set(res.data.map(a => String(a.parentHead)));
                
                const allowedTypes = ['A', 'L', 'EQ'];

                const options = res.data
                    .filter(a => {
                        const isLeaf = !parentCodes.has(String(a.headCode || a.HeadCode));
                        const type = a.headType || a.HeadType;
                        const isBank = !!(a.bankId || a.BankId);
                        
                        // Must be Transaction/Leaf AND must be allowed type OR it is a Bank Account
                        return isBank || ((a.isTransaction || a.IsTransaction || isLeaf) && allowedTypes.includes(type));
                    })
                    .map(a => ({
                        id: a.id || a.Id,
                        name: `${a.headCode || a.HeadCode} - ${a.headName || a.HeadName}` 
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                setAccountHeadOptions(options);
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        }
    };
    fetchAccounts();
  }, []);

  const balanceTypeOptions = [
      { id: "Debit", name: "Debit (+)" },
      { id: "Credit", name: "Credit (-)" },
  ];

  // -----------------------------------
  // HANDLERS
  // -----------------------------------
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
      // Improve validation if needed
      if(!form.amount || !form.accountHead) {
           showErrorToast("Please select Account and enter Amount");
          return;
      }

      setLoading(true);
      
      try {
          const payload = {
            vdate: form.vdate,
            accountHead: form.accountHead, // This is the ID from SearchableSelect
            balanceType: form.balanceType,
            amount: form.amount,
            remark: form.remark,
            userId: 1 // Replace with real auth user id
          };

          const res = await addOpeningBalanceApi(payload);
          
          if (res.status === 200) {
            showSuccessToast("Opening Balance Saved Successfully");
            setForm({
                vdate: new Date().toISOString().split("T")[0],
                accountHead: "",
                balanceType: "Debit",
                amount: "",
                remark: "",
            });
          } else {
              showErrorToast(res.response?.data?.message || "Failed to save");
          }
      } catch (error) {
          console.error(error);
          showErrorToast("Server Error");
      } finally {
          setLoading(false);
      }
  };


  return (
    <PageLayout>
        <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
            <ContentCard>
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-xl font-bold text-[#6448AE] mb-2">Opening Balance</h2>
                        <hr className="border-gray-300" />
                    </div>

                    {/* Toolbar */}
                    <div className="flex">
                        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-2 border px-4 py-2 rounded text-sm ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white border-[#6448AE]' : 'bg-gray-800 border-gray-600 text-blue-300 hover:bg-gray-700'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
             <>
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               Saving...
             </>
          ) : (
             <>
               <Save size={16} />Save
             </>
          )}
        </button>
                    </div>

                    {/* Form */}
                    <div className="max-w-4xl space-y-4">
                        {/* Date */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <label className="w-32 text-sm font-medium text-gray-700 shrink-0">
                                <span className="text-red-500">*</span> V Date
                            </label>
                            <div className="flex-1">
                                <InputField
                                    type="date"
                                    value={form.vdate}
                                    onChange={(e) => setForm({ ...form, vdate: e.target.value })}
                                    required
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Account Head */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <label className="w-32 text-sm font-medium text-gray-700 shrink-0">
                                <span className="text-red-500">*</span> Account Head
                            </label>
                            <div className="flex-1">
                                <SearchableSelect
                                    options={accountHeadOptions}
                                    value={form.accountHead}
                                    onChange={(val) => setForm({ ...form, accountHead: val })}
                                    placeholder="--select--"
                                    required
                                />
                            </div>
                        </div>

                        {/* Balance Type */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <label className="w-32 text-sm font-medium text-gray-700 shrink-0">
                                <span className="text-red-500">*</span> Balance Type
                            </label>
                            <div className="flex-1">
                                <SearchableSelect
                                    options={balanceTypeOptions}
                                    value={form.balanceType}
                                    onChange={(val) => setForm({ ...form, balanceType: val })}
                                    placeholder="--select--"
                                    required
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <label className="w-32 text-sm font-medium text-gray-700 shrink-0">
                                <span className="text-red-500">*</span> Amount
                            </label>
                            <div className="flex-1">
                                <InputField
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Remark */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                            <label className="w-32 text-sm font-medium text-gray-700 shrink-0 pt-2">
                                <span className="text-red-500">*</span> Remark
                            </label>
                            <div className="flex-1">
                                <InputField
                                    textarea
                                    value={form.remark}
                                    onChange={(e) => setForm({ ...form, remark: e.target.value })}
                                    className="h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ContentCard>
        </div>
    </PageLayout>
  );
};

export default OpeningBalance;
