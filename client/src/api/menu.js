import { apiUrl } from './client.js';

const BASE = "/api";

export async function getMenu(includeUnavailable = false) {
  const query = includeUnavailable ? '?includeUnavailable=true' : '';
  const res = await fetch(apiUrl(`${BASE}/menu${query}`));
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to load menu");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getItemReviews(itemId) {
  const res = await fetch(apiUrl(`${BASE}/menu-items/${itemId}/reviews`));
  if (!res.ok) {
    // Reviews are non-critical; return empty list on failure
    return { reviews: [] };
  }
  return res.json();
}
