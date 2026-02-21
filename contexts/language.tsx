import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Language, translations, Translations } from '@/lib/i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

const STORAGE_KEY = 'app_language';

function detectDeviceLanguage(): Language {
  const locales = Localization.getLocales();
  const tag = locales[0]?.languageCode ?? 'en';
  const supported: Language[] = ['en', 'fr', 'de', 'pt', 'es', 'tr'];
  return supported.includes(tag as Language) ? (tag as Language) : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const supported: Language[] = ['en', 'fr', 'de', 'pt', 'es', 'tr'];
      if (stored && supported.includes(stored as Language)) {
        setLanguageState(stored as Language);
      } else {
        setLanguageState(detectDeviceLanguage());
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
