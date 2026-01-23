import React, { useState }  from 'react';
import BaseModal from './BaseModal';
import { useTheme } from "../../context/ThemeContext";

const ColumnPickerModal = ({ isOpen, onClose, visibleColumns, setVisibleColumns, defaultColumns, zIndex }) => {
  const { theme } = useTheme();
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Column Picker"
      zIndex={zIndex}
      footer={
        <div className="flex justify-between w-full">
           <button
            onClick={restoreDefaultColumns}
            className={`px-4 py-2 border rounded ${theme === 'emerald' ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : theme === 'purple' ? 'bg-white text-[#6448AE] border-[#6448AE]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
          >
            Restore Defaults
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm' : theme === 'purple' ? 'bg-[#6448AE] hover:bg-[#6E55B6]  text-white border-[#6448AE]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
          >
            OK
          </button>
        </div>
      }
    >
      <div className="">
        {/* SEARCH */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="search columns..."
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value.toLowerCase())}
            className={`w-60 border px-3 py-2 rounded text-sm outline-none focus:border-white ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : theme === 'purple' ? 'bg-white text-[#6448AE] border-[#6448AE]' : 'bg-gray-900 border-gray-700'}`}
          />
        </div>

        {/* VISIBLE / HIDDEN COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`border rounded p-3 h-[400px] overflow-y-auto ${theme === 'emerald' ? 'bg-white border-emerald-200 shadow-inner' : theme === 'purple' ? 'bg-white border-[#6448AE]' : 'bg-gray-800/40 border-gray-700'}`}>
            <h3 className="font-semibold mb-3">👁 Visible Columns</h3>

            {Object.keys(visibleColumns)
              .filter((col) => visibleColumns[col])
              .filter((col) => col.includes(searchColumn))
              .map((col) => (
                <div
                  key={col}
                  className={`flex justify-between px-3 py-2 rounded mb-2 ${theme === 'emerald' ? 'bg-gray-200 text-emerald-900' : theme === 'purple' ? 'bg-gray-200 text-[#6448AE]' : 'bg-gray-900'}`}
                >
                  <span>☰ {col.toUpperCase()}</span>
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => toggleColumn(col)}
                  >
                    ✖
                  </button>
                </div>
              ))}
          </div>

          <div className={`border rounded p-3 h-[400px] overflow-y-auto ${theme === 'emerald' ? 'bg-white border-emerald-200 shadow-inner' : theme === 'purple' ? 'bg-white border-[#6448AE]' : 'bg-gray-800/40 border-gray-700'}`}>
            <h3 className="font-semibold mb-3">📋 Hidden Columns</h3>

            {Object.keys(visibleColumns)
              .filter((col) => !visibleColumns[col])
              .filter((col) => col.includes(searchColumn))
              .map((col) => (
                <div
                  key={col}
                  className={`flex justify-between px-3 py-2 rounded mb-2 ${theme === 'emerald' ? 'bg-gray-200 text-emerald-900' : theme === 'purple' ? 'bg-gray-200 text-[#6448AE]' : 'bg-gray-900'}`}
                >
                  <span>☰ {col.toUpperCase()}</span>
                  <button
                    className="text-green-400 hover:text-green-300"
                    onClick={() => toggleColumn(col)}
                  >
                    ➕
                  </button>
                </div>
              ))}

            {Object.keys(visibleColumns).filter(
              (col) => !visibleColumns[col]
            ).length === 0 && (
              <p className="text-gray-400 text-sm">No hidden columns</p>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ColumnPickerModal;
