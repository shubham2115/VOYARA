import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { staffCreateSchema } from "@/lib/validators/auth";
import { audit } from "@/lib/audit";

export const GET = route(async () => {
  await requireApiUser("staff:manage");
  return ok(await db.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] }, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true } }));
});

export const POST = route(async (req) => {
  const admin = await requireApiUser("staff:manage");
  const d = await parseBody(req, staffCreateSchema.extend({ role: z.enum(["STAFF", "ADMIN"]).default("STAFF") }));
  if (await db.user.findUnique({ where: { email: d.email }, select: { id: true } })) throw new ApiError(409, "An account with this email already exists");
  const u = await db.user.create({ data: { name: d.name, email: d.email, phone: d.phone || null, role: d.role, passwordHash: await bcrypt.hash(d.password, 12) }, select: { id: true, name: true, email: true, role: true } });
  await audit(admin.id, "STAFF_CREATE", "User", u.id, { role: d.role });
  return ok(u, { status: 201 });
});
