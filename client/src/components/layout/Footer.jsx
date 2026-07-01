import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  QrCode,
} from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-off-navy text-pale/80" aria-label="Site footer">
      {/* Top border accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 mb-5 group"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold/20 border border-gold/40">
                <QrCode size={18} className="text-gold" aria-hidden="true" />
              </span>
              <span className="font-display text-lg text-pale">
                Habesha<span className="text-gold"> Grand</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-pale/60 mb-5">
              Where Ethiopian tradition meets modern luxury. Experience
              world-class hospitality in the heart of Addis Ababa.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                {
                  Icon: Instagram,
                  href: "https://instagram.com",
                  label: "Instagram",
                },
                {
                  Icon: Facebook,
                  href: "https://facebook.com",
                  label: "Facebook",
                },
                {
                  Icon: Twitter,
                  href: "https://twitter.com",
                  label: "Twitter",
                },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-pale/5 hover:bg-gold/20 hover:text-gold border border-pale/10 hover:border-gold/40 transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-pale text-base mb-5">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm" role="list">
              {[
                { label: "Home", to: "/" },
                { label: "Browse Menu", to: "/order" },
                { label: "Contact Us", to: "/contact" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-pale/60 hover:text-gold transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-pale text-base mb-5">Contact</h3>
            <ul className="space-y-3 text-sm" role="list">
              {[
                {
                  Icon: MapPin,
                  text: "123 Churchill Avenue, Addis Ababa, Ethiopia",
                },
                { Icon: Phone, text: "+251 11 234 5678" },
                { Icon: Mail, text: "info@habeshaGrand.com" },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon
                    size={15}
                    className="text-gold mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-pale/60">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-display text-pale text-base mb-5">
              <Clock
                size={15}
                className="inline text-gold mr-1.5"
                aria-hidden="true"
              />
              Hours
            </h3>
            <ul className="space-y-2 text-sm text-pale/60" role="list">
              <li className="flex justify-between gap-4">
                <span>Breakfast</span>
                <span className="text-pale/40">6:00 – 10:00 AM</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Lunch</span>
                <span className="text-pale/40">12:00 – 3:00 PM</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Dinner</span>
                <span className="text-pale/40">6:00 – 11:00 PM</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Bar</span>
                <span className="text-pale/40">5:00 PM – Midnight</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-pale/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-pale/40">
          <p>© {year} Habesha Grand Hotel. All rights reserved.</p>
          <p>Crafted with care in Addis Ababa, Ethiopia ✦</p>
        </div>
      </div>
    </footer>
  );
}
