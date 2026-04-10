// ============================================================
// frontend/src/context/AuthContext.jsx  — PRODUCTION UPGRADED
// FIX 1: Added JWT expiry check on load — expired tokens were
//        kept in localStorage forever, causing 401 errors silently
// FIX 2: Added token validation helper
// ============================================================

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

/**
 * Check if a JWT token is expired (client-side check only).
 * Note: server still validates — this is just for UX.
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // If we can't decode it, treat as expired
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      // FIX: Check expiry before restoring session
      if (isTokenExpired(storedToken)) {
        // Token is expired — clear and force re-login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        console.log("[Auth] Stored token expired — cleared session");
      } else {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }
    }
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
