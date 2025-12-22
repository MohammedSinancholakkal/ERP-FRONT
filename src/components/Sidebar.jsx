import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  ChevronRight,
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

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
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

  // Links
  const masterLinks = ["Countries", "States", "Cities", "Banks", "Expense Types", "Services", "Territories", "Regions", "Shippers", "Warehouses", "Customer Groups", "Supplier Groups", "Agenda Item Types", "Meeting Types", "Locations", "Attendance Status", "Attendee Types", "Resolution Status", "Deductions", "Incomes"];
  const meetingLinks = ["Meetings"];
  const inventoryLinks = ["Products", "Categories", "Units", "Brands", "Damaged Products", "Goods Receipts", "Goods Issue", "Update Stock"];
  const salesLinks = ["New Sale Quotation", "New Sale", "Sales", "Sales Quotations"];
  const bpLinks = ["New Customer", "New Supplier", "Customers", "Suppliers"];
  const purchaseLinks = ["New Purchase", "Purchases"];
  const servicesLinks = ["New Invoice", "Invoices"];
  const cashBankLinks = ["Bank Transaction", "Expenses", "Customer Receive", "Supplier Payment", "Cash Adjustment"];
  const financialLinks = ["Chart of Accounts", "Opening Balance", "Debit Voucher", "Credit Voucher", "Contra Voucher", "Journal Voucher"];
  const hrLinks = ["New Employee", "Employees", "Departments", "Designations", "Attendance", "Payroll"];
  const reportsLinks = ["Day Closing", "Today's Report", "Daily Closing Reports", "Stock Reports", "Sales Reports", "Product Wise Sale Report", "Purchase Report", "Customer Receivable Report", "Supplier Payable Report"];
  const adminLinks = ["Language", "Translations", "Roles", "User Management", "Currencies", "Settings"];

  // -------------------------
  // SEARCH LOGIC
  // -------------------------

  const filterSection = (title, items) => {
    if (!search.trim()) return { show: true, items };

    const s = search.toLowerCase();

    const parentMatch = title.toLowerCase().includes(s);
    const childMatches = items.filter((i) => i.toLowerCase().includes(s));

    // When parent matched → show all items
    if (parentMatch) {
      return { show: true, items };
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
          className={`w-full flex items-center px-3 py-2 rounded hover:bg-gray-700 transition 
            ${sidebarOpen ? "justify-between" : "justify-center"}
            ${location.pathname.startsWith(pathRoot) ? "bg-white/10" : ""}
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
              const isActive = location.pathname.includes(formatRoute(item));

              return (
                <li key={index}>
                  <NavLink
                    to={`${pathRoot}/${formatRoute(item)}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-1 px-2 rounded transition 
                      ${isActive ? "bg-white/20 text-white" : "hover:bg-gray-700 text-gray-300"}`
                    }
                  >
                    <TriangleIcon active={isActive} />
                    <span>{item}</span>
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
        className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen flex flex-col transition-all duration-300 z-50 
        md:static md:flex 
        ${sidebarOpen ? "md:w-64" : "md:w-16"} 
        ${sidebarOpen ? "w-64 fixed inset-y-0 left-0" : "hidden md:flex"}`}
      >

      
{/* HEADER */}
<div className="p-4 border-b border-gray-700 flex items-center gap-3 h-[72px]">
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
              <div className="bg-gray-800 flex items-center gap-2 px-3 py-2 rounded-lg mb-5">
                <Search className="text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none w-full text-gray-300 placeholder-gray-500"
                />
              </div>
            )}

            {/* DASHBOARD */}
            <li>
              <NavLink
                to="/app/dashboard"
                onClick={() => closeAll()}
                className={({ isActive }) =>
                  `px-3 py-2 rounded flex items-center transition 
                  ${sidebarOpen ? "gap-3" : "justify-center"} 
                  ${isActive ? "bg-white/20" : "hover:bg-gray-700 text-gray-300"}`
                }
              >
                <LineChart className="w-5 h-5" />
                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>
            </li>

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