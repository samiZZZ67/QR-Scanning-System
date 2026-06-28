/**
 * Input — branded text input with optional label and error message.
 */
export default function Input({ label, error, className = "", id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-rough">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "w-full px-3 py-2 rounded-xl border border-gold-muted bg-surface",
          "text-rough placeholder:text-gold-muted text-sm",
          "focus:outline-none focus:border-gold transition-colors",
          error ? "border-red-400" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
