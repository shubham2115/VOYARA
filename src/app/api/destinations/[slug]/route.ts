import { ApiError, ok, route } from "@/lib/api";
import { getDestination } from "@/server/services/catalog";

export const GET = route(async (_req, ctx) => {
  const d = await getDestination((await ctx.params).slug);
  if (!d) throw new ApiError(404, "Destination not found");
  return ok(d);
});
