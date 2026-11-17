import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return <div className="space-y-4" aria-busy="true" aria-label="Loading"><Skeleton className="h-10 w-56" />{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>;
}
