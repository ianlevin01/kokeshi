// pages/FavoritesPage.jsx
import { useState, useEffect } from "react";
import { Heart, ShoppingBag, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/products/ProductCard";
import AuthModal from "../components/auth/AuthModal";

const API_URL    = import.meta.env.VITE_API_URL ?? "https://oncepuntos.duckdns.org";
const NEGOCIO_ID = "2bfbe8c6-38dd-47d0-bb43-81e71f2a8193";
const PLACEHOLDER = "https://placehold.co/400x400?text=Sin+imagen";

function normalizeProduct(p) {
  const prices  = p.prices ?? [];
  const price1  = prices.find((x) => x.price_type === "precio_1");
  const price   = parseFloat(price1?.price ?? prices[0]?.price ?? 0);
  const stockArr = p.stock ?? [];
  const stock   = stockArr.length === 0
    ? 99
    : stockArr.reduce((acc, s) => acc + (s.quantity ?? 0), 0);
  return {
    id:          p.id,
    name:        p.name,
    description: p.description ?? "",
    category:    p.category_name ?? "",
    images:      p.images ?? [],
    image:       p.images?.[0]?.url ?? null,
    price,
    stock,
  };
}

export default function FavoritesPage() {
  const { isLoggedIn, favorites, token } = useAuth();
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || favorites.size === 0) {
      setProducts([]);
      return;
    }

    setLoading(true);
    // Pedir los productos favoritos uno a uno (o en batch si tenés endpoint)
    const ids = [...favorites];
    Promise.all(
      ids.map((id) =>
        fetch(`${API_URL}/api/products/${id}?negocio_id=${NEGOCIO_ID}`)
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )
      .then((results) => setProducts(results.filter(Boolean).map(normalizeProduct)))
      .finally(() => setLoading(false));
  }, [isLoggedIn, favorites, token]);

  // ── No logueado ───────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <main className="favorites-main">
        <div className="favorites-header">
          <Heart size={28} className="favorites-header-icon" />
          <h1 className="favorites-title">Mis Favoritos</h1>
        </div>
        <div className="favorites-guest">
          <Heart size={52} strokeWidth={1} className="favorites-guest-icon" />
          <p className="favorites-guest-title">Iniciá sesión para ver tus favoritos</p>
          <p className="favorites-guest-sub">
            Guardá productos tocando el corazón y accedé a ellos desde cualquier dispositivo.
          </p>
          <button className="favorites-login-btn" onClick={() => setShowAuthModal(true)}>
            <LogIn size={16} /> Ingresar / Registrarse
          </button>
        </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </main>
    );
  }

  // ── Logueado sin favoritos ────────────────────────────────────────────────
  if (!loading && products.length === 0) {
    return (
      <main className="favorites-main">
        <div className="favorites-header">
          <Heart size={28} className="favorites-header-icon" />
          <h1 className="favorites-title">Mis Favoritos</h1>
        </div>
        <div className="favorites-guest">
          <Heart size={52} strokeWidth={1} className="favorites-guest-icon" />
          <p className="favorites-guest-title">Todavía no tenés favoritos</p>
          <p className="favorites-guest-sub">
            Tocá el corazón en cualquier producto para guardarlo acá.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="favorites-main">
      <div className="favorites-header">
        <Heart size={28} className="favorites-header-icon" fill="currentColor" />
        <h1 className="favorites-title">Mis Favoritos</h1>
        {!loading && (
          <span className="favorites-count">{products.length} producto{products.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {loading ? (
        <div className="favorites-loading">
          <div className="orders-spinner" />
          <p>Cargando favoritos...</p>
        </div>
      ) : (
        <div className="shop-content" style={{ paddingTop: 0 }}>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
