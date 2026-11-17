import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { waLink } from "@/components/site/whatsapp-button";
import { getSetting } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Contact Us" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const c = await getSetting("site.contact", { phone: "", email: "", address: "", whatsapp: "" });
  return (
    <div className="container grid gap-12 py-14 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Contact us</p>
        <h1 className="mt-2 text-4xl md:text-5xl">Let&apos;s plan your trip</h1>
        <p className="mt-4 max-w-md text-navy-400">Questions about a package or a custom itinerary? Our travel experts typically reply within a few hours.</p>
        <ul className="mt-8 space-y-4">
          {c.phone && <li className="flex gap-3"><Phone className="h-5 w-5 text-gold-600" /> {c.phone}</li>}
          {c.email && <li className="flex gap-3"><Mail className="h-5 w-5 text-gold-600" /> {c.email}</li>}
          {c.address && <li className="flex gap-3"><MapPin className="h-5 w-5 text-gold-600" /> {c.address}</li>}
          {c.whatsapp && <li className="flex gap-3"><MessageCircle className="h-5 w-5 text-gold-600" /> <a className="underline" href={waLink(c.whatsapp)} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></li>}
        </ul>
      </div>
      <div className="card p-6 md:p-8"><ContactForm /></div>
    </div>
  );
}
