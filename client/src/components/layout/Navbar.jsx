import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Menu", to: "/order?table=101" },
  { label: "Contact", to: "/contact" },
  { label: "Kitchen", to: "/kitchen" },
  { label: "Waiter", to: "/waiter" },
  { label: "Admin", to: "/admin" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-off-navy/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
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
            Habesha<span className="text-gold"> Grand</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ label, to }) => {
            const active =
              to === "/"
                ? pathname === "/"
                : pathname.startsWith(to.split("?")[0]);
            return (
              <li key={label}>
                <Link
                  to={to}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? "text-gold"
                      : "text-pale/80 hover:text-pale hover:bg-pale/10"
                  }`}
                  aria-current={active ? "page" : undefined}
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
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
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
