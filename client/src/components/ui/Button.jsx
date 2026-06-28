import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner.jsx";

const VARIANTS = {
  primary: "bg-gold text-pale-light hover:bg-gold-hover disabled:opacity-50",
  outline:
    "border border-gold-muted text-rough hover:border-gold bg-transparent disabled:opacity-40",
  ghost: "text-rough hover:bg-pale bg-transparent disabled:opacity-40",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2   gap-2",
  lg: "text-base px-6 py-3 gap-2",
};

/**
 * Button — brand-styled, animated button.
 * Props: variant, size, loading, disabled, className, onClick, type, ...rest
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  type = "button",
  ...rest
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-semibold rounded-xl",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        "cursor-pointer disabled:cursor-not-allowed",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      ].join(" ")}
      {...rest}
    >
      {loading && <LoadingSpinner size="sm" className="text-current" />}
      {children}
    </motion.button>
  );
}
