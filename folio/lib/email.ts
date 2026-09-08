import { Resend } from "resend";
import {
  adminNewSubmissionEmail,
  approvedEmail,
  rejectedEmail,
  contactEmail,
  type ContactFields,
  type EmailContent,
} from "./email-templates";

// All senders no-op quietly when RESEND_API_KEY is missing, so the app
// works end to end before email is configured.

const FROM = process.env.EMAIL_FROM ?? "FolioStuff <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function sendEmailContent(
  to: string,
  content: EmailContent,
  options: { replyTo?: string } = {}
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      replyTo: options.replyTo,
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
