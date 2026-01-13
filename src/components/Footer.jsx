// src/layout/Footer.jsx or wherever Footer lives
import React from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useTheme } from "../context/ThemeContext";

const Footer = () => {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const footerText = settings?.footerText?.trim() ? settings.footerText : "HomeButton";

  return (
    <footer className={`w-full text-white py-1 px-5 text-sm flex justify-between items-center border-t -mt-3 ${theme === 'emerald' ? 'bg-emerald-700 border-emerald-500' : 'bg-gray-900 border-gray-700'}`}>
      <span className="opacity-90 ms-auto">{footerText}</span>
    </footer>
  );
};

export default Footer;
