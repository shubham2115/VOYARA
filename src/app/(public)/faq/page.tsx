import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { getSetting } from "@/server/services/catalog";

export const metadata: Metadata = { title: "FAQ" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faq = await getSetting<{ q: string; a: string }[]>("site.faq", []);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <div className="container max-w-3xl py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="eyebrow">FAQ</p>
      <h1 className="mt-2 text-4xl">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {faq.map((f) => (
          <details key={f.q} className="card group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">{f.q}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
            <p className="mt-3 text-sm text-navy-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
