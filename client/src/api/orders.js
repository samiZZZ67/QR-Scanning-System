const BASE = "/api";

export async function placeOrder({
  tableNumber,
  floor,
  items,
  notes,
  idempotencyKey,
}) {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ tableNumber, floor, items, notes }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getOrder(id) {
  const res = await fetch(`${BASE}/orders/${id}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "Not found");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function listOrders(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
    ),
  ).toString();
  const res = await fetch(`${BASE}/orders${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function updateOrderStatus(id, status) {
  const res = await fetch(`${BASE}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
