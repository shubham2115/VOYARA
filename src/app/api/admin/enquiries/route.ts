import { ok, pageMeta, pageParams, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { listEnquiries } from "@/server/services/admin-enquiries";

export const GET = route(async (req) => {
  const user = await requireApiUser(["enquiry:read:all", "enquiry:read:assigned"]);
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, size } = pageParams(url, { size: 15, max: 100 });
  const r = await listEnquiries(user, { q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, assigned: sp.get("assigned") ?? undefined, sort: sp.get("sort") ?? undefined, page, size });
  return ok(r.items, { meta: pageMeta(r.total, page, size) });
});
