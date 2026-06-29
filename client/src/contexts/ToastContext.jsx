import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
// type: 'success' | 'error' | 'warning' | 'info'

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const COLORS = {
  success: 'bg-green-50 border-green-300 text-green-900',
  error:   'bg-red-50 border-red-300 text-red-900',
  warning: 'bg-amber-50 border-amber-300 text-amber-900',
  info:    'bg-blue-50 border-blue-300 text-blue-900',
};

const ICON_COLORS = {
  success: 'text-green-600',
  error:   'text-red-600',
  warning: 'text-amber-600',
  info:    'text-blue-600',
};

let nextId = 1;

/* ─── Single Toast ───────────────────────────────────────────────────────────── */
function ToastItem({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={[
        'relative flex items-start gap-3 w-80 px-4 py-3.5 rounded-xl border shadow-lifted',
        COLORS[toast.type] || COLORS.info,
      ].join(' ')}
      role="alert"
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_COLORS[toast.type] || ICON_COLORS.info}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm leading-tight mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      {toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 rounded-b-xl"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────────── */
function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-rough/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        />
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="relative z-10 w-full max-w-sm bg-surface rounded-2xl border border-gold-muted shadow-lifted p-6 space-y-4"
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-xl shrink-0">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div className="space-y-1">
              <h2 id="confirm-title" className="font-display font-semibold text-rough text-base">
                {dialog.title || 'Are you sure?'}
              </h2>
              {dialog.message && (
                <p className="text-sm text-body leading-snug">{dialog.message}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-rough hover:bg-pale rounded-xl transition-colors"
            >
              {dialog.cancelLabel || 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              {dialog.confirmLabel || 'Confirm'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── Provider ───────────────────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolveRef = useRef(null);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = {
    success: (message, title) => addToast({ type: 'success', title, message }),
    error:   (message, title) => addToast({ type: 'error',   title, message }),
    warning: (message, title) => addToast({ type: 'warning', title, message }),
    info:    (message, title) => addToast({ type: 'info',    title, message }),

    /** Returns a promise that resolves to true (confirmed) or false (cancelled). */
    confirm: ({ title, message, confirmLabel, cancelLabel } = {}) =>
      new Promise((resolve) => {
        confirmResolveRef.current = resolve;
        setConfirmDialog({ title, message, confirmLabel, cancelLabel });
      }),
  };

  function handleConfirm() {
    confirmResolveRef.current?.(true);
    setConfirmDialog(null);
  }
  function handleCancel() {
    confirmResolveRef.current?.(false);
    setConfirmDialog(null);
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast stack — top-right */}
      <div
        className="fixed top-4 right-4 z-[90] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        dialog={confirmDialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
