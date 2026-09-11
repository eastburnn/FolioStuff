// Content Security Policy for every HTML response, built per request around a
// nonce. With 'strict-dynamic', only scripts that carry the nonce (Next.js's
// own and the analytics snippet in the layout) may run, plus anything those
// trusted scripts load themselves, such as Turnstile's widget. Host entries
// are fallbacks for older browsers and documentation of what we rely on.
//
// Adding a third party: add its hosts to THIRD_PARTIES below. Nothing else
// on the site needs to change. Keep CSP_MODE unset to rehearse a change in
// report-only mode; violations arrive at /api/csp-report and show up in the
// server logs.

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return "";
  }
})();

const THIRD_PARTIES = {
  analytics: {
    script: ["https://www.googletagmanager.com"],
    connect: [
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://www.googletagmanager.com",
    ],
    img: ["https://www.google-analytics.com", "https://www.googletagmanager.com"],
  },
  turnstile: {
    script: ["https://challenges.cloudflare.com"],
    connect: ["https://challenges.cloudflare.com"],
    frame: ["https://challenges.cloudflare.com"],
  },
  supabase: {
    connect: SUPABASE_HOST ? [`https://${SUPABASE_HOST}`, `wss://${SUPABASE_HOST}`] : [],
    img: SUPABASE_HOST ? [`https://${SUPABASE_HOST}`] : [],
  },
};

// Report-only until CSP_MODE=enforce is set; the header name follows.
export const CSP_ENFORCE = process.env.CSP_MODE === "enforce";
export const CSP_HEADER = CSP_ENFORCE ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

export function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const isPreview = process.env.VERCEL_ENV === "preview";
  const t = THIRD_PARTIES;

  const script = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...t.analytics.script, ...t.turnstile.script];
  const connect = ["'self'", ...t.supabase.connect, ...t.analytics.connect, ...t.turnstile.connect];
  const img = ["'self'", "data:", "blob:", ...t.supabase.img, ...t.analytics.img];
  const frame = [...t.turnstile.frame];

  if (!isProd) {
    // Development: hot reloading and source maps.
    script.push("'unsafe-eval'");
    connect.push("ws://localhost:*", "http://localhost:*");
  }
  if (isPreview) {
    // Vercel's preview toolbar on preview deployments only.
    script.push("https://vercel.live");
    connect.push("https://vercel.live", "wss://*.pusher.com");
    frame.push("https://vercel.live");
    img.push("https://vercel.live");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    // Inline style attributes come from server rendering; style injection is
    // not a script vector, and nonce-ing every style attribute is impractical.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.length ? frame.join(" ") : "'none'"}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Only meaningful when enforced; browsers log a notice if it appears in
    // a report-only policy. HSTS covers the upgrade in the meantime.
    ...(isProd && CSP_ENFORCE ? ["upgrade-insecure-requests"] : []),
    "report-uri /api/csp-report",
  ];
  return directives.join("; ");
}
