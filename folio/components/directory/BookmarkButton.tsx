"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export type BookmarkKind = "tool" | "listing";

interface BookmarkButtonProps {
  kind: BookmarkKind;
  refId: string;
  className?: string;
  // Show "Save" / "Saved" text beside the icon.
  withLabel?: boolean;
  // Re-render the surrounding server page after a change (the Saved tab).
  refreshOnChange?: boolean;
}

type State = "unknown" | "out" | "saved" | "unsaved";

// Save or unsave a tool or listing. Works on static pages because it reads
// the session in the browser; row security keeps every list private.
// Logged out visitors are sent to log in and brought back here.
export default function BookmarkButton({
  kind,
  refId,
  className = "",
  withLabel = false,
  refreshOnChange = false,
}: BookmarkButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>("unknown");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setState("out");
        return;
      }
      const { data } = await supabase
        .from("bookmarks")
        .select("ref")
        .eq("kind", kind)
        .eq("ref", refId)
        .maybeSingle();
      if (!cancelled) setState(data ? "saved" : "unsaved");
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, refId]);

  const toggle = async () => {
    if (state === "unknown" || busy) return;
    const loginUrl = `/login?next=${encodeURIComponent(pathname)}`;
    if (state === "out") {
      router.push(loginUrl);
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(loginUrl);
      return;
    }
    setBusy(true);
    const previous = state;
    const next: State = state === "saved" ? "unsaved" : "saved";
    setState(next);
    const { error } =
      next === "saved"
        ? await supabase.from("bookmarks").insert({ user_id: user.id, kind, ref: refId })
        : await supabase.from("bookmarks").delete().eq("kind", kind).eq("ref", refId);
    if (error) {
      setState(previous);
    } else if (refreshOnChange) {
      router.refresh();
    }
    setBusy(false);
  };

  const saved = state === "saved";
  const title = saved ? "Saved. Click to remove." : state === "out" ? "Log in to save this" : "Save for later";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={state === "unknown"}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur transition-colors disabled:opacity-40 ${
        withLabel ? "px-3 py-1.5 text-xs font-semibold" : "p-1.5"
      } ${
        saved
          ? "bg-accent-purple/[0.15] border-accent-purple/40 text-accent-purple"
          : "bg-bg-card/80 border-white/[0.1] text-ink-muted hover:text-accent-purple hover:border-accent-purple/40"
      } ${className}`}
    >
      <Bookmark size={14} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
