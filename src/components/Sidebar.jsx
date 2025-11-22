// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  ChevronRight,
  Search,
  LineChart,
  Folder,
  Menu
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import "../styles/Dashboard.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [openMasters, setOpenMasters] = useState(false);
  const [hoveredItem, setHoveredItem] = useState("");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const location = useLocation();

  const masterLinks = [
    "Countries",
    "Cities",
    "States",
    "Banks",
    "Expense Types",
    "Services",
    "Territories",
    "Regions",
    "Shippers",
    "Warehouses",
    "Customer Groups",
    "Supplier Groups",
    "Agenda Item Types",
    "Meeting Types",
    "Locations",
    "Attendance Status",
    "Attendance Types",
    "Resolution Status",
    "Deductions",
    "Incomes",
  ];

  const formatRoute = (item) => item.replace(/\s+/g, "").toLowerCase();

  // Auto-open Masters if inside /app/masters
  useEffect(() => {
    if (location.pathname.startsWith("/app/masters")) {
      setOpenMasters(true);
    }
  }, [location.pathname]);

  return (
    <>
      {/* SIDEBAR */}
      <aside
        className={`
          bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen flex flex-col
          transition-all duration-300 z-50

          /* Desktop behavior */
          md:static 
          md:flex
          ${sidebarOpen ? "md:w-64" : "md:w-16"}

          /* Mobile drawer behavior */
          ${sidebarOpen ? "w-64 fixed inset-y-0 left-0" : "hidden md:flex"}
        `}
      >
        {/* Top section */}
        <div
          className={`${
            sidebarOpen
              ? "p-4 border-b border-gray-700 p-4"
              : "p-4 border-b border-gray-700 p-5"
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard
              className={`${
                sidebarOpen ? "w-10 h-10" : "w-8 h-8"
              } text-white`}
            />
            {sidebarOpen && (
              <h1 className="text-2xl font-bold whitespace-nowrap">
                Homebutton
              </h1>
            )}
          </div>
        </div>

        {/* Scrollable menu */}
        <div className="flex-1 overflow-y-auto p-3 sidebar-scroll">
          <ul className="space-y-1 text-sm">
            {/* Search Bar */}
            {sidebarOpen && (
              <div className="bg-gray-800 flex items-center gap-2 px-3 py-2 rounded-lg w-full mb-5">
                <Search className="text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="search..."
                  className="bg-transparent outline-none w-full text-sm text-gray-300 placeholder-gray-500"
                />
              </div>
            )}

            {/* Dashboard */}
            <li>
              <NavLink
                to="/app/dashboard"
                className={({ isActive }) =>
                  `px-3 py-2 rounded cursor-pointer flex items-center transition ${
                    sidebarOpen ? "gap-3" : "justify-center"
                  } ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`
                }
                onMouseEnter={(e) => {
                  if (!sidebarOpen) {
                    setHoveredItem("Dashboard");
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => setHoveredItem("")}
              >
                <LineChart
                  className={`${
                    sidebarOpen ? "w-5 h-5" : "w-4 h-4"
                  } text-white stroke-[1.5]`}
                />

                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>
            </li>

            {/* Masters */}
            <li>
              <button
                onClick={() => {
                  if (!sidebarOpen) {
                    setSidebarOpen(true);
                    setOpenMasters(true);
                  } else {
                    setOpenMasters(!openMasters);
                  }
                }}
                onMouseEnter={(e) => {
                  if (!sidebarOpen) {
                    setHoveredItem("Masters");
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => setHoveredItem("")}
                className={`flex items-center w-full px-3 py-2 rounded hover:bg-gray-700 transition ${
                  sidebarOpen ? "justify-between" : "justify-center"
                } ${
                  location.pathname.startsWith("/app/masters")
                    ? "bg-white/10"
                    : ""
                }`}
              >
                <div
                  className={`flex items-center ${
                    sidebarOpen ? "gap-3" : ""
                  }`}
                >
                  <Folder
                    className={`${
                      sidebarOpen ? "w-5 h-5" : "w-4 h-4"
                    } text-white stroke-[1.5]`}
                  />
                  {sidebarOpen && <span>Masters</span>}
                </div>

                {sidebarOpen &&
                  (openMasters ? (
                    <ChevronDown size={16} className="text-white" />
                  ) : (
                    <ChevronRight size={16} className="text-white" />
                  ))}
              </button>

              {/* Dropdown menu */}
              {sidebarOpen && (
                <ul
                  className={`ml-6 space-y-1 text-gray-300 overflow-hidden transition-all duration-300 ${
                    openMasters
                      ? "max-h-[1500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {masterLinks.map((item, index) => (
                    <li key={index}>
                      <NavLink
                        to={`/app/masters/${formatRoute(item)}`}
                        className={({ isActive }) =>
                          `flex items-center gap-2 py-1 px-2 rounded transition ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "text-gray-300 hover:text-white hover:bg-gray-700"
                          }`
                        }
                      >
                        <ChevronRight
                          size={14}
                          className="text-white opacity-70"
                        />
                        <span>{item}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Tooltip when collapsed */}
      {!sidebarOpen && hoveredItem && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-sm px-3 py-1 rounded shadow-lg pointer-events-none"
          style={{ top: tooltipPos.y, left: tooltipPos.x + 20 }}
        >
          {hoveredItem}
        </div>
      )}
    </>
  );
};

export default Sidebar;
