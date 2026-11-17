import { CheckCircle2, Circle } from "lucide-react";
import { cn, formatDate, humanize } from "@/lib/utils";

const FLOW = ["NEW", "UNDER_REVIEW", "CONTACTED", "QUOTATION_SENT", "CUSTOMER_APPROVED", "BOOKING_CONFIRMED"];

/** Progress tracker plus dated activity log for an enquiry. */
export function EnquiryTimeline({ status, activities }: { status: string; activities: { id: string; type: string; toStatus: string | null; detail: string | null; createdAt: Date }[] }) {
  const terminal = status === "CANCELLED" || status === "CLOSED";
  const idx = FLOW.indexOf(status);
  return (
    <div>
      <ol className="flex items-start overflow-x-auto pb-2" aria-label="Enquiry progress">
        {FLOW.map((s, i) => {
          const reached = !terminal && i <= idx;
          return (
            <li key={s} className="flex min-w-[96px] flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : reached ? "bg-emerald-500" : "bg-navy-100")} />
                {reached ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-navy-200" />}
                <span className={cn("h-0.5 flex-1", i === FLOW.length - 1 ? "bg-transparent" : !terminal && i < idx ? "bg-emerald-500" : "bg-navy-100")} />
              </div>
              <span className={cn("mt-1 text-[11px] leading-tight", reached ? "font-semibold text-navy" : "text-navy-300")}>{humanize(s)}</span>
            </li>
          );
        })}
      </ol>
      {terminal && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">This enquiry is {humanize(status)}.</p>}
      <ul className="mt-6 space-y-3 border-l-2 border-navy-100 pl-4">
        {activities.map((a) => (
          <li key={a.id} className="relative text-sm">
            <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
            <p className="font-medium">{a.toStatus ? humanize(a.toStatus) : humanize(a.type)}</p>
            <p className="text-xs text-navy-400">{formatDate(a.createdAt)}{a.detail ? ` · ${a.detail}` : ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
