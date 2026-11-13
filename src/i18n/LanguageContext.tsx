import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, TRANSLATIONS } from './translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  easyAccessMode: boolean;
  toggleEasyAccessMode: () => void;
  speakText: (text: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return (localStorage.getItem('carebridge_lang') as LanguageCode) || 'en';
  });

  const [easyAccessMode, setEasyAccessMode] = useState<boolean>(() => {
    return localStorage.getItem('carebridge_easy_access') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('carebridge_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('carebridge_easy_access', String(easyAccessMode));
    if (easyAccessMode) {
      document.body.classList.add('easy-access-mode');
    } else {
      document.body.classList.remove('easy-access-mode');
    }
  }, [easyAccessMode]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const toggleEasyAccessMode = () => {
    setEasyAccessMode(prev => !prev);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback || key;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'te') utterance.lang = 'te-IN';
      else utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        easyAccessMode,
        toggleEasyAccessMode,
        speakText,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
