// components/auth/AuthModal.jsx
import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, Phone, MapPin, Truck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL    = import.meta.env.VITE_API_URL ?? "https://oncepuntos.duckdns.org";
const NEGOCIO_ID = "2bfbe8c6-38dd-47d0-bb43-81e71f2a8193";

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]       = useState("");
  const [direccion, setDireccion] = useState("");
  const [transporte, setTransporte] = useState("");
  const [localidad, setLocalidad]   = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [transportes, setTransportes]   = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (mode === "register") {
      fetch(`${API_URL}/api/transportes?negocio_id=${NEGOCIO_ID}`)
        .then((r) => r.ok ? r.json() : [])
        .then(setTransportes)
        .catch(() => {});
    }
  }, [mode]);

  const isRegisterValid =
    !!email && !!password && !!phone && !!direccion;

  const submit = async () => {
    setError(null);
    if (mode === "register" && !isRegisterValid) {
      setError("Completá los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name, {
          phone,
          direccion,
          transporte,
          localidad: localidad || undefined,
          codigoPostal: codigoPostal || undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(null); }}
          >
            <LogIn size={15} /> Iniciar sesión
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(null); }}
          >
            <UserPlus size={15} /> Registrarse
          </button>
        </div>

        <div className="auth-body">
          <p className="auth-subtitle">
            {mode === "login"
              ? "Accedé a tus favoritos y pedidos anteriores."
              : "Creá tu cuenta para guardar favoritos y ver tus pedidos."}
          </p>

          {mode === "register" && (
            <div className="auth-field">
              <label className="auth-label">Nombre (opcional)</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input className="auth-input" type="text" placeholder="Tu nombre"
                  value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKey} />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input className="auth-input" type="email" placeholder="tu@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKey} autoFocus />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                className="auth-input auth-input--pass"
                type={showPass ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKey}
              />
              <button className="auth-eye-btn" type="button" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <>
              <div className="auth-field">
                <label className="auth-label">Teléfono / WhatsApp <span className="auth-required">*</span></label>
                <div className="auth-input-wrap">
                  <Phone size={16} className="auth-input-icon" />
                  <input className="auth-input" type="tel" placeholder="Ej: 3416123456"
                    value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={handleKey} />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Dirección <span className="auth-required">*</span></label>
                <div className="auth-input-wrap">
                  <MapPin size={16} className="auth-input-icon" />
                  <input className="auth-input" type="text" placeholder="Calle y número"
                    value={direccion} onChange={(e) => setDireccion(e.target.value)} onKeyDown={handleKey} />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Transporte <span className="auth-optional">(opcional)</span></label>
                <div className="auth-input-wrap">
                  <Truck size={16} className="auth-input-icon" />
                  <select className="auth-input auth-select" value={transporte} onChange={(e) => setTransporte(e.target.value)}>
                    <option value="">Seleccioná un transporte</option>
                    {transportes.map((t) => (
                      <option key={t.id} value={t.razon_social}>{t.razon_social}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="auth-row-2">
                <div className="auth-field">
                  <label className="auth-label">Localidad <span className="auth-optional">(opcional)</span></label>
                  <div className="auth-input-wrap">
                    <MapPin size={16} className="auth-input-icon" />
                    <input className="auth-input" type="text" placeholder="Tu localidad"
                      value={localidad} onChange={(e) => setLocalidad(e.target.value)} onKeyDown={handleKey} />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Código postal <span className="auth-optional">(opcional)</span></label>
                  <div className="auth-input-wrap">
                    <MapPin size={16} className="auth-input-icon" />
                    <input className="auth-input" type="text" placeholder="Ej: 2000"
                      value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} onKeyDown={handleKey} />
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button
            className="auth-submit-btn"
            onClick={submit}
            disabled={loading || !email || !password || (mode === "register" && !isRegisterValid)}
          >
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
