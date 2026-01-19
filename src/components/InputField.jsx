import React from 'react';
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
  ...props 
}) => {
  const { theme } = useTheme();

  if (props.textarea) {
    return (
      <div className={`w-full ${className}`}>
        {label && <label className="block text-sm mb-1 text-black font-medium">{label} {required && "*"}</label>}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
            theme === "emerald"
              ? "bg-emerald-50 border-emerald-600 text-emerald-900 placeholder-emerald-400 focus:border-emerald-400"
              : theme === "purple"
              ? "bg-white border-gray-300 text-purple-900 placeholder-gray-400 placeholder:text-xs focus:border-gray-500"
              : "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          {...props}
        />
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm mb-1 text-black font-medium">{label} {required && "*"}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
          className={`w-full border-2 rounded px-3 py-1.5 text-sm outline-none transition-colors ${
            theme === "emerald"
              ? "bg-emerald-50 border-emerald-600 text-emerald-900 placeholder-emerald-400 focus:border-emerald-400"
              : theme === "purple"
              ? "bg-white border-gray-300 text-purple-900 placeholder-gray-400 placeholder:text-xs focus:border-gray-500"
              : "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        {...props}
      />
    </div>
  );
};

export default InputField;
