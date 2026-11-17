import { db } from "@/lib/db";
import { emptyDestination } from "@/components/admin/empty-forms";
import { requirePageUser } from "@/lib/session";
import { DestinationForm } from "@/components/admin/destination-form";

export const metadata = { title: "New destination" };
export const dynamic = "force-dynamic";

export default async function NewDestination() {
  await requirePageUser({ permission: "destination:manage" });
  const categories = await db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return <div className="space-y-6"><h1 className="text-3xl">New destination</h1><DestinationForm initial={emptyDestination} categories={categories} /></div>;
}
