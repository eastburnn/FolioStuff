"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TurnstileWidget from "./TurnstileWidget";
import TagsInput from "./TagsInput";
import ShotOrderGrid from "./ShotOrderGrid";
import { SOCIAL_PLATFORMS, type Socials } from "@/lib/socials";
import { prepareImage, ImagePrepError } from "@/lib/image-client";
import {
  ICON_MAX_SIDE,
  SCREENSHOT_MAX_SIDE,
  MAX_SCREENSHOTS,
  MAX_TOTAL_IMAGE_BYTES,
  formatBytes,
} from "@/lib/image-limits";
import { TAGLINE_MAX, TAGLINE_MIN } from "@/lib/listing-limits";

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
  // Signed previews of what is on file, for the edit page.
  iconUrl: string | null;
  screenshots: { path: string; url: string }[];
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

// Counts screenshots whose shape is far enough from 16:10 that the preview
// card will visibly crop them.
async function countOffRatio(files: File[]): Promise<number> {
  let count = 0;
  for (const file of files) {
    try {
      const bitmap = await createImageBitmap(file);
      const ratio = bitmap.width / bitmap.height;
      bitmap.close();
      if (Math.abs(ratio - 1.6) / 1.6 > 0.12) count++;
    } catch {
      /* unmeasurable files are simply not counted */
    }
  }
  return count;
}

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
  // Screenshots already on file that the maker is keeping, in display order.
  const existing = initial?.screenshots ?? [];
  const [kept, setKept] = useState<string[]>(existing.map((s) => s.path));
  const [offRatio, setOffRatio] = useState(0);
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
    setOffRatio(0);
    if (picked.length === 0) {
      setShots([]);
      return;
    }
    if (picked.length > MAX_SCREENSHOTS - kept.length) {
      setShots([]);
      input.value = "";
      setFileError(
        kept.length > 0
          ? `You can have up to ${MAX_SCREENSHOTS} screenshots in total. Remove one above to add another.`
          : `Choose up to ${MAX_SCREENSHOTS} screenshots.`
      );
      return;
    }
    setPreparing((n) => n + 1);
    try {
      // One at a time keeps peak memory low on phones.
      const prepared: File[] = [];
      for (const f of picked) {
        prepared.push(await prepareImage(f, { maxSide: SCREENSHOT_MAX_SIDE, quality: 0.85, keepAlpha: false }));
      }
      if (seq === shotsSeq.current) {
        setShots(prepared);
        setOffRatio(await countOffRatio(prepared));
      }
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

  // Previews of the prepared screenshots, in the order they will be saved.
  const [shotUrls, setShotUrls] = useState<string[]>([]);
  useEffect(() => {
    const urls = shots.map((f) => URL.createObjectURL(f));
    setShotUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [shots]);
  // Kept screenshots are submitted as paths in display order; the server
  // applies an order-only change straight to the live page, while removing
  // or adding images goes through review.
  const reorder = <T,>(list: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };
  const moveKept = (from: number, to: number) => setKept((c) => reorder(c, from, to));
  const removeKept = (index: number) => setKept((c) => c.filter((_, i) => i !== index));
  const moveShot = (from: number, to: number) => setShots((c) => reorder(c, from, to));
  const removeShot = (index: number) => setShots((c) => c.filter((_, i) => i !== index));

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
        <label htmlFor="name" className={labelClass}>Site name</label>
        <input id="name" name="name" type="text" required minLength={2} maxLength={60}
          value={name} onChange={(e) => setName(e.target.value)}
          className={inputClass} placeholder="e.g. DivTracker" />
      </div>

      <div>
        <label htmlFor="url" className={labelClass}>Site URL</label>
        <input id="url" name="url" type="text" inputMode="url" required maxLength={300}
          value={url} onChange={(e) => setUrl(e.target.value)}
          className={inputClass} placeholder="yoursite.com" />
      </div>

      <div>
        <label htmlFor="tagline" className={labelClass}>Tagline</label>
        <textarea id="tagline" name="tagline" required minLength={TAGLINE_MIN} maxLength={TAGLINE_MAX} rows={2}
          value={tagline} onChange={(e) => setTagline(e.target.value)}
          className={inputClass} placeholder="What it does, in one or two sentences" />
        <p className="text-xs text-ink-muted mt-2">
          {TAGLINE_MIN} to {TAGLINE_MAX} characters. Shown under the name on cards and in search results, so
          keep it to one tight sentence.{" "}
          <span className={tagline.length > TAGLINE_MAX ? "text-red-400 font-medium" : undefined}>
            {tagline.length}/{TAGLINE_MAX}
          </span>
        </p>
        {tagline.length > TAGLINE_MAX && (
          <p className="text-xs text-accent-gold mt-1.5">
            Taglines are now limited to {TAGLINE_MAX} characters. Shorten this one before saving.
          </p>
        )}
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
        {icon ? (
          <p className="text-xs text-accent-green mt-2">Ready to upload, {formatBytes(icon.size)}.</p>
        ) : (
          initial?.iconUrl && (
            <div className="flex items-center gap-3 mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={initial.iconUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/[0.1]" />
              <p className="text-xs text-ink-muted">Current icon. Choose a file above to replace it.</p>
            </div>
          )
        )}
      </div>

      <div>
        <label htmlFor="screenshots" className={labelClass}>
          Screenshots (optional, up to {MAX_SCREENSHOTS})
        </label>
        {kept.length > 0 && (
          <div className="mb-3">
            {kept.map((path) => (
              <input key={path} type="hidden" name="keep_screenshots" value={path} />
            ))}
            <ShotOrderGrid
              items={kept.map((path) => ({ key: path, url: existing.find((s) => s.path === path)?.url ?? "" }))}
              onMove={moveKept}
              onRemove={removeKept}
            />
            <p className="text-xs text-ink-muted mt-2">
              Your screenshots on file. The first one leads your page. Drag one onto another to swap
              them, or use the arrows.{" "}
              <span className="text-ink-secondary">
                Changing only the order does not need a review: reorder, save, and your page updates
                right away.
              </span>{" "}
              Removing one with the X, or adding new ones, goes through review. Removed one by mistake?
              Leave this page without saving and it stays.
            </p>
          </div>
        )}
        {kept.length < MAX_SCREENSHOTS && (
          <>
            <input id="screenshots" type="file" multiple accept="image/*"
              onChange={onShotsChange} className={fileClass} />
            <p className="text-xs text-ink-muted mt-2">
              {kept.length > 0
                ? `Add up to ${MAX_SCREENSHOTS - kept.length} more, 10MB each.`
                : `Up to ${MAX_SCREENSHOTS} images, 10MB each.`}{" "}
              Preview cards use a 16:10 frame, so a 1600 by 1000 pixel screenshot (or any 16:10 size)
              shows best. Other shapes are cropped in the card; the full image opens on click. We
              shrink and lightly compress uploads so pages load fast.
            </p>
          </>
        )}
        {shots.length > 0 && shotUrls.length === shots.length && (
          <div className="mt-3">
            <ShotOrderGrid
              items={shots.map((f, i) => ({ key: `${f.name}-${f.size}-${i}`, url: shotUrls[i] }))}
              onMove={moveShot}
              onRemove={removeShot}
              offset={kept.length}
            />
            <p className="text-xs text-ink-muted mt-2">
              {kept.length > 0
                ? "New screenshots go after the ones you kept. "
                : "The first screenshot leads your page. "}
              Drag one onto another to swap them, or use the arrows, and the X drops one.
              {initial ? " New images go through review." : " You can change the order any time later without a review."}
            </p>
            <p className="text-xs text-accent-green mt-2">
              Ready to upload, {shots.length} {shots.length === 1 ? "image" : "images"}, {formatBytes(shotsTotal)} together.
            </p>
          </div>
        )}
        {offRatio > 0 && (
          <p className="text-xs text-accent-gold mt-1">
            {offRatio === 1 ? "One screenshot is" : `${offRatio} screenshots are`} not 16:10, so the preview
            card will crop {offRatio === 1 ? "it" : "them"}. The full image still opens on click.
          </p>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>Social links (optional)</legend>
        <p className="text-xs text-ink-muted mb-3">
          Accounts for the site itself. Your own links live on your maker profile.
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

      <p className="text-[11px] text-ink-muted leading-relaxed">
        By submitting you confirm you have the rights to everything included, that the site is
        yours to list, and that you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-ink-secondary">Terms of Service</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-secondary">Privacy Policy</Link>.
        Listings can be paused or removed at our discretion.
      </p>

      <button type="submit" disabled={pending || preparing > 0}
        className="rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 px-6 py-3 text-sm font-semibold text-accent-purple disabled:opacity-50">
        {pending ? "Submitting..." : preparing > 0 ? "Preparing images..." : submitLabel}
      </button>
    </form>
  );
}
