"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, IndianRupee, MapPin, Plane, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const BUDGETS = [
  ["", "Any budget"], ["15000", "Under ₹15,000"], ["30000", "Under ₹30,000"], ["50000", "Under ₹50,000"], ["100000", "Under ₹1,00,000"],
];

const field = "flex items-center gap-3 rounded-xl px-4 py-3 text-left transition focus-within:bg-navy-50 hover:bg-navy-50/60";
const input = "w-full bg-transparent text-sm font-medium text-navy outline-none placeholder:text-navy-300";

export function HeroSearch({ destinations, cities }: { destinations: { name: string; slug: string }[]; cities: string[] }) {
  const router = useRouter();
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const q = new URLSearchParams();
    for (const k of ["destination", "city", "maxPrice"]) { const v = String(f.get(k) ?? ""); if (v) q.set(k, v); }
    // Dates and travellers are carried to the enquiry form via the package page
    for (const k of ["date", "travellers"]) { const v = String(f.get(k) ?? ""); if (v) q.set(k, v); }
    router.push(`/packages?${q}`);
  }
  return (
    <form onSubmit={submit} role="search" aria-label="Search tour packages" className="grid gap-1 rounded-2xl bg-white p-2 shadow-lift md:grid-cols-[1.2fr_1fr_1fr_.7fr_1fr_auto]">
      <label className={field}><MapPin className="h-5 w-5 shrink-0 text-gold-600" />
        <span className="w-full"><span className="block text-[11px] uppercase tracking-wide text-navy-300">Destination</span>
          <select name="destination" className={input} defaultValue=""><option value="">Anywhere in India</option>{destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></span></label>
      <label className={field}><Plane className="h-5 w-5 shrink-0 text-gold-600" />
        <span className="w-full"><span className="block text-[11px] uppercase tracking-wide text-navy-300">Departure city</span>
          <select name="city" className={input} defaultValue=""><option value="">Any city</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></span></label>
      <label className={field}><Calendar className="h-5 w-5 shrink-0 text-gold-600" />
        <span className="w-full"><span className="block text-[11px] uppercase tracking-wide text-navy-300">Travel date</span>
          <input type="date" name="date" min={new Date().toISOString().slice(0, 10)} className={input} /></span></label>
      <label className={field}><Users className="h-5 w-5 shrink-0 text-gold-600" />
        <span className="w-full"><span className="block text-[11px] uppercase tracking-wide text-navy-300">Travellers</span>
          <input type="number" name="travellers" min={1} max={30} defaultValue={2} className={input} /></span></label>
      <label className={field}><IndianRupee className="h-5 w-5 shrink-0 text-gold-600" />
        <span className="w-full"><span className="block text-[11px] uppercase tracking-wide text-navy-300">Budget / person</span>
          <select name="maxPrice" className={input} defaultValue="">{BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></span></label>
      <Button type="submit" variant="gold" size="lg" className="h-auto md:px-8"><Search className="h-5 w-5" /> Search</Button>
    </form>
  );
}
