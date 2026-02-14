"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../_state/cart";

type Props = {
  menuId: string;
  title: string;
  restaurant: string;
  type?: string;
  description?: string;
  priceCents: number;
  imageUrl?: string | null;
  priceLabel: string;
};

export default function AddToCartButton({ menuId, title, restaurant, type, description, priceCents, imageUrl, priceLabel }: Props) {
  const { addOffer, setQty, restaurantId, getQty, clear } = useCart();
  const [showConflict, setShowConflict] = useState(false);
  const router = useRouter();
  const qty = getQty("", menuId);

  const offerData = {
    menuId,
    title,
    restaurant,
    type,
    description,
    priceCents,
    currency: "EUR",
    imageUrl,
  };

  function doAdd() {
    addOffer(offerData);
  }

  function handleAdd() {
    if (restaurantId && restaurantId !== restaurant) {
      setShowConflict(true);
      return;
    }
    doAdd();
  }

  function handleReplace() {
    clear();
    doAdd();
    setShowConflict(false);
  }

  return (
    <>
      {qty === 0 ? (
        <button
          onClick={handleAdd}
          className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
        >
          Añadir al carrito — {priceLabel}
        </button>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-xl bg-white border border-emerald-200 p-2">
            <button
              onClick={() => setQty(menuId, qty - 1)}
              className="h-10 w-10 rounded-lg bg-slate-100 grid place-items-center text-slate-700 hover:bg-slate-200 transition font-bold text-lg"
            >
              -
            </button>
            <div className="text-center">
              <span className="text-lg font-extrabold text-slate-900">{qty}</span>
              <p className="text-[11px] text-slate-400">en el carrito</p>
            </div>
            <button
              onClick={handleAdd}
              className="h-10 w-10 rounded-lg bg-emerald-100 grid place-items-center text-emerald-700 hover:bg-emerald-200 transition font-bold text-lg"
            >
              +
            </button>
          </div>
          <button
            onClick={() => router.push("/cart")}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
          >
            Ver carrito — {((priceCents * qty) / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </button>
        </div>
      )}

      {showConflict && (
        <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center px-4" onClick={() => setShowConflict(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-extrabold text-slate-900">¿Cambiar de restaurante?</p>
            <p className="mt-2 text-sm text-slate-500">
              Ya tienes ofertas de <strong>{restaurantId}</strong>. Si añades de <strong>{restaurant}</strong> se vaciará el carrito.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowConflict(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleReplace} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
                Vaciar y añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
