"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-next";
import TurnstileWidget from "./TurnstileWidget";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const expired = searchParams.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const supabase = createClient();
    const captchaToken =
      (document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null)
        ?.value || undefined;

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
            captchaToken,
          },
        });
        if (error) {
          setError(error.message);
        } else if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setNotice("Check your email for a confirmation link, then come back and log in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken },
        });
        if (error) {
          setError(error.message);
        } else {
          router.push(next);
          router.refresh();
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full bg-bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20 transition-colors";

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
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-xs text-ink-muted uppercase tracking-widest">
            Password
          </label>
          {mode === "login" && (
            <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-ink-secondary transition-colors">
              Forgot password?
            </Link>
          )}
        </div>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
        />
      </div>

      {expired && (
        <p className="text-xs text-ink-muted text-center">
          You were logged out after 24 hours away. Log in again to continue.
        </p>
      )}

      <TurnstileWidget className="flex justify-center" />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && <p className="text-sm text-accent-green">{notice}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-white/[0.09] border border-white/[0.12] hover:bg-white/[0.14] transition-colors px-4 py-3 text-sm font-semibold text-ink-primary disabled:opacity-50"
      >
        {busy ? "One moment..." : mode === "signup" ? "Create account" : "Log in"}
      </button>

      <p className="text-xs text-ink-muted text-center pt-2">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
              Log in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
              Create one
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
