import React from "react";
import Footer from "../components/Footer";

const PageLayout = ({ children }) => {
  return (
    <div className="flex flex-row h-full w-full">

      {/* RIGHT CONTENT AREA */}
      <div className="flex flex-col flex-grow bg-gradient-to-b from-gray-900 to-gray-700 overflow-hidden text-white">
        
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

