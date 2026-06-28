const BASE = "/api";

export async function submitFeedback({ orderId, rating, name, comment }) {
  const res = await fetch(`${BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, rating, name, comment }),
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
  const res = await fetch(`${BASE}/service-notifications`, {
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
  const res = await fetch(`${BASE}/service-notifications${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function resolveServiceNotification(id) {
  const res = await fetch(`${BASE}/service-notifications/${id}/resolve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to resolve");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
