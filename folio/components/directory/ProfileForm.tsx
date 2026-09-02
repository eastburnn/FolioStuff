"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { USERNAME_PATTERN, RESERVED_USERNAMES, type Profile } from "@/lib/profiles";

export interface ProfileFormState {
  error: string | null;
  saved?: boolean;
}

interface ProfileFormProps {
  action: (state: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
  profile: Profile | null;
  hasAvatar: boolean;
  requiredFlow?: boolean;
}

const inputClass =
  "w-full bg-bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20 transition-colors";
const labelClass = "block text-xs text-ink-muted uppercase tracking-widest mb-2";

type Availability =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "reserved"
  | "cannot-remove";

export default function ProfileForm({ action, profile, hasAvatar, requiredFlow }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  const originalUsername = profile?.username ?? "";
  const [username, setUsername] = useState(originalUsername);
  const [usernameLocked, setUsernameLocked] = useState(Boolean(originalUsername));
  const [availability, setAvailability] = useState<Availability>("idle");

  useEffect(() => {
    if (usernameLocked) {
      setAvailability("idle");
      return;
    }
    const candidate = username.trim().toLowerCase();
    if (!candidate) {
      setAvailability(originalUsername ? "cannot-remove" : "idle");
      return;
    }
    if (candidate === originalUsername.toLowerCase()) {
      setAvailability("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(candidate)) {
      setAvailability("invalid");
      return;
    }
    if (RESERVED_USERNAMES.has(candidate)) {
      setAvailability("reserved");
      return;
    }

    let cancelled = false;
    setAvailability("checking");
    const timer = setTimeout(async () => {
      try {
        const { data } = await createClient()
          .from("profiles")
          .select("id")
          .eq("username", candidate)
          .maybeSingle();
        if (cancelled) return;
        const takenByOther = Boolean(data) && data!.id !== profile?.id;
        setAvailability(takenByOther ? "taken" : "available");
      } catch {
        if (!cancelled) setAvailability("idle");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, usernameLocked, originalUsername, profile?.id]);

  const availabilityHint: Record<Availability, { text: string; className: string } | null> = {
    idle: null,
    checking: { text: "Checking availability...", className: "text-ink-muted" },
    available: { text: "Available.", className: "text-accent-green" },
    taken: { text: "Already taken.", className: "text-red-400" },
    invalid: {
      text: "8 to 16 characters: lowercase letters, numbers, and hyphens.",
      className: "text-red-400",
    },
    reserved: { text: "That username is reserved.", className: "text-red-400" },
    "cannot-remove": {
      text: "Your username can be changed but not removed.",
      className: "text-red-400",
    },
  };
  const hint = availabilityHint[availability];

  return (
    <form action={formAction} className="space-y-6">
      {requiredFlow && <input type="hidden" name="required_flow" value="1" />}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="display_name" className={labelClass}>Display name</label>
          <input id="display_name" name="display_name" type="text" maxLength={80}
            defaultValue={profile?.display_name ?? ""} className={inputClass}
            placeholder="How you want to be credited" />
          <p className="text-xs text-ink-muted mt-2">
            This can be anything, your real name or something made up.
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="username" className="block text-xs text-ink-muted uppercase tracking-widest">
              Username
            </label>
            {usernameLocked && (
              <button
                type="button"
                onClick={() => setUsernameLocked(false)}
                className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary transition-colors"
              >
                <Pencil size={11} />
                Edit
              </button>
            )}
          </div>
          <div className="relative">
            <input id="username" name="username" type="text" maxLength={16}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              readOnly={usernameLocked}
              className={`${inputClass} pr-10 ${usernameLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="your-handle" />
            {availability === "available" && (
              <Check size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-accent-green" />
            )}
            {(availability === "taken" ||
              availability === "invalid" ||
              availability === "reserved" ||
              availability === "cannot-remove") && (
              <X size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400" />
            )}
          </div>
          {hint ? (
            <p className={`text-xs mt-2 ${hint.className}`}>{hint.text}</p>
          ) : usernameLocked ? (
            <p className="text-xs mt-2 text-accent-purple">
              Your public maker page: /makers/{originalUsername}
            </p>
          ) : (
            <p className="text-xs mt-2 text-ink-muted">
              8 to 16 characters: lowercase letters, numbers, and hyphens.{" "}
              <span className="text-accent-purple">
                Your username creates your public maker page at /makers/your-handle.
              </span>
            </p>
          )}
          {!usernameLocked && originalUsername && (
            <p className="text-xs text-accent-gold mt-2">
              Changing your username changes your public page link. Old links will stop working.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>Bio</label>
        <textarea id="bio" name="bio" rows={4} maxLength={500}
          defaultValue={profile?.bio ?? ""} className={inputClass}
          placeholder="A few sentences about you and what you build. Up to 500 characters." />
      </div>

      <div>
        <label htmlFor="avatar" className={labelClass}>
          Profile picture {hasAvatar ? "(leave empty to keep the current one)" : ""}
        </label>
        <input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp"
          className="block w-full text-sm text-ink-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink-primary hover:file:bg-white/[0.12]" />
        <p className="text-xs text-ink-muted mt-2">Square works best. PNG, JPEG, or WebP, up to 2MB.</p>
      </div>

      <div>
        <label htmlFor="website_url" className={labelClass}>Website</label>
        <input id="website_url" name="website_url" type="url" maxLength={200}
          defaultValue={profile?.website_url ?? ""} className={inputClass}
          placeholder="https://yoursite.com" />
        <p className="text-xs text-ink-muted mt-2">
          Your personal or portfolio site, not a specific tool's site.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="x_handle" className={labelClass}>X handle</label>
          <input id="x_handle" name="x_handle" type="text" maxLength={30}
            defaultValue={profile?.x_handle ?? ""} className={inputClass} placeholder="@you" />
        </div>
        <div>
          <label htmlFor="bluesky_handle" className={labelClass}>Bluesky handle</label>
          <input id="bluesky_handle" name="bluesky_handle" type="text" maxLength={100}
            defaultValue={profile?.bluesky_handle ?? ""} className={inputClass}
            placeholder="you.bsky.social" />
        </div>
        <div>
          <label htmlFor="threads_handle" className={labelClass}>Threads handle</label>
          <input id="threads_handle" name="threads_handle" type="text" maxLength={30}
            defaultValue={profile?.threads_handle ?? ""} className={inputClass} placeholder="@you" />
        </div>
        <div>
          <label htmlFor="linkedin_url" className={labelClass}>LinkedIn URL</label>
          <input id="linkedin_url" name="linkedin_url" type="url" maxLength={200}
            defaultValue={profile?.linkedin_url ?? ""} className={inputClass}
            placeholder="https://linkedin.com/in/you" />
        </div>
        <div>
          <label htmlFor="facebook_url" className={labelClass}>Facebook URL</label>
          <input id="facebook_url" name="facebook_url" type="url" maxLength={200}
            defaultValue={profile?.facebook_url ?? ""} className={inputClass}
            placeholder="https://facebook.com/you" />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.saved && !state.error && (
        <p className="text-sm text-accent-green">Profile saved.</p>
      )}

      <button type="submit" disabled={pending}
        className="rounded-xl bg-white/[0.09] border border-white/[0.12] hover:bg-white/[0.14] transition-colors px-6 py-3 text-sm font-semibold text-ink-primary disabled:opacity-50">
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
