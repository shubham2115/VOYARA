import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Cancellation & Refund Policy" };
export default function Page() {
  return <PolicyPage title="Cancellation & Refund Policy" updated="1 January 2026" sections={[
    ["Customer cancellations", "15 or more days before departure: full refund less a processing fee. 8–14 days: 50% refund. 7 days or fewer: no refund."],
    ["Non-refundable items", "Flight tickets, permits and pre-paid non-cancellable hotel bookings are refunded only as per the supplier's policy."],
    ["Cancellation by Voyara", "If we cancel for reasons within our control you receive a full refund or an alternative of equal value."],
    ["Refund timeline", "Approved refunds are returned to the original payment method within 7–10 working days."],
  ]} />;
}
