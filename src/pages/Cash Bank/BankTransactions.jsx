// src/pages/bank/BankTransactions.jsx
import React, { useState, useEffect, useRef } from "react";
// import {
//   Save,
// } from "lucide-react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import EditModal from "../../components/modals/EditModal";
import toast from "react-hot-toast";
import PageLayout from "../../layout/PageLayout";
// import Pagination from "../../components/Pagination";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";
import { 
  getCOAHeadsApi, 
  addDebitVoucherApi, 
  addCreditVoucherApi, 
  addContraVoucherApi,
  getDebitVouchersApi,
  getCreditVouchersApi,
  getContraVouchersApi,
  updateDebitVoucherApi,
  updateCreditVoucherApi,
  updateContraVoucherApi
} from "../../services/allAPI";
import FilterBar from "../../components/FilterBar";

const BankTransactions = () => {
  const { theme } = useTheme();
  // ------------------------- Columns -------------------------
  const defaultColumns = {
    id: true,
    wdId: true,
    voucherType: true,
    date: true,
    coaHeadName: true,
    coa: true,
    description: true,
    debit: true,
    credit: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // ------------------------- Data -------------------------
  const sampleData = [
    {
      id: 1,
      wdId: "WD-001",
      voucherType: "Deposit",
      date: "2024-01-05",
      coaHeadName: "Cash In Bank",
      coa: "1002",
      description: "Customer payment received",
      debit: 0,
      credit: 5000,
    },
    {
      id: 2,
      wdId: "WD-002",
      voucherType: "Withdraw",
      date: "2024-01-07",
      coaHeadName: "Cash In Bank",
      coa: "1002",
      description: "Office purchase",
      debit: 1200,
      credit: 0,
    },
  ];

  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [coaList, setCoaList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCOA();
  }, [searchText]);

  const fetchCOA = async () => {
    try {
      const res = await getCOAHeadsApi();
      if (res.status === 200) setCoaList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {

      const [dvs, cvs, contras] = await Promise.all([
        getDebitVouchersApi(false, searchText),
        getCreditVouchersApi(false, searchText),
        getContraVouchersApi(false, searchText)
      ]);

      const allRows = [
        ...(dvs.data || []).map(r => ({ ...r, origin: 'DV' })),
        ...(cvs.data || []).map(r => ({ ...r, origin: 'CV' })),
        ...(contras.data || []).map(r => ({ ...r, origin: 'Contra' }))
      ];

      // Map to table fields
      const mapped = allRows.map(r => {
        // Find matching COA for code
        const matchedCOA = coaList.find(c => c.headName === (r.account || r.Account || r.CreditAccountHead));
        
        return {
          id: r.id || r.Id,
          wdId: r.vno || r.VNo,
          voucherType: "Bank Transaction",
          date: r.date || r.Date || r.VDate,
          coaHeadName: r.account || r.Account || r.CreditAccountHead,
          coa: matchedCOA?.headCode || r.COA || "",
          description: r.remark || r.Remark || r.Narration,
          debit: r.debit || r.Debit || 0,
          credit: r.credit || r.Credit || 0,
        };
      });

      // Sort by date desc
      mapped.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRows(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions");
    }
  };

  // ------------------------- Pagination -------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const totalRecords = rows.length;

  // ------------------------- Add Modal -------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.userId || userData?.id || userData?.Id;

  const [form, setForm] = useState({
    date: today,
    accountType: "Credit (-)", // Match Image 1
    wdId: "",
    bankAccount: "",
    amount: "0.00",
    description: "",
  });

  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [coaFilter, setCoaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const handleSave = async () => {
    if (!form.date || !form.bankAccount || !form.amount) {
      return toast.error("Please fill required fields");
    }

    try {
      setIsSaving(true);
      let res;
      // Map Account Type back to API calls
      // Credit (-) -> Withdrawal (Bank is Credited)
      // Debit (+) -> Deposit (Bank is Debited)
      if (form.accountType === "Credit (-)") {
        res = await addDebitVoucherApi({
          date: form.date,
          creditAccountHead: form.bankAccount,
          account: "Cash In Hand",
          amount: parseFloat(form.amount),
          remark: form.description,
          userId
        });
      } else {
        res = await addCreditVoucherApi({
          date: form.date,
          debitAccountHead: form.bankAccount,
          account: "Cash In Hand",
          amount: parseFloat(form.amount),
          remark: form.description,
          userId
        });
      }

      if (res && (res.status === 200 || res.status === 201)) {
        toast.success(`Transaction recorded successfully`);
        setModalOpen(false);
        setForm({
          date: today,
          accountType: "Credit (-)",
          wdId: "",
          bankAccount: "",
          amount: "0.00",
          description: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving transaction");
    } finally {
      setIsSaving(false);
    }
  };

  // ------------------------- Render -------------------------
  return (
    <>
      {/* ---------------------- ADD MODAL ---------------------- */}
      {/* ---------------------- ADD MODAL ---------------------- */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
        title="New Bank Transaction"
        width="750px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
      >
        <div className="p-0 grid grid-cols-1 gap-4">
          <InputField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />

          <SearchableSelect
            label="Account Type"
            options={[
              { id: "Credit (-)", name: "Credit (-)" },
              { id: "Debit (+)", name: "Debit (+)" }
            ]}
            value={form.accountType}
            onChange={(val) => setForm({ ...form, accountType: val })}
            required
          />

          <InputField
            label="Withdraw / Deposite ID"
            value={form.wdId}
            onChange={(e) => setForm({ ...form, wdId: e.target.value })}
            required
          />

          <SearchableSelect 
            label="Bank"
            options={coaList
              .filter(h => h.headType === 'A' && (h.parentHeadName === 'Cash At Bank' || h.headName === 'Cash In Hand'))
              .map(h => ({
                id: h.headName,
                name: `${h.headCode} - ${h.headName}`
              }))}
            value={form.bankAccount}
            onChange={(val) => setForm({ ...form, bankAccount: val })}
            placeholder="Select Bank"
            required
          />

          <InputField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            required
            formatted
          />

          <InputField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            textarea
            rows={3}
          />
        </div>
      </AddModal>


      {/* COLUMN PICKER MODAL */}
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* ---------------------- MAIN ---------------------- */}

      <ColumnPickerModal
        isOpen={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        defaultColumns={defaultColumns}
      />

      {/* ---------------------- MAIN ---------------------- */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Bank Transactions</h2>
            <hr className="mb-4 border-gray-300" />

            <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.wdId && { key: "wdId", label: "Withdraw / Deposite ID", sortable: true },
                    visibleColumns.voucherType && { key: "voucherType", label: "Voucher Type", sortable: true },
                    visibleColumns.date && { key: "date", label: "Date", sortable: true, render: (r) => r.date ? new Date(r.date).toLocaleDateString() : "" },
                    visibleColumns.coaHeadName && { key: "coaHeadName", label: "Coa Head Name", sortable: true },
                    visibleColumns.coa && { key: "coa", label: "COA", sortable: true },
                    visibleColumns.description && { key: "description", label: "Description", sortable: true },
                    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true, render: (r) => (r.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) },
                    visibleColumns.credit && { key: "credit", label: "Credit", sortable: true, render: (r) => (r.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) },
                ].filter(Boolean)}
                data={rows}
                onRowClick={null}
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => setModalOpen(true)}
                createLabel="New Transaction"
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
                total={totalRecords}
            >
              <FilterBar 
                filters={[
                  { label: "Voucher Type", value: typeFilter, onChange: setTypeFilter, options: [
                    { id: "Payment", name: "Payment" },
                    { id: "Receipt", name: "Receipt" }
                  ], placeholder: "Search..." },
                  { label: "Date", type: "date", value: dateFilter.from, onChange: (v) => setDateFilter({...dateFilter, from: v}) },
                  { label: "-", type: "date", value: dateFilter.to, onChange: (v) => setDateFilter({...dateFilter, to: v}) },
                  { label: "COA", value: coaFilter, onChange: setCoaFilter, options: coaList.map(c => ({ id: c.headName, name: c.headName })), placeholder: "Search..." }
                ]}
                onClear={() => {
                  setTypeFilter("");
                  setDateFilter({ from: "", to: "" });
                  setCoaFilter("");
                }}
                className="mb-2"
              />
            </MasterTable>
          </div>
          </ContentCard>
      </div>
      </PageLayout>
    </>
  );
};

export default BankTransactions;



