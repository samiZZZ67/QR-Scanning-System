import { useState, useCallback } from 'react';
import { Building2, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { AdminSidebar } from '../components/layout/AdminSidebar.jsx';
import NotificationPanel from '../components/layout/NotificationPanel.jsx';
import GrokAssistant from '../components/layout/GrokAssistant.jsx';
import Button from '../components/ui/Button.jsx';
import { useNotifications } from '../hooks/useNotifications.js';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminLayout({ children, activeTab, onTabChange, tabs = [] }) {
  const { logout } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    managerUnreadCount,
    loading: notifLoading,
    markAllSeen,
    soundEnabled,
    toggleSound,
    refresh: refreshNotifs,
  } = useNotifications();

  const handleNotificationsChange = useCallback((id, resolved) => {
    // The useNotifications hook listens to the socket — no local state mutation needed
    refreshNotifs();
  }, [refreshNotifs]);

  return (
    <div className="min-h-screen bg-pale flex flex-col">
      <header className="sticky top-0 w-full bg-surface border-b border-gold-muted/30 shadow-card z-20 md:pl-60">
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

            {/* ── Notification Bell ──────────────────────────────────────────── */}
            <div className="relative">
              <button
                id="notification-bell"
                onClick={() => setBellOpen((v) => !v)}
                aria-label={`Notifications${managerUnreadCount > 0 ? `, ${managerUnreadCount} unread manager call${managerUnreadCount > 1 ? 's' : ''}` : ''}`}
                aria-haspopup="dialog"
                aria-expanded={bellOpen}
                className={[
                  'relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors',
                  bellOpen
                    ? 'bg-gold/15 text-gold'
                    : 'text-gold-muted hover:text-gold hover:bg-gold/10',
                ].join(' ')}
              >
                <AnimatePresence mode="wait">
                  {managerUnreadCount > 0 ? (
                    <motion.span
                      key="ring"
                      initial={{ rotate: -20 }}
                      animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Bell size={18} />
                    </motion.span>
                  ) : (
                    <motion.span key="still">
                      <Bell size={18} />
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge — only for unread manager calls */}
                <AnimatePresence>
                  {managerUnreadCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow"
                      aria-hidden="true"
                    >
                      {managerUnreadCount > 99 ? '99+' : managerUnreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <NotificationPanel
                open={bellOpen}
                onClose={() => setBellOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                soundEnabled={soundEnabled}
                toggleSound={toggleSound}
                markAllSeen={markAllSeen}
                onNotificationsChange={handleNotificationsChange}
              />
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
            unreadCount={managerUnreadCount}
          />
        </div>

        <main
          className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6"
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
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex-1 flex flex-col items-center gap-0.5 py-3 px-1 text-xs transition-colors min-w-[3rem]',
                  isActive ? 'text-gold-hover' : 'text-pale/55 hover:text-pale',
                ].join(' ')}
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

      {/* ── Floating Grok AI Assistant ─────────────────────────────────── */}
      <GrokAssistant activeTab={activeTab} />
    </div>
  );
}

export default AdminLayout;
