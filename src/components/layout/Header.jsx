// components/layout/Header.jsx
import { useState, useRef, useEffect } from "react";
import { ShoppingBag, LogOut, Package, Heart, ChevronDown, LogIn, MapPin } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AuthModal from "../auth/AuthModal";
import OrdersDrawer from "../orders/OrdersDrawer";

function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

export default function Header() {
  const { itemCount, setIsCartOpen } = useCart();
  const { user, isLoggedIn, logout, favorites } = useAuth();
  const navigate = useNavigate();

  const [showAuthModal,    setShowAuthModal]    = useState(false);
  const [showUserMenu,     setShowUserMenu]     = useState(false);
  const [showOrdersDrawer, setShowOrdersDrawer] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <span className="topbar-item">
            <MapPin size={14} />
            PERON 2263 | PASTEUR 280
          </span>
          <a className="topbar-item topbar-item--link" href="https://wa.me/541138385284" target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            1138385284
          </a>
        </div>
      </div>
      <header className="header">
        <div className="header-inner">
          <div className="logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <span className="logo-mark">●</span>
            <span className="logo-text">KOKESHI <strong>TOYS</strong></span>
          </div>

          <div className="header-actions">
            {isLoggedIn ? (
              <div className="user-menu-wrap" ref={menuRef}>
                <button
                  className="user-menu-btn"
                  onClick={() => setShowUserMenu((v) => !v)}
                >
                  <div className="user-avatar">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                  <span className="user-name-label">
                    {user.name || user.email?.split("@")[0] || "Usuario"}
                  </span>
                  <ChevronDown size={14} className={`user-chevron ${showUserMenu ? "open" : ""}`} />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-email">{user.email}</span>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item"
                      onClick={() => { navigate("/favoritos"); setShowUserMenu(false); }}
                    >
                      <Heart size={15} />
                      Mis favoritos
                      {favorites.size > 0 && (
                        <span className="user-dropdown-badge">{favorites.size}</span>
                      )}
                    </button>
                    <button
                      className="user-dropdown-item"
                      onClick={() => { setShowOrdersDrawer(true); setShowUserMenu(false); }}
                    >
                      <Package size={15} /> Mis pedidos
                    </button>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item user-dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowAuthModal(true)}>
                <LogIn size={16} />
                <span>Ingresar</span>
              </button>
            )}

            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag size={22} />
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              <span className="cart-label">Mi pedido</span>
            </button>
          </div>
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      <OrdersDrawer isOpen={showOrdersDrawer} onClose={() => setShowOrdersDrawer(false)} />
    </>
  );
}
