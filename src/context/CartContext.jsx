import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem("fidus_cart");
    return stored ? JSON.parse(stored) : [];
  });

  // Increments on every add — the navbar cart icon keys its bob animation off it
  const [bump, setBump] = useState(0);

  useEffect(() => {
    localStorage.setItem("fidus_cart", JSON.stringify(items));
  }, [items]);

  function addToCart(product, quantity = 1) {
    setBump((b) => b + 1);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url || null,
        stock: product.stock ?? null,
        quantity,
      }];
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: i.stock != null ? Math.min(quantity, i.stock) : quantity }
          : i
      )
    );
  }

  function removeFromCart(productId) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, bump }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
