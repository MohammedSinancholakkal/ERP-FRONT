import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { useTheme } from "../../context/ThemeContext";
import { 
  Eye, 
  EyeOff, 
  Search, 
  GripVertical, 
  RotateCcw, 
  Check, 
  X,
  Columns
} from "lucide-react";

const ColumnPickerModal = ({ isOpen, onClose, visibleColumns, setVisibleColumns, defaultColumns, zIndex }) => {
  const { theme } = useTheme();
  const [searchColumn, setSearchColumn] = useState("");

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const restoreDefaultColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  const isLight = theme === 'emerald' || theme === 'purple';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Columns size={20} />
          <span>Column Settings</span>
        </div>
      }
      zIndex={zIndex}
      bodyClassName="overflow-hidden"
      footer={
        <div className="flex justify-between w-full">
          <button
            onClick={restoreDefaultColumns}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all ${
              theme === 'emerald' 
                ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50' 
                : theme === 'purple' 
                ? 'bg-white text-[#6448AE] border-purple-200 hover:bg-purple-50' 
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <RotateCcw size={16} />
            Restore Defaults
          </button>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold transition-all shadow-sm ${
              theme === 'emerald' 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : theme === 'purple' 
                ? 'bg-[#6448AE] text-white hover:bg-[#583CA0]' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Apply Changes
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* SEARCH */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
          <input
            type="text"
            placeholder="Search columns..."
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className={`w-full border pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${
              theme === 'emerald' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900 focus:border-emerald-500 focus:bg-white' 
                : theme === 'purple' 
                ? 'bg-purple-50/50 border-purple-100 text-purple-900 focus:border-[#6448AE] focus:bg-white' 
                : 'bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:bg-gray-900'
            }`}
          />
        </div>

        {/* VISIBLE / HIDDEN COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visible Section */}
          <div className="flex flex-col h-[450px]">
            <h3 className={`flex items-center gap-2 font-bold mb-3 px-1 ${theme === 'emerald' ? 'text-emerald-800' : theme === 'purple' ? 'text-purple-900' : 'text-blue-400'}`}>
              <Eye size={18} />
              Visible Columns
            </h3>
            <div className={`flex-1 border rounded-2xl p-3 overflow-y-auto space-y-2 h-[380px] custom-scrollbar ${
              theme === 'emerald' ? 'bg-emerald-50/30 border-emerald-100' : 
              theme === 'purple' ? 'bg-purple-50/30 border-purple-100' : 
              'bg-gray-800/50 border-gray-700'
            }`}>
              {Object.keys(visibleColumns)
                .filter((col) => visibleColumns[col])
                .filter((col) => col.toLowerCase().includes(searchColumn.toLowerCase()))
                .map((col) => (
                  <div
                    key={col}
                    className={`group flex justify-between items-center px-3 py-2.5 rounded-xl border transition-all hover:scale-[1.01] ${
                      theme === 'emerald' ? 'bg-white border-emerald-100 text-emerald-900 hover:shadow-md' : 
                      theme === 'purple' ? 'bg-white border-purple-100 text-purple-900 hover:shadow-md' : 
                      'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                       <GripVertical size={14} className="text-gray-400" />
                       <span className="text-sm font-medium">{col.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <button
                      className="p-1 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      onClick={() => toggleColumn(col)}
                      title="Hide Column"
                    >
                      <EyeOff size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Hidden Section */}
          <div className="flex flex-col h-[450px]">
            <h3 className={`flex items-center gap-2 font-bold mb-3 px-1 ${theme === 'emerald' ? 'text-gray-600' : theme === 'purple' ? 'text-gray-600' : 'text-gray-400'}`}>
              <EyeOff size={18} />
              Hidden Columns
            </h3>
            <div className={`flex-1 border rounded-2xl p-3 overflow-y-auto space-y-2 h-[380px] custom-scrollbar ${
              theme === 'emerald' ? 'bg-gray-50/50 border-gray-200' : 
              theme === 'purple' ? 'bg-gray-50/50 border-gray-200' : 
              'bg-gray-900/40 border-gray-800'
            }`}>
              {Object.keys(visibleColumns)
                .filter((col) => !visibleColumns[col])
                .filter((col) => col.toLowerCase().includes(searchColumn.toLowerCase()))
                .map((col) => (
                  <div
                    key={col}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed transition-all italic ${
                      theme === 'emerald' ? 'border-emerald-200 text-emerald-900/60 bg-white/50' : 
                      theme === 'purple' ? 'border-purple-200 text-purple-900/60 bg-white/50' : 
                      'border-gray-700 text-gray-500 bg-gray-800/20'
                    }`}
                  >
                    <span className="text-sm font-medium">{col.replace(/_/g, ' ').toUpperCase()}</span>
                    <button
                      className="p-1 rounded-full hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-colors"
                      onClick={() => toggleColumn(col)}
                      title="Show Column"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                ))}

              {Object.keys(visibleColumns).filter(
                (col) => !visibleColumns[col]
              ).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
                   <Columns size={32} />
                   <p className="text-xs">No hidden columns</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ColumnPickerModal;
