import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { CompareBar } from "@/components/site/compare-bar";
import { getSetting } from "@/server/services/catalog";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const c = await getSetting("site.contact", { whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "" });
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <CompareBar />
      {c.whatsapp && <WhatsAppButton number={c.whatsapp} />}
    </>
  );
}
