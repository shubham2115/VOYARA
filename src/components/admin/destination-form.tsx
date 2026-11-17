"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ImageUploader } from "./image-uploader";
import { apiRequest } from "@/lib/client-api";

export type DestinationFormData = {
  id?: string; name: string; slug: string; state: string; city: string; tagline: string; description: string; coverImage: string; images: string[];
  attractions: string; bestTimeToVisit: string; howToReach: string; budgetMin: string; budgetMax: string; recommendedDays: string;
  latitude: string; longitude: string; categoryId: string; isPublished: boolean; isFeatured: boolean;
};

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const nul = (s: string) => (s.trim() === "" ? null : s.trim());

export function DestinationForm({ initial, categories }: { initial: DestinationFormData; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const set = <K extends keyof DestinationFormData>(k: K, v: DestinationFormData[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.coverImage) return void toast.error("Please add a cover image");
    setBusy(true);
    try {
      const body = {
        name: f.name, slug: f.slug || undefined, state: f.state, city: nul(f.city), tagline: nul(f.tagline), description: f.description, coverImage: f.coverImage, images: f.images,
        attractions: f.attractions.split("\n").map((s) => s.trim()).filter(Boolean), bestTimeToVisit: nul(f.bestTimeToVisit), howToReach: nul(f.howToReach),
        budgetMin: num(f.budgetMin), budgetMax: num(f.budgetMax), recommendedDays: nul(f.recommendedDays), latitude: num(f.latitude), longitude: num(f.longitude),
        categoryId: f.categoryId || null, isPublished: f.isPublished, isFeatured: f.isFeatured,
      };
      await apiRequest(f.id ? `/api/admin/destinations/${f.id}` : "/api/admin/destinations", f.id ? "PUT" : "POST", body);
      toast.success(f.id ? "Destination updated" : "Destination created");
      router.push("/admin/destinations"); router.refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card grid max-w-4xl gap-4 p-6 md:grid-cols-2">
      <Field label="Name"><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Slug (auto if blank)"><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="e.g. manali" /></Field>
      <Field label="State"><Input required value={f.state} onChange={(e) => set("state", e.target.value)} /></Field>
      <Field label="City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
      <Field label="Category"><Select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">— None —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      <Field label="Tagline"><Input value={f.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
      <Field label="Description" className="md:col-span-2"><Textarea required rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <div className="md:col-span-2"><ImageUploader label="Cover image" value={f.coverImage ? [f.coverImage] : []} onChange={(v) => set("coverImage", v[0] ?? "")} /></div>
      <div className="md:col-span-2"><ImageUploader label="Gallery images" multiple value={f.images} onChange={(v) => set("images", v)} /></div>
      <Field label="Popular attractions (one per line)" className="md:col-span-2"><Textarea rows={4} value={f.attractions} onChange={(e) => set("attractions", e.target.value)} /></Field>
      <Field label="Best time to visit"><Input value={f.bestTimeToVisit} onChange={(e) => set("bestTimeToVisit", e.target.value)} /></Field>
      <Field label="Recommended duration"><Input value={f.recommendedDays} onChange={(e) => set("recommendedDays", e.target.value)} placeholder="3–4 days" /></Field>
      <Field label="How to reach" className="md:col-span-2"><Textarea rows={3} value={f.howToReach} onChange={(e) => set("howToReach", e.target.value)} /></Field>
      <Field label="Budget min (₹ / person)"><Input type="number" min={0} value={f.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} /></Field>
      <Field label="Budget max (₹ / person)"><Input type="number" min={0} value={f.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} /></Field>
      <Field label="Latitude"><Input type="number" step="any" value={f.latitude} onChange={(e) => set("latitude", e.target.value)} /></Field>
      <Field label="Longitude"><Input type="number" step="any" value={f.longitude} onChange={(e) => set("longitude", e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Published</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Featured</label>
      <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save destination"}</Button><Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button></div>
    </form>
  );
}
