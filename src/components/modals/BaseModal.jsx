import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { useTheme } from "../../context/ThemeContext";

const BaseModal = ({ isOpen, onClose, title, children, footer, zIndex = 1000 }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4`} style={{ zIndex }}>
      <div className={`w-full max-w-[700px] rounded-lg shadow-xl border flex flex-col max-h-[90vh] ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900 border-emerald-100' : theme === 'purple' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-700'}`}>
        <div className={`flex justify-between items-center px-5 py-3 border-b shrink-0 rounded-t-lg ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-500' : theme === 'purple' ? 'bg-[#6448AE] text-white border-[#6448AE]' : 'bg-gray-900 border-gray-700 text-white'}`}>
          <h2 className="text-lg font-semibold">{title}</h2>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className={`px-5 py-3 border-t flex justify-end gap-2 shrink-0 rounded-b-lg ${theme === 'emerald' ? 'border-gray-200' : 'border-gray-700'}`}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default BaseModal;
