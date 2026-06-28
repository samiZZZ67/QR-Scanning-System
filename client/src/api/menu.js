const BASE = "/api";

export async function getMenu() {
  const res = await fetch(`${BASE}/menu`);
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to load menu");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getItemReviews(itemId) {
  const res = await fetch(`${BASE}/menu/${itemId}/reviews`);
  if (!res.ok) {
    // Reviews are non-critical; return empty list on failure
    return { reviews: [] };
  }
  return res.json();
}
