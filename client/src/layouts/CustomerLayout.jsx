import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../contexts/LanguageContext.jsx';

/**
 * CustomerTopBar — sticky top bar for QR-scanned guest pages.
 * Shows the restaurant logo/name on the left and the language
 * selector on the right. Language selector is the ONLY place
 * it appears across the entire customer UI.
 */
function CustomerTopBar() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-off-navy/95 backdrop-blur-md border-b border-gold-muted/20 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold/20 border border-gold/40">
            <QrCode size={16} className="text-gold" aria-hidden="true" />
          </span>
          <span className="font-display text-base text-pale leading-tight">
            Habesha<span className="text-gold">Grand</span>
          </span>
        </div>

        {/* Language Selector — ONLY location in customer UI */}
        <div className="relative" ref={ref}>
          <button
            id="lang-selector-btn"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pale/10 hover:bg-pale/20 border border-pale/20 hover:border-gold/40 text-pale text-xs font-semibold transition-all"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Select language"
          >
            <Globe size={14} className="text-gold" />
            <span className="uppercase tracking-wide">{currentLang.code}</span>
            <span className="text-pale/50 font-normal hidden sm:inline">/ Language</span>
            <ChevronDown
              size={13}
              className={`text-pale/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                role="listbox"
                aria-label="Language options"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-44 bg-off-navy border border-gold-muted/30 rounded-xl shadow-xl overflow-hidden z-50"
              >
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const active = language === lang.code;
                  return (
                    <li key={lang.code}>
                      <button
                        role="option"
                        aria-selected={active}
                        onClick={() => { setLanguage(lang.code); setOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                          active
                            ? 'bg-gold/20 text-gold font-semibold'
                            : 'text-pale/80 hover:bg-pale/10 hover:text-pale'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest w-6 text-gold/70">
                            {lang.code}
                          </span>
                          <span>{lang.label}</span>
                        </span>
                        {active && <Check size={14} className="text-gold shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

/**
 * CustomerLayout — wrapper for guest-facing (QR-scanned) pages.
 * Includes the sticky CustomerTopBar with the language selector.
 */
export default function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-pale-light">
      <CustomerTopBar />
      {children}
    </div>
  );
}
