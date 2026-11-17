"use client";
import * as React from "react";
import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const KEY = "voyara:compare";
const EVT = "voyara:compare-change";

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function write(v: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVT));
}
function useCompare() {
  const [list, setList] = React.useState<string[]>([]);
  React.useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return list;
}

export function CompareToggle({ slug }: { slug: string }) {
  const list = useCompare();
  const on = list.includes(slug);
  function toggle() {
    const cur = read();
    if (cur.includes(slug)) return write(cur.filter((s) => s !== slug));
    if (cur.length >= 3) return void toast.warning("You can compare up to 3 packages");
    write([...cur, slug]);
  }
  return (
    <button onClick={toggle} aria-pressed={on} className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition", on ? "bg-navy text-white" : "text-navy-400 hover:bg-navy-50")}>
      <GitCompare className="h-3.5 w-3.5" /> {on ? "Added" : "Compare"}
    </button>
  );
}

export function CompareBar() {
  const list = useCompare();
  if (!list.length) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-navy px-5 py-3 text-sm text-white shadow-lift">
      <GitCompare className="h-4 w-4 text-gold" /> {list.length} selected
      <Link href={`/compare?slugs=${list.join(",")}`} className="rounded-full bg-gold px-4 py-1 font-semibold text-navy-900">Compare</Link>
      <button onClick={() => write([])} aria-label="Clear comparison"><X className="h-4 w-4" /></button>
    </div>
  );
}
