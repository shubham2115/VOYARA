"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { apiRequest } from "@/lib/client-api";
import { ENQUIRY_STATUSES } from "@/lib/validators/enquiry";
import { formatINR, humanize } from "@/lib/utils";

function useAction() {
  const router = useRouter();
  return async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); router.refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Action failed"); }
  };
}

export function StatusPanel({ id, status, assignedToId, staff, canAssign, canConvert, hasBooking, phone }: {
  id: string; status: string; assignedToId: string | null; staff: { id: string; name: string }[]; canAssign: boolean; canConvert: boolean; hasBooking: boolean; phone: string;
}) {
  const run = useAction();
  const wa = `https://wa.me/${phone.replace(/\D/g, "")}`;
  return (
    <div className="card space-y-4 p-5">
      <Field label="Status">
        <Select value={status} onChange={(e) => run(() => apiRequest(`/api/admin/enquiries/${id}`, "PUT", { status: e.target.value }), "Status updated")}>
          {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </Select>
      </Field>
      {canAssign && (
        <Field label="Assigned staff">
          <Select value={assignedToId ?? ""} onChange={(e) => run(() => apiRequest(`/api/admin/enquiries/${id}/assign`, "POST", { staffId: e.target.value || null }), "Assignment updated")}>
            <option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></Button>
        {canConvert && !hasBooking && (
          <Confirm trigger={<Button size="sm" variant="gold">Convert to booking</Button>} title="Convert to booking?" description="A booking will be created from the latest quotation (or package price) and the enquiry marked Booking Confirmed." confirmLabel="Convert"
            onConfirm={() => run(() => apiRequest(`/api/admin/enquiries/${id}/convert`, "POST", {}), "Booking created")} />
        )}
        {status !== "CLOSED" && (
          <Confirm trigger={<Button size="sm" variant="ghost">Close enquiry</Button>} title="Close this enquiry?" description="The customer will see it as Closed. You can reopen it by changing the status." confirmLabel="Close enquiry"
            onConfirm={() => run(() => apiRequest(`/api/admin/enquiries/${id}`, "PUT", { status: "CLOSED" }), "Enquiry closed")} />
        )}
      </div>
    </div>
  );
}

export function NoteForm({ id }: { id: string }) {
  const run = useAction();
  const [body, setBody] = React.useState("");
  const [comm, setComm] = React.useState(false);
  const [channel, setChannel] = React.useState("CALL");
  return (
    <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); if (!body.trim()) return; void run(async () => { await apiRequest(`/api/admin/enquiries/${id}/notes`, "POST", { body, isCommunication: comm, channel: comm ? channel : undefined }); setBody(""); }, "Note added"); }}>
      <h3 className="font-serif text-lg">Add note</h3>
      <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Internal note or customer communication summary" aria-label="Note" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={comm} onChange={(e) => setComm(e.target.checked)} /> Customer communication</label>
      {comm && <Select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Channel">{["CALL", "EMAIL", "WHATSAPP", "MEETING"].map((c) => <option key={c}>{c}</option>)}</Select>}
      <Button type="submit" size="sm" disabled={!body.trim()}>Save note</Button>
    </form>
  );
}

export function QuotationBuilder({ id, defaultTitle, defaultPrice, travellers }: { id: string; defaultTitle: string; defaultPrice: number; travellers: number }) {
  const run = useAction();
  const [items, setItems] = React.useState([{ description: "Tour package (per person)", quantity: travellers, unitPrice: defaultPrice }]);
  const [discount, setDiscount] = React.useState(0);
  const [tax, setTax] = React.useState(5);
  const [validUntil, setValidUntil] = React.useState("");
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = Math.round((subtotal - discount) * (1 + tax / 100));
  const set = (i: number, k: string, v: string | number) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const submit = (send: boolean) => run(() => apiRequest(`/api/admin/enquiries/${id}/quotations`, "POST", { title: defaultTitle, items, discount, taxPercent: tax, validUntil: validUntil || undefined, send }), send ? "Quotation sent by email" : "Draft saved");
  return (
    <div className="card space-y-4 p-5">
      <h3 className="font-serif text-lg">Create quotation</h3>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_70px_110px_auto] items-end gap-2">
          <Input value={it.description} onChange={(e) => set(i, "description", e.target.value)} aria-label="Description" />
          <Input type="number" min={1} value={it.quantity} onChange={(e) => set(i, "quantity", Math.max(1, +e.target.value))} aria-label="Quantity" />
          <Input type="number" min={0} value={it.unitPrice} onChange={(e) => set(i, "unitPrice", Math.max(0, +e.target.value))} aria-label="Unit price" />
          <Button type="button" variant="ghost" size="icon" aria-label="Remove line" disabled={items.length === 1} onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])}><Plus className="h-4 w-4" /> Add line</Button>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Discount (₹)"><Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, +e.target.value))} /></Field>
        <Field label="GST %"><Input type="number" min={0} max={28} value={tax} onChange={(e) => setTax(+e.target.value)} /></Field>
        <Field label="Valid until"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
      </div>
      <p className="text-right text-lg font-bold">Total {formatINR(total)}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => submit(false)} disabled={subtotal <= 0}>Save draft</Button>
        <Button size="sm" onClick={() => submit(true)} disabled={subtotal <= 0 || items.some((i) => !i.description.trim())}>Save & email to customer</Button>
      </div>
    </div>
  );
}

export function ResendQuotation({ enquiryId, quotationId }: { enquiryId: string; quotationId: string }) {
  const run = useAction();
  return <Button size="sm" variant="outline" onClick={() => run(() => apiRequest(`/api/admin/enquiries/${enquiryId}/quotations`, "PUT", { quotationId }), "Quotation emailed")}>Send by email</Button>;
}
