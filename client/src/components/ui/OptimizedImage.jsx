import { useState } from "react";

/**
 * OptimizedImage — lazy-loading image with shimmer placeholder and emoji fallback.
 */
export default function OptimizedImage({
  src,
  alt = "",
  className = "",
  fallbackEmoji = "🍽️",
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const showFallback = error || !src;

  return (
    <div className={`relative overflow-hidden bg-pale ${className}`}>
      {/* Shimmer while loading */}
      {!loaded && !showFallback && (
        <div className="absolute inset-0 bg-gradient-to-r from-pale via-pale-light to-pale animate-pulse" />
      )}

      {showFallback ? (
        /* Emoji placeholder */
        <div className="absolute inset-0 flex items-center justify-center bg-pale">
          <span className="text-5xl opacity-40 select-none" aria-hidden="true">
            {fallbackEmoji}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={[
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      )}
    </div>
  );
}
