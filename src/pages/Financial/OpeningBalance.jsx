// src/pages/accounts/OpeningBalance.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";
import { showSuccessToast, showErrorToast } from "../../utils/notificationUtils"; 
import { Save } from "lucide-react";
import { getCOAHeadsApi, addOpeningBalanceApi, getExpenseTransactionsApi } from "../../services/allAPI";

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
  const [purchaseExpenses, setPurchaseExpenses] = useState(null);

  // Fetch Accounts
  useEffect(() => {
    const fetchAccounts = async () => {
        try {
            const res = await getCOAHeadsApi();
            console.log(res);
            
            if (res.status === 200 && Array.isArray(res.data)) {
                // EXPLICIT BLACKLIST of parent names to exclude (User Request)
                const excludedNames = [
                    "assets", "equity", "income", "expense", "liability", 
                    "liabilities", "current assets", "cash & cash equivalent", 
                    "duties & taxes", "duties & tax", "account receivable", 
                    "accounts receivable", "non current assets", 
                    "current liabilities", "account payable", "accounts payable"
                ];

                // Filter to show all children and grandchildren except the excluded parent names
                const options = res.data
                    .filter(a => {
                        const headName = (a.headName || a.HeadName || "").trim();
                        
                        // Exclude parent names from the blacklist (case insensitive)
                        if (excludedNames.includes(headName.toLowerCase())) {
                            return false;
                        }
                        
                        // Include everything else - all children and grandchildren
                        return true;
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

  // Fetch Purchase Expenses
  useEffect(() => {
    const fetchPurchaseExpenses = async () => {
        try {
            const res = await getExpenseTransactionsApi();
            if (res.status === 200 && res.data && res.data.length > 0) {
                setPurchaseExpenses(res.data[0]); // Get first record (Product Purchase account)
            }
        } catch (error) {
            console.error("Failed to fetch purchase expenses", error);
        }
    };
    fetchPurchaseExpenses();
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
            accountHead: form.accountHead, 
            balanceType: form.balanceType,
            amount: form.amount,
            remark: form.remark,
            userId: 1 
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
                        <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Opening Balance</h2>
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
                        {/* Purchase Expenses Display */}
                        {purchaseExpenses && (
                            <div className={`p-4 rounded-lg border-2 ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-300' : theme === 'purple' ? 'bg-purple-50 border-purple-300' : 'bg-gray-800 border-gray-600'}`}>
                                <div className={`text-sm font-semibold ${theme === 'purple' ? 'text-purple-900' : theme === 'emerald' ? 'text-emerald-900' : 'text-gray-300'}`}>
                                    📦 Product Purchase Expenses
                                </div>
                                <div className={`mt-2 text-lg font-bold ${theme === 'purple' ? 'text-purple-700' : theme === 'emerald' ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                    Total Paid: ₹{parseFloat(purchaseExpenses.totalExpense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-xs mt-1 ${theme === 'purple' ? 'text-gray-600' : theme === 'emerald' ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Transactions: {purchaseExpenses.transactionCount || 0}
                                </div>
                            </div>
                        )}

                        {/* Date */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <label className={`w-32 text-sm font-medium shrink-0 ${theme === 'dark' ? 'text-white' : theme === 'purple' ? 'text-purple-900' : 'text-gray-700'}`}>
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
                            <label className={`w-32 text-sm font-medium shrink-0 ${theme === 'dark' ? 'text-white' : theme === 'purple' ? 'text-purple-900' : 'text-gray-700'}`}>
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
                            <label className={`w-32 text-sm font-medium shrink-0 ${theme === 'dark' ? 'text-white' : theme === 'purple' ? 'text-purple-900' : 'text-gray-700'}`}>
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
                            <label className={`w-32 text-sm font-medium shrink-0 ${theme === 'dark' ? 'text-white' : theme === 'purple' ? 'text-purple-900' : 'text-gray-700'}`}>
                                <span className="text-red-500">*</span> Amount
                            </label>
                            <div className="flex-1">
                                <InputField
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required
                                    className="w-full"
                                    formatted
                                />
                            </div>
                        </div>

                        {/* Remark */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                            <label className={`w-32 text-sm font-medium shrink-0 pt-2 ${theme === 'dark' ? 'text-white' : theme === 'purple' ? 'text-purple-900' : 'text-gray-700'}`}>
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
