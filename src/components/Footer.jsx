// src/layout/Footer.jsx or wherever Footer lives
import React from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useTheme } from "../context/ThemeContext";

const Footer = () => {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const footerText = settings?.footerText?.trim() ? settings.footerText : "HomeButton";

  return (
    <footer className={`relative z-50 w-full py-1 px-5 text-sm flex justify-between items-center border-t -mt-3 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500 text-white' : theme === 'purple' ? 'bg-white border-[#6448AE] text-[#6448AE]' : 'bg-gray-900 border-gray-700 text-white'}`}>
      <span className="opacity-100 ms-auto font-bold">{footerText}</span>
    </footer>
  );
};

export default Footer;
