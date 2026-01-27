"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

type CartState = {
  restaurantId: string | null;
  items: Record<string, number>; // key = `${restaurantId}:${itemId}`
};

type Action =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "CLEAR" }
  | { type: "ADD"; restaurantId: string; itemId: string; qty: number }
  | { type: "REMOVE"; restaurantId: string; itemId: string; qty: number };

const STORAGE_KEY = "bb_client_cart_v1";

const initialState: CartState = { restaurantId: null, items: {} };

function keyOf(restaurantId: string, itemId: string) {
  return `${restaurantId}:${itemId}`;
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload ?? initialState;

    case "CLEAR":
      return initialState;

    case "ADD": {
      const { restaurantId, itemId, qty } = action;

      // 1 carrito = 1 restaurante (si cambias, se resetea)
      const base =
        state.restaurantId && state.restaurantId !== restaurantId
          ? { restaurantId, items: {} as Record<string, number> }
          : { ...state, restaurantId };

      const k = keyOf(restaurantId, itemId);
      const next = Math.max(0, (base.items[k] ?? 0) + qty);

      return {
        restaurantId: base.restaurantId,
        items: { ...base.items, [k]: next },
      };
    }

    case "REMOVE": {
      const { restaurantId, itemId, qty } = action;
      if (state.restaurantId !== restaurantId) return state;

      const k = keyOf(restaurantId, itemId);
      const next = Math.max(0, (state.items[k] ?? 0) - qty);

      return { ...state, items: { ...state.items, [k]: next } };
    }

    default:
      return state;
  }
}

type CartApi = {
  restaurantId: string | null;
  items: Record<string, number>;
  count: number;
  getQty: (restaurantId: string, itemId: string) => number;
  add: (restaurantId: string, itemId: string, qty?: number) => void;
  remove: (restaurantId: string, itemId: string, qty?: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartState;
      if (parsed && typeof parsed === "object" && parsed.items) {
        dispatch({
          type: "HYDRATE",
          payload: {
            restaurantId: parsed.restaurantId ?? null,
            items: parsed.items ?? {},
          },
        });
      }
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const count = useMemo(
    () => Object.values(state.items).reduce((a, n) => a + (n || 0), 0),
    [state.items],
  );

  const api: CartApi = useMemo(
    () => ({
      restaurantId: state.restaurantId,
      items: state.items,
      count,
      getQty: (restaurantId: string, itemId: string) =>
        state.items[keyOf(restaurantId, itemId)] ?? 0,
      add: (restaurantId: string, itemId: string, qty: number = 1) =>
        dispatch({ type: "ADD", restaurantId, itemId, qty }),
      remove: (restaurantId: string, itemId: string, qty: number = 1) =>
        dispatch({ type: "REMOVE", restaurantId, itemId, qty }),
      clear: () => dispatch({ type: "CLEAR" }),
    }),
    [state.restaurantId, state.items, count],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
