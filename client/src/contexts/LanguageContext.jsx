import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (field) => field,
});

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'ar', label: 'العربية' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('site_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('site_language', lang);
    } catch {}
    
    // Set document direction for Arabic
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Initial setup on mount
    setLanguage(language);
  }, []);

  /**
   * Helper function to extract the correct translation from a multilingual field.
   * Falls back to English if the translation is missing.
   * If the field is a string, returns it directly.
   */
  const t = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field.en || field.am || field.ar || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
