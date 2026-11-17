import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container py-12" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-6 w-40" /><Skeleton className="mt-4 h-12 w-2/3" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}</div>
    </div>
  );
}
