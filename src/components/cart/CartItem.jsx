import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <img src={item.image} alt={item.name} className="cart-item-img" />
      <div className="cart-item-info">
        <p className="cart-item-name">{item.name}</p>
        <p className="cart-item-price">${(item.price * item.quantity).toLocaleString()}</p>
        <div className="cart-item-controls">
          <button className="qty-btn sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
            <Minus size={12} />
          </button>
          <span className="qty-value sm">{item.quantity}</span>
          <button className="qty-btn sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
            <Plus size={12} />
          </button>
          <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
