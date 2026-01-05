import React from 'react';
import { X } from 'lucide-react';

const BaseModal = ({ isOpen, onClose, title, children, footer, zIndex = 50 }) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center`} style={{ zIndex }}>
      <div className="w-[700px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>

          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3 border-t border-gray-700 flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseModal;
