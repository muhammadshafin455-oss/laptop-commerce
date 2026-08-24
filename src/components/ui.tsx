import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { STATUS_LABELS } from "@/lib/order-flow";
import type { OrderStatus } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-dark active:bg-brand-dark disabled:bg-line-strong disabled:text-muted disabled:shadow-none",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-brand hover:text-brand disabled:text-subtle disabled:border-line disabled:hover:text-subtle",
  ghost:
    "text-muted hover:bg-brand-soft hover:text-brand disabled:text-subtle disabled:hover:bg-transparent",
  danger:
    "bg-danger text-white shadow-sm hover:brightness-110 disabled:bg-line-strong disabled:text-muted",
};

const SIZES: Record<Size, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-sm",
  md: "gap-2 px-4 py-2.5 text-sm",
  lg: "gap-2 px-6 py-3.5 text-base",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md") =>
  `inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]}`;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-xl text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

export const inputClass =
  "mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand-ring/40";

export const inputErrorClass =
  "mt-1.5 w-full rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-subtle focus:ring-4 focus:ring-danger/20";

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-medium text-ink">
        {label}
        {optional ? (
          <span className="text-xs font-normal text-subtle">Optional</span>
        ) : null}
      </span>
      {children}
      {hint && !error ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
      ) : null}
    </label>
  );
}

export function Notice({
  result,
}: {
  result: { ok: boolean; message?: string } | null | undefined;
}) {
  if (!result?.message) return null;
  return (
    <p
      className={`mt-4 rounded-lg border px-3.5 py-3 text-sm font-medium ${
        result.ok
          ? "border-success/30 bg-success-soft text-success"
          : "border-danger/30 bg-danger-soft text-danger"
      }`}
    >
      {result.message}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

export { STATUS_LABELS };

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "border-warn/30 bg-warn-soft text-warn",
  CONFIRMED: "border-brand/30 bg-brand-soft text-brand",
  PREPARING: "border-brand/30 bg-brand-soft text-brand",
  READY: "border-brand/40 bg-brand text-white",
  OUT_FOR_DELIVERY: "border-brand/40 bg-brand text-white",
  COMPLETED: "border-success/30 bg-success-soft text-success",
  REJECTED: "border-danger/30 bg-danger-soft text-danger",
  CANCELLED: "border-danger/30 bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Threshold below which stock is called out as running low. */
export const LOW_STOCK_THRESHOLD = 10;

export function StockBadge({
  stock,
  isAvailable = true,
}: {
  stock: number;
  isAvailable?: boolean;
}) {
  if (!isAvailable) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-subtle" />
        Not listed
      </span>
    );
  }

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        Out of stock
      </span>
    );
  }

  const low = stock <= LOW_STOCK_THRESHOLD;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        low
          ? "border-warn/30 bg-warn-soft text-warn"
          : "border-success/30 bg-success-soft text-success"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${low ? "bg-warn" : "bg-success"}`}
      />
      {low ? `Only ${stock} left` : `${stock} in stock`}
    </span>
  );
}
