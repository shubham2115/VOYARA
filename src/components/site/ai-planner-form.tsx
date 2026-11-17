"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { apiRequest } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";

type Plan = { title: string; summary: string; estimatedCostPerPerson: number; days: { day: number; title: string; description: string }[]; tips: string[]; source: "ai" | "fallback" };
const INTERESTS = ["Adventure", "Culture", "Food", "Nature", "Relaxation", "Photography", "Spiritual"];

export function AiPlannerForm({ destinations }: { destinations: string[] }) {
  const [f, setF] = React.useState({ destination: "", budgetPerPerson: 30000, days: 5, travellers: 2, startDate: "" });
  const [interests, setInterests] = React.useState<string[]>([]);
  const [plan, setPlan] = React.useState<Plan | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setPlan(null);
    try { setPlan(await apiRequest<Plan>("/api/ai/plan", "POST", { ...f, startDate: f.startDate || undefined, interests })); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not generate a plan"); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Destination"><Input required list="ai-dest" value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} /><datalist id="ai-dest">{destinations.map((d) => <option key={d} value={d} />)}</datalist></Field>
        <Field label="Budget per person (₹)"><Input type="number" min={1000} step={1000} required value={f.budgetPerPerson} onChange={(e) => setF({ ...f, budgetPerPerson: +e.target.value })} /></Field>
        <Field label="Days"><Input type="number" min={1} max={21} required value={f.days} onChange={(e) => setF({ ...f, days: +e.target.value })} /></Field>
        <Field label="Travellers"><Input type="number" min={1} max={30} value={f.travellers} onChange={(e) => setF({ ...f, travellers: +e.target.value })} /></Field>
        <Field label="Travel start date (optional)"><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
        <fieldset><legend className="mb-1 text-sm font-medium">Interests</legend><div className="flex flex-wrap gap-2">{INTERESTS.map((i) => <button type="button" key={i} aria-pressed={interests.includes(i)} onClick={() => setInterests(interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i])} className={`rounded-full border px-3 py-1 text-sm ${interests.includes(i) ? "border-navy bg-navy text-white" : "border-navy-200 bg-white"}`}>{i}</button>)}</div></fieldset>
        <div className="sm:col-span-2"><Button type="submit" variant="gold" disabled={busy}><Sparkles className="h-4 w-4" /> {busy ? "Planning your trip…" : "Generate itinerary"}</Button></div>
      </form>

      {plan && (
        <section className="card space-y-5 p-6" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl">{plan.title}</h2><Badge tone={plan.source === "ai" ? "gold" : "gray"}>{plan.source === "ai" ? "AI generated" : "Based on our packages"}</Badge></div>
          <p className="text-navy-600">{plan.summary}</p>
          <p className="font-semibold">Estimated cost: {formatINR(plan.estimatedCostPerPerson)} per person</p>
          <ol className="space-y-4 border-l-2 border-gold-200 pl-5">{plan.days.map((d) => <li key={d.day}><h3 className="font-serif text-lg">Day {d.day}: {d.title}</h3><p className="text-sm text-navy-600">{d.description}</p></li>)}</ol>
          {plan.tips.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-navy-600">{plan.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
          <p className="text-xs text-navy-300">Indicative plan only; prices and availability are confirmed in a quotation.</p>
          <Button asChild><Link href={`/customize-trip?destination=${encodeURIComponent(f.destination.toLowerCase().replace(/\s+/g, "-"))}`}>Turn this into a quote request</Link></Button>
        </section>
      )}
    </div>
  );
}
