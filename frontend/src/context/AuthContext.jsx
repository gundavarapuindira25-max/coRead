import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pick up session token from URL after OAuth redirect (cross-origin deployment)
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");
    if (sessionFromUrl) {
      localStorage.setItem("coread_session", sessionFromUrl);
      // Clean the token out of the URL without triggering a reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

    client
      .get("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await client.post("/api/auth/logout").catch(() => {});
    localStorage.removeItem("coread_session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
