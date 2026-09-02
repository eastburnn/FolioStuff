import { Resend } from "resend";
import {
  adminNewSubmissionEmail,
  approvedEmail,
  rejectedEmail,
  type EmailContent,
} from "./email-templates";

// All senders no-op quietly when RESEND_API_KEY is missing, so the app
// works end to end before email is configured.

const FROM = process.env.EMAIL_FROM ?? "FolioStuff <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function sendEmailContent(to: string, content: EmailContent) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: FROM,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
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
