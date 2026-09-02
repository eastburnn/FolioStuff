import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/directory/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-sm mx-auto px-4 sm:px-6 pt-16 pb-24">
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-2">
          Forgot your password?
        </h1>
        <p className="text-sm text-ink-secondary mb-8">
          Enter your email and we will send you a link to reset it.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
