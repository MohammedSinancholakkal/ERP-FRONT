// src/pages/inventory/NewGoodsReceipt.jsx
import { ArrowLeft, Save, Plus, Trash2, Edit, X, ArchiveRestore } from 'lucide-react'
import { useNavigate, useParams ,useLocation} from 'react-router-dom'
import PageLayout from "../../layout/PageLayout"
import Swal from "sweetalert2";
import toast from 'react-hot-toast'
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

// Reusable searchable select component (lazy-loads options via fetchOptions)
const SearchableSelect = ({ value, onChange, placeholder, fetchOptions, options = [], className = '', searchable = true, disabled = false }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedLabel = options.find(o => String(o.id) === String(value))?.name || ''

  const openDropdown = async () => {
    if (disabled) return
    setOpen(true)
    setQuery('')
    if ((options?.length || 0) === 0 && fetchOptions) {
      setLoading(true)
      try {
        await fetchOptions()
      } catch (e) {
        console.error('SearchableSelect fetch error', e)
      } finally {
        setLoading(false)
      }
    }
  }

  const filtered = !query.trim()
    ? options
    : options.filter(o => (o.name || '').toLowerCase().includes(query.toLowerCase()))

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={open ? (searchable ? query : '') : (selectedLabel || query)}
        placeholder={placeholder}
        onFocus={openDropdown}
        onClick={openDropdown}
        onChange={(e) => { if (searchable && !disabled) { setQuery(e.target.value); setOpen(true) } }}
        readOnly={!searchable}
        disabled={disabled}
        className={`bg-gray-800 border border-gray-700 rounded px-3 py-2 w-full text-sm text-white outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {value && !open && !disabled && (
        <button
          className="absolute right-2 top-2 text-gray-400"
          onClick={(e) => { e.stopPropagation(); onChange('') }}
          title="Clear"
        >
          ✕
        </button>
      )}
      {open && (
        <div className="absolute z-50 w-full bg-gray-900 border border-gray-700 mt-1 max-h-56 overflow-y-auto rounded shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-gray-400 text-sm">Loading...</div>
          ) : (filtered.length > 0 ? (
            filtered.map(opt => (
              <div
                key={opt.id}
                className="px-3 py-2 hover:bg-gray-800 cursor-pointer text-sm text-white"
                onClick={() => { onChange(opt.id); setOpen(false); setQuery('') }}
              >
                {opt.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">No results</div>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>}
    </div>
  )
}

function NewGoodsReceipt() {
  const navigate = useNavigate()
  const { id } = useParams()

 const location = useLocation()

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
      toast.error("Failed to load goods receipt details")
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
    if (!newItem.productId || !newItem.warehouseId || newItem.quantity <= 0) {
      toast.error('Please fill all fields and ensure quantity > 0')
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
    if (!purchase) return toast.error('Please select a purchase')
    if (!supplier) return toast.error('Please select a supplier')
    if (!employee) return toast.error('Please select an employee')
    if (rows.length === 0) return toast.error('Please add at least one item')

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
        toast.success('Goods receipt saved successfully')
navigate('/app/inventory/goodsreceipts', {
  state: { refresh: true }
})
      } else {
        toast.error('Failed to save goods receipt')
      }
    } catch (error) {
      console.error('SAVE ERROR', error)
      toast.error('Error saving goods receipt')
    }
  }

useEffect(() => {
  if (location.state?.refresh) {
    setShowInactive(false)
    setShowAll(false)
    setPage(1)
    fetchActive()

    navigate(location.pathname, { replace: true })
  }
}, [location.state])



  const handleUpdateReceipt = async () => {
    if (isReadonly) return
    if (!purchase) return toast.error('Please select a purchase')
    if (!supplier) return toast.error('Please select a supplier')
    if (!employee) return toast.error('Please select an employee')
    if (rows.length === 0) return toast.error('Please add at least one item')

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
        toast.success('Goods receipt updated successfully')
        navigate('/app/inventory/goodsreceipts')
      } else {
        toast.error('Failed to update goods receipt')
      }
    } catch (error) {
      console.error('UPDATE ERROR', error)
      toast.error('Error updating goods receipt')
    }
  }

  const handleDeleteReceipt = async () => {
    if (isReadonly) return
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This goods receipt will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // red
      cancelButtonColor: "#6b7280",  // gray
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteGoodsReceiptApi(id, { userId });

      if (res.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Goods receipt has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        navigate("/app/inventory/goodsreceipts");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to delete goods receipt.",
        });
      }
    } catch (error) {
      console.error("DELETE ERROR", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the goods receipt.",
      });
    }
  };


  const handleRestoreReceipt = async () => {
    const result = await Swal.fire({
      title: 'Restore Goods Receipt?',
      text: 'This will reactivate the goods receipt.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#10b981', // green
      cancelButtonColor: '#6b7280'
    })

    if (!result.isConfirmed) return

    try {
      const res = await restoreGoodsReceiptApi(id, { userId })
      if (res.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Restored!',
          text: 'Goods receipt restored successfully.',
          timer: 1200,
          showConfirmButton: false
        })
        navigate('/app/inventory/goodsreceipts')
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to restore goods receipt.'
        })
      }
    } catch (error) {
      console.error('RESTORE ERROR', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error restoring goods receipt'
      })
    }
  }

  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-[calc(100vh-80px)] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="hover:text-white-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-medium">{id ? (isReadonly ? "View Goods Receipt (inactive)" : "Edit Goods Receipt") : "New Goods Receipt"}</h2>
        </div>

        {/* ACTION BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              {!isReadonly ? (
                <>
                  <button
                    onClick={handleUpdateReceipt}
                    className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded hover:bg-gray-600"
                  >
                    <Save size={18} /> Update
                  </button>
                  <button
                    onClick={handleDeleteReceipt}
                    className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={handleRestoreReceipt}
                  className="flex items-center gap-2 bg-green-600 border border-green-500 px-4 py-2 rounded text-white hover:bg-green-500"
                >
                  <ArchiveRestore size={18} /> Restore
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleSaveReceipt}
              disabled={isReadonly}
              className={`flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded hover:bg-gray-600 ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={18} /> Save
            </button>
          )}
        </div>

        {/* ROW 1: PURCHASE | SUPPLIER | DATE | EMPLOYEE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <SearchableSelect
            value={purchase}
            onChange={setPurchase}
            placeholder="Purchase"
            fetchOptions={fetchPurchases}
            options={purchasesList}
            disabled={isReadonly}
            className=""
          />

          <div>
            <input
              type="text"
              value={supplierDisplayName}
              placeholder="Supplier"
              readOnly
              disabled
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 w-full text-sm text-white outline-none opacity-100"
            />
          </div>

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={isReadonly}
            className={`bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />

          <SearchableSelect
            value={employee}
            onChange={setEmployee}
            placeholder="Employee"
            fetchOptions={fetchEmployees}
            options={employeesList}
            disabled={isReadonly}
            className=""
          />
        </div>

        {/* ROW 2: REFERENCE */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Reference"
            value={reference}
            onChange={e => setReference(e.target.value)}
            disabled={isReadonly}
            className={`w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* ROW 3: LINE ITEMS */}
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            <label className="text-sm text-gray-300">Line Items</label>
            <button
              onClick={openItemModal}
              disabled={isReadonly}
              className={`flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
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
                  <tr key={i} className={`border-t border-gray-700 text-center ${isReadonly ? 'opacity-80' : ''}`}>
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
          <div className="bg-gray-800 border border-gray-600 rounded px-4 py-2 font-bold">
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
            className={`h-24 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <textarea
            placeholder="Journal Remarks"
            value={journalRemarks}
            onChange={e => setJournalRemarks(e.target.value)}
            disabled={isReadonly}
            className={`h-24 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      {/* ITEM MODAL */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl p-6 relative">

            {/* CLOSE */}
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl text-white font-semibold mb-6">
              {editingIndex !== null ? "Edit Goods Receipt Details" : "New Goods Receipt Details"}
            </h3>

            <div className="grid grid-cols-1 gap-5">

              {/* PRODUCT */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  <span className="text-red-400">*</span> Product
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
                  fetchOptions={fetchProducts}
                  options={productsList}
                  className=""
                  disabled={isReadonly}
                />
              </div>

              {/* QUANTITY */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  <span className="text-red-400">*</span> Quantity
                </label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantity: e.target.value })
                  }
                  disabled={isReadonly}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none"
                />
              </div>

              {/* WAREHOUSE */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  <span className="text-red-400">*</span> Warehouse
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
                  fetchOptions={fetchWarehouses}
                  options={warehousesList}
                  className=""
                  disabled={isReadonly}
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newItem.description || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  rows={3}
                  disabled={isReadonly}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none resize-none"
                />
              </div>

            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addItemToTable}
                disabled={isReadonly}
                className={`flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700 ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </button>
            </div>

          </div>
        </div>
      )}

    </PageLayout>
  )
}

export default NewGoodsReceipt
