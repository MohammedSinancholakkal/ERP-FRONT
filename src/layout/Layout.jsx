import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        <div className="flex-1 overflow-y-auto bg-gray-100">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default Layout;
