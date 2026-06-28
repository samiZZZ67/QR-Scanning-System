import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("hgh_cart") || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("hgh_cart", JSON.stringify(items));
  }, [items]);

  function addItem(item, qty = 1) {
    setItems((prev) => {
      const id = item.id || item._id;
      const idx = prev.findIndex((i) => i.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { ...item, id, qty }];
    });
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce(
    (s, i) => s + (Number(i.price) || 0) * i.qty,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
