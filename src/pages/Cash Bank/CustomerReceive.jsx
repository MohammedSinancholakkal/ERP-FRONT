// src/pages/customer-receive/CustomerReceive.jsx
import { useState, useEffect} from "react";
import {
  Star,
  Pencil,
} from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
// import Pagination from "../../components/Pagination";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";
import { useNavigate, useLocation } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import { 
  getCustomerReceivablesApi, 
  searchCustomerApi, 
  addCreditVoucherApi, 
  getCreditVouchersApi,
  getCustomerByIdApi
} from "../../services/allAPI";
import toast from "react-hot-toast";

const CustomerReceive = () => {
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
  // const [inactiveRows] = useState([]); // Removed inactive logic
  // const [showInactive, setShowInactive] = useState(false); // Removed inactive logic
  const [receivablesMap, setReceivablesMap] = useState({});
  const [isSaving, setIsSaving] = useState(false); // Added isSaving state

  // ------------------ SEARCH ------------------
  const [searchText, setSearchText] = useState("");

  // ------------------ SORTING ------------------
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setPage(1); // Reset to page 1 on sort
    setSortConfig({ key, direction });
  };

  // ------------------ PAGINATION ------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;
  // const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  // const start = totalRecords ? (page - 1) * limit + 1 : 0;
  // const end = Math.min(page * limit, totalRecords);

  // ------------------ MODAL ------------------
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    voucherDate: today,
    customer: "",
    customerId: null,
    customerSearch: "",
    customerDropdown: false,
    paymentType: "",
    amount: "",
    remarks: "",
  });





  const [customerList, setCustomerList] = useState([]);
  
  useEffect(() => {
    fetchData();
    fetchReceivables();
  }, [searchText, sortConfig]); // Added sortConfig dependency

  const fetchData = async () => {
    try {
        const res = await getCreditVouchersApi(false, searchText, sortConfig.key, sortConfig.direction); // Pass sort params
        if(res.status === 200) {
             // Map backend fields to MasterTable expected fields
             const mapped = res.data.map(r => ({
                  // Create unique ID for Sale/INV entries to avoid collision with Credit Voucher IDs
                  id: (r.VType === 'INV' || r.vtype === 'INV') ? `inv-${r.Id || r.id}` : (r.Id || r.id),
                  
                  voucherNo: r.VNo || r.vno || r.InvoiceNo, 
                  voucherType: (r.VType === 'Sales' || r.vtype === 'Sales' || r.VType === 'Sale' || r.vtype === 'Sale' || r.VType === 'INV' || r.vtype === 'INV') ? 'INV' : (r.VType || r.vtype || r.Vtype || "CV"), 
                  
                  // Handle Date (Support both string ISO and Date object)
                  voucherDate: (r.Date || r.date || r.VDate) ? new Date(r.Date || r.date || r.VDate).toISOString().split('T')[0] : "",
                  
                  coaHeadName: r.Account || r.account || r.CoaHeadName || r.COA, // Customer Name
                  coa: r.DebitAccountHead || r.debitAccountHead || r.COA || r.COAId, // Display Code/Account (Bank or Code)
                  
                  narration: r.Remark || r.remark || r.Narration || r.narration,
                  
                  debit: r.Debit || r.debit || 0,
                  credit: r.Amount || r.amount || r.Credit || r.credit || 0, // Amount maps to Credit
                  
                  isInactive: r.IsActive === false || r.isActive === false
             }));
             setRows(mapped);
        }
    } catch(err) {
        console.error(err);
        toast.error("Failed to load vouchers");
    }
  };

  const fetchReceivables = async () => {
      try {
          const res = await getCustomerReceivablesApi();
          if(res.status === 200) {
              // Create map: customerId -> balance
              // API returns { id, name, balance, ... }
              const map = {};
              res.data.forEach(c => {
                  map[c.id] = c.balance;
              });
              setReceivablesMap(map);
          }
      } catch(err) {
          console.error(err);
      }
  };

  // Search logic for dropdown
  const handleCustomerSearch = async (val) => {
      try {
          const res = await searchCustomerApi(val || " ");
          if(res.status === 200) {
              setCustomerList(res.data.records || res.data || []);
          }
      } catch(err) {
          console.error(err);
      }
  };

  // Pre-load customers for dropdown initially or on search
  useEffect(() => {
     handleCustomerSearch("");
  }, []);

  // Handle return from New Customer page
  useEffect(() => {
    const handleReturn = async () => {
        const state = location.state;
        if (state?.openModalOnReturn) {
            
            // Open modal immediately
            setModalOpen(true);

            // Restore preserved state if available (e.g. amount, dates)
            if (state.preservedState) {
                setForm(prev => ({
                    ...prev,
                    ...state.preservedState
                }));
            }

            // If a new customer was created, fetch and populate it
            if (state.newCustomerId) {
                const newId = state.newCustomerId;
                try {
                    const res = await getCustomerByIdApi(newId);
                    let customerData = null;
                    if (res.status === 200) {
                        customerData = res.data.record || res.data;
                    }

                    if (customerData) {
                        const name = customerData.Name || customerData.name || customerData.CompanyName || customerData.companyName;
                        
                        setForm(prev => ({
                            ...prev,
                            customer: name,
                            customerId: newId
                        }));

                        // Ensure it's in the dropdown list too
                        setCustomerList(prev => {
                            const exists = prev.find(c => c.id == newId || c.Id == newId);
                            if (exists) return prev;
                            return [customerData, ...prev];
                        });
                        
                        fetchReceivables();
                    }
                } catch (error) {
                    console.error("Error fetching new customer", error);
                }
            }
            
            // Clear state so it doesn't run again on refresh
             navigate(location.pathname, { replace: true, state: {} });
        }
    };

    handleReturn();
  }, [location.state, navigate]);

  const handleSave = async () => {
    if (!form.voucherDate || !form.customer || !form.paymentType || !form.amount) {
      toast.error("Please fill required fields");
      return;
    }

    try {
        setIsSaving(true);
        const payload = {
            date: form.voucherDate,
            debitAccountHead: form.paymentType,
            account: form.customer, // Store Customer Name
            amount: parseFloat(form.amount),
            remark: form.remarks,
            userId
        };

        const res = await addCreditVoucherApi(payload);
        if(res.status === 200 || res.status === 201) {
            toast.success("Received successfully");
            setModalOpen(false);
            setForm({
              voucherDate: today,
              customer: "",
              customerId: null,
              customerSearch: "",
              customerDropdown: false,
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





  // client-side sort removed
  return (
    <>
      {/* ------------------ ADD MODAL ------------------ */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving} // Pass isSaving prop
        title="New Customer Receive"
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

          {/* CUSTOMER (Searchable Dropdown + renderOption) */}
          <div className="col-span-1">
             <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <SearchableSelect
                        label="Customer"
                        required
                        options={customerList.map(c => ({ 
                            id: c.id || c.Id, 
                            name: c.name || c.Name,
                            balance: receivablesMap[c.id || c.Id] 
                        }))}
                        value={form.customerId}
                        onChange={(val) => {
                            const selected = customerList.find(c => (c.id || c.Id) == val);
                            setForm({
                                ...form,
                                customer: selected?.name || selected?.Name || "",
                                customerId: val
                            });
                        }}
                        placeholder="Search Customer..."
                        onSearchBlur={(val) => handleCustomerSearch(val)}
                        renderOption={(option) => (
                           <div className="flex justify-between w-full">
                                <span>{option.name}</span>
                                {option.balance !== undefined && (
                                    <span className={`text-xs ${option.balance > 0 ? "text-green-500" : "text-gray-400"}`}>
                                        Bal: {option.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                )}
                           </div>
                        )}
                    />
                </div>
                 {/* Star icon */}
                {hasPermission(PERMISSIONS.CUSTOMERS.CREATE) && (
                  <button
                    onClick={() => {
                        const statePayload = { 
                            returnTo: "/app/cashbank/customerreceive",
                            openModalOnReturn: true,
                            preservedState: form
                        };
                        
                        if(form.customerId) {
                            navigate(`/app/businesspartners/newcustomer/${form.customerId}`, { state: statePayload });
                        } else {
                            navigate("/app/businesspartners/newcustomer", { state: statePayload });
                        }
                    }}
                    className={`p-2 border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
                  >
                    {form.customerId ? <Pencil size={18} /> : <Star size={18} />}
                  </button>
                )}
             </div>
             {/* Dynamic Balance Display below input */}
              {form.customerId && (
                  <div className="text-xs text-yellow-500 mt-1 font-medium">
                      Current Receivable: {receivablesMap[form.customerId]?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
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

      {/* ------------------ PAGE HEADER ------------------ */}


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
            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Customer Receive</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.voucherNo && { key: "voucherNo", label: "VNo", sortable: true },
                    visibleColumns.voucherType && { key: "voucherType", label: "Vtype", sortable: true },
                    visibleColumns.voucherDate && { key: "voucherDate", label: "VDate", sortable: true },
                    visibleColumns.coaHeadName && { key: "coaHeadName", label: "CoaName", sortable: true },
                    visibleColumns.coa && { key: "coa", label: "COA", sortable: true },
                    visibleColumns.narration && { key: "narration", label: "Narration", sortable: true },
                    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true, render: (r) => (r.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.credit && { key: "credit", label: "Credit", sortable: true, render: (r) => (r.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                ].filter(Boolean)}
                data={rows}
                // inactiveData={inactiveRows}
                sortConfig={sortConfig}
                onSort={handleSort}
                // onRowClick={(r) => openEditModal(r)}
                // Action Bar
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => setModalOpen(true)}
                createLabel="New Receive"
                permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={async () => {
                    setSearchText("");
                    setSortConfig({ key: "id", direction: "desc" });
                    setPage(1);
                    await fetchData();
                }}
                onColumnSelector={() => setColumnModalOpen(true)}
                // onToggleInactive={() => setShowInactive((s) => !s)} // Removed toggle inactive prop

                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={rows.length} // Temporary total since API doesn't return count wrapper for vouchers
            />
        </div>
        </ContentCard>
      </div>
      </PageLayout>
    </>
  );
};

export default CustomerReceive;



