import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile/small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden print:h-auto print:overflow-visible">

      {/* SIDEBAR */}
      <div className="print:hidden">
         <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col flex-1 min-w-0 print:block print:w-full print:h-auto print:overflow-visible">

        {/* TOPBAR (fixed height ALWAYS 64px) */}
        <div className="h-16 flex-shrink-0 print:hidden">
          <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden bg-gray-100 print:overflow-visible print:bg-white print:h-auto">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default Layout;
