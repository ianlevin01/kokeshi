// pages/ShopPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronUp } from "lucide-react";
import FilterBar from "../components/products/FilterBar";
import ProductGrid from "../components/products/ProductGrid";
import AuthModal from "../components/auth/AuthModal";

const API_URL    = import.meta.env.VITE_API_URL ?? "https://oncepuntos.duckdns.org";
const NEGOCIO_ID = "2bfbe8c6-38dd-47d0-bb43-81e71f2a8193";
const PAGE_SIZE  = 60;
const MAX_PRICE  = 50000;


export default function ShopPage() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [offset, setOffset]       = useState(0);
  const [hasMore, setHasMore]     = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const contentRef = useRef(null);

  // { id, name }[]
  const [categories, setCategories] = useState([]);

  const initialSearch = new URLSearchParams(window.location.search).get("buscar") ?? "";

  const [filters, setFilters] = useState({
    search:     initialSearch,
    categoryId: null,
    maxPrice:   MAX_PRICE,
    sort:       "default",
  });

  useEffect(() => {
    const onScroll = () => setShowScrollBtn(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Cargar categorías ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/products/categories?negocio_id=${NEGOCIO_ID}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // ── Debounce búsqueda ─────────────────────────────────────────────────────
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [filters.search]);

  // ── Reset al cambiar categoría o búsqueda ────────────────────────────────
  const prevCatRef    = useRef(filters.categoryId);
  const prevSearchRef = useRef(debouncedSearch);
  const prevSortRef   = useRef(filters.sort);

  useEffect(() => {
    const catChanged    = filters.categoryId !== prevCatRef.current;
    const searchChanged = debouncedSearch    !== prevSearchRef.current;
    const sortChanged   = filters.sort       !== prevSortRef.current;
    prevCatRef.current    = filters.categoryId;
    prevSearchRef.current = debouncedSearch;
    prevSortRef.current   = filters.sort;

    if (catChanged || searchChanged || sortChanged) {
      setOffset(0);
      setProducts([]);
    }
  }, [filters.categoryId, debouncedSearch, filters.sort]);

  // ── Fetch principal ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    let url;
    if (debouncedSearch) {
      url = `${API_URL}/api/products/search?name=${encodeURIComponent(debouncedSearch)}&negocio_id=${NEGOCIO_ID}`;
    } else {
      const params = new URLSearchParams({ limit: PAGE_SIZE, offset, negocio_id: NEGOCIO_ID });
      if (filters.categoryId) params.set("category_id", filters.categoryId);
      if (filters.sort && filters.sort !== "default") params.set("sort", filters.sort);
      url = `${API_URL}/api/products?${params}`;
    }

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar productos");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const normalized = data.map(normalizeProduct).filter((p) => p.active !== false);
        if (debouncedSearch) {
          setProducts(normalized);
          setHasMore(false);
        } else {
          setProducts((prev) => offset === 0 ? normalized : [...prev, ...normalized]);
          setHasMore(data.length === PAGE_SIZE);
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedSearch, filters.categoryId, filters.sort, offset]);

  // ── Filtro local de precio (el ordenamiento ya viene del backend) ─────────
  const filtered = useMemo(() => {
    if (filters.maxPrice < MAX_PRICE) {
      return products.filter((p) => p.price <= filters.maxPrice);
    }
    return products;
  }, [products, filters.maxPrice]);

  return (
    <main className="shop-main">
      <div className="shop-hero">
        <img src="/banner.png" alt="Kokeshi Toys" className="hero-banner" />
      </div>

      <div className="shop-content" ref={contentRef}>
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          maxPrice={MAX_PRICE}
        />

        <div className="results-info">
          {loading && products.length === 0 ? (
            <span>Cargando productos...</span>
          ) : error ? (
            <span className="results-error">⚠ {error}</span>
          ) : (
            <span>{filtered.length} productos encontrados</span>
          )}
        </div>

        <ProductGrid
          products={filtered}
          loading={loading && products.length === 0}
          onNeedLogin={() => setShowAuthModal(true)}
        />

        {hasMore && !loading && !debouncedSearch && (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button
              className="btn-load-more"
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
            >
              Cargar más productos
            </button>
          </div>
        )}

        {loading && products.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "1rem", opacity: 0.5 }}>
            Cargando más...
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showScrollBtn && (
        <button
          className="scroll-top-btn"
          onClick={() => contentRef.current?.scrollIntoView({ behavior: "smooth" })}
          aria-label="Volver al inicio de productos"
        >
          <ChevronUp size={26} strokeWidth={2.5} />
        </button>
      )}
    </main>
  );
}

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
    code:        p.code ?? "",
    name:        p.name,
    description: p.description ?? "",
    category:    p.category_name ?? "",
    images:      p.images ?? [],
    image:       p.images?.[0]?.url ?? null,
    price,
    stock,
    active: p.active ?? true,
  };
}
