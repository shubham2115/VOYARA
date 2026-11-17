import Link from "next/link";
import { Suspense } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-800 to-navy-600 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center font-serif text-3xl font-bold text-white">VOYARA<span className="text-gold">.</span></Link>
        <div className="rounded-3xl bg-white p-8 shadow-lift"><Suspense>{children}</Suspense></div>
      </div>
    </div>
  );
}
