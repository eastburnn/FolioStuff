"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TurnstileWidget from "./TurnstileWidget";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const captchaToken =
      (document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null)
        ?.value || undefined;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
        captchaToken,
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-accent-green/30 bg-accent-green/[0.08] p-4 text-sm text-accent-green">
        If an account exists for {email}, a password reset link is on its way. Check your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs text-ink-muted uppercase tracking-widest mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20 transition-colors"
          placeholder="you@example.com"
        />
      </div>

      <TurnstileWidget className="flex justify-center" />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-white/[0.09] border border-white/[0.12] hover:bg-white/[0.14] transition-colors px-4 py-3 text-sm font-semibold text-ink-primary disabled:opacity-50"
      >
        {busy ? "One moment..." : "Send reset link"}
      </button>

      <p className="text-xs text-ink-muted text-center pt-2">
        Remembered it?{" "}
        <Link href="/login" className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
          Log in
        </Link>
      </p>
    </form>
  );
}
