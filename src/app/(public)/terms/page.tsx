import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Terms & Conditions" };
export default function Page() {
  return <PolicyPage title="Terms & Conditions" updated="1 January 2026" sections={[
    ["Bookings", "An enquiry is not a confirmed booking. A booking is confirmed once we issue a confirmation and receive the required advance payment."],
    ["Pricing", "Prices are per person and subject to availability and seasonal changes until confirmed in a quotation. Taxes are charged as applicable."],
    ["Traveller responsibilities", "Travellers must carry valid photo ID and any permits we specify, and follow local laws and guide instructions."],
    ["Changes to itinerary", "We may alter itineraries because of weather, safety, strikes or force majeure, offering comparable alternatives where possible."],
    ["Liability", "Voyara acts as an organiser; third-party providers are responsible for their services, subject to applicable law."],
  ]} />;
}
