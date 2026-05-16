// components/orders/OrdersDrawer.jsx
import { useState, useEffect } from "react";
import { X, Package, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, Wrench } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const STATUS_CONFIG = {
  pending:        { label: "Pendiente",       icon: Clock,        color: "#f59e0b" },
  en_preparacion: { label: "En preparación",  icon: Wrench,       color: "#8b5cf6" },
  confirmed:      { label: "Confirmado",      icon: CheckCircle,  color: "#059669" },
  completed:      { label: "Completado",      icon: CheckCircle,  color: "#059669" },
  cancelled:      { label: "Cancelado",       icon: AlertCircle,  color: "#ef4444" },
};

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="order-row">
      <button className="order-row-header" onClick={() => setOpen((v) => !v)}>
        <div className="order-row-left">
          <span className="order-id">#{order.id.slice(-6).toUpperCase()}</span>
          <span className="order-date">
            {new Date(order.created_at).toLocaleDateString("es-AR", {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </span>
        </div>
        <div className="order-row-right">
          <span className="order-status-chip" style={{ "--chip-color": cfg.color }}>
            <StatusIcon size={12} />
            {cfg.label}
          </span>
          <span className="order-total">
            ${Number(order.total ?? 0).toLocaleString("es-AR")}
          </span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="order-items-list">
          {(order.items ?? []).map((item, i) => (
            <div key={i} className="order-item">
              {item.image ? (
                <img src={item.image} alt={item.name} className="order-item-img" />
              ) : (
                <div className="order-item-img order-item-img--placeholder">
                  <Package size={16} />
                </div>
              )}
              <div className="order-item-info">
                <span className="order-item-name">{item.name}</span>
                <span className="order-item-qty">x{item.quantity}</span>
              </div>
              <span className="order-item-price">
                ${Number(item.unit_price * item.quantity).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersDrawer({ isOpen, onClose }) {
  const { fetchOrders, isLoggedIn } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !isLoggedIn) return;
    setLoading(true);
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [isOpen, isLoggedIn]);

  return (
    <>
      <div
        className={`cart-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`cart-drawer ${isOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <div className="cart-title">
            <Package size={20} />
            <span>Mis Pedidos</span>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {loading ? (
            <div className="orders-loading">
              <div className="orders-spinner" />
              <p>Cargando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="cart-empty">
              <Package size={48} strokeWidth={1} />
              <p>Todavía no tenés pedidos</p>
              <span>Tus compras anteriores aparecerán acá</span>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
