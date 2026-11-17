import { ApiError, limit, ok, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { storeImage } from "@/server/integrations/storage";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const user = await requireApiUser(["destination:manage", "package:manage", "blog:manage", "cms:manage"]);
  limit(req, "upload", 60, 60 * 60_000, user.id);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "Attach an image as form field 'file'");
  try {
    return ok(await storeImage(file), { status: 201 });
  } catch (e) {
    throw new ApiError(422, e instanceof Error ? e.message : "Upload failed");
  }
});
