import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { profileSchema } from "@/lib/validators/auth";
import { audit } from "@/lib/audit";

export const GET = route(async () => {
  const u = await requireApiUser();
  return ok(await db.user.findUnique({ where: { id: u.id }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } }));
});

export const PUT = route(async (req) => {
  const u = await requireApiUser();
  const data = await parseBody(req, profileSchema);
  // Only name/phone are writable; email and role can never be changed through this endpoint
  const updated = await db.user.update({ where: { id: u.id }, data: { name: data.name, phone: data.phone || null }, select: { id: true, name: true, phone: true } });
  await audit(u.id, "PROFILE_UPDATE", "User", u.id);
  return ok(updated);
});
