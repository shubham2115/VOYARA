import { ok, pageParams, route } from "@/lib/api";
import { listDestinations } from "@/server/services/catalog";

export const GET = route(async (req) => {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, size } = pageParams(url);
  const r = await listDestinations({ q: sp.get("q") ?? undefined, state: sp.get("state") ?? undefined, category: sp.get("category") ?? undefined, sort: sp.get("sort") ?? undefined, page, pageSize: size });
  return ok(r.items, { meta: { total: r.total, page: r.page, pageSize: r.pageSize, totalPages: r.totalPages } });
});
