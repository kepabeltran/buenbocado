import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-white text-brand-700 border border-brand-200 hover:border-brand-300",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-50"
} as const;

export type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof variants;
  }
>;

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition " +
        variants[variant] +
        " " +
        (className ?? "")
      }
      {...props}
    >
      {children}
    </button>
  );
}
