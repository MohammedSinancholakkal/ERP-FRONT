// src/pages/inventory/NewGoodsIssue.jsx
import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { ArrowLeft, Save, Plus, Trash2, Edit, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PageLayout from "../../layout/PageLayout"
import toast from 'react-hot-toast'
import {
  getEmployeesApi,
  getWarehousesApi,
  getProductsApi,
  getCustomersApi,
  getSalesApi,
  addGoodsIssueApi,
  getGoodsIssueByIdApi,
  updateGoodsIssueApi,
  deleteGoodsIssueApi,
  restoreGoodsIssueApi, // <-- ensure this is exported in allAPI
  getSuppliersApi, // optional
} from '../../services/allAPI'

import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

function NewGoodsIssue() {
  const navigate = useNavigate()
  const { id } = useParams()

  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = userData?.userId || userData?.id || userData?.Id

  // --- NEW: read-only flag when opening an inactive record ---
  const [isReadonly, setIsReadonly] = useState(false)

  // --- TOP SECTION STATE ---
  const [sales, setSales] = useState('')
  const [customer, setCustomer] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [salesPerson, setSalesPerson] = useState('')
  const [reference, setReference] = useState('')

  // --- DROPDOWN DATA ---
  const [salesList, setSalesList] = useState([])
  const [customersList, setCustomersList] = useState([])
  const [salesPersonsList, setSalesPersonsList] = useState([])
  const [warehousesList, setWarehousesList] = useState([])
  const [productsList, setProductsList] = useState([])
  const [suppliersList, setSuppliersList] = useState([]) // optional

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

  // --- BOTTOM SECTION STATE ---
  const [remarks, setRemarks] = useState('')
  const [journalRemarks, setJournalRemarks] = useState('')

  // --- CALCULATED VALUES ---
  const [totalQuantity, setTotalQuantity] = useState(0)

  // initial load - fetch all dropdown lists so fields show immediately
  useEffect(() => {
    (async () => {
      await fetchEmployees()
      await fetchWarehouses()
      await fetchProducts()
      await fetchSales()
      await fetchCustomers()
    })()
  }, [])


  // --- FETCH GOODS ISSUE FOR EDIT ---
  useEffect(() => {
    if (id) {
      fetchGoodsIssueDetails(id)
      // optionally fetch suppliers if you need them:
      // fetchSuppliers()
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
        setSalesPersonsList(normalized)
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
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records) ? res.data.records : []
        const normalized = records.map(r => ({
          id: r.id ?? r.Id ?? r.PurchaseId,
          reference: r.reference ?? r.Reference ?? r.VNo ?? r.invoiceNo ?? r.invoiceNo ?? '',
          name: r.reference ?? r.Reference ?? r.VNo ?? r.invoiceNo ?? r.invoiceNo ?? '',
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

  const fetchGoodsIssueDetails = async (issueId) => {
    try {
      const res = await getGoodsIssueByIdApi(issueId)

      if (res.status === 200) {
        const { issue, details } = res.data

        // --- READONLY CHECK ---
        // If the issue is inactive (IsActive === 0) set read-only mode
        // Note: adapt the property name if backend uses lowercase/boolean
        const inactive = issue.IsActive === 0 || issue.isActive === 0 || issue.IsActive === false || issue.isActive === false
        setIsReadonly(Boolean(inactive))

        // TOP SECTION
        setSales(issue.SaleId)
        setCustomer(issue.CustomerId)
        setSalesPerson(issue.EmployeeId)
        setDate(issue.Date?.split("T")[0] ?? new Date().toISOString().split('T')[0])
        setReference(issue.Reference || "")
        setRemarks(issue.Remarks || "")
        setJournalRemarks(issue.JournalRemarks || "")
        setSales(issue.SaleId)
        setCustomer(issue.CustomerId)

        // LINE ITEMS
        const mappedRows = (details || []).map(d => ({
          productId: d.productId ?? d.ProductId,
          productName: d.productName ?? d.ProductName,
          warehouseId: d.warehouseId ?? d.WarehouseId,
          warehouseName: d.warehouseName ?? d.WarehouseName,
          quantity: d.quantity ?? d.Quantity,
          description: d.description ?? d.Description ?? ""
        }))

        setRows(mappedRows)
      }
    } catch (error) {
      console.error("Error fetching goods issue details", error)
      toast.error("Failed to load goods issue")
    }
  }

  const fetchSales = async () => {
    try {
      const res = await getSalesApi(1, 1000)
      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records)
          ? res.data.records
          : res?.data || []

        const normalized = records.map(r => ({
          id: r.id ?? r.Id ?? r.SaleId,
          name:
            r.reference ??
            r.Reference ??
            r.invoiceNo ??
            r.InvoiceNo ??
            r.saleNo ??
            `Sale-${r.id ?? r.Id}`,
          customerId: r.CustomerId ?? r.customerId,
          customerName:
            r.CustomerName ??
            r.customerName ??
            r.Customer?.Name ??
            r.customer?.name ??      ""
        }))

        setSalesList(normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching sales", error)
      toast.error("Failed to load sales")
      return []
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await getCustomersApi(1, 1000)

      if (res.status === 200) {
        const records = Array.isArray(res?.data?.records)
          ? res.data.records
          : res?.data || []

        const normalized = records.map(c => ({
          id: c.id ?? c.Id ?? c.CustomerId,
          name:
            c.name ??
            c.Name ??
            c.companyName ??
            c.CompanyName ??
            "Customer"
        }))

        setCustomersList(normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching customers", error)
      toast.error("Failed to load customers")
      return []
    }
  }

useEffect(() => {
  if (!sales) {
    setCustomer('')
    return
  }

  const sale = salesList.find(s => String(s.id) === String(sales))
  if (sale?.customerId) {
    setCustomer(sale.customerId)
  }
}, [sales, salesList])

  // --- MODAL HANDLERS ---
  const openItemModal = () => {
    // block opening modal when read-only
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
  const handleSaveIssue = async () => {
    if (isReadonly) return
    if (!sales) return toast.error('Please select a sale')
    if (!customer) return toast.error('Please select a customer')
    if (!salesPerson) return toast.error('Please select a sales person')
    if (!date) return toast.error('Please select a date');

    if (rows.length === 0) return toast.error('Please add at least one item')

    const payload = {
      saleId: sales,
      customerId: customer,
      date,
      totalQuantity: totalQuantity,
      employeeId: salesPerson,
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
      const res = await addGoodsIssueApi(payload)

      if (res.status === 200) {
        toast.success('Goods Issue saved successfully')
        navigate('/app/inventory/goodsissue')
      } else {
        toast.error('Failed to save goods Issue')
      }
    } catch (error) {
      console.error('SAVE ERROR', error)
      toast.error('Error saving goods Issue')
    }
  }

  const handleUpdateIssue = async () => {
    if (isReadonly) return
    // validation appropriate to Goods Issue (not purchases)
    if (!sales) return toast.error('Please select a sale')
    if (!customer) return toast.error('Please select a customer')
    if (!salesPerson) return toast.error('Please select a sales person')
    if (rows.length === 0) return toast.error('Please add at least one item')

    const payload = {
      saleId: sales,
      customerId: customer,
      date,
      totalQuantity: totalQuantity,
      employeeId: salesPerson,
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
      const res = await updateGoodsIssueApi(id, payload)
      if (res.status === 200) {
        toast.success('Goods issue updated successfully')
        navigate('/app/inventory/goodsissue')
      } else {
        toast.error('Failed to update goods issue')
      }
    } catch (error) {
      console.error('UPDATE ERROR', error)
      toast.error('Error updating goods issue')
    }
  }

const handleDeleteIssue = async () => {
  if (isReadonly) return
  const result = await Swal.fire({
    title: 'Delete Goods Issue?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    confirmButtonColor: '#dc2626', // red
    cancelButtonColor: '#6b7280'   // gray
  })

  if (!result.isConfirmed) return

  try {
    const res = await deleteGoodsIssueApi(id, { userId })

    if (res.status === 200) {
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Goods issue deleted successfully.',
        timer: 1500,
        showConfirmButton: false
      })
      navigate('/app/inventory/goodsissue')
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Failed to delete goods issue.'
      })
    }
  } catch (error) {
    console.error('DELETE ERROR', error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error deleting goods issue.'
    })
  }
}

// --- NEW: restore handler ---
const handleRestoreIssue = async () => {
  const result = await Swal.fire({
    title: 'Restore Goods Issue?',
    text: 'This will reactivate the goods issue.',
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
    const res = await restoreGoodsIssueApi(id, { userId })
    if (res.status === 200) {
      await Swal.fire({
        icon: 'success',
        title: 'Restored!',
        text: 'Goods issue restored successfully.',
        timer: 1200,
        showConfirmButton: false
      })
      navigate('/app/inventory/goodsissue')
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Failed to restore goods issue.'
      })
    }
  } catch (error) {
    console.error('RESTORE ERROR', error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error restoring goods issue.'
    })
  }
}


  return (
    <PageLayout>
      <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="hover:text-white-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-medium">
            {id ? (isReadonly ? "View Goods Issue (inactive)" : "Edit Goods Issue") : "New Goods Issue"}
          </h2>
        </div>

        {/* ACTION BAR */}
        <div className="flex gap-2 mb-6">
          {id ? (
            <>
              {!isReadonly ? (
                <>
                  {hasPermission(PERMISSIONS.INVENTORY.GOODS_ISSUE.EDIT) && (
                  <button
                    onClick={handleUpdateIssue}
                    className="flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded hover:bg-gray-600"
                  >
                    <Save size={18} /> Update
                  </button>
                  )}
                  {hasPermission(PERMISSIONS.INVENTORY.GOODS_ISSUE.DELETE) && (
                  <button
                    onClick={handleDeleteIssue}
                    className="flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                  )}
                </>
              ) : (
                hasPermission(PERMISSIONS.INVENTORY.GOODS_ISSUE.DELETE) && (
                <button
                  onClick={handleRestoreIssue}
                  className="flex items-center gap-2 bg-green-600 border border-green-500 px-4 py-2 rounded text-white hover:bg-green-500"
                >
                  <ArchiveRestore size={18} /> Restore
                </button>
                )
              )}
            </>
          ) : (
            hasPermission(PERMISSIONS.INVENTORY.GOODS_ISSUE.CREATE) && (
            <button
              onClick={handleSaveIssue}
              disabled={isReadonly}
              className={`flex items-center gap-2 bg-gray-700 border border-gray-600 px-4 py-2 rounded hover:bg-gray-600 ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={18} /> Save
            </button>
            )
          )}
        </div>

        {/* ROW 1: SALE | CUSTOMER | DATE | EMPLOYEE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <SearchableSelect
  value={sales}
  onChange={setSales}
  placeholder="Sales"
  options={salesList}
  disabled={isReadonly} // <-- disabled when readonly
/>

         <SearchableSelect
  value={customer}
  onChange={() => {}}
  placeholder="Customer"
  options={customersList}
  disabled={true}
/>


          <SearchableSelect
            value={salesPerson}
            onChange={setSalesPerson}
            placeholder="Sales Person"
            options={salesPersonsList}
            disabled={isReadonly} // <-- disabled when readonly
          />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Reference */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Reference
            </label>
            <input
              type="text"
              placeholder="Reference"
              value={reference}
              onChange={e => setReference(e.target.value)}
              disabled={isReadonly} // <-- disabled when readonly
              className={`w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Date (Required) */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              <span className="text-red-400">*</span> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              disabled={isReadonly}
              className={`w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

        </div>

        {/* LINE ITEMS */}
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
                  <tr key={i} className="border-t border-gray-700 text-center">
                    <td className="p-3">{r.productName}</td>
                    <td className="p-3">{r.description}</td>
                    <td className="p-3">{r.warehouseName}</td>
                    <td className="p-3">{r.quantity}</td>
                    <td className="p-3 flex gap-2 justify-center">
                      {!isReadonly ? (
                        <>
                          <Edit size={16} onClick={() => editRow(i)} className="cursor-pointer text-blue-400" />
                          <Trash2 size={16} onClick={() => deleteRow(i)} className="cursor-pointer text-red-400" />
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOTAL QUANTITY */}
        <div className="mb-6 flex justify-end">
          <div className="bg-gray-800 border border-gray-600 rounded px-4 py-2 font-bold">
            Total Quantity: {totalQuantity.toFixed(2)}
          </div>
        </div>

        {/* REMARKS */}
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

      {/* ITEM MODAL (unchanged) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-[700px] p-6 relative">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl text-white font-semibold mb-6">
              {editingIndex !== null ? "Edit Goods Issue Details" : "New Goods Issue Details"}
            </h3>

            <div className="grid grid-cols-1 gap-5">
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
                        productName: p.name,
                        quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1
                      }))
                    } else {
                      setNewItem(prev => ({ ...prev, productId: val, quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1 }))
                    }
                  }}
                  placeholder="Product"
                  options={productsList}
                  disabled={isReadonly} // ensure modal also respects readonly (modal shouldn't open when readonly anyway)
                />
              </div>

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
                  options={warehousesList}
                  disabled={isReadonly}
                />
              </div>

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
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700"
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

export default NewGoodsIssue