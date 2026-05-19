// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);       // { id, email, name }
  const [token, setToken]       = useState(null);
  const [favorites, setFavorites] = useState(new Set()); // Set de product_id
  const [loading, setLoading]   = useState(true);        // cargando sesión guardada

  // ── Rehydrate desde localStorage ─────────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem("shop_token");
    const storedUser  = localStorage.getItem("shop_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("shop_token");
        localStorage.removeItem("shop_user");
      }
    }
    setLoading(false);
  }, []);

  // ── Cargar favoritos cuando hay usuario ──────────────────────────────────
  useEffect(() => {
    if (!token) { setFavorites(new Set()); return; }
    fetch(`${API_URL}/api/shop/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((ids) => setFavorites(new Set(ids)))
      .catch(() => {});
  }, [token]);

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const persistSession = (token, user) => {
    localStorage.setItem("shop_token", token);
    localStorage.setItem("shop_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const register = async (email, password, name, extraData = {}) => {
    const res = await fetch(`${API_URL}/api/shop/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, ...extraData }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Error al registrarse");
    persistSession(data.token, data.user);
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/shop/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Error al iniciar sesión");
    persistSession(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem("shop_token");
    localStorage.removeItem("shop_user");
    setToken(null);
    setUser(null);
    setFavorites(new Set());
  };

  // ── Favoritos ──────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (productId) => {
    if (!token) return false; // indica que debe loguearse
    const isFav = favorites.has(productId);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(productId) : next.add(productId);
      return next;
    });

    try {
      await fetch(`${API_URL}/api/shop/favorites/${productId}`, {
        method: isFav ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Rollback
      setFavorites((prev) => {
        const next = new Set(prev);
        isFav ? next.add(productId) : next.delete(productId);
        return next;
      });
    }
    return true;
  }, [token, favorites]);

  // ── Pedidos ───────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!token) return [];
    const res = await fetch(`${API_URL}/api/shop/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      favorites,
      register, login, logout,
      toggleFavorite,
      fetchOrders,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
