import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Privacy Policy" };
export default function Page() {
  return <PolicyPage title="Privacy Policy" updated="1 January 2026" sections={[
    ["Information we collect", "We collect the details you submit — name, email, phone, travel preferences — when you register, send an enquiry, book a trip or contact us."],
    ["How we use it", "To respond to enquiries, prepare quotations, process bookings and payments, send service communications and improve our offerings."],
    ["Sharing", "We share data only with service providers needed to fulfil your trip (hotels, transport, payment processors) and when legally required. We never sell personal data."],
    ["Security & retention", "Passwords are hashed, payments are processed by Razorpay and we never store card details. We retain records as required for accounting and legal purposes."],
    ["Your rights", "You may request access, correction or deletion of your data by contacting us."],
  ]} />;
}
