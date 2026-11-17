import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/** Shows only whether each integration is configured, never the secret values. */
const INTEGRATIONS: [string, string[], string][] = [
  ["Email (Resend)", ["RESEND_API_KEY"], "Without it (and SMTP) emails are logged to the server console."],
  ["Email (SMTP)", ["SMTP_HOST"], "Alternative to Resend."],
  ["Cloudinary uploads", ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"], "Without it uploads are stored locally (development only)."],
  ["Razorpay payments", ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"], "Without it customers cannot pay online; record offline payments instead."],
  ["OpenAI trip planner", ["OPENAI_API_KEY"], "Without it the planner builds itineraries from your own packages."],
  ["Google Maps", ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"], "Without it the interactive India map uses the built-in state grid."],
];

export default async function Settings() {
  await requirePageUser({ permission: "settings:manage" });
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { actor: { select: { name: true } } } });
  return (
    <div className="space-y-8"><h1 className="text-3xl">Settings</h1>
      <section><h2 className="mb-3 text-xl">Integrations</h2><p className="mb-3 text-sm text-navy-400">Configured through environment variables on the server. Values are never displayed.</p>
        <div className="card divide-y divide-navy-50">{INTEGRATIONS.map(([n, keys, note]) => { const on = keys.every((k) => !!process.env[k]); return (
          <div key={n} className="flex items-start gap-3 px-5 py-3 text-sm">{on ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 text-navy-200" />}<div><p className="font-medium">{n} <span className="font-mono text-xs text-navy-300">{keys.join(", ")}</span></p>{!on && <p className="text-xs text-navy-400">{note}</p>}</div></div>); })}</div></section>
      <section><h2 className="mb-3 text-xl">Audit log (latest 40)</h2>
        <div className="card overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["When", "Actor", "Action", "Entity"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-navy-50">{logs.map((l) => <tr key={l.id}><td className="px-4 py-2">{formatDate(l.createdAt)}</td><td className="px-4 py-2">{l.actor?.name ?? "system"}</td><td className="px-4 py-2 font-mono text-xs">{l.action}</td><td className="px-4 py-2 text-xs text-navy-400">{l.entity} {l.entityId?.slice(0, 10)}</td></tr>)}</tbody></table></div></section></div>
  );
}
