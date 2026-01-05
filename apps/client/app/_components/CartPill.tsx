"use client";

import Link from "next/link";
import { useCart } from "../_state/cart";

export default function CartPill() {
  const { count } = useCart();
  const href = count > 0 ? "/checkout" : "/restaurants";

  return (
    <Link
      href={href}
      className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      title={count > 0 ? "Ir a checkout" : "Explorar restaurantes"}
    >
      Carrito · {count}
    </Link>
  );
}