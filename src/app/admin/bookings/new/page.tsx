import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { ManualBookingForm } from "@/components/admin/booking-actions";

export const metadata = { title: "New booking" };
export const dynamic = "force-dynamic";

export default async function NewBooking() {
  await requirePageUser({ permission: "booking:manage" });
  const pkgs = await db.tourPackage.findMany({ where: { deletedAt: null }, select: { id: true, name: true, price: true, discountedPrice: true }, orderBy: { name: "asc" } });
  return <div className="space-y-6"><h1 className="text-3xl">Create booking manually</h1><ManualBookingForm packages={pkgs.map((p) => ({ id: p.id, name: p.name, price: p.discountedPrice ?? p.price }))} /></div>;
}
