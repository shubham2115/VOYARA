import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CustomizeWizard } from "@/components/site/customize-wizard";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Customize Your Trip", description: "Tell us your dream trip and our experts will design the perfect itinerary." };
export const dynamic = "force-dynamic";

export default async function CustomizePage({ searchParams }: { searchParams: Promise<{ destination?: string; package?: string }> }) {
  const sp = await searchParams;
  const [dests, user, pkg, dest] = await Promise.all([
    db.destination.findMany({ where: { isPublished: true, deletedAt: null }, select: { name: true }, orderBy: { name: "asc" } }),
    getCurrentUser(),
    sp.package ? db.tourPackage.findUnique({ where: { slug: sp.package }, select: { name: true, destination: { select: { name: true } } } }) : null,
    sp.destination ? db.destination.findUnique({ where: { slug: sp.destination }, select: { name: true } }) : null,
  ]);
  return (
    <div className="container max-w-3xl py-12">
      <p className="eyebrow">Customize trip</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Design your perfect journey</h1>
      <p className="mt-3 text-navy-400">Five quick steps. No payment needed — we&apos;ll send a tailored quotation.</p>
      <div className="card mt-8 p-6 md:p-8">
        <CustomizeWizard
          destinations={dests.map((d) => d.name)}
          defaults={{ destinationName: pkg?.destination.name ?? dest?.name, message: pkg ? `Customising package: ${pkg.name}` : undefined }}
          user={user}
        />
      </div>
    </div>
  );
}
