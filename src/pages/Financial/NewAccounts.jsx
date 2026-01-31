import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getCOAHeadsApi, addCOAHeadApi, updateCOAHeadApi, deleteCOAHeadApi } from '../../services/allAPI';
import { showSuccessToast, showErrorToast, showDeleteConfirm } from '../../utils/notificationUtils';
import InputField from '../../components/InputField'; 
import ContentCard from '../../components/ContentCard';
import SearchableSelect from '../../components/SearchableSelect';
import PageLayout from '../../layout/PageLayout';

const NewAccounts = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    
    // State passed from navigation 
    const initialParent = location.state?.parentNode || null;
    const editAccount = location.state?.account || null;
    const isEditMode = !!editAccount;

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        headName: '',
        parentHead: initialParent ? initialParent.headCode : '',
        parentHeadName: initialParent ? initialParent.headName : '',
        headLevel: initialParent ? initialParent.headLevel + 1 : '',
        headType: initialParent ? initialParent.headType : '',
        headCode: '',
        isTransaction: false,
        isGL: false
    });

    const isDark = theme === 'dark' || theme === 'slate';
    const userId = 1;

    // Helper to generate next code
    const generateNextCode = (parent, allAccounts) => {
        if (!parent) {
             // Root Level Generation (1-5 Priority)
             const roots = allAccounts.filter(a => a.parentHead === '0' || !a.parentHead);
             const existingCodes = roots.map(r => parseInt(r.headCode)).filter(n => !isNaN(n));
             
             let newCode = '1';
             for (let i = 1; i <= 5; i++) {
                 if (!existingCodes.includes(i)) {
                     newCode = i.toString();
                     break;
                 }
             }
             
             // If 1-5 taken, generate next available
             if (existingCodes.includes(parseInt(newCode))) {
                 if (roots.length > 0) {
                    const maxCode = Math.max(...existingCodes);
                    newCode = (maxCode + 1).toString();
                 }
             }

             // Map Code to Type for Roots
             let newType = 'A';
             switch(newCode) {
                 case '1': newType = 'A'; break; // Asset
                 case '2': newType = 'EQ'; break; // Equity
                 case '3': newType = 'I'; break; // Income
                 case '5': newType = 'L'; break; // Liability
                 case '4': newType = 'E'; break; // Expense
                 default: newType = 'A';
             }

             setFormData(prev => ({ 
                 ...prev, 
                 headCode: newCode,
                 headType: newType,
                 parentHeadName: 'COA',
                 headLevel: 1,
                 parentHead: '0'
             }));
             return;
        }

        // Find all direct children
        // Robust comparison for children finding (handles "1" vs "001" mismatch)
        const children = allAccounts.filter(a => {
             if(!a.parentHead) return false;
             // Compare as strings first
             if (String(a.parentHead).trim() === String(parent.headCode).trim()) return true;
             // Compare as numbers (handle 001 vs 1)
             try {
                 return BigInt(a.parentHead) === BigInt(parent.headCode);
             } catch(e) {
                 return false;
             }
        });
        
        // Clean parent code (remove leading zeros) for prefixing
        const cleanParentCode = BigInt(parent.headCode).toString();

        if(children.length > 0) {
            // Find max child code
            const lastChild = children.reduce((prev, current) => {
                return (BigInt(current.headCode) > BigInt(prev.headCode)) ? current : prev;
            });
            const lastCode = BigInt(lastChild.headCode);
            setFormData(prev => ({ ...prev, headCode: (lastCode + 1n).toString() }));
        } else {
            // First child: ParentCode + '01'
            setFormData(prev => ({ ...prev, headCode: `${cleanParentCode}01` }));
        }
    };

    // Fetch Accounts on Mount to populate Dropdown
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await getCOAHeadsApi();
                if(Array.isArray(res.data)){
                    setAccounts(res.data);
                    
                    if (isEditMode) {
                        // Data Correction helpers for Root Accounts
                        let finalCode = editAccount.headCode;
                        let finalParentName = editAccount.parentHeadName;
                        let finalType = editAccount.headType;
                        
                        const isRoot = editAccount.headLevel === 1 || editAccount.parentHead === '0' || !editAccount.parentHead;

                        if (isRoot) {
                            // 1. Fix Code: "001" -> "1"
                            finalCode = String(parseInt(editAccount.headCode, 10));

                            // 2. Fix Parent Name: -> "COA"
                            if (!finalParentName) {
                                finalParentName = "COA";
                            }

                            // 3. Fix Type: 1->A, etc.
                            if (!finalType) {
                                switch(finalCode) {
                                     case '1': finalType = 'A'; break; // Asset
                                     case '2': finalType = 'EQ'; break; // Equity
                                     case '3': finalType = 'I'; break; // Income
                                     case '4': finalType = 'E'; break; // Expense
                                     case '5': finalType = 'L'; break; // Liability
                                     default: finalType = 'A';
                                 }
                            }
                        }

                        setFormData({
                            headName: editAccount.headName,
                            parentHead: editAccount.parentHead,
                            parentHeadName: finalParentName,
                            headLevel: editAccount.headLevel,
                            headType: finalType,
                            headCode: finalCode,
                            isTransaction: editAccount.isTransaction,
                            isGL: editAccount.isGL
                        });
                    } else if(initialParent) {
                        generateNextCode(initialParent, res.data);
                    } else {
                        // NEW ACCOUNT - ROOT
                        generateNextCode(null, res.data);
                    }
                }
            } catch (error) {
                console.error(error);
                showErrorToast("Failed to load accounts list");
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, [initialParent, isEditMode, editAccount]);

    const handleParentChange = (selectedCode) => {
        if (!selectedCode) {
            if(!isEditMode) {
                // Determine next root code
                generateNextCode(null, accounts);
            }
            return;
        }

        const parent = accounts.find(a => a.headCode === String(selectedCode));
        if (parent) {
            setFormData(prev => ({
                ...prev,
                parentHead: parent.headCode,
                parentHeadName: parent.headName,
                headLevel: parent.headLevel + 1,
                headType: parent.headType,
            }));
            if(!isEditMode) {
                generateNextCode(parent, accounts);
            }
        }
    };

    // Auto-fill on blur of search input
    const handleSmartSelection = (term) => {
        if (!term) return;
        // Try to find exact match or close match by Code or Name
        const match = accounts.find(acc => 
            acc.headName.toLowerCase() === term.toLowerCase() || 
            acc.headCode === term
        );

        if (match) {
            handleParentChange(match.headCode);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        if (!formData.headName) {
            showErrorToast("Head Name is required");
            return;
        }
        // Parent Head is no longer required (root accounts have no parent)

        setSaving(true);
        try {
            if (isEditMode) {
                await updateCOAHeadApi(editAccount.id, { ...formData, userId });
                showSuccessToast("Account Updated Successfully");
            } else {
                await addCOAHeadApi({ ...formData, userId });
                showSuccessToast("Account Saved Successfully");
            }
            navigate('/app/financial/chartofaccounts');
        } catch (error) {
            showErrorToast(error.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditMode) return;
        const result = await showDeleteConfirm(`Delete ${editAccount.headName}?`, "This cannot be undone.");
        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            await deleteCOAHeadApi(editAccount.id, { userId });
            showSuccessToast("Account Deleted Successfully");
            navigate('/app/financial/chartofaccounts');
        } catch (error) {
            showErrorToast(error.response?.data?.message || "Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            headName: '',
            parentHead: '',
            parentHeadName: '',
            headLevel: '',
            headType: '',
            headCode: '',
            isTransaction: false,
            isGL: false
        });
    };

    // Prepare options for SearchableSelect
    const parentOptions = useMemo(() => {
        return accounts
            .filter(acc => !acc.isTransaction)
            .map(acc => ({
                id: acc.headCode,
                name: `${acc.headCode} - ${acc.headName}`
            }));
    }, [accounts]);

    const labelClass = `w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`;

    return (
        <PageLayout>
             <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
                <ContentCard>
                    
                    {/* HEADER & ACTIONS */}
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-4">
                             <button 
                                onClick={() => navigate(-1)}
                                className={`${theme === 'emerald' ? 'hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 hover:bg-purple-100 text-purple-800' : 'hover:bg-gray-700'} p-2 rounded-full`}
                             >
                                <ArrowLeft size={24} />
                             </button>
                             <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE] bg-clip-text text-transparent bg-gradient-to-r from-[#6448AE] to-[#8066a3]' : theme === 'emerald' ? 'text-gray-800' : 'text-white'}`}>
                                {isEditMode ? 'Edit Account' : 'New Account'}
                             </h2>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             <button 
                                onClick={handleSave}
                                disabled={saving || deleting}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors shadow-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed ${theme === 'emerald' || theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6] text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
                             >
                                {saving ? (
                                   <>
                                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                     {isEditMode ? 'Updating...' : 'Saving...'}
                                   </>
                                ) : (
                                   <>
                                     <Save size={18} /> {isEditMode ? 'Update' : 'Save'}
                                   </>
                                )}
                             </button>

                             {isEditMode && (
                                 <button 
                                    onClick={handleDelete}
                                    disabled={saving || deleting}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-500 hover:bg-red-600 text-white shadow-md font-medium disabled:opacity-60 disabled:cursor-not-allowed`}
                                 >
                                    {deleting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} /> Delete
                                        </>
                                    )}
                                 </button>
                             )}
                        </div>
                    </div>
                    
                    <hr className="mb-6 border-gray-300 opacity-30" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto h-[calc(100%-80px)] px-1">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <label className={labelClass}>Head Name <span className="text-red-500">*</span></label>
                                <div className="flex-1">
                                    <InputField 
                                        name="headName"
                                        value={formData.headName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center">
                                <label className={labelClass}>Parent Head</label>
                                <div className="flex-1">
                                    <SearchableSelect 
                                        options={parentOptions}
                                        value={formData.parentHead}
                                        onChange={handleParentChange}
                                        onSearchBlur={handleSmartSelection}
                                        placeholder="--select--"
                                        className={`${theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}`}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center">
                                <label className={labelClass}>Head Level</label>
                                <div className="flex-1">
                                    <InputField 
                                        disabled
                                        value={formData.headLevel}
                                        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <label className={labelClass}>Head Code</label>
                                <div className="flex-1">
                                    <InputField 
                                        disabled
                                        value={formData.headCode}
                                        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className={labelClass}>P Head Name</label>
                                <div className="flex-1">
                                    <InputField 
                                        disabled
                                        value={formData.parentHeadName}
                                        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className={labelClass}>Head Type</label>
                                <div className="flex-1">
                                    <InputField 
                                        disabled
                                        value={formData.headType}
                                        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center pl-32 gap-8 pt-1">
                                <label className={`flex items-center gap-2 cursor-pointer ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
                                     <input 
                                        type="checkbox" 
                                        name="isTransaction" 
                                        checked={formData.isTransaction} 
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-gray-300"
                                     />
                                     <span className="text-sm font-medium">Is Transaction</span>
                                </label>
                                
                                <label className={`flex items-center gap-2 cursor-pointer ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
                                     <input 
                                        type="checkbox" 
                                        name="isGL" 
                                        checked={formData.isGL} 
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-gray-300"
                                     />
                                     <span className="text-sm font-medium">Is GL</span>
                                </label>
                            </div>
                        </div>
                    </div>

                </ContentCard>
            </div>
        </PageLayout>
    );
};

export default NewAccounts;
