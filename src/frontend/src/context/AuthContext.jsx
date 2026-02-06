import React, { createContext, useContext, useEffect, useState } from "react";
import { onLogout } from "../services/authEvents.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error("Invalid user in localStorage:", storedUser);
      localStorage.removeItem("user");
      return null;
    }
  });
  const loginContext = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logoutContext = (redirect = true) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (redirect) {
      try {
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      } catch (e) {
        // no-op
      }
    }
  };

  const updateUserContext = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    login: loginContext,
    logout: logoutContext,

    setUser: updateUserContext,
  };

  useEffect(() => {
    const unsubscribe = onLogout(() => logoutContext(true));
    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
