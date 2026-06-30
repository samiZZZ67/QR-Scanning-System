import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Layers,
  UserRound,
  Volume2,
  VolumeX,
  X,
  MessageSquareWarning,
  Phone,
  FileText
} from 'lucide-react';
import { resolveManagerNotification, resolveServiceNotification } from '../../api/notifications.js';
import { timeAgo, formatTime } from '../../utils/formatting.js';

function statusDot(status) {
  return status === 'open'
    ? 'bg-amber-400 animate-pulse'
    : 'bg-green-500';
}

function NotificationItem({ notification, onResolve }) {
  const isManager = !!notification.staffName;
  const isCallWaiter = notification.type === 'call-waiter';
  const isBill = notification.type === 'request-bill';

  let title = '';
  let subtitle = '';
  let Icon = UserRound;

  if (isManager) {
    title = notification.staffName;
    subtitle = notification.staffRole || 'Staff';
  } else if (isCallWaiter) {
    title = 'Waiter Called';
    subtitle = `Table ${notification.tableNumber || notification.table_number}`;
    Icon = Phone;
  } else if (isBill) {
    title = 'Bill Requested';
    subtitle = `Table ${notification.tableNumber || notification.table_number}`;
    Icon = FileText;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className={[
        'relative p-4 rounded-xl border transition-colors',
        notification.status === 'open'
          ? 'bg-amber-50 border-amber-200/80'
          : 'bg-surface border-gold-muted/25 opacity-70',
      ].join(' ')}
    >
      {/* Status dot */}
      <span
        className={`absolute top-3 right-3 w-2 h-2 rounded-full ${statusDot(notification.status)}`}
        title={notification.status}
      />

      <div className="flex items-start gap-3 pr-4">
        <div className="mt-0.5 p-1.5 bg-gold/10 rounded-lg shrink-0">
          <Icon size={14} className="text-gold" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-rough text-sm leading-tight">
            {title}
            <span className="ml-2 text-xs font-normal text-gold-muted">
              {subtitle}
            </span>
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-body">
            {(notification.assignedFloor || notification.floor) && (
              <span className="flex items-center gap-1">
                <Layers size={11} className="text-gold-muted" />
                Floor {notification.assignedFloor || notification.floor}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-gold-muted" />
              {formatTime(notification.createdAt)} · {timeAgo(notification.createdAt)}
            </span>
          </div>

          {notification.reason && (
            <p className="text-xs text-body italic leading-snug line-clamp-2 mt-1">
              "{notification.reason}"
            </p>
          )}
        </div>
      </div>

      {notification.status === 'open' && onResolve && (
        <button
          onClick={() => onResolve(notification.id)}
          className="mt-2 ml-9 flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900 transition-colors"
        >
          <CheckCircle2 size={13} />
          Mark Resolved
        </button>
      )}
    </motion.div>
  );
}

/**
 * Slide-down notification panel anchored below the bell button.
 * Controlled by `open` / `onClose`.
 */
export default function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  soundEnabled,
  toggleSound,
  markAllSeen,
  onNotificationsChange,
}) {
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    // Delay so the opening click doesn't immediately close
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [open, onClose]);

  // Mark all seen when panel opens
  useEffect(() => {
    if (open && markAllSeen) markAllSeen();
  }, [open, markAllSeen]);

  async function handleResolve(notification) {
    try {
      let resolved;
      if (notification.staffName) {
        resolved = await resolveManagerNotification(notification.id);
      } else {
        resolved = await resolveServiceNotification(notification.id);
      }
      onNotificationsChange?.(notification.id, resolved);
    } catch {
      // silently ignore
    }
  }

  const open_ = notifications.filter((n) => n.status === 'open');
  const resolved_ = notifications.filter((n) => n.status !== 'open');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="absolute right-0 top-full mt-2 w-96 max-h-[520px] flex flex-col bg-surface border border-gold-muted/40 rounded-2xl shadow-lifted z-50 overflow-hidden"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <BellRing size={16} className="text-gold" />
              <span className="font-display font-semibold text-rough text-sm">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
                className="p-1.5 rounded-lg text-gold-muted hover:text-gold hover:bg-pale transition-colors"
                aria-label={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gold-muted hover:text-rough hover:bg-pale transition-colors"
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center text-gold-muted">
                <Bell size={32} className="mb-2 opacity-30" />
                <p className="font-display font-medium text-rough text-sm">No notifications</p>
                <p className="text-xs mt-1">Manager calls will appear here in real-time.</p>
              </div>
            ) : (
              <>
                {open_.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gold px-1">
                      Open ({open_.length})
                    </p>
                    <AnimatePresence mode="popLayout">
                      {open_.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onResolve={() => handleResolve(n)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {resolved_.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gold-muted px-1">
                      Resolved ({resolved_.length})
                    </p>
                    <AnimatePresence mode="popLayout">
                      {resolved_.slice(0, 10).map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onResolve={null}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer hint */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gold-muted/20 shrink-0">
              <p className="text-[10px] text-gold-muted text-center">
                Full history in the{' '}
                <span className="font-semibold text-gold">Manager</span> or <span className="font-semibold text-gold">Waiter</span> tabs
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
