"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { formatINR } from "@/lib/utils";

declare global {
  interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(e: string, cb: () => void): void } }
}

export function PayButton({ bookingId, due, name, email }: { bookingId: string; due: number; name: string; email: string }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(due);
  const [busy, setBusy] = React.useState(false);

  async function pay() {
    setBusy(true);
    try {
      const res = await fetch("/api/payments/razorpay/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, amount }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not start payment");
      if (!window.Razorpay) throw new Error("Payment gateway is still loading. Try again.");
      const rzp = new window.Razorpay({
        key: json.data.keyId, amount: json.data.amount, currency: json.data.currency, order_id: json.data.orderId, name: "Voyara", description: "Trip payment",
        prefill: { name, email }, theme: { color: "#0b1f3a" },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/payments/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
          if (v.ok) { toast.success("Payment received"); router.refresh(); } else toast.error("Payment could not be verified. If you were charged, contact us.");
        },
      });
      rzp.on("payment.failed", () => toast.error("Payment failed"));
      rzp.open();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Payment error"); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <label className="text-sm"><span className="mb-1 block text-navy-400">Amount (max {formatINR(due)})</span>
        <Input type="number" min={1} max={due} value={amount} onChange={(e) => setAmount(Math.min(due, Math.max(1, Number(e.target.value) || 1)))} className="w-40" /></label>
      <Button variant="gold" onClick={pay} disabled={busy}>{busy ? "Please wait…" : `Pay ${formatINR(amount)}`}</Button>
    </div>
  );
}
