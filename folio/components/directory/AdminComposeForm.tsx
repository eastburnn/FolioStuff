"use client";

import { useActionState, useState } from "react";
import { sendComposedEmail, type ComposeState } from "@/app/admin/actions";

export interface Recipient {
  email: string;
  label: string;
}

interface AdminComposeFormProps {
  recipients: Recipient[];
  senders: { key: string; label: string }[];
}

const inputClass =
  "w-full bg-bg-base border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20";
const labelClass = "block text-xs text-ink-muted uppercase tracking-widest mb-2";

// Compose a one-off branded email to a user. Recipients come from the
// account list, makers first; any other address can be typed in.
export default function AdminComposeForm({ recipients, senders }: AdminComposeFormProps) {
  const [state, action, pending] = useActionState<ComposeState, FormData>(sendComposedEmail, {});
  const [recipient, setRecipient] = useState("");

  return (
    <form action={action} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="recipient" className={labelClass}>To</label>
          <select
            id="recipient"
            name="recipient"
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>Choose a user</option>
            {recipients.map((r) => (
              <option key={r.email} value={r.email}>{r.label}</option>
            ))}
            <option value="other">Another address…</option>
          </select>
          {recipient === "other" && (
            <input
              name="recipientOther"
              type="email"
              required
              placeholder="name@example.com"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
        <div>
          <label htmlFor="sender" className={labelClass}>From</label>
          <select id="sender" name="sender" defaultValue={senders[0]?.key} className={inputClass}>
            {senders.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <p className="text-xs text-ink-muted mt-2">Replies come to your inbox either way.</p>
        </div>
      </div>

      <div>
        <label htmlFor="subject" className={labelClass}>Subject</label>
        <input id="subject" name="subject" type="text" required minLength={2} maxLength={150} className={inputClass} />
      </div>

      <div>
        <label htmlFor="preheader" className={labelClass}>Preview text</label>
        <input id="preheader" name="preheader" type="text" maxLength={150} className={inputClass}
          placeholder="Shown next to the subject in the inbox. Optional." />
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>Message</label>
        <textarea id="message" name="message" required minLength={2} maxLength={5000} rows={9} className={inputClass}
          placeholder="Write it like a normal email. A blank line starts a new paragraph." />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent-purple/[0.15] border border-accent-purple/40 hover:bg-accent-purple/[0.25] transition-colors px-5 py-2.5 text-sm font-semibold text-accent-purple disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send email"}
        </button>
        <label className="flex items-center gap-2 text-xs text-ink-secondary">
          <input type="checkbox" name="copy" value="1" defaultChecked className="accent-[#8B5CF6]" />
          Send a copy to my inbox
        </label>
        {state.sent && <p className="text-sm text-accent-green" role="status">Sent to {state.sent}.</p>}
        {state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}
      </div>
    </form>
  );
}
