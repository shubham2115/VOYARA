"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { apiRequest } from "@/lib/client-api";
import { humanize } from "@/lib/utils";

const STATUSES = ["PENDING", "CONFIRMED", "PAYMENT_PENDING", "PARTIALLY_PAID", "FULLY_PAID", "COMPLETED", "CANCELLED"];

function useAct() {
  const router = useRouter();
  return async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast.success(msg); router.refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } };
}

export function BookingControls({ id, status, assignedToId, staff, canAssign }: { id: string; status: string; assignedToId: string | null; staff: { id: string; name: string }[]; canAssign: boolean }) {
  const act = useAct();
  return (
    <div className="card space-y-4 p-5">
      <Field label="Booking status"><Select value={status} onChange={(e) => act(() => apiRequest(`/api/admin/bookings/${id}`, "PUT", { status: e.target.value }), "Status updated")}>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</Select></Field>
      {canAssign && <Field label="Assigned staff"><Select value={assignedToId ?? ""} onChange={(e) => act(() => apiRequest(`/api/admin/bookings/${id}`, "PUT", { assignedToId: e.target.value || null }), "Assignment updated")}><option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>}
    </div>
  );
}

export function PaymentForm({ id, due }: { id: string; due: number }) {
  const act = useAct();
  const [amount, setAmount] = React.useState(due);
  const [method, setMethod] = React.useState("UPI");
  const [reference, setReference] = React.useState("");
  if (due <= 0) return <p className="card p-5 text-sm text-emerald-700">Fully paid. No balance due.</p>;
  return (
    <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); void act(() => apiRequest(`/api/admin/bookings/${id}/payments`, "POST", { amount, method, reference: reference || undefined }), "Payment recorded"); }}>
      <h3 className="font-serif text-lg">Record payment</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`Amount (max ₹${due.toLocaleString("en-IN")})`}><Input type="number" min={1} max={due} value={amount} onChange={(e) => setAmount(Math.min(due, Math.max(1, +e.target.value)))} /></Field>
        <Field label="Method"><Select value={method} onChange={(e) => setMethod(e.target.value)}>{["UPI", "CASH", "BANK_TRANSFER", "CARD", "OTHER"].map((m) => <option key={m} value={m}>{humanize(m)}</option>)}</Select></Field>
      </div>
      <Field label="Reference / UTR (optional)"><Input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
      <Button type="submit" size="sm">Record payment</Button>
    </form>
  );
}

export function ManualBookingForm({ packages }: { packages: { id: string; name: string; price: number }[] }) {
  const router = useRouter();
  const [f, setF] = React.useState({ name: "", email: "", phone: "", packageId: "", travelDate: "", adults: 2, children: 0, rooms: 1, totalAmount: 0, couponCode: "", notes: "" });
  const [busy, setBusy] = React.useState(false);
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const b = await apiRequest<{ id: string }>("/api/admin/bookings", "POST", { ...f, packageId: f.packageId || undefined, couponCode: f.couponCode || undefined, notes: f.notes || undefined });
      toast.success("Booking created"); router.push(`/admin/bookings/${b.id}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="card grid max-w-3xl gap-4 p-6 sm:grid-cols-2">
      <Field label="Customer name"><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Phone"><Input type="tel" required value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      <Field label="Package (optional)"><Select value={f.packageId} onChange={(e) => { set("packageId", e.target.value); const p = packages.find((x) => x.id === e.target.value); if (p) set("totalAmount", p.price * f.adults); }}><option value="">Custom trip</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      <Field label="Travel date"><Input type="date" required value={f.travelDate} onChange={(e) => set("travelDate", e.target.value)} /></Field>
      <Field label="Total amount (₹)"><Input type="number" min={1} required value={f.totalAmount || ""} onChange={(e) => set("totalAmount", +e.target.value)} /></Field>
      <Field label="Adults"><Input type="number" min={1} value={f.adults} onChange={(e) => set("adults", +e.target.value)} /></Field>
      <Field label="Children"><Input type="number" min={0} value={f.children} onChange={(e) => set("children", +e.target.value)} /></Field>
      <Field label="Rooms"><Input type="number" min={1} value={f.rooms} onChange={(e) => set("rooms", +e.target.value)} /></Field>
      <Field label="Coupon code (optional)"><Input value={f.couponCode} onChange={(e) => set("couponCode", e.target.value)} /></Field>
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create booking"}</Button></div>
    </form>
  );
}
