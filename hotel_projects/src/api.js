const STAFF_PIN_KEY = "hotel_staff_pin";
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

export function getStaffPin() {
  return sessionStorage.getItem(STAFF_PIN_KEY) || "";
}

export function setStaffPin(pin) {
  sessionStorage.setItem(STAFF_PIN_KEY, pin);
}

export function clearStaffPin() {
  sessionStorage.removeItem(STAFF_PIN_KEY);
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const pin = options.pinOverride ?? getStaffPin();
  if (pin) {
    headers.set("x-staff-pin", pin);
  }

  const response = await fetch(apiUrl(path), {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}
