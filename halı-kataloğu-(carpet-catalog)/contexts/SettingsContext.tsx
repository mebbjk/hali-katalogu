import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../translations';

type Theme = 'light' | 'dark';

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
    try {
      const storedTheme = localStorage.getItem('carpet_catalog_theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      // If no theme is stored, respect the user's OS-level preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback in case of any error
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
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
        console.error("Failed to save theme to localStorage", error);
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