"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-navy-400">An unexpected error occurred. You can try again, or head back to the home page.</p>
      {error.digest && <p className="mt-1 text-xs text-navy-300">Reference: {error.digest}</p>}
      <div className="mt-6 flex gap-3"><Button onClick={reset}>Try again</Button><Button variant="outline" asChild><Link href="/">Home</Link></Button></div>
    </div>
  );
}
