"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import TurnstileWidget from "./TurnstileWidget";
import TagsInput from "./TagsInput";
import { SOCIAL_PLATFORMS, type Socials } from "@/lib/socials";
import { prepareImage, ImagePrepError } from "@/lib/image-client";
import {
  ICON_MAX_SIDE,
  SCREENSHOT_MAX_SIDE,
  MAX_SCREENSHOTS,
  MAX_TOTAL_IMAGE_BYTES,
  formatBytes,
} from "@/lib/image-limits";

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
// action settles). Prepared images live in state for the same reason.
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

  // Images are prepared in the browser the moment they are picked: decoded,
  // downscaled, and re-encoded so the upload stays small. The prepared files
  // are attached on submit. The file inputs carry no name, so the originals
  // never travel to the server.
  const [icon, setIcon] = useState<File | null>(null);
  const [shots, setShots] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const iconSeq = useRef(0);
  const shotsSeq = useRef(0);

  const describe = (err: unknown) =>
    err instanceof ImagePrepError ? err.message : "We could not process that image.";

  const onIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const picked = input.files?.[0] ?? null;
    const seq = ++iconSeq.current;
    setFileError(null);
    if (!picked) {
      setIcon(null);
      return;
    }
    setPreparing((n) => n + 1);
    try {
      const prepared = await prepareImage(picked, { maxSide: ICON_MAX_SIDE, quality: 0.9, keepAlpha: true });
      if (seq === iconSeq.current) setIcon(prepared);
    } catch (err) {
      if (seq !== iconSeq.current) return;
      setIcon(null);
      input.value = "";
      setFileError(describe(err));
    } finally {
      setPreparing((n) => n - 1);
    }
  };

  const onShotsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const picked = Array.from(input.files ?? []);
    const seq = ++shotsSeq.current;
    setFileError(null);
    if (picked.length === 0) {
      setShots([]);
      return;
    }
    if (picked.length > MAX_SCREENSHOTS) {
      setShots([]);
      input.value = "";
      setFileError(`Choose up to ${MAX_SCREENSHOTS} screenshots.`);
      return;
    }
    setPreparing((n) => n + 1);
    try {
      // One at a time keeps peak memory low on phones.
      const prepared: File[] = [];
      for (const f of picked) {
        prepared.push(await prepareImage(f, { maxSide: SCREENSHOT_MAX_SIDE, quality: 0.85, keepAlpha: false }));
      }
      if (seq === shotsSeq.current) setShots(prepared);
    } catch (err) {
      if (seq !== shotsSeq.current) return;
      setShots([]);
      input.value = "";
      setFileError(describe(err));
    } finally {
      setPreparing((n) => n - 1);
    }
  };

  const shotsTotal = shots.reduce((sum, f) => sum + f.size, 0);

  // Client-side checks run in onSubmit: a prevented submit never reaches the
  // action, so React does not reset the form and the inputs keep their state.
  const guard = (e: React.FormEvent<HTMLFormElement>) => {
    if (preparing > 0) {
      e.preventDefault();
      setFileError("Your images are still being prepared. One moment.");
      return;
    }
    if (!icon && !initial?.hasIcon) {
      e.preventDefault();
      setFileError("Please add an icon or logo.");
      return;
    }
    const total = (icon?.size ?? 0) + shotsTotal;
    if (total > MAX_TOTAL_IMAGE_BYTES) {
      e.preventDefault();
      setFileError(
        `Your images add up to ${formatBytes(total)}. The limit is ${formatBytes(MAX_TOTAL_IMAGE_BYTES)} combined, so try fewer or smaller screenshots.`
      );
    }
  };

  const submit = (formData: FormData) => {
    if (icon) formData.set("icon", icon, icon.name);
    for (const shot of shots) formData.append("screenshots", shot, shot.name);
    formAction(formData);
  };

  return (
    <form action={submit} onSubmit={guard} className="space-y-6">
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
        <input id="icon" type="file" accept="image/*" required={!initial?.hasIcon && !icon}
          onChange={onIconChange} className={fileClass} />
        <p className="text-xs text-ink-muted mt-2">
          Square works best. Any image up to 10MB; we resize it to {ICON_MAX_SIDE} pixels.
        </p>
        {icon && (
          <p className="text-xs text-accent-green mt-2">Ready to upload, {formatBytes(icon.size)}.</p>
        )}
      </div>

      <div>
        <label htmlFor="screenshots" className={labelClass}>
          Screenshots (optional
          {initial && initial.screenshotCount > 0
            ? `, ${initial.screenshotCount} on file; choosing new ones replaces them`
            : ""}
          )
        </label>
        <input id="screenshots" type="file" multiple accept="image/*"
          onChange={onShotsChange} className={fileClass} />
        <p className="text-xs text-ink-muted mt-2">
          Up to {MAX_SCREENSHOTS} images, 10MB each. We shrink them to {SCREENSHOT_MAX_SIDE} pixels
          and compress them a little so pages load fast.
        </p>
        {shots.length > 0 && (
          <p className="text-xs text-accent-green mt-2">
            Ready to upload, {shots.length} {shots.length === 1 ? "image" : "images"}, {formatBytes(shotsTotal)} together.
          </p>
        )}
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
                type="text"
                inputMode="url"
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

      {fileError && <p className="text-sm text-red-400" role="alert">{fileError}</p>}
      {state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}

      <button type="submit" disabled={pending || preparing > 0}
        className="rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 px-6 py-3 text-sm font-semibold text-accent-purple disabled:opacity-50">
        {pending ? "Submitting..." : preparing > 0 ? "Preparing images..." : submitLabel}
      </button>
    </form>
  );
}
