import { db } from "@/lib/db";
import { ApiError, ok, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import { cmsSchemas, type CmsKey } from "@/server/services/admin-content";

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("cms:manage");
  const key = (await ctx.params).key as CmsKey;
  const schema = cmsSchemas[key];
  if (!schema) throw new ApiError(404, "Unknown content block");
  const json = await req.json().catch(() => { throw new ApiError(400, "Invalid JSON body"); });
  const value = schema.parse(json);
  await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  await audit(user.id, "CMS_UPDATE", "SiteSetting", key);
  return ok({ key });
});
