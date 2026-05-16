// components/checkout/CheckoutForm.jsx
import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ArrowLeft, Plus, Minus, Trash2,
  User, LogIn, X, UserPlus
} from "lucide-react";
import AuthModal from "../auth/AuthModal";

const API_URL    = import.meta.env.VITE_API_URL ?? "https://oncepuntos.duckdns.org";
const NEGOCIO_ID = "2bfbe8c6-38dd-47d0-bb43-81e71f2a8193";
const DELIVERY_OPTIONS = ["Retiro del local", "Recibe del transporte"];
const PLACEHOLDER = "https://placehold.co/400x400?text=Sin+imagen";

// ── Mini editor de ítem del carrito ──────────────────────────────────────────
function CheckoutCartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  return (
    <div className="co-cart-item">
      <img
        src={item.image ?? PLACEHOLDER}
        alt={item.name}
        className="co-cart-item-img"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
      />
      <div className="co-cart-item-info">
        <p className="co-cart-item-name">{item.name}</p>
        <span className="co-cart-item-unit">${item.price.toLocaleString("es-AR")} c/u</span>
      </div>
      <div className="co-cart-item-controls">
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          aria-label="Restar"
        >
          <Minus size={13} />
        </button>
        <span className="qty-value">{item.quantity}</span>
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          aria-label="Sumar"
        >
          <Plus size={13} />
        </button>
      </div>
      <span className="co-cart-item-price">
        ${(item.price * item.quantity).toLocaleString("es-AR")}
      </span>
      <button
        className="co-cart-item-remove"
        onClick={() => removeFromCart(item.id)}
        aria-label="Eliminar"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ── Banner "¿Querés registrarte?" ─────────────────────────────────────────────
function RegisterPrompt({ onRegister, onDismiss }) {
  return (
    <div className="register-prompt">
      <button className="register-prompt-close" onClick={onDismiss} aria-label="Cerrar">
        <X size={14} />
      </button>
      <div className="register-prompt-icon">
        <UserPlus size={22} />
      </div>
      <div className="register-prompt-text">
        <p className="register-prompt-title">¿Querés guardar tus pedidos?</p>
        <p className="register-prompt-sub">
          Registrate o iniciá sesión para ver tu historial de compras y agilizar tus próximos pedidos.
        </p>
      </div>
      <div className="register-prompt-actions">
        <button className="register-prompt-btn register-prompt-btn--primary" onClick={onRegister}>
          <LogIn size={15} /> Ingresar / Registrarse
        </button>
        <button className="register-prompt-btn register-prompt-btn--ghost" onClick={onDismiss}>
          Continuar sin cuenta
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CheckoutForm() {
  const { cartItems, total, clearCart } = useCart();
  const { user, isLoggedIn, token }     = useAuth();
  const navigate = useNavigate();

  const [step, setStep]     = useState("form"); // "form" | "success"
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  // Estado del prompt de registro (null = no resuelto, false = descartado, true = abriendo modal)
  const [promptState, setPromptState] = useState(null); // null | "shown" | "dismissed"
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [form, setForm] = useState({
    delivery:     DELIVERY_OPTIONS[0],
    observations: "",
    // Solo para guests
    fullName:     "",
    locality:     "",
    email:        "",
    whatsapp:     "",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Cuándo mostrar el prompt: usuario no logueado y todavía no lo vio/descartó
  const showPrompt = !isLoggedIn && promptState === null;

  const handleSubmit = async () => {
    // Si todavía no tomó decisión sobre el registro, mostrar prompt primero
    if (!isLoggedIn && promptState === null) {
      setPromptState("shown");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = {
        negocio_id: NEGOCIO_ID,
        items: cartItems.map((item) => ({
          product_id: item.id,
          name:       item.name,
          code:       item.code || null,
          quantity:   item.quantity,
          unit_price: item.price,
        })),
        observaciones: [
          form.observations,
          form.delivery !== DELIVERY_OPTIONS[0] ? `Entrega: ${form.delivery}` : null,
        ].filter(Boolean).join(" | ") || null,
      };

      // Headers base
      const headers = { "Content-Type": "application/json" };

      if (isLoggedIn && token) {
        // Usuario logueado: mandamos el JWT, el backend asocia por email
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        // Guest: mandamos los datos del formulario
        body.customer_name  = form.fullName.trim();
        body.customer_email = form.email.trim();
        body.customer_phone = form.whatsapp.trim();
        body.customer_locality = form.locality.trim();
      }

      const res = await fetch(`${API_URL}/api/web-orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al enviar el pedido");
      }

      clearCart();
      setStep("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="checkout-success">
        <CheckCircle2 size={64} strokeWidth={1.5} />
        <h2>¡Pedido enviado!</h2>
        <p>Te contactaremos pronto por WhatsApp para confirmar tu pedido.</p>
        {isLoggedIn && (
          <p style={{ fontSize: 14, color: "var(--ink-muted)", marginTop: -12, marginBottom: 24 }}>
            Podés ver este pedido en <strong>Mis pedidos</strong> desde el menú de tu cuenta.
          </p>
        )}
        <button className="back-shop-btn" onClick={() => navigate("/")}>
          Seguir comprando
        </button>
      </div>
    );
  }

  // Validación del botón según contexto
  const guestValid = form.fullName.trim() && form.email.trim() && form.whatsapp.trim();
  const canSubmit  = !loading && cartItems.length > 0 && (isLoggedIn || guestValid || promptState === null);

  return (
    <div className="checkout-page">

      {/* ── Columna izquierda ─────────────────────────────────────────────── */}
      <div className="checkout-left">
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Volver a la tienda
        </button>
        <h2 className="checkout-title">Finalizá tu pedido</h2>

        {/* ── Caso A: usuario logueado ── */}
        {isLoggedIn ? (
          <>
            <div className="logged-user-banner">
              <div className="logged-user-avatar">
                {(user.name ?? user.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="logged-user-name">{user.name ?? user.email.split("@")[0]}</p>
                <span className="logged-user-email">{user.email}</span>
              </div>
            </div>

            {/* Carrito editable */}
            <div className="co-cart-section">
              <h3 className="co-cart-title">Productos en tu pedido</h3>
              {cartItems.length === 0 ? (
                <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>Tu carrito está vacío.</p>
              ) : (
                <div className="co-cart-list">
                  {cartItems.map((item) => (
                    <CheckoutCartItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones y entrega */}
            <div className="checkout-form">
              <div className="form-group">
                <label>Modalidad de entrega</label>
                <div className="delivery-options">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`delivery-option ${form.delivery === opt ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value={opt}
                        checked={form.delivery === opt}
                        onChange={handleChange}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  name="observations"
                  value={form.observations}
                  onChange={handleChange}
                  placeholder="Aclaraciones especiales, horarios, etc."
                  rows={3}
                />
              </div>
            </div>
          </>
        ) : (
          /* ── Caso B: usuario no logueado ── */
          <>
            {/* Prompt de registro (se muestra antes de que tome la decisión) */}
            {promptState === null && (
              <RegisterPrompt
                onRegister={() => { setShowAuthModal(true); }}
                onDismiss={() => setPromptState("dismissed")}
              />
            )}

            {/* Formulario guest (solo visible si descartó el prompt) */}
            {promptState === "dismissed" && (
              <div className="checkout-form">
                <p className="checkout-subtitle">Completá tus datos para confirmar</p>

                <div className="form-group">
                  <label>Apellido y Nombres <span className="label-hint">*</span></label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="form-group">
                  <label>Localidad</label>
                  <input
                    name="locality"
                    value={form.locality}
                    onChange={handleChange}
                    placeholder="Ciudad / Barrio"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Correo electrónico <span className="label-hint">*</span></label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>N° de WhatsApp <span className="label-hint">*</span></label>
                    <input
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      placeholder="+54 9 11 ..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Modalidad de entrega</label>
                  <div className="delivery-options">
                    {DELIVERY_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className={`delivery-option ${form.delivery === opt ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={opt}
                          checked={form.delivery === opt}
                          onChange={handleChange}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    name="observations"
                    value={form.observations}
                    onChange={handleChange}
                    placeholder="Aclaraciones especiales, horarios, etc."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="checkout-error-banner">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Resumen del pedido (columna derecha) ────────────────────────── */}
      <div className="checkout-right">
        <div className="order-summary">
          <h3>Resumen del pedido</h3>
          <div className="summary-items">
            {cartItems.map((item) => (
              <div key={item.id} className="summary-item">
                <img
                  src={item.image ?? PLACEHOLDER}
                  alt={item.name}
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />
                <div className="summary-item-info">
                  <p>{item.name}</p>
                  <span>x{item.quantity}</span>
                </div>
                <span className="summary-item-price">
                  ${(item.price * item.quantity).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>${total.toLocaleString("es-AR")}</strong>
          </div>
          <button
            className="submit-order-btn"
            onClick={handleSubmit}
            disabled={!loading && cartItems.length === 0}
          >
            {loading
              ? "Enviando..."
              : promptState === null && !isLoggedIn
                ? "Continuar"
                : "Enviar pedido"}
          </button>
          <p className="submit-hint">Te contactaremos para confirmar</p>
        </div>
      </div>

      {/* Modal de auth que se abre desde el prompt */}
      {showAuthModal && (
        <AuthModal
          onClose={() => {
            setShowAuthModal(false);
            // Si después de cerrar el modal ya está logueado, el prompt desaparece solo.
            // Si cerró sin loguearse, dejamos el prompt visible para que decida.
          }}
        />
      )}
    </div>
  );
}
