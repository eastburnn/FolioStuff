"use server";

import { sendContactMessage } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";
import { CONTACT_TOPICS } from "@/lib/contact";

export interface ContactState {
  error?: string | null;
  sent?: boolean;
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: bots fill every field; humans never see this one.
  if (String(formData.get("website") ?? "").length > 0) return { error: "Message could not be sent." };

  const clean = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  const name = clean("name", 80);
  const email = clean("email", 200);
  const topic = clean("topic", 60);
  const subject = clean("subject", 120).replace(/\s+/g, " ");
  const message = clean("message", 4000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email so we can reply." };
  if (!(CONTACT_TOPICS as readonly string[]).includes(topic)) return { error: "Pick a topic." };
  if (subject.length < 3) return { error: "Give your message a subject." };
  if (message.length < 20) return { error: "Tell us a little more. Messages need at least 20 characters." };

  const captchaOk = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? "") || null);
  if (!captchaOk) return { error: "Captcha verification failed. Please try again." };

  const sent = await sendContactMessage({ name, email, topic, subject, message });
  if (!sent) return { error: "Could not send your message right now. Please try again in a minute." };
  return { sent: true };
}
