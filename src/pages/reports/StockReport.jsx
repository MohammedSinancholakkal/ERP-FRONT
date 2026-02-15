import React, { useState } from "react";
import {
  ArchiveRestore,
  List,
  RefreshCw,
  Search,
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import Pagination from "../../components/Pagination";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";
import MasterTable from "../../components/MasterTable";
import ContentCard from "../../components/ContentCard";
import ColumnPickerModal from "../../components/modals/ColumnPickerModal";
import { useTheme } from "../../context/ThemeContext";
import toast from 'react-hot-toast';
import { getStockReportApi } from "../../services/allAPI";

/* Searchable Dropdown */
import FilterBar from "../../components/FilterBar";

/* COLUMN PICKER */



const StockReport = () => {
    const { theme } = useTheme();
  if (!hasPermission(PERMISSIONS.REPORTS.VIEW)) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to view this report.</p>
        </div>
      </div>
    );
  }
  /* UI State */
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [columnModal, setColumnModal] = useState(false);

  /* Filters */
  const [filterCategory, setFilterCategory] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  /* Columns */
  const defaultColumns = {
    productName: true,
    categoryName: true,
    purchasePrice: true,
    salePrice: true,
    qtyIn: true,
    qtyOut: true,
    stock: true
  };

  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  /* State for Data */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  /* Fetch Data */
  const fetchReport = async () => {
    try {
        setLoading(true);
        const res = await getStockReportApi();
        if (res.status === 200) {
            setData(res.data.records || []);
        } else {
            toast.error("Failed to load stock report");
        }
    } catch (error) {
        console.error("Error fetching stock report:", error);
        toast.error("Failed to load stock report");
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReport();
  }, []);


  // DERIVE CATEGORIES FOR FILTER
  // We can just extract unique category names from the loaded 'data'
  const categories = React.useMemo(() => {
    const unique = [...new Set(data.map(d => d.categoryName).filter(Boolean))];
    return unique.map((c, i) => ({ id: c, name: c }));
  }, [data]);

   // Filtered Data
   const filteredData = data.filter(d => {
    const matchesSearch = d.productName.toLowerCase().includes(searchText.toLowerCase()) ||
                          (d.categoryName && d.categoryName.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesCategory = filterCategory ? d.categoryName === filterCategory : true;
    
    return matchesSearch && matchesCategory;
   });

   // Pagination
   const paginatedData = filteredData.slice((page - 1) * limit, page * limit);



  return (
    <>
      {/* COLUMN PICKER */}
       <ColumnPickerModal
        isOpen={columnModal} 
        onClose={() => setColumnModal(false)}
        visibleColumns={visibleColumns} 
        setVisibleColumns={setVisibleColumns} 
        defaultColumns={defaultColumns} 
      />

      {/* PAGE */}
      <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
             <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <h2 className={`text-xl font-bold ${theme === 'purple' ? 'text-purple-800' : theme === 'emerald' ? 'text-emerald-800' : 'text-white'}`}>Stock Report</h2>
            <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.productName && { key: "productName", label: "Product Name", sortable: true },
                    visibleColumns.categoryName && { key: "categoryName", label: "Category", sortable: true },
                    visibleColumns.purchasePrice && { key: "purchasePrice", label: "Purchase Price", sortable: true, render: (r) => (r.purchasePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.salePrice && { key: "salePrice", label: "Sale Price", sortable: true, render: (r) => (r.salePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    visibleColumns.qtyIn && { key: "qtyIn", label: "Qty In", sortable: true },
                    visibleColumns.qtyOut && { key: "qtyOut", label: "Qty Out", sortable: true },
                    visibleColumns.stock && { key: "stock", label: "Stock", sortable: true },
                ].filter(Boolean)}
                data={paginatedData}
                // activeData and inactiveData removed - using single active list
                
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                
                onRefresh={() => {
                    fetchReport();
                    setSearchText("");
                    setPage(1);
                }}
                onColumnSelector={() => setColumnModal(true)}
                // onToggleInactive removed for reports usually
                
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={filteredData.length}
                loading={loading}
            >
             {/* FILTERS */}
                <FilterBar
                  filters={[
                    {
                      type: 'select',
                      value: filterCategory,
                      onChange: setFilterCategory,
                      options: categories,
                      placeholder: "Filter by Category"
                    }
                  ]}
                  onClear={() => setFilterCategory("")}
                />
            </MasterTable>
          </div>
          </ContentCard>
        </div>
      </PageLayout>
      
    </>
  );
};

export default StockReport;



