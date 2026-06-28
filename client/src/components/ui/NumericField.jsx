import { Minus, Plus } from "lucide-react";

/**
 * NumericField — +/- quantity stepper with accessible labels.
 * Props: value, onChange(newVal), min, max, className
 */
export default function NumericField({
  value,
  onChange,
  min = 1,
  max = 99,
  className = "",
}) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={[
          "w-8 h-8 flex items-center justify-center rounded-full border border-gold-muted",
          "text-rough hover:border-gold hover:bg-pale transition-colors",
          "disabled:opacity-30 disabled:cursor-not-allowed",
        ].join(" ")}
        aria-label="Decrease quantity"
      >
        <Minus size={13} />
      </button>

      <span
        className="w-8 text-center font-semibold text-rough tabular-nums text-sm"
        aria-live="polite"
        aria-label={`Quantity: ${value}`}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={[
          "w-8 h-8 flex items-center justify-center rounded-full border border-gold-muted",
          "text-rough hover:border-gold hover:bg-pale transition-colors",
          "disabled:opacity-30 disabled:cursor-not-allowed",
        ].join(" ")}
        aria-label="Increase quantity"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
