import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import CartItem from "./CartItem";
import { useNavigate } from "react-router-dom";

export default function CartDrawer() {
  const { cartItems, total, isCartOpen, setIsCartOpen, itemCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <>
      <div
        className={`cart-overlay ${isCartOpen ? "open" : ""}`}
        onClick={() => setIsCartOpen(false)}
      />
      <div className={`cart-drawer ${isCartOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <div className="cart-title">
            <ShoppingBag size={20} />
            <span>Mi Pedido</span>
            {itemCount > 0 && <span className="cart-count-badge">{itemCount}</span>}
          </div>
          <button className="drawer-close" onClick={() => setIsCartOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>Tu pedido está vacío</p>
              <span>Agregá productos para comenzar</span>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-total-row">
              <span>Total estimado</span>
              <span className="cart-total-amount">${total.toLocaleString()}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              Confirmar pedido
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
