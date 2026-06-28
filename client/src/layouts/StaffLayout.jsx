import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * StaffLayout — shell for kitchen / waiter dashboards.
 * Provides the dark top-bar with the hotel name, role badge, and a logout link.
 */
export default function StaffLayout({ children, title }) {
  const { role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-pale flex flex-col">
      <header className="sticky top-0 z-40 bg-rough text-pale-light px-5 py-3 flex items-center justify-between shadow-lifted">
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">
            🏨
          </span>
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
          className="text-xs text-gold-muted hover:text-pale-light transition-colors underline underline-offset-2"
          aria-label="Log out"
        >
          Log out
        </button>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full">{children}</main>
    </div>
  );
}
