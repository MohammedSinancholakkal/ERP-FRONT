import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'purple';
  });

  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    // Remove all previous theme classes
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-emerald', 'theme-blue');
    // Add current theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Provide themes configuration if needed, or just the current theme string
  const value = {
    theme,
    setTheme,
    // Helper to get conditional classes based on theme
    getThemeClasses: (baseClasses, emeraldClasses) => {
      return theme === 'emerald' ? emeraldClasses : baseClasses;
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
