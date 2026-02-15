"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../_state/cart";

export default function CartFloat() {
  const { count, list } = useCart();
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (list.length === 0) { setUrgent(false); return; }

    function check() {
      const oldest = list.reduce((min, i) => {
        const t = new Date(i.addedAt).getTime();
        return t < min ? t : min;
      }, Infinity);
      setUrgent(Date.now() - oldest > 10 * 60 * 1000);
    }

    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [list]);

  if (count === 0) return null;

  const totalCents = list.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const total = (totalCents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <Link
      href="/cart"
      className={"fixed bottom-20 right-4 z-50 flex items-center gap-2.5 rounded-full pl-4 pr-5 py-3 text-white shadow-xl transition hover:-translate-y-0.5 active:scale-95 " +
        (urgent
          ? "bg-amber-500 shadow-amber-500/30 hover:bg-amber-600 animate-pulse"
          : "bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700"
        )
      }
    >
      <div className="relative">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <span className={"absolute -top-2 -right-2 grid h-4 w-4 place-items-center rounded-full text-[10px] font-extrabold " +
          (urgent ? "bg-white text-amber-600" : "bg-white text-emerald-700")
        }>
          {count}
        </span>
      </div>
      <div className="flex flex-col items-start">
        <span className="text-sm font-bold">{total}</span>
        {urgent && <span className="text-[10px] font-medium -mt-0.5">Las ofertas pueden agotarse</span>}
      </div>
    </Link>
  );
}
