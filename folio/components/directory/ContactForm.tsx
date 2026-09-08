"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { sendContact, type ContactState } from "@/app/contact/actions";
import TurnstileWidget from "./TurnstileWidget";
import { CONTACT_TOPICS } from "@/lib/contact";

const TOPICS = [...CONTACT_TOPICS];

const inputClass =
  "w-full bg-bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20 transition-colors";
const labelClass = "block text-xs text-ink-muted uppercase tracking-widest mb-2";

// Fields are controlled so a server side error keeps what was typed.
export default function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(sendContact, {});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Turnstile tokens are single use; reset after a failed attempt.
  useEffect(() => {
    if (state.error) window.turnstile?.reset();
  }, [state]);

  if (state.sent) {
    return (
      <div className="rounded-2xl border border-accent-green/30 bg-accent-green/[0.08] p-6 flex items-start gap-3">
        <CheckCircle2 size={20} className="text-accent-green shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-ink-primary">Message sent.</p>
          <p className="text-sm text-ink-secondary mt-1">
            Thanks. Every message gets read, and replies come from a real person to the email you
            gave.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot: real people never see or fill this field */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>Name (optional)</label>
          <input id="name" name="name" type="text" maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
            autoComplete="name" className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" name="email" type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" className={inputClass} placeholder="you@example.com" />
        </div>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5">
        <div>
          <label htmlFor="topic" className={labelClass}>Topic</label>
          <div className="relative">
            <select id="topic" name="topic" required value={topic} onChange={(e) => setTopic(e.target.value)}
              className={`${inputClass} appearance-none pr-10 ${topic ? "" : "text-ink-muted"}`}>
              <option value="" disabled className="bg-bg-card">Choose one</option>
              {TOPICS.map((t) => (
                <option key={t} value={t} className="bg-bg-card text-ink-primary">{t}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true" />
          </div>
        </div>
        <div>
          <label htmlFor="subject" className={labelClass}>Subject</label>
          <input id="subject" name="subject" type="text" required minLength={3} maxLength={120} value={subject}
            onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="What is this about?" />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>Message</label>
        <textarea id="message" name="message" required minLength={20} maxLength={4000} rows={7} value={message}
          onChange={(e) => setMessage(e.target.value)} className={inputClass}
          placeholder="The more detail the better. For bugs, what you did, what you expected, and what happened instead." />
        <p className="text-[11px] text-ink-muted mt-1.5 text-right">{message.length} / 4000</p>
      </div>

      <TurnstileWidget />

      {state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}
        className="rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 px-6 py-3 text-sm font-semibold text-accent-purple disabled:opacity-50">
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
