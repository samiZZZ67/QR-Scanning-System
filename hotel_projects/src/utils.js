export function translated(value, language) {
  const short = language?.split("-")[0] || "en";
  return value?.[short] || value?.en || "";
}

export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString()} ETB`;
}

export function floorFromTable(tableNumber) {
  return Math.floor(Number(tableNumber) / 100);
}

export function randomIdempotencyKey() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const statusOrder = ["received", "preparing", "ready", "delivered"];

export const statusTone = {
  received: "border-amber-300/40 bg-amber-100 text-amber-900",
  preparing: "border-sky-300/40 bg-sky-100 text-sky-900",
  ready: "border-emerald-300/40 bg-emerald-100 text-emerald-900",
  delivered: "border-zinc-300 bg-zinc-100 text-zinc-700"
};
