import "server-only";
import PDFDocument from "pdfkit";

function render(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    build(doc);
    doc.end();
  });
}

const inr = (n: number) => `INR ${new Intl.NumberFormat("en-IN").format(n)}`;
const NAVY = "#0b1f3a";
const GOLD = "#a98235";

function header(doc: PDFKit.PDFDocument, title: string) {
  doc.rect(0, 0, doc.page.width, 70).fill(NAVY);
  doc.fillColor("#e0b45a").fontSize(22).font("Helvetica-Bold").text("VOYARA", 50, 24);
  doc.fillColor("#ffffff").fontSize(11).font("Helvetica").text(title, 50, 28, { align: "right" });
  doc.fillColor(NAVY).moveDown(3).y = 100;
}

export type ItineraryData = {
  name: string; destination: string; durationDays: number; durationNights: number; hotelInfo?: string | null; transportInfo?: string | null;
  itinerary: { dayNumber: number; title: string; description: string; meals: string[]; stay?: string | null }[];
  inclusions: string[]; exclusions: string[]; cancellationPolicy?: string | null;
};

export const itineraryPdf = (p: ItineraryData) =>
  render((doc) => {
    header(doc, "Tour Itinerary");
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20).text(p.name);
    doc.font("Helvetica").fontSize(11).fillColor("#555").text(`${p.destination} · ${p.durationNights} Nights / ${p.durationDays} Days`).moveDown();
    if (p.hotelInfo) doc.text(`Stay: ${p.hotelInfo}`);
    if (p.transportInfo) doc.text(`Transport: ${p.transportInfo}`);
    doc.moveDown();
    for (const d of p.itinerary) {
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(12).text(`Day ${d.dayNumber}: ${d.title}`);
      doc.fillColor("#222").font("Helvetica").fontSize(10.5).text(d.description);
      doc.fillColor("#777").fontSize(9).text(`Meals: ${d.meals.join(", ") || "None"}${d.stay ? `  |  Stay: ${d.stay}` : ""}`).moveDown(0.8);
    }
    const list = (t: string, items: string[]) => {
      if (!items.length) return;
      doc.moveDown(0.5).fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text(t);
      doc.font("Helvetica").fontSize(10).fillColor("#222");
      items.forEach((i) => doc.text(`• ${i}`));
    };
    list("Inclusions", p.inclusions);
    list("Exclusions", p.exclusions);
    if (p.cancellationPolicy) { doc.moveDown().font("Helvetica-Bold").fontSize(13).fillColor(NAVY).text("Cancellation policy"); doc.font("Helvetica").fontSize(10).fillColor("#222").text(p.cancellationPolicy); }
  });

export type InvoiceData = {
  reference: string; issuedAt: Date; customer: { name: string; email: string; phone?: string | null };
  packageName: string; travelDate: Date; adults: number; children: number; totalAmount: number; discountAmount: number; amountPaid: number;
  payments: { amount: number; method: string; paidAt: Date | null; reference?: string | null }[]; status: string;
};

export const invoicePdf = (b: InvoiceData) =>
  render((doc) => {
    header(doc, `Invoice ${b.reference}`);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(18).text("Booking Invoice");
    doc.font("Helvetica").fontSize(10).fillColor("#555").text(`Issued: ${b.issuedAt.toDateString()}  |  Status: ${b.status}`).moveDown();
    doc.fillColor(NAVY).font("Helvetica-Bold").text("Billed to").font("Helvetica").fillColor("#222").text(b.customer.name).text(b.customer.email);
    if (b.customer.phone) doc.text(b.customer.phone);
    doc.moveDown().font("Helvetica-Bold").fillColor(NAVY).text("Trip").font("Helvetica").fillColor("#222")
      .text(b.packageName).text(`Travel date: ${b.travelDate.toDateString()}  |  Travellers: ${b.adults} adult(s), ${b.children} child(ren)`).moveDown();
    const row = (l: string, v: string, bold = false) => { doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(11).fillColor("#222").text(l, 50, doc.y, { continued: true, width: 300 }).text(v, { align: "right" }); };
    row("Package total", inr(b.totalAmount + b.discountAmount));
    if (b.discountAmount) row("Discount", `- ${inr(b.discountAmount)}`);
    row("Net amount", inr(b.totalAmount), true);
    row("Amount paid", inr(b.amountPaid));
    row("Balance due", inr(Math.max(0, b.totalAmount - b.amountPaid)), true);
    if (b.payments.length) {
      doc.moveDown().font("Helvetica-Bold").fillColor(NAVY).text("Payments");
      b.payments.forEach((p) => doc.font("Helvetica").fontSize(10).fillColor("#222").text(`${p.paidAt?.toDateString() ?? "-"} · ${p.method} · ${inr(p.amount)}${p.reference ? ` · ${p.reference}` : ""}`));
    }
    doc.moveDown(2).fontSize(9).fillColor("#888").text("This is a system-generated invoice. Thank you for travelling with Voyara.", { align: "center" });
  });

export const pdfResponse = (buf: Buffer, filename: string) =>
  new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` } });
