"use client";
import * as React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Dest = { slug: string; name: string; state: string; packages: { slug: string; name: string; price: number }[] };

/** Approximate geographic tile layout [col,row] for states/UTs that have destinations. */
const TILES: Record<string, [number, number]> = {
  "Jammu & Kashmir": [3, 0], "Himachal Pradesh": [3, 1], Punjab: [2, 1], Uttarakhand: [4, 1], Rajasthan: [1, 2], "Uttar Pradesh": [4, 2],
  Gujarat: [0, 3], "Madhya Pradesh": [2, 3], Sikkim: [6, 2], "West Bengal": [6, 3], Meghalaya: [7, 3], "Arunachal Pradesh": [8, 2],
  Odisha: [5, 4], Maharashtra: [1, 4], Goa: [1, 5], Karnataka: [2, 5], "Tamil Nadu": [3, 6], Kerala: [2, 6], Lakshadweep: [0, 6], "Andaman & Nicobar Islands": [7, 6],
};

export function IndiaMap({ destinations, mapsKey }: { destinations: Dest[]; mapsKey?: string }) {
  const byState = React.useMemo(() => { const m = new Map<string, Dest[]>(); destinations.forEach((d) => m.set(d.state, [...(m.get(d.state) ?? []), d])); return m; }, [destinations]);
  const [active, setActive] = React.useState<string | null>(null);
  const list = active ? (byState.get(active) ?? []) : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div role="group" aria-label="Indian states with destinations" className="grid grid-cols-9 gap-1.5 sm:gap-2">
        {Object.entries(TILES).map(([state, [c, r]]) => {
          const n = byState.get(state)?.length ?? 0;
          return (
            <button key={state} disabled={!n} onClick={() => setActive(state)} style={{ gridColumn: c + 1, gridRow: r + 1 }} aria-pressed={active === state} aria-label={`${state}: ${n} destination${n === 1 ? "" : "s"}`}
              className={cn("flex aspect-square flex-col items-center justify-center rounded-xl p-1 text-center text-[9px] font-medium leading-tight transition sm:text-xs", n ? (active === state ? "bg-gold text-navy-900 shadow-lift" : "bg-navy text-white hover:bg-navy-600") : "bg-navy-100 text-navy-300")}>
              <span className="line-clamp-3">{state}</span>{n > 0 && <span className="mt-0.5 text-[10px] opacity-80">{n}</span>}
            </button>
          );
        })}
      </div>
      <aside aria-live="polite" className="card min-h-[260px] p-5">
        {!active ? <p className="text-navy-400">Select a highlighted state to see its destinations and packages.</p> : (
          <div className="space-y-5"><h2 className="text-2xl">{active}</h2>
            {mapsKey && <iframe title={`${active} on Google Maps`} loading="lazy" className="h-40 w-full rounded-xl border-0" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsKey)}&q=${encodeURIComponent(`${active}, India`)}`} />}
            {list.map((d) => (
              <div key={d.slug}><Link href={`/destinations/${d.slug}`} className="flex items-center gap-1 font-semibold hover:text-gold-600"><MapPin className="h-4 w-4 text-gold-600" /> {d.name}</Link>
                <ul className="mt-1 space-y-1 pl-5 text-sm">{d.packages.length ? d.packages.map((p) => <li key={p.slug}><Link href={`/packages/${p.slug}`} className="underline-offset-2 hover:underline">{p.name}</Link> <span className="text-navy-400">· ₹{p.price.toLocaleString("en-IN")}</span></li>) : <li className="text-navy-300">No packages yet</li>}</ul></div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
