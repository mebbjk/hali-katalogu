// FIX: Switched to namespace import (`import * as React`) to resolve a persistent module
// initialization error. This pattern can be more robust against subtle bundler or
// module resolution issues that cause named imports to be undefined at evaluation time.
import * as React from 'react';
import { translations, Language } from '../translations';
import type { Theme, SettingsContextType } from '../types';

// Tell TypeScript about the global function we defined in index.html
declare global {
  interface Window {
    applyTheme: (theme: Theme) => void;
  }
}

// 1. Context Creation
const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

// 2. Provider Component
interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [language, setLanguage] = React.useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem('carpet_catalog_language');
      // Default to Turkish if no language is stored, or if stored language is invalid
      return (storedLang === 'en' || storedLang === 'tr') ? storedLang : 'tr';
    } catch {
      return 'tr';
    }
  });

  const [theme, setTheme] = React.useState<Theme>(() => {
    // The FOUC script in index.html is the single source of truth for the initial theme.
    // React's state should sync with what's already on the DOM to avoid conflicts.
    if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'light';
  });
  
  React.useEffect(() => {
    try {
      localStorage.setItem('carpet_catalog_language', language);
    } catch (error) {
        console.error("Failed to save language to localStorage", error);
    }
  }, [language]);

  React.useEffect(() => {
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


// 3. Custom Hook
export const useSettings = (): SettingsContextType => {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};