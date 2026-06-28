import { Star } from "lucide-react";

const SIZES = { sm: 14, md: 20, lg: 28 };

/**
 * StarRating — interactive or read-only star rating widget.
 * Props: value (0-5), onChange, max, size ('sm'|'md'|'lg'), readOnly
 */
export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
}) {
  const px = SIZES[size] ?? SIZES.md;

  return (
    <div
      className="flex gap-0.5"
      role={readOnly ? "img" : "group"}
      aria-label={`Rating: ${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(i + 1)}
            className={[
              "transition-transform focus:outline-none",
              readOnly
                ? "cursor-default"
                : "hover:scale-125 focus-visible:scale-125",
            ].join(" ")}
            aria-label={
              readOnly ? undefined : `${i + 1} star${i !== 0 ? "s" : ""}`
            }
          >
            <Star
              size={px}
              className={filled ? "text-gold" : "text-gold-muted"}
              fill={filled ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}
