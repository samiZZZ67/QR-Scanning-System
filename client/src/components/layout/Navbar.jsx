import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, Menu, X, Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext.jsx';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Menu', to: '/order?table=101' },
  { label: 'Contact', to: '/contact' },
  { label: 'Kitchen', to: '/kitchen' },
  { label: 'Waiter', to: '/waiter' },
  { label: 'Admin', to: '/admin' },
];

/**
 * LanguageDropdown — the ONE place the language selector appears
 * for non-QR public pages (home, contact, etc.).
 */
function LanguageDropdown() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        id="navbar-lang-btn"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pale/10 hover:bg-pale/20 border border-pale/20 hover:border-gold/40 text-pale text-xs font-semibold transition-all"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        <Globe size={14} className="text-gold" />
        <span className="uppercase tracking-wide">{currentLang.code}</span>
        <span className="text-pale/50 font-normal">/</span>
        <span className="text-pale/70 font-normal">Language</span>
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
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-off-navy/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          aria-label="Habesha Grand Hotel — Home"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold/20 border border-gold/40 group-hover:bg-gold/30 transition-colors">
            <QrCode size={18} className="text-gold" aria-hidden="true" />
          </span>
          <span className="font-display text-lg text-pale leading-tight">
            Habesha<span className="text-gold">Grand</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ label, to }) => {
            const active =
              to === '/'
                ? pathname === '/'
                : pathname.startsWith(to.split('?')[0]);
            return (
              <li key={label}>
                <Link
                  to={to}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'text-gold'
                      : 'text-pale/80 hover:text-pale hover:bg-pale/10'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-4 -bottom-0.5 h-0.5 bg-gold rounded-full"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {/* Language Selector — ONLY in top menu bar */}
          <LanguageDropdown />

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link
              to="/order?table=101"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-pale text-sm font-medium rounded-xl transition-colors"
            >
              <QrCode size={15} aria-hidden="true" />
              Order Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-pale hover:bg-pale/10 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-off-navy/98 backdrop-blur-md border-t border-pale/10"
          >
            <ul className="px-4 py-4 space-y-1" role="list">
              {NAV_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="block px-4 py-3 text-pale/90 hover:text-pale hover:bg-pale/10 rounded-xl transition-colors font-medium"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  to="/order?table=101"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gold hover:bg-gold-hover text-pale font-medium rounded-xl transition-colors"
                >
                  <QrCode size={16} aria-hidden="true" />
                  Order Now
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
