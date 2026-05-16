// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/layout/Header";
import CartDrawer from "./components/cart/CartDrawer";
import ChatBot from "./components/layout/ChatBot";
import ShopPage from "./pages/ShopPage";
import CheckoutPage from "./pages/CheckoutPage";
import FavoritesPage from "./pages/FavoritesPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Header />
          <CartDrawer />
          <Routes>
            <Route path="/"          element={<ShopPage />} />
            <Route path="/checkout"  element={<CheckoutPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
          </Routes>
          <ChatBot />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
