import { limit, ok, parseBody, route } from "@/lib/api";
import { generatePlan, planRequestSchema } from "@/server/services/ai-planner";

export const maxDuration = 45;

export const POST = route(async (req) => {
  limit(req, "ai-plan", 8, 60 * 60_000);
  const r = await parseBody(req, planRequestSchema);
  return ok(await generatePlan(r));
});
