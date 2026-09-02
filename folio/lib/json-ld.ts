// Serializes JSON-LD for inline <script> tags. JSON.stringify leaves "<" and
// ">" intact, so user content containing "</script>" would break out of the
// tag and execute. These unicode escapes are valid JSON and neutralize it.
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
