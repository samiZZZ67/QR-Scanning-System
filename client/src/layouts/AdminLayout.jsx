import { Building2, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { AdminSidebar } from "../components/layout/AdminSidebar.jsx";
import Button from "../components/ui/Button.jsx";

export function AdminLayout({ children, activeTab, onTabChange, tabs = [] }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-pale flex flex-col">
      <header className="sticky top-0 w-full bg-surface border-b border-gold-muted/30 shadow-card z-20  md:pl-60">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-gold" aria-hidden="true" />
            <span className="font-display font-semibold text-rough">
              Habesha Grand
            </span>
            <span className="text-xs text-gold-muted hidden sm:block">
              / Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-body">
              <User size={15} className="text-gold-muted" aria-hidden="true" />
              <span className="text-gold-muted">Admin</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut size={15} />}
              onClick={logout}
              aria-label="Log out"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden md:pl-60">
        <div className="hidden md:block">
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            tabs={tabs}
          />
        </div>

        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          aria-label="Admin content"
        >
          {children}
        </main>
      </div>

      {tabs.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 bg-rough border-t border-pale/10 z-30 flex overflow-x-auto"
          aria-label="Admin mobile navigation"
        >
          {tabs.slice(0, 6).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex-1 flex flex-col items-center gap-0.5 py-3 px-1 text-xs transition-colors min-w-[3rem]",
                  isActive ? "text-gold-hover" : "text-pale/55 hover:text-pale",
                ].join(" ")}
              >
                {Icon && (
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    aria-hidden="true"
                  />
                )}
                <span className="truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default AdminLayout;
