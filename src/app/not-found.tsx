import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-5xl">This road leads nowhere</h1>
      <p className="mt-3 max-w-md text-navy-400">The page you are looking for does not exist or has moved.</p>
      <div className="mt-6 flex gap-3"><Button asChild><Link href="/">Back home</Link></Button><Button asChild variant="outline"><Link href="/destinations">Browse destinations</Link></Button></div>
    </div>
  );
}
