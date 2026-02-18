"use client";

import Link from "next/link";
import { useCart } from "../_state/cart";

function CartIcon({ className = "" }: { className?: string }) {
  // Icono carrito (SVG inline, sin dependencias)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.6L4.3 3.5A1.5 1.5 0 0 0 2.8 2.3H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function CartPill() {
  const { count } = useCart();

  return (
    <Link
      href="/checkout"
      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      title="Ver carrito"
      aria-label={count > 0 ? `Carrito, ${count} artículos` : "Carrito"}
    >
      <CartIcon className="h-4 w-4" />
      <span>Carrito</span>

      {count > 0 ? (
        <span className="ml-1 inline-flex min-w-[22px] justify-center rounded-full bg-white px-2 py-0.5 text-xs font-black text-zinc-900">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
