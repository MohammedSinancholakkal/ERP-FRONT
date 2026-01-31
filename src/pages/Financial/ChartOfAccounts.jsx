import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCOAHeadsApi } from '../../services/allAPI';
import ColumnPickerModal from '../../components/modals/ColumnPickerModal';
import { ChevronDown, ChevronRight, Folder, FileText, Plus, Minus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { showErrorToast } from '../../utils/notificationUtils';
import PageLayout from '../../layout/PageLayout';
import ContentCard from '../../components/ContentCard';
import MasterTable from '../../components/MasterTable';

const ChartOfAccounts = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState({}); 
    
    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [searchText, setSearchText] = useState("");

    // Column Picker
    const [columnModal, setColumnModal] = useState(false);
    
    // Removed 'actions' from default columns
    const defaultColumns = {
        headCode: true,
        headName: true,
        openingBalance: true,
        balance: true
        // actions: true  <-- REMOVED
    };
    const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getCOAHeadsApi();
            setAccounts(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
            showErrorToast("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. Build Tree Structure with Recursive Sum
    const treeData = useMemo(() => {
        if (!Array.isArray(accounts)) return [];
        const map = {};
        const roots = [];
        
        // Deep copy
        const nodes = accounts.map(a => ({ 
            ...a, 
            children: [],
            // Ensure numbers
            openingBalance: Number(a.openingBalance || 0),
            balance: Number(a.balance || 0)
        }));
        
        nodes.forEach(node => {
            // Normalize to string to ensure matching works even if one is string and other is number
            const code = String(node.headCode);
            const parent = String(node.parentHead);
            
            map[code] = node;
            
            // Store normalized parent for later check
            node._parentStr = parent; 
        });

        nodes.forEach(node => {
            const parent = node._parentStr;
            // '0' is root
            if (parent === '0' || !map[parent]) {
                roots.push(node);
            } else {
                if(map[parent]) {
                    map[parent].children.push(node);
                }
            }
        });

        // Recursive Summation and Sort
        const processNode = (node) => {
             // Sor Children
             if (node.children.length > 0) {
                 node.children.sort((a, b) => a.headCode.localeCompare(b.headCode));
                 
                 // Process children first (bottom-up sum)
                 let childOpening = 0;
                 let childBalance = 0;
                 
                 node.children.forEach(child => {
                     processNode(child);
                     childOpening += child.openingBalance;
                     childBalance += child.balance;
                 });

                 // Add children sums to current node (Recursive Summation)
                 // This works for both Folders (DB=0) and Mixed Nodes (DB=Value)
                 node.openingBalance += childOpening;
                 node.balance += childBalance;
                 // If it IS a transaction node, it keeps its own DB balance (children sum + own should be same if it has no children)
             }
        };

        roots.sort((a, b) => a.headCode.localeCompare(b.headCode));
        roots.forEach(root => processNode(root));
        
        return roots;
    }, [accounts]);

    // 2. Flatten Tree for Table
    const tableData = useMemo(() => {
        if (searchText.trim()) {
            // Flat Search Mode
            return accounts.filter(a => 
                a.headName.toLowerCase().includes(searchText.toLowerCase()) || 
                a.headCode.includes(searchText)
            );
        }

        const flattened = [];
        const flatten = (nodes, level = 0) => {
            nodes.forEach(node => {
                flattened.push({ ...node, level, hasChildren: node.children && node.children.length > 0 });
                if (expandedNodes[node.headCode] && node.children.length > 0) {
                    flatten(node.children, level + 1);
                }
            });
        };
        flatten(treeData);
        return flattened;
    }, [treeData, expandedNodes, searchText, accounts]);

    // 3. Client-Side Pagination
    const paginatedData = useMemo(() => {
        const start = (page - 1) * limit;
        return tableData.slice(start, start + limit);
    }, [tableData, page, limit]);

    const handleToggle = (node) => {
        setExpandedNodes(prev => ({ ...prev, [node.headCode]: !prev[node.headCode] }));
    };

    const handleAddClick = (parentNode) => {
        if (parentNode) {
            navigate('/app/financial/newaccount', { state: { parentNode } });
        } else {
            navigate('/app/financial/newaccount');
        }
    };

    // Row click enters Edit Mode
    const handleRowClick = (row) => {
        navigate('/app/financial/newaccount', { state: { account: row } });
    };

    // Columns Definition
    const columns = [
        visibleColumns.headCode && { 
            key: 'headCode', 
            label: 'Head Code', 
            sortable: true,
            className: "w-32 align-top"
        },
        visibleColumns.headName && { 
            key: 'headName', 
            label: 'Head Name', 
            sortable: false,
            render: (row) => {
                if(searchText.trim()) {
                    return (
                        <div className="flex items-center gap-2">
                             {row.isTransaction && <FileText size={16} className="text-blue-500" />}
                             <span>{row.headName}</span>
                        </div>
                    );
                }

                const paddingLeft = row.level * 24; 
                return (
                    <div className="flex items-center w-full min-w-[250px]" style={{ paddingLeft: `${paddingLeft}px` }}>
                        <div 
                            className={`w-4 h-4 shrink-0 flex items-center justify-center cursor-pointer mr-2 rounded border transition-colors ${
                                row.hasChildren 
                                    ? (theme === 'purple' || theme === 'emerald' ? 'border-purple-800 text-purple-800 bg-purple-50' : 'border-gray-400 text-gray-600 bg-white')
                                    : 'border-transparent'
                            }`}
                            onClick={(e) => { 
                                if(row.hasChildren) {
                                    e.stopPropagation(); 
                                    handleToggle(row); 
                                }
                            }}
                        >
                            {row.hasChildren && (
                                expandedNodes[row.headCode] ? <Minus size={10} strokeWidth={3} /> : <Plus size={10} strokeWidth={3} />
                            )}
                        </div>
                        <span className={`truncate ${!row.isTransaction ? 'font-semibold' : ''}`}>{row.headName}</span>
                    </div>
                );
            }
        },
        visibleColumns.openingBalance && {
            key: 'openingBalance',
            label: 'Opening Balance',
            render: (row) => Number(row.openingBalance || 0).toFixed(2)
        },
        visibleColumns.balance && {
            key: 'balance',
            label: 'Balance',
            render: (row) => Number(row.balance || 0).toFixed(2)
        }
        // Removed Actions Column
    ].filter(Boolean);

    return (
        <PageLayout>
             <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
                <ContentCard>
                     <div className="flex flex-col h-full overflow-hidden gap-2">
                            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Chart of Accounts</h2>
                            <hr className="mb-4 border-gray-300" />

                            <MasterTable 
                                columns={columns}
                                data={paginatedData}
                                total={tableData.length}
                                page={page}
                                setPage={setPage}
                                limit={limit}
                                setLimit={setLimit}
                                search={searchText}
                                onSearch={setSearchText}
                                onCreate={() => handleAddClick(null)}
                                createLabel="New Account"
                                onRefresh={() => {
                                    fetchData();
                                    setSearchText("");
                                }}
                                onColumnSelector={() => setColumnModal(true)}
                                disableToolbar={false}
                                onRowClick={handleRowClick}
                            />
                     </div>
                </ContentCard>
            </div>

            <ColumnPickerModal
                isOpen={columnModal}
                onClose={() => setColumnModal(false)}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                defaultColumns={defaultColumns}
            />
        </PageLayout>
    );
};

export default ChartOfAccounts;
