// src/pages/masters/UpdateStocks.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  List,
  X,
  Save,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

// APIs (make sure these exist in your services/allAPI)
import {
  getStocksApi,
  addStockApi,
  updateStockApi,
  deleteStockApi,
  searchStockApi,
  getInactiveStocksApi,
  restoreStockApi,
  // products
  getProductsApi,
  // warehouses
  getWarehousesApi,
} from "../../services/allAPI";
import PageLayout from "../../layout/PageLayout";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

const UpdateStocks = () => {
  // UI states
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Data
  const [rows, setRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  // Search & filters
  const [searchText, setSearchText] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");

  // Dropdown lists
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Add/Edit forms
  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: "",
    warehouseId: "",
    mode: "IN",
    status: "Pending",
    note: "",
    // vNo: "",
  });

  const [editItem, setEditItem] = useState({
    id: null,
    productId: "",
    quantity: "",
    warehouseId: "",
    mode: "IN",
    status: "Pending",
    note: "",
    // vNo: "",
    isInactive: false,
  });

  // Pagination & columns
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  const defaultColumns = {
    id: true,
    product: true,
    quantity: true,
    warehouse: true,
    mode: true,
    status: true,
    note: true,
    // vNo: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(defaultColumns);
  const [columnSearch, setColumnSearch] = useState("");



  // user
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = user?.userId || 1;

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- FILTERED & SORTED LIST ---
  const filteredRows = React.useMemo(() => {
    let list = rows;
    
    // Global Search
    if (searchText.trim()) {
        const s = searchText.toLowerCase();
        list = list.filter(r => 
            String(r.id).includes(s) ||
            (r.productName || "").toLowerCase().includes(s) ||
            (r.warehouseName || "").toLowerCase().includes(s) ||
            (r.note || "").toLowerCase().includes(s)
        );
    }

    if (filterProduct) list = list.filter(r => String(r.productId) === String(filterProduct));
    if (filterWarehouse) list = list.filter(r => String(r.warehouseId) === String(filterWarehouse));
    
    return list;
  }, [rows, searchText, filterProduct, filterWarehouse]);

  const sortedList = React.useMemo(() => {
    let sortableItems = [...filteredRows];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (['id', 'quantity', 'productId', 'warehouseId'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else {
             aValue = String(aValue || "").toLowerCase();
             bValue = String(bValue || "").toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRows, sortConfig]);

  // --- FILTER BAR CONFIG ---
   const filters = [
      {
          type: 'select',
          value: filterProduct,
          onChange: setFilterProduct,
          options: products.map(p => ({ id: p.id, name: p.name })),
          placeholder: "All Products"
      },
      {
          type: 'select',
          value: filterWarehouse,
          onChange: setFilterWarehouse,
          options: warehouses.map(w => ({ id: w.id, name: w.name })),
          placeholder: "All Warehouses"
      }
  ];

  const handleClearFilters = () => {
    setSearchText("");
    setFilterProduct("");
    setFilterWarehouse("");
    setSortConfig({ key: null, direction: 'asc' });
  };

  // ========================= LOADERS =========================
  const parseArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.records)) return res.data.records;
    if (Array.isArray(res.records)) return res.records;
    const maybe = Object.values(res).find((v) => Array.isArray(v));
    return Array.isArray(maybe) ? maybe : [];
  };

  const loadProducts = async () => {
    try {
      const res = await getProductsApi(1, 9999);
      const arr = parseArray(res);
      const normalized = arr.map((p) => ({
        id: p.Id ?? p.id ?? p.productId ?? p.id,
        name: (
          p.ProductName ??
          p.name ??
          p.productName ??
          p.Product ??
          ""
        ).toString(),
        raw: p,
      }));
      setProducts(normalized);
      return normalized;
    } catch (err) {
      console.error("loadProducts", err);
      toast.error("Failed to load products");
      setProducts([]);
      return [];
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await getWarehousesApi(1, 9999);
      const arr = parseArray(res);
      const normalized = arr.map((w) => ({
        id: w.Id ?? w.id ?? w.warehouseId ?? w.id,
        name: (w.Name ?? w.name ?? w.WarehouseName ?? "").toString(),
        raw: w,
      }));
      setWarehouses(normalized);
      return normalized;
    } catch (err) {
      console.error("loadWarehouses", err);
      toast.error("Failed to load warehouses");
      setWarehouses([]);
      return [];
    }
  };

  const loadRows = async () => {
    try {
      const res = await getStocksApi(page, limit);
      if (res?.status === 200) {
        const data = res.data ?? res;
        const items = Array.isArray(data.records)
          ? data.records
          : Array.isArray(data)
          ? data
          : Array.isArray(res)
          ? res
          : [];
        setTotalRecords(data.total ?? res.total ?? items.length);
        const normalized = (items || []).map((s) => ({
          id: s.Id ?? s.id,
          productId: s.ProductId ?? s.productId,
          productName:
            s.ProductName ??
            s.productName ??
            s.product?.ProductName ??
            s.product?.name ??
            "",
          quantity: s.Quantity ?? s.quantity,
          warehouseId: s.WarehouseId ?? s.warehouseId ?? s.warehouse?.id ?? "",
          warehouseName:
            s.WarehouseName ??
            s.warehouseName ??
            s.warehouse?.Name ??
            s.warehouse?.name ??
            "",
          mode: s.Mode ?? s.mode ?? "",
          status: s.Status ?? s.status ?? "",
          note: s.Note ?? s.note ?? "",
          vNo: s.VNo ?? s.vNo ?? "",
          isActive: s.IsActive === undefined ? true : !!s.IsActive,
        }));
        setRows(normalized);
      }
    } catch (err) {
      console.error("loadRows", err);
      toast.error("Failed to load stocks");
    }
  };

  const loadInactiveRows = async () => {
    try {
      const res = await getInactiveStocksApi();
      if (res?.status === 200) {
        const data = res.data ?? res;
        const items = Array.isArray(data) ? data : data.records ?? [];
        const normalized = (items || []).map((s) => ({
          id: s.Id ?? s.id,
          productId: s.ProductId ?? s.productId,
          productName:
            s.ProductName ??
            s.productName ??
            s.product?.ProductName ??
            s.product?.name ??
            "",
          quantity: s.Quantity ?? s.quantity,
          warehouseId: s.WarehouseId ?? s.warehouseId ?? s.warehouse?.id ?? "",
          warehouseName:
            s.WarehouseName ??
            s.warehouseName ??
            s.warehouse?.Name ??
            s.warehouse?.name ??
            "",
          mode: s.Mode ?? s.mode ?? "",
          status: s.Status ?? s.status ?? "",
          note: s.Note ?? s.note ?? "",
          vNo: s.VNo ?? s.vNo ?? "",
          isActive: false,
        }));
        setInactiveRows(normalized);
      } else {
        toast.error("Failed to load inactive stocks");
      }
    } catch (err) {
      console.error("loadInactiveRows", err);
      toast.error("Failed to load inactive stocks");
    }
  };

  // initial load
  useEffect(() => {
    (async () => {
      await loadProducts();
      await loadWarehouses();
      await loadRows();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // load inactive when toggled on
  useEffect(() => {
    if (showInactive) loadInactiveRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  // ========================= SEARCH =========================
  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value.trim()) {
      loadRows();
      return;
    }
    try {
      const res = await searchStockApi(value);
      if (res?.status === 200) {
        const items = res.data ?? [];
        const normalized = (items || []).map((s) => ({
          id: s.Id ?? s.id,
          productId: s.ProductId ?? s.productId,
          productName: s.ProductName ?? s.productName,
          quantity: s.Quantity ?? s.quantity,
          warehouseId: s.WarehouseId ?? s.warehouseId,
          warehouseName: s.WarehouseName ?? s.warehouseName,
          mode: s.Mode ?? s.mode,
          status: s.Status ?? s.status,
          note: s.Note ?? s.note,
          vNo: s.VNo ?? s.vNo,
        }));
        setRows(normalized);
        setTotalRecords(normalized.length);
      } else {
        toast.error("Search failed");
      }
    } catch (err) {
      console.error("searchStock error", err);
      toast.error("Search failed");
    }
  };

  // ========================= ADD / UPDATE / DELETE / RESTORE =========================
  const isInteger = (v) => Number.isInteger(Number(v)) && Number(v) >= 0;

  const handleAdd = async () => {
    if (!newItem.productId) return toast.error("Select product");
    if (!newItem.quantity || !isInteger(newItem.quantity))
      return toast.error("Enter valid quantity");
    if (!newItem.mode) return toast.error("Select mode (IN/OUT)");
    if (!newItem.status) return toast.error("Select status");

    try {
      const payload = {
        productId: Number(newItem.productId),
        quantity: Number(newItem.quantity),
        warehouseId: newItem.warehouseId ? Number(newItem.warehouseId) : null,
        mode: newItem.mode,
        status: newItem.status,
        note: newItem.note || "",
        vNo: newItem.vNo || "",
        userId: currentUserId,
      };
      const res = await addStockApi(payload);
      if (res?.status === 201 || res?.status === 200) {
        toast.success("Stock record added");
        setModalOpen(false);
        setNewItem({
          productId: "",
          quantity: "",
          warehouseId: "",
          mode: "IN",
          status: "Pending",
          note: "",
          vNo: "",
        });
        await loadRows();
      } else {
        toast.error(res?.data?.message || "Add failed");
      }
    } catch (err) {
      console.error("handleAdd error", err);
      toast.error("Add failed");
    }
  };

  const openEdit = (row, inactive = false) => {
    setEditItem({
      id: row.id,
      productId: row.productId,
      quantity: row.quantity,
      warehouseId: row.warehouseId || "",
      mode: row.mode || "IN",
      status: row.status || "Pending",
      note: row.note || "",
      vNo: row.vNo || "",
      isInactive: !!inactive,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem.productId) return toast.error("Select product");
    if (!editItem.quantity || !isInteger(editItem.quantity))
      return toast.error("Enter valid quantity");
    if (!editItem.mode) return toast.error("Select mode");
    if (!editItem.status) return toast.error("Select status");

    try {
      const payload = {
        productId: Number(editItem.productId),
        quantity: Number(editItem.quantity),
        warehouseId: editItem.warehouseId ? Number(editItem.warehouseId) : null,
        mode: editItem.mode,
        status: editItem.status,
        note: editItem.note || "",
        vNo: editItem.vNo || "",
        userId: currentUserId,
      };
      const res = await updateStockApi(editItem.id, payload);
      if (res?.status === 200) {
        toast.success("Stock updated");
        setEditModalOpen(false);
        await loadRows();
        if (showInactive) loadInactiveRows();
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("handleUpdate error", err);
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteStockApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Deleted");
        setEditModalOpen(false);
        await loadRows();
        if (showInactive) loadInactiveRows();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("handleDelete error", err);
      toast.error("Delete failed");
    }
  };

  const handleRestore = async () => {
    try {
      const res = await restoreStockApi(editItem.id, { userId: currentUserId });
      if (res?.status === 200) {
        toast.success("Restored");
        setEditModalOpen(false);
        await loadRows();
        await loadInactiveRows();
        setShowInactive(false);
      } else {
        toast.error("Restore failed");
      }
    } catch (err) {
      console.error("handleRestore error", err);
      toast.error("Restore failed");
    }
  };

  // Helpers to get names
  const getProductName = (id) => {
    const p = products.find((x) => String(x.id) === String(id));
    return p ? p.name : "";
  };

  const getWarehouseName = (id) => {
    const w = warehouses.find((x) => String(x.id) === String(id));
    return w ? w.name : "";
  };



  // small helper to refresh dropdown lists
  const refreshDropdowns = async () => {
    await loadProducts();
    await loadWarehouses();
  };

  // column picker open
  const openColumnPicker = () => {
    setTempVisibleColumns(visibleColumns);
    setColumnModalOpen(true);
  };

  // ------------------- RENDER -------------------
  return (
    <>
      {/* ADD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl"
          >
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">New Stock</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product (Add modal) */}
              <div>
                <label className="text-sm">Product *</label>
                <SearchableSelect 
                    options={products.map(p => ({ id: p.id, name: p.name }))}
                    value={newItem.productId}
                    onChange={(v) => setNewItem((p) => ({ ...p, productId: v }))}
                    placeholder="Select Product"
                    className="mt-1"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm">Quantity *</label>
                <input
                  type="text"
                  value={newItem.quantity}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^[0-9]*$/.test(v))
                      setNewItem((p) => ({ ...p, quantity: v }));
                  }}
                  placeholder="0"
                  className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              {/* Warehouse (Add modal) */}
              <div>
                <label className="text-sm">Warehouse (optional)</label>
                <SearchableSelect
                    options={warehouses.map(w => ({ id: w.id, name: w.name }))}
                    value={newItem.warehouseId}
                    onChange={(v) => setNewItem((p) => ({ ...p, warehouseId: v }))}
                    placeholder="Select Warehouse"
                    className="mt-1"
                />
              </div>

              {/* Mode & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Mode *</label>
                  <select
                    value={newItem.mode}
                    onChange={(e) =>
                      setNewItem((p) => ({ ...p, mode: e.target.value }))
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm">Status *</label>
                  <select
                    value={newItem.status}
                    onChange={(e) =>
                      setNewItem((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>

              {/* VNo */}
              {/* <div>
                <label className="text-sm">VNo</label>
                <input
                  value={newItem.vNo}
                  onChange={(e) => setNewItem((p) => ({ ...p, vNo: e.target.value }))}
                  className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div> */}

              {/* Note */}
              <div>
                <label className="text-sm">Note</label>
                <textarea
                  value={newItem.note}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, note: e.target.value }))
                  }
                  className="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Cancel
              </button>
              {hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE) && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                <Save size={16} /> Save
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl"
          >
            <div className="flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editItem.isInactive ? "Restore Stock" : "Edit Stock"}
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product (Edit modal) */}
              <div>
                <label className="text-sm">Product *</label>
                 <SearchableSelect 
                    options={products.map(p => ({ id: p.id, name: p.name }))}
                    value={editItem.productId}
                    onChange={(v) => setEditItem((p) => ({ ...p, productId: v }))}
                    placeholder="Select Product"
                    disabled={editItem.isInactive}
                    className="mt-1"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm">Quantity *</label>
                <input
                  type="text"
                  value={editItem.quantity}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^[0-9]*$/.test(v))
                      setEditItem((p) => ({ ...p, quantity: v }));
                  }}
                  placeholder="0"
                  className={`w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  disabled={editItem.isInactive}
                />
              </div>

              {/* Warehouse (Edit modal) */}
              <div>
                <label className="text-sm">Warehouse (optional)</label>
                <SearchableSelect
                    options={warehouses.map(w => ({ id: w.id, name: w.name }))}
                    value={editItem.warehouseId}
                    onChange={(v) => setEditItem((p) => ({ ...p, warehouseId: v }))}
                    placeholder="Select Warehouse"
                    disabled={editItem.isInactive}
                    className="mt-1"
                />
              </div>

              {/* Mode & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Mode *</label>
                  <select
                    value={editItem.mode}
                    onChange={(e) =>
                      setEditItem((p) => ({ ...p, mode: e.target.value }))
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                    disabled={editItem.isInactive}
                  >
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm">Status *</label>
                  <select
                    value={editItem.status}
                    onChange={(e) =>
                      setEditItem((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                    disabled={editItem.isInactive}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>

              {/* VNo */}
              {/* <div>
                <label className="text-sm">VNo</label>
                <input
                  value={editItem.vNo}
                  onChange={(e) => setEditItem((p) => ({ ...p, vNo: e.target.value }))}
                  className={`w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  disabled={editItem.isInactive}
                />
              </div> */}

              {/* Note */}
              <div>
                <label className="text-sm">Note</label>
                <textarea
                  value={editItem.note}
                  onChange={(e) =>
                    setEditItem((p) => ({ ...p, note: e.target.value }))
                  }
                  className={`w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 ${
                    editItem.isInactive ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  disabled={editItem.isInactive}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-between">
              {editItem.isInactive ? (
                hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.DELETE) && (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded"
                >
                  <ArchiveRestore size={16} /> Restore
                </button>
                )
              ) : (
                hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.DELETE) && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded"
                >
                  <Trash2 size={16} /> Delete
                </button>
                )
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>
                {!editItem.isInactive && hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.EDIT) && (
                  <button
                    onClick={handleUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded"
                  >
                    <Save size={16} /> Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLUMN PICKER */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setColumnModalOpen(false)}
          />
          <div className="relative w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-lg text-white">
            <div className="sticky top-0 bg-gray-900 flex justify-between px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Column Picker</h2>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search column..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value.toLowerCase())}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 px-5 pb-5">
              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Visible Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => tempVisibleColumns[col])
                    .filter((col) => col.includes(columnSearch))
                    .map((col) => (
                      <div
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                        key={col}
                      >
                        <span>{col.toUpperCase()}</span>
                        <button
                          className="text-red-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [col]: false,
                            }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-900/30 p-4 border border-gray-700 rounded max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-2">Hidden Columns</h3>
                <div className="space-y-2">
                  {Object.keys(tempVisibleColumns)
                    .filter((col) => !tempVisibleColumns[col])
                    .filter((col) => col.includes(columnSearch))
                    .map((col) => (
                      <div
                        className="bg-gray-800 px-3 py-2 rounded flex justify-between"
                        key={col}
                      >
                        <span>{col.toUpperCase()}</span>
                        <button
                          className="text-green-400"
                          onClick={() =>
                            setTempVisibleColumns((p) => ({
                              ...p,
                              [col]: true,
                            }))
                          }
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-5 bg-gray-900 px-5 py-3 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => setTempVisibleColumns(defaultColumns)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              >
                Restore Defaults
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setColumnModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setVisibleColumns(tempVisibleColumns);
                    setColumnModalOpen(false);
                  }}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <PageLayout>
<div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700 h-full">
  <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Update Stocks</h2>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center bg-gray-700 px-3 py-1.5 rounded border border-gray-600 w-full sm:w-60">
            <Search size={16} className="text-gray-300" />
            <input
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stocks..."
              className="bg-transparent pl-2 text-sm w-full outline-none"
            />
          </div>

          {hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE) && (
          <button
            onClick={() => {
              setModalOpen(true);
              refreshDropdowns();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded h-[35px]"
          >
            <Plus size={16} /> New Stock
          </button>
          )}

          <button
            onClick={() => {
              setSearchText("");
              loadRows();
              if (showInactive) loadInactiveRows();
            }}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <RefreshCw size={16} className="text-blue-400" />
          </button>

          <button
            onClick={openColumnPicker}
            className="p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <List size={16} className="text-blue-300" />
          </button>

          <button
            onClick={async () => {
              if (!showInactive) await loadInactiveRows();
              setShowInactive((s) => !s);
            }}
            className="p-1.5 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 flex items-center gap-2 h-[35px]"
          >
            <ArchiveRestore size={16} className="text-yellow-300" />
            <span className="text-xs opacity-80">Inactive</span>
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="mb-4">
          <FilterBar filters={filters} onClear={handleClearFilters} />
        </div>

        {/* TABLE */}
        <div className="flex-grow overflow-auto w-full min-h-0">
          <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] border-separate border-spacing-y-1 text-sm table-fixed">

              <colgroup>
                {visibleColumns.id && <col className="w-[80px]" />}
                {visibleColumns.product && <col className="w-[240px]" />}
                {visibleColumns.quantity && <col className="w-[100px]" />}
                {visibleColumns.warehouse && <col className="w-[200px]" />}
                {visibleColumns.mode && <col className="w-[80px]" />}
                {visibleColumns.status && <col className="w-[120px]" />}
                {visibleColumns.vNo && <col className="w-[120px]" />}
                {visibleColumns.note && <col className="w-[260px]" />}
              </colgroup>

              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-white text-center">
                   {visibleColumns.id && <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />}
                   {visibleColumns.product && <SortableHeader label="Product" sortKey="productName" currentSort={sortConfig} onSort={handleSort} />}
                   {visibleColumns.quantity && <SortableHeader label="Qty" sortKey="quantity" currentSort={sortConfig} onSort={handleSort} />}
                   {visibleColumns.warehouse && <SortableHeader label="Warehouse" sortKey="warehouseName" currentSort={sortConfig} onSort={handleSort} />}
                   {visibleColumns.mode && <SortableHeader label="Mode" sortKey="mode" currentSort={sortConfig} onSort={handleSort} />}
                   {visibleColumns.status && <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />}
                   {visibleColumns.vNo && <SortableHeader label="VNo" sortKey="vNo" currentSort={sortConfig} onSort={handleSort} />}
                   {visibleColumns.note && <SortableHeader label="Note" sortKey="note" currentSort={sortConfig} onSort={handleSort} />}
                </tr>
              </thead>

              <tbody className="text-center">
                {/* NO RECORDS */}
                {sortedList.length === 0 &&
                  (!showInactive || inactiveRows.length === 0) && (
                    <tr >
                      <td
                        colSpan={
                          Object.values(visibleColumns).filter(Boolean).length
                        }
                        className="px-4 py-6 text-center text-gray-400"
                      >
                        No records found
                      </td>
                    </tr>
                  )}

                {/* ACTIVE ROWS */}
                {sortedList.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-gray-900 hover:bg-gray-700 cursor-pointer"
                    onClick={() => openEdit(row, false)}
                  >
                    {visibleColumns.id && (
                      <td className="px-2 py-3 align-middle text-center">
                        {row.id}
                      </td>
                    )}

                    {visibleColumns.product && (
                      <td className="px-2 py-3 align-middle text-left pl-4 text-center">
                        {row.productName}
                      </td>
                    )}

                    {visibleColumns.quantity && (
                      <td className="px-2 py-3 align-middle text-center">
                        {row.quantity}
                      </td>
                    )}

                    {visibleColumns.warehouse && (
                      <td className="px-2 py-3 align-middle text-center">
                        {row.warehouseName}
                      </td>
                    )}

                    {visibleColumns.mode && (
                      <td className="px-2 py-3 align-middle text-center">
                        {row.mode}
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td className="px-2 py-3 align-middle text-center">
                        {row.status}
                      </td>
                    )}

                    {visibleColumns.vNo && (
                      <td className="px-2 py-3 align-middle text-center">
                        {row.vNo}
                      </td>
                    )}

                    {visibleColumns.note && (
                      <td className="px-2 py-3 align-middle text-left pl-4 text-center">
                        {row.note}
                      </td>
                    )}
                  </tr>
                ))}

                {/* INACTIVE ROWS */}
                {showInactive &&
                  inactiveRows.map((row) => (
                    <tr
                      key={`inactive-${row.id}`}
                      className="bg-gray-900 cursor-pointer opacity-40 line-through hover:bg-gray-700 rounded shadow-sm"
                      onClick={() => openEdit(row, true)}
                    >
                      {visibleColumns.id && (
                        <td className="px-2 py-3 align-middle text-center">
                          {row.id}
                        </td>
                      )}

                      {visibleColumns.product && (
                        <td className="px-2 py-3 align-middle text-left pl-4  text-center">
                          {row.productName}
                        </td>
                      )}

                      {visibleColumns.quantity && (
                        <td className="px-2 py-3 align-middle text-center">
                          {row.quantity}
                        </td>
                      )}

                      {visibleColumns.warehouse && (
                        <td className="px-2 py-3 align-middle text-center">
                          {row.warehouseName}
                        </td>
                      )}

                      {visibleColumns.mode && (
                        <td className="px-2 py-3 align-middle text-center">
                          {row.mode}
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="px-2 py-3 align-middle text-center">
                          {row.status}
                        </td>
                      )}

                      {visibleColumns.vNo && (
                        <td className="px-2 py-3 align-middle text-center">
                          {row.vNo}
                        </td>
                      )}

                      {visibleColumns.note && (
                        <td className="px-2 py-3 align-middle text-left pl-4  text-center">
                          {row.note}
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
          <Pagination
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            total={totalRecords}
            onRefresh={() => loadRows()}
          />
      </div>
    </div>
    </PageLayout>
    </>
  );
};

export default UpdateStocks;



