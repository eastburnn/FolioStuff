"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-next";
import { login, type LoginState } from "@/app/login/actions";
import TurnstileWidget from "./TurnstileWidget";
import PasswordInput from "./PasswordInput";

interface AuthFormProps {
  mode: "login" | "signup";
}

const inputClass = (invalid: boolean) =>
  `w-full bg-bg-card border rounded-xl px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none transition-colors ${
    invalid ? "border-red-400/60 focus:border-red-400" : "border-white/[0.08] focus:border-white/20"
  }`;

const labelClass = "block text-xs text-ink-muted uppercase tracking-widest";

// Login runs through a server action so a failed attempt can point at the
// field that is wrong. Signup stays in the browser: it needs the origin for
// the confirmation link and shows a notice instead of navigating.
export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const expired = searchParams.get("expired") === "1";

  // Controlled so a failed attempt keeps the email in place.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [loginState, loginAction, loginPending] = useActionState<LoginState, FormData>(login, {});
  const loginFailed = Boolean(loginState.emailError || loginState.passwordError || loginState.formError);

  // Turnstile tokens are single-use; reset the widget after a failed attempt
  // so the corrected resubmit can pass. The password is cleared as well.
  useEffect(() => {
    if (loginFailed) {
      window.turnstile?.reset();
      setPassword("");
    }
  }, [loginState, loginFailed]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setNotice(null);
    setBusy(true);
    const supabase = createClient();
    const captchaToken =
      (document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null)
        ?.value || undefined;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
          captchaToken,
        },
      });
      if (error) {
        setSignupError(error.message);
        window.turnstile?.reset();
      } else if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setNotice("Check your email for a confirmation link, then come back and log in.");
      }
    } catch {
      setSignupError("Something went wrong. Please try again.");
      window.turnstile?.reset();
    } finally {
      setBusy(false);
    }
  };

  const isLogin = mode === "login";
  const emailError = isLogin ? loginState.emailError : null;
  const passwordError = isLogin ? loginState.passwordError : null;
  const formError = isLogin ? loginState.formError : signupError;
  const pending = isLogin ? loginPending : busy;

  return (
    <form
      action={isLogin ? loginAction : undefined}
      onSubmit={isLogin ? undefined : handleSignup}
      className="space-y-4"
    >
      {isLogin && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="email" className={`${labelClass} mb-2`}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className={inputClass(Boolean(emailError))}
          placeholder="you@example.com"
        />
        {emailError && (
          <p id="email-error" className="text-xs text-red-400 mt-2" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          {isLogin && (
            <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-ink-secondary transition-colors">
              Forgot password?
            </Link>
          )}
        </div>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "password-error" : undefined}
          placeholder={isLogin ? "Your password" : "At least 8 characters"}
        />
        {passwordError && (
          <p id="password-error" className="text-xs text-red-400 mt-2" role="alert">
            {passwordError}
          </p>
        )}
      </div>

      {expired && (
        <p className="text-xs text-ink-muted text-center">
          You were logged out after 24 hours away. Log in again to continue.
        </p>
      )}

      <TurnstileWidget className="flex justify-center" />

      {formError && (
        <p className="text-sm text-red-400" role="alert">
          {formError}
        </p>
      )}
      {notice && <p className="text-sm text-accent-green">{notice}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-white/[0.09] border border-white/[0.12] hover:bg-white/[0.14] transition-colors px-4 py-3 text-sm font-semibold text-ink-primary disabled:opacity-50"
      >
        {pending ? "One moment..." : isLogin ? "Log in" : "Create account"}
      </button>

      <p className="text-xs text-ink-muted text-center pt-2">
        {isLogin ? (
          <>
            No account yet?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
