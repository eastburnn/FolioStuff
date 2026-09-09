import { Resend } from "resend";
import {
  adminNewSubmissionEmail,
  approvedEmail,
  rejectedEmail,
  contactEmail,
  directMessageEmail,
  type ContactFields,
  type DirectMessageFields,
  type EmailContent,
} from "./email-templates";

// All senders no-op quietly when RESEND_API_KEY is missing, so the app
// works end to end before email is configured.

const FROM = process.env.EMAIL_FROM ?? "FolioStuff <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// Senders the admin can pick for a direct message. Any address on the
// verified sending domain works, so the personal one is derived from the
// site address unless EMAIL_FROM_PERSONAL says otherwise.
const SENDING_DOMAIN = /@([^>\s]+)/.exec(FROM)?.[1] ?? "resend.dev";
const PERSONAL_FROM = process.env.EMAIL_FROM_PERSONAL ?? `Chris at FolioStuff <chris@${SENDING_DOMAIN}>`;
export const SENDERS = [
  { key: "site", from: FROM },
  { key: "personal", from: PERSONAL_FROM },
];
export function senderOptions(): { key: string; label: string }[] {
  return SENDERS.map((s) => ({ key: s.key, label: s.from }));
}

export async function sendEmailContent(
  to: string,
  content: EmailContent,
  options: { replyTo?: string; from?: string; bcc?: string } = {}
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: options.from ?? FROM,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      replyTo: options.replyTo,
      bcc: options.bcc,
    });
    if (error) {
      console.error("Email send failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// A direct message from the admin. Replies go to the admin's real inbox
// whichever sender is shown, and a blind copy can land there too.
export async function sendDirectMessage(
  to: string,
  senderKey: string,
  fields: DirectMessageFields,
  copyToAdmin: boolean
): Promise<boolean> {
  const sender = SENDERS.find((s) => s.key === senderKey) ?? SENDERS[0];
  return sendEmailContent(to, directMessageEmail(fields), {
    from: sender.from,
    replyTo: ADMIN_EMAIL || undefined,
    bcc: copyToAdmin && ADMIN_EMAIL ? ADMIN_EMAIL : undefined,
  });
}

// Contact form messages go to the admin with the sender as reply-to, so a
// plain reply in the inbox reaches them.
export async function sendContactMessage(fields: ContactFields): Promise<boolean> {
  return sendEmailContent(ADMIN_EMAIL, contactEmail(fields), { replyTo: fields.email });
}

export async function notifyAdminNewSubmission(listingName: string, isEdit = false) {
  await sendEmailContent(ADMIN_EMAIL, adminNewSubmissionEmail(listingName, isEdit));
}

export async function notifySubmissionApproved(
  to: string,
  listingName: string,
  slug: string,
  isEdit = false
) {
  await sendEmailContent(to, approvedEmail(listingName, slug, isEdit));
}

export async function notifySubmissionRejected(
  to: string,
  listingName: string,
  feedback: string,
  isEdit = false
) {
  await sendEmailContent(to, rejectedEmail(listingName, feedback, isEdit));
}
