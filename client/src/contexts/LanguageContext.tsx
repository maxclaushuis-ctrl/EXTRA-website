import React, { createContext, useContext, useState, ReactNode } from 'react';

// Ondersteunde talen
export type Language = 'nl' | 'en' | 'es';

// Taal mapping voor gebruiksvriendelijke weergave
export const languageNames: Record<Language, string> = {
  nl: 'Nederlands',
  en: 'English',
  es: 'Español',
};

// Context interface
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Default context waarde
const defaultContext: LanguageContextType = {
  language: 'nl',
  setLanguage: () => {},
  t: (key: string) => key,
};

// Creëer de context
export const LanguageContext = createContext<LanguageContextType>(defaultContext);

// Context provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('nl');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({
    // Wordt geladen in useEffect
  });

  // Laad de vertalingen wanneer de taal verandert
  React.useEffect(() => {
    import(`../translations/${language}.ts`)
      .then((module) => {
        setTranslations(module.default);
      })
      .catch((err) => {
        console.error('Kon vertalingen niet laden:', err);
      });
  }, [language]);

  // Vertaalfunctie
  const t = (key: string): string => {
    const keys = key.split('.');
    let result = translations;
    
    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];
      if (result && currentKey in result) {
        result = result[currentKey] as any;
      } else {
        // Als de sleutel niet bestaat, geef de originele sleutel terug
        return key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  };

  // Context waarde
  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook om gemakkelijk toegang te krijgen tot de taalcontext
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage moet binnen een LanguageProvider gebruikt worden');
  }
  return context;
};