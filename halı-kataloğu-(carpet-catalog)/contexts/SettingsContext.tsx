import React, { useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../translations';
import { SettingsContext } from './definitions/SettingsContext';
import type { Theme } from '../types';

// Tell TypeScript about the global function we defined in index.html
declare global {
  interface Window {
    applyTheme: (theme: Theme) => void;
  }
}

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem('carpet_catalog_language');
      // Default to Turkish if no language is stored, or if stored language is invalid
      return (storedLang === 'en' || storedLang === 'tr') ? storedLang : 'tr';
    } catch {
      return 'tr';
    }
  });

  const [theme, setTheme] = useState<Theme>(() => {
    // The FOUC script in index.html is the single source of truth for the initial theme.
    // React's state should sync with what's already on the DOM to avoid conflicts.
    if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'light';
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('carpet_catalog_language', language);
    } catch (error) {
        console.error("Failed to save language to localStorage", error);
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('carpet_catalog_theme', theme);
      // Call the global function from index.html to apply the theme.
      // This is now the single source of truth for theme application.
      if (window.applyTheme) {
        window.applyTheme(theme);
      }
    } catch (error) {
        console.error("Failed to apply theme settings", error);
    }
  }, [theme]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
};
