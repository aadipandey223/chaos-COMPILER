import React, { createContext, useContext, useState, useEffect } from 'react';
import { LingoCLI } from '../lingo/cli-integration';

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  translations: Record<string, string>;
  validationStatus: 'loading' | 'verified' | 'partial' | 'error';
  availableLocales: Array<{ code: string; name: string; flag: string }>;
  t: (key: string, fallback?: string) => string;
  lingo: LingoCLI; // Expose Lingo CLI instance
  getTerm: (term: string) => string; // Get validated compiler terminology
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('chaos-lab-locale');
    return saved || 'en';
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'loading' | 'verified' | 'partial' | 'error'>('verified');

  const lingo = React.useMemo(
    () =>
      new LingoCLI({
        apiKey: import.meta.env.VITE_LINGO_API_KEY || 'api_flh335hyn7ms7h3sfeir9w46',
        projectId: 'Chaos-Compiler',
        baseLocale: 'en',
        targetLocales: ['es', 'zh', 'hi'],
      }),
    []
  );

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('chaos-lab-locale', locale);

    if (locale === 'en') {
      setTranslations({});
      setStatus('verified');
      return;
    }

    setStatus('loading');

    // Fetch validated translations from Lingo with error handling
    lingo
      .pullTranslations(locale)
      .then(data => {
        setTranslations(data);
        const count = Object.keys(data).length;
        
        if (count === 0) {
          setStatus('partial');
          console.info('[i18n] Project is empty. Push content using `npx lingo.dev push` to populate.');
        } else {
          setStatus('verified');
        }
        
        console.log(`[i18n] Loaded ${count} translations for ${locale}`);
      })
      .catch(err => {
        console.error('[i18n] Critical translation loading error:', err);
        
        // Determine error type for production-level error handling
        if (err.name === 'LingoAuthError') {
          console.error('[i18n] ❌ Authentication failed - verify VITE_LINGO_API_KEY is valid');
        } else if (err.name === 'LingoValidationError') {
          console.error('[i18n] ❌ Invalid locale or validation failed');
        } else if (err.name === 'LingoNetworkError') {
          console.error('[i18n] ❌ Network error - Lingo API unreachable');
        }
        
        // Fall back to English on error
        setLocaleState('en');
        setTranslations({});
        setStatus('error');
        
        // Alert user in production
        alert(`Failed to load ${locale} translations. Falling back to English.\\n\\nError: ${err.message}`);
      });
  }, [locale, lingo]);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
  };

  const t = (key: string, fallback?: string): string => {
    if (locale === 'en') return fallback || key;
    
    // Return translation if available
    const translation = translations[key];
    if (translation) {
      return translation;
    }
    
    // Graceful degradation on error - log only when missing
    if (status === 'error' || status === 'partial') {
      console.warn(`[i18n] Missing translation for '${key}' in ${locale}, using fallback`);
    }
    
    return fallback || key;
  };

  // Get validated compiler terminology from Lingo glossary
  const getTerm = (term: string): string => {
    if (locale === 'en') return term;
    return lingo.getLocalizedTerm(term, locale);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        translations,
        validationStatus: status,
        availableLocales: LOCALES,
        t,
        lingo, // Expose Lingo CLI instance
        getTerm, // Expose glossary term method
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
};
