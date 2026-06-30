const STAFF_TOKEN_KEY = "hotel_staff_token";
const STAFF_EXPIRES_KEY = "hotel_staff_expires_at";
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/$/, "");

export function apiUrl(path) {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/api")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
  return `${API_BASE}${normalized}`;
}

export function getStaffToken() {
  const token = sessionStorage.getItem(STAFF_TOKEN_KEY) || "";
  const expiresAt = sessionStorage.getItem(STAFF_EXPIRES_KEY) || "";
  if (expiresAt && Date.now() >= new Date(expiresAt).getTime()) {
    clearStaffSession();
    return "";
  }
  return token;
}

export function setStaffSession({ token, expiresAt }) {
  sessionStorage.setItem(STAFF_TOKEN_KEY, token);
  sessionStorage.setItem(STAFF_EXPIRES_KEY, expiresAt);
}

export function clearStaffSession() {
  sessionStorage.removeItem(STAFF_TOKEN_KEY);
  sessionStorage.removeItem(STAFF_EXPIRES_KEY);
}

export function notifyAuthExpired() {
  clearStaffSession();
  window.dispatchEvent(new CustomEvent("staff-session-expired"));
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  const token = options.tokenOverride ?? getStaffToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(apiUrl(path), {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  const ct = res.headers.get("content-type") || "";
  const payload = ct.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    const err = new Error(
      payload?.error || `Request failed with ${res.status}`,
    );
    err.status = res.status;
    if (res.status === 401 && options.authOptional !== true) {
      notifyAuthExpired();
    }
    throw err;
  }
  return payload;
}

function withQuery(path, params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  if (!entries.length) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${new URLSearchParams(entries).toString()}`;
}

function wrapData(request) {
  return request.then((data) => ({ data }));
}

const client = {
  get(path, options = {}) {
    return wrapData(api(withQuery(path, options.params)));
  },
  post(path, body, options = {}) {
    return wrapData(api(path, { ...options, method: "POST", body }));
  },
  patch(path, body, options = {}) {
    return wrapData(api(path, { ...options, method: "PATCH", body }));
  },
  delete(path, options = {}) {
    return wrapData(api(path, { ...options, method: "DELETE" }));
  },
};

export default client;
