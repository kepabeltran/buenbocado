"use client";
import type { ReactNode } from "react";
import { OrderAlert } from "./_components/OrderAlert";
export default function RestaurantPortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OrderAlert />
      <div className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </div>
    </>
  );
}
