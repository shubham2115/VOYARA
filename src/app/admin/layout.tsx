import Link from "next/link";
import { requirePageUser } from "@/lib/session";
import { can, canAny, type Permission } from "@/lib/rbac";
import { AdminNav } from "@/components/admin/admin-nav";
import { ADMIN_ITEMS } from "@/components/admin/nav-items";
import { Badge } from "@/components/ui/misc";

export const metadata = { title: { default: "Admin", template: "%s | Voyara Admin" }, robots: { index: false, follow: false } };

const ALIASES: Record<string, Permission[]> = {
  "enquiry:read": ["enquiry:read:all", "enquiry:read:assigned"],
  "booking:read": ["booking:read:all", "booking:read:assigned"],
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ permission: "admin:access" });
  const allowed = ADMIN_ITEMS.filter((i) => (ALIASES[i.perm] ? canAny(user.role, ALIASES[i.perm]) : can(user.role, i.perm as Permission))).map((i) => i.href as string);
  return (
    <div className="flex min-h-screen bg-navy-50/60">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-800 lg:flex">
        <Link href="/admin" className="px-6 py-5 font-serif text-2xl font-bold text-white">VOYARA<span className="text-gold">.</span> <span className="font-sans text-xs font-normal text-navy-300">Admin</span></Link>
        <AdminNav allowed={allowed} />
        <div className="border-t border-white/10 p-4 text-xs text-navy-200"><p className="truncate font-medium text-white">{user.name}</p><Badge tone="gold" className="mt-1">{user.role}</Badge> <Link href="/" className="ml-2 underline">View site</Link></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-navy-100 bg-white px-4 py-3 lg:hidden"><span className="font-serif text-xl font-bold">VOYARA<span className="text-gold">.</span> Admin</span><Badge tone="gold">{user.role}</Badge></header>
        <div className="overflow-x-auto border-b border-navy-100 bg-navy-800 px-2 lg:hidden"><AdminNavMobile allowed={allowed} /></div>
        <main id="main" className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function AdminNavMobile({ allowed }: { allowed: string[] }) {
  return (
    <ul className="flex gap-1 py-2 text-xs">
      {ADMIN_ITEMS.filter((i) => allowed.includes(i.href)).map((i) => <li key={i.href}><Link href={i.href} className="block whitespace-nowrap rounded-lg px-3 py-1.5 text-navy-100 hover:bg-white/10">{i.label}</Link></li>)}
    </ul>
  );
}
