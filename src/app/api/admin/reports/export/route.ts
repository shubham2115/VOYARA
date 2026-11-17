import { db } from "@/lib/db";
import { ApiError, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { audit } from "@/lib/audit";

const esc = (v: unknown) => {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};
const csv = (head: string[], rows: unknown[][]) => [head.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");

export const GET = route(async (req) => {
  const user = await requireApiUser("report:view");
  const type = new URL(req.url).searchParams.get("type");
  let body: string;
  if (type === "bookings") {
    const rows = await db.booking.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } }, package: { select: { name: true } } } });
    body = csv(["Reference", "Customer", "Email", "Package", "Travel date", "Status", "Total", "Paid", "Created"], rows.map((b) => [b.reference, b.user.name, b.user.email, b.package?.name, b.travelDate, b.status, b.totalAmount, b.amountPaid, b.createdAt]));
  } else if (type === "enquiries") {
    const rows = await db.enquiry.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { package: { select: { name: true } }, assignedTo: { select: { name: true } } } });
    body = csv(["Reference", "Name", "Email", "Phone", "Package", "Status", "Assigned", "Travel date", "Created"], rows.map((e) => [e.reference, e.name, e.email, e.phone, e.package?.name, e.status, e.assignedTo?.name, e.travelDate, e.createdAt]));
  } else if (type === "payments") {
    const rows = await db.payment.findMany({ where: { status: "PAID" }, orderBy: { paidAt: "desc" }, include: { booking: { select: { reference: true } } } });
    body = csv(["Booking", "Amount", "Method", "Reference", "Paid at"], rows.map((p) => [p.booking.reference, p.amount, p.method, p.reference, p.paidAt]));
  } else throw new ApiError(400, "type must be bookings, enquiries or payments");
  await audit(user.id, "REPORT_EXPORT", "Report", type);
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"` } });
});
