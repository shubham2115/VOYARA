import { ApiError, route } from "@/lib/api";
import { getPackage } from "@/server/services/catalog";
import { itineraryPdf, pdfResponse } from "@/server/integrations/pdf";

export const runtime = "nodejs";

export const GET = route(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const p = await getPackage(slug);
  if (!p) throw new ApiError(404, "Package not found");
  const buf = await itineraryPdf({
    name: p.name, destination: p.destination.name, durationDays: p.durationDays, durationNights: p.durationNights,
    hotelInfo: p.hotelInfo, transportInfo: p.transportInfo, cancellationPolicy: p.cancellationPolicy,
    itinerary: p.itinerary, inclusions: p.inclusions.map((i) => i.text), exclusions: p.exclusions.map((i) => i.text),
  });
  return pdfResponse(buf, `${p.slug}-itinerary.pdf`);
});
