import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";

const CONFIG = {
  error: { icon: XCircle, style: "bg-red-50   border-red-300   text-red-800" },
  success: {
    icon: CheckCircle,
    style: "bg-green-50 border-green-300 text-green-800",
  },
  warning: {
    icon: AlertCircle,
    style: "bg-amber-50 border-amber-300 text-amber-800",
  },
  info: { icon: Info, style: "bg-blue-50  border-blue-300  text-blue-800" },
};

/**
 * Notice — contextual alert banner.
 * type: 'error' | 'success' | 'warning' | 'info'
 */
export default function Notice({ type = "info", message, className = "", onDismiss }) {
  if (!message) return null;
  const { icon: Icon, style } = CONFIG[type] ?? CONFIG.info;

  return (
    <div
      role="alert"
      className={[
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        style,
        className,
      ].join(" ")}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
