import { createContext, useContext, useState, useEffect } from "react";
import { createSession } from "../api/auth.js";
import { setStaffSession, getStaffToken, clearStaffSession } from "../api/client.js";

const AuthContext = createContext(null);

const ROLE_KEY = "hotel_staff_role";
const EXPIRES_KEY = "hotel_staff_expires_at_ui";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getStaffToken();
  });
  const [role, setRole] = useState(() => {
    return sessionStorage.getItem(ROLE_KEY) || null;
  });
  const [expiresAt, setExpiresAt] = useState(() => {
    return sessionStorage.getItem(EXPIRES_KEY) || "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);

  useEffect(() => {
    function handleExpired() {
      sessionStorage.removeItem(ROLE_KEY);
      sessionStorage.removeItem(EXPIRES_KEY);
      setIsAuthenticated(false);
      setRole(null);
      setExpiresAt("");
      setSessionNotice("Your staff session expired. Please sign in again.");
    }
    window.addEventListener("staff-session-expired", handleExpired);
    return () => window.removeEventListener("staff-session-expired", handleExpired);
  }, []);

  /**
   * Authenticate a staff member against the backend session endpoint.
   * @param {string} pin
   * @param {string} targetRole  e.g. 'Kitchen' | 'Waiter' | 'Admin'
   * @returns {Promise<boolean>} success
   */
  async function authenticate(pin, targetRole) {
    setIsLoading(true);
    setError(null);
    setSessionNotice(null);
    try {
      // Call backend to verify the PIN
      const res = await createSession(pin, targetRole);
      if (res?.ok && res.token) {
        setStaffSession({ token: res.token, expiresAt: res.expiresAt });
        sessionStorage.setItem(ROLE_KEY, res.role || targetRole);
        sessionStorage.setItem(EXPIRES_KEY, res.expiresAt || "");
        setIsAuthenticated(true);
        setRole(res.role || targetRole);
        setExpiresAt(res.expiresAt || "");
        setIsLoading(false);
        return true;
      }
      throw new Error("Verification failed");
    } catch (err) {
      clearStaffSession();
      sessionStorage.removeItem(ROLE_KEY);
      sessionStorage.removeItem(EXPIRES_KEY);
      setIsAuthenticated(false);
      setRole(null);
      setExpiresAt("");
      setError(err.message || "Invalid PIN. Please try again.");
      setIsLoading(false);
      return false;
    }
  }

  function logout() {
    clearStaffSession();
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
    setIsAuthenticated(false);
    setRole(null);
    setExpiresAt("");
    setError(null);
    setSessionNotice(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        expiresAt,
        sessionNotice,
        authenticate,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
