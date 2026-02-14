"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartFloat() {
  const { totalItems, totalCents } = useCart();

  if (totalItems === 0) return null;

  const total = (totalCents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <Link
      href="/cart"
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2.5 rounded-full bg-emerald-600 pl-4 pr-5 py-3 text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition hover:-translate-y-0.5 active:scale-95"
    >
      <div className="relative">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <span className="absolute -top-2 -right-2 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-extrabold text-emerald-700">
          {totalItems}
        </span>
      </div>
      <span className="text-sm font-bold">{total}</span>
    </Link>
  );
}
