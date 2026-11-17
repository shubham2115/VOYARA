import { MessageCircle } from "lucide-react";

export const waLink = (number: string, text = "Hi Voyara, I would like help planning a trip.") =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export function WhatsAppButton({ number }: { number: string }) {
  return (
    <a
      href={waLink(number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
