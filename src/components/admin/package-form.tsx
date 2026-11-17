"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ImageUploader } from "./image-uploader";
import { apiRequest } from "@/lib/client-api";

type Day = { title: string; description: string; meals: string[]; stay: string };
export type PackageFormData = {
  id?: string; name: string; slug: string; summary: string; destinationId: string; coverImage: string; images: string[];
  durationDays: number; durationNights: number; price: number; discountedPrice: string; tier: string; hotelCategory: string;
  travelTypes: string[]; themes: string; departureCities: string; hotelInfo: string; transportInfo: string; activities: string;
  importantInfo: string; cancellationPolicy: string; maxGroupSize: string; isAvailable: boolean; isPublished: boolean; isFeatured: boolean;
  itinerary: Day[]; inclusions: string; exclusions: string;
};

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const nul = (s: string) => (s.trim() ? s.trim() : null);

export function PackageForm({ initial, destinations }: { initial: PackageFormData; destinations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const set = <K extends keyof PackageFormData>(k: K, v: PackageFormData[K]) => setF((p) => ({ ...p, [k]: v }));
  const setDay = (i: number, patch: Partial<Day>) => set("itinerary", f.itinerary.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const toggle = <T extends string>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.coverImage) return void toast.error("Please add a cover image");
    if (!f.destinationId) return void toast.error("Select a destination");
    setBusy(true);
    try {
      const body = {
        name: f.name, slug: f.slug || undefined, summary: f.summary, destinationId: f.destinationId, coverImage: f.coverImage, images: f.images,
        durationDays: +f.durationDays, durationNights: +f.durationNights, price: +f.price, discountedPrice: f.discountedPrice ? +f.discountedPrice : null,
        tier: f.tier, hotelCategory: f.hotelCategory, travelTypes: f.travelTypes, themes: csv(f.themes), departureCities: csv(f.departureCities),
        hotelInfo: nul(f.hotelInfo), transportInfo: nul(f.transportInfo), activities: lines(f.activities), importantInfo: nul(f.importantInfo), cancellationPolicy: nul(f.cancellationPolicy),
        maxGroupSize: f.maxGroupSize ? +f.maxGroupSize : null, isAvailable: f.isAvailable, isPublished: f.isPublished, isFeatured: f.isFeatured,
        itinerary: f.itinerary.filter((d) => d.title.trim()).map((d) => ({ ...d, stay: nul(d.stay) })), inclusions: lines(f.inclusions), exclusions: lines(f.exclusions),
      };
      await apiRequest(f.id ? `/api/admin/packages/${f.id}` : "/api/admin/packages", f.id ? "PUT" : "POST", body);
      toast.success(f.id ? "Package updated" : "Package created");
      router.push("/admin/packages"); router.refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card grid max-w-5xl gap-4 p-6 md:grid-cols-2">
      <Field label="Package name"><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Destination"><Select required value={f.destinationId} onChange={(e) => set("destinationId", e.target.value)}><option value="">Select…</option>{destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
      <Field label="Summary" className="md:col-span-2"><Textarea required rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
      <div className="md:col-span-2"><ImageUploader label="Cover image" value={f.coverImage ? [f.coverImage] : []} onChange={(v) => set("coverImage", v[0] ?? "")} /></div>
      <div className="md:col-span-2"><ImageUploader label="Gallery" multiple value={f.images} onChange={(v) => set("images", v)} /></div>
      <Field label="Days"><Input type="number" min={1} value={f.durationDays} onChange={(e) => set("durationDays", +e.target.value)} /></Field>
      <Field label="Nights"><Input type="number" min={0} value={f.durationNights} onChange={(e) => set("durationNights", +e.target.value)} /></Field>
      <Field label="Price per person (₹)"><Input type="number" min={1} required value={f.price || ""} onChange={(e) => set("price", +e.target.value)} /></Field>
      <Field label="Discounted price (₹, optional)"><Input type="number" min={1} value={f.discountedPrice} onChange={(e) => set("discountedPrice", e.target.value)} /></Field>
      <Field label="Budget / Luxury tier"><Select value={f.tier} onChange={(e) => set("tier", e.target.value)}><option value="BUDGET">Budget</option><option value="PREMIUM">Premium</option><option value="LUXURY">Luxury</option></Select></Field>
      <Field label="Hotel category"><Select value={f.hotelCategory} onChange={(e) => set("hotelCategory", e.target.value)}>{["BUDGET", "STANDARD", "DELUXE", "LUXURY"].map((h) => <option key={h} value={h}>{h[0] + h.slice(1).toLowerCase()}</option>)}</Select></Field>
      <fieldset className="md:col-span-2"><legend className="mb-1 text-sm font-medium">Suitable for</legend><div className="flex gap-4 text-sm">{["FAMILY", "COUPLE", "GROUP", "SOLO"].map((t) => <label key={t} className="flex items-center gap-1.5"><input type="checkbox" checked={f.travelTypes.includes(t)} onChange={() => set("travelTypes", toggle(f.travelTypes, t))} /> {t[0] + t.slice(1).toLowerCase()}</label>)}</div></fieldset>
      <Field label="Themes (comma separated)"><Input value={f.themes} onChange={(e) => set("themes", e.target.value)} placeholder="Honeymoon, Adventure" /></Field>
      <Field label="Departure cities (comma separated)"><Input value={f.departureCities} onChange={(e) => set("departureCities", e.target.value)} placeholder="Delhi, Mumbai" /></Field>
      <Field label="Hotel information"><Textarea rows={2} value={f.hotelInfo} onChange={(e) => set("hotelInfo", e.target.value)} /></Field>
      <Field label="Transport details"><Textarea rows={2} value={f.transportInfo} onChange={(e) => set("transportInfo", e.target.value)} /></Field>
      <Field label="Activities (one per line)"><Textarea rows={4} value={f.activities} onChange={(e) => set("activities", e.target.value)} /></Field>
      <Field label="Max group size"><Input type="number" min={1} value={f.maxGroupSize} onChange={(e) => set("maxGroupSize", e.target.value)} /></Field>

      <section className="space-y-3 md:col-span-2"><h3 className="font-serif text-lg">Day-wise itinerary</h3>
        {f.itinerary.map((d, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-navy-100 p-3 md:grid-cols-[1fr_1fr_auto]">
            <Input placeholder={`Day ${i + 1} title`} value={d.title} onChange={(e) => setDay(i, { title: e.target.value })} aria-label={`Day ${i + 1} title`} />
            <Input placeholder="Overnight stay" value={d.stay} onChange={(e) => setDay(i, { stay: e.target.value })} aria-label="Stay" />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove day" disabled={f.itinerary.length === 1} onClick={() => set("itinerary", f.itinerary.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            <Textarea rows={2} className="md:col-span-3" placeholder="What happens on this day" value={d.description} onChange={(e) => setDay(i, { description: e.target.value })} aria-label="Description" />
            <div className="flex gap-4 text-sm md:col-span-3">{["BREAKFAST", "LUNCH", "DINNER"].map((m) => <label key={m} className="flex items-center gap-1.5"><input type="checkbox" checked={d.meals.includes(m)} onChange={() => setDay(i, { meals: toggle(d.meals, m) })} /> {m[0] + m.slice(1).toLowerCase()}</label>)}</div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => set("itinerary", [...f.itinerary, { title: "", description: "", meals: ["BREAKFAST"], stay: "" }])}><Plus className="h-4 w-4" /> Add day</Button>
      </section>

      <Field label="Inclusions (one per line)"><Textarea rows={5} value={f.inclusions} onChange={(e) => set("inclusions", e.target.value)} /></Field>
      <Field label="Exclusions (one per line)"><Textarea rows={5} value={f.exclusions} onChange={(e) => set("exclusions", e.target.value)} /></Field>
      <Field label="Important information" className="md:col-span-2"><Textarea rows={3} value={f.importantInfo} onChange={(e) => set("importantInfo", e.target.value)} /></Field>
      <Field label="Cancellation policy" className="md:col-span-2"><Textarea rows={3} value={f.cancellationPolicy} onChange={(e) => set("cancellationPolicy", e.target.value)} /></Field>
      <div className="flex flex-wrap gap-5 text-sm md:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.isAvailable} onChange={(e) => set("isAvailable", e.target.checked)} /> Available for booking</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Published</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Featured</label>
      </div>
      <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save package"}</Button><Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button></div>
    </form>
  );
}
