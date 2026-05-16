// components/products/FilterBar.jsx
import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronDown, Tag, ArrowUpDown } from "lucide-react";

const MAX_PRICE = 50000;

export const SORT_OPTIONS = [
  { value: "default",    label: "Relevancia" },
  { value: "price_asc",  label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "name_asc",   label: "Nombre A→Z" },
  { value: "name_desc",  label: "Nombre Z→A" },
];

export default function FilterBar({ filters, setFilters, categories = [] }) {
  const [catOpen,  setCatOpen]  = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const catRef  = useRef(null);
  const sortRef = useRef(null);

  const selectedCatName = filters.categoryId === null
    ? "Todas las categorías"
    : (categories.find((c) => c.id === filters.categoryId)?.name ?? "Categoría");

  const selectedSortLabel = SORT_OPTIONS.find((o) => o.value === (filters.sort ?? "default"))?.label ?? "Relevancia";

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current  && !catRef.current.contains(e.target))  setCatOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCat = (id) => {
    setFilters((f) => ({ ...f, categoryId: id }));
    setCatOpen(false);
  };

  const selectSort = (value) => {
    setFilters((f) => ({ ...f, sort: value }));
    setSortOpen(false);
  };

  return (
    <div className="filterbar">
      <div className="filter-row">

        {/* ── Buscador ── */}
        <div className="search-wrap search-wrap--row">
          <Search size={18} className="search-icon" />
          <input
            className="search-input"
            placeholder="Buscar productos..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* ── Dropdown categorías ── */}
        <div className="cat-dropdown" ref={catRef}>
          <button
            className={`cat-trigger ${catOpen ? "open" : ""} ${filters.categoryId !== null ? "has-value" : ""}`}
            onClick={() => setCatOpen((o) => !o)}
          >
            <Tag size={15} />
            <span className="cat-trigger-label">{selectedCatName}</span>
            <ChevronDown size={15} className="cat-chevron" />
          </button>

          {catOpen && (
            <div className="cat-menu">
              <button
                className={`cat-option ${filters.categoryId === null ? "active" : ""}`}
                onClick={() => selectCat(null)}
              >
                Todas las categorías
              </button>
              <div className="cat-menu-divider" />
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-option ${filters.categoryId === cat.id ? "active" : ""}`}
                  onClick={() => selectCat(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Dropdown ordenamiento ── */}
        <div className="cat-dropdown" ref={sortRef}>
          <button
            className={`cat-trigger ${sortOpen ? "open" : ""} ${(filters.sort && filters.sort !== "default") ? "has-value" : ""}`}
            onClick={() => setSortOpen((o) => !o)}
          >
            <ArrowUpDown size={15} />
            <span className="cat-trigger-label">{selectedSortLabel}</span>
            <ChevronDown size={15} className="cat-chevron" />
          </button>

          {sortOpen && (
            <div className="cat-menu">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`cat-option ${(filters.sort ?? "default") === opt.value ? "active" : ""}`}
                  onClick={() => selectSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Precio ── */}
        <div className="price-filter">
          <SlidersHorizontal size={16} />
          <span className="price-label">
            {filters.maxPrice >= MAX_PRICE
              ? "Todos los precios"
              : `Hasta $${filters.maxPrice.toLocaleString("es-AR")}`}
          </span>
          <input
            type="range"
            min={500}
            max={MAX_PRICE}
            step={500}
            value={Math.min(filters.maxPrice, MAX_PRICE)}
            onChange={(e) => {
              const val = Number(e.target.value);
              setFilters((f) => ({ ...f, maxPrice: val >= MAX_PRICE ? Infinity : val }));
            }}
            className="price-range"
          />
        </div>

      </div>
    </div>
  );
}
