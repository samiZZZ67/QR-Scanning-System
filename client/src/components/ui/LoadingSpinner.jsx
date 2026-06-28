const SIZE_MAP = {
  sm: 14,
  md: 18,
  lg: 22,
};

export default function LoadingSpinner({ size = 'md', text = '', className = '' }) {
  const pixels = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <span className="inline-flex items-center justify-center gap-2 text-sm text-gold-muted">
      <svg
        width={pixels}
        height={pixels}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`animate-spin text-gold ${className}`}
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {text && <span>{text}</span>}
    </span>
  );
}

