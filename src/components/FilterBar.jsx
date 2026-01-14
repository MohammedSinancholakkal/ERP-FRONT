import SearchableSelect from './SearchableSelect';
import { XCircle } from 'lucide-react';

const FilterBar = ({ filters = [], onClear, className = "" }) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 bg-gray-900 p-2 rounded-md border border-gray-700 ${className}`}>
      {filters.map((filter, index) => (
        <div key={index} className="w-full sm:w-48">
          <label className="text-xs text-white block">{filter.label}</label>
          {filter.type === 'date' ? (
             <input
                type="date"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
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
                className="text-white hover:text-gray-200 flex items-center gap-1 text-sm bg-gray-700 px-3 py-1 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
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
