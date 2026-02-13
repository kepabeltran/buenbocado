"use client";

import type { ReactNode } from "react";
import { OrderAlert } from "./_components/OrderAlert";

export default function RestaurantPortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OrderAlert />
      {children}
    </>
  );
}
