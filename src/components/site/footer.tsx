import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSetting } from "@/server/services/catalog";

const cols = [
  { title: "Explore", links: [["Destinations", "/destinations"], ["Tour Packages", "/packages"], ["Customize Trip", "/customize-trip"], ["Compare Packages", "/compare"], ["India Map", "/map"]] },
  { title: "Company", links: [["About Us", "/about"], ["Travel Blog", "/blog"], ["Contact Us", "/contact"], ["FAQ", "/faq"]] },
  { title: "Legal", links: [["Privacy Policy", "/privacy-policy"], ["Terms & Conditions", "/terms"], ["Cancellation & Refund", "/cancellation-refund-policy"]] },
];

export async function Footer() {
  const c = await getSetting("site.contact", { phone: "", email: "", address: "", whatsapp: "" });
  return (
    <footer className="mt-24 bg-navy-800 text-navy-100">
      <div className="container grid gap-10 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl font-bold text-white">VOYARA<span className="text-gold">.</span></p>
          <p className="mt-3 max-w-sm text-sm text-navy-200">Curated journeys across India — from Himalayan peaks to coastal backwaters, planned by local experts.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {c.phone && <li className="flex gap-2"><Phone className="h-4 w-4 text-gold" /> {c.phone}</li>}
            {c.email && <li className="flex gap-2"><Mail className="h-4 w-4 text-gold" /> {c.email}</li>}
            {c.address && <li className="flex gap-2"><MapPin className="h-4 w-4 text-gold" /> {c.address}</li>}
          </ul>
        </div>
        {cols.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-gold">{col.title}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {col.links.map(([l, h]) => (<li key={h}><Link href={h} className="text-navy-200 hover:text-white">{l}</Link></li>))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-navy-300">© {new Date().getFullYear()} Voyara Travels. All rights reserved.</div>
    </footer>
  );
}
