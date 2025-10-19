import React, { createContext, useContext, useState, ReactNode, useLayoutEffect, useEffect } from 'react';
import { translations, Language, TranslationKey } from '../translations';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme from localStorage to persist user's choice
    try {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
    } catch (e) {
        console.error("Could not access localStorage for theme.", e);
    }
    // Default to dark theme if nothing is set or localStorage is unavailable
    return 'dark';
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem('language') as Language | null;
      return storedLang || 'ru';
    } catch(e) {
      console.error("Could not access localStorage for language.", e);
      return 'ru';
    }
  });

  // This effect is responsible for applying the theme class to the HTML root element
  // and persisting the choice to localStorage.
  // We use `useLayoutEffect` to run this synchronously after DOM mutations but before the browser paints,
  // which is ideal for visual changes like themes to avoid any "flash" of the wrong theme.
  useLayoutEffect(() => {
    const root = window.document.documentElement;

    // Defensively remove the 'dark' class to ensure a clean slate.
    root.classList.remove('dark');

    // If the theme is 'dark', add the 'dark' class.
    // Tailwind's `darkMode: 'class'` strategy will then apply the dark mode styles.
    if (theme === 'dark') {
      root.classList.add('dark');
    }

    // Persist the user's theme preference.
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error("Failed to save theme to localStorage", error);
    }
  }, [theme]); // Rerun this effect only when the theme changes.

  useEffect(() => {
    try {
      localStorage.setItem('language', language);
    } catch (error) {
      console.error("Failed to save language to localStorage", error);
    }
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations['en'][key];
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
