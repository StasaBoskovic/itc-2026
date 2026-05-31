import { createContext, useContext, useEffect, useState } from "react";

import { api, authConfig } from "../api";

const AuthContext = createContext(null);

const TOKEN_KEY = "montrails_token";
const USER_KEY = "montrails_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function hydrateAuth() {
      if (!token) {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setBooting(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me", authConfig(token));
        setUser(data);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      } catch (_error) {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setBooting(false);
      }
    }

    hydrateAuth();
  }, [token]);

  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        booting,
        login,
        logout,
        register,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth mora biti unutar AuthProvider komponente.");
  }

  return context;
}

