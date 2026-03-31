import React, { useState, useEffect } from "react";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import EditModal from "../../components/modals/EditModal";
import PageLayout from "../../layout/PageLayout";
import AddModal from "../../components/modals/AddModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { useTheme } from "../../context/ThemeContext";
import InputField from "../../components/InputField";
import SearchableSelect from "../../components/SearchableSelect";
import { getCOAHeadsApi, getCashAdjustmentsApi, addCashAdjustmentApi } from "../../services/allAPI";
import { showSuccessToast, showErrorToast } from "../../utils/notificationUtils";

const CashAdjustment = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (user) setCurrentUser(user);
  }, []);

  /* --------------------------- Column Picker --------------------------- */
  const defaultColumns = {
    id: true,
    voucherName: true,
    voucherType: true,
    voucherDate: true,
    coaHeadName: true,
    coa: true,
    remarks: true,
    debit: true,
    amount: true,
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  /* ------------------------------- Data ------------------------------- */
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [coaList, setCoaList] = useState([]);
  
  /* ---------------------------- PAGINATION ---------------------------- */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  /* ---------------------------- SORTING ---------------------------- */
  const [sortConfig, setSortConfig] = useState({ key: "voucherDate", direction: "desc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setPage(1);
    setSortConfig({ key, direction });
  };

  const fetchData = async () => {
    try {
      // Map frontend keys to backend columns if necessary. 
      // For CashAdjustment, the API expects a sort string.
      let sortStr = "t.VDate DESC, t.Id DESC";
      if (sortConfig.key === "id") sortStr = "t.Id";
      else if (sortConfig.key === "voucherNo" || sortConfig.key === "voucherName") sortStr = "t.VNo";
      else if (sortConfig.key === "voucherDate") sortStr = "t.VDate";
      else if (sortConfig.key === "amount") sortStr = "t.Amount";

      const res = await getCashAdjustmentsApi(page, limit, false, searchText, sortStr, sortConfig.direction.toUpperCase());
      if (res.status === 200) {
        setRows(res.data.records);
        setTotalRecords(res.data.total);
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to fetch cash adjustments");
    }
  };

  useEffect(() => {
    getCOAHeadsApi().then((res) => {
      if (res.status === 200) setCoaList(res.data);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, searchText, sortConfig]);

  const onRefresh = () => {
    setSearchText("");
    setPage(1);
    setLimit(25);
    setSortConfig({ key: "voucherDate", direction: "desc" });
    fetchData();
  };

  /* ------------------------------ Modal ------------------------------ */
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [newAdj, setNewAdj] = useState({
    date: today,
    type: "",
    coaHeadName: "",
    coa: "",
    amount: "",
    remarks: "",
  });

  const handleAdd = async () => {
    if (
      !newAdj.date ||
      !newAdj.type ||
      !newAdj.coa ||
      !newAdj.amount ||
      !newAdj.remarks
    ) {
      showErrorToast("❗ All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const reqBody = {
        date: newAdj.date,
        type: newAdj.type,
        coa: newAdj.coa,
        amount: newAdj.amount,
        remarks: newAdj.remarks,
        userId: currentUser?.id
      };
      
      const res = await addCashAdjustmentApi(reqBody);
      if (res.status === 201 || res.status === 200) {
        showSuccessToast("Cash adjustment created successfully");
        setModalOpen(false);
        setNewAdj({
          date: today,
          type: "",
          coaHeadName: "",
          coa: "",
          amount: "",
          remarks: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Error creating adjustment");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ Render ------------------------------ */
  return (
    <>
      {/* --------------------------- ADD MODAL --------------------------- */}
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Cash Adjustment"
        width="700px"
        permission={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
        loading={loading}
      >
        <div className="p-0 space-y-4">
          <InputField
            label="Voucher Date *"
            type="date"
            value={newAdj.date}
            onChange={(e) => setNewAdj({ ...newAdj, date: e.target.value })}
          />

          <SearchableSelect
            label="Adjustment Type *"
            value={newAdj.type}
            onChange={(val) => setNewAdj({ ...newAdj, type: val })}
            options={[
              { id: "Debit", name: "Debit (-)" },
              { id: "Credit", name: "Credit (+)" }
            ]}
            placeholder="Select Type"
          />

          <SearchableSelect 
            label="Offsetting Account *"
            options={coaList.map(h => ({
                id: h.headName,
                name: `${h.headCode} - ${h.headName}`
            }))}
            value={newAdj.coaHeadName}
            onChange={(val) => {
                const selected = coaList.find(c => c.headName === val);
                setNewAdj({ 
                    ...newAdj, 
                    coaHeadName: val,
                    coa: selected ? selected.headCode : newAdj.coa
                });
            }}
            placeholder="Select Account Head"
          />

          <InputField
            label="COA *"
            value={newAdj.coa}
            readOnly
            placeholder="Auto-filled"
          />

          <InputField
            label="Amount *"
            type="number"
            value={newAdj.amount}
            onChange={(e) => setNewAdj({ ...newAdj, amount: e.target.value })}
            placeholder="0"
            formatted
          />

          <InputField
            label="Remarks *"
            textarea
            value={newAdj.remarks}
            onChange={(e) => setNewAdj({ ...newAdj, remarks: e.target.value })}
            rows={2}
          />
        </div>
      </AddModal>

       <ColumnPickerModal
        isOpen={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        defaultColumns={defaultColumns}
      />

      {/* --------------------------- MAIN PAGE --------------------------- */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">
            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Cash Adjustment</h2>
            <hr className="mb-4 border-gray-300" />

             <MasterTable
                columns={[
                    visibleColumns.id && { key: "id", label: "ID", sortable: true },
                    visibleColumns.voucherName && { key: "voucherName", label: "Voucher No", sortable: true },
                    visibleColumns.voucherType && { key: "voucherType", label: "Voucher Type", sortable: true, render: (r) => r.voucherType },
                    visibleColumns.voucherDate && { key: "voucherDate", label: "Voucher Date", sortable: true, render: (r) => new Date(r.voucherDate).toLocaleDateString() },
                    visibleColumns.coaHeadName && { key: "coaHeadName", label: "Coa Head Name", sortable: true },
                    visibleColumns.coa && { key: "coa", label: "Coa", sortable: true },
                    visibleColumns.remarks && { key: "remarks", label: "Remark", sortable: true },
                    visibleColumns.debit && { key: "debit", label: "Debit", sortable: true, render: (r) => (r.debit || 0) == 0 ? "0" : (r.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) },
                    visibleColumns.amount && { key: "amount", label: "Amount", sortable: true, render: (r) => (r.amount || 0) == 0 ? "0" : (r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) },
                ].filter(Boolean)}
                data={rows}
                
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                onCreate={() => setModalOpen(true)}
                createLabel="New Cash Adjustment"
                permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={onRefresh}
                onColumnSelector={() => setColumnModalOpen(true)}
                sortConfig={sortConfig}
                onSort={handleSort}

                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={totalRecords}
            />
          </div>
          </ContentCard>
      </div>
      </PageLayout>

    </>
  );
};

export default CashAdjustment;
