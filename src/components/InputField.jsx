import React, { useState } from 'react';
import { useTheme } from "../context/ThemeContext";

const InputField = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder = "", 
  disabled = false, 
  required = false,
  className = "",
  formatted = false, // New prop
  ...props 
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  if (props.textarea) {
    return (
      <div className={`w-full ${className}`}>
        {label && <label className={`block text-sm mb-1 font-medium ${theme === 'emerald' ? 'text-emerald-700' : theme === 'purple' ? 'text-purple-800' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>{label} {required && "*"}</label>}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full border-2 rounded px-3 py-1.5 text-sm font-medium outline-none transition-colors ${
            theme === "emerald"
              ? "bg-emerald-50 border-emerald-600 text-emerald-900 placeholder-emerald-400 focus:border-emerald-400"
              : theme === "purple"
              ? "bg-white border-gray-300 text-purple-900 placeholder-gray-400 placeholder:text-xs focus:border-gray-500"
              : theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-gray-500" : "bg-white border-gray-300 text-black placeholder-gray-400 focus:border-gray-500"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          {...props}
        />
      </div>
    );
  }

  // Formatting Logic
  const handleFocus = (e) => {
    setIsFocused(true);
    if(props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if(props.onBlur) props.onBlur(e);
  };

  const handleChange = (e) => {
    if (formatted) {
        // Strip commas for internal value
        const raw = e.target.value.replace(/,/g, '');
        // Only allow valid numeric input chars (digits, dot, minus)
        if (!isNaN(raw) || raw === '-' || raw === '') {
            e.target.value = raw;
            onChange(e);
        }
    } else {
        onChange(e);
    }
  };

  // Determine Display Value
  let displayValue = value;
  if (formatted && !isFocused && value !== "" && value !== undefined && value !== null) {
      const num = Number(value);
      if (!isNaN(num)) {
          // Usin 'en-IN' for Indian comma style (1,00,000) based on context
          displayValue = num.toLocaleString('en-IN', { maximumFractionDigits: 10 }); 
      }
  }

  // Override type to text if formatted, to assume control
  const inputType = formatted ? "text" : type;

  return (
    <div className={`w-full ${className}`}>
      {label && <label className={`block text-sm mb-1 font-medium ${theme === 'emerald' ? 'text-emerald-700' : theme === 'purple' ? 'text-purple-800' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>{label} {required && "*"}</label>}
      <input
        type={inputType}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onWheel={(e) => e.target.blur()}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
          className={`w-full border-2 rounded px-3 py-1.5 text-sm font-medium outline-none transition-colors ${
            theme === "emerald"
              ? "bg-emerald-50 border-emerald-600 text-emerald-900 placeholder-emerald-400 focus:border-emerald-400"
              : theme === "purple"
              ? "bg-white border-gray-300 text-purple-900 placeholder-gray-400 placeholder:text-xs focus:border-gray-500"
              : theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-gray-500" : "bg-white border-gray-300 text-black placeholder-gray-400 focus:border-gray-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${props.inputClassName || ""}`}
        {...props}
      />
    </div>
  );
};

export default InputField;
