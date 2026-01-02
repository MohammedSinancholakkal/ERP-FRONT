import React from "react";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";

const PageLayout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-row h-full w-full">

      {/* RIGHT CONTENT AREA */}
      <div className={`flex flex-col flex-grow overflow-hidden text-white ${
        theme === 'emerald' 
          ? 'bg-gradient-to-b from-emerald-800 to-emerald-600' 
          : 'bg-gradient-to-b from-gray-900 to-gray-700'
      }`}>
        
        {/* CONTENT (scrollable) */}
        <div className="flex-grow overflow-y-auto p-0">
          {children}
        </div>

        {/* FOOTER (always visible) */}
        <Footer />
      </div>

    </div>
  );
};

export default PageLayout;

