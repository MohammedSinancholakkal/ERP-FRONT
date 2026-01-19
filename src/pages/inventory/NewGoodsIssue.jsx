// src/pages/inventory/NewGoodsIssue.jsx
import React, { useEffect, useState } from 'react'
import { showConfirmDialog, showDeleteConfirm, showRestoreConfirm, showSuccessToast, showErrorToast } from "../../utils/notificationUtils";
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
import AddModal from "../../components/modals/AddModal";
import InputField from "../../components/InputField";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '../../layout/PageLayout';
import { ArchiveRestore, ArrowLeft, Edit, Plus, Save, Trash2 } from 'lucide-react';

function NewGoodsIssue() {
  const navigate = useNavigate()
  const { id } = useParams()

  const userData = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = userData?.userId || userData?.id || userData?.Id
  const { theme } = useTheme();

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
      showErrorToast("Failed to load goods issue")
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
      showErrorToast("Failed to load sales")
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
      showErrorToast("Failed to load customers")
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
  const handleSaveIssue = async () => {
    if (isReadonly) return
    if (!sales) return showErrorToast('Please select a sale')
    if (!customer) return showErrorToast('Please select a customer')
    if (!salesPerson) return showErrorToast('Please select a sales person')
    if (!date) return showErrorToast('Please select a date');
 
    if (rows.length === 0) return showErrorToast('Please add at least one item')

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
        showSuccessToast('Goods Issue saved successfully')
        navigate('/app/inventory/goodsissue')
      } else {
        showErrorToast('Failed to save goods Issue')
      }
    } catch (error) {
      console.error('SAVE ERROR', error)
      showErrorToast('Error saving goods Issue')
    }
  }

  const handleUpdateIssue = async () => {
    if (isReadonly) return
    // validation appropriate to Goods Issue (not purchases)
    if (!sales) return showErrorToast('Please select a sale')
    if (!customer) return showErrorToast('Please select a customer')
    if (!salesPerson) return showErrorToast('Please select a sales person')
    if (rows.length === 0) return showErrorToast('Please add at least one item')

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
        showSuccessToast('Goods issue updated successfully')
        navigate('/app/inventory/goodsissue')
      } else {
        showErrorToast('Failed to update goods issue')
      }
    } catch (error) {
      console.error('UPDATE ERROR', error)
      showErrorToast('Error updating goods issue')
    }
  }

const handleDeleteIssue = async () => {
  if (isReadonly) return
  const result = await showDeleteConfirm('goods issue');

  if (!result.isConfirmed) return

  try {
    const res = await deleteGoodsIssueApi(id, { userId })

    if (res.status === 200) {
      showSuccessToast('Goods issue deleted successfully.')
      navigate('/app/inventory/goodsissue')
    } else {
      showErrorToast('Failed to delete goods issue.')
    }
  } catch (error) {
    console.error('DELETE ERROR', error)
    showErrorToast('Error deleting goods issue.')
  }
}

// --- NEW: restore handler ---
const handleRestoreIssue = async () => {
  const result = await showRestoreConfirm('goods issue');

  if (!result.isConfirmed) return

  try {
    const res = await restoreGoodsIssueApi(id, { userId })
    if (res.status === 200) {
      showSuccessToast('Goods issue restored successfully.')
      navigate('/app/inventory/goodsissue')
    } else {
      showErrorToast('Failed to restore goods issue.')
    }
  } catch (error) {
    console.error('RESTORE ERROR', error)
    showErrorToast('Error restoring goods issue.')
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
                    className={`flex items-center gap-2 px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 '}`}
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
              className={`flex items-center gap-2 px-4 py-2 rounded ${theme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white shadow-md' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'} ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
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
               {/* Sales */}
               <div className="flex items-center">
                 <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                   Sale <span className="text-dark">*</span>
                 </label>
                  <div className="flex-1 font-medium">
                   <SearchableSelect
                      value={sales}
                      onChange={setSales}
                      placeholder="Select Sale"
                      options={salesList}
                      disabled={isReadonly}
                      className={theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}
                   />
                 </div>
               </div>

               {/* Customer */}
               <div className="flex items-center">
                 <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                   Customer <span className="text-dark">*</span>
                 </label>
                  <div className="flex-1 font-medium">
                    <SearchableSelect
                      value={customer}
                      onChange={() => {}}
                      placeholder="Customer"
                      options={customersList}
                      disabled={true}
                      className={theme === 'emerald' || theme === 'purple' ? 'bg-white' : 'bg-gray-800'}
                    />
                 </div>
               </div>

               {/* Date */}
               <div className="flex items-center">
                 <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                   Date <span className="text-dark">*</span>
                 </label>
                  <div className="flex-1 font-medium">
                   <InputField
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      disabled={isReadonly}
                      required
                   />
                 </div>
               </div>
            </div>

            {/* RIGHT COL */}
            <div className="space-y-4">
               {/* Sales Person */}
               <div className="flex items-center">
                 <label className={`w-32 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                   Sales Person <span className="text-dark">*</span>
                 </label>
                  <div className="flex-1 font-medium">
                    <SearchableSelect
                      value={salesPerson}
                      onChange={setSalesPerson}
                      placeholder="Select Sales Person"
                      options={salesPersonsList}
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

        {/* LINE ITEMS */}
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
          <div className={`border rounded px-4 py-2 font-bold ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-800' : theme === 'purple' ? 'bg-white border-purple-200 text-purple-900' : 'bg-gray-800 border-gray-600'}`}>
            Total Quantity: {totalQuantity.toFixed(2)}
          </div>
        </div>

        {/* REMARKS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-3">
          <textarea
            placeholder="Remarks"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            disabled={isReadonly}
            className={`h-24 rounded px-3 py-2 outline-none border ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500' : theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-gray-500' : 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'} ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <textarea
            placeholder="Journal Remarks"
            value={journalRemarks}
            onChange={e => setJournalRemarks(e.target.value)}
            disabled={isReadonly}
            className={`h-24 rounded px-3 py-2 outline-none border ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500' : theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-gray-500' : 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'} ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

      {/* ITEM MODAL (unchanged) */}
      {/* ITEM MODAL */}
      <AddModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={addItemToTable}
        title={editingIndex !== null ? "Edit Goods Issue Details" : "New Goods Issue Details"}
        width="700px"
      >
        <div className="grid grid-cols-1 gap-5">
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
                    productName: p.name,
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

          <div>
             <label className={`block text-sm mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
               Quantity <span className="text-dark">*</span>
            </label>
             <InputField
               type="number"
               value={newItem.quantity}
               onChange={(e) =>
                 setNewItem({ ...newItem, quantity: e.target.value })
               }
               disabled={isReadonly}
             />
          </div>

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

export default NewGoodsIssue