// src/pages/accounts/ChartOfAccounts.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageLayout from "../../layout/PageLayout";
import MasterTable from "../../components/MasterTable";
import Pagination from "../../components/Pagination";
import AddModal from "../../components/modals/AddModal";
import EditModal from "../../components/modals/EditModal";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import { 
  getCOAHeadsApi, 
  addCOAHeadApi, 
  updateCOAHeadApi, 
  deleteCOAHeadApi 
} from "../../services/allAPI";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { X, ChevronRight, ChevronDown } from "lucide-react";

const ChartOfAccounts = () => {
  const { theme } = useTheme();
  // -----------------------------------
  // VISIBILITY COLS
  // -----------------------------------
  const defaultColumns = {
    headCode: true,
    headName: true,
    headType: true,
    openingBalance: true,
    balance: true,
  };
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnModal, setColumnModal] = useState(false);

  // -----------------------------------
  // DATA STATES
  // -----------------------------------
  const [rawData, setRawData] = useState([]); 
  const [treeData, setTreeData] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [searchText, setSearchText] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  // -----------------------------------
  // MODAL STATES
  // -----------------------------------
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    id: null, // For edit
    headName: "",
    headCode: "",
    parentHead: "",
    parentHeadName: "",
    headLevel: 1,
    headType: "A",
    isTransaction: false,
    isGI: false,
    isActive: true 
  });

  // Parent Head Search
  const [parentHeadSearch, setParentHeadSearch] = useState("");
  const [isParentHeadDropdownOpen, setIsParentHeadDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsParentHeadDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  // -----------------------------------
  // LOAD DATA
  // -----------------------------------
  const buildTree = (flatList) => {
    const map = {};
    const roots = [];
    const list = flatList.map(item => ({ ...item, children: [] }));
    list.forEach(node => { map[node.headCode] = node; });
    list.forEach(node => {
      if (node.parentHead && map[node.parentHead]) {
         map[node.parentHead].children.push(node);
      } else {
         roots.push(node);
      }
    });
    return roots;
  };

  const loadData = async () => {
    try {
      const res = await getCOAHeadsApi();
      if (res && res.status === 200) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.records || []);
        setRawData(list);
        const tree = buildTree(list);
        setTreeData(tree);
        
        // Auto expand roots initially
        const initialExpanded = {};
        tree.forEach(n => { initialExpanded[n.id] = true; });
        setExpandedRows(prev => ({...prev, ...initialExpanded}));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Chart of Accounts");
    }
  };

  useEffect(() => { loadData(); }, []);

  // -----------------------------------
  // FLATTEN FOR TABLE
  // -----------------------------------
  // Compute flat list based on Expansion + Search
  const tableData = useMemo(() => {
    const result = [];
    
    // Filter Helper
    const matchesSearch = (node) => {
        if (!searchText) return true;
        const selfMatch = node.headName.toLowerCase().includes(searchText.toLowerCase()) || 
                          node.headCode.includes(searchText);
        if (selfMatch) return true;
        if (node.children) {
            return node.children.some(child => matchesSearch(child));
        }
        return false;
    };

    const traverse = (nodes, level = 0) => {
      nodes.forEach(node => {
        // If searching, only include if matches or has matching children
        if (searchText && !matchesSearch(node)) return;

        // Add to result
        result.push({ ...node, level });

        // Decide to traverse children
        // If sorting/searching, usually expand all? 
        // Or if expandedRows says so.
        // If searching, force expand.
        const isExpanded = searchText ? true : !!expandedRows[node.id];
        
        if (isExpanded && node.children && node.children.length > 0) {
            traverse(node.children, level + 1);
        }
      });
    };

    traverse(treeData);
    return result;
  }, [treeData, expandedRows, searchText]);

  // -----------------------------------
  // HANDLERS
  // -----------------------------------
  const toggleRow = (e, id) => {
    e.stopPropagation();
    setExpandedRows(p => ({ ...p, [id]: !p[id] }));
  };

  const resetForm = () => {
    setForm({
        id: null,
        headName: "",
        headCode: "",
        parentHead: "",
        parentHeadName: "",
        headLevel: 1,
        headType: "A",
        isTransaction: false,
        isGI: false,
        isActive: true
    });
    setParentHeadSearch("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddModalOpen(true);
  };

  // Row Click -> Edit
  const handleRowClick = (item) => {
    // If we want to allow editing
    if (!hasPermission(PERMISSIONS.FINANCIAL.EDIT)) return;

    setForm({
        id: item.id,
        headName: item.headName,
        headCode: item.headCode,
        parentHead: item.parentHead || "",
        parentHeadName: "", // Calculated below
        headLevel: item.headLevel,
        headType: item.headType,
        isTransaction: item.isTransaction,
        isGI: item.isGI,
        isActive: item.isActive ?? true
    });
    
    // Find parent name
    if (item.parentHead) {
        const parent = rawData.find(r => r.headCode === item.parentHead);
        if (parent) {
            setForm(prev => ({ ...prev, parentHeadName: parent.headName }));
            setParentHeadSearch(parent.headName);
        }
    } else {
        setParentHeadSearch("");
    }
    setEditModalOpen(true);
  };

  const generateNextHeadCode = (parentCode, children) => {
    if (!children || children.length === 0) {
       return `${parentCode}01`;
    }
    const codes = children.map(c => parseInt(c.headCode));
    const maxCode = Math.max(...codes);
    return (maxCode + 1).toString();
  };

  const handleParentHeadSelect = (option) => {
    const nextCode = generateNextHeadCode(option.headCode, option.children);
    setForm(prev => ({
      ...prev,
      parentHead: option.headCode,
      parentHeadName: option.headName,
      headLevel: (option.headLevel || 0) + 1,
      headType: option.headType || prev.headType,
      headCode: nextCode,
    }));
    setParentHeadSearch(option.path);
    setIsParentHeadDropdownOpen(false);
  };

  // Flatten options for dropdown (just simple list)
  const flattenDataForDropdown = (nodes, parentPath = "") => {
    let result = [];
    nodes.forEach((node) => {
      const currentPath = parentPath ? `${parentPath} -> ${node.headName}` : node.headName;
      result.push({ ...node, path: currentPath });
      if (node.children) {
        result = result.concat(flattenDataForDropdown(node.children, currentPath));
      }
    });
    return result;
  };
  const dropdownOptions = useMemo(() => flattenDataForDropdown(treeData), [treeData]);


  // SAVE
  const handleSave = async () => {
    if (!form.headName || !form.headCode) return toast.error("Head Name and Code are required");
    const user = JSON.parse(localStorage.getItem("user"));
    const payload = { ...form, userId: user?.userId || 1 };

    try {
        if (form.id) {
             const res = await updateCOAHeadApi(form.id, payload);
             if (res.status === 200) {
                 toast.success("Updated");
                 setEditModalOpen(false);
                 loadData();
             } else toast.error("Failed update");
        } else {
             const res = await addCOAHeadApi(payload);
             if (res.status === 201) {
                 toast.success("Added");
                 setAddModalOpen(false);
                 loadData();
             } else toast.error("Failed add");
        }
    } catch (err) {
        toast.error("Error occurred");
    }
  };

  const handleDelete = async () => {
     try {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await deleteCOAHeadApi(form.id, { userId: user?.userId || 1 });
        if (res.status === 200) {
            toast.success("Deleted");
            setEditModalOpen(false);
            loadData();
        }
     } catch (err) {
        toast.error("Delete failed (ensure no transactions/children)");
     }
  };

  // -----------------------------------
  // TABLE COLUMNS CONFIG
  // -----------------------------------
  const columns = [
    visibleColumns.headCode && { key: "headCode", label: "Head Code", sortable: true },
    visibleColumns.headName && { 
        key: "headName", 
        label: "Head Name", 
        // Custom Render for Tree
        render: (item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = searchText ? true : !!expandedRows[item.id]; // Force expand if search

            return (
                <div className="flex items-center" style={{ paddingLeft: `${item.level * 20}px` }}>
                    {hasChildren ? (
                        <button 
                            onClick={(e) => toggleRow(e, item.id)}
                            className="mr-2 p-0.5 rounded hover:bg-gray-700 focus:outline-none"
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <span className="w-[22px]"></span> // Spacer for alignment
                    )}
                    <span>{item.headName}</span>
                </div>
            );
        }
    },
    visibleColumns.headType && { key: "headType", label: "Type", className: "text-center" },
    visibleColumns.openingBalance && { key: "openingBalance", label: "Op. Bal", className: "text-right" },
    visibleColumns.balance && { key: "balance", label: "Balance", className: "text-right" },
  ].filter(Boolean);

  return (
    <PageLayout>
        {/* ADD MODAL */}
        <AddModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSave={handleSave}
            title="New Account Head"
        >
            <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Head Name *</label>
                    <input
                        value={form.headName}
                        onChange={(e) => setForm(p=>({...p, headName: e.target.value}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none"
                    />
                 </div>
                 
                 {/* Parent Select */}
                 <div className="col-span-2 relative" ref={dropdownRef}>
                    <label className="text-sm text-gray-400 block mb-1">Parent Head</label>
                    <div className="relative">
                        <input
                            value={parentHeadSearch}
                            onChange={(e) => {
                                setParentHeadSearch(e.target.value);
                                setIsParentHeadDropdownOpen(true);
                            }}
                            onClick={() => setIsParentHeadDropdownOpen(true)}
                            placeholder="Select Parent..."
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 pr-8 outline-none"
                        />
                        {parentHeadSearch && (
                            <button onClick={(e) => {
                                e.stopPropagation();
                                setParentHeadSearch("");
                                setForm(p => ({...p, parentHead: "", headCode: ""})); // Clear related
                            }} className="absolute right-2 top-2 text-gray-400 hover:text-white">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {isParentHeadDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 z-50 max-h-60 overflow-y-auto shadow-lg rounded mt-1">
                            {dropdownOptions
                                .filter(opt => opt.path.toLowerCase().includes(parentHeadSearch.toLowerCase()))
                                .map(opt => (
                                    <div 
                                        key={opt.id}
                                        onClick={() => handleParentHeadSelect(opt)}
                                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-700/50"
                                    >
                                        <div className="font-medium text-gray-200">{opt.headName}</div>
                                        <div className="text-xs text-gray-500">{opt.path}</div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                 </div>

                 <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Head Code</label>
                    <input
                        value={form.headCode}
                        onChange={(e) => setForm(p=>({...p, headCode: e.target.value}))}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-300"
                    />
                 </div>
                 
                 <div>
                    <label className="text-sm text-gray-400 block mb-1">Type</label>
                    <select
                        value={form.headType}
                        onChange={(e) => setForm(p=>({...p, headType: e.target.value}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none"
                    >
                        <option value="A">Assets</option>
                        <option value="L">Liabilities</option>
                        <option value="E">Expenses</option>
                        <option value="I">Income</option>
                        <option value="O">Equity</option>
                    </select>
                 </div>

                 <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={form.isTransaction}
                            onChange={e => setForm(p=>({...p, isTransaction: e.target.checked}))}
                            className="rounded bg-gray-800 border-gray-700 cursor-pointer"
                        />
                        Is Transaction
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={form.isGI}
                            onChange={e => setForm(p=>({...p, isGI: e.target.checked}))}
                            className="rounded bg-gray-800 border-gray-700 cursor-pointer"
                        />
                        Is GI
                    </label>
                 </div>
            </div>
        </AddModal>

        {/* EDIT MODAL */}
        <EditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={handleSave}
            onDelete={handleDelete}
            title={`Edit Head: ${form.headName}`}
            isInactive={!form.isActive} // If we had soft delete logic displayed
            permissionDelete={hasPermission(PERMISSIONS.FINANCIAL.DELETE)}
            permissionEdit={hasPermission(PERMISSIONS.FINANCIAL.EDIT)}
        >
             <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Head Name *</label>
                    <input
                        value={form.headName}
                        onChange={(e) => setForm(p=>({...p, headName: e.target.value}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none"
                    />
                 </div>
                 {/* Parent (Read Only in Edit usually, or restricted) */}
                 <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Parent Head</label>
                    <input
                        value={form.parentHeadName || "Root"}
                        disabled
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
                    />
                 </div>
                 <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Head Code</label>
                    <input
                        value={form.headCode}
                        disabled
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
                    />
                 </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={form.isTransaction}
                            onChange={e => setForm(p=>({...p, isTransaction: e.target.checked}))}
                            className="rounded bg-gray-800 border-gray-700 cursor-pointer"
                        />
                        Is Transaction
                    </label>
                 </div>
             </div>
        </EditModal>

        {/* COLUMN PICKER */}
        <ColumnPickerModal
            isOpen={columnModal}
            onClose={() => setColumnModal(false)}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            defaultColumns={defaultColumns}
        />

        {/* PAGE CONTENT */}
        <div className={`p-4 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
            <h2 className="text-2xl font-semibold mb-4">Chart of Accounts</h2>
            
            <MasterTable
                columns={columns}
                data={tableData}
                // No inactive data separation for tree view, handle visually if needed
                inactiveData={[]} 
                showInactive={false} 
                onToggleInactive={() => {}} // Disable inactive toggle or implement custom logic
                
                search={searchText}
                onSearch={setSearchText}
                
                onCreate={handleOpenAdd}
                createLabel="New Head"
                permissionCreate={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
                
                onRefresh={loadData}
                onColumnSelector={() => setColumnModal(true)}
                
                onRowClick={handleRowClick}
            />
            
            <Pagination
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={rawData.length}
            />
        </div>
    </PageLayout>
  );
};

export default ChartOfAccounts;
