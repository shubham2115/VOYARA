import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/site/cards";

export const metadata = { title: "My Wishlist" };
export const dynamic = "force-dynamic";

export default async function Wishlist() {
  const u = await requirePageUser();
  const items = await db.wishlist.findMany({ where: { userId: u.id, package: { isPublished: true, deletedAt: null } }, orderBy: { createdAt: "desc" }, include: { package: { include: { destination: { select: { name: true, state: true } } } } } });
  return (
    <div>
      <h1 className="mb-6 text-3xl">My Wishlist</h1>
      {items.length === 0 ? <EmptyState title="Nothing saved yet" description="Tap the heart on any package to save it here." action={<Button asChild variant="gold"><Link href="/packages">Browse packages</Link></Button>} /> : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map((w) => <PackageCard key={w.id} p={w.package} wished />)}</div>
      )}
    </div>
  );
}
