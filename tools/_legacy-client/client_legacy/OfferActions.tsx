"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../_state/cart";

type Props = {
  /**
   * MVP: usamos el nombre del restaurante como clave de carrito.
   * (Más adelante: restaurantId real desde API/DB)
   */
  restaurantKey: string;
  menuId: string;
};

export default function OfferActions({ restaurantKey, menuId }: Props) {
  const { restaurantId, count, getQty, add, remove, clear } = useCart();
  const qty = getQty(restaurantKey, menuId);

  const hasOtherRestaurant =
    !!restaurantId && restaurantId !== restaurantKey && count > 0;

  const [notice, setNotice] = useState<string | null>(null);

  function addOne() {
    if (hasOtherRestaurant) {
      clear();
      setNotice(
        "Carrito reiniciado: en el MVP solo puedes reservar de un restaurante a la vez.",
      );
    }
    add(restaurantKey, menuId, 1);
  }

  function removeOne() {
    remove(restaurantKey, menuId, 1);
  }

  function clearCart() {
    clear();
    setNotice("Carrito vaciado.");
  }

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [notice]);

  return (
    <div className="mt-8 space-y-3">
      {notice ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {notice}
        </div>
      ) : null}

      {qty > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              En carrito
            </span>

            <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={removeOne}
                className="px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                aria-label="Quitar 1"
              >
                −
              </button>

              <div className="min-w-[44px] px-3 py-2 text-center text-sm font-black text-slate-900">
                {qty}
              </div>

              <button
                type="button"
                onClick={addOne}
                className="px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                aria-label="Añadir 1"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/checkout"
              className="inline-flex justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ir al carrito
            </Link>

            <button
              type="button"
              onClick={clearCart}
              className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={addOne}
            className="inline-flex justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Añadir al carrito
          </button>

          <Link
            href="/checkout"
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Ver carrito
          </Link>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Nota MVP: el carrito es por restaurante. Si cambias de restaurante, se
        reinicia.
      </p>
    </div>
  );
}