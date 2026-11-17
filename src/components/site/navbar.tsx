import Link from "next/link";
import { User } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";

export const NAV_LINKS = [
  { href: "/destinations", label: "Destinations" },
  { href: "/packages", label: "Packages" },
  { href: "/customize-trip", label: "Customize Trip" },
  { href: "/ai-planner", label: "AI Planner" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const session = await auth();
  const user = session?.user;
  const dash = user?.role === "CUSTOMER" ? "/account" : "/admin";
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100/70 bg-ivory/85 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-bold tracking-wide text-navy">
          VOYARA<span className="text-gold">.</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-navy-600 transition-colors hover:text-gold-600">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button asChild variant="outline" size="sm">
              <Link href={dash}><User className="h-4 w-4" /> {user.role === "CUSTOMER" ? "My Account" : "Admin"}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
              <Button asChild variant="gold" size="sm"><Link href="/register">Join free</Link></Button>
            </>
          )}
        </div>
        <MobileMenu links={NAV_LINKS} signedIn={!!user} dashHref={dash} />
      </div>
    </header>
  );
}
