import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { requirePageUser } from "@/lib/session";
import { AccountNav } from "@/components/site/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return (
    <>
      <Navbar />
      <div className="container grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-serif text-xl">Hello, {user.name.split(" ")[0]}</p>
          <p className="mb-4 truncate text-sm text-navy-400">{user.email}</p>
          <AccountNav />
          {user.role !== "CUSTOMER" && <Link href="/admin" className="mt-4 block text-sm font-semibold text-gold-600">Go to admin portal →</Link>}
        </aside>
        <main id="main" className="min-w-0">{children}</main>
      </div>
    </>
  );
}
