import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../translations';

type Theme = 'light' | 'dark';

// Tell TypeScript about the global function we defined in index.html
declare global {
  interface Window {
    applyTheme: (theme: Theme) => void;
  }
}

// FIX: Removed `apiKey` and `setApiKey` from the context type as API key management is now handled via environment variables.
interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

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
  
  // FIX: Removed `apiKey` state management as it is no longer needed.


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

  // FIX: Removed useEffect for saving API key to localStorage.


  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    // FIX: Removed `apiKey` and `setApiKey` from the provider value.
    <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
};
