import React, { useState }  from 'react';
import BaseModal from './BaseModal';

const ColumnPickerModal = ({ isOpen, onClose, visibleColumns, setVisibleColumns, defaultColumns }) => {
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
      // zIndex={60} // Removed to use default from BaseModal
      footer={
        <div className="flex justify-between w-full">
           <button
            onClick={restoreDefaultColumns}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700"
          >
            Restore Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700"
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
            className="w-60 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm outline-none focus:border-white"
          />
        </div>

        {/* VISIBLE / HIDDEN COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded p-3 bg-gray-800/40 h-[400px] overflow-y-auto">
            <h3 className="font-semibold mb-3">👁 Visible Columns</h3>

            {Object.keys(visibleColumns)
              .filter((col) => visibleColumns[col])
              .filter((col) => col.includes(searchColumn))
              .map((col) => (
                <div
                  key={col}
                  className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
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

          <div className="border border-gray-700 rounded p-3 bg-gray-800/40 h-[400px] overflow-y-auto">
            <h3 className="font-semibold mb-3">📋 Hidden Columns</h3>

            {Object.keys(visibleColumns)
              .filter((col) => !visibleColumns[col])
              .filter((col) => col.includes(searchColumn))
              .map((col) => (
                <div
                  key={col}
                  className="flex justify-between bg-gray-900 px-3 py-2 rounded mb-2"
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
