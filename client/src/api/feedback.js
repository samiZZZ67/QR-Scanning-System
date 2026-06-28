import { api, apiUrl } from './client.js';

const BASE = "/api";

export async function submitFeedback({ orderId, rating, name, comment }) {
  const res = await fetch(apiUrl(`${BASE}/orders/${orderId}/feedback`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, name, comment }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to submit feedback");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function createServiceNotification({
  tableNumber,
  floor,
  type,
  note,
}) {
  const res = await fetch(apiUrl(`${BASE}/service-notifications`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableNumber, floor, type, note }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to send request");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function listServiceNotifications(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
    ),
  ).toString();
  return api(`${BASE}/service-notifications${qs ? `?${qs}` : ""}`);
}

export async function resolveServiceNotification(id) {
  return api(`${BASE}/service-notifications/${id}/resolve`, {
    method: "PATCH",
  });
}
