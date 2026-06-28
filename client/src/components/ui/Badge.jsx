const VARIANTS = {
  default: "bg-pale text-rough",
  gold: "bg-gold text-pale-light",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
  muted: "bg-gray-100 text-gray-600",
  danger: "bg-red-100 text-red-700",
};

/**
 * Badge — small pill label.
 * variant: 'default' | 'gold' | 'success' | 'warning' | 'info' | 'muted' | 'danger'
 */
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        VARIANTS[variant] ?? VARIANTS.default,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
