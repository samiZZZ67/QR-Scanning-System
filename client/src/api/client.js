const STAFF_PIN_KEY = 'hotel_staff_pin';
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}

export function getStaffPin() { return sessionStorage.getItem(STAFF_PIN_KEY) || ''; }
export function setStaffPin(pin) { sessionStorage.setItem(STAFF_PIN_KEY, pin); }
export function clearStaffPin() { sessionStorage.removeItem(STAFF_PIN_KEY); }

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  const pin = options.pinOverride ?? getStaffPin();
  if (pin) headers.set('x-staff-pin', pin);

  const res = await fetch(apiUrl(path), {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal
  });

  const ct = res.headers.get('content-type') || '';
  const payload = ct.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const err = new Error(payload?.error || `Request failed with ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return payload;
}
