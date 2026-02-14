"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = {
  id: string;
  title: string;
  restaurant: string;
  restaurantId?: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  restaurant: string | null;
  totalCents: number;
  totalItems: number;
  addItem: (item: Omit<CartItem, "quantity">) => "added" | "conflict";
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  replaceWithItem: (item: Omit<CartItem, "quantity">) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const restaurant = items.length > 0 ? items[0].restaurant : null;

  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">): "added" | "conflict" => {
      // Si hay items de otro restaurante → conflicto
      if (items.length > 0 && items[0].restaurant !== item.restaurant) {
        return "conflict";
      }

      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });

      return "added";
    },
    [items]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const replaceWithItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems([{ ...item, quantity: 1 }]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurant,
        totalCents,
        totalItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        replaceWithItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
