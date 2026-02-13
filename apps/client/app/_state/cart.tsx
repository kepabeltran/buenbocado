"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "bb_client_cart_v1";

export type CartOfferSnapshot = {
  menuId: string;

  title: string;
  restaurant: string;
  type?: "TAKEAWAY" | "DINEIN" | string;
  description?: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;

  qty: number;
  addedAt: string; // ISO
};

type CartState = {
  items: Record<string, CartOfferSnapshot>; // key = menuId
  updatedAt: string; // ISO
};

const initialState: CartState = {
  items: {},
  updatedAt: new Date().toISOString(),
};

type Action =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "CLEAR" }
  | { type: "ADD_OFFER"; offer: Omit<CartOfferSnapshot, "qty" | "addedAt">; qty: number }
  | { type: "SET_QTY"; menuId: string; qty: number }
  | { type: "REMOVE"; menuId: string };

function isObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function normalizeHydrate(parsed: any): CartState {
  if (!isObject(parsed)) return initialState;

  const itemsRaw = parsed.items;
  if (!isObject(itemsRaw)) return initialState;

  // formato viejo: { items: { "rest:item": number } }
  const values = Object.values(itemsRaw);
  const looksOld = values.length > 0 && typeof values[0] === "number";
  if (looksOld) return initialState;

  const out: CartState = {
    items: {},
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
  };

  for (const [k, v] of Object.entries(itemsRaw)) {
    if (!isObject(v)) continue;

    const menuId = typeof v.menuId === "string" ? v.menuId : k;
    const title = typeof v.title === "string" ? v.title : "";
    const restaurant = typeof v.restaurant === "string" ? v.restaurant : "";
    const currency = typeof v.currency === "string" ? v.currency : "EUR";

    const priceCents = Number(v.priceCents);
    const qty = Number(v.qty);

    if (!menuId || !title || !restaurant) continue;
    if (!Number.isFinite(priceCents)) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;

    out.items[menuId] = {
      menuId,
      title,
      restaurant,
      type: typeof v.type === "string" ? v.type : undefined,
      description: typeof v.description === "string" ? v.description : undefined,
      priceCents,
      currency,
      imageUrl: typeof v.imageUrl === "string" ? v.imageUrl : null,
      qty,
      addedAt: typeof v.addedAt === "string" ? v.addedAt : new Date().toISOString(),
    };
  }

  return out;
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload ?? initialState;

    case "CLEAR":
      return { ...initialState, updatedAt: new Date().toISOString() };

    case "ADD_OFFER": {
      const { offer, qty } = action;
      const menuId = offer.menuId;
      if (!menuId) return state;

      const current = state.items[menuId];
      const nextQty = Math.max(1, (current?.qty ?? 0) + Math.max(1, qty));

      return {
        items: {
          ...state.items,
          [menuId]: {
            menuId,
            title: offer.title,
            restaurant: offer.restaurant,
            type: offer.type,
            description: offer.description,
            priceCents: offer.priceCents,
            currency: offer.currency,
            imageUrl: offer.imageUrl ?? null,
            qty: nextQty,
            addedAt: current?.addedAt ?? new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    }

    case "SET_QTY": {
      const { menuId, qty } = action;
      const item = state.items[menuId];
      if (!item) return state;

      const q = Math.floor(qty);
      if (!Number.isFinite(q) || q <= 0) {
        const next = { ...state.items };
        delete next[menuId];
        return { items: next, updatedAt: new Date().toISOString() };
      }

      return {
        items: { ...state.items, [menuId]: { ...item, qty: q } },
        updatedAt: new Date().toISOString(),
      };
    }

    case "REMOVE": {
      const next = { ...state.items };
      delete next[action.menuId];
      return { items: next, updatedAt: new Date().toISOString() };
    }

    default:
      return state;
  }
}

type CartApi = {
  // nueva
  items: Record<string, CartOfferSnapshot>;
  list: CartOfferSnapshot[];
  count: number;

  addOffer: (offer: Omit<CartOfferSnapshot, "qty" | "addedAt">, qty?: number) => void;
  setQty: (menuId: string, qty: number) => void;

  // legacy (para OfferActions.tsx)
  restaurantId: string | null;
  getQty: (restaurantKey: string, menuId: string) => number;
  add: (restaurantKey: string, menuId: string, qty?: number) => void;
  remove: (restaurantKey: string, menuId: string, qty?: number) => void;

  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

function loadInitialState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return normalizeHydrate(JSON.parse(raw));
  } catch {
    return initialState;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const list = useMemo(() => Object.values(state.items), [state.items]);

  const count = useMemo(() => list.reduce((acc, it) => acc + (it.qty || 0), 0), [list]);

  const restaurantId = useMemo(() => (list.length ? list[0].restaurant : null), [list]);

  const api = useMemo<CartApi>(() => {
    const getQty = (restaurantKey: string, menuId: string) => {
      const it = state.items[menuId];
      if (!it) return 0;
      if (restaurantKey && it.restaurant !== restaurantKey) return 0;
      return it.qty || 0;
    };

    const clear = () => dispatch({ type: "CLEAR" });

    const add = (restaurantKey: string, menuId: string, qty = 1) => {
      if (!menuId) return;

      // seguridad: si hay otro restaurante, limpiamos
      if (restaurantId && restaurantKey && restaurantId !== restaurantKey) {
        dispatch({ type: "CLEAR" });
      }

      const current = state.items[menuId];

      // Compat: OfferActions no pasa info; si existe ya, reutilizamos snapshot.
      // Si no existe, metemos placeholders (lo importante: que aparezca en el carrito).
      const offer: Omit<CartOfferSnapshot, "qty" | "addedAt"> = current
        ? {
            menuId,
            title: current.title,
            restaurant: current.restaurant,
            type: current.type,
            description: current.description,
            priceCents: current.priceCents,
            currency: current.currency,
            imageUrl: current.imageUrl ?? null,
          }
        : {
            menuId,
            title: "Oferta",
            restaurant: restaurantKey || "Restaurante",
            priceCents: 0,
            currency: "EUR",
            imageUrl: null,
          };

      dispatch({ type: "ADD_OFFER", offer, qty });
    };

    const remove = (restaurantKey: string, menuId: string, qty = 1) => {
      const it = state.items[menuId];
      if (!it) return;
      if (restaurantKey && it.restaurant !== restaurantKey) return;

      const nextQty = (it.qty || 0) - Math.max(1, qty);
      dispatch({ type: "SET_QTY", menuId, qty: nextQty });
    };

    return {
      items: state.items,
      list,
      count,

      addOffer: (offer, qty = 1) => dispatch({ type: "ADD_OFFER", offer, qty }),
      setQty: (menuId, qty) => dispatch({ type: "SET_QTY", menuId, qty }),

      restaurantId,
      getQty,
      add,
      remove,
      clear,
    };
  }, [state.items, list, count, restaurantId]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}