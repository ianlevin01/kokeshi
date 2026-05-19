// components/checkout/CheckoutForm.jsx
import { useState, useEffect, useRef, Fragment } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ArrowLeft, ArrowRight, Check,
  Truck, MapPin, Store, Loader, LogIn,
  User, Edit2,
} from "lucide-react";
import AuthModal from "../auth/AuthModal";

const API_URL    = import.meta.env.VITE_API_URL ?? "https://oncepuntos.duckdns.org";
const NEGOCIO_ID = "2bfbe8c6-38dd-47d0-bb43-81e71f2a8193";
const PLACEHOLDER = "https://placehold.co/400x400?text=img";

const PROVINCES = [
  { code: "C", name: "CABA" },
  { code: "B", name: "Buenos Aires" },
  { code: "X", name: "Córdoba" },
  { code: "S", name: "Santa Fe" },
  { code: "M", name: "Mendoza" },
  { code: "T", name: "Tucumán" },
  { code: "A", name: "Salta" },
  { code: "E", name: "Entre Ríos" },
  { code: "N", name: "Misiones" },
  { code: "W", name: "Corrientes" },
  { code: "H", name: "Chaco" },
  { code: "K", name: "Catamarca" },
  { code: "F", name: "La Rioja" },
  { code: "J", name: "San Juan" },
  { code: "D", name: "San Luis" },
  { code: "L", name: "La Pampa" },
  { code: "G", name: "Santiago del Estero" },
  { code: "P", name: "Formosa" },
  { code: "Y", name: "Jujuy" },
  { code: "Q", name: "Neuquén" },
  { code: "R", name: "Río Negro" },
  { code: "U", name: "Chubut" },
  { code: "Z", name: "Santa Cruz" },
  { code: "V", name: "Tierra del Fuego" },
];

function extractCpDigits(cp) {
  const m = String(cp ?? "").match(/\d{4}/);
  return m ? parseInt(m[0]) : null;
}

function validateEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ── Barra de pasos ─────────────────────────────────────────────────────────
function StepBar({ current }) {
  const labels = ["Contacto", "Entrega", "Confirmar"];
  return (
    <div className="co-steps">
      {labels.map((label, i) => {
        const n    = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <Fragment key={n}>
            <div className={`co-step${active ? " active" : ""}${done ? " done" : ""}`}>
              <div className="co-step-circle">
                {done ? <Check size={12} strokeWidth={3} /> : n}
              </div>
              <span className="co-step-label">{label}</span>
            </div>
            {n < labels.length && <div className={`co-step-line${done ? " done" : ""}`} />}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function CheckoutForm() {
  const { cartItems, total, clearCart } = useCart();
  const { user, isLoggedIn, token }     = useAuth();
  const navigate = useNavigate();

  const [step, setStep]   = useState(isLoggedIn ? 2 : 1);
  const [done, setDone]   = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Paso 1 — Contacto (solo guest) ──────────────────────────────────────
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [contactErr, setContactErr] = useState({});

  const setC = (field) => (e) => setContact((c) => ({ ...c, [field]: e.target.value }));

  const validateContact = () => {
    const errs = {};
    if (contact.name.trim().length < 2)     errs.name  = "Ingresá tu nombre";
    if (!validateEmail(contact.email))       errs.email = "Email inválido";
    if (contact.phone.trim().length < 6)     errs.phone = "Teléfono inválido";
    setContactErr(errs);
    return Object.keys(errs).length === 0;
  };

  const goStep2 = () => {
    if (!isLoggedIn && !validateContact()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Paso 2 — Envío ──────────────────────────────────────────────────────
  const [shMethod, setShMethod] = useState("local");
  const [shForm, setShForm]     = useState({
    province: "C", postalCode: "", street: "",
    streetNumber: "", floorApt: "", city: "",
  });
  const [ratesData,      setRatesData]      = useState(null);
  const [selectedRate,   setSelectedRate]   = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [calcLoading,    setCalcLoading]    = useState(false);
  const [calcError,      setCalcError]      = useState(null);
  const [stepErr,        setStepErr]        = useState(null);
  const calcTimer = useRef(null);

  const setSh = (field) => (e) => setShForm((s) => ({ ...s, [field]: e.target.value }));

  const changeMethod = (m) => {
    setShMethod(m);
    setRatesData(null); setSelectedRate(null);
    setSelectedBranch(null); setCalcError(null); setStepErr(null);
  };

  const fetchRates = async (method, form) => {
    if (method === "local") return;
    const cp = form.postalCode.trim();
    if (cp.length < 4) return;

    setCalcLoading(true); setCalcError(null);
    setRatesData(null); setSelectedRate(null); setSelectedBranch(null);

    try {
      const [ratesRes, agenciesRes] = await Promise.all([
        fetch(`${API_URL}/api/correo/rates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postalCode: cp }),
        }),
        method === "branch"
          ? fetch(`${API_URL}/api/correo/agencies?province=${form.province}`)
          : Promise.resolve(null),
      ]);

      if (!ratesRes.ok) throw new Error((await ratesRes.json()).message || "Error al consultar tarifas");
      const rates = await ratesRes.json();
      let agencies = [];

      if (agenciesRes) {
        if (!agenciesRes.ok) throw new Error("Error al obtener sucursales");
        const all   = await agenciesRes.json();
        const cpNum = parseInt(cp);
        agencies = Array.isArray(all)
          ? all.filter((a) => {
              const n = extractCpDigits(a.location?.address?.postalCode);
              return n !== null && Math.abs(n - cpNum) <= 1;
            })
          : [];
      }

      setRatesData({ rates, agencies });
      const typeKey  = method === "home" ? "D" : "S";
      const matching = rates.filter((r) => r.deliveredType === typeKey);
      if (matching.length === 1) setSelectedRate(matching[0]);

    } catch (err) {
      setCalcError(err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  // Auto-fetch rates when postalCode or method/province changes (debounced)
  useEffect(() => {
    if (shMethod === "local") return;
    if (shForm.postalCode.trim().length < 4) {
      setRatesData(null); setSelectedRate(null); setSelectedBranch(null); setCalcError(null);
      return;
    }
    if (calcTimer.current) clearTimeout(calcTimer.current);
    calcTimer.current = setTimeout(() => fetchRates(shMethod, shForm), 700);
    return () => { if (calcTimer.current) clearTimeout(calcTimer.current); };
  }, [shForm.postalCode, shForm.province, shMethod]); // eslint-disable-line

  const shippingValid =
    shMethod === "local" ||
    (shMethod === "home"   && selectedRate !== null &&
      shForm.street.trim() && shForm.streetNumber.trim() && shForm.city.trim()) ||
    (shMethod === "branch" && selectedBranch !== null && selectedRate !== null);

  const goStep3 = () => {
    if (shMethod === "home") {
      if (!shForm.street.trim() || !shForm.streetNumber.trim() || !shForm.city.trim()) {
        setStepErr("Completá la dirección de entrega"); return;
      }
      if (!selectedRate) { setStepErr("Esperá a que carguen las tarifas y seleccioná una"); return; }
    }
    if (shMethod === "branch" && !selectedBranch) {
      setStepErr("Seleccioná una sucursal de Correo Argentino"); return;
    }
    setStepErr(null);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Paso 3 — Confirmación ───────────────────────────────────────────────
  const [observations, setObservations] = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  const shippingAmount = selectedRate ? Number(selectedRate.price) : 0;

  const shippingLabel = () => {
    if (shMethod === "local")  return "Retiro en local";
    if (shMethod === "home")   return `Domicilio: ${shForm.street} ${shForm.streetNumber}, ${shForm.city} (CP ${shForm.postalCode})`;
    if (shMethod === "branch") return `Sucursal: ${selectedBranch?.name} (${shForm.postalCode})`;
    return "";
  };

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError(null);
    try {
      let shippingPayload;
      if (shMethod === "local") {
        shippingPayload = { type: "local" };
      } else if (shMethod === "home") {
        shippingPayload = {
          type: "home",
          service_code: selectedRate.productType,
          service_name: selectedRate.productName,
          shipping_amount: selectedRate.price,
          postal_code: shForm.postalCode.trim(),
          province: shForm.province,
          street: shForm.street.trim(),
          street_number: shForm.streetNumber.trim(),
          floor_apt: shForm.floorApt.trim(),
          city: shForm.city.trim(),
        };
      } else {
        shippingPayload = {
          type: "branch",
          service_code: selectedRate?.productType ?? "CP",
          service_name: selectedRate?.productName ?? "Correo Argentino",
          shipping_amount: selectedRate?.price ?? 0,
          postal_code: shForm.postalCode.trim(),
          province: shForm.province,
          branch_id: selectedBranch.code,
          branch_name: selectedBranch.name,
        };
      }

      const body = {
        negocio_id: NEGOCIO_ID,
        items: cartItems.map((i) => ({
          product_id: i.id, name: i.name,
          code: i.code || null, quantity: i.quantity, unit_price: i.price,
        })),
        observaciones: observations.trim() || null,
        shipping: shippingPayload,
      };

      const headers = { "Content-Type": "application/json" };
      if (isLoggedIn && token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        body.customer_name  = contact.name.trim();
        body.customer_email = contact.email.trim();
        body.customer_phone = contact.phone.trim();
      }

      const res = await fetch(`${API_URL}/api/web-orders`, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).message || "Error al enviar el pedido");
      clearCart();
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pantalla de éxito ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="co-success">
        <div className="co-success-icon"><CheckCircle2 size={52} strokeWidth={1.5} /></div>
        <h2>¡Pedido enviado!</h2>
        <p>
          {shMethod === "local"  && "Coordinamos el retiro cuando esté listo."}
          {shMethod === "home"   && "Prepararemos tu pedido y lo enviaremos a tu domicilio."}
          {shMethod === "branch" && <>Lo enviaremos a la sucursal <strong>{selectedBranch?.name}</strong>.</>}
        </p>
        {isLoggedIn && (
          <p className="co-success-sub">
            Podés seguir tu pedido en <strong>Mis pedidos</strong>.
          </p>
        )}
        <button className="co-success-btn" onClick={() => navigate("/")}>
          Seguir comprando
        </button>
      </div>
    );
  }

  const dRates = ratesData?.rates?.filter((r) => r.deliveredType === "D") ?? [];
  const sRates = ratesData?.rates?.filter((r) => r.deliveredType === "S") ?? [];

  return (
    <div className="co-page">

      {/* ── Columna principal ─────────────────────────────────────────────── */}
      <div className="co-main">
        <button className="co-back" onClick={() => navigate("/")}>
          <ArrowLeft size={15} /> Volver a la tienda
        </button>

        <StepBar current={step} />

        {/* ══ PASO 1 — CONTACTO ══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="co-card">
            <h2 className="co-card-title">Tus datos</h2>

            <button className="co-login-hint" type="button" onClick={() => setShowAuthModal(true)}>
              <LogIn size={14} />
              ¿Tenés cuenta? Iniciá sesión para agilizar tu compra
            </button>

            <div className="co-field">
              <label>Nombre completo <span>*</span></label>
              <input
                value={contact.name} onChange={setC("name")}
                placeholder="Juan García"
                className={contactErr.name ? "err" : ""}
              />
              {contactErr.name && <span className="co-field-err">{contactErr.name}</span>}
            </div>

            <div className="co-row">
              <div className="co-field">
                <label>Email <span>*</span></label>
                <input
                  type="email" value={contact.email} onChange={setC("email")}
                  placeholder="tu@email.com"
                  className={contactErr.email ? "err" : ""}
                />
                {contactErr.email && <span className="co-field-err">{contactErr.email}</span>}
              </div>
              <div className="co-field">
                <label>WhatsApp <span>*</span></label>
                <input
                  type="tel" value={contact.phone} onChange={setC("phone")}
                  placeholder="+54 9 11 1234‑5678"
                  className={contactErr.phone ? "err" : ""}
                />
                {contactErr.phone && <span className="co-field-err">{contactErr.phone}</span>}
              </div>
            </div>

            <button className="co-next-btn" onClick={goStep2}>
              Continuar <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ══ PASO 2 — ENTREGA ════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="co-card">
            <h2 className="co-card-title">¿Cómo querés recibirlo?</h2>

            <div className="co-methods">
              {[
                { key: "local",  Icon: Store,  label: "Retiro en local",          sub: "Gratis" },
                { key: "home",   Icon: Truck,  label: "Envío a domicilio",         sub: "Correo Argentino" },
                { key: "branch", Icon: MapPin, label: "Retiro en sucursal Correo", sub: "Correo Argentino" },
              ].map(({ key, Icon, label, sub }) => (
                <button
                  key={key} type="button"
                  className={`co-method${shMethod === key ? " active" : ""}`}
                  onClick={() => changeMethod(key)}
                >
                  <div className="co-method-icon"><Icon size={20} /></div>
                  <div className="co-method-text">
                    <span className="co-method-label">{label}</span>
                    <span className="co-method-sub">{sub}</span>
                  </div>
                  <div className="co-method-check">
                    {shMethod === key && <Check size={14} strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>

            {/* ── Envío a domicilio ── */}
            {shMethod === "home" && (
              <div className="co-shipping-form">
                <div className="co-row">
                  <div className="co-field" style={{ flex: 2 }}>
                    <label>Calle <span>*</span></label>
                    <input value={shForm.street} onChange={setSh("street")} placeholder="Av. Corrientes" />
                  </div>
                  <div className="co-field co-field--sm">
                    <label>Número <span>*</span></label>
                    <input value={shForm.streetNumber} onChange={setSh("streetNumber")} placeholder="1234" />
                  </div>
                </div>
                <div className="co-row">
                  <div className="co-field">
                    <label>Piso / Dpto.</label>
                    <input value={shForm.floorApt} onChange={setSh("floorApt")} placeholder="3° B" />
                  </div>
                  <div className="co-field">
                    <label>Ciudad <span>*</span></label>
                    <input value={shForm.city} onChange={setSh("city")} placeholder="Buenos Aires" />
                  </div>
                </div>
                <div className="co-row">
                  <div className="co-field">
                    <label>Provincia</label>
                    <select value={shForm.province} onChange={setSh("province")}>
                      {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="co-field co-field--sm">
                    <label>Código postal <span>*</span></label>
                    <input value={shForm.postalCode} onChange={setSh("postalCode")} placeholder="1425" maxLength={8} />
                  </div>
                </div>

                {calcLoading && (
                  <p className="co-fetching"><Loader size={14} className="co-spin" /> Consultando tarifas...</p>
                )}
                {!calcLoading && calcError && <p className="co-calc-err">{calcError}</p>}
                {!calcLoading && ratesData && dRates.length === 0 && (
                  <p className="co-calc-err">No hay tarifas disponibles para ese código postal.</p>
                )}
                {dRates.length > 0 && (
                  <div className="co-rates">
                    <p className="co-rates-title">Seleccioná el servicio de envío</p>
                    {dRates.map((r) => (
                      <label
                        key={r.productType}
                        className={`co-rate${selectedRate?.productType === r.productType ? " selected" : ""}`}
                      >
                        <input type="radio" name="rate" checked={selectedRate?.productType === r.productType}
                          onChange={() => setSelectedRate(r)} />
                        <div className="co-rate-info">
                          <span className="co-rate-name">{r.productName}</span>
                          <span className="co-rate-days">{r.deliveryTimeMin}–{r.deliveryTimeMax} días hábiles</span>
                        </div>
                        <span className="co-rate-price">${Number(r.price).toLocaleString("es-AR")}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Retiro en sucursal ── */}
            {shMethod === "branch" && (
              <div className="co-shipping-form">
                <div className="co-row">
                  <div className="co-field">
                    <label>Provincia</label>
                    <select value={shForm.province} onChange={setSh("province")}>
                      {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="co-field co-field--sm">
                    <label>Código postal <span>*</span></label>
                    <input value={shForm.postalCode} onChange={setSh("postalCode")} placeholder="1425" maxLength={8} />
                  </div>
                </div>

                {calcLoading && (
                  <p className="co-fetching"><Loader size={14} className="co-spin" /> Buscando sucursales...</p>
                )}
                {!calcLoading && calcError && <p className="co-calc-err">{calcError}</p>}

                {!calcLoading && ratesData && (
                  <>
                    {sRates.length > 0 && (
                      <p className="co-rates-cost">
                        Costo de envío: <strong>${Number(sRates[0].price).toLocaleString("es-AR")}</strong>
                        <span> · {sRates[0].deliveryTimeMin}–{sRates[0].deliveryTimeMax} días hábiles</span>
                      </p>
                    )}
                    {ratesData.agencies.length === 0 ? (
                      <p className="co-calc-err">No encontramos sucursales cerca. Probá con otro código postal.</p>
                    ) : (
                      <div className="co-rates co-rates--scroll">
                        <p className="co-rates-title">Seleccioná una sucursal</p>
                        {ratesData.agencies.map((a) => (
                          <label
                            key={a.code}
                            className={`co-rate${selectedBranch?.code === a.code ? " selected" : ""}`}
                          >
                            <input type="radio" name="branch" checked={selectedBranch?.code === a.code}
                              onChange={() => { setSelectedBranch(a); setSelectedRate(sRates[0] ?? null); }} />
                            <div className="co-rate-info">
                              <span className="co-rate-name">{a.name}</span>
                              <span className="co-rate-days">
                                {a.location?.address?.streetName} {a.location?.address?.streetNumber}, {a.location?.address?.city}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {stepErr && <p className="co-calc-err">{stepErr}</p>}

            <div className="co-nav-row">
              {!isLoggedIn && (
                <button className="co-back-step" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} /> Volver
                </button>
              )}
              <button className="co-next-btn" onClick={goStep3}>
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ══ PASO 3 — CONFIRMAR ══════════════════════════════════════════ */}
        {step === 3 && (
          <div className="co-card">
            <h2 className="co-card-title">Confirmá tu pedido</h2>

            {/* Resumen contacto */}
            <div className="co-review-row">
              <User size={16} className="co-review-icon" />
              <div className="co-review-body">
                <span className="co-review-label">Contacto</span>
                <span className="co-review-value">
                  {isLoggedIn
                    ? `${user.name || user.email?.split("@")[0]} · ${user.email}`
                    : `${contact.name} · ${contact.email} · ${contact.phone}`}
                </span>
              </div>
              {!isLoggedIn && (
                <button className="co-review-edit" onClick={() => setStep(1)}>
                  <Edit2 size={13} />
                </button>
              )}
            </div>

            {/* Resumen envío */}
            <div className="co-review-row">
              {shMethod === "local"  && <Store  size={16} className="co-review-icon" />}
              {shMethod === "home"   && <Truck  size={16} className="co-review-icon" />}
              {shMethod === "branch" && <MapPin size={16} className="co-review-icon" />}
              <div className="co-review-body">
                <span className="co-review-label">Entrega</span>
                <span className="co-review-value">{shippingLabel()}</span>
                {selectedRate && shMethod !== "local" && (
                  <span className="co-review-sub">
                    {selectedRate.productName} · ${Number(selectedRate.price).toLocaleString("es-AR")}
                  </span>
                )}
              </div>
              <button className="co-review-edit" onClick={() => setStep(2)}>
                <Edit2 size={13} />
              </button>
            </div>

            {/* Observaciones */}
            <div className="co-field" style={{ marginTop: 8 }}>
              <label>Observaciones <span className="co-field-opt">(opcional)</span></label>
              <textarea
                value={observations} onChange={(e) => setObservations(e.target.value)}
                placeholder="Horario preferido, instrucciones de entrega, etc."
                rows={3}
              />
            </div>

            {submitError && <p className="co-calc-err">{submitError}</p>}

            <div className="co-nav-row">
              <button className="co-back-step" onClick={() => setStep(2)}>
                <ArrowLeft size={14} /> Volver
              </button>
              <button className="co-submit-btn" onClick={handleSubmit} disabled={submitting || cartItems.length === 0}>
                {submitting ? "Enviando..." : "Confirmar pedido"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel lateral: resumen ──────────────────────────────────────────── */}
      <aside className="co-sidebar">
        <h3 className="co-sidebar-title">Tu pedido</h3>
        <div className="co-sidebar-items">
          {cartItems.map((item) => (
            <div key={item.id} className="co-sidebar-item">
              <img
                src={item.image ?? PLACEHOLDER} alt={item.name}
                onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
              />
              <div className="co-sidebar-item-info">
                <span className="co-sidebar-item-name">{item.name}</span>
                <span className="co-sidebar-item-qty">× {item.quantity}</span>
              </div>
              <span className="co-sidebar-item-price">
                ${(item.price * item.quantity).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>

        <div className="co-sidebar-sep" />

        <div className="co-sidebar-row">
          <span>Subtotal</span>
          <span>${total.toLocaleString("es-AR")}</span>
        </div>
        {shippingAmount > 0 && (
          <div className="co-sidebar-row">
            <span>Envío</span>
            <span>${shippingAmount.toLocaleString("es-AR")}</span>
          </div>
        )}
        {shMethod !== "local" && shippingAmount === 0 && (
          <div className="co-sidebar-row co-sidebar-row--muted">
            <span>Envío</span>
            <span>a calcular</span>
          </div>
        )}

        <div className="co-sidebar-sep" />

        <div className="co-sidebar-total">
          <span>Total</span>
          <strong>${(total + shippingAmount).toLocaleString("es-AR")}</strong>
        </div>
      </aside>

      {showAuthModal && (
        <AuthModal onClose={() => {
          setShowAuthModal(false);
          if (isLoggedIn) setStep(2);
        }} />
      )}
    </div>
  );
}
