import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export const Badge = ({ className, tone = "navy", ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "navy" | "gold" | "green" | "red" | "amber" | "gray" | "blue" }) => {
  const tones = {
    navy: "bg-navy-100 text-navy-700",
    gold: "bg-gold-100 text-gold-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-sky-100 text-sky-700",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} {...p} />;
};

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-xl bg-navy-100/70", className)} aria-hidden />
);

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white/60 px-6 py-14 text-center">
      <Inbox className="mb-3 h-9 w-9 text-navy-300" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-navy-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Server-rendered pagination driven by search params. */
export function Pagination({ page, totalPages, basePath, params }: { page: number; totalPages: number; basePath: string; params: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    q.set("page", String(p));
    return `${basePath}?${q}`;
  };
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 && <Link href={href(page - 1)} className="rounded-lg p-2 hover:bg-navy-50" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Link>}
      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-navy-300">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={cn("h-9 min-w-9 rounded-lg px-3 text-center text-sm leading-9", p === page ? "bg-navy text-white" : "hover:bg-navy-50")}>{p}</Link>
        </React.Fragment>
      ))}
      {page < totalPages && <Link href={href(page + 1)} className="rounded-lg p-2 hover:bg-navy-50" aria-label="Next page"><ChevronRight className="h-4 w-4" /></Link>}
    </nav>
  );
}

export const statusTone = (s: string): "navy" | "gold" | "green" | "red" | "amber" | "gray" | "blue" =>
  ({
    NEW: "blue", UNDER_REVIEW: "amber", CONTACTED: "navy", QUOTATION_SENT: "gold", CUSTOMER_APPROVED: "green",
    BOOKING_CONFIRMED: "green", CANCELLED: "red", CLOSED: "gray",
    PENDING: "amber", CONFIRMED: "green", PAYMENT_PENDING: "amber", PARTIALLY_PAID: "gold", FULLY_PAID: "green", COMPLETED: "navy",
  })[s] as never ?? "gray";
