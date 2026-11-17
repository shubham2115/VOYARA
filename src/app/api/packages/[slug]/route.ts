import { ApiError, ok, route } from "@/lib/api";
import { getPackage } from "@/server/services/catalog";

export const GET = route(async (_req, ctx) => {
  const p = await getPackage((await ctx.params).slug);
  if (!p) throw new ApiError(404, "Package not found");
  return ok(p);
});
