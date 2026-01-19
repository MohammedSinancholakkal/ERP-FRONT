import React from "react";
import { useTheme } from "../context/ThemeContext";

const ContentCard = ({ children, className = "" }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`flex flex-col h-full overflow-hidden rounded-2xl shadow-sm border p-4 py-2 ${
        theme === "emerald"
          ? "bg-white border-emerald-200"
          : theme === "purple"
          ? "bg-white border-gray-200 border-t-4 border-t-[#6448AE]"
          : "bg-gray-800 border-gray-700"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default ContentCard;
