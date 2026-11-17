import { requirePageUser } from "@/lib/session";
import { CmsBlock } from "@/components/admin/content-admin";
import { getSetting } from "@/server/services/catalog";

export const metadata = { title: "Website CMS" };
export const dynamic = "force-dynamic";

export default async function Cms() {
  await requirePageUser({ permission: "cms:manage" });
  const [hero, contact, about, whyUs, faq] = await Promise.all([
    getSetting("site.hero", { heading: "", subtitle: "" }), getSetting("site.contact", { phone: "", email: "", address: "", whatsapp: "" }),
    getSetting("site.about", { story: "" }), getSetting("site.whyUs", []), getSetting("site.faq", []),
  ]);
  return (
    <div className="space-y-6"><div><h1 className="text-3xl">Website CMS</h1><p className="text-sm text-navy-400">Edit homepage, contact and informational content. Changes go live immediately.</p></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <CmsBlock k="site.hero" title="Home hero" value={hero} fields={[{ name: "heading", label: "Heading" }, { name: "subtitle", label: "Subtitle", long: true }]} />
        <CmsBlock k="site.contact" title="Contact details" value={contact} fields={[{ name: "phone", label: "Phone" }, { name: "email", label: "Email" }, { name: "address", label: "Address" }, { name: "whatsapp", label: "WhatsApp number (digits with country code)" }]} />
        <CmsBlock k="site.about" title="About us" value={about} fields={[{ name: "story", label: "Our story", long: true }]} />
        <CmsBlock k="site.whyUs" title="Why choose us (list of {title, text})" value={whyUs} />
        <div className="xl:col-span-2"><CmsBlock k="site.faq" title="FAQ (list of {q, a})" value={faq} /></div>
      </div></div>
  );
}
