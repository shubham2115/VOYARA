import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Row = { month: Date; n: bigint | number };

const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const lastMonths = (n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - (n - 1 - i)); return monthKey(d); });
const label = (k: string) => new Date(`${k}-01T00:00:00Z`).toLocaleString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });

function fill(keys: string[], rows: Row[]) {
  const map = new Map(rows.map((r) => [monthKey(new Date(r.month)), Number(r.n)]));
  return keys.map((k) => ({ month: label(k), value: map.get(k) ?? 0 }));
}

/** `staffId` scopes enquiry/booking numbers to a staff member's assignments; undefined = whole business (admin). */
export async function getDashboard(staffId?: string) {
  const since = new Date(); since.setUTCMonth(since.getUTCMonth() - 5); since.setUTCDate(1); since.setUTCHours(0, 0, 0, 0);
  const eWhere = { deletedAt: null, ...(staffId && { assignedToId: staffId }) };
  const bWhere = { deletedAt: null, ...(staffId && { assignedToId: staffId }) };
  const keys = lastMonths(6);
  const eScope = staffId ? Prisma.sql`AND "assignedToId" = ${staffId}` : Prisma.empty;
  const pScope = staffId ? Prisma.sql`AND "bookingId" IN (SELECT id FROM "Booking" WHERE "assignedToId" = ${staffId})` : Prisma.empty;

  const [totalEnq, newEnq, totalBook, confirmed, customers, revenue, enqByStatus, enqMonthly, bookMonthly, revMonthly, topDest, topPkg] = await Promise.all([
    db.enquiry.count({ where: eWhere }),
    db.enquiry.count({ where: { ...eWhere, status: "NEW" } }),
    db.booking.count({ where: bWhere }),
    db.booking.count({ where: { ...bWhere, status: { in: ["CONFIRMED", "PAYMENT_PENDING", "PARTIALLY_PAID", "FULLY_PAID", "COMPLETED"] } } }),
    staffId ? Promise.resolve(0) : db.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", ...(staffId && { booking: { assignedToId: staffId } }) } }),
    db.enquiry.groupBy({ by: ["status"], where: eWhere, _count: true }),
    db.$queryRaw<Row[]>`SELECT date_trunc('month', "createdAt") AS month, COUNT(*) AS n FROM "Enquiry" WHERE "deletedAt" IS NULL AND "createdAt" >= ${since} ${eScope} GROUP BY 1`,
    db.$queryRaw<Row[]>`SELECT date_trunc('month', "createdAt") AS month, COUNT(*) AS n FROM "Booking" WHERE "deletedAt" IS NULL AND "createdAt" >= ${since} ${eScope} GROUP BY 1`,
    db.$queryRaw<Row[]>`SELECT date_trunc('month', "paidAt") AS month, COALESCE(SUM(amount),0) AS n FROM "Payment" WHERE status = 'PAID' AND "paidAt" >= ${since} ${pScope} GROUP BY 1`,
    db.enquiry.groupBy({ by: ["destinationId"], where: { ...eWhere, destinationId: { not: null } }, _count: true, orderBy: { _count: { destinationId: "desc" } }, take: 6 }),
    db.enquiry.groupBy({ by: ["packageId"], where: { ...eWhere, packageId: { not: null } }, _count: true, orderBy: { _count: { packageId: "desc" } }, take: 6 }),
  ]);

  const [dests, pkgs] = await Promise.all([
    db.destination.findMany({ where: { id: { in: topDest.map((t) => t.destinationId!) } }, select: { id: true, name: true } }),
    db.tourPackage.findMany({ where: { id: { in: topPkg.map((t) => t.packageId!) } }, select: { id: true, name: true } }),
  ]);

  return {
    cards: { totalEnq, newEnq, totalBook, confirmed, customers, revenue: revenue._sum.amount ?? 0, conversion: totalEnq ? Math.round((totalBook / totalEnq) * 1000) / 10 : 0 },
    enquiriesMonthly: fill(keys, enqMonthly),
    bookingsMonthly: fill(keys, bookMonthly),
    revenueMonthly: fill(keys, revMonthly),
    topDestinations: topDest.map((t) => ({ name: dests.find((d) => d.id === t.destinationId)?.name ?? "—", value: t._count })),
    topPackages: topPkg.map((t) => ({ name: pkgs.find((p) => p.id === t.packageId)?.name ?? "—", value: t._count })),
    funnel: enqByStatus.map((s) => ({ name: s.status.replace(/_/g, " "), value: s._count })),
  };
}
