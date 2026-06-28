import { createContext, useContext, useState, useEffect } from "react";
import { createSession } from "../api/auth.js";
import { setStaffPin, getStaffPin, clearStaffPin } from "../api/client.js";

const AuthContext = createContext(null);

const ROLE_KEY = "hotel_staff_role";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getStaffPin();
  });
  const [role, setRole] = useState(() => {
    return sessionStorage.getItem(ROLE_KEY) || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Authenticate a staff member against the backend session endpoint.
   * @param {string} pin
   * @param {string} targetRole  e.g. 'Kitchen' | 'Waiter' | 'Admin'
   * @returns {Promise<boolean>} success
   */
  async function authenticate(pin, targetRole) {
    setIsLoading(true);
    setError(null);
    try {
      // Call backend to verify the PIN
      const res = await createSession(pin, pin);
      if (res && res.ok) {
        setStaffPin(pin);
        sessionStorage.setItem(ROLE_KEY, targetRole);
        setIsAuthenticated(true);
        setRole(targetRole);
        setIsLoading(false);
        return true;
      }
      throw new Error("Verification failed");
    } catch (err) {
      clearStaffPin();
      sessionStorage.removeItem(ROLE_KEY);
      setIsAuthenticated(false);
      setRole(null);
      setError(err.message || "Invalid PIN. Please try again.");
      setIsLoading(false);
      return false;
    }
  }

  function logout() {
    clearStaffPin();
    sessionStorage.removeItem(ROLE_KEY);
    setIsAuthenticated(false);
    setRole(null);
    setError(null);
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, role, authenticate, logout, isLoading, error }}
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
