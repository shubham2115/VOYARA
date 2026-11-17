"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ImageUploader } from "./image-uploader";
import { apiRequest } from "@/lib/client-api";

function useAct() {
  const router = useRouter();
  return async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); router.refresh(); return true; } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); return false; }
  };
}

export function CategoryForm() {
  const act = useAct();
  const [f, setF] = React.useState({ name: "", description: "", sortOrder: 0 });
  return (
    <form className="card grid gap-3 p-5 md:grid-cols-[1fr_1fr_100px_auto] md:items-end" onSubmit={async (e) => { e.preventDefault(); if (await act(() => apiRequest("/api/admin/categories", "POST", f), "Category added")) setF({ name: "", description: "", sortOrder: 0 }); }}>
      <Field label="Name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Description"><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Order"><Input type="number" min={0} value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: +e.target.value })} /></Field>
      <Button type="submit">Add</Button>
    </form>
  );
}

export function RowDelete({ url, label, description }: { url: string; label: string; description?: string }) {
  const act = useAct();
  return <Confirm trigger={<Button size="sm" variant="ghost" className="text-red-600">Delete</Button>} title={`Delete ${label}?`} description={description ?? "This cannot be undone."} confirmLabel="Delete" destructive onConfirm={() => void act(() => apiRequest(url, "DELETE"), "Deleted")} />;
}

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const act = useAct();
  return (
    <div className="flex gap-1">
      {status !== "APPROVED" && <Button size="sm" onClick={() => act(() => apiRequest(`/api/admin/reviews/${id}`, "PUT", { status: "APPROVED" }), "Review approved")}>Approve</Button>}
      {status !== "REJECTED" && <Button size="sm" variant="outline" onClick={() => act(() => apiRequest(`/api/admin/reviews/${id}`, "PUT", { status: "REJECTED" }), "Review rejected")}>Reject</Button>}
    </div>
  );
}

export function CouponForm() {
  const act = useAct();
  const init = { code: "", description: "", discountType: "PERCENT", value: 10, minAmount: 0, maxDiscount: "", usageLimit: "", validUntil: "", showOnHome: false };
  const [f, setF] = React.useState(init);
  const set = (k: string, v: string | number | boolean) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form className="card grid gap-3 p-5 md:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); if (await act(() => apiRequest("/api/admin/coupons", "POST", { ...f, maxDiscount: f.maxDiscount ? +f.maxDiscount : null, usageLimit: f.usageLimit ? +f.usageLimit : null, validUntil: f.validUntil || null }), "Coupon created")) setF(init); }}>
      <h2 className="font-serif text-xl md:col-span-4">Create coupon</h2>
      <Field label="Code"><Input required value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} /></Field>
      <Field label="Type"><Select value={f.discountType} onChange={(e) => set("discountType", e.target.value)}><option value="PERCENT">Percent %</option><option value="FLAT">Flat ₹</option></Select></Field>
      <Field label="Value"><Input type="number" min={1} required value={f.value} onChange={(e) => set("value", +e.target.value)} /></Field>
      <Field label="Min order (₹)"><Input type="number" min={0} value={f.minAmount} onChange={(e) => set("minAmount", +e.target.value)} /></Field>
      <Field label="Max discount (₹)"><Input type="number" min={1} value={f.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} /></Field>
      <Field label="Usage limit"><Input type="number" min={1} value={f.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} /></Field>
      <Field label="Valid until"><Input type="date" value={f.validUntil} onChange={(e) => set("validUntil", e.target.value)} /></Field>
      <Field label="Description"><Input value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" checked={f.showOnHome} onChange={(e) => set("showOnHome", e.target.checked)} /> Show on home page offers</label>
      <Button type="submit">Create coupon</Button>
    </form>
  );
}

export function CouponToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const act = useAct();
  return <Button size="sm" variant="outline" onClick={() => act(() => apiRequest(`/api/admin/coupons/${id}`, "PUT", { isActive: !isActive }), "Updated")}>{isActive ? "Disable" : "Enable"}</Button>;
}

