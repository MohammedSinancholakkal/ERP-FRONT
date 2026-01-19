import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select...", 
  disabled = false,
  className = "",
  direction = "down",
  dropdownHeight = "max-h-48",
  compact = false,
  name,
  id,
  label,
  required
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);

  // Find selected option object
  const selectedOption = options.find(opt => String(opt.id) === String(value));

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInWrapper = wrapperRef.current && wrapperRef.current.contains(event.target);
      const isClickInDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      
      if (!isClickInWrapper && !isClickInDropdown) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Update coords on scroll/resize to keep attached - strictly optional but good
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  const updateCoords = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        bottom: rect.top + window.scrollY // for 'up' direction
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords(); // Keep this for re-renders or updates if needed, primarily for resize/scroll
    }
  }, [isOpen]);

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

  const toggleOpen = () => {
    if (!disabled) {
      if (!isOpen) {
         updateCoords(); 
      }
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <div className={`relative ${className}`} ref={wrapperRef}>
        {label && <label className="block text-sm mb-1 text-black font-medium">{label} {required && "*"}</label>}
        <div
          className={`w-full border-2 rounded px-3 ${compact ? 'py-1' : 'py-2'} flex justify-between items-center cursor-pointer transition-colors ${theme === 'emerald' ? `bg-emerald-50 border-emerald-600 hover:border-emerald-500 ${isOpen ? 'border-emerald-400' : ''}` : theme === 'purple' ? `bg-white border-gray-300 hover:border-gray-400 ${isOpen ? 'border-gray-500' : ''}` : 'bg-gray-800 border-gray-600 hover:border-gray-500'} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={toggleOpen}
          tabIndex={0}
        >
          <span className={`truncate flex-1 text-sm ${selectedOption ? (theme === 'emerald' ? "text-emerald-900" : theme === 'purple' ? "text-purple-900" : "text-white") : (theme === 'purple' ? "text-gray-400 text-xs" : "text-gray-400")}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <div className="flex items-center gap-2">
              {selectedOption && !disabled && (
                  <div onClick={clearSelection} className={`text-gray-400 ${theme === 'emerald' ? 'hover:text-emerald-700' : theme === 'purple' ? 'hover:text-[#6448AE]' : 'hover:text-white'}`}>
                      <X size={16} />
                  </div>
              )}
              <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            left: coords.left + 'px',
            width: coords.width + 'px',
            top: direction === 'up' ? 'auto' : (coords.top + 4) + 'px',
            bottom: direction === 'up' ? (window.innerHeight - coords.bottom + 4) + 'px' : 'auto',
            zIndex: 99999
          }}
          className={`border rounded shadow-xl flex flex-col ${dropdownHeight} ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-500' : theme === 'purple' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600'}`}
        >
          {/* If UP: Options first, then Search */}
          {direction === "up" && (
             <div className={`overflow-y-auto flex-grow ${dropdownHeight}`}>
             {filteredOptions.length > 0 ? (
               filteredOptions.map((option) => (
                 <div
                   key={option.id}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      option.id == value
                        ? (theme === 'emerald' ? "bg-emerald-300 text-emerald-900 font-medium" : theme === 'purple' ? "bg-purple-100 text-purple-900 font-medium" : "bg-gray-600 text-white")
                        : (theme === 'emerald' ? "text-gray-700 hover:bg-emerald-200" : theme === 'purple' ? "text-gray-700 hover:bg-purple-50" : "text-gray-300 hover:bg-gray-700")
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

          <div className={`p-2 ${direction === "up" ? "border-t" : "border-b"} ${theme === 'emerald' ? 'border-emerald-100' : theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
            <input
              type="text"
              className={`w-full border-2 rounded px-2 py-1 text-sm focus:outline-none transition-colors ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-600 text-emerald-900 focus:border-emerald-400' : theme === 'purple' ? 'bg-white border-gray-300 text-gray-900 focus:border-gray-500' : 'bg-gray-900 border-gray-700 text-white focus:border-gray-500'}`}
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              name={name ? `search_${name}` : undefined}
              id={id ? `search_${id}` : undefined}
              onKeyDown={(e) => {
                 if(e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                 }
              }}
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
                      ? (theme === 'emerald' ? "bg-emerald-300 text-emerald-900" : theme === 'purple' ? "bg-purple-100 text-purple-900 font-medium" : "bg-gray-600 text-white")
                      : (theme === 'emerald' ? "text-gray-700 hover:bg-emerald-200" : theme === 'purple' ? "text-gray-700 hover:bg-purple-50" : "text-gray-300 hover:bg-gray-700")
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
        </div>,
        document.body
      )}
    </>
  );
};

export default SearchableSelect;
