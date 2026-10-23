import { useState, createContext, useContext } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (product, qty = 1, price = null) => {
    const unitPrice = price ?? product.price;
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: unitPrice,
        qty
      }];
    });
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeItem(productId);
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
