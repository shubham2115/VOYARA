import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AiPlannerForm } from "@/components/site/ai-planner-form";

export const metadata: Metadata = { title: "AI Trip Planner", description: "Get a suggested day-wise itinerary for your India trip in seconds." };
export const dynamic = "force-dynamic";

export default async function AiPlannerPage() {
  const dests = await db.destination.findMany({ where: { isPublished: true, deletedAt: null }, select: { name: true }, orderBy: { name: "asc" } });
  return (
    <div className="container max-w-3xl py-12">
      <p className="eyebrow">AI trip planner</p><h1 className="mt-2 text-4xl md:text-5xl">Plan a trip in seconds</h1>
      <p className="mb-8 mt-3 text-navy-400">Tell us where, how long and what you love. We will draft a day-wise itinerary you can refine with our experts.</p>
      <AiPlannerForm destinations={dests.map((d) => d.name)} />
    </div>
  );
}
