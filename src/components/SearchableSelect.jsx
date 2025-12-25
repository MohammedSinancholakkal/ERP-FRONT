import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select...", 
  disabled = false,
  className = "",
  direction = "down", // "down" | "up"
  dropdownHeight = "max-h-48",
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // Find selected option object
  const selectedOption = options.find(opt => opt.id == value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    (opt.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className={`w-full bg-gray-800 border border-gray-600 rounded px-3 ${compact ? 'py-1.5' : 'py-2'} flex justify-between items-center cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-500"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-white" : "text-gray-400"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <div className="flex items-center gap-2">
            {selectedOption && !disabled && (
                <div onClick={clearSelection} className="text-gray-400 hover:text-white">
                    <X size={16} />
                </div>
            )}
            <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full bg-gray-800 border border-gray-600 rounded shadow-lg flex flex-col ${dropdownHeight} ${
            direction === "up" ? "bottom-full mb-1" : "mt-1"
        }`}>
          {/* If UP: Options first, then Search */}
          {direction === "up" && (
             <div className={`overflow-y-auto flex-grow ${dropdownHeight}`}>
             {filteredOptions.length > 0 ? (
               filteredOptions.map((option) => (
                 <div
                   key={option.id}
                   className={`px-3 py-2 cursor-pointer text-sm ${
                     option.id == value
                       ? "bg-gray-600 text-white"
                       : "text-gray-300 hover:bg-gray-700"
                   }`}
                   onClick={() => handleSelect(option)}
                 >
                   {option.name}
                 </div>
               ))
             ) : (
               <div className="px-3 py-2 text-gray-500 text-sm text-center">
                 No results found
               </div>
             )}
           </div>
          )}

          <div className={`p-2 ${direction === "up" ? "border-t" : "border-b"} border-gray-700`}>
            <input
              type="text"
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {direction !== "up" && (
            <div className={`overflow-y-auto flex-grow ${dropdownHeight}`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    option.id == value
                      ? "bg-gray-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm text-center">
                No results found
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
