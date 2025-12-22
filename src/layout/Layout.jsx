import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile/small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* RIGHT PANEL */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* TOPBAR (fixed height ALWAYS 64px) */}
        <div className="h-16 flex-shrink-0">
          <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default Layout;
