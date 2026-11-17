import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/** IDs of packages wishlisted by the current user (empty when signed out). */
export async function currentWishlistIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const rows = await db.wishlist.findMany({ where: { userId: user.id }, select: { packageId: true } });
  return new Set(rows.map((r) => r.packageId));
}
