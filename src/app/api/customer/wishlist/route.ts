import { z } from "zod";
import { db } from "@/lib/db";
import { ok, parseBody, requireCustomer, route } from "@/lib/api-auth";

const schema = z.object({ packageId: z.string().min(1).max(40) });

export const GET = route(async () => {
  const user = await requireCustomer();
  const items = await db.wishlist.findMany({ where: { userId: user.id }, include: { package: { include: { destination: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } });
  return ok(items);
});

export const POST = route(async (req) => {
  const user = await requireCustomer();
  const { packageId } = await parseBody(req, schema);
  await db.wishlist.upsert({ where: { userId_packageId: { userId: user.id, packageId } }, update: {}, create: { userId: user.id, packageId } });
  return ok({ saved: true }, { status: 201 });
});

export const DELETE = route(async (req) => {
  const user = await requireCustomer();
  const { packageId } = await parseBody(req, schema);
  await db.wishlist.deleteMany({ where: { userId: user.id, packageId } });
  return ok({ saved: false });
});
