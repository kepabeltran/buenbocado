import type { HTMLAttributes, PropsWithChildren } from "react";

export type ChipProps = PropsWithChildren<HTMLAttributes<HTMLSpanElement>>;

export function Chip({ children, className, ...props }: ChipProps) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 " +
        (className ?? "")
      }
      {...props}
    >
      {children}
    </span>
  );
}
