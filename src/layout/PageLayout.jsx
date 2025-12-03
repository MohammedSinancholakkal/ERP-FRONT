import React from "react";
import Footer from "../components/Footer";

const PageLayout = ({ children }) => {
  return (
    <div className="flex flex-row h-[calc(100vh-10vh+2px)]">



      {/* RIGHT CONTENT AREA */}
      <div className="flex flex-col flex-grow bg-gradient-to-b from-gray-900 to-gray-700 overflow-hidden">
        
        {/* CONTENT (no scroll here) */}
        <div className="flex-grow overflow-hidden">
          {children}
        </div>

        {/* FOOTER (always visible) */}
        <Footer />
      </div>

    </div>
  );
};

export default PageLayout;
