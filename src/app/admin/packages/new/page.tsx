import { db } from "@/lib/db";
import { emptyPackage } from "@/components/admin/empty-forms";
import { requirePageUser } from "@/lib/session";
import { PackageForm } from "@/components/admin/package-form";

export const metadata = { title: "New package" };
export const dynamic = "force-dynamic";

export default async function NewPackage() {
  await requirePageUser({ permission: "package:manage" });
  const destinations = await db.destination.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <div className="space-y-6"><h1 className="text-3xl">New package</h1><PackageForm initial={emptyPackage} destinations={destinations} /></div>;
}
