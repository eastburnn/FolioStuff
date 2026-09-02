"use client";

import { useActionState, useState } from "react";
import type { DeleteAccountState } from "@/app/dashboard/actions";

interface DeleteAccountSectionProps {
  action: (state: DeleteAccountState, formData: FormData) => Promise<DeleteAccountState>;
}

export default function DeleteAccountSection({ action }: DeleteAccountSectionProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <section className="mt-16 rounded-2xl border border-red-400/[0.25] bg-red-400/[0.03] p-6">
      <h2 className="text-xs text-red-400/80 uppercase tracking-widest mb-3">Danger zone</h2>

      {!open ? (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-ink-secondary">
            Permanently delete your account, your profile, and all of your tool listings.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/[0.1] transition-colors"
          >
            Delete account
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <p className="text-sm text-ink-secondary leading-relaxed">
            Are you sure? Deleting your account also permanently removes your tool listings
            from the website, including any that are live in the directory, along with your
            profile and every image you have uploaded. This cannot be undone.
          </p>
          <div>
            <label htmlFor="confirm" className="block text-xs text-ink-muted uppercase tracking-widest mb-2">
              Enter &quot;DELETE&quot; to permanently delete your account
            </label>
            <input
              id="confirm"
              name="confirm"
              type="text"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full sm:w-64 bg-bg-card border border-red-400/[0.3] rounded-xl px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-red-400/60 transition-colors"
              placeholder="DELETE"
            />
          </div>

          {state.error && <p className="text-sm text-red-400">{state.error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending || confirmText.trim() !== "DELETE"}
              className="rounded-xl bg-red-400/[0.15] border border-red-400/50 px-5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-400/[0.25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "Deleting..." : "Permanently delete my account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
              }}
              className="text-sm text-ink-muted hover:text-ink-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
