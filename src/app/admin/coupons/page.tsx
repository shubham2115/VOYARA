import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge } from "@/components/ui/misc";
import { CouponForm, CouponToggle, RowDelete } from "@/components/admin/content-admin";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Coupons & Offers" };
export const dynamic = "force-dynamic";

export default async function Coupons() {
  await requirePageUser({ permission: "coupon:manage" });
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6"><h1 className="text-3xl">Coupons & Offers</h1><CouponForm />
      <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Code", "Discount", "Min order", "Used", "Valid until", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-navy-50">{coupons.map((c) => (
          <tr key={c.id}><td className="px-4 py-3 font-mono font-semibold">{c.code}</td><td className="px-4 py-3">{c.discountType === "PERCENT" ? `${c.value}%${c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ""}` : formatINR(c.value)}</td><td className="px-4 py-3">{formatINR(c.minAmount)}</td><td className="px-4 py-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td><td className="px-4 py-3">{formatDate(c.validUntil)}</td><td className="px-4 py-3"><Badge tone={c.isActive ? "green" : "gray"}>{c.isActive ? "Active" : "Disabled"}</Badge></td>
            <td className="flex justify-end gap-1 px-4 py-2"><CouponToggle id={c.id} isActive={c.isActive} /><RowDelete url={`/api/admin/coupons/${c.id}`} label={c.code} description="Coupons already used on bookings are deactivated instead of deleted." /></td></tr>))}</tbody></table></div></div>
  );
}
