import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export { ThemeContext };

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children, value }) {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || false
  );

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const contextValue = value || { darkMode, setDarkMode, toggleDarkMode };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
} 