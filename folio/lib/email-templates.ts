import { BADGE_HEIGHT, BADGE_WIDTH, badgeEmbedCode } from "./badge";

// Branded HTML email templates. Hand-rolled with tables and inline styles so
// they render correctly across Gmail, Outlook, and Apple Mail. Light theme on
// purpose: email clients mangle dark backgrounds unpredictably.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
const PURPLE = "#8B5CF6";
const INK = "#1F2430";
const MUTED = "#6B7280";
const LOGO_URL = "https://www.foliostuff.com/favicon.png";
// Email clients block SVG images, so the badge preview in mail is the PNG.
const BADGE_PNG_URL = "https://www.foliostuff.com/badge.png";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="border-radius:12px;background:${PURPLE};">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function layout(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F5F7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
            <tr>
              <td style="padding:0 8px 20px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${LOGO_URL}" width="30" height="30" alt="" style="border-radius:8px;display:block;" />
                    </td>
                    <td style="vertical-align:middle;padding-left:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:19px;font-weight:800;letter-spacing:-0.3px;">
                      <span style="color:${PURPLE};">folio</span><span style="color:${INK};">stuff</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;padding:36px 36px 32px 36px;border:1px solid #E7E8EC;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
                Useful tools for managing your money, plus a hand-reviewed directory of
                finance tools built by the people who made them.<br />
                <a href="${SITE_URL}" style="color:${MUTED};">foliostuff.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const h1 = `margin:0 0 14px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:${INK};`;
const p = `margin:0 0 14px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3D4453;`;
const small = `margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:${MUTED};`;
const code = `margin:0 0 12px 0;padding:12px 14px;background:#F4F5F7;border:1px solid #E7E8EC;border-radius:10px;font-family:Menlo,Consolas,'Liberation Mono',monospace;font-size:12px;line-height:1.55;color:#3D4453;white-space:pre-wrap;overflow-wrap:anywhere;`;
const quote = `margin:18px 0;padding:14px 18px;background:#F7F5FF;border-left:3px solid ${PURPLE};border-radius:0 10px 10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3D4453;`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function adminNewSubmissionEmail(listingName: string, isEdit = false): EmailContent {
  const name = escapeHtml(listingName);
  if (isEdit) {
    return {
      subject: `Edited listing awaiting re-approval: ${listingName}`,
      html: layout(`
        <h1 style="${h1}">Edit to a live listing</h1>
        <p style="${p}">The maker of <strong>${name}</strong> submitted changes. The current version stays live until you approve the new one, or the changes are discarded if you reject them.</p>
        ${button("Review the changes", `${SITE_URL}/admin`)}
        <p style="${small}">You are getting this because you are the FolioStuff admin.</p>
      `),
      text: `The maker of ${listingName} submitted changes to their live listing. The current version stays live until you approve the new one.\n\nReview it here: ${SITE_URL}/admin`,
    };
  }
  return {
    subject: `New FolioStuff submission: ${listingName}`,
    html: layout(`
      <h1 style="${h1}">New submission</h1>
      <p style="${p}"><strong>${name}</strong> was just submitted to the directory and is waiting for your review.</p>
      ${button("Review it now", `${SITE_URL}/admin`)}
      <p style="${small}">You are getting this because you are the FolioStuff admin.</p>
    `),
    text: `A new tool was submitted to the FolioStuff directory: ${listingName}\n\nReview it here: ${SITE_URL}/admin`,
  };
}

export function approvedEmail(listingName: string, slug: string, isEdit = false): EmailContent {
  const name = escapeHtml(listingName);
  const listingUrl = `${SITE_URL}/directory/${slug}`;
  if (isEdit) {
    return {
      subject: `Your changes to ${listingName} are live`,
      html: layout(`
        <h1 style="${h1}">Changes approved</h1>
        <p style="${p}">Your edits to <strong>${name}</strong> were approved and the updated version is now live in the FolioStuff directory.</p>
        ${button("View your listing", listingUrl)}
        <p style="${small}">Thanks for keeping your listing fresh.</p>
      `),
      text: `Your edits to ${listingName} were approved and the updated version is now live.\n\nYour listing: ${listingUrl}`,
    };
  }
  return {
    subject: `${listingName} is live on FolioStuff`,
    html: layout(`
      <h1 style="${h1}">You're live 🎉</h1>
      <p style="${p}"><strong>${name}</strong> was approved and is now listed in the FolioStuff directory, with its own page and a link back to your site.</p>
      ${button("View your listing", listingUrl)}
      <p style="${p}">Share the link anywhere you like. The more people see it, the better it does for both of us.</p>
      <p style="${p}"><strong>Add a badge to your site.</strong> It links straight to your listing, and it tells your visitors the tool was reviewed and listed.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
        <tr>
          <td>
            <a href="${listingUrl}" target="_blank"><img src="${BADGE_PNG_URL}" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" alt="Listed on FolioStuff" style="display:block;border:0;" /></a>
          </td>
        </tr>
      </table>
      <div style="${code}">${escapeHtml(badgeEmbedCode(slug))}</div>
      <p style="${small}">The same code is on your dashboard with a copy button. Thanks for submitting, and congrats on shipping.</p>
    `),
    text: `Good news: ${listingName} was approved and is now live in the FolioStuff directory.\n\nYour listing: ${listingUrl}\n\nFeel free to share it.\n\nAdd a "Listed on FolioStuff" badge to your site with this code (it links to your listing):\n${badgeEmbedCode(slug)}\n\nThe same code is on your dashboard with a copy button. Thanks for submitting!`,
  };
}

export function rejectedEmail(listingName: string, feedback: string, isEdit = false): EmailContent {
  const name = escapeHtml(listingName);
  if (isEdit) {
    return {
      subject: `About your changes to ${listingName}`,
      html: layout(`
        <h1 style="${h1}">Changes not approved</h1>
        <p style="${p}">The edits you submitted for <strong>${name}</strong> were not approved. Your previous version is still live and unchanged. Here is the feedback:</p>
        <div style="${quote}">${escapeHtml(feedback)}</div>
        <p style="${p}">You can edit the listing again from your dashboard whenever you like. Rejected changes are not kept on file, so this email is your copy of the feedback.</p>
        ${button("Open your dashboard", `${SITE_URL}/dashboard`)}
      `),
      text: `The edits you submitted for ${listingName} were not approved. Your previous version is still live and unchanged.\n\nFeedback:\n${feedback}\n\nYou can edit the listing again from your dashboard: ${SITE_URL}/dashboard`,
    };
  }
  return {
    subject: `About your FolioStuff submission: ${listingName}`,
    html: layout(`
      <h1 style="${h1}">Not this time</h1>
      <p style="${p}">Thanks for submitting <strong>${name}</strong> to the FolioStuff directory. It was not approved this time. Here is the feedback:</p>
      <div style="${quote}">${escapeHtml(feedback)}</div>
      <p style="${p}">If you would like another shot, address the feedback and submit again. Rejected submissions are not kept on file, so this email is your copy of the feedback.</p>
      ${button("Submit again", `${SITE_URL}/submit`)}
    `),
    text: `Thanks for submitting ${listingName} to the FolioStuff directory. It was not approved this time.\n\nFeedback:\n${feedback}\n\nIf you would like another shot, address the feedback and submit again: ${SITE_URL}/submit\nRejected submissions are not kept on file, so this email is your copy of the feedback.`,
  };
}

export interface ContactFields {
  name: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
}

// Message from the contact form, delivered to the site admin. Every field is
// user supplied, so everything is escaped.
export function contactEmail(f: ContactFields): EmailContent {
  const who = f.name ? `${f.name} (${f.email})` : f.email;
  const html = layout(`
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8B5CF6;">${escapeHtml(f.topic)}</p>
    <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#EEF2FF;">${escapeHtml(f.subject)}</h1>
    <p style="margin:0 0 16px;font-size:13px;color:#9AA3B5;">From ${escapeHtml(who)}. Reply to this email to answer them directly.</p>
    <div style="padding:16px;border-radius:12px;background:#0C0F1A;border:1px solid rgba(255,255,255,0.08);font-size:14px;line-height:1.6;color:#C7CEDB;white-space:pre-wrap;">${escapeHtml(f.message)}</div>
  `);
  const text = `${f.topic}: ${f.subject}\n\nFrom ${who}\n\n${f.message}`;
  return { subject: `[FolioStuff contact] ${f.topic}: ${f.subject}`, html, text };
}
