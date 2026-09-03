"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary. Without one, any unexpected failure (for
// example a request the platform rejects before the app runs) shows the
// framework's bare error screen.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-24 pb-24 text-center">
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-ink-secondary leading-relaxed mb-8">
          That did not go through, and your changes may not have been saved. Please try again.
          If you were uploading images, smaller files usually help.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 transition-all duration-200 px-6 py-3 text-sm font-semibold text-accent-purple"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-colors px-6 py-3 text-sm font-semibold text-ink-primary"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
