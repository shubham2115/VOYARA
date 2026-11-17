import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, EmptyState } from "@/components/ui/misc";
import { MarkRead } from "@/components/admin/content-admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Messages & Subscribers" };
export const dynamic = "force-dynamic";

export default async function Messages() {
  await requirePageUser({ permission: "cms:manage" });
  const [msgs, subs, subCount] = await Promise.all([
    db.contactMessage.findMany({ orderBy: [{ isRead: "asc" }, { createdAt: "desc" }], take: 50 }),
    db.newsletterSubscription.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.newsletterSubscription.count({ where: { isActive: true } }),
  ]);
  return (
    <div className="space-y-8"><h1 className="text-3xl">Messages & Subscribers</h1>
      <section><h2 className="mb-3 text-xl">Contact messages</h2>{msgs.length === 0 ? <EmptyState title="No messages" /> : <ul className="space-y-3">{msgs.map((m) => (
        <li key={m.id} className="card flex flex-wrap justify-between gap-3 p-5"><div><p className="font-medium">{m.subject} {!m.isRead && <Badge tone="blue">New</Badge>}</p><p className="text-xs text-navy-400">{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ""} · {formatDate(m.createdAt)}</p><p className="mt-2 whitespace-pre-line text-sm">{m.message}</p></div>{!m.isRead && <MarkRead id={m.id} />}</li>))}</ul>}</section>
      <section><h2 className="mb-3 text-xl">Newsletter subscribers ({subCount})</h2><div className="card divide-y divide-navy-50">{subs.map((s) => <p key={s.id} className="flex justify-between px-5 py-2 text-sm"><span>{s.email}</span><span className="text-navy-400">{formatDate(s.createdAt)}</span></p>)}</div></section></div>
  );
}
