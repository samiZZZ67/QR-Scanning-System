import { Building2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function StaffLayout({ children, title }) {
  const { role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-pale flex flex-col">
      <header className="sticky top-0 z-40 bg-rough text-pale-light px-5 py-3 flex items-center justify-between shadow-lifted">
        <div className="flex items-center gap-3">
          <Building2 size={22} className="text-gold" aria-hidden="true" />
          <div>
            <p className="font-display text-pale-light text-base font-semibold leading-tight">
              Habesha Grand Hotel
            </p>
            {(title || role) && (
              <p className="text-xs text-gold-muted">{title || role}</p>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-xs text-gold-muted hover:text-pale-light transition-colors"
          aria-label="Log out"
        >
          <LogOut size={14} />
          Log out
        </button>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full">{children}</main>
    </div>
  );
}

