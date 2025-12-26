import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);

  // Find selected option object
  const selectedOption = options.find(opt => opt.id == value);

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
         updateCoords(); // Sync calculation before render
      }
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <div className={`relative ${className}`} ref={wrapperRef}>
        <div
          className={`w-full bg-gray-800 border border-gray-600 rounded px-3 ${compact ? 'py-1.5' : 'py-2'} flex justify-between items-center cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-500"
          }`}
          onClick={toggleOpen}
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
          className={`bg-gray-800 border border-gray-600 rounded shadow-xl flex flex-col ${dropdownHeight}`}
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
        </div>,
        document.body
      )}
    </>
  );
};

export default SearchableSelect;
