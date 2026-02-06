import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Snackbar, Alert } from "@mui/material";
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

  const warningTimeoutRef = useRef(null);
  const warnedTokenRef = useRef(null);
  const [expiryWarningOpen, setExpiryWarningOpen] = useState(false);

  const notifyExpiring = () => {
    setExpiryWarningOpen(true);
  };

  const parseJwtExp = (jwtToken) => {
    if (!jwtToken) return null;
    const parts = jwtToken.split(".");
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join(""),
      );
      const payload = JSON.parse(json);
      return typeof payload.exp === "number" ? payload.exp * 1000 : null;
    } catch (e) {
      return null;
    }
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

  useEffect(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    if (!token) {
      warnedTokenRef.current = null;
      return;
    }

    const expMs = parseJwtExp(token);
    if (!expMs) return;

    const now = Date.now();
    const warnAt = expMs - 3 * 60 * 1000;
    const delay = warnAt - now;

    if (warnedTokenRef.current === token) return;

    if (delay <= 0 && expMs > now) {
      warnedTokenRef.current = token;
      notifyExpiring();
      return;
    }

    if (delay > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        warnedTokenRef.current = token;
        notifyExpiring();
      }, delay);
    }

    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    };
  }, [token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Snackbar
        open={expiryWarningOpen}
        autoHideDuration={8000}
        onClose={() => setExpiryWarningOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setExpiryWarningOpen(false)}
          severity="warning"
          variant="filled"
        >
          Platnost přihlášení brzy vyprší. Prosím uložte práci a přihlaste se
          znovu.
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
