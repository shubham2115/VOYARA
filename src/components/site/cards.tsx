import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/misc";
import { formatINR } from "@/lib/utils";
import { WishlistButton } from "./wishlist-button";
import { CompareToggle } from "./compare-bar";

export type DestinationCardData = {
  slug: string; name: string; state: string; coverImage: string; tagline: string | null;
  category?: { name: string } | null; _count?: { packages: number };
};

export function DestinationCard({ d, priority }: { d: DestinationCardData; priority?: boolean }) {
  return (
    <Link href={`/destinations/${d.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-card">
      <SafeImage src={d.coverImage} alt={`${d.name}, ${d.state}`} fill priority={priority} sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/10 to-transparent" />
      {d.category && <Badge tone="gold" className="absolute left-3 top-3">{d.category.name}</Badge>}
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="font-serif text-2xl">{d.name}</h3>
        <p className="flex items-center gap-1 text-sm text-white/80"><MapPin className="h-3.5 w-3.5" /> {d.state}</p>
        {d.tagline && <p className="mt-1 line-clamp-2 text-sm text-white/70 opacity-0 transition-opacity group-hover:opacity-100">{d.tagline}</p>}
        {d._count && <p className="mt-2 text-xs text-gold-200">{d._count.packages} package{d._count.packages === 1 ? "" : "s"}</p>}
      </div>
    </Link>
  );
}

export type PackageCardData = {
  id: string; slug: string; name: string; coverImage: string; durationDays: number; durationNights: number;
  price: number; discountedPrice: number | null; ratingAvg: number; ratingCount: number; hotelCategory: string;
  destination: { name: string; state?: string };
};

export function PackageCard({ p, wished, showWishlist = true }: { p: PackageCardData; wished?: boolean; showWishlist?: boolean }) {
  const final = p.discountedPrice ?? p.price;
  const off = p.discountedPrice ? Math.round(((p.price - p.discountedPrice) / p.price) * 100) : 0;
  return (
    <article className="card group overflow-hidden transition-shadow hover:shadow-lift">
      <div className="relative aspect-[16/11] overflow-hidden">
        <Link href={`/packages/${p.slug}`} aria-label={p.name}>
          <SafeImage src={p.coverImage} alt={p.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>
        {off > 0 && <Badge tone="gold" className="absolute left-3 top-3 font-semibold">{off}% OFF</Badge>}
        {showWishlist && <WishlistButton packageId={p.id} initial={!!wished} className="absolute right-3 top-3" />}
      </div>
      <div className="space-y-3 p-5">
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gold-600"><MapPin className="h-3.5 w-3.5" /> {p.destination.name}</p>
        <h3 className="font-serif text-xl leading-snug"><Link href={`/packages/${p.slug}`} className="hover:text-gold-600">{p.name}</Link></h3>
        <div className="flex items-center gap-3 text-sm text-navy-400">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {p.durationNights}N/{p.durationDays}D</span>
          <span>{p.hotelCategory.charAt(0) + p.hotelCategory.slice(1).toLowerCase()} stay</span>
          {p.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" /> {p.ratingAvg.toFixed(1)}</span>}
        </div>
        <div className="flex items-end justify-between border-t border-navy-100 pt-3">
          <div>
            {p.discountedPrice && <p className="text-xs text-navy-300 line-through">{formatINR(p.price)}</p>}
            <p className="text-lg font-bold text-navy">{formatINR(final)} <span className="text-xs font-normal text-navy-400">/ person</span></p>
          </div>
          <CompareToggle slug={p.slug} />
        </div>
      </div>
    </article>
  );
}