export type BlogFormData = { id?: string; title: string; slug: string; excerpt: string; content: string; coverImage: string; categoryName: string; destinationId: string; seoTitle: string; seoDescription: string; isPublished: boolean };
export function BlogForm({ initial, destinations }: { initial: BlogFormData; destinations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const set = <K extends keyof BlogFormData>(k: K, v: BlogFormData[K]) => setF((p) => ({ ...p, [k]: v }));
  const n = (s: string) => s.trim() || null;
  return (
    <form className="card grid max-w-4xl gap-4 p-6 md:grid-cols-2" onSubmit={async (e) => {
      e.preventDefault(); if (!f.coverImage) return void toast.error("Add a cover image"); setBusy(true);
      try { await apiRequest(f.id ? `/api/admin/blog/${f.id}` : "/api/admin/blog", f.id ? "PUT" : "POST", { title: f.title, slug: f.slug || undefined, excerpt: f.excerpt, content: f.content, coverImage: f.coverImage, categoryName: n(f.categoryName), destinationId: n(f.destinationId), seoTitle: n(f.seoTitle), seoDescription: n(f.seoDescription), isPublished: f.isPublished }); toast.success("Saved"); router.push("/admin/blog"); router.refresh(); }
      catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); } finally { setBusy(false); }
    }}>
      <Field label="Title" className="md:col-span-2"><Input required value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Slug (auto if blank)"><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
      <Field label="Category"><Input value={f.categoryName} onChange={(e) => set("categoryName", e.target.value)} placeholder="Travel Guides" /></Field>
      <Field label="Related destination"><Select value={f.destinationId} onChange={(e) => set("destinationId", e.target.value)}><option value="">None</option>{destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
      <div className="md:col-span-2"><ImageUploader label="Cover image" value={f.coverImage ? [f.coverImage] : []} onChange={(v) => set("coverImage", v[0] ?? "")} /></div>
      <Field label="Excerpt" className="md:col-span-2"><Textarea required rows={2} value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></Field>
      <Field label="Content" hint="Use ## for headings, '- ' for lists, blank line between paragraphs" className="md:col-span-2"><Textarea required rows={14} value={f.content} onChange={(e) => set("content", e.target.value)} /></Field>
      <Field label="SEO title"><Input value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></Field>
      <Field label="SEO description"><Input value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={f.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Published</label>
      <div className="md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save article"}</Button></div>
    </form>
  );
}

/** Generic CMS editor: simple object blocks get fields; list blocks get a validated JSON editor. */
export function CmsBlock({ k, title, value, fields }: { k: string; title: string; value: unknown; fields?: { name: string; label: string; long?: boolean }[] }) {
  const act = useAct();
  const [obj, setObj] = React.useState<Record<string, string>>(fields ? (value as Record<string, string>) : {});
  const [json, setJson] = React.useState(fields ? "" : JSON.stringify(value, null, 2));
  async function save(e: React.FormEvent) {
    e.preventDefault();
    let body: unknown = obj;
    if (!fields) { try { body = JSON.parse(json); } catch { return void toast.error("That is not valid JSON"); } }
    await act(() => apiRequest(`/api/admin/cms/${k}`, "PUT", body), `${title} saved`);
  }
  return (
    <form onSubmit={save} className="card space-y-3 p-5">
      <h2 className="font-serif text-xl">{title}</h2>
      {fields ? fields.map((f) => <Field key={f.name} label={f.label}>{f.long ? <Textarea rows={4} value={obj[f.name] ?? ""} onChange={(e) => setObj({ ...obj, [f.name]: e.target.value })} /> : <Input value={obj[f.name] ?? ""} onChange={(e) => setObj({ ...obj, [f.name]: e.target.value })} />}</Field>)
        : <Field label="Content (JSON list)"><Textarea rows={10} className="font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} /></Field>}
      <Button type="submit" size="sm">Save</Button>
    </form>
  );
}

export function MarkRead({ id }: { id: string }) {
  const act = useAct();
  return <Button size="sm" variant="outline" onClick={() => act(() => apiRequest(`/api/admin/messages/${id}`, "PUT", { isRead: true }), "Marked as read")}>Mark read</Button>;
}
