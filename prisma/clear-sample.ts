import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const DOMAIN = "sample.voyara.dev";

/** Removes demo customers/staff and all of their enquiries, bookings, payments and reviews. */
async function main() {
  const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await db.payment.deleteMany({ where: { booking: { userId: { in: ids } } } });
  await db.review.deleteMany({ where: { userId: { in: ids } } });
  await db.booking.deleteMany({ where: { userId: { in: ids } } });
  await db.enquiry.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
  const r = await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.tourPackage.updateMany({ data: { ratingAvg: 0, ratingCount: 0 } });
  console.log(`Removed ${r.count} sample users and their data.`);
}
main().finally(() => db.$disconnect());
