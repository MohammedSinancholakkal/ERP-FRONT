// src/pages/masters/UpdateStocks.jsx
import React, { useEffect, useState, useRef } from "react";

import MasterTable from "../../components/MasterTable";
import { useTheme } from "../../context/ThemeContext";

import toast from "react-hot-toast";

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
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";
import SearchableSelect from "../../components/SearchableSelect";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";

const UpdateStocks = () => {
  const { theme } = useTheme();

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
      <AddModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        title="New Stock"
        width="700px"
      >
        <div className="p-0 space-y-4">
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
      </AddModal>

      {/* EDIT MODAL */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        isInactive={editItem.isInactive}
        title={`${editItem.isInactive ? "Restore Stock" : "Edit Stock"}`}
        permissionDelete={hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.DELETE)}
        permissionEdit={hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.EDIT)}
        width="700px"
      >
        <div className="p-0 space-y-4">
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
      </EditModal>

      {/* COLUMN PICKER */}
      <ColumnPickerModal
        isOpen={columnModalOpen} 
        onClose={() => setColumnModalOpen(false)} 
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* MAIN PAGE */}
      <PageLayout>
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-semibold mb-4">Update Stocks</h2>

            <MasterTable
              columns={[
                visibleColumns.id && { key: "id", label: "ID", sortable: true },
                visibleColumns.product && { key: "productName", label: "Product", sortable: true },
                visibleColumns.quantity && { key: "quantity", label: "Qty", sortable: true },
                visibleColumns.warehouse && { key: "warehouseName", label: "Warehouse", sortable: true },
                visibleColumns.mode && { key: "mode", label: "Mode", sortable: true },
                visibleColumns.status && { key: "status", label: "Status", sortable: true },
                visibleColumns.vNo && { key: "vNo", label: "VNo", sortable: true },
                visibleColumns.note && { key: "note", label: "Note", sortable: true },
              ].filter(Boolean)}
              data={sortedList}
              inactiveData={inactiveRows}
              showInactive={showInactive}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={(r, isInactive) => openEdit(r, isInactive)}
              // Action Bar Props
              search={searchText}
              onSearch={handleSearch}
              onCreate={() => {
                setModalOpen(true);
                refreshDropdowns();
              }}
              createLabel="New Stock"
              permissionCreate={hasPermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE)}
              onRefresh={() => {
                setSearchText("");
                setFilterProduct("");
                setFilterWarehouse("");
                loadRows();
                if (showInactive) loadInactiveRows();
              }}
              onColumnSelector={openColumnPicker}
              onToggleInactive={async () => {
                if (!showInactive) await loadInactiveRows();
                setShowInactive((s) => !s);
              }}
            >
              <div className="">
                <FilterBar filters={filters} onClear={handleClearFilters} />
              </div>
            </MasterTable>

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