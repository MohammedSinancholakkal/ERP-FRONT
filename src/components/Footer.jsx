// src/layout/Footer.jsx or wherever Footer lives
import React from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useTheme } from "../context/ThemeContext";

const Footer = () => {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const footerText = settings?.footerText?.trim() ? settings.footerText : "HomeButton";

  return (
    <footer className={`w-full text-white py-1 px-5 text-sm flex justify-between items-center border-t -mt-3 ${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-900 to-emerald-800 border-emerald-700' : 'bg-gray-900 border-gray-700'}`}>
      <span className="opacity-90">
        <strong>Copyright (c) 2025.</strong> All rights reserved.
      </span>

      <span className="opacity-90">{footerText}</span>
    </footer>
  );
};

export default Footer;
