// src/pages/accounts/ChartOfAccounts.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageLayout from "../../layout/PageLayout";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";
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
import { showSuccessToast, showErrorToast, showDeleteConfirm, showRestoreConfirm } from "../../utils/notificationUtils";
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
  const [showInactive, setShowInactive] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: "headCode", direction: "asc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
    // Deep copy to avoid mutation issues if refreshed
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
        
        // We only build tree for ACTIVE items primarily for the main table view
        // But let's build tree for ALL items to support search/parent calculation correctly
        // We will filter in useMemo
        const tree = buildTree(list); // building full tree
        setTreeData(tree);
        
        // Auto expand roots initially
        const initialExpanded = {};
        tree.forEach(n => { initialExpanded[n.id] = true; });
        setExpandedRows(prev => ({...prev, ...initialExpanded}));
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to load Chart of Accounts");
    }
  };

  useEffect(() => { loadData(); }, []);

  // -----------------------------------
  // FLATTEN FOR TABLE
  // -----------------------------------
  // Compute flat list based on Expansion + Search + Sort + Active Status
  const { tableData, inactiveTableData } = useMemo(() => {
    const activeResult = [];
    const inactiveResult = []; // We will just list them flat for simplicity or tree if possible

    // Helper to sort nodes
    const sortNodes = (nodes) => {
        if (!sortConfig.key) return nodes;
        return [...nodes].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };
    
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

    const traverse = (nodes, level = 0, isInactiveParent = false) => {
      const sorted = sortNodes(nodes);
      
      sorted.forEach(node => {
        // Determine if this node should be shown in active list or inactive list
        // Strategy: 
        // 1. If node is inactive -> goes to inactive list (flat).
        // 2. If node is active -> goes to active list (tree).
        //    But wait, if parent is inactive, children might be active?
        //    In standard ERP, if parent is inactive, children are usually hidden or inactive.
        //    For this view, we'll stick to: if isActive=false, it's in inactive list.
        
        const isNodeInactive = !node.isActive; // Assuming API returns isActive boolean

        if (isNodeInactive) {
            // Add to inactive result if it matches active filter (none currently) or search
            if (!searchText || matchesSearch(node)) {
                 inactiveResult.push({ ...node, level: 0 }); // Flat level for inactive
                 // Use recursive call to capture children as flat items too?
                 // Or just let the tree traversal handle them if they are also inactive?
                 // Since we are iterating the whole tree, we will encounter them.
            }
        } 
        
        // ACTIVE PATH
        else {
           // If passed search check
           if (!searchText || matchesSearch(node)) {
                activeResult.push({ ...node, level });
           }
        }

        // RECURSE CHILDREN
        // We always traverse children to find matches, but for visual tree structure in Active tab:
        const isExpanded = searchText ? true : !!expandedRows[node.id];
        
        // For active list traversal, we only dive deeper if expanded OR searching
        // For inactive gathering, we should probably dive always to find inactive children?
        // But traverse is single pass. 
        // If we are in "Active" mode (default), we only care about the Active Tree structure.
        // If we found an inactive node, we put it in inactive list.
        // Unlike TaxPercentage which just filters the flat list.
        
        if (node.children && node.children.length > 0) {
            // If searching, we traverse. If expanded, we traverse. 
            // If neither, we STILL need to traverse to find inactive children potentially?
            // Actually, to fully populate inactive list we must traverse everything.
            traverse(node.children, isNodeInactive ? 0 : level + 1, isNodeInactive);
        }
      });
    };

    // Use rawData to build active/inactive lists purely?
    // The tree traversal is good for the "Tree View" of active items.
    // For inactive items, a flat list is often better.
    // Let's implement a dual approach:
    // 1. Logic for Active Tree View
    // 2. Logic for Inactive Flat View
    
    // RE-IMPLEMENTING TRAVERSE SPECIFICALLY FOR ACTIVE TREE
    const traverseActive = (nodes, level = 0) => {
        const sorted = sortNodes(nodes);
        sorted.forEach(node => {
             if (!node.isActive) return; // Skip inactive nodes in the active tree
             
             if (searchText && !matchesSearch(node)) return; // Skip if no match
             
             activeResult.push({ ...node, level });
             
             const isExpanded = searchText ? true : !!expandedRows[node.id];
             if (isExpanded && node.children) {
                 traverseActive(node.children, level + 1);
             }
        });
    };

    // For Inactive, just filter rawData
    const inactiveFlat = rawData.filter(d => !d.isActive && (
        !searchText || 
        d.headName.toLowerCase().includes(searchText.toLowerCase()) || 
        d.headCode.includes(searchText)
    ));
    
    // Sort inactive flat
    const inactiveSorted = sortNodes(inactiveFlat);
    inactiveSorted.forEach(n => inactiveResult.push(n));

    traverseActive(treeData);

    return { tableData: activeResult, inactiveTableData: inactiveResult };
  }, [treeData, expandedRows, searchText, sortConfig, rawData]);

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
    if (!form.headName || !form.headCode) return showErrorToast("Head Name and Code are required");
    const user = JSON.parse(localStorage.getItem("user"));
    const payload = { ...form, userId: user?.userId || 1 };

    try {
        if (form.id) {
             const res = await updateCOAHeadApi(form.id, payload);
             if (res.status === 200) {
                 showSuccessToast("Updated Successfully");
                 setEditModalOpen(false);
                 loadData();
             } else showErrorToast("Failed update");
        } else {
             const res = await addCOAHeadApi(payload);
             if (res.status === 201) {
                 showSuccessToast("Added Successfully");
                 setAddModalOpen(false);
                 loadData();
             } else showErrorToast("Failed add");
        }
    } catch (err) {
        showErrorToast("Error occurred");
    }
  };

  const handleDelete = async () => {
     const result = await showDeleteConfirm();
     if (!result.isConfirmed) return;

     try {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await deleteCOAHeadApi(form.id, { userId: user?.userId || 1 });
        if (res.status === 200) {
            showSuccessToast("Deleted");
            setEditModalOpen(false);
            loadData();
        }
     } catch (err) {
        showErrorToast("Delete failed (ensure no transactions/children)");
     }
  };

  const handleRestore = async () => {
    const result = await showRestoreConfirm();
    if (result.isConfirmed) {
        try {
           // We reuse updateCOAHeadApi to set isActive: true
           // Ideally we should have a dedicated restore API if the backend requires it,
           // but traditionally we just update the flag if it's soft delete via boolean.
           // However, if the backend uses a deletedAt timestamp and a specific restore endpoint, we should use that.
           // Checking allAPI.js, there is NO restoreCOAHeadApi. 
           // BUT deleteCOAHeadApi sets it to inactive? Or deletes it?
           // The commonAPI pattern usually has /restore/.
           // Since `deleteCOAHeadApi` calls `PUT .../delete/:id`, it's likely a soft delete toggle.
           // To restore, we might need a similar toggle or just update `isActive: true`.
           // Let's assume update with isActive: true works based on typical implementations here.
           
           const user = JSON.parse(localStorage.getItem("user"));
           const payload = { ...form, isActive: true, userId: user?.userId || 1 };
           const res = await updateCOAHeadApi(form.id, payload);
           
           if (res?.status === 200) {
             showSuccessToast("Restored");
             setEditModalOpen(false);
             loadData();
           }
        } catch (error) {
            console.error(error);
            showErrorToast("Restore Failed");
        }
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
        sortable: true,
        // Custom Render for Tree
        render: (item) => {
            // For inactive items, we show flat, so level might be 0 or undefined, effectively flat.
            const level = item.level || 0;
            const hasChildren = item.children && item.children.some(c => c.isActive) && !showInactive; // crude check
            // Actually, for active tree, `item.children` exists.
            const showToggle = item.children && item.children.length > 0 && item.isActive; 
            
            // Should indentation apply to inactive items? Probably not if flat.
            const indent = item.isActive ? level * 20 : 0;
            const isExpanded = searchText ? true : !!expandedRows[item.id];

            return (
                <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
                    {showToggle ? (
                        <button 
                            onClick={(e) => toggleRow(e, item.id)}
                            className="mr-2 p-0.5 rounded hover:bg-gray-700 focus:outline-none"
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        // Spacer for alignment if active and inside tree structure, but leaf
                        item.isActive ? <span className="w-[22px]"></span> : null
                    )}
                    <span>{item.headName}</span>
                </div>
            );
        }
    },
    visibleColumns.headType && { key: "headType", label: "Type", className: "text-center", sortable: true },
    visibleColumns.openingBalance && { key: "openingBalance", label: "Op. Bal", className: "text-right", sortable: true },
    visibleColumns.balance && { key: "balance", label: "Balance", className: "text-right", sortable: true },
  ].filter(Boolean);

  return (
    <PageLayout>
        {/* ADD MODAL */}
        <AddModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSave={handleSave}
            title="New Account Head"
            permission={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
        >
            <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <InputField
                        label="Head Name *"
                        value={form.headName}
                        onChange={(e) => setForm(p=>({...p, headName: e.target.value}))}
                        placeholder="e.g. Current Assets"
                        required
                    />
                 </div>
                 
                 {/* Parent Select */}
                 <div className="col-span-2 relative" ref={dropdownRef}>
                    <label className="text-sm text-black font-medium block mb-1">Parent Head</label>
                    <div className="relative">
                        <input
                            value={parentHeadSearch}
                            onChange={(e) => {
                                setParentHeadSearch(e.target.value);
                                setIsParentHeadDropdownOpen(true);
                            }}
                            onClick={() => setIsParentHeadDropdownOpen(true)}
                            placeholder="Select Parent..."
                            className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                                theme === "emerald"
                                  ? "bg-emerald-50 border-emerald-600 text-emerald-900 placeholder-emerald-400 focus:border-emerald-400"
                                  : theme === "purple"
                                  ? "bg-white border-gray-300 text-purple-900 placeholder-gray-400 placeholder:text-xs focus:border-gray-500"
                                  : "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
                            }`}
                        />
                        {parentHeadSearch && (
                            <button onClick={(e) => {
                                e.stopPropagation();
                                setParentHeadSearch("");
                                setForm(p => ({...p, parentHead: "", headCode: ""})); // Clear related
                            }} className="absolute right-2 top-2 text-gray-400 hover:text-red-500">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {isParentHeadDropdownOpen && (
                        <div className={`absolute top-full left-0 right-0 z-50 max-h-60 overflow-y-auto shadow-lg rounded mt-1 border ${
                             theme === "purple" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700"
                        }`}>
                            {dropdownOptions
                                .filter(opt => opt.path.toLowerCase().includes(parentHeadSearch.toLowerCase()))
                                .map(opt => (
                                    <div 
                                        key={opt.id}
                                        onClick={() => handleParentHeadSelect(opt)}
                                        className={`px-3 py-2 cursor-pointer text-sm border-b ${
                                            theme === "purple" 
                                              ? "hover:bg-purple-50 text-gray-800 border-gray-100" 
                                              : "hover:bg-gray-700 text-gray-200 border-gray-700/50"
                                        }`}
                                    >
                                        <div className="font-medium">{opt.headName}</div>
                                        <div className="text-xs text-gray-500">{opt.path}</div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                 </div>

                 <div className="col-span-2">
                    <InputField
                        label="Head Code"
                        value={form.headCode}
                        onChange={(e) => setForm(p=>({...p, headCode: e.target.value}))}
                        placeholder="Auto-generated"
                    />
                 </div>
                 
                 <div>
                    <label className="text-sm text-black font-medium block mb-1">Type</label>
                    <select
                        value={form.headType}
                        onChange={(e) => setForm(p=>({...p, headType: e.target.value}))}
                        className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
                              theme === "emerald"
                                ? "bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400"
                                : theme === "purple"
                                ? "bg-white border-gray-300 text-purple-900 focus:border-gray-500"
                                : "bg-gray-800 border-gray-700 text-white"
                        }`}
                    >
                        <option value="A">Assets</option>
                        <option value="L">Liabilities</option>
                        <option value="E">Expenses</option>
                        <option value="I">Income</option>
                        <option value="O">Equity</option>
                    </select>
                 </div>

                 <div className="flex flex-col gap-2 justify-center">
                    <label className={`flex items-center gap-2 text-sm cursor-pointer ${theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <input 
                            type="checkbox" 
                            checked={form.isTransaction}
                            onChange={e => setForm(p=>({...p, isTransaction: e.target.checked}))}
                            className="rounded border-gray-300 cursor-pointer"
                        />
                        Is Transaction
                    </label>
                    <label className={`flex items-center gap-2 text-sm cursor-pointer ${theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <input 
                            type="checkbox" 
                            checked={form.isGI}
                            onChange={e => setForm(p=>({...p, isGI: e.target.checked}))}
                            className="rounded border-gray-300 cursor-pointer"
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
            onRestore={handleRestore}
            isInactive={!form.isActive} 
            title={!form.isActive ? "Restore Head" : `Edit Head: ${form.headName}`}
            permissionDelete={hasPermission(PERMISSIONS.FINANCIAL.DELETE)}
            permissionEdit={hasPermission(PERMISSIONS.FINANCIAL.EDIT)}
            saveText="Update"
        >
             <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <InputField
                        label="Head Name *"
                        value={form.headName}
                        onChange={(e) => setForm(p=>({...p, headName: e.target.value}))}
                        disabled={!form.isActive}
                        required
                    />
                 </div>
                 {/* Parent (Read Only) */}
                 <div className="col-span-2">
                    <InputField
                        label="Parent Head"
                        value={form.parentHeadName || "Root"}
                        disabled
                    />
                 </div>
                 <div className="col-span-2">
                    <InputField
                        label="Head Code"
                        value={form.headCode}
                        disabled
                    />
                 </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <label className={`flex items-center gap-2 text-sm cursor-pointer ${theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <input 
                            type="checkbox" 
                            checked={form.isTransaction}
                            onChange={e => setForm(p=>({...p, isTransaction: e.target.checked}))}
                            disabled={!form.isActive}
                            className="rounded border-gray-300 cursor-pointer"
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
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
            <ContentCard>
                <div className="flex flex-col h-full overflow-hidden gap-2">
                    <h2 className="text-xl font-bold text-[#6448AE] mb-2">Chart of Accounts</h2>
                    <hr className="mb-4 border-gray-300" />
            
                    <MasterTable
                        columns={columns}
                        data={tableData}
                        inactiveData={inactiveTableData} 
                        showInactive={showInactive} 
                        onToggleInactive={async () => {
                            setShowInactive(!showInactive);
                        }} 
                        
                        search={searchText}
                        onSearch={setSearchText}
                        
                        onCreate={handleOpenAdd}
                        createLabel="New Head"
                        permissionCreate={hasPermission(PERMISSIONS.FINANCIAL.CREATE)}
                        
                        onRefresh={loadData}
                        onColumnSelector={() => setColumnModal(true)}
                        
                        onRowClick={handleRowClick}

                        sortConfig={sortConfig}
                        onSort={handleSort}

                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        total={rawData.length}
                    />
                </div>
            </ContentCard>
        </div>
    </PageLayout>
  );
};

export default ChartOfAccounts;
