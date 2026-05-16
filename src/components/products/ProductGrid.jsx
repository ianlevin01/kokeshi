// components/products/ProductGrid.jsx
import ProductCard from "./ProductCard";
import { PackageSearch } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton-line" style={{ width: "55%" }} />
        <div className="skeleton-line" style={{ width: "40%", marginTop: 4 }} />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, onNeedLogin }) {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <PackageSearch size={48} strokeWidth={1} />
        <p>No se encontraron productos con esos filtros.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          onNeedLogin={onNeedLogin}
          style={{ '--card-delay': `${Math.min(i, 15) * 0.045}s` }}
        />
      ))}
    </div>
  );
}
