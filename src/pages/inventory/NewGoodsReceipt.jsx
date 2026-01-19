// src/pages/inventory/NewGoodsReceipt.jsx
import { ArrowLeft, Save, Plus, Trash2, Edit, X, ArchiveRestore } from 'lucide-react'
import { useNavigate, useParams ,useLocation} from 'react-router-dom'
import PageLayout from "../../layout/PageLayout"
import { showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
import { useEffect, useState } from 'react'
import {
  getSuppliersApi,
  getEmployeesApi,
  getWarehousesApi,  
  getProductsApi,
  getPurchasesApi,
  addGoodsReceiptApi,
  getGoodsReceiptByIdApi,
  updateGoodsReceiptApi,
  deleteGoodsReceiptApi,
  restoreGoodsReceiptApi
} from '../../services/allAPI'

import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import AddModal from "../../components/modals/AddModal";
import InputField from "../../components/InputField";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";

function NewGoodsReceipt() {
  const navigate = useNavigate()
  const { id } = useParams()

 const location = useLocation()
 const { theme } = useTheme();

  const mode = location.state?.mode || "edit"
  const isRestoreMode = mode === "restore"

  const [isReadonly, setIsReadonly] = useState(isRestoreMode)



  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = userData?.userId || userData?.id || userData?.Id

  // --- TOP SECTION STATE ---
  const [purchase, setPurchase] = useState('')
  const [supplier, setSupplier] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [employee, setEmployee] = useState('')
  const [reference, setReference] = useState('')

  // --- DROPDOWN DATA ---
  const [purchasesList, setPurchasesList] = useState([])
  const [suppliersList, setSuppliersList] = useState([])
  const [employeesList, setEmployeesList] = useState([])
  const [warehousesList, setWarehousesList] = useState([])
  const [productsList, setProductsList] = useState([])

  // --- LINE ITEMS STATE ---
  const [rows, setRows] = useState([])
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)


  // --- MODAL ITEM STATE ---
  const [newItem, setNewItem] = useState({
    productId: '',
    productName: '',
    warehouseId: '',
    warehouseName: '',
    quantity: 0,
    description: ''
  })

  // whether supplier field is locked (non-editable) because it was auto-filled from purchase
  const [supplierLocked, setSupplierLocked] = useState(false)
  const [supplierDisplayName, setSupplierDisplayName] = useState('')

  // --- BOTTOM SECTION STATE ---
  const [remarks, setRemarks] = useState('')
  const [journalRemarks, setJournalRemarks] = useState('')

  // --- CALCULATED VALUES ---
  const [totalQuantity, setTotalQuantity] = useState(0)

  useEffect(() => {
    (async () => {
      await fetchEmployees()
      await fetchWarehouses()
      await fetchProducts()
      await fetchPurchases()
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (purchase) {
        const purchases = await fetchPurchases()
        const suppliers = await fetchSuppliers()

        // try to find supplier info from the selected purchase
        const selectedPurchase = (purchases || []).find(p => String(p.id) === String(purchase))
        if (selectedPurchase && (selectedPurchase.supplierId || selectedPurchase.supplierName)) {
          // If supplierId exists, set it; otherwise try to map by name
          if (selectedPurchase.supplierId) {
            setSupplier(selectedPurchase.supplierId)
            setSupplierLocked(true)
            // set display name from purchase or suppliers
            setSupplierDisplayName(selectedPurchase.supplierName || ((suppliers || []).find(s => String(s.id) === String(selectedPurchase.supplierId))?.name || ''))
          } else if (selectedPurchase.supplierName) {
            // attempt to find supplier by name in the recently fetched suppliers list
            const found = (suppliers || []).find(s => (s.name || '').toLowerCase() === (selectedPurchase.supplierName || '').toLowerCase())
            if (found) {
              setSupplier(found.id)
              setSupplierLocked(true)
              setSupplierDisplayName(found.name)
            } else {
              // no matching supplier found — clear selection and unlock
              setSupplier('')
              setSupplierLocked(true)
              setSupplierDisplayName(selectedPurchase.supplierName || '')
            }
          }
        } else {
          // purchase has no supplier info; ensure supplier unlocked
          setSupplierLocked(false)
          setSupplierDisplayName('')
        }
      } else {
        // clear suppliers and selection when no purchase
        setSuppliersList([])
        setSupplier('')
        setSupplierDisplayName('')
      }
    })()
  }, [purchase])

  // --- FETCH GOODS RECEIPT FOR EDIT ---
  useEffect(() => {
    if (id) {
      fetchGoodsReceiptDetails(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliersApi(1, 1000)
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : []
        const normalized = records.map(r => ({
          id: r.id ?? r.Id,
          name: r.name ?? r.Name ?? r.companyName ?? r.CompanyName ?? ''
        }))
        setSuppliersList(normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching suppliers", error)
      return []
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await getEmployeesApi(1, 1000)
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : []
        const normalized = records.map(r => ({
          id: r.id ?? r.Id,
          name: r.name ?? r.Name ?? r.firstName ?? r.FirstName ?? ''
        }))
        setEmployeesList(normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching employees", error)
      return []
    }
  }

  const fetchWarehouses = async () => {
    try {
      const res = await getWarehousesApi(1, 1000)
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : []
        const normalized = records.map(r => ({
          id: r.id ?? r.Id,
          name: r.name ?? r.Name ?? r.WarehouseName ?? ''
        }))
        setWarehousesList(normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching warehouses", error)
      return []
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await getProductsApi(1, 1000)
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : []
        const normalized = records.map(p => ({
          ...p,
          id: p.id ?? p.Id,
          name: p.ProductName ?? p.name ?? p.Product ?? ''
        }))
        setProductsList(normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching products", error)
      return []
    }
  }

  const fetchPurchases = async () => {
    try {
      const res = await getPurchasesApi(1, 1000)
      // console.log(res);

      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : []
        const normalized = records.map(r => ({
          id: r.id ?? r.Id ?? r.PurchaseId,
          reference: r.reference ?? r.Reference ?? r.VNo ?? r.invoiceNo ?? '',
          name: r.reference ?? r.Reference ?? r.VNo ?? r.invoiceNo ?? '',
          supplierId: r.SupplierId ?? r.supplierId ?? r.Supplier?.id ?? r.supplier?.id ?? r.supplierId ?? r.SupplierId,
          supplierName: r.SupplierName ?? r.supplierName ?? r.Supplier?.name ?? r.supplier?.name ?? r.Supplier?.companyName ?? ''
        }))
        setPurchasesList(normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching purchases", error)
      return []
    }
  }

  const fetchGoodsReceiptDetails = async (receiptId) => {
    try {
      const res = await getGoodsReceiptByIdApi(receiptId)
      if (res.status === 200) {
        const { receipt, details } = res.data

        // populate top fields
        setPurchase(receipt.PurchaseId)
        setSupplier(receipt.SupplierId)
        setDate(receipt.Date?.split('T')[0] || new Date().toISOString().split('T')[0])
        setEmployee(receipt.EmployeeId)
        setReference(receipt.Reference || '')
        setRemarks(receipt.Remarks || '')
        setJournalRemarks(receipt.JournalRemarks || '')

        // Map details to rows
        const mappedRows = (details || []).map(d => ({
          productId: d.productId ?? d.ProductId,
          productName: d.productName ?? d.ProductName,
          warehouseId: d.warehouseId ?? d.WarehouseId,
          warehouseName: d.warehouseName ?? d.WarehouseName,
          quantity: d.quantity ?? d.Quantity,
          description: d.description ?? (d.Description || '')
        }))
        setRows(mappedRows)

        // ensure option lists are loaded so selected labels render
        const purchases = await fetchPurchases()
        const suppliers = await fetchSuppliers()
        await fetchEmployees()
        await fetchWarehouses()
        await fetchProducts()

        // set supplier display name and lock supplier when loading an existing receipt
        if (receipt.SupplierName) {
          setSupplierDisplayName(receipt.SupplierName)
        } else if (receipt.SupplierId) {
          const found = (suppliers || []).find(s => String(s.id) === String(receipt.SupplierId))
          if (found) setSupplierDisplayName(found.name)
        }
        setSupplierLocked(true)

        // readonly check for inactive records
      const inactiveFromDb =
  receipt.IsActive === 0 ||
  receipt.isActive === 0 ||
  receipt.IsActive === false ||
  receipt.isActive === false

// 🔥 Respect navigation mode first
if (isRestoreMode || inactiveFromDb) {
  setIsReadonly(true)
}


      }
    } catch (error) {
      console.error("Error fetching goods receipt details", error)
      showErrorToast("Failed to load goods receipt details")
    }
  }

  // --- MODAL HANDLERS ---
  const openItemModal = () => {
    if (isReadonly) return
    setEditingIndex(null)
    setNewItem({
      productId: '',
      productName: '',
      warehouseId: '',
      warehouseName: '',
      quantity: 0,
      description: ''
    })
    setIsItemModalOpen(true)
  }

  const addItemToTable = () => {
    const descLen = newItem.description?.trim().length || 0;
    if (newItem.description && (descLen < 2 || descLen > 300)) return showErrorToast('Description must be between 2 and 300 characters');

    if (!newItem.productId || !newItem.warehouseId || newItem.quantity <= 0) {
      showErrorToast('Please fill all fields and ensure quantity > 0')
      return
    }

    if (editingIndex !== null) {
      const updatedRows = [...rows]
      updatedRows[editingIndex] = newItem
      setRows(updatedRows)
      setEditingIndex(null)
    } else {
      setRows([...rows, { ...newItem }])
    }
    setIsItemModalOpen(false)
  }

  const editRow = (index) => {
    if (isReadonly) return
    setEditingIndex(index)
    setNewItem(rows[index])
    setIsItemModalOpen(true)
  }

  const deleteRow = (index) => {
    if (isReadonly) return
    setRows(rows.filter((_, i) => i !== index))
  }

  // --- MAIN CALCULATION ---
  useEffect(() => {
    let sum = 0
    rows.forEach(r => sum += parseFloat(r.quantity) || 0)
    setTotalQuantity(sum)
  }, [rows])

  // --- SAVE / UPDATE ---
  const handleSaveReceipt = async () => {
    if (isReadonly) return
    if (!purchase) return showErrorToast('Please select a purchase')
    if (!supplier) return showErrorToast('Please select a supplier')
    if (!employee) return showErrorToast('Please select an employee')
    if (rows.length === 0) return showErrorToast('Please add at least one item')

    const remarksLen = remarks?.trim().length || 0;
    if (remarks && (remarksLen < 2 || remarksLen > 300)) return showErrorToast('Remarks must be between 2 and 300 characters');

    const journalLen = journalRemarks?.trim().length || 0;
    if (journalRemarks && (journalLen < 2 || journalLen > 300)) return showErrorToast('Journal Remarks must be between 2 and 300 characters');

    const payload = {
      supplierId: supplier,
      purchaseId: purchase,
      date,
      totalQuantity: totalQuantity,
      employeeId: employee,
      remarks,
      journalRemarks,
      reference,
      items: rows.map(r => ({
        productId: r.productId,
        productName: r.productName,
        warehouseId: r.warehouseId,
        warehouseName: r.warehouseName,
        quantity: parseFloat(r.quantity) || 0,
        description: r.description
      })),
      userId
    }

    try {
      const res = await addGoodsReceiptApi(payload)
      if (res.status === 200) {
        showSuccessToast('Goods receipt saved successfully')
navigate('/app/inventory/goodsreceipts', {
  state: { refresh: true }
})
      } else {
        showErrorToast('Failed to save goods receipt')
      }
    } catch (error) {
      console.error('SAVE ERROR', error)
      showErrorToast('Error saving goods receipt')
    }
  }





  const handleUpdateReceipt = async () => {
    if (isReadonly) return
    if (!purchase) return showErrorToast('Please select a purchase')
    if (!supplier) return showErrorToast('Please select a supplier')
    if (!employee) return showErrorToast('Please select an employee')
    if (rows.length === 0) return showErrorToast('Please add at least one item')

    const remarksLen = remarks?.trim().length || 0;
    if (remarks && (remarksLen < 2 || remarksLen > 300)) return showErrorToast('Remarks must be between 2 and 300 characters');

    const journalLen = journalRemarks?.trim().length || 0;
    if (journalRemarks && (journalLen < 2 || journalLen > 300)) return showErrorToast('Journal Remarks must be between 2 and 300 characters');

    const payload = {
      supplierId: supplier,
      purchaseId: purchase,
      date,
      totalQuantity: totalQuantity,
      employeeId: employee,
      remarks,
      journalRemarks,
      reference,
      items: rows.map(r => ({
        productId: r.productId,
        productName: r.productName,
        warehouseId: r.warehouseId,
        warehouseName: r.warehouseName,
        quantity: parseFloat(r.quantity) || 0,
        description: r.description
      })),
      userId
    }

    try {
      const res = await updateGoodsReceiptApi(id, payload)
      if (res.status === 200) {
        showSuccessToast('Goods receipt updated successfully')
        navigate('/app/inventory/goodsreceipts')
      } else {
        showErrorToast('Failed to update goods receipt')
      }
    } catch (error) {
      console.error('UPDATE ERROR', error)
      showErrorToast('Error updating goods receipt')
    }
  }

  const handleDeleteReceipt = async () => {
    if (isReadonly) return;
    const result = await showDeleteConfirm('goods receipt');

    if (!result.isConfirmed) return;

    try {
      const res = await deleteGoodsReceiptApi(id, { userId });

      if (res.status === 200) {
        showSuccessToast("Goods receipt has been deleted successfully.");
        navigate("/app/inventory/goodsreceipts");
      } else {
        showErrorToast("Failed to delete goods receipt.");
      }
    } catch (error) {
      console.error("DELETE ERROR", error);
      showErrorToast("An error occurred while deleting the goods receipt.");
    }
  };


  const handleRestoreReceipt = async () => {
    const result = await showRestoreConfirm('goods receipt');

    if (!result.isConfirmed) return

    try {
      const res = await restoreGoodsReceiptApi(id, { userId })
      if (res.status === 200) {
        showSuccessToast('Goods receipt restored successfully.');
        navigate('/app/inventory/goodsreceipts')
      } else {
        showErrorToast('Failed to restore goods receipt.')
      }
    } catch (error) {
      console.error('RESTORE ERROR', error)
      showErrorToast('Error restoring goods receipt')
    }
  }

  return (
    <PageLayout>
      <div className={`p-6 h-full overflow-y-auto ${theme === 'emerald' ? 'bg-emerald-50 text-gray-800' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
        <ContentCard className="!h-auto !overflow-visible">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="hover:text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>
            {id ? (isReadonly ? "View Goods Receipt (inactive)" : "Edit Goods Receipt") : "New Goods Receipt"}
          </h2>
        </div>

        {/* ACTION BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              {!isReadonly ? (
                <>
                  {hasPermission(PERMISSIONS.INVENTORY.GOODS_RECEIPTS.EDIT) && (
                  <button
                    onClick={handleUpdateReceipt}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md' : 'bg-gray-700 border border-gray-600 text-blue-300 hover:bg-gray-600'}`}
                  >
                    <Save size={18} /> Update
                  </button>
                  )}
                  {hasPermission(PERMISSIONS.INVENTORY.GOODS_RECEIPTS.DELETE) && (
                  <button
                    onClick={handleDeleteReceipt}
                    className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                  )}
                </>
              ) : (
                <></>
              )}
            </>
          ) : (
            hasPermission(PERMISSIONS.INVENTORY.GOODS_RECEIPTS.CREATE) && (
            <button
              onClick={handleSaveReceipt}
              disabled={isReadonly}
              className={`flex items-center gap-2 px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md' : 'bg-gray-700 border border-gray-600 text-blue-300 hover:bg-gray-600'} ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={18} /> Save
            </button>
            )
          )}
        </div>

        
        <hr className="mb-4 border-gray-300" />

        {/* TOP SECTION: 2-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LEFT COL */}
          <div className="space-y-4">
             {/* Purchase */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                 Purchase <span className="text-dark">*</span>
               </label>
                <div className="flex-1 font-medium">
                 <SearchableSelect
                    value={purchase}
                    onChange={setPurchase}
                    placeholder="Select Purchase"
                    options={purchasesList}
                    disabled={isReadonly}
                    className={theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}
                 />
               </div>
             </div>

             {/* Supplier */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                 Supplier <span className="text-dark">*</span>
               </label>
                <div className="flex-1 font-medium">
                 <InputField
                    value={supplierDisplayName}
                    readOnly
                    disabled
                    placeholder="Supplier Name"
                    className="bg-gray-100 cursor-not-allowed"
                 />
               </div>
             </div>

             {/* Date */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                 Date
               </label>
                <div className="flex-1 font-medium">
                 <InputField
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    disabled={isReadonly}
                 />
               </div>
             </div>
          </div>

          {/* RIGHT COL */}
          <div className="space-y-4">
             {/* Employee */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                 Employee <span className="text-dark">*</span>
               </label>
                <div className="flex-1 font-medium">
                  <SearchableSelect
                    value={employee}
                    onChange={setEmployee}
                    placeholder="Select Employee"
                    options={employeesList}
                    disabled={isReadonly}
                    className={theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}
                  />
               </div>
             </div>

             {/* Reference */}
             <div className="flex items-center">
               <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                 Reference
               </label>
                <div className="flex-1 font-medium">
                 <InputField
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    disabled={isReadonly}
                    placeholder="Reference No"
                 />
               </div>
             </div>
          </div>
        </div>

        {/* ROW 3: LINE ITEMS */}
        <div className="mb-8">
          <div className="flex gap-2 mb-2 font-medium">
            <label className={`text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Line Items</label>
            <button
              onClick={openItemModal}
              disabled={isReadonly}
              className={`flex items-center gap-2 px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md' : 'bg-gray-800 border border-gray-600 text-blue-300'} ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div className={`border rounded overflow-x-auto ${theme === 'emerald' ? 'bg-white border-gray-200' : theme === 'purple' ? 'bg-white border-purple-100' : 'bg-gray-800 border-gray-700'}`}>
            <table className="w-full text-sm">
              <thead className={theme === 'emerald' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-100' : theme === 'purple' ? 'bg-purple-50 text-purple-900 border-b border-purple-100' : 'bg-gray-700'}>
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t text-center ${theme === 'emerald' ? 'border-gray-100 hover:bg-gray-50 text-gray-700' : theme === 'purple' ? 'border-purple-100 hover:bg-purple-50 text-gray-700' : 'border-gray-700 hover:bg-gray-700/50 text-gray-300'} ${isReadonly ? 'opacity-80' : ''}`}>
                    <td className="p-3">{r.productName}</td>
                    <td className="p-3">{r.description}</td>
                    <td className="p-3">{r.warehouseName}</td>
                    <td className="p-3">{r.quantity}</td>
                    <td className="p-3 flex gap-2 justify-center">
                      {!isReadonly ? (
                        <>
                          <button onClick={() => editRow(i)} className="text-blue-400">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteRow(i)} className="text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROW 4: TOTAL QUANTITY */}
        <div className="mb-6 flex justify-end">
          <div className={`border rounded px-4 py-2 font-bold ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-800' : theme === 'purple' ? 'bg-white border-purple-200 text-purple-900' : 'bg-gray-800 border-gray-600'}`}>
            Total Quantity: {totalQuantity.toFixed(2)}
          </div>
        </div>

        {/* ROW 5: REMARKS + JOURNAL REMARKS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <textarea
            placeholder="Remarks"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            disabled={isReadonly}
            className={`h-24 rounded px-3 py-2 outline-none border ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500' : theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-gray-500' : 'bg-gray-800 border-gray-600 text-white focus:border-gray-500'} ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <textarea
            placeholder="Journal Remarks"
            value={journalRemarks}
            onChange={e => setJournalRemarks(e.target.value)}
            disabled={isReadonly}
            className={`h-24 rounded px-3 py-2 outline-none border ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500' : theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-gray-500' : 'bg-gray-800 border-gray-600 text-white focus:border-gray-500'} ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>



      {/* ITEM MODAL */}
      <AddModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={addItemToTable}
        title={editingIndex !== null ? "Edit Goods Receipt Details" : "New Goods Receipt Details"}
        width="700px"
      >
        <div className="grid grid-cols-1 gap-5">
           {/* PRODUCT */}
          <div>
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
             Product <span className="text-dark">*</span> 
            </label>
            <SearchableSelect
              value={newItem.productId}
              onChange={(val) => {
                const p = productsList.find(x => String(x.id) === String(val))
                if (p) {
                  setNewItem(prev => ({
                    ...prev,
                    productId: p.id,
                    productName: p.ProductName || p.name || '',
                    quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1
                  }))
                } else {
                  setNewItem(prev => ({ ...prev, productId: val, quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1 }))
                }
              }}
              placeholder="Product"
              options={productsList}
              disabled={isReadonly}
              className={theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}
            />
          </div>

          {/* QUANTITY */}
          <div>
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
       Quantity       <span className="text-dark">*</span> 
            </label>
             <InputField
               type="number"
               value={newItem.quantity}
               onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
               disabled={isReadonly}
             />
          </div>

          {/* WAREHOUSE */}
          <div>
            <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
             Warehouse <span className="text-dark">*</span> 
            </label>
            <SearchableSelect
              value={newItem.warehouseId}
              onChange={(val) => {
                const w = warehousesList.find(x => String(x.id) === String(val))
                if (w) {
                  setNewItem({ ...newItem, warehouseId: w.id, warehouseName: w.name })
                } else {
                  setNewItem(prev => ({ ...prev, warehouseId: val }))
                }
              }}
              placeholder="Warehouse"
              options={warehousesList}
              disabled={isReadonly}
              className={theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}
            />
          </div>

          <div>
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
              Description
            </label>
            <textarea
              value={newItem.description || ""}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              rows={3}
              disabled={isReadonly}
               className={`w-full border rounded px-3 py-2 outline-none resize-none ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500' : 'bg-gray-900 border-gray-600 text-white'}`}
            />
          </div>
        </div>
      </AddModal>
      </ContentCard>
      </div>
    </PageLayout>
  )
}

export default NewGoodsReceipt
