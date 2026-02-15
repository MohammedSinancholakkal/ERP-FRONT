// src/pages/suppliers/SupplierPayment.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  Pencil,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";
import { useNavigate, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import { 
  getDebitVouchersApi, 
  searchSupplierApi, 
  addDebitVoucherApi, 
  getSupplierByIdApi, // Ensure this exists or use search
  getSupplierPayablesApi
} from "../../services/allAPI";
import toast from "react-hot-toast";

const SupplierPayment = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  // ------------------ COLUMN VISIBILITY ------------------
  const defaultColumns = {
    id: true,
    voucherNo: true,
    voucherType: true,
    voucherDate: true,
    coaHeadName: true,
    coa: true,
    narration: true,
    debit: true,
    credit: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);


  const [rows, setRows] = useState([]);
  const [payablesMap, setPayablesMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // ------------------ SEARCH ------------------
  const [searchText, setSearchText] = useState("");

  // ------------------ PAGINATION ------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;

  // ------------------ MODAL ------------------
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    voucherDate: today,
    supplier: "",
    supplierId: null,
    supplierSearch: "",
    supplierDropdown: false,
    paymentType: "",
    amount: "",
    remarks: "",
  });

  const [supplierList, setSupplierList] = useState([]);
  
  useEffect(() => {
    fetchData();
    fetchPayables();
  }, [searchText]); 

  const fetchData = async () => {
    try {
        const res = await getDebitVouchersApi(false, searchText); // Fetch Debit Vouchers (Payments)
        if(res.status === 200) {
             // Map backend fields to MasterTable expected fields
             const mapped = res.data.map(r => ({
                  // Create unique ID for Purchase entries to avoid collision with DebitVoucher IDs
                  id: (r.VType === 'Purchase' || r.vtype === 'Purchase') ? `pur-${r.Id || r.id}` : (r.Id || r.id),
                  
                  voucherNo: r.VNo || r.vno || r.InvoiceNo, 
                  voucherType: (r.VType === 'Purchase' || r.vtype === 'Purchase') ? 'PURCHASE' : (r.VType || r.vtype || "DV"), 
                  
                  // Handle Date (Support both string ISO and Date object)
                  voucherDate: (r.Date || r.date || r.VDate) ? new Date(r.Date || r.date || r.VDate).toISOString().split('T')[0] : "",
                  
                  coaHeadName: r.Account || r.account || r.CoaHeadName || r.COA, // Supplier Name or Account Name
                  coa: r.CreditAccountHead || r.creditAccountHead || r.COA || r.COAId, // Display Code/Account
                  narration: r.Remark || r.remark || r.Narration,
                  
                  debit: r.Amount || r.amount || r.Debit || r.debit || 0, // Amount maps to Debit
                  credit: r.Credit || r.credit || 0,
                  
                  isInactive: r.IsActive === false || r.isActive === false
             }));
             
             setRows(mapped);
        }
    } catch(err) {
        console.error(err);
        toast.error("Failed to load vouchers");
    }
  };

  const fetchPayables = async () => {
      try {
          const res = await getSupplierPayablesApi();
          if(res.status === 200) {
              // API returns { id, name, balance, ... }
              const map = {};
              res.data.forEach(s => {
                  map[s.id] = s.balance;
              });
              setPayablesMap(map);
          }
      } catch(err) {
          console.error(err);
      }
  };

  // Search logic for dropdown
  const handleSupplierSearch = async (val) => {
      try {
          const res = await searchSupplierApi(val || " ");
          if(res.status === 200) {
              setSupplierList(res.data.records || res.data || []);
          }
      } catch(err) {
          console.error(err);
      }
  };

  // Pre-load suppliers for dropdown
  useEffect(() => {
     handleSupplierSearch("");
  }, []);

  // Handle return from New Supplier page
  useEffect(() => {
    const handleReturn = async () => {
        const state = location.state;
        if (state?.openModalOnReturn) {
            
            setModalOpen(true);

            if (state.preservedState) {
                setForm(prev => ({
                    ...prev,
                    ...state.preservedState
                }));
            }

            if (state.newSupplierId) {
                const newId = state.newSupplierId;
                try {
                    // Try getting by ID if available, else search
                    const res = await getSupplierByIdApi(newId); 
                    let supplierData = null;
                    if (res.status === 200) {
                        supplierData = res.data.record || res.data;
                    }

                    if (supplierData) {
                        const name = supplierData.Name || supplierData.name || supplierData.CompanyName || supplierData.companyName;
                        
                        setForm(prev => ({
                            ...prev,
                            supplier: name,
                            supplierId: newId
                        }));

                        setSupplierList(prev => {
                            const exists = prev.find(s => s.id == newId || s.Id == newId);
                            if (exists) return prev;
                            return [supplierData, ...prev];
                        });
                        
                        fetchPayables();
                    }
                } catch (error) {
                    console.error("Error fetching new supplier", error);
                }
            }
            
             navigate(location.pathname, { replace: true, state: {} });
        }
    };

    handleReturn();
  }, [location.state, navigate]);

  const handleSave = async () => {
    if (!form.voucherDate || !form.supplier || !form.paymentType || !form.amount) {
      toast.error("Please fill required fields");
      return;
    }

    try {
        setIsSaving(true);
        const payload = {
            date: form.voucherDate,
            creditAccountHead: form.paymentType, // Cash/Bank (Credit for Payment)
            account: form.supplier, // Supplier Name
            amount: parseFloat(form.amount),
            remark: form.remarks,
            userId
        };

        const res = await addDebitVoucherApi(payload);
        if(res.status === 200 || res.status === 201) {
            toast.success("Payment recorded successfully");
            setModalOpen(false);
            setForm({
              voucherDate: today,
              supplier: "",
              supplierId: null,
              supplierSearch: "",
              supplierDropdown: false,
              paymentType: "",
              amount: "",
              remarks: "",
            });
            fetchData();
        } else {
            toast.error("Failed to save");
        }
    } catch(err) {
        console.error(err);
        toast.error("Error saving voucher");
    } finally {
        setIsSaving(false);
    }
  };


  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setPage(1); // Reset to page 1 on sort
    setSortConfig({ key, direction });
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <>
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving} 
        title="New Supplier Payment"
        width="750px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="p-0 grid grid-cols-1 gap-4">
          {/* Voucher Date */}
          <InputField
            label="Voucher Date"
            type="date"
            value={form.voucherDate}
            onChange={(e) => setForm({ ...form, voucherDate: e.target.value })}
            required
          />

          {/* PAYMENT TYPE */}
          <SearchableSelect
            label="Payment Type"
            required
            options={[
              { id: "Cash At Hand", name: "Cash At Hand" },
              { id: "Cash At Bank", name: "Cash At Bank" }
            ]}
            value={form.paymentType}
            onChange={(val) => setForm({ ...form, paymentType: val })}
            placeholder="Select Payment Type"
          />

          {/* SUPPLIER (Searchable Dropdown + renderOption) */}
          <div className="col-span-1">
             <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <SearchableSelect
                        label="Supplier"
                        required
                        options={supplierList.map(s => ({ 
                            id: s.id || s.Id, 
                            name: s.name || s.Name || s.CompanyName,
                            balance: payablesMap[s.id || s.Id] 
                        }))}
                        value={form.supplierId}
                        onChange={(val) => {
                            const selected = supplierList.find(s => (s.id || s.Id) == val);
                            setForm({
                                ...form,
                                supplier: selected?.name || selected?.Name || selected?.CompanyName || "",
                                supplierId: val
                            });
                        }}
                        placeholder="Search Supplier..."
                        onSearchBlur={(val) => handleSupplierSearch(val)}
                        renderOption={(option) => (
                           <div className="flex justify-between w-full">
                                <span>{option.name}</span>
                                {option.balance !== undefined && (
                                    <span className={`text-xs ${option.balance > 0 ? "text-red-500" : "text-gray-400"}`}>
                                        Payable: {option.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                )}
                           </div>
                        )}
                    />
                </div>
                {/* Star icon */}
                {hasPermission(PERMISSIONS.SUPPLIERS.CREATE) && (
                  <button
                    onClick={() => {
                        const statePayload = { 
                            returnTo: "/app/cashbank/supplierpayment",
                            openModalOnReturn: true,
                            preservedState: form
                        };
                        
                        if(form.supplierId) {
                            navigate(`/app/businesspartners/newsupplier/${form.supplierId}`, { state: statePayload });
                        } else {
                            navigate("/app/businesspartners/newsupplier", { state: statePayload });
                        }
                    }}
                    className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                  >
                    {form.supplierId ? <Pencil size={18} /> : <Star size={18} />}
                  </button>
                )}
             </div>
             {/* Dynamic Balance Display below input */}
              {form.supplierId && (
                  <div className="text-xs text-red-500 mt-1 font-medium">
                      Current Payable: {payablesMap[form.supplierId]?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                  </div>
              )}
          </div>

          {/* AMOUNT */}
          <InputField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            formatted
          />

          {/* Remarks */}
          <InputField
            label="Remarks (optional)"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            textarea
            rows={2}
          />
        </div>
      </AddModal>

       {/* COLUMN PICKER */}
       <ColumnPickerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          defaultColumns={defaultColumns}
        />

      {/* ------------------ PAGE HEADER ------------------ */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
           <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Supplier Payment</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.voucherNo && { key: "voucherNo", label: "Voucher No", sortable: true },
                    visibleColumns.voucherType && { key: "voucherType", label: "Voucher Type", sortable: true },
                    visibleColumns.voucherDate && { key: "voucherDate", label: "Voucher Date", sortable: true },
                    visibleColumns.coaHeadName && { key: "coaHeadName", label: "Coa Head Name", sortable: true },
                    visibleColumns.coa && { key: "coa", label: "COA", sortable: true },
                    visibleColumns.narration && { key: "narration", label: "Narration", sortable: true },
                    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true, render: (r) => (r.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.credit && { key: "credit", label: "Credit", sortable: true, render: (r) => (r.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                ].filter(Boolean)}
                data={sortedRows}
                sortConfig={sortConfig}
                onSort={handleSort}
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => setModalOpen(true)}
                createLabel="New Payment"
                permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    fetchData();
                }}
                onColumnSelector={() => setColumnModalOpen(true)}

                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={rows.length}
            />
        </div>
        </ContentCard>
      </div>
      </PageLayout>
    </>
  );
};

export default SupplierPayment;
