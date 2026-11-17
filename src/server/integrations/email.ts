import "server-only";
import nodemailer from "nodemailer";

export type MailInput = { to: string; subject: string; html: string };

const FROM = process.env.EMAIL_FROM ?? "Voyara <no-reply@example.com>";

/**
 * Sends email via Resend (RESEND_API_KEY) or SMTP (SMTP_HOST). When neither is configured the message is
 * logged to the server console so flows stay testable in development. Never throws to callers.
 */
export async function sendMail({ to, subject, html }: MailInput): Promise<{ sent: boolean; provider: string }> {
  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const r = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to, subject, html });
      if (r.error) throw new Error(r.error.message);
      return { sent: true, provider: "resend" };
    }
    if (process.env.SMTP_HOST) {
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await t.sendMail({ from: FROM, to, subject, html });
      return { sent: true, provider: "smtp" };
    }
    console.info(`[email:fallback] to=${to} subject="${subject}"\n${html.replace(/<[^>]+>/g, " ").slice(0, 400)}`);
    return { sent: false, provider: "console" };
  } catch (e) {
    console.error("[email] failed", e);
    return { sent: false, provider: "error" };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const layout = (title: string, body: string) => `
<div style="font-family:Georgia,serif;max-width:560px;margin:auto;border:1px solid #e5e0d3;border-radius:12px;overflow:hidden">
  <div style="background:#0b1f3a;color:#e0b45a;padding:20px 24px;font-size:22px;letter-spacing:1px">VOYARA</div>
  <div style="padding:24px;color:#1f2937;line-height:1.6"><h2 style="margin-top:0;color:#0b1f3a">${esc(title)}</h2>${body}</div>
  <div style="background:#faf7f0;padding:14px 24px;font-size:12px;color:#6b7280">Discover India, One Journey at a Time.</div>
</div>`;

export const emails = {
  enquiryReceived: (name: string, ref: string) =>
    layout("We received your enquiry", `<p>Hi ${esc(name)},</p><p>Thank you for choosing Voyara. Your enquiry <b>${esc(ref)}</b> is with our travel experts, who will reach out shortly.</p>`),
  quotationSent: (name: string, ref: string, number: string, total: string) =>
    layout("Your quotation is ready", `<p>Hi ${esc(name)},</p><p>Quotation <b>${esc(number)}</b> for enquiry ${esc(ref)} totals <b>${esc(total)}</b>. Sign in to your account to review it, or simply reply to this email.</p>`),
  bookingConfirmed: (name: string, ref: string) =>
    layout("Your booking is confirmed", `<p>Hi ${esc(name)},</p><p>Great news — booking <b>${esc(ref)}</b> is confirmed. You can track it and download your itinerary from your dashboard.</p>`),
  resetPassword: (name: string, link: string) =>
    layout("Reset your password", `<p>Hi ${esc(name)},</p><p>Use the link below within 1 hour to choose a new password:</p><p><a href="${esc(link)}">${esc(link)}</a></p><p>If you did not request this, ignore this email.</p>`),
};
