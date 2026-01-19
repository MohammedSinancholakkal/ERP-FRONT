import SearchableSelect from './SearchableSelect';
import { XCircle } from 'lucide-react';
import { useTheme } from "../context/ThemeContext";

const FilterBar = ({ filters = [], onClear, className = "" }) => {
  const { theme } = useTheme();
  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 rounded-md border ${theme === 'emerald' ? 'bg-white border-emerald-200' : theme === 'purple' ? 'bg-gray-50 border-[#e5e7eb]': 'bg-gray-900 border-gray-700'} ${className}`}>
      {filters.map((filter, index) => (
        <div key={index} className="w-full sm:w-48">
          <label className={`text-xs block ${theme === 'emerald' ? 'text-emerald-900' : theme === 'purple' ? 'text-gray-500' : 'text-white'}`}>{filter.label}</label>
          {filter.type === 'date' ? (
             <input
                type="date"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={`w-full border rounded px-2 py-1 text-sm focus:outline-none transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 focus:border-emerald-500' : theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-gray-500' : 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'}`}
             />
          ) : (
            <SearchableSelect
                options={filter.options}
                value={filter.value}
                onChange={filter.onChange}
                placeholder={filter.placeholder}
                disabled={filter.disabled}
                className="w-full"
                compact={true}
            />
          )}
        </div>
      ))}
      
      {onClear && (
        <div className="flex items-end self-end pb-0.5">
            <button 
                onClick={onClear} 
                className={`flex items-center gap-1 text-sm px-3 py-1 rounded border transition-colors ${theme === 'emerald' ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : theme === 'purple' ? 'bg-[#6448AE] border-[#6448AE] hover:bg-[#50398f] text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                title="Clear all filters"
            >
                <XCircle size={16} /> Clear
            </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
