// Tagline length rules. The limit was lowered from 200 to 120 characters; the
// database still allows 200 so listings approved under the old limit keep
// their text until their maker next edits, at which point the form and the
// server both require the new limit.
export const TAGLINE_MIN = 10;
export const TAGLINE_MAX = 120;

// Cards show at most the current limit, cut at a word and marked with an
// ellipsis. Listing pages always show the full text.
export function clampTagline(text: string, max = TAGLINE_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const atWord = cut.lastIndexOf(" ");
  return `${(atWord > max * 0.6 ? cut.slice(0, atWord) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}
