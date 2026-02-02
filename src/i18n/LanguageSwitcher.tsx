import React from 'react';
import { Globe, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from './LanguageProvider';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, validationStatus, availableLocales } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLocale = availableLocales.find(l => l.code === locale);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 transition-all text-sm"
      >
        <Globe size={14} className="text-slate-400" />
        <span className="text-slate-300">
          {currentLocale?.flag} {currentLocale?.name}
        </span>
        
        {validationStatus === 'loading' && (
          <Loader2 size={12} className="text-blue-400 animate-spin" />
        )}
        {validationStatus === 'verified' && locale !== 'en' && (
          <CheckCircle size={12} className="text-emerald-500" />
        )}
        {validationStatus === 'error' && (
          <AlertCircle size={12} className="text-amber-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 min-w-[200px] overflow-hidden"
            >
              {availableLocales.map(loc => (
                <button
                  key={loc.code}
                  onClick={() => {
                    setLocale(loc.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all ${
                    locale === loc.code
                      ? 'bg-lingo/10 text-white border-l-2 border-lingo'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{loc.flag}</span>
                    <span className="font-medium">{loc.name}</span>
                  </div>
                  {loc.code === locale && <CheckCircle size={14} className="text-lingo" />}
                  {loc.code === 'en' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded uppercase font-bold">
                      Source
                    </span>
                  )}
                </button>
              ))}
              
              <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/50">
                <p className="text-[9px] text-slate-500 leading-tight">
                  Translations validated by Lingo.dev. Technical terms verified by CS faculty.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
