import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  Search,
  LineChart,
  Folder,
  Boxes,
  Users2,
  Wallet,
  Shield,
  FileText,
  Briefcase,
  ShoppingCart,
  Landmark,
  BarChart3,
  Receipt,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import "../styles/Dashboard.css";
import { useSettings } from "../contexts/SettingsContext";
import { serverURL } from "../services/serverURL";
import { useTheme } from "../context/ThemeContext";
import { hasPermission, hasAnyPermission } from "../utils/permissionUtils";
import { PERMISSIONS } from "../constants/permissions";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme } = useTheme();
  // Dropdown states
  const [openMasters, setOpenMasters] = useState(false);
  const [openMeeting, setOpenMeeting] = useState(false);
  const [openBusinessPartners, setOpenBusinessPartners] = useState(false);
  const [openInventory, setOpenInventory] = useState(false);
  const [openSales, setOpenSales] = useState(false);
  const [openPurchasing, setOpenPurchasing] = useState(false);
  const [openServices, setOpenServices] = useState(false);
  const [openCashBank, setOpenCashBank] = useState(false);
  const [openFinancial, setOpenFinancial] = useState(false);
  const [openHR, setOpenHR] = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);

  const [search, setSearch] = useState("");

  const location = useLocation();
  const { settings } = useSettings();

  const companyName = settings?.companyName?.trim() || "Homebutton";

  
      const baseUrl = serverURL.replace("/api", "");
      const logoUrl = settings?.logoPath
        ? `${baseUrl}/${settings.logoPath}`
        : null;


  const formatRoute = (item) => item.replace(/\s+/g, "").toLowerCase();

  // Close all dropdowns
  const closeAll = () => {
    setOpenMasters(false);
    setOpenMeeting(false);
    setOpenBusinessPartners(false);
    setOpenInventory(false);
    setOpenSales(false);
    setOpenPurchasing(false);
    setOpenServices(false);
    setOpenCashBank(false);
    setOpenFinancial(false);
    setOpenHR(false);
    setOpenReports(false);
    setOpenAdmin(false);
  };

  // Links with Permissions
  // If key is null, it shows for everyone (or you can restrict it)
  // For now, assuming null = visible to basic users or handled elsewhere
  const masterLinks = [
    { label: "Countries", key: PERMISSIONS.COUNTRIES.VIEW },
    { label: "States", key: PERMISSIONS.STATES.VIEW },
    { label: "Cities", key: PERMISSIONS.CITIES.VIEW },
    { label: "Banks", key: PERMISSIONS.BANKS.VIEW },
    { label: "Expense Types", key: PERMISSIONS.EXPENSE_TYPES.VIEW },
    { label: "Services", key: PERMISSIONS.SERVICES_MASTER.VIEW },
    { label: "Territories", key: PERMISSIONS.TERRITORIES.VIEW },
    { label: "Regions", key: PERMISSIONS.REGIONS.VIEW },
    { label: "Shippers", key: PERMISSIONS.SHIPPERS.VIEW },
    { label: "Warehouses", key: PERMISSIONS.WAREHOUSES.VIEW },
    { label: "Customer Groups", key: PERMISSIONS.CUSTOMER_GROUPS.VIEW },
    { label: "Supplier Groups", key: PERMISSIONS.SUPPLIER_GROUPS.VIEW },
    { label: "Agenda Item Types", key: PERMISSIONS.AGENDA_ITEM_TYPES.VIEW },
    { label: "Meeting Types", key: PERMISSIONS.MEETING_TYPES.VIEW },
    { label: "Locations", key: PERMISSIONS.LOCATIONS.VIEW },
    { label: "Attendance Status", key: PERMISSIONS.ATTENDANCE_STATUS.VIEW },
    { label: "Attendee Types", key: PERMISSIONS.ATTENDEE_TYPES.VIEW },
    { label: "Resolution Status", key: PERMISSIONS.RESOLUTION_STATUS.VIEW },
    { label: "Deductions", key: PERMISSIONS.DEDUCTIONS.VIEW },
    { label: "Incomes", key: PERMISSIONS.INCOMES.VIEW },
  ];

  const meetingLinks = [
    { label: "Meetings", key: PERMISSIONS.MEETINGS.VIEW }
  ];

  const inventoryLinks = [
    { label: "Products", key: PERMISSIONS.INVENTORY.PRODUCTS.VIEW },
    { label: "Categories", key: PERMISSIONS.INVENTORY.CATEGORIES.VIEW },
    { label: "Units", key: PERMISSIONS.INVENTORY.UNITS.VIEW },
    { label: "Brands", key: PERMISSIONS.INVENTORY.BRANDS.VIEW },
    { label: "Damaged Products", key: PERMISSIONS.INVENTORY.DAMAGED_PRODUCTS.VIEW },
    { label: "Goods Receipts", key: PERMISSIONS.INVENTORY.GOODS_RECEIPTS.VIEW },
    { label: "Goods Issue", key: PERMISSIONS.INVENTORY.GOODS_ISSUE.VIEW },
    { label: "Update Stock", key: "update_stock" } // Keeping commented if not in constants yet, or map to general
  ];

  const salesLinks = [
    { label: "New Sale Quotation", key: PERMISSIONS.SALES.CREATE }, 
    { label: "New Sale", key: PERMISSIONS.SALES.CREATE },
    { label: "Sales", key: PERMISSIONS.SALES.VIEW },
    { label: "Sales Quotations", key: PERMISSIONS.SALES.VIEW }
  ];

  const bpLinks = [
    { label: "New Customer", key: PERMISSIONS.CUSTOMERS.CREATE },
    { label: "New Supplier", key: PERMISSIONS.SUPPLIERS.CREATE },
    { label: "Customers", key: PERMISSIONS.CUSTOMERS.VIEW },
    { label: "Suppliers", key: PERMISSIONS.SUPPLIERS.VIEW }
  ];

  const purchaseLinks = [
    { label: "New Purchase", key: PERMISSIONS.PURCHASING.CREATE },
    { label: "Purchases", key: PERMISSIONS.PURCHASING.VIEW }
  ];

  const servicesLinks = [
    { label: "New Invoice", key: PERMISSIONS.SERVICES.CREATE },
    { label: "Invoices", key: PERMISSIONS.SERVICES.VIEW }
  ];

  const cashBankLinks = [
    { label: "Bank Transaction", key: PERMISSIONS.CASH_BANK.VIEW },
    { label: "Expenses", key: PERMISSIONS.CASH_BANK.VIEW },
    { label: "Customer Receive", key: PERMISSIONS.CASH_BANK.VIEW },
    { label: "Supplier Payment", key: PERMISSIONS.CASH_BANK.VIEW },
    { label: "Cash Adjustment", key: PERMISSIONS.CASH_BANK.VIEW }
  ];

  const financialLinks = [
    { label: "Chart of Accounts", key: PERMISSIONS.FINANCIAL.VIEW },
    { label: "Opening Balance", key: PERMISSIONS.FINANCIAL.VIEW },
    { label: "Debit Voucher", key: PERMISSIONS.FINANCIAL.VIEW },
    { label: "Credit Voucher", key: PERMISSIONS.FINANCIAL.VIEW },
    { label: "Contra Voucher", key: PERMISSIONS.FINANCIAL.VIEW },
    { label: "Journal Voucher", key: PERMISSIONS.FINANCIAL.VIEW }
  ];

  const hrLinks = [
    { label: "New Employee", key: PERMISSIONS.HR.EMPLOYEES.CREATE },
    { label: "Employees", key: PERMISSIONS.HR.EMPLOYEES.VIEW },
    { label: "Departments", key: PERMISSIONS.HR.DEPARTMENTS.VIEW },
    { label: "Designations", key: PERMISSIONS.HR.DESIGNATIONS.VIEW },
    { label: "Attendance", key: PERMISSIONS.HR.ATTENDANCE.VIEW },
    { label: "Payroll", key: PERMISSIONS.HR.PAYROLL.VIEW }
  ];

  const reportsLinks = [
    { label: "Day Closing", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Today's Report", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Daily Closing Reports", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Stock Reports", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Sales Reports", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Product Wise Sale Report", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Purchase Report", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Customer Receivable Report", key: PERMISSIONS.REPORTS.VIEW },
    { label: "Supplier Payable Report", key: PERMISSIONS.REPORTS.VIEW }
  ];

  const adminLinks = [
    { label: "Language", key: PERMISSIONS.LANGUAGES.VIEW },
    { label: "Translations", key: PERMISSIONS.LANGUAGES.VIEW },
    { label: "Roles", key: PERMISSIONS.ROLE.VIEW },
    { label: "User Management", key: PERMISSIONS.USER.VIEW },
    { label: "Currencies", key: PERMISSIONS.CURRENCIES.VIEW },
    { label: "Settings", key: PERMISSIONS.SETTINGS }
  ];

  // -------------------------
  // SEARCH LOGIC
  // -------------------------

  const filterSection = (title, items) => {
    // 1. Filter by Permissions first
    const permittedItems = items.filter(item => {
        if (!item.key) return true; // No key = visible

        // Handle Array of Permissions (ANY match)
        if (Array.isArray(item.key)) {
          return hasAnyPermission(item.key);
        }

        // Handle Single Permission
        return hasPermission(item.key);
    });

    if (permittedItems.length === 0) return { show: false, items: [] };

    if (!search.trim()) return { show: true, items: permittedItems };

    const s = search.toLowerCase();

    const parentMatch = title.toLowerCase().includes(s);
    const childMatches = permittedItems.filter((i) => i.label.toLowerCase().includes(s));

    // When parent matched → show all permitted items
    if (parentMatch) {
      return { show: true, items: permittedItems };
    }

    // When child matched → show ONLY matching items
    if (childMatches.length > 0) {
      return { show: true, items: childMatches };
    }

    // No match → hide section
    return { show: false, items: [] };
  };

  // -------------------------
  // Triangle icon
  // -------------------------
  const TriangleIcon = ({ active }) => (
    <div
      className={`
        w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px]
        border-t-transparent border-b-transparent
        transition-all duration-300
        ${active ? "border-l-white rotate-90" : "border-l-gray-400"}
        hover:border-l-white
      `}
    ></div>
  );

  // -------------------------
  // Render reusable dropdown
  // -------------------------
  const renderSection = (
    title,
    icon,
    isOpen,
    toggle,
    pathRoot,
    list
  ) => {
    const { show, items } = filterSection(title, list);
    if (!show) return null;

    return (
      <li>
        <button
          onClick={() => {
            if (!sidebarOpen) {
              setSidebarOpen(true);
              toggle(true);
            } else {
              closeAll();
              toggle(!isOpen);
            }
          }}
          className={`w-full flex items-center px-3 py-2 rounded transition 
            ${sidebarOpen ? "justify-between" : "justify-center"}
            ${location.pathname.startsWith(pathRoot) ? "bg-white/10" : ""}
            ${theme === 'emerald' ? 'hover:bg-emerald-600' : 'hover:bg-gray-700'}
          `}
        >
          <div className={`flex items-center ${sidebarOpen ? "gap-3" : ""}`}>
            {icon}
            {sidebarOpen && <span>{title}</span>}
          </div>

          {sidebarOpen && (
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {sidebarOpen && (
          <ul
            className={`ml-6 space-y-1 overflow-hidden transition-all duration-300 
              ${isOpen ? "max-h-[1000px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95"}
            `}
          >
            {items.map((item, index) => {
              const routePath = formatRoute(item.label);
              const isActive = location.pathname.includes(routePath);

              return (
                <li key={index}>
                  <NavLink
                    to={`${pathRoot}/${routePath}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-1 px-2 rounded transition 
                      ${isActive ? "bg-white/20 text-white" : theme === 'emerald' ? "hover:bg-emerald-600 text-gray-100" : "hover:bg-gray-700 text-gray-300"}`
                    }
                  >
                    <TriangleIcon active={isActive} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  // -------------------------
  // JSX
  // -------------------------
  return (
    <>
      {/* MOBILE OVERLAY BACKDROP */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-800 to-emerald-600' : 'bg-gradient-to-b from-gray-900 to-gray-800'} text-white h-screen flex flex-col transition-all duration-300 z-50 
        md:static md:flex 
        ${sidebarOpen ? "md:w-64" : "md:w-16"} 
        ${sidebarOpen ? "w-64 fixed inset-y-0 left-0" : "hidden md:flex"}`}
      >

      
{/* HEADER */}
<div className={`p-4 border-b flex items-center gap-3 h-[72px] ${theme === 'emerald' ? 'border-emerald-500' : 'border-gray-700'}`}>
  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
    {logoUrl ? (
      <img
        src={logoUrl}
        alt="Company Logo"
        className="w-10 h-10 object-contain"
      />
    ) : (
      <LayoutDashboard className="w-10 h-10" />
    )}
  </div>

  {sidebarOpen && (
    <div className="max-w-[160px] h-[40px] flex items-center">
      <h1
        className="text-lg font-bold break-words line-clamp-2 leading-tight cursor-default"
        title={companyName}
      >
        {companyName}
      </h1>
    </div>
  )}
</div>



        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sidebar-scroll">
          <ul className="space-y-1 text-sm">

            {/* SEARCH BAR */}
            {sidebarOpen && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-5 ${theme === 'emerald' ? 'bg-emerald-100' : 'bg-gray-800'}`}>
                <Search className={`${theme === 'emerald' ? 'text-emerald-700' : 'text-gray-400'}`} size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`bg-transparent outline-none w-full placeholder-gray-500 ${theme === 'emerald' ? 'text-emerald-900' : 'text-gray-300'}`}
                />
              </div>
            )}

            {/* DASHBOARD */}
            {hasPermission(PERMISSIONS.DASHBOARD.VIEW) && (
            <li>
              <NavLink
                to="/app/dashboard"
                onClick={() => closeAll()}
                className={({ isActive }) =>
                  `px-3 py-2 rounded flex items-center transition 
                  ${sidebarOpen ? "gap-3" : "justify-center"} 
                  ${isActive ? "bg-white/20" : theme === 'emerald' ? "hover:bg-emerald-600 text-gray-100" : "hover:bg-gray-700 text-gray-300"}`
                }
              >
                <LineChart className="w-5 h-5" />
                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>
            </li>
            )}

            {/* MENU SECTIONS */}
            {renderSection("Masters", <Folder className="w-5 h-5" />, openMasters, setOpenMasters, "/app/masters", masterLinks)}
            {renderSection("Meeting", <Briefcase className="w-5 h-5" />, openMeeting, setOpenMeeting, "/app/meeting", meetingLinks)}
            {renderSection("Business Partners", <Users2 className="w-5 h-5" />, openBusinessPartners, setOpenBusinessPartners, "/app/businesspartners", bpLinks)}
            {renderSection("Inventory", <Boxes className="w-5 h-5" />, openInventory, setOpenInventory, "/app/inventory", inventoryLinks)}
            {renderSection("Sales", <Receipt className="w-5 h-5" />, openSales, setOpenSales, "/app/sales", salesLinks)}
            {renderSection("Purchasing", <ShoppingCart className="w-5 h-5" />, openPurchasing, setOpenPurchasing, "/app/purchasing", purchaseLinks)}
            {renderSection("Services", <FileText className="w-5 h-5" />, openServices, setOpenServices, "/app/services", servicesLinks)}
            {renderSection("Cash / Bank", <Wallet className="w-5 h-5" />, openCashBank, setOpenCashBank, "/app/cashbank", cashBankLinks)}
            {renderSection("Financial", <Landmark className="w-5 h-5" />, openFinancial, setOpenFinancial, "/app/financial", financialLinks)}
            {renderSection("Human Resource", <Users2 className="w-5 h-5" />, openHR, setOpenHR, "/app/hr", hrLinks)}
            {renderSection("Reports", <BarChart3 className="w-5 h-5" />, openReports, setOpenReports, "/app/reports", reportsLinks)}
            {renderSection("Administration", <Shield className="w-5 h-5" />, openAdmin, setOpenAdmin, "/app/administration", adminLinks)}

          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;