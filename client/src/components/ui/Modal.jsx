import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const SIZE_MAP = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export default function Modal({
  open,
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
}) {
  const visible = open ?? isOpen ?? false;
  const handleClose = onClose || (() => {});

  // Lock scroll
  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  // Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, handleClose]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-rough/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={[
              "relative w-full flex flex-col max-h-[90vh]",
              "bg-surface rounded-2xl shadow-lifted border border-gold-muted",
              SIZE_MAP[size] ?? SIZE_MAP.md,
            ].join(" ")}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold-muted shrink-0">
              <h2 className="text-lg font-semibold text-rough font-display">
                {title}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-pale text-gold-muted hover:text-rough transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">{children}</div>

            {/* Optional footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gold-muted shrink-0 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
