// ─── Money ───────────────────────────────────────────────────────────────────
export function formatMoney(amount, currency = "ETB") {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Idempotency ─────────────────────────────────────────────────────────────
export function randomIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Order Status ─────────────────────────────────────────────────────────────
export const STATUS_ORDER = ["received", "preparing", "ready", "delivered"];

export const STATUS_COLORS = {
  received: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

// ─── Time ──────────────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.round((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  return `${hrs}h ${diff % 60}m ago`;
}

export function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
