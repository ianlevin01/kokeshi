import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";

const API_URL    = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function renderMarkdown(text) {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, "<br>");
  return html;
}
const NEGOCIO_ID = "2bfbe8c6-38dd-47d0-bb43-81e71f2a8193";
const PLACEHOLDER = "https://placehold.co/42x42?text=img";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "¡Hola! Soy el asistente de Kokeshi Toys 🛍️ ¿En qué te puedo ayudar hoy?",
      products: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", text: input, products: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:    userMsg.text,
          negocio_id: NEGOCIO_ID,
          base_url:   window.location.origin,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role:     "bot",
          text:     data.reply ?? "Hubo un error al procesar la respuesta.",
          products: data.products ?? [],
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Hubo un error al conectar con el servidor 😢", products: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {showTooltip && !isOpen && (
        <div className="chat-tooltip">
          <Sparkles size={14} />
          Chateá con nuestro bot con IA para cualquier consulta
        </div>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <Bot size={18} />
              </div>
              <div>
                <p className="chat-name">Asistente IA</p>
                <p className="chat-status">
                  <span className="status-dot" /> En línea
                </p>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.role === "bot" && (
                  <div className="msg-avatar">
                    <Bot size={12} />
                  </div>
                )}
                <div>
                  <div
                    className="msg-bubble"
                    {...(msg.role === "bot"
                      ? { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.text) } }
                      : { children: msg.text }
                    )}
                  />
                  {msg.products?.length > 0 && (
                    <div className="chat-products">
                      {msg.products.map((p) => (
                        <a
                          key={p.id}
                          href={`/?buscar=${encodeURIComponent(p.name)}`}
                          className="chat-product-card"
                        >
                          <img
                            src={p.image_url || PLACEHOLDER}
                            alt={p.name}
                            className="chat-product-img"
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                          />
                          <span className="chat-product-name">{p.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="msg-avatar">
                  <Bot size={12} />
                </div>
                <div className="msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Escribí tu consulta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="chat-send" onClick={sendMessage} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        className="chat-fab"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
