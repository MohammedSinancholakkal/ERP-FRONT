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

  /* Dropdown Dummy Data */
  const categories = [
    { id: 1, name: "Electronics" },
    { id: 2, name: "Stationery" }
  ];

  /* Table Dummy Data */
  const activeData = [
    {
      id: 1,
      productName: "Monitor",
      categoryName: "Electronics",
      purchasePrice: 5000,
      salePrice: 6500,
      qtyIn: 50,
      qtyOut: 20,
      stock: 30
    },
    {
      id: 2,
      productName: "Notebook",
      categoryName: "Stationery",
      purchasePrice: 20,
      salePrice: 35,
      qtyIn: 100,
      qtyOut: 40,
      stock: 60
    }
  ];

  const inactiveData = [
    {
      id: 3,
      productName: "Headphones",
      categoryName: "Electronics",
      purchasePrice: 1200,
      salePrice: 1800,
      qtyIn: 30,
      qtyOut: 25,
      stock: 5
    }
  ];

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

            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Stock Report</h2>
            <hr className="mb-4 border-gray-300" />
            
             <MasterTable
                columns={[
                    visibleColumns.productName && { key: "productName", label: "Product Name", sortable: true },
                    visibleColumns.categoryName && { key: "categoryName", label: "Category", sortable: true },
                    visibleColumns.purchasePrice && { key: "purchasePrice", label: "Purchase Price", sortable: true },
                    visibleColumns.salePrice && { key: "salePrice", label: "Sale Price", sortable: true },
                    visibleColumns.qtyIn && { key: "qtyIn", label: "Qty In", sortable: true },
                    visibleColumns.qtyOut && { key: "qtyOut", label: "Qty Out", sortable: true },
                    visibleColumns.stock && { key: "stock", label: "Stock", sortable: true },
                ].filter(Boolean)}
                data={activeData}
                inactiveData={inactiveData}
                showInactive={showInactive}
                // sortConfig={sortConfig}
                // onSort={handleSort}
                // onRowClick={(r) => openEditModal(r)}
                // Action Bar
                search={searchText}
                onSearch={setSearchText}
                // onCreate={() => setModalOpen(true)}
                createLabel="New Report"
                // permissionCreate={hasPermission(PERMISSIONS.CASH_BANK.CREATE)}
                onRefresh={() => {
                    setSearchText("");
                    setPage(1);
                    toast.success("Refreshed");
                }}
                onColumnSelector={() => setColumnModal(true)}
                onToggleInactive={() => setShowInactive((s) => !s)}
                
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={activeData.length} // using dummy length
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



