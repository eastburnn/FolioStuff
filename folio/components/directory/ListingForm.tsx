"use client";

import { useActionState, useEffect, useState } from "react";
import TurnstileWidget from "./TurnstileWidget";
import TagsInput from "./TagsInput";
import { SOCIAL_PLATFORMS, type Socials } from "@/lib/socials";

export interface ListingFormState {
  error: string | null;
}

export interface ListingFormInitial {
  name: string;
  url: string;
  tagline: string;
  description: string;
  tags: string[];
  socials: Socials;
  hasIcon: boolean;
  screenshotCount: number;
}

interface ListingFormProps {
  action: (state: ListingFormState, formData: FormData) => Promise<ListingFormState>;
  submitLabel: string;
  initial?: ListingFormInitial;
}

const inputClass =
  "w-full bg-bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20 transition-colors";
const labelClass = "block text-xs text-ink-muted uppercase tracking-widest mb-2";
const fileClass =
  "block w-full text-sm text-ink-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink-primary hover:file:bg-white/[0.12]";

// Text fields are controlled so a validation error from the server does not
// wipe what the maker typed (React resets uncontrolled fields after a form
// action settles). Files cannot be preserved across an error by the browser.
export default function ListingForm({ action, submitLabel, initial }: ListingFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [socials, setSocials] = useState<Record<string, string>>(
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, initial?.socials[p.key] ?? ""]))
  );

  // Turnstile tokens are single-use; reset the widget after a failed attempt
  // so the corrected resubmit can pass.
  useEffect(() => {
    if (state.error) window.turnstile?.reset();
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Honeypot: real people never see or fill this field */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>Tool name</label>
        <input id="name" name="name" type="text" required minLength={2} maxLength={60}
          value={name} onChange={(e) => setName(e.target.value)}
          className={inputClass} placeholder="e.g. DivTracker" />
      </div>

      <div>
        <label htmlFor="url" className={labelClass}>Tool URL</label>
        <input id="url" name="url" type="url" required maxLength={300}
          value={url} onChange={(e) => setUrl(e.target.value)}
          className={inputClass} placeholder="https://yourtool.com" />
      </div>

      <div>
        <label htmlFor="tagline" className={labelClass}>Tagline</label>
        <textarea id="tagline" name="tagline" required minLength={10} maxLength={200} rows={2}
          value={tagline} onChange={(e) => setTagline(e.target.value)}
          className={inputClass} placeholder="What it does, in one or two sentences" />
        <p className="text-xs text-ink-muted mt-2">
          10 to 200 characters. Shown under the name on cards and in search results, so
          keep the first sentence tight. {tagline.length}/200
        </p>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea id="description" name="description" required minLength={40} maxLength={2000} rows={6}
          value={description} onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          placeholder="What does it do, who is it for, and what makes it worth using? 40 to 2000 characters." />
      </div>

      <div>
        <label htmlFor="tags" className={labelClass}>Tags</label>
        <TagsInput initialTags={initial?.tags} />
      </div>

      <div>
        <label htmlFor="icon" className={labelClass}>
          Icon or logo{initial?.hasIcon ? " (leave empty to keep the current one)" : ""}
        </label>
        <input id="icon" name="icon" type="file" accept="image/png,image/jpeg,image/webp"
          required={!initial?.hasIcon} className={fileClass} />
        <p className="text-xs text-ink-muted mt-2">Square works best. PNG, JPEG, or WebP, up to 2MB.</p>
      </div>

      <div>
        <label htmlFor="screenshots" className={labelClass}>
          Screenshots (optional
          {initial && initial.screenshotCount > 0
            ? `, ${initial.screenshotCount} on file; choosing new ones replaces them`
            : ""}
          )
        </label>
        <input id="screenshots" name="screenshots" type="file" multiple accept="image/png,image/jpeg,image/webp"
          className={fileClass} />
        <p className="text-xs text-ink-muted mt-2">Up to 3 images, 2MB each.</p>
        {initial && initial.screenshotCount > 0 && (
          <label className="flex items-center gap-2 mt-3 text-xs text-ink-secondary">
            <input type="checkbox" name="remove_screenshots" value="1" className="accent-[#8B5CF6]" />
            Remove the current screenshots (ignored if you choose new ones above)
          </label>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>Social links (optional)</legend>
        <p className="text-xs text-ink-muted mb-3">
          Accounts for the tool itself. Your own links live on your maker profile.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.key}>
              <label htmlFor={`social_${platform.key}`} className="block text-xs text-ink-muted mb-1.5">
                {platform.label}
              </label>
              <input
                id={`social_${platform.key}`}
                name={`social_${platform.key}`}
                type="url"
                maxLength={300}
                value={socials[platform.key]}
                onChange={(e) => setSocials({ ...socials, [platform.key]: e.target.value })}
                className={inputClass}
                placeholder={platform.placeholder}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <TurnstileWidget />

      {state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}
        className="rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 px-6 py-3 text-sm font-semibold text-accent-purple disabled:opacity-50">
        {pending ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
}
