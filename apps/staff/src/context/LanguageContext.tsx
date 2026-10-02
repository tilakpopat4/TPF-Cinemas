import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? decodeURIComponent(v[2]) : null;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  useEffect(() => {
    try {
      const cookie = getCookie('googtrans');
      if (cookie) {
        const parts = cookie.split('/');
        const targetCode = parts[parts.length - 1];
        const match = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode);
        if (match) {
          setCurrentLanguage(match);
        }
      }
    } catch (e) {
      console.warn('Could not read translation cookie:', e);
    }
  }, []);

  const setLanguage = useCallback((targetLang: LanguageOption) => {
    setCurrentLanguage(targetLang);
    setIsTranslating(true);

    try {
      const host = window.location.hostname;

      if (targetLang.code === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
      } else {
        const cookieVal = `/en/${targetLang.code}`;
        document.cookie = `googtrans=${cookieVal}; path=/;`;
        if (host && host !== 'localhost') {
          document.cookie = `googtrans=${cookieVal}; path=/; domain=.${host};`;
        }
      }

      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select) {
        select.value = targetLang.code;
        select.dispatchEvent(new Event('change'));
        setTimeout(() => setIsTranslating(false), 600);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setIsTranslating(false);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
