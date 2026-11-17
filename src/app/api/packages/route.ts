import { ok, pageParams, route } from "@/lib/api";
import { listPackages } from "@/server/services/catalog";

const n = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export const GET = route(async (req) => {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, size } = pageParams(url);
  const r = await listPackages({
    destination: sp.get("destination") ?? undefined, minPrice: n(sp.get("minPrice")), maxPrice: n(sp.get("maxPrice")),
    minDays: n(sp.get("minDays")), maxDays: n(sp.get("maxDays")), theme: sp.get("theme") ?? undefined, hotel: sp.get("hotel") ?? undefined,
    tier: sp.get("tier") ?? undefined, travelType: sp.get("type") ?? undefined, city: sp.get("city") ?? undefined,
    q: sp.get("q") ?? undefined, sort: sp.get("sort") ?? undefined, page, pageSize: size,
  });
  return ok(r.items, { meta: { total: r.total, page: r.page, pageSize: r.pageSize, totalPages: r.totalPages } });
});
