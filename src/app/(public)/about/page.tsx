import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSetting } from "@/server/services/catalog";

export const metadata: Metadata = { title: "About Us" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [about, why] = await Promise.all([getSetting("site.about", { story: "" }), getSetting<{ title: string; text: string }[]>("site.whyUs", [])]);
  return (
    <div className="container max-w-4xl py-14">
      <p className="eyebrow">About Voyara</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Travel India, the way locals do</h1>
      <p className="mt-6 text-lg leading-relaxed text-navy-600">{about.story}</p>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">{why.map((w) => <div key={w.title} className="card p-6"><h2 className="text-xl">{w.title}</h2><p className="mt-2 text-sm text-navy-400">{w.text}</p></div>)}</div>
      <Button asChild variant="gold" className="mt-10"><Link href="/customize-trip">Plan your trip</Link></Button>
    </div>
  );
}
